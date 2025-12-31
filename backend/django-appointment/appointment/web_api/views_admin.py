
from django.contrib.auth.decorators import permission_required, login_required
from django.db import IntegrityError
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
def clients_post_get(request):

    if request.method == 'GET':
        clients = Client.objects.all().values('id', 'first_name', 'last_name', 'phone_number','email')
        client_list = [{**c, 'phone_number': str(c['phone_number'])} for c in clients]
        return JsonResponse({'clients': client_list})

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.decoder.JSONDecodeError:
            _logger.error("Invalid request body")
            return HttpResponseBadRequest("Error parsing request body")

        try:
            client = Client.objects.create(
                source=data.get("source", "other"),
                first_name=data["first_name"],
                last_name=data["last_name"],
                phone_number=data["phone_number"],
                email=data["email"],
                extra_info=data.get("extra_info", ""),
                date_of_birth=data.get("date_of_birth") or None,
                gender=data.get("gender"),
                address=data.get("address"),
            )
        except KeyError as e:
            _logger.error(e)
            return HttpResponseBadRequest("There is an error with the client data")
        except IntegrityError:
            return HttpResponseBadRequest("Phone number already exists")

        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        return JsonResponse(
            {
                "id": client.id,
                "client": str(client),
                "created": True,
            },
            status=201
        )


@login_required
def get_clients_medical_record(request, client_id:int):

    if request.method == 'GET':
        medical_record = MedicalRecord.objects.filter(client__id=client_id).first()
        if not medical_record:
            return JsonResponse({'medical_record': None})
        return JsonResponse({'medical_record': model_to_dict(medical_record)})
    return HttpResponseBadRequest()