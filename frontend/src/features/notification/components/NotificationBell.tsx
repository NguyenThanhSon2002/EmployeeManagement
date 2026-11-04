import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useLocation, useNavigate } from 'react-router-dom';

const POLL_INTERVAL_MS = 30_000;

/** Máy chủ trả giờ UTC dạng "2026-11-04T02:33:23" (không có múi giờ), nên coi là UTC. */
function parseServerTime(iso: string): Date {
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
    return new Date(hasZone ? iso : `${iso}Z`);
}

function timeAgo(iso: string): string {
    const time = parseServerTime(iso).getTime();
    if (Number.isNaN(time)) return '';
    const minutes = Math.floor((Date.now() - time) / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

export const NotificationBell: React.FC = () => {
    const items = useNotificationStore((s) => s.items);
    const unreadCount = useNotificationStore((s) => s.unreadCount);
    const refresh = useNotificationStore((s) => s.refresh);
    const markRead = useNotificationStore((s) => s.markRead);
    const markAllRead = useNotificationStore((s) => s.markAllRead);
    const reset = useNotificationStore((s) => s.reset);
    const requestOpenSwapInbox = useNotificationStore((s) => s.requestOpenSwapInbox);
    const navigate = useNavigate();
    const location = useLocation();

    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    // Khởi động / dừng vòng hỏi thông báo
    useEffect(() => {
        refresh();
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') refresh();
        }, POLL_INTERVAL_MS);
        const onVisible = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            reset();
        };
    }, [refresh, reset]);

    // Bấm ra ngoài thì đóng bảng
    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [open]);

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
                type="button"
                aria-label="Thông báo"
                title="Thông báo"
                onClick={() => setOpen((o) => !o)}
                style={{
                    position: 'relative',
                    width: 38,
                    height: 38,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    color: '#475569',
                    cursor: 'pointer',
                }}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            minWidth: 18,
                            height: 18,
                            padding: '0 5px',
                            borderRadius: 9,
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
                )}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Danh sách thông báo"
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 46,
                        width: 360,
                        maxHeight: 440,
                        overflowY: 'auto',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderBottom: '1px solid #F1F5F9',
                        }}
                    >
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Thông báo</span>
                        <button
                            type="button"
                            onClick={() => markAllRead()}
                            disabled={unreadCount === 0}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'none',
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                color: unreadCount === 0 ? '#94A3B8' : '#2563EB',
                                cursor: unreadCount === 0 ? 'default' : 'pointer',
                            }}
                        >
                            <CheckCheck size={14} />
                            Đọc tất cả
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div style={{ padding: '28px 14px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
                            Bạn chưa có thông báo nào.
                        </div>
                    ) : (
                        items.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                    if (!n.isRead) markRead(n.id);
                                    setOpen(false);
                                    if (n.refType === 'SWAP') {
                                        requestOpenSwapInbox({
                                            swapId: n.refId,
                                            tab: n.type === 'SWAP_PENDING_MANAGER' ? 'MANAGER' : null,
                                        });
                                        if (!location.pathname.startsWith('/schedule')) {
                                            navigate('/schedule');
                                        }
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    border: 'none',
                                    borderBottom: '1px solid #F1F5F9',
                                    backgroundColor: n.isRead ? '#FFFFFF' : '#EFF6FF',
                                    cursor: 'pointer',
                                }}
                            >
                <span
                    style={{
                        width: 8,
                        height: 8,
                        marginTop: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: n.isRead ? 'transparent' : '#2563EB',
                    }}
                />
                                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#0F172A' }}>
                    {n.title}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{n.message}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(n.createdAt)}</span>
                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};