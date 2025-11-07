from appointment.models import StaffMember, Service
from .base import BaseModelView

class StaffMemberView(BaseModelView):
    model = StaffMember
    list_fields = ['id', 'user_id', 'slot_duration']
    detail_fields = ['id', 'user_id', 'slot_duration', 'lead_time', 'finish_time']
    permission_view = 'appointment.view_staffmember'
    permission_edit = 'appointment.change_staffmember'

class ServiceView(BaseModelView):
    model = Service
    list_fields = ['id', 'name', 'price', 'duration']
    detail_fields = ['id', 'name', 'description', 'price', 'currency', 'duration', 'allow_rescheduling']
    permission_view = 'appointment.view_service'
    permission_edit = 'appointment.change_service'


