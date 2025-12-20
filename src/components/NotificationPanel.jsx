'use client'

import React, { useState, useEffect } from 'react';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      // In a real scenario, you'd use the auth token. 
      // For this open dashboard, we might mock or use a public endpoint if available.
      // Since the backend requires auth for /notifications, we will skip fetching if no auth.
      // Or we can assume this is an admin dashboard for now.
      
      // Placeholder for now as auth is not fully wired up in frontend
      // setNotifications([]); 
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            <span className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">Mark all read</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
