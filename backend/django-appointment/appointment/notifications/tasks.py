# appointments/notifications/tasks.py
import logging
from appointment.notifications.sse import add_notification_to_queue

logger = logging.getLogger(__name__)


def send_appointment_notification(appointment, notification_type:str):
    """Envía notificación de nueva cita"""
    from appointment.models import Notification
    from django.contrib.auth import get_user_model
    from django.contrib.auth.models import Group

    try:
        User = get_user_model()

        staff_user = appointment.staff_member.user

        # Obtener grupo admins
        try:
            admin_group = Group.objects.get(name='Admins')
            admins = admin_group.user_set.all()
        except Group.DoesNotExist:
            logger.warning("El grupo 'Admins' no existe")
            admins = User.objects.none()

        recipients = [staff_user] + list(admins)
        print("Recipients: {}".format(recipients))
        notification_data = {
            "type": notification_type,
            "appointment_id": appointment.id,
            "client": f"{appointment.client.first_name} {appointment.client.last_name}",
            "service": appointment.service.name,
            "date": str(appointment.date),
            "start_time": str(appointment.start_time),
            "staff": staff_user.get_full_name(),
            "duration": appointment.service.get_duration_readable(),
        }

        notifications_to_create = []
        for user in recipients:
            notifications_to_create.append(
                Notification(user=user, message=notification_data)
            )

        Notification.objects.bulk_create(notifications_to_create)

        # ✅ Enviar a usuarios conectados
        for user in recipients:
            add_notification_to_queue(user.id, notification_data)

        logger.info(f"✅ Notificaciones guardadas para {len(recipients)} usuarios")
        return True

    except Exception as e:
        logger.error(f"❌ Error enviando notificación: {e}")
        return False