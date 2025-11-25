# appointment/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from appointment.logger_config import get_logger
from appointment.notifications.tasks import send_appointment_notification

_logger = get_logger(__name__)

@receiver(post_save)
def notify_appointment(sender, instance, created, **kwargs):
    from appointment.models import Appointment

    if sender != Appointment or not created:
        return

    try:
        _logger.info(f"🎯 Signal: Nueva cita {instance.id}")

        send_appointment_notification(instance.id)

        _logger.info(f"✅ Notificación procesada para cita {instance.id}")

    except Exception as e:
        _logger.error(f"❌ Error en señal: {e}")