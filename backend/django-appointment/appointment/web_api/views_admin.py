
from django.contrib.auth.decorators import permission_required, login_required
from django.forms.models import model_to_dict
from django.http import JsonResponse, Http404, HttpResponseNotAllowed
from guardian.backends import ObjectPermissionBackend
from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest
import json

from appointment.models import StaffMember, Appointment, Service, Client, MedicalRecord
from appointment.logger_config import get_logger
_logger = get_logger(__name__)

@login_required
@permission_required('appointment.view_staffmember', raise_exception=True)
def staffs_list(request):
    """
    GET/api/staffs/
    :param request:
    :return:
    """
    _logger.debug("Staffs list request")
    if request.method == 'GET':
        staffs = StaffMember.objects.all()
        data = [
            {
                "id": s.id,
                "user_id": s.user.id if s.user else None,
                "username": s.user.username if s.user else None,
                "first_name":s.user.first_name,
                "last_name": s.user.last_name,
                "slot_duration": s.slot_duration,
                "services_offered": [service.name for service in s.services_offered.all()],
                "email": s.user.email
            }
            for s in staffs
        ]
        return JsonResponse({'staffs': data})

@login_required
@permission_required('appointment.view_service', raise_exception=True)
def services_list(request):
    if request.method == 'GET':
        services = Service.objects.all()
        data = [model_to_dict(s, fields=['id','name','description','price','currency','allow_rescheduling','duration']) for s in services]
        return JsonResponse({'services': data})


@login_required
@permission_required('appointment.edit_service', raise_exception=True)
def create_service(request):
    if request.method == 'POST':
        service = Service()

@login_required
@permission_required('appointment.view_client', raise_exception=True)
def clients_post_get(request):
    if request.method == 'GET':
        clients = Client.objects.all().values('id', 'first_name', 'last_name', 'phone_number','email')
        client_list = [{**c, 'phone_number': str(c['phone_number'])} for c in clients]
        return JsonResponse({'clients': client_list})
    if request.method == 'POST':
        pass

@login_required
def get_clients_medical_record(request, client_id:int):

    if request.method == 'GET':
        medical_record = MedicalRecord.objects.filter(client__id=client_id).first()
        if not medical_record:
            return JsonResponse({'medical_record': None})
        return JsonResponse({'medical_record': model_to_dict(medical_record)})
    return HttpResponseBadRequest()