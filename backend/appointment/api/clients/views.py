# api/clients/views.py
import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, permission_required
from django.core.exceptions import ObjectDoesNotExist, ValidationError

from appointment.domain.clients.service import (
    get_client_by_id,
    update_client,
    delete_client,
    serialize_client,
    count_clients
)


@login_required
def client_by_id(request, client_id: int):
    client = get_client_by_id(client_id)
    if not client:
        return JsonResponse({"error": "Client not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({"client": serialize_client(client)})

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        updated_client = update_client(client, data)
        return JsonResponse({"client": serialize_client(updated_client)})

    elif request.method == "DELETE":
        if not request.user.has_perm("appointment.delete_client"):
            return JsonResponse({"error": "Permission denied"}, status=403)
        delete_client(client)
        return JsonResponse({"success": True})

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@login_required
def clients_count_view(request):
    if request.method != "GET":
        return HttpResponseBadRequest("Invalid method")
    return JsonResponse({"count": count_clients()})

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from appointment.domain.clients.service import get_clients_list, create_client, get_medical_record_for_client
import json

@login_required
def clients_post_get(request):
    if request.method == 'GET':
        return JsonResponse({'clients': get_clients_list()})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            client = create_client(data)
            return JsonResponse({'id': client.id, 'client': str(client), 'created': True}, status=201)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest("Method Not Allowed")

@login_required
def get_clients_medical_record(request, client_id:int):
    if request.method != 'GET':
        return HttpResponseBadRequest("Method Not Allowed")
    return JsonResponse({'medical_record': get_medical_record_for_client(client_id)})
