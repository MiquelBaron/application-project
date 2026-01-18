from django.contrib.auth.decorators import login_required, permission_required
from django.http import JsonResponse, HttpResponseBadRequest
from appointment.domain.service.service import (
    get_all_services,
    create_new_service,
    get_service_by_id,
    update_service,
    delete_service,
    parse_duration
)
import json


@login_required
def services_list(request):
    """GET: List services, POST: Create new service"""
    if request.method == 'GET':
        services = get_all_services()
        data = [
            {
                "id":s.id,
                "name": s.name,
                "description": s.description,
                "duration": s.duration,
                "price": s.price,
                "currency": s.currency
            }
            for s in services
        ]
        return JsonResponse({'services': data})

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            duration = parse_duration(data.get('duration'))
            service = create_new_service(
                name=data['name'],
                description=data.get('description', ''),
                price=data['price'],
                currency=data.get('currency', 'USD'),
                allow_rescheduling=data.get('allow_rescheduling', True),
                duration=duration
            )
            return JsonResponse({'id': service.id, 'name': service.name}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))

    return HttpResponseBadRequest("Method not allowed")


@login_required
def service_detail(request, service_id):
    """
    GET: Get service detail
    PUT: Update service
    DELETE: Delete service
    """
    service = get_service_by_id(service_id)
    if not service:
        return JsonResponse({'error': 'Service not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(service.to_dict())

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            update_service(service, data)
            return JsonResponse({'status': 'updated', 'id': service.id})
        except Exception as e:
            return HttpResponseBadRequest(str(e))

    elif request.method == 'DELETE':
        delete_service(service)
        return JsonResponse({'status': 'deleted', 'id': service_id})

    return HttpResponseBadRequest("Method not allowed")
