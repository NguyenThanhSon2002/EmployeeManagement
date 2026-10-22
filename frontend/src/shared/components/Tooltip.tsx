import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    disabled?: boolean;
}

interface TipPosition {
    top: number;
    left: number;
    arrowLeft: number;
    below: boolean;
}

const TIP_BG = '#1E293B';

export const Tooltip: React.FC<TooltipProps> = ({ content, children, disabled }) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<TipPosition | null>(null);

    const show = () => setOpen(true);
    const hide = () => {
        setOpen(false);
        setPos(null);
    };

    // Đo kích thước tooltip rồi căn giữa phía trên chip, kẹp trong khung nhìn
    useLayoutEffect(() => {
        if (!open || !anchorRef.current || !tipRef.current) return;
        const anchor = anchorRef.current.getBoundingClientRect();
        const tip = tipRef.current.getBoundingClientRect();
        const margin = 8;
        const gap = 10;

        const idealLeft = anchor.left + anchor.width / 2 - tip.width / 2;
        const left = Math.max(margin, Math.min(idealLeft, window.innerWidth - tip.width - margin));
        const below = anchor.top - tip.height - gap < margin;
        const top = below ? anchor.bottom + gap : anchor.top - tip.height - gap;
        const arrowCenter = anchor.left + anchor.width / 2 - left;
        const arrowLeft = Math.max(14, Math.min(arrowCenter, tip.width - 14));

        setPos({ top, left, arrowLeft, below });
    }, [open]);

    // Cuộn trang thì đóng tooltip để khỏi lệch vị trí
    useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', hide, true);
        return () => window.removeEventListener('scroll', hide, true);
    }, [open]);

    return (
        <div
            ref={anchorRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {open &&
                !disabled &&
                createPortal(
                    <div
                        ref={tipRef}
                        role="tooltip"
                        style={{
                            position: 'fixed',
                            top: pos?.top ?? 0,
                            left: pos?.left ?? 0,
                            visibility: pos ? 'visible' : 'hidden',
                            zIndex: 10000,
                            maxWidth: 280,
                            padding: '7px 11px',
                            borderRadius: 8,
                            backgroundColor: TIP_BG,
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1.4,
                            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.25)',
                            pointerEvents: 'none',
                        }}
                    >
                        {content}
                        <div
                            style={{
                                position: 'absolute',
                                left: (pos?.arrowLeft ?? 14) - 5,
                                width: 10,
                                height: 10,
                                backgroundColor: TIP_BG,
                                transform: 'rotate(45deg)',
                                ...(pos?.below ? { top: -4 } : { bottom: -4 }),
                            }}
                        />
                    </div>,
                    document.body
                )}
        </div>
    );
};