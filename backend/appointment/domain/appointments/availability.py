"""
domain/appointments/availability.py
"""

from datetime import datetime, timedelta, date
from typing import List, Iterable, Optional, Set
from math import ceil
from appointment.models import StaffMember, Appointment, WorkingHours, DayOff

_logger = print  # para simplicidad, puedes poner logging real

def ceil_div(a: int, b: int) -> int:
    return (a + b - 1) // b

def get_availability_for_service_across_staffs(service, staffs: List[StaffMember], day: date) -> dict[str, List[str]]:
    """
    Devuelve slots disponibles de todos los staffs para un servicio en un día.
    """
    results: dict[str, List[str]] = {}
    for staff in staffs:
        appts = Appointment.objects.filter(staff_member=staff, date=day)
        slots = get_available_slots_for_service(staff, day, service, appointments_of_day=appts)
        results[staff.user.username] = [s.isoformat(sep=' ') for s in slots]
    return results


def get_available_slots_for_service(staff: StaffMember, day: date, service,
                                    appointments_of_day: Optional[Iterable[Appointment]] = None) -> List[datetime]:
    """
    Devuelve los slots válidos para un staff y un servicio.
    """
    base_slots = generate_base_slots_for_day(staff, day)
    if not base_slots:
        return []

    slot_td = timedelta(minutes=staff.get_slot_duration())
    if appointments_of_day is None:
        appointments_of_day = Appointment.objects.filter(staff_member=staff, date=day)

    occupied_slots = compute_occupied_slots_from_appointments(staff, day, base_slots, appointments_of_day)
    blocked_slots = compute_blocked_slots(staff, day, base_slots, slot_td)

    wh = WorkingHours.objects.filter(staff_member=staff, day_of_week=day.weekday()).first()
    if not wh:
        return []
    working_end = datetime.combine(day, wh.end_time)

    valid_slots = filter_slots_for_service(base_slots, slot_td, service.duration, working_end, occupied_slots, blocked_slots)

    # Bloquear slots pasados si es hoy
    now = datetime.now()
    if day == now.date():
        valid_slots = [s for s in valid_slots if s > now]

    return valid_slots


def generate_base_slots_for_day(staff: StaffMember, day: date) -> List[datetime]:
    wh = WorkingHours.objects.filter(staff_member=staff, day_of_week=day.weekday()).first()
    if not wh:
        _logger(f"No working hours for {staff.user.username} on {day}")
        return []

    if day in staff.get_days_off():
        return []

    slot_td = timedelta(minutes=staff.get_slot_duration())
    start_dt = datetime.combine(day, wh.start_time)
    end_dt = datetime.combine(day, wh.end_time)

    slots: List[datetime] = []
    cur = start_dt
    while cur < end_dt:
        slots.append(cur)
        cur += slot_td
    return slots


def compute_occupied_slots_from_appointments(staff: StaffMember, day: date, all_slots: Iterable[datetime],
                                             appointments_qs: Optional[Iterable[Appointment]] = None) -> Set[datetime]:
    slot_td = timedelta(minutes=staff.get_slot_duration())
    slots_set = set(all_slots)
    if appointments_qs is None:
        appointments_qs = Appointment.objects.filter(staff_member=staff, date=day)

    occupied: Set[datetime] = set()
    for appt in appointments_qs:
        a_start = datetime.combine(appt.date, appt.start_time)
        a_end = datetime.combine(appt.date, appt.end_time or (appt.start_time + appt.service.duration))
        for s in slots_set:
            if s < a_end and s + slot_td > a_start:
                occupied.add(s)
    return occupied


def compute_blocked_slots(staff: StaffMember, day: date, all_slots: Iterable[datetime], slot_td: timedelta) -> Set[datetime]:
    blocked: Set[datetime] = set()

    # Día libre
    if DayOff.objects.filter(staff_member=staff, start_date__lte=day, end_date__gte=day).exists():
        return set(all_slots)

    # Buffer de hoy
    buffer_min = staff.get_appointment_buffer_time()
    if buffer_min and buffer_min > 0 and day == datetime.today().date():
        cutoff = datetime.now() + timedelta(minutes=buffer_min)
        for s in all_slots:
            if s < cutoff:
                blocked.add(s)

    return blocked


def filter_slots_for_service(free_slots: List[datetime], slot_td: timedelta, service_duration: timedelta,
                             working_end: datetime, occupied_slots: Set[datetime], blocked_slots: Set[datetime]) -> List[datetime]:
    valid: List[datetime] = []
    n_slots_needed = ceil_div(int(service_duration.total_seconds()), int(slot_td.total_seconds()))

    for s in free_slots:
        service_slots = [s + j * slot_td for j in range(n_slots_needed)]
        if all(sl < working_end and sl not in occupied_slots and sl not in blocked_slots for sl in service_slots):
            valid.append(s)

    return valid
