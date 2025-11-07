from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from appointment.models import Client
from appointment.logger_config import get_logger

_logger = get_logger(__name__)


def create_client(data: dict) -> JsonResponse:
    """Crea un nuevo cliente a partir de un diccionario con sus datos"""
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    phone_number = data.get('phone_number')
    extra_info = data.get('extra_info', '')

    if not all([first_name, last_name, email, phone_number]):
        return JsonResponse({"error": "Missing required fields"}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"error": "Invalid email address"}, status=400)

    if Client.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already registered"}, status=400)
    if Client.objects.filter(phone_number=phone_number).exists():
        return JsonResponse({"error": "Phone number already registered"}, status=400)

    try:
        Client.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone_number=phone_number,
            extra_info=extra_info,
        )
        _logger.info(f"Client {first_name} {last_name} created successfully")
        return JsonResponse({"message": "Client created successfully"}, status=201)
    except Exception as e:
        _logger.error(f"Error creating client: {e}")
        return JsonResponse({"error": "Error creating client"}, status=500)


def update_client(phone: str, data: dict) -> JsonResponse:
    """Actualiza información de un cliente existente"""
    client = get_object_or_404(Client, phone_number=phone)

    email = data.get('email')
    phone_number = data.get('phone_number')
    extra_info = data.get('extra_info')

    if email:
        try:
            validate_email(email)
            client.email = email
        except ValidationError:
            return JsonResponse({"error": "Invalid email address"}, status=400)

    if phone_number:
        if Client.objects.exclude(pk=client.pk).filter(phone_number=phone_number).exists():
            return JsonResponse({"error": "Phone number already registered"}, status=400)
        client.phone_number = phone_number

    if extra_info is not None:
        client.extra_info = extra_info

    try:
        client.save()
        return JsonResponse({"message": "Client updated successfully"}, status=200)
    except Exception as e:
        _logger.error(f"Error updating client: {e}")
        return JsonResponse({"error": "Error updating client"}, status=500)


def get_client_by_phone(phone: str) -> JsonResponse:
    """Devuelve un cliente en formato JSON"""
    client = Client.objects.filter(phone_number__iexact=phone).first()
    if not client:
        return JsonResponse({"client": None}, status=404)

    client_data = {
        "id": str(client.id),
        "first_name": client.first_name,
        "last_name": client.last_name,
        "email": client.email,
        "phone_number": str(client.phone_number),
        "extra_info": client.extra_info,
        "created_at": client.created_at.isoformat(),
        "updated_at": client.updated_at.isoformat(),
    }
    return JsonResponse({"client": client_data}, status=200)
