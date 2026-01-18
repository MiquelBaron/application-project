from appointment.models import Service
from typing import List, Dict
from django.forms.models import model_to_dict
from datetime import timedelta
import isodate

def get_all_services() -> List[Dict]:
    services = Service.objects.all()
    return services

def create_new_service(name:str, description:str, price:float, currency:str, allow_rescheduling:bool, duration:timedelta) -> Service:
    service = Service.objects.create(
        name=name,
        description=description,
        price=price,
        currency=currency,
        allow_rescheduling=allow_rescheduling,
        duration=duration
    )
    return service


def get_service_by_id(service_id: int):
    try:
        return Service.objects.get(id=service_id)
    except Service.DoesNotExist:
        return None


def update_service(service: Service, data: dict):
    service.name = data.get('name', service.name)
    service.description = data.get('description', service.description)
    service.price = data.get('price', service.price)
    service.currency = data.get('currency', service.currency)
    service.allow_rescheduling = data.get('allow_rescheduling', service.allow_rescheduling)
    duration = parse_duration(data.get('duration'))
    service.duration = duration
    service.save()


def delete_service(service: Service):
    service.delete()


def parse_duration(value) -> timedelta:
    """Convierte duration en timedelta (ISO8601 o HH:MM:SS)"""
    if not value:
        return timedelta(minutes=30)
    if isinstance(value, timedelta):
        return value
    try:
        return isodate.parse_duration(value)
    except:
        parts = list(map(int, value.split(":")))
        h, m, s = (parts + [0]*3)[:3]
        return timedelta(hours=h, minutes=m, seconds=s)


# Metodo auxiliar para devolver JSON-friendly
def to_dict(service: Service):
    return {
        'id': service.id,
        'name': service.name,
        'description': service.description,
        'price': service.price,
        'currency': service.currency,
        'allow_rescheduling': service.allow_rescheduling,
        'duration': str(service.duration)
    }
