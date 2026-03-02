import logging

from django.conf import settings

from appointment.notifications.tasks_email import send_appointment_confirmation_email_task

logger = logging.getLogger(__name__)


def enqueue_appointment_confirmation_email(appointment):
    """Queue confirmation email with Celery (RabbitMQ broker) if client has email."""
    if not getattr(settings, "APPOINTMENT_EMAILS_ENABLED", True):
        return False

    client = getattr(appointment, "client", None)
    if not client or not client.email:
        return False

    send_appointment_confirmation_email_task.delay(appointment.id)
    return True
