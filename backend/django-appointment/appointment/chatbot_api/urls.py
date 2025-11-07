from django.urls import path
from .views.availability import api_get_availability
from .views.appointments import appointment, delete_appointment
from .views.clients import get_clients, register_new_client, client_detail, get_client_appointments
from .views.services import list_services, get_services_names, list_some_services_info



urlpatterns = [
    path('services/', list_services, name='list_services'),
    path('services/names/', get_services_names, name='get_services_name'),
    path('services/info/', list_some_services_info, name='list_some_services_info'),

    path('availability/<str:date_str>/<str:service_name>/', api_get_availability, name='api_get_free_slots'),

    path('appointments/', appointment, name='create_modify_appointment'),
    path('appointments/<str:date>/<str:start_time>/<str:client_phone>/', delete_appointment, name='delete_appointment'),

    path('clients/', get_clients, name='get_clients'),
    path('clients/register/', register_new_client, name='register_new_client'),
    path('clients/<str:phone>/', client_detail, name='search_client_by_phone'),
    path("clients/<str:phone_number>/appointments/", get_client_appointments, name='get_client_appointments'),
]

