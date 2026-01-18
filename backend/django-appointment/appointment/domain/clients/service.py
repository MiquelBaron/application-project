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

import json
from typing import Dict, List
from django.forms.models import model_to_dict
from django.db import IntegrityError
from appointment.models import Client, MedicalRecord

def get_clients_list() -> List[Dict]:
    clients = Client.objects.all().values('id', 'first_name', 'last_name', 'phone_number', 'email')
    return [{**c, 'phone_number': str(c['phone_number'])} for c in clients]

def create_client(data: Dict) -> Client:
    try:
        client = Client.objects.create(
            source=data.get("source", "other"),
            first_name=data["first_name"],
            last_name=data["last_name"],
            phone_number=data["phone_number"],
            email=data["email"],
            extra_info=data.get("extra_info", ""),
            date_of_birth=data.get("date_of_birth") or None,
            gender=data.get("gender"),
            address=data.get("address"),
        )
        return client
    except KeyError as e:
        raise ValueError(f"Missing client field: {e}")
    except IntegrityError:
        raise ValueError("Phone number already exists")

def get_medical_record_for_client(client_id:int) -> dict:
    medical_record = MedicalRecord.objects.filter(client__id=client_id).first()
    if not medical_record:
        return {}
    return model_to_dict(medical_record)
