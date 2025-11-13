
from django.core.exceptions import ValidationError
from django.forms import model_to_dict

from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest

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
    :param request:
    :return:
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
        if not user.has_perm('appointment.add_appointment'):
            return HttpResponseForbidden()
        try:
            data = json.loads(request.body)
            staff = StaffMember.objects.get(id=data['staff_id'])
            service = Service.objects.get(id=data['service_id'])
            client = Client.objects.get(id=data['client_id'])
            appt_date = datetime.strptime(data['date'], "%Y-%m-%d").date()
            appt_start = datetime.strptime(data['start_time'], "%H:%M").time()
            appt_end = datetime.strptime(data['end_time'], "%H:%M").time()

            appt = create_appointment_safe(
                client=client,
                staff=staff,
                service=service,
                appt_date=appt_date,
                appt_start_time=appt_start,
                appt_end_time=appt_end,
                additional_info=data.get('additional_info', '')
            )
            return JsonResponse({'success': True, 'appointment_id': appt.id})

        except (KeyError, ValueError, Client.DoesNotExist, StaffMember.DoesNotExist, Service.DoesNotExist) as e:
            return HttpResponseBadRequest(str(e))
        except ValidationError as ve:
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

@login_required
def export_medical_history(request, patient_id):
    try:
        patient = Client.objects.get(id=patient_id)
    except Client.DoesNotExist:
        return HttpResponse("Patient not found.", status=404)

    record = getattr(patient, "medical_record", None)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="medical_history_{patient_id}.pdf"'

    doc = SimpleDocTemplate(response, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Medical History Report", styles['Title']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Datos del paciente
    patient_data = [
        ["Full Name", patient.get_full_name()],
        ["Email", patient.email or "N/A"],
        ["Phone", patient.phone_number or "N/A"],
        ["Date of Birth", patient.date_of_birth.strftime("%d/%m/%Y") if patient.date_of_birth else "N/A"],
        ["Gender", patient.get_gender_display() if patient.gender else "N/A"],
        ["Address", patient.address or "N/A"],
    ]
    elements.append(Paragraph("Patient Information", styles['Heading2']))
    table = Table(patient_data, hAlign='LEFT', colWidths=[120, 300])
    table.setStyle([('BACKGROUND', (0,0), (-1,0), colors.grey),
                    ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
                    ('GRID', (0,0), (-1,-1), 1, colors.black)])
    elements.append(table)
    elements.append(Spacer(1, 12))

    # Historial médico
    elements.append(Paragraph("Medical Record", styles['Heading2']))
    record_data = [
        ["Blood Type", record.blood_type or "N/A"] if record else ["Blood Type", "N/A"],
        ["Allergies", record.allergies or "N/A"] if record else ["Allergies", "N/A"],
        ["Medical Conditions", record.medical_conditions or "N/A"] if record else ["Medical Conditions", "N/A"],
        ["Medications", record.medications or "N/A"] if record else ["Medications", "N/A"],
        ["Notes", record.notes or "N/A"] if record else ["Notes", "N/A"],
    ]
    table2 = Table(record_data, hAlign='LEFT', colWidths=[120, 300])
    table2.setStyle([('GRID', (0,0), (-1,-1), 1, colors.black)])
    elements.append(table2)

    doc.build(elements)
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
