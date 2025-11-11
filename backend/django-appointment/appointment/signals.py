
from guardian.shortcuts import assign_perm
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from  django_q.tasks import async_task
from appointment.models import Appointment
from appointment.logger_config import get_logger
_logger = get_logger(__name__)


#Notify admins and assign permissions when a CRUD operation is applied to Appointment model.

@receiver(post_save, sender=Appointment)
def notify_and_add_permission(sender, instance, created, **kwargs):
    action = "created" if created else "updated"
    message = (f"An appointment has been {action} for client {instance.client.first_name} "
               f"{instance.client.last_name} for {instance.date} at {instance.start_time} for  {instance.service.name}.")
    _logger.debug(message)
    #TODO Uncomment async task when setting up django_q and web channels
    if created and instance.staff_member and instance.staff_member.user:
        pass
        #async_task('appointment.tasks.send_notification_ws', message)


@receiver(post_delete, sender=Appointment)
def notify_admin_on_appointment_delete(sender, instance, **kwargs):
    _logger.debug(f"Deleting appointment {instance.id if instance.id else None}")
    message = (f"An appointment has been deleted for {instance.client.first_name} "
               f"at {instance.date} for service {instance.service.name}, assigned to {instance.staff_member.user.get_full_name()}")

    _logger.debug(message)
    #async_task('appointment.tasks.send_notification_ws', message)


