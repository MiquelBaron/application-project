import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from appointment.domain.medical.service import *
from appointment.models import MedicalRecord
from django.core.exceptions import ObjectDoesNotExist, ValidationError


@login_required
def client_medical_record_view(request, record_id:int):
    if request.method == 'GET':
        return JsonResponse({"medical_record": get_medical_record_for_client(record_id)})


    if request.method == 'DELETE':
        delete_medical_record_for_client(record_id)
        return JsonResponse({"success": True})
    if request.method == 'PUT':
        data = json.loads(request.body)
        update_medical_record_for_client(record_id, data)
        return JsonResponse({"success": True})

def create_medical_record(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        create_medical_record_for_client(data)
        return JsonResponse({"success": True})
