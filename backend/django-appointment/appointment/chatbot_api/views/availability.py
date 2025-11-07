# API VIEWS

from django.http import JsonResponse
from appointment.core.decorators import require_api_key
from django.views.decorators.csrf import csrf_exempt

from appointment.logger_config import get_logger
from appointment.core.date_time import convert_str_to_date
from appointment.core.api_helpers import get_availability_for_service_across_staffs

"""
Author: Miquel Barón Marco
Version: 1.0.0
Since: 1.0.0
"""
_logger = get_logger(__name__)


@csrf_exempt
@require_api_key
def api_get_availability(request, date_str, service_name):
    """
    GET /availability/<str:date_str>/<str:service_name>

    :param request:
    :param date_str:
    :param service_name:
    :return:
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        if not date_str:
            return JsonResponse({"error": "Missing date"}, status=400)
        if not service_name:
            return JsonResponse({"error": "Missing service name"}, status=400)

        parsed_date = convert_str_to_date(date_str)

        _logger.debug("Parsed date:")
        _logger.debug(parsed_date)

        availability = get_availability_for_service_across_staffs(service_name, parsed_date)


        return JsonResponse({'availability': availability})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
