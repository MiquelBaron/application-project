# appointment/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

from appointment.core.db_helpers import WorkingHours
from appointment.logger_config import get_logger
from appointment.models import Appointment
from appointment.notifications.tasks import send_appointment_notification

_logger = get_logger(__name__)

@receiver(post_save, sender=Appointment)
def notify_appointment(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        _logger.info(f"🎯 Signal: Nueva cita {instance.id}")
        send_appointment_notification(instance.id)
        _logger.info(f"✅ Notificación procesada para cita {instance.id}")
    except Exception as e:
        _logger.error(f"❌ Error en señal: {e}")


@receiver(post_save, sender=WorkingHours)
def set_boolean_working_hours_true(sender, instance, created, **kwargs):
    print("Working hours signal")
    if not created:
        print("Not created")
        return
    if not instance.staff_member:
        print("Not staff")
        return
    staff = instance.staff_member
    print(staff)
    staff.set_timetable = True
    staff.save()