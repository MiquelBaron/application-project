from .base import *
import os

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'mydb'),
        'USER': os.getenv('POSTGRES_USER', 'myuser'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'mypass'),
        'HOST': 'postgres',  
        'PORT': os.getenv('POSTGRES_PORT', 5432),
    }
}

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

if not REDIS_HOST:
    raise RuntimeError("REDIS_HOST is required in production")


CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:3000"
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost:8000",


]
CORS_ALLOW_CREDENTIALS = True