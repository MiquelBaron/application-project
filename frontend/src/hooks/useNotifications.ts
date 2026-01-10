// hooks/useNotifications.js
import { useEffect, useState } from 'react';

// Normaliza eventos SSE a algo que el frontend pueda usar
const normalizeNotification = (data) => {
    switch (data.type) {
        case 'appointment.created':
            return {
                ...data,
                variant: 'created',
                title: 'New appointment booked',
                color: 'blue',
            };

        case 'appointment.deleted':
            return {
                ...data,
                variant: 'deleted',
                title: 'Appointment cancelled',
                color: 'red',
            };

        default:
            return null;
    }
};

export const useNotifications = () => {
    // Cargar notificaciones guardadas en localStorage
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('app-notifications');
        return saved ? JSON.parse(saved) : [];
    });

    const [isConnected, setIsConnected] = useState(false);

    // Guardar en localStorage cuando cambian
    useEffect(() => {
        localStorage.setItem('app-notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        console.log('🔗 Connecting SSE...');
        const eventSource = new EventSource('http://localhost:8001/v1/api/stream/', {
            withCredentials: true
        });

        eventSource.onopen = () => {
            console.log('✅ SSE connected');
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            if (event.data.startsWith(':')) return; // keep-alive

            try {
                const data = JSON.parse(event.data);
                const normalized = normalizeNotification(data);

                if (!normalized) return;

                const notificationWithMeta = {
                    ...normalized,
                    // Usamos appointment_id como id para React
                    id: normalized.appointment_id,
                    receivedAt: new Date().toISOString(),
                };

                setNotifications(prev => {
                    // Reemplaza notificaciones previas del mismo appointment
                    const filtered = prev.filter(n => n.appointment_id !== normalized.appointment_id);
                    return [notificationWithMeta, ...filtered];
                });

            } catch (error) {
                console.error('❌ Error parsing SSE:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('❌ SSE error:', error);
            setIsConnected(false);
        };

        return () => {
            console.log('👋 Closing SSE connection');
            eventSource.close();
        };
    }, []);

    // Limpiar todas las notificaciones
    const clearNotifications = () => {
        setNotifications([]);
    };

    // Remover una notificación específica
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    return { 
        notifications, 
        isConnected, 
        clearNotifications,
        removeNotification
    };
};
