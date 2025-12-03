# models.py
# Path: appointment/models.py


import datetime

from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator, MinLengthValidator, MinValueValidator
from django.db import models
from django import forms
from django.http import JsonResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField

from .core.date_time import convert_minutes_in_human_readable_format, get_timestamp, get_weekday_num, \
    time_difference, combine_date_and_time

PAYMENT_TYPES = (
    ('full', _('Full payment')),
    ('down', _('Down payment')),
)

DAYS_OF_WEEK = (
    (0, 'Monday'),
    (1, 'Tuesday'),
    (2, 'Wednesday'),
    (3, 'Thursday'),
    (4, 'Friday'),
    (5, 'Saturday'),
    (6, 'Sunday'),
)

from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass

class Service(models.Model):

    name = models.CharField(max_length=100, blank=False)
    description = models.TextField(blank=True, null=True)
    duration = models.DurationField(validators=[MinValueValidator(datetime.timedelta(seconds=1))])
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='EUR', validators=[MaxLengthValidator(3), MinLengthValidator(3)], help_text="Divisa")

    allow_rescheduling = models.BooleanField(
        default=True,
        help_text=_("Indicates whether appointments for this service can be rescheduled.")
    )


    # meta data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": str(self.price)  # Convert Decimal to string for JSON serialization
        }

    @property
    def assigned_staff(self):
        return self.staff_members.all()

    def get_duration_parts(self):
        total_seconds = int(self.duration.total_seconds())
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return days, hours, minutes, seconds

    def get_duration_readable(self):
        days, hours, minutes, seconds = self.get_duration_parts()
        parts = []

        if days:
            parts.append(f"{days} day{'s' if days > 1 else ''}")
        if hours:
            parts.append(f"{hours} hour{'s' if hours > 1 else ''}")
        if minutes:
            parts.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
        if seconds:
            parts.append(f"{seconds} second{'s' if seconds > 1 else ''}")

        return ' '.join(parts)

    def get_price(self):
        # Check if the decimal part is 0
        if self.price % 1 == 0:
            return int(self.price)  # Return as an integer
        else:
            return self.price  # Return the original float value


    def get_price_text(self):
        if self.price == 0:
            return "Free"
        else:
            return f"{self.get_price()}{self.get_currency_icon()}"

    def get_down_payment(self):
        if self.down_payment % 1 == 0:
            return int(self.down_payment)  # Return as an integer
        else:
            return self.down_payment  # Return the original float value

    def get_down_payment_text(self):
        if self.down_payment == 0:
            return f"Free"
        return f"{self.get_down_payment()}{self.get_currency_icon()}"

    def get_image_url(self):
        if not self.image:
            return ""
        return self.image.url

    def is_a_paid_service(self):
        return self.price > 0

    def accepts_down_payment(self):
        return self.down_payment > 0

    @classmethod
    def get_service_by_name(cls, name):
        return cls.objects.filter(name__iexact=name).first()

class StaffMember(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    services_offered = models.ManyToManyField(Service, related_name='staff_members', blank=True)
    slot_duration = models.PositiveIntegerField(
        null=True, blank=True, default=30,
        help_text=_("Intervals in which clients can book and appointment. Default 30")
    )
    lead_time = models.TimeField(
        null=True, blank=True,
        help_text=_("Time when the staff member starts working.")
    )
    finish_time = models.TimeField(
        null=True, blank=True,
        help_text=_("Time when the staff member stops working.")
    )
    appointment_buffer_time = models.FloatField(
        blank=True, null=True,
        help_text=_("Time between now and the first available slot for the current day (doesn't affect tomorrow). "
                    "e.g: If you start working at 9:00 AM and the current time is 8:30 AM and you set it to 30 "
                    "minutes, the first available slot will be at 9:00 AM. If you set the appointment buffer time to "
                    "60 minutes, the first available slot will be at 9:30 AM.")
    )

    set_timetable = models.BooleanField(default=False)

    work_on_saturday = models.BooleanField(default=False)
    work_on_sunday = models.BooleanField(default=False)

    # meta data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_staff_member_name()}"

    def get_slot_duration(self):
        config = Config.objects.first()
        return self.slot_duration or (config.slot_duration if config else 0)

    def get_slot_duration_text(self):
        slot_duration = self.get_slot_duration()
        return convert_minutes_in_human_readable_format(slot_duration)

    def get_lead_time(self):
        config = Config.objects.first()
        return self.lead_time or (config.lead_time if config else None)

    def get_finish_time(self):
        config = Config.objects.first()
        return self.finish_time or (config.finish_time if config else None)

    def works_on_both_weekends_day(self):
        return self.work_on_saturday and self.work_on_sunday

    def get_staff_member_name(self):
        name_options = [
            getattr(self.user, 'get_full_name', lambda: '')(),
            f"{self.user.first_name} {self.user.last_name}",
            self.user.username,
            self.user.email,
            f"Staff Member {self.id}"
        ]
        return next((name.strip() for name in name_options if name.strip()), "Unknown")

    def get_staff_member_first_name(self):
        return self.user.first_name

    def get_non_working_days(self):
        non_working_days = []

        if not self.work_on_saturday:
            non_working_days.append(6)  # Saturday
        if not self.work_on_sunday:
            non_working_days.append(0)  # Sunday
        return non_working_days

    def get_weekend_days_worked_text(self):
        if self.work_on_saturday and self.work_on_sunday:
            return _("Saturday and Sunday")
        elif self.work_on_saturday:
            return _("Saturday")
        elif self.work_on_sunday:
            return _("Sunday")
        else:
            return _("None")

    def get_services_offered(self):
        return [service.name for service in self.services_offered.all()]

    def get_service_offered_text(self):
        return ', '.join([service.name for service in self.services_offered.all()])

    def get_service_is_offered(self, service_id):
        return self.services_offered.filter(id=service_id).exists()

    def get_appointment_buffer_time(self):
        config = Config.objects.first()
        return self.appointment_buffer_time or (config.appointment_buffer_time if config else 0)

    def get_appointment_buffer_time_text(self):
        # convert buffer time (which is in minutes) in day hours minutes if necessary
        return convert_minutes_in_human_readable_format(self.get_appointment_buffer_time())

    def get_days_off(self):
        return DayOff.objects.filter(staff_member=self)

    def get_working_hours(self):
        return

    def update_upon_working_hours_deletion(self, day_of_week: int):
        if day_of_week == 6:
            self.work_on_saturday = False
        elif day_of_week == 0:
            self.work_on_sunday = False
        self.save()

    def is_working_day(self, day: int):
        return day not in self.get_non_working_days()




class Appointment(models.Model):
    """
    Represents an appointment made by a client. It is created when the client confirms the appointment request.

    """
    client = models.ForeignKey(
        'Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments'
    )
    service = models.ForeignKey('Service', on_delete=models.SET_NULL, null=True)
    additional_info = models.TextField(blank=True, null=True)
    staff_member = models.ForeignKey('StaffMember', on_delete=models.SET_NULL, null=True)
    date = models.DateField(null=False, blank=False, default=datetime.date.today)
    start_time = models.TimeField(null=False, blank=False,default=datetime.time(0, 0))
    end_time = models.TimeField(null=False, blank=False, default=datetime.time(0, 0))
    # meta datas
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['staff_member', 'start_time', 'date'],
                                    name='unique_appointment_per_staff')
        ]
        indexes = [
            models.Index(fields=['staff_member', 'date']),
        ]
        permissions = [
            ("can_view_sensitive_info", "Can view sensitive appointment information"),
        ]
    def __str__(self):
        start_dt = combine_date_and_time(self.date, self.start_time)
        end_dt = combine_date_and_time(self.date, self.end_time)
        return f"{self.client} - {start_dt.strftime('%Y-%m-%d %H:%M')} to {end_dt.strftime('%H:%M')} ({self.service.name})"

    def clean(self):
        start = datetime.datetime.combine(self.date, self.start_time)
        end = datetime.datetime.combine(self.date, self.end_time) if self.end_time else start + self.service.duration

        # Buscar citas solapadas del mismo profesional y mismo día
        overlaps = Appointment.objects.filter(
            staff_member=self.staff_member,
            date=self.date,  # solo comparar en la misma fecha
            start_time__lt=end.time(),
            end_time__gt=start.time(),
        ).exclude(pk=self.pk)

        if overlaps.exists():
            return JsonResponse({"Error":"No availability"})

    def save(self, *args, **kwargs):
        self.clean()
        return super().save(*args, **kwargs)

    def get_client_name(self):
        return self.client.get_full_name() if self.client else ""

    def get_client_email(self):
        return self.client.email if self.client and self.client.email else ""

    def get_client_number(self):
        return self.client.phone_number if self.client and self.client.phone_number else ""

    def get_date(self):
        return self.date

    def get_start_time(self):
        return datetime.datetime.combine(self.get_date(), self.start_time)

    def get_end_time(self):
        return datetime.datetime.combine(self.get_date(), self.end_time)

    def get_service(self):
        return self.service

    def get_service_name(self):
        return self.service.name if self.service else ""

    def get_service_duration(self):
        return self.service.duration if self.service else ""

    def get_service_price(self):
        return self.service.price if self.service else ""

    def get_appointment_amount_to_pay(self):
        pass

    def get_appointment_amount_to_pay_text(self):
       pass

    def get_appointment_currency(self):
        return self.service.currency

    def get_appointment_id_request(self):
        return self.id

    def set_appointment_paid_status(self, status: bool):
        self.paid = status
        self.save()

    def get_absolute_url(self, request=None):
        url = reverse('appointment:display_appointment', args=[str(self.id)])
        return request.build_absolute_uri(url) if request else url

    @staticmethod
    def is_valid_date(appt_date, start_time, staff_member, current_appointment_id, weekday: str):
        weekday_num = get_weekday_num(weekday)
        sm_name = staff_member.get_staff_member_name()

        # Check if the staff member works on the given day
        try:
            working_hours = WorkingHours.objects.get(staff_member=staff_member, day_of_week=weekday_num)
        except WorkingHours.DoesNotExist:
            message = _("{staff_member} does not work on this day.").format(staff_member=sm_name)
            return False, message

        # Check if the start time falls within the staff member's working hours
        if not (working_hours.start_time <= start_time.time() <= working_hours.end_time):
            message = _("The appointment start time is outside of {staff_member}'s working hours.").format(
                staff_member=sm_name)
            return False, message

        # Check if the staff member already has an appointment on the given date and time
        # Using prefetch_related to reduce DB hits when accessing related objects
        appt_list = Appointment.objects.filter(staff_member=staff_member,
                                               date=appt_date).exclude(
            id=current_appointment_id).prefetch_related('appointment_request')
        for appt in appt_list:
            if appt.start_time <= start_time.time() <= appt.end_time:
                message = _("{staff_member} already has an appointment at this time.").format(staff_member=sm_name)
                return False, message

        # Check if the staff member has a day off on the appointment's date
        days_off = DayOff.objects.filter(staff_member=staff_member, start_date__lte=appt_date, end_date__gte=appt_date)
        if days_off.exists():
            message = _("{staff_member} has a day off on this date.").format(staff_member=sm_name)
            return False, message

        return True, ""

    def is_owner(self, staff_user_id):
        return self.staff_member.user.id == staff_user_id

    def to_dict(self):
        return {
            "id": self.id,
            "client_name": self.get_client_name(),
            "client_email": self.client.email,
            "start_time": self.start_time.strftime('%Y-%m-%d %H:%M'),
            "end_time": self.end_time.strftime('%Y-%m-%d %H:%M'),
            "service_name": self.service.name,
            "additional_info": self.additional_info,
            "paid": self.paid,
        }


class Config(models.Model):
    """
    Represents configuration settings for the appointment system. There can only be one Config object in the database.
    If you want to change the settings, you must edit the existing Config object.

    """
    slot_duration = models.PositiveIntegerField(
        null=True,
        help_text=_("Minimum time for an appointment in minutes, recommended 30."),
    )
    lead_time = models.TimeField(
        null=True,
        help_text=_("Time when we start working."),
    )
    finish_time = models.TimeField(
        null=True,
        help_text=_("Time when we stop working."),
    )
    appointment_buffer_time = models.FloatField(
        null=True,
        help_text=_("Time between now and the first available slot for the current day (doesn't affect tomorrow)."),
    )
    website_name = models.CharField(
        max_length=255,
        default="",
        help_text=_("Name of your website."),
    )
    app_offered_by_label = models.CharField(
        max_length=255,
        default=_("Offered by"),
        help_text=_("Label for `Offered by` on the appointment page")
    )
    default_reschedule_limit = models.PositiveIntegerField(
        default=3,
        help_text=_("Default maximum number of times an appointment can be rescheduled across all services.")
    )
    allow_staff_change_on_reschedule = models.BooleanField(
        default=True,
        help_text=_("Allows clients to change the staff member when rescheduling an appointment.")
    )

    # meta data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if Config.objects.exists() and not self.pk:
            raise ValidationError(_("You can only create one Config object"))
        if self.lead_time is not None and self.finish_time is not None:
            if self.lead_time >= self.finish_time:
                raise ValidationError(_("Lead time must be before finish time"))
        if self.appointment_buffer_time is not None and self.appointment_buffer_time < 0:
            raise ValidationError(_("Appointment buffer time cannot be negative"))
        if self.slot_duration is not None and self.slot_duration <= 0:
            raise ValidationError(_("Slot duration must be greater than 0"))

    def save(self, *args, **kwargs):
        self.clean()
        self.pk = 1
        super(Config, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def get_instance(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"Config {self.pk}: slot_duration={self.slot_duration}, lead_time={self.lead_time}, " \
               f"finish_time={self.finish_time}"


class DayOff(models.Model):
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.CharField(max_length=255, blank=True, null=True)

    # meta data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.start_date} to {self.end_date} - {self.description if self.description else 'Day off'}"

    def clean(self):
        if self.start_date is not None and self.end_date is not None:
            if self.start_date > self.end_date:
                raise ValidationError(_("Start date must be before end date"))

    def is_owner(self, user_id):
        return self.staff_member.user.id == user_id


class WorkingHours(models.Model):
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE)
    day_of_week = models.PositiveIntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()

    # meta data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_day_of_week_display()} - {self.start_time} to {self.end_time}"

    def save(self, *args, **kwargs):
        # Call the original save method
        super(WorkingHours, self).save(*args, **kwargs)

        # Update staff member's weekend working status
        if self.day_of_week == '6' or self.day_of_week == 6:  # Saturday
            self.staff_member.work_on_saturday = True
        elif self.day_of_week == '0' or self.day_of_week == 0:  # Sunday
            self.staff_member.work_on_sunday = True
        self.staff_member.save()

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")

    def get_start_time(self):
        return self.start_time

    def get_end_time(self):
        return self.end_time

    def get_day_of_week_str(self):
        # return the name of the day instead of the integer
        return self.get_day_of_week_display()

    def is_owner(self, user_id):
        return self.staff_member.user.id == user_id

    class Meta:
        verbose_name = "Working Hour"
        verbose_name_plural = "Working Hours"
        unique_together = ['staff_member', 'day_of_week']


'''
Created for the CRM.
There was a 'Staff entity' but Clients where just users without staff permission.
Now there is a 'Client' entity to make easier to interact with Client methods and validations.
'''
class Client(models.Model):
    CLIENT_SOURCE_CHOICES = [
        ('referral', 'Referred by another patient'),
        ('website', 'Website'),
        ('social_media', 'Social media'),
        ('advertisement', 'Advertisement'),
        ('event', 'Event / Fair'),
        ('other', 'Other'),
    ]
    id = models.BigAutoField(primary_key=True)
    source = models.CharField(
        max_length=50,
        choices=CLIENT_SOURCE_CHOICES,
        default='other',
    )
    first_name = models.CharField(max_length=255, help_text="Nom")
    last_name = models.CharField(max_length=255, help_text="Cognoms")
    phone_number = PhoneNumberField(max_length=20, help_text="Telèfon", unique=True)
    email = models.EmailField(help_text="Adreça electrònica")
    extra_info = models.TextField(blank=True, null=True, max_length=1000, help_text="Informació addicional.")
    date_of_birth = models.DateField(null=True, blank=True, help_text="Data de naixement")
    gender = models.CharField(
        max_length=10,
        choices=[("M", "Male"), ("F", "Female"), ("O", "Other")],
        blank=True,
        null=True,
        help_text="Gender"
    )
    address = models.CharField(max_length=255, blank=True, null=True, help_text="Zip code")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Client")
        verbose_name_plural = _("Clients")

    def __str__(self):
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        if self.email:
            return self.email
        return f"Client {self.id}"

    def get_full_name(self):
        return str(self)

    @classmethod
    def exists_by_phone(cls, phone_number):
        phone_str = str(phone_number)
        return cls.objects.filter(phone_number=phone_str).exists()


class MedicalRecord(models.Model):
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name="medical_record")

    allergies = models.TextField(blank=True, null=True, help_text="Known allergies")
    medical_conditions = models.TextField(blank=True, null=True, help_text="Current medical conditions")
    medications = models.TextField(blank=True, null=True, help_text="Current medications")
    notes = models.TextField(blank=True, null=True, help_text="Doctor notes")
    blood_type = models.CharField(
        max_length=3,
        blank=True,
        null=True,
        choices=[("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"), ("AB+", "AB+"), ("AB-", "AB-"), ("O+", "O+"), ("O-", "O-")],
    )

    def __str__(self):
        return f"Fitxa mèdica de {self.client.first_name} {self.client.last_name}"


class Invoice(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="invoices")
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(
        max_length=20,
        choices=[("cash", "Cash"), ("card", "Card"), ("transfer", "Bank transfer"), ("insurance", "Insurance")]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def mark_as_paid(self):
        self.paid = True
        self.payment_date = timezone.now()
        self.save()

# For BI (KPI or events) --> new
class ActivityLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    target_type = models.CharField(max_length=100, blank=True, null=True)
    target_id = models.IntegerField(blank=True, null=True)
    details = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    message = models.JSONField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user} - {self.created_at}"