
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Notification } from '../types';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: number) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Mock initial notifications for demonstration
const initialNotifications: Notification[] = [
    { id: 1, type: 'forum_reply', title: 'New reply in "Clinical Cases"', message: 'Dr. Vikram Singh replied to your post about zirconia crowns.', timestamp: '2h ago', read: false },
    { id: 2, type: 'project_update', title: 'Task completed in "Bio-Active Research"', message: 'Dr. Arjun Mehta completed "Finalize research protocol".', timestamp: '1d ago', read: false },
    { id: 3, type: 'new_message', title: 'New message from Dr. Sneha Reddy', message: 'Can we discuss the outreach program schedule?', timestamp: '2d ago', read: true },
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now(),
            timestamp: 'Just now',
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const value = { notifications, addNotification, markAsRead, clearNotifications };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
