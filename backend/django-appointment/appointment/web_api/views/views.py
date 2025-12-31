from django.core.exceptions import ValidationError
from django.db import transaction
from django.forms import model_to_dict

from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest, HttpResponseServerError
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt

from appointment.core.db_helpers import get_staffs_assigned_to_service
from appointment.models import Appointment, StaffMember, Service, Client, WorkingHours, DayOff
from appointment.core.api_helpers import create_appointment_safe, get_availability_for_service_across_staffs
from datetime import datetime
#Login
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, permission_required
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

@csrf_exempt
def client_by_id(request,client_id):
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return JsonResponse({"error": "Client not found"}, status=404)

    if request.method == "GET":

        data = {
            "id": client.id,
            "gender": client.gender,
            "address": client.address,
            "date_of_birth": client.date_of_birth,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "phone_number": str(client.phone_number),
            "extra_info": client.extra_info,
            "created_at": client.created_at.isoformat(),
            "updated_at": client.updated_at.isoformat(),
        }
        return JsonResponse({"client": data})

    if request.method == "PUT":
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

            # Update fields if present in request
        client.first_name = body.get("first_name", client.first_name)
        client.last_name = body.get("last_name", client.last_name)
        client.email = body.get("email", client.email)
        client.phone_number = body.get("phone_number", client.phone_number)
        client.address = body.get("address", client.address)
        client.gender = body.get("gender", client.gender)
        date_of_birth = body.get("date_of_birth", client.date_of_birth)
        if isinstance(date_of_birth, str):
            try:
                date_of_birth = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
            except ValueError:
                date_of_birth = None
        client.date_of_birth = date_of_birth
        client.extra_info = body.get("extra_info", client.extra_info)
        client.source = body.get("source", client.source)

        client.save()

        # Return updated client
        data = {
            "id": client.id,
            "gender": client.gender,
            "address": client.address,
            "date_of_birth": client.date_of_birth,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "phone_number": str(client.phone_number),
            "extra_info": client.extra_info,
            "source": client.source,
            "created_at": client.created_at.isoformat(),
            "updated_at": client.updated_at.isoformat(),
        }
        return JsonResponse({"client": data})
    if request.method == "DELETE":
        if not request.user.has_perm('appointment.delete_client'):
            return JsonResponse({"error": "Permission denied"}, status=403)
        client = Client.objects.get(id=client.id)
        if not client: return HttpResponseBadRequest("Client not found")
        client.delete()
        return JsonResponse({"success": "200"})
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


from appointment.models import User
import traceback
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
@login_required
def new_staff(request):
    if request.method == "GET":
        try:
            logger.info("Fetching all staff members")

            staffs = StaffMember.objects.all().select_related('user').prefetch_related('services_offered')
            results = []
            for staff in staffs:
                set_timetable = WorkingHours.objects.filter(staff_member=staff).exists()
                staff_data = {
                    "id": staff.id,
                    "user_id": staff.user.id,
                    "user_username": staff.user.username,
                    "user_email": staff.user.email,
                    "user_first_name": staff.user.first_name,
                    "user_last_name": staff.user.last_name,
                    "services_offered": [{"id": s.id, "name": s.name} for s in staff.services_offered.all()],
                    "slot_duration": staff.slot_duration,
                    "lead_time": staff.lead_time.isoformat() if staff.lead_time else None,
                    "finish_time": staff.finish_time.isoformat() if staff.finish_time else None,
                    "work_on_saturday": staff.work_on_saturday,
                    "work_on_sunday": staff.work_on_sunday,
                    "set_timetable": set_timetable,
                    "created_at": staff.created_at.isoformat(),
                }
                results.append(staff_data)
                logger.debug(f"Staff fetched: {staff_data['user_username']} (ID: {staff_data['id']})")

            return JsonResponse({"results": results}, status=200)

        except Exception as e:
            logger.exception("Error fetching staff members")
            return JsonResponse({"error": str(e)}, status=500)

    if request.method == "POST":
        if not request.user.has_perm("appointment.add_user"):
            return HttpResponseForbidden("Permission denied")
        try:
            data = json.loads(request.body)
            print(data)
        except json.JSONDecodeError:
            print("Invalid JSON received:", request.body)
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        print("Received data for new staff (password hidden):", {k: v for k, v in data.items() if k != "password"})

        # ------------------ REQUIRED FIELDS ------------------
        required_user_fields = ["username", "email", "password"]
        missing_fields = [f for f in required_user_fields if f not in data]
        if missing_fields:
            print("Missing required fields:", missing_fields)
            return JsonResponse({"error": f"Missing required fields: {', '.join(missing_fields)}"}, status=400)

        try:
            with transaction.atomic():
                # ------------------ CREATE USER ------------------
                print("Creating user...")
                user = User.objects.create_user(
                    username=data["username"],
                    email=data["email"],
                    password=data["password"],
                    first_name=data.get("user_first_name", ""),
                    last_name=data.get("user_last_name", ""),
                )

                user.groups.add(Group.objects.get(name="Staff"))
                print(f"User created successfully: id={user.id}, username={user.username}")

                # ------------------ CREATE STAFF ------------------
                print("Creating staff member...")
                staff = StaffMember.objects.create(
                    user=user,
                    slot_duration=data.get("slot_duration", 30),
                    lead_time=data.get("lead_time"),
                    finish_time=data.get("finish_time"),
                    appointment_buffer_time=data.get("appointment_buffer_time"),
                    work_on_saturday=data.get("work_on_saturday", False),
                    work_on_sunday=data.get("work_on_sunday", False),
                    set_timetable=data.get("set_timetable", False),
                )
                print(f"Staff member created successfully: id={staff.id}")

                # ------------------ ASSIGN SERVICES ------------------
                services_ids = data.get("services_offered", [])
                if services_ids:
                    print(f"Assigning services: {services_ids}")
                    if not all(isinstance(sid, int) for sid in services_ids):
                        print("Error: services_offered must be a list of integers")
                        return JsonResponse({"error": "services_offered must be a list of integers"}, status=400)

                    services = Service.objects.filter(id__in=services_ids)
                    staff.services_offered.set(services)
                    staff.save()
                    print(f"Assigned {services.count()} services to staff id={staff.id}")

                return JsonResponse(
                    {
                        "message": "Staff member created successfully",
                        "staff_id": staff.id,
                        "user_id": user.id,
                    },
                    status=201
                )

        except Exception as e:
            print("Error creating staff:", str(e))
            if settings.DEBUG:
                traceback.print_exc()
            return JsonResponse(
                {"error": str(e)},
                status=500
            )

    else:
        print("MAL")
        return HttpResponseBadRequest(status=400)




@login_required
def set_working_hours(request, staff_id):
    staff_member = StaffMember.objects.get(id=staff_id)
    print(staff_member)
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Opcional: borrar horarios anteriores
            WorkingHours.objects.filter(staff_member=staff_member).delete()

            working_hours = []
            for item in data:
                print("Current item working hours:", item)
                working_hours.append(
                    WorkingHours(
                        staff_member=staff_member,
                        day_of_week=item["day_of_week"],
                        start_time=item["start_time"],
                        end_time=item["end_time"],
                    )
                )
            # Create multiple database objects in one operation
            WorkingHours.objects.bulk_create(working_hours)
            staff_member.set_timetable = True

            return JsonResponse({"status": "success"}, status=201)

        except StaffMember.DoesNotExist:
            logger.error(f"Staff member with id {staff_id} does not exist")
            return HttpResponseBadRequest("Staff member does not exist")

        except (KeyError, ValueError, json.JSONDecodeError) as e:
            logger.exception("Invalid payload")
            return HttpResponseBadRequest("Invalid data")

        except Exception as e:
            logger.exception("Error setting working hours")
            return HttpResponseServerError("Internal server error")
    elif request.method == "GET":
        print("GET")
        working_hours = WorkingHours.objects.filter(staff_member=staff_member)

        result = []
        for wh in working_hours:
            result.append({
                "day_of_week": wh.day_of_week,
                "start_time": wh.start_time.strftime("%H:%M"),
                "end_time": wh.end_time.strftime("%H:%M"),
            })

        return JsonResponse({"working_hours": result}, status=200)



@login_required
@permission_required("appointment.delete_staffmember", raise_exception=True)
def get_staff_detail(request, staff_id):
    if request.method == "GET":
        pass

    if request.method == "DELETE":
        staff_member = StaffMember.objects.get(id=staff_id)
        if not staff_member:
            return HttpResponseBadRequest("Staff member does not exist")
        staff_member.delete()
        return JsonResponse({"status": "success"}, status=200)



def manage_days_off(request, staff_id):
    if request.method == "GET":
        days_off = DayOff.objects.filter(staff_member=staff_id)
        result = []
        print(staff_id)
        print(days_off)
        for day in days_off:
            result.append({"start_date": day.start_date,
                           "end_date": day.end_date,
                           "description": day.description})
        return JsonResponse(result,safe=False, status=200)

    if request.method == "POST":
        if not request.user.has_perm("appointment.add_dayoff"):
            return HttpResponseForbidden()
        try:
            staff_member = StaffMember.objects.get(id=staff_id)
            data = json.loads(request.body)
            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            description = data["description"]

            day_off = DayOff.objects.create(
                staff_member=staff_member,
                start_date=start_date,
                end_date=end_date,
                description=description,
            )
            return JsonResponse({
                "id": day_off.id,
                "start_date": str(day_off.start_date),
                "end_date": str(day_off.end_date),
                "description": day_off.description,
            }, status=201)
        except Exception as e:
            logger.exception(f"Error creating days off: {str(e)}")
            return HttpResponseBadRequest("Error creating days off")


def get_days_off(request):
    result = []
    if request.method == "GET":
        if request.user.groups.filter(name="Admins").exists():
            days = DayOff.objects.filter(start_date__gte=datetime.today())
        else:
            print(request.user)
            staff = StaffMember.objects.get(user=request.user)
            days = DayOff.objects.filter(start_date__gte=datetime.today(), staff_member=staff)

        for day in days:
            result.append({
                "staff_member_id": day.staff_member_id,
                "user_first_name":day.staff_member.user.first_name,
                "user_last_name": day.staff_member.user.last_name,
                "start_date": day.start_date,
                "end_date": day.end_date,
                "description": day.description,
            })
        print(result)
        return JsonResponse(result, safe=False, status=200)
    else:
        return HttpResponseBadRequest("Method not allowed")




from django.http import JsonResponse

@login_required
@permission_required("appointment.can_link_service_staff", raise_exception=True)
def set_staff_services(request, staff_id):
    if request.method == "POST":
        data = json.loads(request.body)
        try:
            staff_member = StaffMember.objects.get(id=staff_id)
            staff_member.services_offered.set(data)
            return JsonResponse({"status": "ok"})
        except StaffMember.DoesNotExist:
            return JsonResponse({"error": "Staff member not found"}, status=404)











