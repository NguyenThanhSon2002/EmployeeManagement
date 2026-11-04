import { api } from '@/shared/api/apiClient';
import type { AppNotification, NotificationType } from '../types/notification.types';

interface NotificationDtoRaw {
    id: number;
    type: string;
    title: string;
    message: string;
    ref_type: string | null;
    ref_id: number | null;
    is_read: boolean;
    created_at: string;
}

function mapNotification(n: NotificationDtoRaw): AppNotification {
    return {
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        refType: n.ref_type ?? null,
        refId: n.ref_id ?? null,
        isRead: Boolean(n.is_read),
        createdAt: n.created_at,
    };
}

export const notificationService = {
    list: async (): Promise<AppNotification[]> => {
        const raw = await api.get<NotificationDtoRaw[]>('/notifications');
        return (raw || []).map(mapNotification);
    },

    unreadCount: async (): Promise<number> => {
        const res = await api.get<{ count: number }>('/notifications/unread-count');
        return res?.count ?? 0;
    },

    markRead: (id: number) => api.put<void>(`/notifications/${id}/read`),

    markAllRead: () => api.put<void>('/notifications/read-all'),
};