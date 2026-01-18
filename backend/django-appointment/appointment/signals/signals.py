# appointments/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from appointment.logger_config import get_logger
from appointment.models import Appointment, WorkingHours
from appointment.notifications.tasks import send_appointment_notification

_logger = get_logger(__name__)

@receiver(post_save, sender=Appointment)
def notify_appointment(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        _logger.info(f"🎯 Signal: New appointments {instance.id}")
        send_appointment_notification(instance, "appointments.created")
        _logger.info(f"✅ Notificación procesada para cita {instance.id}")
    except Exception as e:
        _logger.error(f"❌ Error en señal: {e}")

@receiver(post_delete, sender=Appointment)
def notify_appointment(sender, instance,**kwargs):
    try:
        _logger.info(f"🎯 Signal: Appointment deleted {instance.id}")
        send_appointment_notification(instance, "appointments.deleted")
        _logger.info(f"✅ Notificación procesada para la eliminacion de la cita {instance.id}")
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