// pages/NotificationPage.tsx
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationPage() {
  const { notifications, isConnected, clearNotifications, removeNotification } = useNotifications();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
              <p className="text-gray-600 mt-1">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                <span className={`ml-4 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? '● Connected' : '● Disconnected'}
                </span>
              </p>
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-lg">No notifications</p>
                <p className="text-sm mt-1">New appointments will appear here automatically</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">New appointment booked</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {formatTime(notification.receivedAt)}
                      </span>
                      <button 
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-black">Client:</span>
                      <p className="font-medium">{notification.client}</p>
                    </div>

                    <div>
                      <span className="text-black">Service:</span>
                      <p>{notification.service}</p>
                    </div>

                    <div>
                      <span className="text-black">Date:</span>
                      <p>{formatDate(notification.date)}</p>
                    </div>

                    <div>
                      <span className="text-black">Time:</span>
                      <p>{notification.start_time}</p>
                    </div>

                    <div>
                      <span className="text-black">Duration:</span>
                      <p>{notification.duration}</p>
                    </div>

                    <div>
                      <span className="text-black">Staff member:</span>
                      <p>{notification.staff}</p>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}