# domain/clients/service.py
from datetime import datetime
from typing import Optional, Dict, Any
from appointment.models import Client
from django.core.exceptions import ObjectDoesNotExist, ValidationError


def get_client_by_id(client_id: int) -> Optional[Client]:
    try:
        return Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return None


def update_client(client: Client, data: Dict[str, Any]) -> Client:
    # Actualizar campos si vienen en data
    client.first_name = data.get("first_name", client.first_name)
    client.last_name = data.get("last_name", client.last_name)
    client.email = data.get("email", client.email)
    client.phone_number = data.get("phone_number", client.phone_number)
    client.address = data.get("address", client.address)
    client.gender = data.get("gender", client.gender)

    date_of_birth = data.get("date_of_birth", client.date_of_birth)
    if isinstance(date_of_birth, str):
        try:
            date_of_birth = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            date_of_birth = None
    client.date_of_birth = date_of_birth

    client.extra_info = data.get("extra_info", client.extra_info)
    client.source = data.get("source", client.source)

    client.save()
    return client


def delete_client(client: Client):
    client.delete()


def count_clients() -> int:
    return Client.objects.count()


def serialize_client(client: Client) -> Dict[str, Any]:
    return {
        "id": client.id,
        "gender": client.gender,
        "address": client.address,
        "date_of_birth": client.date_of_birth,
        "first_name": client.first_name,
        "last_name": client.last_name,
        "email": client.email,
        "phone_number": str(client.phone_number),
        "extra_info": client.extra_info,
        "source": getattr(client, "source", None),
        "created_at": client.created_at.isoformat(),
        "updated_at": client.updated_at.isoformat(),
    }
