"""
api/availability/views.py
"""
from datetime import datetime
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from appointment.domain.appointments.availability import (
    get_available_slots_for_service,
    get_availability_for_service_across_staffs,
)
from appointment.models import StaffMember, Service


@login_required
def availability_for_staff(request, staff_id: int, service_id: int, day_str: str):
    if request.method != "GET":
        return JsonResponse({"error": "Method Not Allowed"}, status=405)

    try:
        day = datetime.strptime(day_str, "%Y-%m-%d").date()
    except ValueError:
        return HttpResponseBadRequest("Invalid date format")

    try:
        staff = StaffMember.objects.get(user__id=staff_id)
        service = Service.objects.get(id=service_id)
    except (StaffMember.DoesNotExist, Service.DoesNotExist):
        return JsonResponse({"error": "Staff or Service not found"}, status=404)

    slots = get_available_slots_for_service(staff, day, service)
    return JsonResponse({"slots": [s.isoformat(sep=" ") for s in slots]})


@login_required
def availability_for_service(request, service_name: str, day_str: str):
    if request.method != "GET":
        return JsonResponse({"error": "Method Not Allowed"}, status=405)

    try:
        day = datetime.strptime(day_str, "%Y-%m-%d").date()
    except ValueError:
        return HttpResponseBadRequest("Invalid date format")

    service = Service.get_service_by_name(service_name)
    if not service:
        return JsonResponse({"slots": {}})

    staffs = list(Service.objects.get(name=service_name).staffmember_set.all())
    slots_by_staff = get_availability_for_service_across_staffs(service, staffs, day)
    return JsonResponse({"slots": slots_by_staff})
