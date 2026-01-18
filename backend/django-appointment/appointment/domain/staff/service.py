# domain/staff/service.py
import json
from datetime import datetime
from typing import List, Dict, Optional
from django.contrib.auth.models import User, Group
from django.db import transaction
from appointment.models import StaffMember, Service, WorkingHours, DayOff
from appointment.utils.db_helpers import get_staffs_assigned_to_service


def list_staff_members() -> List[Dict]:
    staffs = StaffMember.objects.all().select_related("user").prefetch_related("services_offered")
    result = []
    for staff in staffs:
        set_timetable = WorkingHours.objects.filter(staff_member=staff).exists()
        result.append({
            "id": staff.id,
            "user_id": staff.user.id,
            "user_username": staff.user.username,
            "user_email": staff.user.email,
            "user_first_name": staff.user.first_name,
            "user_last_name": staff.user.last_name,
            "services_offered": [{"id": s.id, "name": s.name} for s in staff.services_offered.all()],
            "slot_duration": staff.slot_duration,
            "lead_time": staff.lead_time.isoformat() if staff.lead_time else None,
            "finish_time": staff.finish_time.isoformat() if staff.finish_time else None,
            "work_on_saturday": staff.work_on_saturday,
            "work_on_sunday": staff.work_on_sunday,
            "set_timetable": set_timetable,
            "created_at": staff.created_at.isoformat(),
        })
    return result

from typing import Dict, List
from appointment.models import StaffMember, User, WorkingHours, Service
from django.db import transaction

def create_staff_with_user_and_services(
    user_data: Dict,
    staff_data: Dict,
    services_ids: List[int],
    working_hours: List[Dict]
) -> StaffMember:
    """
    Crear Staff + User + asignar servicios + crear working hours.
    Retorna la instancia de StaffMember creada.
    """
    with transaction.atomic():
        # 1️⃣ Crear usuario
        user = User.objects.create_user(
            username=user_data["username"],
            email=user_data.get("email",""),
            password=user_data["password"],
            first_name=user_data.get("first_name",""),
            last_name=user_data.get("last_name","")
        )

        # 2️⃣ Crear StaffMember
        staff = StaffMember.objects.create(
            user=user,
            slot_duration=staff_data.get("slot_duration",30),
            lead_time=staff_data.get("lead_time"),
            finish_time=staff_data.get("finish_time"),
            appointment_buffer_time=staff_data.get("appointment_buffer_time"),
        )

        # 3️⃣ Asignar servicios
        if services_ids:
            services = Service.objects.filter(id__in=services_ids)
            staff.services_offered.set(services)

        # 4️⃣ Crear working hours
        if working_hours:
            wh_objs = []
            for wh in working_hours:
                wh_objs.append(
                    WorkingHours(
                        staff_member=staff,
                        day_of_week=wh["day_of_week"],
                        start_time=wh["start_time"],
                        end_time=wh["end_time"]
                    )
                )
            WorkingHours.objects.bulk_create(wh_objs)
            staff.set_timetable = True
            staff.save()

    return staff

def serialize_staff_member_list(staff: StaffMember) -> Dict:
    return {
        "id": staff.id,
        "user_id": staff.user.id,
        "username": staff.user.username,
        "first_name": staff.user.first_name,
        "last_name": staff.user.last_name,
        "slot_duration": staff.slot_duration,
        "services_offered": [{"id": s.id, "name": s.name} for s in staff.services_offered.all()],
        "has_timetable": staff.set_timetable
    }

def create_staff(data: Dict) -> StaffMember:
    required_user_fields = ["username", "email", "password"]
    missing_fields = [f for f in required_user_fields if f not in data]
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    with transaction.atomic():
        # Crear usuario
        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            first_name=data.get("user_first_name", ""),
            last_name=data.get("user_last_name", ""),
        )
        user.groups.add(Group.objects.get(name="Staff"))

        # Crear staff
        staff = StaffMember.objects.create(
            user=user,
            slot_duration=data.get("slot_duration", 30),
            lead_time=data.get("lead_time"),
            finish_time=data.get("finish_time"),
            appointment_buffer_time=data.get("appointment_buffer_time"),
            work_on_saturday=data.get("work_on_saturday", False),
            work_on_sunday=data.get("work_on_sunday", False),
            set_timetable=data.get("set_timetable", False),
        )

        # Asignar servicios
        services_ids = data.get("services_offered", [])
        if services_ids:
            services = Service.objects.filter(id__in=services_ids)
            staff.services_offered.set(services)
            staff.save()

    return staff


def get_staff_by_id(staff_id: int) -> Optional[StaffMember]:
    try:
        return StaffMember.objects.get(id=staff_id)
    except StaffMember.DoesNotExist:
        return None


def delete_staff(staff: StaffMember):
    staff.delete()


def list_days_off(staff: Optional[StaffMember] = None, admin_view: bool = False):
    from datetime import date
    query = DayOff.objects.filter(start_date__gte=date.today())
    if staff and not admin_view:
        query = query.filter(staff_member=staff)
    result = []
    for day in query:
        result.append({
            "staff_member_id": day.staff_member_id,
            "user_first_name": day.staff_member.user.first_name,
            "user_last_name": day.staff_member.user.last_name,
            "start_date": day.start_date,
            "end_date": day.end_date,
            "description": day.description,
        })
    return result


def create_day_off(staff: StaffMember, start_date: datetime.date, end_date: datetime.date, description: str):
    return DayOff.objects.create(
        staff_member=staff,
        start_date=start_date,
        end_date=end_date,
        description=description
    )


def set_working_hours_for_staff(staff: StaffMember, hours: List[Dict]):
    # Borrar anteriores
    WorkingHours.objects.filter(staff_member=staff).delete()
    objs = [WorkingHours(
        staff_member=staff,
        day_of_week=item["day_of_week"],
        start_time=item["start_time"],
        end_time=item["end_time"]
    ) for item in hours]
    WorkingHours.objects.bulk_create(objs)
    staff.set_timetable = True
    staff.save()


def get_staffs_by_service(service_id: int) -> List[Dict]:
    staffs = get_staffs_assigned_to_service(service_id)
    return [{"name": s.user.first_name + " " + s.user.last_name, "id": s.user.id} for s in staffs]


def set_services_for_staff(staff: StaffMember, service_ids: List[int]):
    staff.services_offered.set(service_ids)

from typing import List, Dict
from appointment.models import StaffMember, Service

def get_all_staffs() -> List[Dict]:
    staffs = StaffMember.objects.all().prefetch_related("services_offered")
    result = []
    for s in staffs:
        result.append({
            "id": s.id,
            "user_id": s.user.id if s.user else None,
            "username": s.user.username if s.user else None,
            "first_name": s.user.first_name if s.user else None,
            "last_name": s.user.last_name if s.user else None,
            "slot_duration": s.slot_duration,
            "services_offered": [service.name for service in s.services_offered.all()],
            "email": s.user.email if s.user else None
        })
    return result
