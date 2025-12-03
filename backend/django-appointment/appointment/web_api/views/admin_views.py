from django.forms.models import model_to_dict
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404

from appointment.models import StaffMember, Service, MedicalRecord, WorkingHours
from .base import BaseModelView
from appointment.models import User
import json
from datetime import timedelta
import isodate

from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.core.exceptions import ObjectDoesNotExist

from django.http import JsonResponse
from django.forms.models import model_to_dict

class StaffMemberView(BaseModelView):
    model = StaffMember
    list_fields = ['id','slot_duration','set_timetable','user__email']  # 👈 Quitamos los que no son simples
    detail_fields = ['id', 'user_id', 'slot_duration', 'lead_time', 'finish_time']
    permission_view = 'appointment.view_staffmember'
    permission_edit = 'appointment.change_staffmember'
    permission_create = 'appointment.add_staffmember'

    def serialize_list_item(self, obj):
        """Serializador seguro para la lista"""
        data = model_to_dict(obj, fields=self.list_fields)

        # Campos relacionados (no entran en model_to_dict)
        data['user_first_name'] = obj.user.first_name
        data['user_last_name'] = obj.user.last_name
        data['email'] = obj.user.email
        # ManyToMany serializado correctamente
        data['services_offered'] = list(obj.services_offered.values('id', 'name'))

        return data

    def get(self, request, object_id=None):
        # Permiso
        if not self.has_perm(request, self.permission_view):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        queryset = self.get_queryset(request)

        # --- DETALLE ---
        if object_id:
            try:
                obj = queryset.get(id=object_id)
            except StaffMember.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)

            data = model_to_dict(obj, fields=self.detail_fields)
            data['working_hours'] = []

            return JsonResponse(data, safe=True)

        # --- LISTA ---
        data = [self.serialize_list_item(o) for o in queryset]

        return JsonResponse({'results': data}, safe=False)



    def post(self, request):
        """Custom POST to create staff + user + working hours"""
        if not self.has_perm(request, self.permission_create):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        try:
            payload = json.loads(request.body)
        except:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        # 1) Create User
        user_data = payload.get("user")
        if not user_data:
            return JsonResponse({"error": "Missing user data"}, status=400)

        user = User.objects.create_user(
            username=user_data["username"],
            email=user_data.get("email", ""),
            first_name=user_data.get("first_name", ""),
            last_name=user_data.get("last_name", ""),
            password=user_data.get("password", None)
        )

        # 2) Create StaffMember
        staff = StaffMember.objects.create(
            user=user,
            slot_duration=payload.get("slot_duration", 30),
            lead_time=payload.get("lead_time"),
            finish_time=payload.get("finish_time"),
            appointment_buffer_time=payload.get("appointment_buffer_time"),
        )

        # 3) Assign services
        services = payload.get("services_offered", [])
        if services:
            staff.services_offered = services
            staff.save()

        # 4) Create WorkingHours
        working_hours = payload.get("working_hours", [])
        if working_hours:
            for wh in working_hours:
                WorkingHours.objects.create(
                    staff_member=staff,
                    day_of_week=wh["day_of_week"],
                    start_time=wh["start_time"],
                    end_time=wh["end_time"],
                )
            staff.set_timetable = True
            staff.save()

        # 5) Response
        return JsonResponse({
            "id": staff.id,
            "user_id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "slot_duration": staff.slot_duration,
            "services_offered": staff.get_services_offered(),
            "has_timetable": staff.set_timetable,
        }, status=201)


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

