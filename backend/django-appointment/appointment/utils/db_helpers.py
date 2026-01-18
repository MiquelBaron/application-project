"""
Database helpers for appointments
Author: Adams Pierre David
Since: 2.0.0
"""

import datetime
import logging
from typing import Optional

from django.apps import apps
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import timezone

from appointment.utils import date_time

_logger = logging.getLogger(__name__)

# Models
Appointment = apps.get_model('appointment', 'Appointment')
WorkingHours = apps.get_model('appointment', 'WorkingHours')
DayOff = apps.get_model('appointment', 'DayOff')
StaffMember = apps.get_model('appointment', 'StaffMember')
Config = apps.get_model('appointment', 'Config')
Service = apps.get_model('appointment', 'Service')
Client = apps.get_model('appointment', 'Client')


# ------------------- STAFF / WORKING HOURS -------------------

def is_working_day(staff_member: StaffMember, day: int) -> bool:
    """Check if the given day is a working day for the staff member."""
    working_days = list(
        WorkingHours.objects.filter(staff_member=staff_member).values_list('day_of_week', flat=True)
    )
    return day in working_days


def get_working_hours_for_staff_and_day(staff_member, day_of_week: int) -> Optional[dict]:
    """Return start and end time for a staff member on a given day."""
    working_hours = WorkingHours.objects.filter(staff_member=staff_member, day_of_week=day_of_week).first()
    if not working_hours:
        return {
            'start_time': staff_member.get_lead_time(),
            'end_time': staff_member.get_finish_time()
        }
    return {'start_time': working_hours.start_time, 'end_time': working_hours.end_time}


def get_staff_member_start_time(staff_member: StaffMember, date: datetime.date) -> Optional[datetime.time]:
    weekday_num = date_time.get_weekday_num(date.strftime("%A"))
    return get_working_hours_for_staff_and_day(staff_member, weekday_num)['start_time']


def get_staff_member_end_time(staff_member: StaffMember, date: datetime.date) -> Optional[datetime.time]:
    weekday_num = date_time.get_weekday_num(date.strftime("%A"))
    return get_working_hours_for_staff_and_day(staff_member, weekday_num)['end_time']


def get_staff_member_slot_duration(staff_member: StaffMember, date: datetime.date) -> int:
    config = get_config()
    default_duration = getattr(config, 'slot_duration', 30)
    return staff_member.slot_duration or default_duration


def get_staff_member_buffer_time(staff_member: StaffMember, date: datetime.date) -> int:
    config = get_config()
    default_buffer = getattr(config, 'appointment_buffer_time', 15)
    return staff_member.appointment_buffer_time or default_buffer


# ------------------- SLOTS / APPOINTMENTS -------------------

def calculate_slots(start_time: datetime.datetime, end_time: datetime.datetime,
                    buffer_time: datetime.datetime, slot_duration: datetime.timedelta):
    """Calculate available slots between start and end time considering buffer and slot duration."""
    slots = []
    while start_time + slot_duration <= end_time:
        if start_time >= buffer_time:
            slots.append(start_time)
        start_time += slot_duration
    return slots


def calculate_staff_slots(date: datetime.date, staff_member: StaffMember):
    """Calculate available slots for a staff member on a given date."""
    weekday_num = date_time.get_weekday_num(date.strftime("%A"))
    if not is_working_day(staff_member, weekday_num):
        return []

    start_time = datetime.datetime.combine(date, get_staff_member_start_time(staff_member, date))
    end_time = datetime.datetime.combine(date, get_staff_member_end_time(staff_member, date))
    buffer_time = start_time + datetime.timedelta(minutes=get_staff_member_buffer_time(staff_member, date))
    slot_duration = datetime.timedelta(minutes=get_staff_member_slot_duration(staff_member, date))

    # Exclude booked slots
    appointments = Appointment.objects.filter(staff_member=staff_member, date=date)
    slots = calculate_slots(start_time, end_time, buffer_time, slot_duration)
    return exclude_booked_slots(appointments, slots, slot_duration)


def exclude_booked_slots(appointments, slots, slot_duration):
    """Return available slots after removing booked appointments."""
    available = []
    for slot_start in slots:
        slot_end = slot_start + slot_duration
        if all(slot_start >= appt.end_time or slot_end <= appt.start_time for appt in appointments):
            available.append(slot_start)
    return available


# ------------------- CONFIG -------------------

def get_config():
    """Return Config from cache or database."""
    config = cache.get('config')
    if not config:
        config = Config.objects.first()
        cache.set('config', config, 3600)
    return config


# ------------------- DAYS OFF -------------------

def check_day_off_for_staff(staff_member, date: datetime.date) -> bool:
    """Check if staff member has a day off on a specific date."""
    return DayOff.objects.filter(
        staff_member=staff_member,
        start_date__lte=date,
        end_date__gte=date
    ).exists()


def day_off_exists_for_date_range(staff_member, start_date, end_date, days_off_id=None) -> bool:
    """Check if day off exists for a staff member within a date range."""
    days_off = DayOff.objects.filter(staff_member=staff_member, start_date__lte=end_date, end_date__gte=start_date)
    if days_off_id:
        days_off = days_off.exclude(id=days_off_id)
    return days_off.exists()


# ------------------- SERVICES / STAFF -------------------

def get_staffs_assigned_to_service(service: str | int):
    """Return all staff assigned to a given service by name or id."""
    if isinstance(service, int):
        service = Service.objects.get(id=service)
    elif isinstance(service, str):
        service = get_object_or_404(Service, name__iexact=service)
    return getattr(service, 'assigned_staff', [])


# ------------------- USERS -------------------

def get_user_by_email(email: str):
    """Return User instance by email or None."""
    from django.contrib.auth import get_user_model
    UserModel = get_user_model()
    return UserModel.objects.filter(email=email).first()
