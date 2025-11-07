# views/auth.py
from typing import cast

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseBadRequest
import json

from appointment.models import StaffMember, User


@csrf_exempt
def login_user(request):
    """
    POST /api/login/
    Body: {"username": "email_or_username", "password": "pwd"}
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON")

    username = data.get("username")
    password = data.get("password")
    print(username,password)
    if not username or not password:
        return HttpResponseBadRequest("Username and password are required")
    user = authenticate(request, username=username, password=password)
    print(user)
    if user is None:
        return JsonResponse({"success": False, "error": "Invalid credentials"}, status=401)

    user = cast(User, user)
    login(request, user)

    group_name = user.groups.first().name if user.groups.exists() else "SuperUser"

    staff_info = None
    staff = StaffMember.objects.filter(user=user).first()
    if staff:
        staff_info = {
            "group": group_name,
            "staff_id": staff.id,
            "slot_duration": staff.slot_duration,
            "services": [s.name for s in staff.services_offered.all()],
        }
    else:
        staff_info = None

    response_data = {
        "user_id": user.id,
        "full_name": f"{user.first_name} {user.last_name}".strip() or user.username,
        "group": group_name,
        "is_superuser": user.is_superuser,
        "staff_info": staff_info,
    }

    return JsonResponse(response_data)


@login_required
def logout_user(request):
    logout(request)
    return JsonResponse({"success": True})
