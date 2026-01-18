
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML
from datetime import datetime
from appointment.models import Client



@login_required
def export_medical_history(request, patient_id):
    patient = get_object_or_404(Client, id=patient_id)
    record = getattr(patient, "medical_record", None)

    logo_url = request.build_absolute_uri("/static/img/logo_clinic.png")
     #Cnstruye la url absoluta de la imagen para poder encontrarla al generar el pdf.
    doctor_signature_url = request.build_absolute_uri("/static/img/signature.png")
    doctor_name = "Miquel Barón"

    html = render_to_string("reports/medical_report.html", {
        "patient": patient,
        "record": record,
        "generated": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "logo_url": logo_url,
        "doctor_signature_url": doctor_signature_url,
        "doctor_name": doctor_name
    }) # Sustituye las variables por los valores reales y genera el html completo.

    pdf = HTML(string=html, base_url=request.build_absolute_uri()).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f"attachment; filename=medical_history_{patient_id}.pdf"
    return response

