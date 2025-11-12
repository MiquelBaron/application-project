from django.forms.models import model_to_dict
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.http import JsonResponse, HttpResponseBadRequest
from django.views import View
import json

@method_decorator(login_required, name='dispatch')
class BaseModelView(View):
    model = None
    list_fields = []
    detail_fields = []

    permission_view = None
    permission_create = None
    permission_edit = None
    permission_delete = None

    def has_perm(self, request, perm_name):
        return (not perm_name) or request.user.has_perm(perm_name)

    def get_object(self, object_id=None):
        """Devuelve la instancia del modelo o 404"""
        if object_id is None:
            object_id = self.kwargs.get("object_id")
        return get_object_or_404(self.model, id=object_id)
    def get_queryset(self, request):
        return self.model.objects.all()

    def get(self, request, object_id=None):
        if not self.has_perm(request, self.permission_view):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        queryset = self.get_queryset(request)
        if object_id:
            obj = queryset.filter(id=object_id).first()
            if not obj:
                return JsonResponse({'error': 'Not found'}, status=404)
            data = model_to_dict(obj, fields=self.detail_fields)
        else:
            data = [model_to_dict(o, fields=self.list_fields) for o in queryset]
        return JsonResponse({'results': data} if not object_id else data, safe=not object_id)

    def post(self, request):
        if not self.has_perm(request, self.permission_create):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON')

        obj = self.model.objects.create(**payload)
        data = model_to_dict(obj, fields=self.detail_fields)
        return JsonResponse(data, status=201)

    def put(self, request, object_id):
        print(request)
        if not self.has_perm(request, self.permission_edit):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        obj = self.model.objects.filter(id=object_id).first()
        if not obj:
            return JsonResponse({'error': 'Not found'}, status=404)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON')

        for field, value in payload.items():
            setattr(obj, field, value)
        obj.save()

        data = model_to_dict(obj, fields=self.detail_fields)
        return JsonResponse(data)

    def delete(self, request, object_id):

        if not self.has_perm(request, self.permission_delete):
            return JsonResponse({'error': 'Forbidden'}, status=403)

        obj = self.model.objects.filter(id=object_id).first()
        if not obj:
            return JsonResponse({'error': 'Not found'}, status=404)

        obj.delete()
        return JsonResponse({'status': 'deleted'})

    from django.http import JsonResponse

    def json_response(self, data, status=200):
        return JsonResponse(data, status=status)