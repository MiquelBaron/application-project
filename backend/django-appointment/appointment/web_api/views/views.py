
from django.core.exceptions import ValidationError

from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest
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
        if user.is_superuser or user.groups.filter(name="Admin").exists():
            appointments = Appointment.objects.all()
        else:
            appointments = Appointment.objects.filter(staff_member__user=request.user)

        data = [
            {
                "id": a.id,
                "client": f"{a.client.first_name} {a.client.last_name}",
                "service": a.service.name,
                "date": str(a.date),
                "start_time": str(a.start_time),
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