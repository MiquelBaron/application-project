
from django.core.exceptions import ValidationError
from django.forms import model_to_dict

from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.utils.dateparse import parse_date

from appointment.core.db_helpers import get_staffs_assigned_to_service
from appointment.models import Appointment, StaffMember, Service, Client
from appointment.core.api_helpers import create_appointment_safe, get_availability_for_service_across_staffs
from datetime import datetime
#Login
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
import json


@login_required
def list_appointments(request):
    """
    GET/appointments/
    POST/appointments/
    Admin --> can see all appointments
    Staff --> can only see his own appointments
    """
    user = request.user
    if request.method == 'GET':
        if user.is_superuser or user.groups.filter(name="Admins").exists():
            appointments = Appointment.objects.all()
            print("Admin appointments")
        else:
            appointments = Appointment.objects.filter(staff_member__user=request.user)
            print("Staff appointments")
            print(request.user)
        print(appointments)

        data = [
            {
                "id": a.id,
                "client": f"{a.client.first_name} {a.client.last_name}",
                "service": a.service.name,
                "date": str(a.date),
                "start_time": str(a.start_time),
                "end_time": str(a.end_time),
                "staff": a.staff_member.user.get_full_name(),
            }
            for a in appointments
        ]
        return JsonResponse({'appointments': data})

    if request.method == 'POST':
        print("POST data received:", request.body)

        if not user.has_perm('appointment.add_appointment'):
            return HttpResponseForbidden()

        try:
            data = json.loads(request.body)
            print("Parsed JSON data:", data)

            staff = StaffMember.objects.get(user__id=data['staff_id'])
            print("Staff found:", staff)

            service = Service.objects.get(id=data['service_id'])
            print("Service found:", service, "duration:", service.duration)

            client = Client.objects.get(id=data['client_id'])
            print("Client found:", client)

            appt_date = datetime.strptime(data['date'], "%Y-%m-%d").date()
            print("Appointment date:", appt_date)

            appt_start = datetime.strptime(data['start_time'], "%H:%M").time()
            print("Appointment start time:", appt_start)

            start_dt = datetime.combine(appt_date, appt_start)
            end_dt = start_dt + service.duration
            appt_end = end_dt.time()
            print("Computed appointment end time:", appt_end)

            # Llamada al método seguro
            appt = create_appointment_safe(
                client=client,
                staff=staff,
                service=service,
                appt_date=appt_date,
                appt_start_time=appt_start,
                appt_end_time=appt_end,
                additional_info=data.get('additional_info', '')
            )
            print("Appointment created successfully:", appt.id)

            return JsonResponse({'success': True, 'appointment_id': appt.id})

        except (KeyError, ValueError, Client.DoesNotExist, StaffMember.DoesNotExist, Service.DoesNotExist) as e:
            print("Exception caught:", e)
            return HttpResponseBadRequest(str(e))
        except ValidationError as ve:
            print("ValidationError:", ve)
            return JsonResponse({'success': False, 'error': ve.message})


@login_required
def appointment_detail(request, appointment_id):
    """
    GET /api/appointments/<id>/
    DELETE /api/appointments/<id>/
    PUT /api/appointments/<id>/
    """
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return HttpResponseBadRequest("Appointment not found")

    user = request.user
    is_admin = user.is_superuser or user.groups.filter(name="Admins").exists()
    is_owner = appointment.staff_member.user == user

    if not (is_admin or is_owner):
        return HttpResponseForbidden("You do not have permission")

    if request.method == 'GET':
        data = {
            "id": appointment.id,
            "client": f"{appointment.client.first_name} {appointment.client.last_name}",
            "service": appointment.service.id,
            "date": str(appointment.date),
            "start_time": str(appointment.start_time),
            "end_time": str(appointment.end_time),
            "staff": appointment.staff_member.user.get_full_name(),
            "additional_info": appointment.additional_info,
        }
        if user.has_perm("appointment.can_view_sensitive_info"):
            data["price"] = appointment.service.get_price()
        return JsonResponse(data)

    elif request.method == 'DELETE':
        if not is_admin:
            return HttpResponseForbidden("Only admins can delete appointments")
        appointment.delete()
        return JsonResponse({"success": True, "message": "Appointment deleted"})

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            if is_admin:
                if "client_id" in data:
                    client = Client.objects.get(id=data["client_id"])
                    appointment.client = client

            if "date" in data:
                appointment.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            if "start_time" in data:
                appointment.start_time = datetime.strptime(data["start_time"], "%H:%M").time()
            if "end_time" in data:
                appointment.end_time = datetime.strptime(data["end_time"], "%H:%M").time()
            if "additional_info" in data:
                appointment.additional_info = data["additional_info"]

            from appointment.core.api_helpers import validate_appointment_wont_overlap
            appt_start_dt = datetime.combine(appointment.date, appointment.start_time)
            appt_end_dt = datetime.combine(appointment.date, appointment.end_time)

            validate_appointment_wont_overlap(
                staff=appointment.staff_member,
                appt_date=appointment.date,
                appt_start=appt_start_dt,
                appt_end=appt_end_dt,
                exclude_appointment_id=appointment.id
            )

            appointment.save()
            return JsonResponse({"success": True, "appointment_id": appointment.id})

        except (KeyError, ValueError, Client.DoesNotExist, StaffMember.DoesNotExist, Service.DoesNotExist) as e:
            return HttpResponseBadRequest(str(e))
        except ValidationError as ve:
            return JsonResponse({'success': False, 'error': ve.message})
    else:
        return JsonResponse({'error': 'Method Not Allowed'}, status=405)



@login_required
def availability(request, service_name, date_str):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method Not Allowed'}, status=405)
    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return HttpResponseBadRequest("Invalid date format")

    slots = get_availability_for_service_across_staffs(service_name, day)
    return JsonResponse({'slots': slots})



from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from django.http import HttpResponse
from datetime import datetime
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML
from datetime import datetime
import os

@login_required
def export_medical_history(request, patient_id):
    patient = get_object_or_404(Client, id=patient_id)
    record = getattr(patient, "medical_record", None)

    logo_url = request.build_absolute_uri("/static/img/logo_clinic.png")
     #Cnstruye la url absoluta de la imagen para poder encontrarla al generar el pdf.
    doctor_signature_url = request.build_absolute_uri("/static/img/signature.png")
    doctor_name = "Miquel Barón"

    html = render_to_string("reports/medical_report.html", {
        "patient": patient,
        "record": record,
        "generated": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "logo_url": logo_url,
        "doctor_signature_url": doctor_signature_url,
        "doctor_name": doctor_name
    }) # Sustituye las variables por los valores reales y genera el html completo.

    pdf = HTML(string=html, base_url=request.build_absolute_uri()).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f"attachment; filename=medical_history_{patient_id}.pdf"
    return response

@login_required
def get_staffs_by_service(request, service_id:int):
    print("Recieved request", service_id)
    if request.method != 'GET':
        return HttpResponseBadRequest()
    print("get staffs by service", service_id)
    staffs = get_staffs_assigned_to_service(service_id)
    result = []
    for staff in staffs:
        result.append(
            {"name":staff.user.first_name + " " + staff.user.last_name,
             "id":staff.user.id
             })

    return JsonResponse(result, safe=False)


from appointment.core.api_helpers import get_available_slots_for_service
@login_required
def availability_for_staff(request, staff_id, service_id, day_str):
    """
    Devuelve los slots disponibles para un staff y servicio en un día específico.
    day_str = 'YYYY-MM-DD'
    """
    from datetime import datetime

    staff = StaffMember.objects.get(user__id=staff_id)
    service = Service.objects.get(id=service_id)
    day = datetime.strptime(day_str, "%Y-%m-%d").date()

    appointments = Appointment.objects.filter(staff_member=staff, date=day)
    slots = get_available_slots_for_service(staff, day, service, appointments_of_day=appointments)

    # Devolver como ISO strings
    slot_strings = [s.isoformat(sep=" ") for s in slots]
    return JsonResponse({"slots": slot_strings})

def get_session(request):
    user = request.user
    return JsonResponse({
        "user_id": user.id,
        "username": user.username,
        "group": user.groups.first().name if user.groups.exists() else None,
        "is_superuser": user.is_superuser,
        "staff_info": getattr(user, "staff_info", None),
    })


@login_required
def appointments_interval(request, start_date, end_date):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    start_date_str = start_date
    end_date_str = end_date

    if not start_date_str or not end_date_str:
        return HttpResponseBadRequest("start_date and end_date are required")

    start_date = parse_date(start_date_str)
    end_date = parse_date(end_date_str)

    if not start_date or not end_date:
        return HttpResponseBadRequest("Invalid date format (YYYY-MM-DD)")

    appointments_count = (
        Appointment.objects
        .filter(date__range=(start_date, end_date))
        .select_related("client", "staff_member", "service")
        .order_by("date", "start_time")
    ).count()



    return JsonResponse({"week_appointments": appointments_count})
from django.utils.timezone import localdate

@login_required
def appointments_today(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    today = localdate()

    count = Appointment.objects.filter(date=today).count()

    return JsonResponse({"appointments_today": count})


@login_required
def clients_count(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    clients_counter = Client.objects.count()
    print(clients_counter)
    return JsonResponse({"count": clients_counter})


from django.utils.timezone import now

@login_required
def appointments_recent(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    # Obtener la fecha/hora actual
    current_time = now()

    # Filtrar solo appointments que sean en el futuro o ahora, ordenar por fecha ascendente y tomar los 5 primeros
    upcoming_appointments = (
        Appointment.objects
        .filter(date__gte=current_time)
        .order_by('date')[:5]
    )

    # Serializar los datos en un formato simple
    data = []
    for appt in upcoming_appointments:
        data.append({
            "id": appt.id,
            "customer": appt.client.first_name if hasattr(appt.client, 'first_name') else str(appt.client),
            "service": appt.service.name,
            "date": str(appt.date.isoformat()),
            "duration": appt.service.get_duration_readable(),
            "start_time": str(appt.start_time),
            "staff": appt.staff_member.user.first_name + appt.staff_member.user.last_name,
        })

    return JsonResponse({"recent_appointments": data})




















