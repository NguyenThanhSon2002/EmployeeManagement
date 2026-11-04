import { create } from 'zustand';
import { notificationService } from '../api/notificationService';
import type { AppNotification } from '../types/notification.types';
import { useUIStore } from '@/shared/store/useUIStore';

export type SwapInboxTab = 'INBOX' | 'SENT' | 'MANAGER';

export interface PendingSwapOpen {
    swapId: number | null;
    tab: SwapInboxTab | null;
}

interface NotificationState {
    items: AppNotification[];
    unreadCount: number;
    lastSeenId: number | null;
    pendingOpen: PendingSwapOpen | null;
    requestOpenSwapInbox: (req: PendingSwapOpen) => void;
    consumePendingOpen: () => void;

    refresh: () => Promise<void>;
    markRead: (id: number) => Promise<void>;
    markAllRead: () => Promise<void>;
    reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    items: [],
    unreadCount: 0,
    lastSeenId: null,
    pendingOpen: null,
    requestOpenSwapInbox: (req) => set({ pendingOpen: req }),
    consumePendingOpen: () => set({ pendingOpen: null }),

    refresh: async () => {
        try {
            const [items, unreadCount] = await Promise.all([
                notificationService.list(),
                notificationService.unreadCount(),
            ]);

            const { lastSeenId } = get();
            const maxId = items.reduce((m, n) => Math.max(m, n.id), 0);

            // Từ lần hỏi thứ 2 trở đi, thông báo mới (id lớn hơn lần trước) sẽ hiện Toast
            if (lastSeenId !== null) {
                const fresh = items.filter((n) => n.id > lastSeenId && !n.isRead);
                fresh.slice(0, 3).forEach((n) =>
                    useUIStore.getState().addToast({
                        type: 'info',
                        title: n.title,
                        message: n.message,
                        durationMs: 6000,
                    })
                );
                if (fresh.length > 3) {
                    useUIStore.getState().addToast({
                        type: 'info',
                        title: 'Thông báo mới',
                        message: `Và ${fresh.length - 3} thông báo khác, bấm vào chuông để xem.`,
                        durationMs: 6000,
                    });
                }
            }

            set({ items, unreadCount, lastSeenId: Math.max(lastSeenId ?? 0, maxId) });
        } catch {
            // Bỏ qua lỗi mạng tạm thời, lần hỏi sau sẽ thử lại
        }
    },

    markRead: async (id: number) => {
        set((state) => ({
            items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        try {
            await notificationService.markRead(id);
        } catch {
            await get().refresh();
        }
    },

    markAllRead: async () => {
        set((state) => ({
            items: state.items.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        }));
        try {
            await notificationService.markAllRead();
        } catch {
            await get().refresh();
        }
    },

    reset: () => set({ items: [], unreadCount: 0, lastSeenId: null }),
}));