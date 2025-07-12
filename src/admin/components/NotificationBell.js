import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = ref(database, `notifications/${currentUser.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const notifList = Object.entries(data).map(([id, notif]) => ({ id, ...notif }));
      setNotifications(notifList);
      const unread = notifList.filter(n => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      markAllAsRead();
    }
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    const updates = {};
    notifications.forEach(n => {
      if (!n.read) {
        updates[`notifications/${currentUser.uid}/${n.id}/read`] = true;
      }
    });
    update(ref(database), updates);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-gray-700 hover:text-gray-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 font-semibold border-b border-gray-200">Notifications</div>
          {notifications.length === 0 && (
            <div className="p-4 text-gray-500">No notifications</div>
          )}
          <ul>
            {notifications.map((notif) => (
              <li key={notif.id} className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${notif.read ? 'bg-gray-50' : 'bg-white font-semibold'}`}>
                <div>{notif.message}</div>
                <div className="text-xs text-gray-400">{new Date(notif.timestamp).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
