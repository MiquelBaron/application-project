from appointment.models import MedicalRecord, Client
from django.forms.models import model_to_dict
from django.core.exceptions import ObjectDoesNotExist
def get_medical_record_for_client(record_id:int) -> dict:
    record = MedicalRecord.objects.filter(id=record_id).first()
    if not record:
        return {}
    return model_to_dict(record)


def delete_medical_record_for_client(record_id:int) -> None:
    try:
        MedicalRecord.objects.filter(id=record_id).delete()
    except MedicalRecord.DoesNotExist:
        print("Medical Record Not Found")
    return None


def update_medical_record_for_client(record_id:int,data) -> None:
    try:
        record = MedicalRecord.objects.filter(id=record_id).first()
        record.allergies = data["allergies"]
        record.medications = data["medications"]
        record.medical_conditions = data["medical_conditions"]
        record.notes = data["notes"]
        record.blood_type  = data["blood_type"]
        record.save()
    except MedicalRecord.DoesNotExist:
        print("Medical Record Not Found")
        return None
    return

def create_medical_record_for_client(data) -> MedicalRecord:
    client_id = data.get("client")
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        raise ValueError(f"Client with id {client_id} does not exist")

    new_medical_record = MedicalRecord.objects.create(
        client=client,
        allergies=data.get("allergies", ""),
        medications=data.get("medications", ""),
        medical_conditions=data.get("medical_conditions", ""),
        notes=data.get("notes", ""),
        blood_type=data.get("blood_type", ""),
    )

    return new_medical_record
