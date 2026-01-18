from appointment.api.appointments.views import *
from appointment.api.auth.views import *
from appointment.api.availability.views import *
from appointment.api.clients.views import *
from appointment.api.medical.views import *
from appointment.api.reports.views import *
from appointment.api.services.views import *
from appointment.api.staff.views import *
from appointment.api.daysoff.views import *
from django.urls import  path
from appointment.notifications.sse import *



urlpatterns = [
    # Auth
    path('login/', login_user, name='staff_login'),
    path('logout/', logout_user, name='staff_logout'),
    path('session/', get_session, name='session'),

    # Staff Members
    path('staffs/', new_staff, name='staffs_list'),
    path('staffs/<int:staff_id>/', staff_detail, name='staff_detail'),  #
    path('staffs/availability/<int:staff_id>/<int:service_id>/<str:day_str>/', availability_for_staff ,name='staff_availability'),
    path('staffs/<int:staff_id>/services/', set_staff_services_view, name='staff_services'),

    # Services
    path('services/', services_list, name='services_list'),
    path('services/<int:service_id>/', service_detail, name='service_detail'),

    # Staffs by service
    path('staffs-by-service/<int:service_id>/', staffs_by_service, name='staffs_by_service'),

    # Appointments
    path('appointments/', list_appointments, name='appointments_list'),  # GET & POST
    path('appointments/<int:appointment_id>/', appointment_detail, name='appointment_detail'),
    path('appointments/<str:start_date>/<str:end_date>/', appointments_interval, name='appointments_interval'),
    path('appointments/today/', appointments_today, name='appointments_today'),
    path('appointments/recent/', appointments_recent, name='appointments_recent'),

    # Availability
    path('availability/<str:service_name>/<str:date_str>/', availability_for_service, name='availability'),

    # Clients
    path('clients/count/', clients_count, name='clients_count'),
    path('clients/<int:client_id>/medical_records/', get_clients_medical_record, name='clients_medical_records'),
    path('clients/<int:client_id>/', client_by_id, name='clients_by_id'),
    path('clients/', clients_post_get, name='clients_post_get'),

    # Working hours
    path('working_hours/staff/<int:staff_id>/', set_working_hours, name='working_hours_list'),

    # Medical records
    path('medical_records/', create_medical_record, name='medical_record_create'),
    path('medical_records/<int:record_id>/', client_medical_record_view, name='medical_record_edit'),



    # Days off
    path('daysoff/staffs/<int:staff_id>/', manage_days_off, name='manage_days_off'),
    path('daysoff/', get_days_off, name='manage_days_off'),

    # Report
    path("export-history/<int:patient_id>/", export_medical_history, name="export_medical_history"),

    # SSE
    path('stream/', notification_stream, name='notification-stream'),

]


