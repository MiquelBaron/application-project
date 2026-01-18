"""
domain/appointments/service.py
"""
# domain/appointments/service.py

from datetime import datetime

from django.contrib.auth.decorators import permission_required
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils.timezone import now

from appointment.models import (
    Appointment,
    StaffMember,
    Service,
    Client,
)
from appointment.domain.appointments.validators import validate_appointment_wont_overlap
from datetime import date, time, datetime
from django.db import transaction

from appointment.models import Appointment, Client, Service, StaffMember
from appointment.domain.appointments.validators import validate_appointment_wont_overlap
from appointment.domain.appointments.utils import combine_date_and_time

def list_appointments_for_user(user):
    if user.is_superuser or user.groups.filter(name="Admins").exists():
        qs = Appointment.objects.all()
    else:
        qs = Appointment.objects.filter(staff_member__user=user)

    return [
        {
            "id": a.id,
            "client": f"{a.client.first_name} {a.client.last_name}",
            "service": a.service.name,
            "date": str(a.date),
            "start_time": str(a.start_time),
            "end_time": str(a.end_time),
            "staff": a.staff_member.user.get_full_name(),
        }
        for a in qs
    ]


def create_appointment(*, payload: dict, created_by) -> Appointment:
    try:
        staff = StaffMember.objects.get(user__id=payload["staff_id"])
        service = Service.objects.get(id=payload["service_id"])
        client = Client.objects.get(id=payload["client_id"])

        appt_date = datetime.strptime(payload["date"], "%Y-%m-%d").date()
        appt_start = datetime.strptime(payload["start_time"], "%H:%M").time()

        start_dt = datetime.combine(appt_date, appt_start)
        appt_end = (start_dt + service.duration).time()

        appointment = create_appointment_safe(
            client=client,
            service=service,
            staff=staff,
            appt_date=appt_date,
            appt_start_time=appt_start,
            appt_end_time=appt_end,
            additional_info=payload.get("additional_info", ""),
        )

        return appointment

    except Exception as e:
        raise ValueError(str(e))



def get_appointment_detail(appointment_id, user):
    appointment = Appointment.objects.get(id=appointment_id)

    is_admin = user.is_superuser or user.groups.filter(name="Admins").exists()
    is_owner = appointment.staff_member.user == user

    if not (is_admin or is_owner):
        raise PermissionError("Not allowed")

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

    return data


def update_appointment(appointment_id, payload, user):
    appointment = Appointment.objects.get(id=appointment_id)

    is_admin = user.is_superuser or user.groups.filter(name="Admins").exists()
    is_owner = appointment.staff_member.user == user

    if not (is_admin or is_owner):
        raise PermissionError("Not allowed")

    if is_admin and "client_id" in payload:
        appointment.client = Client.objects.get(id=payload["client_id"])

    if "date" in payload:
        appointment.date = datetime.strptime(payload["date"], "%Y-%m-%d").date()
    if "start_time" in payload:
        appointment.start_time = datetime.strptime(payload["start_time"], "%H:%M").time()
    if "end_time" in payload:
        appointment.end_time = datetime.strptime(payload["end_time"], "%H:%M").time()
    if "additional_info" in payload:
        appointment.additional_info = payload["additional_info"]

    validate_appointment_wont_overlap(
        staff=appointment.staff_member,
        appt_date=appointment.date,
        appt_start=datetime.combine(appointment.date, appointment.start_time),
        appt_end=datetime.combine(appointment.date, appointment.end_time),
        exclude_appointment_id=appointment.id,
    )

    appointment.save()

def delete_appointment(appointment_id, user):
    if not user.is_superuser and not user.has_perm("appointment.delete_appointment"):
        raise PermissionError("Only admins can delete appointments")
    Appointment.objects.filter(id=appointment_id).delete()

def count_appointments_between(start_date, end_date):
    return Appointment.objects.filter(
        date__range=(start_date, end_date)
    ).count()


def count_appointments_on_date(day):
    return Appointment.objects.filter(date=day).count()


def get_recent_appointments(limit=5):
    qs = Appointment.objects.filter(date__gte=now()).order_by("date")[:limit]

    return [
        {
            "id": a.id,
            "customer": a.client.first_name,
            "service": a.service.name,
            "date": a.date.isoformat(),
            "duration": a.service.get_duration_readable(),
            "start_time": str(a.start_time),
            "staff": f"{a.staff_member.user.first_name} {a.staff_member.user.last_name}",
        }
        for a in qs
    ]

def create_appointment_safe(
    *,
    client: Client,
    service: Service,
    staff: StaffMember,
    appt_date: date,
    appt_start_time: time,
    appt_end_time: time,
    **extra_fields
):
    """
    Crea una cita garantizando:
    - No solapamiento
    - Seguridad en concurrencia
    - Transacción atómica
    """

    if Appointment.objects.filter(
        staff_member=staff,
        date=appt_date,
        start_time=appt_start_time,
    ).exists():
        raise ValueError("Slot already taken")

    with transaction.atomic():
        appt_start_dt = combine_date_and_time(appt_date, appt_start_time)
        appt_end_dt = combine_date_and_time(appt_date, appt_end_time)

        # Lock de filas existentes del staff ese día
        Appointment.objects.filter(
            staff_member=staff,
            date=appt_date,
        ).select_for_update()

        validate_appointment_wont_overlap(
            staff=staff,
            appt_date=appt_date,
            appt_start=appt_start_dt,
            appt_end=appt_end_dt,
        )

        appointment = Appointment.objects.create(
            client=client,
            service=service,
            staff_member=staff,
            date=appt_date,
            start_time=appt_start_time,
            end_time=appt_end_time,
            **extra_fields,
        )

    return appointment
