from datetime import date, time, timedelta

import pytest

from appointment.models import Appointment, Client, Service, StaffMember, User
from appointment.notifications import email_service


@pytest.mark.django_db
def test_enqueue_confirmation_email_only_if_client_has_email(monkeypatch):
    user = User.objects.create_user(username="staff1")
    staff = StaffMember.objects.create(user=user)
    service = Service.objects.create(
        name="Consulta",
        duration=timedelta(minutes=30),
        price=10,
        currency="EUR",
    )

    client_no_email = Client.objects.create(
        first_name="Ana",
        last_name="SinCorreo",
        phone_number="+34111111111",
        email="",
    )

    appointment = Appointment.objects.create(
        client=client_no_email,
        service=service,
        staff_member=staff,
        date=date.today(),
        start_time=time(9, 0),
        end_time=time(9, 30),
    )

    submitted = []

    def fake_submit(*args, **kwargs):
        submitted.append((args, kwargs))

    monkeypatch.setattr(email_service, "_email_executor", type("Exec", (), {"submit": fake_submit})())

    assert email_service.enqueue_appointment_confirmation_email(appointment) is False
    assert submitted == []


@pytest.mark.django_db
@pytest.mark.parametrize("enabled", [True, False])
def test_enqueue_confirmation_email_respects_settings(monkeypatch, settings, enabled):
    settings.APPOINTMENT_EMAILS_ENABLED = enabled

    user = User.objects.create_user(username="staff2")
    staff = StaffMember.objects.create(user=user)
    service = Service.objects.create(
        name="Control",
        duration=timedelta(minutes=45),
        price=20,
        currency="EUR",
    )
    client = Client.objects.create(
        first_name="Luis",
        last_name="Correo",
        phone_number="+34222222222",
        email="luis@example.com",
    )
    appointment = Appointment.objects.create(
        client=client,
        service=service,
        staff_member=staff,
        date=date.today(),
        start_time=time(11, 0),
        end_time=time(11, 45),
    )

    submitted = []

    class Exec:
        def submit(self, *args, **kwargs):
            submitted.append((args, kwargs))

    monkeypatch.setattr(email_service, "_email_executor", Exec())

    result = email_service.enqueue_appointment_confirmation_email(appointment)
    assert result is enabled
    assert len(submitted) == (1 if enabled else 0)


@pytest.mark.django_db
def test_send_confirmation_email_calls_resend(monkeypatch, settings):
    settings.RESEND_API_KEY = "test-key"
    settings.APPOINTMENT_EMAIL_SENDER = "onboarding@resend.dev"

    user = User.objects.create_user(username="staff3", first_name="Dr", last_name="Who")
    staff = StaffMember.objects.create(user=user)
    service = Service.objects.create(
        name="Odontología",
        duration=timedelta(minutes=60),
        price=30,
        currency="EUR",
    )
    client = Client.objects.create(
        first_name="Maria",
        last_name="Gomez",
        phone_number="+34333333333",
        email="maria@example.com",
    )
    appointment = Appointment.objects.create(
        client=client,
        service=service,
        staff_member=staff,
        date=date.today(),
        start_time=time(12, 0),
        end_time=time(13, 0),
        additional_info="Traer estudios previos",
    )

    captured = {}

    class Response:
        status_code = 200
        text = "ok"

    def fake_post(url, headers, json, timeout):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return Response()

    monkeypatch.setattr(email_service.requests, "post", fake_post)

    assert email_service.send_appointment_confirmation_email(appointment.id) is True
    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["json"]["to"] == ["maria@example.com"]
    assert "Odontología" in captured["json"]["subject"]
