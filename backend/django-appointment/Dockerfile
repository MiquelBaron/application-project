FROM python:3.11-slim AS base
WORKDIR /app
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Dependencias nativas para WeasyPrint
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info \
    libgobject-2.0-0 \
    gir1.2-pango-1.0 \
    && rm -rf /var/lib/apt/lists/*


COPY . .

# Stage dev
FROM base AS development
ENV DJANGO_SETTINGS_MODULE=appointments.settings.dev
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Stage prod
FROM base AS production
ENV DJANGO_SETTINGS_MODULE=appointments.settings.prod
EXPOSE 8000
CMD ["gunicorn", "appointments.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
