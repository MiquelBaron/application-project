from .base import *
import os

DEBUG = False

# Base de datos PostgreSQL usando variables de entorno
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

# Cache con Redis
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
    "http://localhost:3000",  # frontend Vite
    "http://127.0.0.1:3000",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True