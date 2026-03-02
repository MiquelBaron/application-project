# appointments/asgi.py
import os
from django.core.asgi import get_asgi_application
from django.urls import path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "appointments.settings")

django_asgi_app = get_asgi_application()

