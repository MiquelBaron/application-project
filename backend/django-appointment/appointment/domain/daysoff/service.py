


# appointment/services/day_off_service.py
from datetime import datetime
from appointment.models import DayOff, StaffMember

def get_days_off_by_staff(staff_id):
    """Obtener días libres de un miembro del staff"""
    return DayOff.objects.filter(staff_member=staff_id)

def create_day_off(staff_member, start_date, end_date, description):
    """Crear un día libre para un staff member"""
    return DayOff.objects.create(
        staff_member=staff_member,
        start_date=start_date,
        end_date=end_date,
        description=description,
    )

def get_all_days_off_for_user(user):
    """Obtener días libres visibles para el usuario"""
    if user.groups.filter(name="Admins").exists():
        # Admins ven todos los días desde hoy
        return DayOff.objects.filter(start_date__gte=datetime.today())
    else:
        staff = StaffMember.objects.get(user=user)
        return DayOff.objects.filter(start_date__gte=datetime.today(), staff_member=staff)

def serialize_day_off(day):
    """Convierte un DayOff en un diccionario listo para JSON"""
    return {
        "staff_member_id": day.staff_member_id,
        "user_first_name": day.staff_member.user.first_name,
        "user_last_name": day.staff_member.user.last_name,
        "start_date": str(day.start_date),
        "end_date": str(day.end_date),
        "description": day.description,
    }
