# api/staff/views.py
from django.http import  HttpResponseForbidden,HttpResponseBadRequest,JsonResponse
from appointment.domain.staff.service import create_staff_with_user_and_services, serialize_staff_member_list
from appointment.models import StaffMember
import json
from django.contrib.auth.decorators import login_required, permission_required
from appointment.domain.staff.service import (
    list_staff_members,
    create_staff,
    get_staff_by_id,
    delete_staff,
    list_days_off,
    create_day_off,
    set_working_hours_for_staff,
    get_staffs_by_service,
    set_services_for_staff,
    get_all_staffs
)


@login_required
def new_staff(request):
    if request.method == "GET":
        return JsonResponse({"results": list_staff_members()}, status=200)

    elif request.method == "POST":
        if not request.user.has_perm("appointment.add_user"):
            return HttpResponseForbidden("Permission denied")
        try:
            data = json.loads(request.body)
            staff = create_staff(data)
            return JsonResponse({"message": "Staff member created", "staff_id": staff.id, "user_id": staff.user.id}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return HttpResponseBadRequest("Method not allowed")


@login_required
@permission_required("appointment.delete_staffmember", raise_exception=True)
def staff_detail(request, staff_id: int):
    staff = get_staff_by_id(staff_id)
    if not staff:
        return JsonResponse({"error": "Staff not found"}, status=404)
    if request.method == "GET":
        return JsonResponse({"staff": staff}, status=200)
    if request.method == "DELETE":
        delete_staff(staff)
        return JsonResponse({"status": "success"}, status=200)

    return HttpResponseBadRequest("Method not allowed")


@login_required
def days_off(request, staff_id: int = None):
    if request.method == "GET":
        admin_view = request.user.groups.filter(name="Admins").exists()
        staff_member = None
        if not admin_view and staff_id is None:
            from appointment.models import StaffMember
            staff_member = StaffMember.objects.get(user=request.user)
        return JsonResponse(list_days_off(staff_member, admin_view), safe=False)

    elif request.method == "POST":
        if not request.user.has_perm("appointments.add_dayoff"):
            return HttpResponseForbidden()
        from datetime import datetime
        from appointment.models import StaffMember

        staff_member = get_staff_by_id(staff_id)
        if not staff_member:
            return JsonResponse({"error": "Staff not found"}, status=404)

        try:
            data = json.loads(request.body)
            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            description = data["description"]
            day_off = create_day_off(staff_member, start_date, end_date, description)
            return JsonResponse({
                "id": day_off.id,
                "start_date": str(day_off.start_date),
                "end_date": str(day_off.end_date),
                "description": day_off.description
            }, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return HttpResponseBadRequest("Method not allowed")


@login_required
def set_working_hours(request, staff_id: int):
    if request.method == "POST":
        try:
            from appointment.models import StaffMember
            staff_member = get_staff_by_id(staff_id)
            if not staff_member:
                return JsonResponse({"error": "Staff not found"}, status=404)

            data = json.loads(request.body)
            set_working_hours_for_staff(staff_member, data)
            return JsonResponse({"status": "success"}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    elif request.method == "GET":
        from appointment.models import WorkingHours
        staff_member = get_staff_by_id(staff_id)
        if not staff_member:
            return JsonResponse({"error": "Staff not found"}, status=404)
        hours = WorkingHours.objects.filter(staff_member=staff_member)
        result = [{"day_of_week": h.day_of_week, "start_time": h.start_time.strftime("%H:%M"), "end_time": h.end_time.strftime("%H:%M")} for h in hours]
        return JsonResponse({"working_hours": result})

    elif request.method == "PUT":
        pass
    return HttpResponseBadRequest("Method not allowed")


@login_required
def staffs_by_service(request, service_id: int):
    if request.method != "GET":
        return HttpResponseBadRequest()
    return JsonResponse(get_staffs_by_service(service_id), safe=False)


@login_required
@permission_required("appointment.can_link_service_staff", raise_exception=True)
def set_staff_services_view(request, staff_id: int):
    if request.method != "POST":
        return HttpResponseBadRequest()
    try:
        data = json.loads(request.body)
        staff_member = get_staff_by_id(staff_id)
        if not staff_member:
            return JsonResponse({"error": "Staff not found"}, status=404)
        set_services_for_staff(staff_member, data)
        return JsonResponse({"status": "ok"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@login_required
@permission_required('appointment.view_staffmember', raise_exception=True)
def staffs_list(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method Not Allowed'}, status=405)
    return JsonResponse({'staffs': get_all_staffs()})

@login_required
@permission_required('appointment.add_staffmember', raise_exception=True)
def create_staff_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method Not Allowed'}, status=405)
    try:
        payload = json.loads(request.body)
        user_data = payload.get("user")
        staff_data = payload.get("staff", {})
        services = payload.get("services_offered", [])
        working_hours = payload.get("working_hours", [])
        staff = create_staff_with_user_and_services(user_data, staff_data, services, working_hours)
        return JsonResponse(serialize_staff_member_list(staff), status=201)
    except Exception as e:
        return HttpResponseBadRequest(str(e))

@login_required
@permission_required('appointment.view_staffmember', raise_exception=True)
def list_staffs_view(request):
    if request.method != 'GET':
        return JsonResponse({'error':'Method Not Allowed'}, status=405)
    staffs = StaffMember.objects.all()
    return JsonResponse({"results":[serialize_staff_member_list(s) for s in staffs]})


