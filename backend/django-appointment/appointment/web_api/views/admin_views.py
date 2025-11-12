from django.forms.models import model_to_dict
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404

from appointment.models import StaffMember, Service, MedicalRecord
from .base import BaseModelView
import json
from datetime import timedelta
import isodate
class StaffMemberView(BaseModelView):
    model = StaffMember
    list_fields = ['id', 'user_id', 'slot_duration']
    detail_fields = ['id', 'user_id', 'slot_duration', 'lead_time', 'finish_time']
    permission_view = 'appointment.view_staffmember'
    permission_edit = 'appointment.change_staffmember'

from datetime import timedelta
import isodate  # pip install isodate

import json
from datetime import timedelta
import isodate
class ServiceView(BaseModelView):
    model = Service
    list_fields = ['id', 'name', 'price', 'duration']
    detail_fields = ['id', 'name', 'description', 'price', 'currency', 'duration', 'allow_rescheduling']
    permission_view = 'appointment.view_service'
    permission_edit = 'appointment.change_service'

    def parse_duration(self, value):
        if not value:
            return timedelta(minutes=30)
        if isinstance(value, timedelta):
            return value
        try:
            # Intentamos ISO 8601 primero
            import isodate
            return isodate.parse_duration(value)
        except Exception:
            # Formato HH:MM[:SS]
            parts = list(map(int, value.split(":")))
            if len(parts) == 2:
                h, m = parts
                s = 0
            else:
                h, m, s = parts
            return timedelta(hours=h, minutes=m, seconds=s)

    def put(self, request, object_id=None, *args, **kwargs):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return self.json_response({"error": "Invalid JSON"}, status=400)

        obj = self.get_object(object_id)

        if "duration" in data:
            data["duration"] = self.parse_duration(data["duration"])

        for key, value in data.items():
            setattr(obj, key, value)
        obj.save()

        # convertir a dict solo los campos de detalle
        return self.json_response({field: getattr(obj, field) for field in self.detail_fields})

    def post(self, request, *args, **kwargs):
        if not self.has_perm(request, self.permission_create):
            return self.json_response({'error': 'Forbidden'}, status=403)

        import json
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return self.json_response({"error": "Invalid JSON"}, status=400)

        if "duration" in payload:
            payload["duration"] = self.parse_duration(payload["duration"])

        obj = self.model.objects.create(**payload)
        data = model_to_dict(obj, fields=self.detail_fields)
        # opcional: convertir duration a HH:MM antes de enviar
        if "duration" in data:
            td = data["duration"]
            total_seconds = int(td.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            data["duration"] = f"{hours:02d}:{minutes:02d}"
        return self.json_response(data, status=201)


class MedicalRecordView(BaseModelView):
    model = MedicalRecord
    list_fields = ['id', 'client', 'allergies', 'medical_conditions', 'medications', 'notes', 'blood_type']
    detail_fields = ['id', 'client', 'allergies', 'medical_conditions', 'medications', 'notes', 'blood_type']

    permission_view = 'appointment.view_medicalrecord'
    permission_create = 'appointment.add_medicalrecord'
    permission_edit = 'appointment.change_medicalrecord'
    permission_delete = 'appointment.delete_medicalrecord'

    def get_queryset(self, request):
        """Opcional: filtrar por cliente si viene query param client_id"""
        qs = super().get_queryset(request)
        client_id = request.GET.get('client_id')
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs

    def get(self, request, client_id=None, object_id=None):
        # GET por cliente
        if client_id:
            record = MedicalRecord.objects.filter(client__id=client_id).first()
            if not record:
                return JsonResponse({'medical_record': None})
            data = model_to_dict(record, fields=self.detail_fields)
            return JsonResponse({'medical_record': data})

        # GET por ID de registro
        return super().get(request, object_id=object_id)

    from django.shortcuts import get_object_or_404

    def post(self, request):
        if not self.has_perm(request, self.permission_create):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON')

        # --- Convertir ForeignKeys de IDs a instancias ---
        if 'client' in payload:
            client_id = payload.pop('client')
            from appointment.models import Client
            payload['client'] = get_object_or_404(Client, id=client_id)

        obj = self.model.objects.create(**payload)
        data = model_to_dict(obj, fields=self.detail_fields)
        return JsonResponse(data, status=201)

