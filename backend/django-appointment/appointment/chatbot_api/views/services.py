# API VIEWS
import json

from django.http import JsonResponse
from appointment.core.decorators import require_api_key
from django.views.decorators.csrf import csrf_exempt

from django.shortcuts import get_object_or_404

from appointment.logger_config import get_logger
from appointment.models import (
    Service
)
from ...core.db_helpers import (
    get_staffs_assigned_to_service
)
from appointment.core.date_time import convert_minutes_in_human_readable_format

"""
Author: Miquel Barón Marco
Version: 1.0.0
Since: 1.0.0
"""

_logger = get_logger(__name__)

@csrf_exempt
def list_services(request):
    """
    /GET /services/ --> Returns a list of Service objects.
    :param request:
    :return:
    """
    _logger.debug("List services")
    print("HOLA")
    if request.method == 'GET':
        services = list(Service.objects.values("id", "name", "duration","description","price"))
        for service in services:
            duration = service['duration']
            minutes = int(duration.total_seconds() // 60)
            service['duration'] = convert_minutes_in_human_readable_format(minutes)

        return JsonResponse(services, safe=False)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


#GET /services/names/
@require_api_key
def get_services_names(request):
    '''
    /GET /services/names/ --> Get al Services names.
    This method returns all the services name, so that the chat bot can validate that the client is requesting
    a valid service.

    For getting extra information (such as pricing, description, etc), call list_services.

    This endpoint is only for getting the name so that the AI agent does not consume many tokens.
    :param request:
    :return:
    '''
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    services_name = []
    for service in Service.objects.all():
        services_name.append(service.name.lower())

    return JsonResponse({'ofered_services': services_name}, safe=False)



@csrf_exempt
@require_api_key
#POST services/info/
#TODO Refactor to GET
def list_some_services_info(request):
    '''
    Method for retrieving information of some services.
    Accepts a list of services names, a single services name as a string or a single service in a list.
    Returns all the fields of the Service's model for the requested service/s.

    :param request:
    :return:
    '''
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.decoder.JSONDecodeError:
        return JsonResponse({"error": "Error decoding body. If no service/treatment passed, please send an empty body, but never null body"}, status=400)


    if not data:
        return JsonResponse({Service.objects.all()}, status=200)

    service_type = data.get('service_name')

    if isinstance(service_type, str):
        _logger.debug("Instance string")
        services_name = [service_type]
    elif isinstance(service_type, list):
        _logger.debug("Instance list")
        services_name = service_type
    else:
        return JsonResponse({"error": "service_name isn't a string nor a list. "}, status=400)

    services_objects = []
    for service_name in services_name:
        services_objects.append(get_object_or_404(Service, name__iexact=service_name).to_dict())

    return JsonResponse({'services': services_objects}, safe=False)
