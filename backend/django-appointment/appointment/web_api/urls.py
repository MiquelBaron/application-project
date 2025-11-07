from django.urls import path
from .views_admin import *
from .views.admin_views import *
from .views.auth import *
from .views.views import *

staff_member_view = StaffMemberView.as_view()
service_view = ServiceView.as_view()

urlpatterns = [
    # Auth
    path('login/', login_user, name='staff_login'),
    path('logout/', logout_user, name='staff_logout'),

    # Staff Members
    path('staffs/', staffs_list, name='staffs_list'),
    path('staffs/<int:object_id>/', staff_member_view, name='staff_detail'),  # BaseModelView
    path('staffs/create/', staff_member_view, name='staff_create'),  # POST

    # Services
    path('services/', services_list, name='services_list'),
    path('services/<int:object_id>/', service_view, name='service_detail'),
    path('services/create/', service_view, name='service_create'),  # POST
    path('services/<int:object_id>/edit/', service_view, name='service_edit'),  # PUT
    path('services/<int:object_id>/delete/', service_view, name='service_delete'),  # DELETE

    # Appointments
    path('appointments/', list_appointments, name='appointments_list'),  # GET & POST
    path('appointments/<int:appointment_id>/', appointment_detail, name='appointment_detail'),

    # Availability
    path('availability/<str:service_name>/<str:date_str>/', availability, name='availability'),

    # Clients
    path('clients/',get_clients,name='clients_list'),
]