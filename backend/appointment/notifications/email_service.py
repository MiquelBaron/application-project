import logging
from concurrent.futures import ThreadPoolExecutor

import requests
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# Async in-process executor. For high scale, replace with a message queue worker.
_email_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="appointment-email")


def enqueue_appointment_confirmation_email(appointment):
    """Dispatch email send in background if client has an email configured."""
    if not getattr(settings, "APPOINTMENT_EMAILS_ENABLED", True):
        return False

    client = getattr(appointment, "client", None)
    if not client or not client.email:
        return False

    _email_executor.submit(send_appointment_confirmation_email, appointment.id)
    return True


def send_appointment_confirmation_email(appointment_id: int):
    from appointment.models import Appointment

    api_key = getattr(settings, "RESEND_API_KEY", "")
    if not api_key:
        logger.warning("RESEND_API_KEY missing; skipping appointment confirmation email")
        return False

    try:
        appointment = (
            Appointment.objects
            .select_related("client", "service", "staff_member__user")
            .get(id=appointment_id)
        )
    except Appointment.DoesNotExist:
        logger.warning("Appointment %s not found for confirmation email", appointment_id)
        return False

    if not appointment.client or not appointment.client.email:
        return False

    context = {
        "appointment": appointment,
        "client_full_name": f"{appointment.client.first_name} {appointment.client.last_name}".strip(),
        "staff_full_name": appointment.staff_member.user.get_full_name() if appointment.staff_member else "",
        "service_name": appointment.service.name if appointment.service else "",
        "duration": appointment.service.get_duration_readable() if appointment.service else "",
    }

    subject = f"Confirmación de cita - {context['service_name']}"
    html_content = render_to_string("mail/appointment_confirmation_email.html", context)
    text_content = render_to_string("mail/appointment_confirmation_email.txt", context)

    payload = {
        "from": getattr(settings, "APPOINTMENT_EMAIL_SENDER", "onboarding@resend.dev"),
        "to": [appointment.client.email],
        "subject": subject,
        "html": html_content,
        "text": text_content,
    }

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=10,
    )

    if response.status_code >= 400:
        logger.error(
            "Failed to send appointment confirmation email for appointment %s: %s",
            appointment_id,
            response.text,
        )
        return False

    return True
