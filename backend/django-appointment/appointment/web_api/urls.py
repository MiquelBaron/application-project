from django.urls import path
from .views_admin import *
from .views.admin_views import *
from .views.auth import *
from .views.views import *
from appointment.notifications.sse import notification_stream

staff_member_view = StaffMemberView.as_view()
service_view = ServiceView.as_view()
medical_view = MedicalRecordView.as_view()

urlpatterns = [
    # Auth
    path('login/', login_user, name='staff_login'),
    path('logout/', logout_user, name='staff_logout'),
    path('session/', get_session, name='session'),

    # Staff Members
    path('staffs/', new_staff, name='staffs_list'),
    path('staffs/<int:staff_id>/', get_staff_detail, name='staff_detail'),  # BaseModelView
    path('staffs/availability/<int:staff_id>/<int:service_id>/<str:day_str>/', availability_for_staff ,name='staff_availability'),

    # Services
    path('services/', services_list, name='services_list'),
    path('services/<int:object_id>/', service_view, name='service_detail'),
    path('services/create/', service_view, name='service_create'),  # POST
    path('services/<int:object_id>/edit/', service_view, name='service_edit'),  # PUT
    path('services/<int:object_id>/delete/', service_view, name='service_delete'),  # DELETE

    # Staffs by service
    path('staffs-by-service/<int:service_id>/', get_staffs_by_service, name='staffs_by_service'),

    # Appointments
    path('appointments/', list_appointments, name='appointments_list'),  # GET & POST
    path('appointments/<int:appointment_id>/', appointment_detail, name='appointment_detail'),
    path('appointments/<str:start_date>/<str:end_date>/', appointments_interval, name='appointments_interval'),
    path('appointments/today/', appointments_today, name='appointments_today'),
    path('appointments/recent/', appointments_recent, name='appointments_recent'),

    # Availability
    path('availability/<str:service_name>/<str:date_str>/', availability, name='availability'),

    # Clients
    path('clients/count/', clients_count, name='clients_count'),
    path('clients/<int:client_id>/medical_records/', get_clients_medical_record, name='clients_medical_records'),
    path('clients/<int:client_id>/', client_by_id, name='clients_by_id'),
    path('clients/', clients_post_get, name='clients_post_get'),

    # Working hours
    path('working_hours/staff/<int:staff_id>/', set_working_hours, name='working_hours_list'),

    # Medical records
    path('medical_records/', MedicalRecordView.as_view(), name='medical_record_create'),
    path('medical_records/<int:object_id>/', MedicalRecordView.as_view(), name='medical_record_edit'),
    path('medical_records/<int:object_id>/', MedicalRecordView.as_view(), name='medical_record_delete'),
    path('medical_records/<int:object_id>/', MedicalRecordView.as_view(), name='medical_record_detail'),

    # Report
    path("export-history/<int:patient_id>/", export_medical_history, name="export_medical_history"),

    # SSE
    path('stream/', notification_stream, name='notification-stream'),

]