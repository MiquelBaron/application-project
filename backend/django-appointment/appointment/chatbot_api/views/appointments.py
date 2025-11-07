"""
Author: Miquel Barón
Since: 1.0.0
"""

from appointment.logger_config import get_logger
from django.views.decorators.csrf import csrf_exempt


_logger = get_logger(__name__)


'''
Create an appointment.
First validate availability.
Then create an appointment request and appointment instances.
'''

# API VIEWS
import json
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from appointment.core.date_time import combine_date_and_time, convert_str_to_date, convert_str_to_time
from appointment.models import Client, Service, Appointment
from appointment.core.db_helpers import get_staffs_assigned_to_service
from appointment.core.api_helpers import get_available_slots_for_service, create_appointment_safe, validate_appointment_wont_overlap
from appointment.core.decorators import require_api_key
from appointment.logger_config import get_logger
from django.shortcuts import get_object_or_404

_logger = get_logger(__name__)

# -------------------------------------------------------------------
# AUXILIARIES
# -------------------------------------------------------------------
def _find_available_staff(service_name, date, service):
    staffs = get_staffs_assigned_to_service(service_name)
    for s in staffs:
        slots = get_available_slots_for_service(s, date, service)
        # combinamos date + start_time
        for dt in slots:
            if dt.date() == date:
                return s
    return None

def _create_appointment(client, service, staff, date, start_time):
    start_dt = combine_date_and_time(date, start_time)
    end_dt = start_dt + service.duration
    end_time = end_dt.time()
    return create_appointment_safe(client, service, staff, date, start_time, end_time)

def _update_appointment(old_appt, new_date, new_start_time, service):
    new_start_dt = combine_date_and_time(new_date, new_start_time)
    new_end_dt = new_start_dt + service.duration
    new_end_time = new_end_dt.time()

    # Buscar staff disponible
    chosen_staff = _find_available_staff(service.name, new_date, service)
    if not chosen_staff:
        raise ValueError("No staff available for the new date/time")

    with transaction.atomic():
        old_appt.date = new_date
        old_appt.start_time = new_start_time
        old_appt.end_time = new_end_time
        old_appt.staff_member = chosen_staff
        old_appt.service = service
        validate_appointment_wont_overlap(chosen_staff, new_date, new_start_dt, new_end_dt, exclude_appointment_id=old_appt.id)
        old_appt.save()

    return old_appt, chosen_staff

# -------------------------------------------------------------------
# CREATE / UPDATE ENDPOINT
# -------------------------------------------------------------------
@csrf_exempt
@require_api_key
def appointment(request):
    """
    POST: create a new appointment
    PUT: update an existing appointment
    """

    if request.method not in ['POST', 'PUT']:
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Invalid request body"}, status=400)

    client_phone = data.get('client_phone')
    service_name = data.get('service_name')
    date_str = data.get('date') or data.get('new_date')
    start_str = data.get('start_time') or data.get('new_start_time')

    if not all([client_phone, service_name, date_str, start_str]):
        return JsonResponse({"error": "Missing required parameters"}, status=400)

    client = get_object_or_404(Client, phone_number=client_phone)
    service = get_object_or_404(Service, name__iexact=service_name)
    date = convert_str_to_date(date_str)
    start_time = convert_str_to_time(start_str)

    if request.method == 'POST':
        # CREATION
        staff = _find_available_staff(service_name, date, service)
        if not staff:
            return JsonResponse({"error": "No staff available for this date/time"}, status=404)
        try:
            appt = _create_appointment(client, service, staff, date, start_time)
        except ValueError as e:
            return JsonResponse({"error booking appointment" : str(e)}, status=400)

        return JsonResponse({
            "status": "ok",
            "appointment_id": appt.id,
            "staff": staff.user.username,
            "message": "Appointment created successfully"
        })

    elif request.method == 'PUT':
        # UPDATE
        old_date_str = data.get('old_date')
        old_start_time_str = data.get('old_start_time')
        if not all([old_date_str, old_start_time_str]):
            return JsonResponse({"error": "Missing old_date or old_start_time for update"}, status=400)

        old_date = convert_str_to_date(old_date_str)
        old_start_time = convert_str_to_time(old_start_time_str)

        try:
            old_appt = Appointment.objects.get(client=client, date=old_date, start_time=old_start_time)
        except Appointment.DoesNotExist:
            return JsonResponse({"error": "Original appointment not found"}, status=404)

        try:
            updated_appt, chosen_staff = _update_appointment(old_appt, date, start_time, service)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

        return JsonResponse({
            "status": "ok",
            "appointment_id": updated_appt.id,
            "staff": chosen_staff.user.username,
            "message": "Appointment updated successfully"
        })


from django.utils.dateparse import parse_time


@csrf_exempt
@require_api_key
def delete_appointment(request, date:str, start_time:str, client_phone:str):
    _logger.debug("Received delete appointment request.")
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    date_str = date
    start_time_str = start_time

    if not client_phone or not date_str or not start_time_str:
        return JsonResponse({"error": "Must provide client_phone, date, start_time, and end_time"}, status=400)

    try:
        client = Client.objects.get(phone_number=client_phone)
    except Client.DoesNotExist:
        return JsonResponse({"error": "Client not found"}, status=404)
    try:
        date = convert_str_to_date(date_str)
        start_time = parse_time(start_time_str)
    except Exception as e:
        return JsonResponse({"error": f"Invalid date/time format: {e}"}, status=400)
    try:
        Appointment.objects.filter(date=date, client=client, start_time=start_time).delete()
    except Exception as e:
        return JsonResponse({"error":"There was an error deleting the Appointment"}, status=400)
    return JsonResponse({"message": "Appointment deleted successfully"}, status=200)
