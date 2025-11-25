// components/NotificationCenter.tsx
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";

export function NotificationCenter() {
  const { notifications, isConnected, clearNotifications, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(true);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50"
      >
        🔔 {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
              {notifications.length}
            </span>
          )}
          <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </span>
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={clearNotifications}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="overflow-y-auto max-h-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className="p-4 border-b hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-sm">New appointment</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(notification.receivedAt)}
                  </span>
                  <button 
                    onClick={() => removeNotification(notification.id)}
                    className="text-xs text-gray-400 hover:text-red-500 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">{notification.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span>{notification.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{formatDate(notification.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span>{notification.start_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Staff:</span>
                  <span>{notification.staff}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}