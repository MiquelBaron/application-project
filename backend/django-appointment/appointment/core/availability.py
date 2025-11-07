"""
Author: Miquel Barón
Since: 1.0.0
"""


from datetime import datetime, date, time, timedelta

from typing import List, Set, Iterable, Optional

from appointment.models import Appointment, WorkingHours, DayOff, StaffMember
from appointment.logger_config import get_logger
_logger = get_logger(__name__)

def ceil_div(a: int, b: int) -> int:
    return -(-a // b)

def to_dt(d: datetime.date, t: datetime.time) -> datetime:
    return datetime.combine(d, t)

def generate_base_slots_for_day(staff: StaffMember, day: datetime.date) -> List[datetime]:
    working_hours = WorkingHours.objects.filter(staff_member=staff, day_of_week=day.isoweekday()).first()
    if not working_hours:
        _logger.warning(f"No working hours for staff {staff.user.username} on day {day}")
        return []

    slot_td = timedelta(minutes=staff.get_slot_duration())
    start_dt = to_dt(day, working_hours.start_time)
    end_dt = to_dt(day, working_hours.end_time)

    slots: List[datetime] = []
    cur = start_dt
    while cur < end_dt:
        slots.append(cur)
        cur += slot_td
    return slots




def _slot_intersects_interval(slot_start:datetime, slot_td:timedelta, interval_start: datetime, interval_end: datetime) -> bool:
    # Auxiliar method to check if a slot is between an interval of time (appointment start and end time)
    return (slot_start < interval_end) and (slot_start + slot_td > interval_start)

from appointment.core.date_time import combine_date_and_time

def compute_occupied_slots_from_appointments(staff: StaffMember, day: datetime.date, all_slots: Iterable[datetime],
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

def compute_blocked_slots(staff: StaffMember, day: datetime.date, all_slots: Iterable[datetime], slot_td: timedelta) -> Set[datetime]:
    blocked: Set[datetime] = set()

    # Bloqueo por día libre
    if DayOff.objects.filter(staff_member=staff, start_date__lte=day, end_date__gte=day).exists():
        return set(all_slots)

    # Bloqueo por buffer (solo hoy)
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
        # Construimos los sub-slots necesarios
        service_slots = [s + j * slot_td for j in range(n_slots_needed)]
        if all(sl < working_end and sl not in occupied_slots and sl not in blocked_slots for sl in service_slots):
            valid.append(s)

    return valid




