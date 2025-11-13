# admin.py
# Path: appointment/admin.py

"""
Author: Miquel Barón
Since: 1.0.0
"""
from django import forms
from django.contrib import admin
from django.contrib.auth.models import Group, User
from .models import StaffMember
from .models import WorkingHours, DAYS_OF_WEEK
from django import forms
from django.contrib import admin
import datetime
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Service, Client, DayOff, Appointment, StaffMember, Config, User, MedicalRecord
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin


# TODO Extract forms to forms.py to be used in user interface too.

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('client',)

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('username', 'email', 'get_groups')

    def get_groups(self, obj):
        return ", ".join([g.name for g in obj.groups.all()])

    get_groups.short_description = 'Groups'

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "first_name", "last_name", "email", "phone_number", "created_at")
    search_fields = ("first_name", "last_name", "email", "phone_number")
    list_filter = ("created_at", "updated_at")
    ordering = ("-created_at",)

class ServiceForm(forms.ModelForm):
    # Campo temporal para el admin en minutos
    duration_minutes = forms.IntegerField(
        label="Duration (minutes)",
        min_value=1,
        help_text="Enter duration in minutes"
    )

    class Meta:
        model = Service
        exclude = ['duration']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Si el objeto ya existe, mostramos los minutos actuales
        if self.instance and self.instance.duration:
            total_minutes = int(self.instance.duration.total_seconds() // 60)
            self.fields['duration_minutes'].initial = total_minutes

    def clean_duration_minutes(self):
        minutes = self.cleaned_data['duration_minutes']
        if minutes < 1:
            raise forms.ValidationError("Duration must be at least 1 minute")
        return minutes

    def save(self, commit=True):
        seconds = self.cleaned_data['duration_minutes'] * 60
        self.instance.duration = datetime.timedelta(seconds=seconds)
        return super().save(commit=commit)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    form = ServiceForm
    list_display = ('id','name', 'duration', 'price', 'get_staff_members', 'created_at', 'updated_at',)
    search_fields = ('name',)
    list_filter = ('duration',)
    readonly_fields = ('get_staff_members',)

    def get_staff_members(self, obj):
        # obj es un Service
        return ", ".join([staff.user.get_full_name() for staff in obj.staff_members.all()])

    get_staff_members.short_description = "Staff Members"





@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'staff_member', 'service', 'get_service_duration', 'date', 'get_start_time', 'get_end_time')
    list_filter = ('staff_member','date','service')

    def get_start_time(self, obj):
        return obj.start_time.strftime("%H:%M")
    get_start_time.short_description = 'Start Time'

    def get_end_time(self, obj):
        return obj.end_time.strftime("%H:%M")
    get_end_time.short_description = 'End Time'

    def get_service_duration(self, obj):
        # Formatea duration timedelta como horas:minutos
        total_minutes = int(obj.service.duration.total_seconds() // 60)
        return f"{total_minutes} min"
    get_service_duration.short_description = 'Service Duration'



@admin.register(Config)
class ConfigAdmin(admin.ModelAdmin):
    list_display = (
        'slot_duration', 'lead_time', 'finish_time', 'appointment_buffer_time', 'website_name', 'app_offered_by_label')


class StaffMemberForm(forms.ModelForm):
    class Meta:
        model = StaffMember
        fields = '__all__'
        widgets = {
            "services_offered": forms.CheckboxSelectMultiple,
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            staff_group = Group.objects.get(name="Staff")
            # Suponiendo que el campo se llama 'user' o 'users'
            if 'user' in self.fields:
                self.fields['user'].queryset = User.objects.filter(groups=staff_group)
            elif 'users' in self.fields:
                self.fields['users'].queryset = User.objects.filter(groups=staff_group)
        except Group.DoesNotExist:
            # Si no existe el grupo, dejamos el queryset vacío
            if 'user' in self.fields:
                self.fields['user'].queryset = User.objects.none()
            elif 'users' in self.fields:
                self.fields['users'].queryset = User.objects.none()

    def clean(self):
        cleaned_data = super().clean()
        users = cleaned_data.get('users') or [cleaned_data.get('user')]
        if users:
            staff_group = Group.objects.get(name="Staff")
            for user in users:
                if not user.groups.filter(id=staff_group.id).exists():
                    raise forms.ValidationError(f"User {user.username} is not in the Staff group")
        return cleaned_data

@admin.register(StaffMember)
class StaffMemberAdmin(admin.ModelAdmin):
    form = StaffMemberForm
    list_display = (
        'get_staff_member_name', 'get_slot_duration','get_services_offered', 'finish_time', 'work_on_saturday', 'work_on_sunday')
    list_filter = ('work_on_saturday', 'work_on_sunday', 'lead_time', 'finish_time')


@admin.register(DayOff)
class DayOffAdmin(admin.ModelAdmin):
    list_display = ('staff_member', 'start_date', 'end_date', 'description')
    search_fields = ('description',)
    list_filter = ('start_date', 'end_date')

class WorkingHoursForm(forms.ModelForm):
    day_of_week = forms.MultipleChoiceField(
        choices=DAYS_OF_WEEK,
        widget=forms.CheckboxSelectMultiple
    )

    class Meta:
        model = WorkingHours
        fields = '__all__'

    def clean_day_of_week(self):
        # Convertir la lista de strings a lista de ints
        days = self.cleaned_data['day_of_week']
        return [int(day) for day in days]

from .chatbot_api.forms import *

@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    form = WorkingHoursForm
    list_display = ('staff_member', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week', 'staff_member')
    search_fields = ('staff_member__user__first_name', 'staff_member__user__last_name')






