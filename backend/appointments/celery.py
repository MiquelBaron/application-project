import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "appointments.settings")

try:
    from celery import Celery
except ModuleNotFoundError:
    class _FallbackCelery:
        def config_from_object(self, *args, **kwargs):
            return None

        def autodiscover_tasks(self, *args, **kwargs):
            return None

    app = _FallbackCelery()
else:
    app = Celery("appointments")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    app.autodiscover_tasks()
