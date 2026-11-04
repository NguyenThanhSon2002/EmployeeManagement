export type NotificationType =
    | 'SWAP_REQUESTED'
    | 'SWAP_CREATED_ON_BEHALF'
    | 'SWAP_PEER_ACCEPTED'
    | 'SWAP_PEER_REJECTED'
    | 'SWAP_PENDING_MANAGER'
    | 'SWAP_APPROVED'
    | 'SWAP_REJECTED'
    | 'SWAP_CANCELLED';

export interface AppNotification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    refType: string | null;
    refId: number | null;
    isRead: boolean;
    createdAt: string;
}