import json
import time
from django.conf import settings
from django.http import StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET

# Diccionario global en dev
DEV_QUEUE = {}

if settings.REDIS_HOST:
    import redis
    r = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=getattr(settings, "REDIS_PASSWORD", None),
        db=0,
        decode_responses=True
    )
else:
    r = None  # usaremos DEV_QUEUE en memoria

@require_GET
@login_required
def notification_stream(request):
    user_id = str(request.user.id)

    def event_generator():
        # mensaje inicial
        yield f"data: {json.dumps({'type': 'connected', 'user_id': user_id})}\n\n"

        while True:
            if r:
                # Redis
                message = r.brpop(f"user:{user_id}", timeout=1)
                if message:
                    _, data = message
                    yield f"data: {data}\n\n"
                else:
                    yield ":keep-alive\n\n"
            else:
                # Dev: diccionario
                messages = DEV_QUEUE.get(user_id, [])
                while messages:
                    yield f"data: {json.dumps(messages.pop(0))}\n\n"
                time.sleep(1)
                yield ":keep-alive\n\n"

    response = StreamingHttpResponse(
        event_generator(),
        content_type="text/event-stream"
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

def add_notification_to_queue(user_id, message):
    user_id = str(user_id)
    if r:
        r.lpush(f"user:{user_id}", json.dumps(message))
    else:
        DEV_QUEUE.setdefault(user_id, []).append(message)
