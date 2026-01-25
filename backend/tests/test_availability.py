import pytest
import random
from datetime import datetime, timedelta, time, date

from django.contrib.auth.models import User
from appointment.models import StaffMember, Service, WorkingHours, Appointment, Client
from appointment.domain.appointments.availability import get_availability_for_service_across_staffs


@pytest.mark.django_db
def test_extreme_staff_service_availability():
    """
    Test extremo: varios staffs, varios servicios, horarios distintos y solapados,
    citas ocupadas con solapamiento, comprobación de disponibilidad de todos los slots.
    """
    random.seed(42)  # reproducibilidad

    # Crear 5 staffs con usuarios
    users = [User.objects.create(username=f"user{i}") for i in range(5)]
    staffs = [StaffMember.objects.create(user=u, slot_duration=random.choice([15, 30, 60])) for u in users]

    # Crear 3 servicios de diferentes duraciones
    services = [
        Service.objects.create(name=f"Service{i}", duration=timedelta(minutes=dur), price=50 + i*10, currency="EUR", allow_rescheduling=True)
        for i, dur in enumerate([30, 45, 60])
    ]

    # Asignar servicios aleatorios a los staffs
    for staff in staffs:
        staff.services_offered.add(*random.sample(services, k=random.randint(1, len(services))))

    # Crear horarios de trabajo solapados y distintos
    for staff in staffs:
        start_hour = random.randint(8, 11)
        end_hour = start_hour + random.randint(4, 7)
        WorkingHours.objects.create(
            staff_member=staff,
            day_of_week=2,  # Martes
            start_time=time(start_hour, 0),
            end_time=time(end_hour, 0)
        )

    # Crear cliente
    client = Client.objects.create(first_name="John", last_name="Doe",
                                   phone_number="+34123456789", email="john@example.com")

    # Crear citas ocupadas aleatorias, asegurando que no se repita el mismo slot exacto por staff
    occupied_slots = set()
    for _ in range(50):  # 50 citas ocupadas extremas
        staff = random.choice(staffs)
        if not staff.services_offered.exists():
            continue
        service = random.choice(staff.services_offered.all())
        wh = staff.get_working_hours() or WorkingHours.objects.filter(staff_member=staff).first()
        if not wh:
            continue
        max_start = wh.end_time.hour - service.duration.seconds // 3600
        if max_start < wh.start_time.hour:
            continue
        start_hour = random.randint(wh.start_time.hour, max_start)
        start_minute = random.choice([0, 15, 30, 45])
        slot_key = (staff.id, start_hour, start_minute)
        if slot_key in occupied_slots:
            continue
        occupied_slots.add(slot_key)
        Appointment.objects.create(
            client=client,
            service=service,
            staff_member=staff,
            date=date(2025, 10, 28),
            start_time=time(start_hour, start_minute),
            end_time=(datetime.combine(date.today(), time(start_hour, start_minute)) + service.duration).time()
        )

    # Obtener disponibilidad para cada servicio
    for service in services:
        availability = get_availability_for_service_across_staffs(service.name, date(2025, 10, 28))
        # Comprobar que no hay slots ocupados
        for staff in staffs:
            staff_slots = availability.get(staff.user.username, [])
            for (s_id, h, m) in occupied_slots:
                if s_id == staff.id and service in staff.services_offered.all():
                    slot_str = f"2025-10-28 {h:02d}:{m:02d}:00"
                    assert slot_str not in staff_slots, f"Slot {slot_str} ocupado pero aparece como disponible"
        # Comprobación mínima: hay al menos un slot disponible para algún staff
        all_slots = sum(len(slots) for slots in availability.values())
        assert all_slots > 0, f"No hay slots disponibles para {service.name}"

    print("Test extremo completado: disponibilidad comprobada para todos los staffs y servicios.")
