
"""
Author: Miquel Barón
Since: 1.0.0
"""

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def send_notification_ws(message):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        "admin_notifications",
        {
            "type": "send_notification",
            "message": message,
        }
    )