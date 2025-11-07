"""
Author: Miquel Barón
Since: 1.0.0
"""


from django.http import JsonResponse

# Importa tus modelos reales
from appointment.models import Appointment, WorkingHours, StaffMember, Service, Client
from django.db import transaction
from django.core.exceptions import ValidationError

from .availability import *
from appointment.core.date_time import combine_date_and_time
from appointment.logger_config import get_logger

_logger = get_logger(__name__)



def get_available_slots_for_service(staff: StaffMember, day: datetime.date, service,
                                    appointments_of_day: Optional[Iterable[Appointment]] = None) -> List[datetime]:
    base_slots = generate_base_slots_for_day(staff, day)
    if not base_slots:
        return []

    slot_td = timedelta(minutes=staff.get_slot_duration())
    if appointments_of_day is None:
        appointments_of_day = Appointment.objects.filter(staff_member=staff, date=day)

    occupied_slots = compute_occupied_slots_from_appointments(staff, day, base_slots, appointments_of_day)
    blocked_slots = compute_blocked_slots(staff, day, base_slots, slot_td)

    wh = WorkingHours.objects.filter(staff_member=staff, day_of_week=day.isoweekday()).first()
    working_end = to_dt(day, wh.end_time)

    valid_slots = filter_slots_for_service(base_slots, slot_td, service.duration, working_end, occupied_slots, blocked_slots)
    return valid_slots
from appointment.core.db_helpers import get_staffs_assigned_to_service



def get_availability_for_service_across_staffs(service_name: str, day: datetime.date) -> dict[str, List[str]]:
    from appointment.core.db_helpers import get_staffs_assigned_to_service
    from appointment.models import Service

    service = Service.get_service_by_name(service_name)
    if not service:
        return {}

    results: dict[str, List[str]] = {}
    for staff in get_staffs_assigned_to_service(service_name):
        appts = Appointment.objects.filter(staff_member=staff, date=day)
        slots = get_available_slots_for_service(staff, day, service, appointments_of_day=appts)
        results[staff.user.username] = [s.isoformat(sep=' ') for s in slots]

    return results


def validate_appointment_wont_overlap(staff:StaffMember, appt_date:date, appt_start:datetime, appt_end:datetime, exclude_appointment_id:Optional[int]=None):
    """
    To be called just before save the appointment to ensure it does not overlap to another appointment.

    :param staff:
    :param appt_date:
    :param appt_start:
    :param appt_end:
    :param exclude_appointment_id:
    :return:
    """

    qs = Appointment.objects.filter(staff_member=staff, date=appt_date)
    if exclude_appointment_id:
        qs = qs.exclude(pk=exclude_appointment_id)
    # Intersection of intervals
    overlaps = qs.filter(start_time__lt=appt_end.time(), end_time__gt=appt_start.time())
    if overlaps.exists():

        raise ValidationError("Requested appointment overlaps with an existing appointment for that staff.")


def create_appointment_safe(
    client: Client,
    service: Service,
    staff: StaffMember,
    appt_date: date,
    appt_start_time: time,
    appt_end_time: time,
    **extra_fields
):
    if Appointment.objects.filter(
            staff_member=staff,
            date=appt_date,
            start_time=appt_start_time
    ).exists():
        raise ValueError("Slot already taken")

    # TODO Test transaction
    with transaction.atomic():
        appt_start_dt = combine_date_and_time(appt_date, appt_start_time)
        appt_end_dt = combine_date_and_time(appt_date, appt_end_time)

        # Block staff rows during the transaction
        Appointment.objects.filter(
            staff_member=staff, date=appt_date
        ).select_for_update()

        validate_appointment_wont_overlap(staff, appt_date, appt_start_dt, appt_end_dt)
        appt = Appointment.objects.create(
            client=client,
            service=service,
            staff_member=staff,
            date=appt_date,
            start_time=appt_start_time,
            end_time=appt_end_time,
            **extra_fields
        )
    return appt