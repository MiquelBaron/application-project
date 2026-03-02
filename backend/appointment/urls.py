# urls.py
# Path: appointments/urls.py

"""
Author: Adams Pierre David
Since: 1.0.0
"""

from django.urls import include, path

# views.py
from django.http import JsonResponse

def test_no_auth(request):
    return JsonResponse({"ok": True, "user": str(request.user)})

app_name = 'appointments'

urlpatterns = [
    path("api/", include("appointment.api.urls")),
    path("test/", test_no_auth, name="test"),
]


