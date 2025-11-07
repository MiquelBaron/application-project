# urls.py
# Path: appointment/urls.py

"""
Author: Adams Pierre David
Since: 1.0.0
"""

from django.urls import include, path

# views.py
from django.http import JsonResponse

def test_no_auth(request):
    return JsonResponse({"ok": True, "user": str(request.user)})

app_name = 'appointment'

urlpatterns = [
    path("chatbot/", include("appointment.chatbot_api.urls")),
    path("api/", include("appointment.web_api.urls")),
    path("test/", test_no_auth, name="test"),
]


