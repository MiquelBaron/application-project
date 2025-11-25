// hooks/useNotifications.js
import { useEffect, useState } from 'react';

export const useNotifications = () => {
    // Load notifications from localStorage on startup
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('app-notifications');
        return saved ? JSON.parse(saved) : [];
    });
    const [isConnected, setIsConnected] = useState(false);

    // Save to localStorage when notifications change
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
            if (event.data.startsWith(':')) {
                console.log('💓 SSE keep-alive');
                return;
            }
            
            try {
                const data = JSON.parse(event.data);
                console.log('📨 New SSE notification:', data);
                
                if (data.type === 'appointment_created') {
                    // Add timestamp for sorting
                    const notificationWithTime = {
                        ...data,
                        id: Date.now(), // Unique ID
                        receivedAt: new Date().toISOString()
                    };
                    
                    setNotifications(prev => [notificationWithTime, ...prev]);
                }
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

    // Function to clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
    };

    // Function to remove a specific notification
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