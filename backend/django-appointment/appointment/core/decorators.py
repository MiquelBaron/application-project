# chatbot_api/decorators.py
import os

import dotenv
from django.http import JsonResponse
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('API_KEY')
def require_api_key(view_func):
    def _wrapped_view(request, *args, **kwargs):
        api_key = request.headers.get("X-API-Key")

        if api_key != API_KEY:
            return JsonResponse({"error": "Bad chatbot_api key. Unauthorized"}, status=401)
        return view_func(request, *args, **kwargs)

    return _wrapped_view
