"""
api/appointments/views.py
"""
# api/appointments/views.py

import json
from datetime import datetime
from appointment.models import Appointment, Client
from django.http import (
    JsonResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
)
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_date
from django.utils.timezone import localdate, now

from appointment.domain.appointments import services as appointment_services
from appointment.notifications.tasks import send_appointment_notification


@login_required
def list_appointments(request):
    user = request.user

    if request.method == "GET":
        appointments = appointment_services.list_appointments_for_user(user)
        return JsonResponse({"appointments": appointments})

    if request.method == "POST":
        if not user.has_perm("appointment.add_appointment"):
            return HttpResponseForbidden()

        try:
            payload = json.loads(request.body)
            appointment = appointment_services.create_appointment(
                payload=payload,
                created_by=user,
            )
            send_appointment_notification(appointment, "appointment.created")
            return JsonResponse({"success": True, "appointment_id": appointment.id})

        except ValueError as e:
            return HttpResponseBadRequest(str(e))

    return HttpResponseBadRequest("Method not allowed")



@login_required
def appointment_detail(request, appointment_id):
    user = request.user

    try:
        if request.method == "GET":
            data = appointment_services.get_appointment_detail(
                appointment_id, user
            )
            return JsonResponse(data)

        if request.method == "PUT":
            payload = json.loads(request.body)
            appointment_services.update_appointment(
                appointment_id, payload, user
            )
            return JsonResponse({"success": True})

        if request.method == "DELETE":
            appointment_services.delete_appointment(
                appointment_id, user
            )
            #send_appointment_notification(appointment_id, "appointment.deleted")
            return JsonResponse({"success": True})

    except PermissionError as e:
        return HttpResponseForbidden(str(e))
    except ValueError as e:
        return HttpResponseBadRequest(str(e))

    return HttpResponseBadRequest("Method not allowed")


@login_required
def appointments_interval(request, start_date, end_date):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    start = parse_date(start_date)
    end = parse_date(end_date)

    if not start or not end:
        return HttpResponseBadRequest("Invalid date format")

    count = appointment_services.count_appointments_between(start, end)
    return JsonResponse({"week_appointments": count})


@login_required
def appointments_today(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    count = appointment_services.count_appointments_on_date(localdate())
    return JsonResponse({"appointments_today": count})


@login_required
def appointments_recent(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")

    data = appointment_services.get_recent_appointments(limit=5)
    return JsonResponse({"recent_appointments": data})


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