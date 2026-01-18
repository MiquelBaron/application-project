from typing import Optional

from django.core.exceptions  import ValidationError

from appointment.models import StaffMember, Appointment
from datetime import date, datetime

"""
domain/appointments/validators.py
"""

def validate_appointment_wont_overlap(staff:StaffMember, appt_date:date, appt_start:datetime, appt_end:datetime, exclude_appointment_id:Optional[int]=None):
    """
    To be called just before save the appointments to ensure it does not overlap to another appointments.

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

        raise ValidationError("Requested appointments overlaps with an existing appointments for that staff.")