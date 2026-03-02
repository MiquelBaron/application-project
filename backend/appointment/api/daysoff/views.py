# appointment/api/views/day_off_views.py
import json
from datetime import datetime
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden
from appointment.models import StaffMember
from appointment.domain.daysoff.service import (
    get_days_off_by_staff,
    create_day_off,
    get_all_days_off_for_user,
    serialize_day_off,
)
import logging

logger = logging.getLogger(__name__)

def manage_days_off(request, staff_id):
    if request.method == "GET":
        days_off = get_days_off_by_staff(staff_id)
        result = [serialize_day_off(day) for day in days_off]
        return JsonResponse(result, safe=False, status=200)

    elif request.method == "POST":
        if not request.user.has_perm("appointment.add_dayoff"):
            return HttpResponseForbidden()

        try:
            staff_member = StaffMember.objects.get(id=staff_id)
            data = json.loads(request.body)

            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            description = data["description"]

            day_off = create_day_off(staff_member, start_date, end_date, description)
            return JsonResponse(serialize_day_off(day_off), status=201)

        except Exception as e:
            logger.exception(f"Error creating day off: {str(e)}")
            return HttpResponseBadRequest("Error creating day off")

    else:
        return HttpResponseBadRequest("Method not allowed")


def get_days_off(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Method not allowed")

    try:
        days = get_all_days_off_for_user(request.user)
        result = [serialize_day_off(day) for day in days]
        return JsonResponse(result, safe=False, status=200)
    except Exception as e:
        logger.exception(f"Error fetching days off: {str(e)}")
        return HttpResponseBadRequest("Error fetching days off")
