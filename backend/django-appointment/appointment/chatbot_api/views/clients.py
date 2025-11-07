import json
from appointment.core.decorators import require_api_key
from appointment.models import (
    Appointment, Service
)
from django.forms.models import model_to_dict
from .helpers import *
from django.views.decorators.csrf import csrf_exempt

"""
Author: Miquel Barón Marco
Version: 1.0.0
Since: 1.0.0
"""

_logger = get_logger(__name__)


def get_clients(request):
    """
    GET /clients/

    Returns a list of all registered clients.
    :param request:
    :return:
    """
    _logger.debug("Received get all clients request.")

    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    clients = []
    for client in Client.objects.all():
        client_dict = model_to_dict(client)
        if client.phone_number:
            client_dict['phone_number'] = str(client.phone_number)
        clients.append(client_dict)

    return JsonResponse({"clients": clients}, status=200)


@require_api_key
def get_client_appointments(request, phone_number:str):
    """
    GET /clients/<id>/appointments/

    Returns a list of all registered appointments for the requested client.
    :param request:
    :param id:
    :return:
    """
    if request.method == 'GET':
        client = get_object_or_404(Client, phone_number=phone_number )
        appointments = Appointment.objects.filter(client=client)
        return JsonResponse(list(appointments), safe=False)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)



@require_api_key
def client_detail(request, phone):
    """
    GET /clients/<phone>/ --> retrieve client information by phone number.
    PUT /clients/<phone>/ --> update client information

    :param request:
    :param phone:
    :return:
    """
    if request.method == 'GET':
        return get_client_by_phone(phone)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)
        return update_client(phone, data)

    else:
        return JsonResponse({"error":"Method not allowed"}, status=405)


@csrf_exempt
@require_api_key
def register_new_client(request):
    """
    POST /clients/register/ → register new client

    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
    return create_client(data)

