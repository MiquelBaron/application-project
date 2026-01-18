# appointments/notifications/sse.py
import json
import time
import threading
from django.http import StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
import logging

logger = logging.getLogger(__name__)

# Almacenamiento en memoria para SSE
user_messages = {}
messages_lock = threading.Lock()

@require_GET
@login_required
def notification_stream(request):
    """SSE stream - conexiones persistentes"""
    user_id = request.user.id
    logger.info(f"🎯 Usuario {user_id} conectado a SSE")

    def event_generator():
        try:
            # Mensaje de conexión
            yield f"data: {json.dumps({'type': 'connected', 'user_id': user_id})}\n\n"

            # Mantener conexión
            while True:
                user_key = f"user_{user_id}"

                with messages_lock:
                    if user_key in user_messages and user_messages[user_key]:
                        message = user_messages[user_key].pop(0)
                        yield f"data: {json.dumps(message)}\n\n"
                        logger.info(f"📤 Mensaje enviado a usuario {user_id}")
                    else:
                        # Keep-alive
                        yield ":keep-alive\n\n"

                time.sleep(1)

        except GeneratorExit:
            logger.info(f"Usuario {user_id} desconectado")
        except Exception as e:
            logger.error(f"❌ Error en SSE: {e}")

    response = StreamingHttpResponse(
        event_generator(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

def add_notification_to_queue(user_id, message):
    """Añade notificación a la cola del usuario"""
    user_key = f"user_{user_id}"

    with messages_lock:
        if user_key not in user_messages:
            user_messages[user_key] = []

        user_messages[user_key].append(message)
        logger.info(f"Notificación en cola para usuario {user_id}")

    return True