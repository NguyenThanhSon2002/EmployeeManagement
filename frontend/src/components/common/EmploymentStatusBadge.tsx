import React from 'react';
import type { EmploymentStatus } from '@/types/domain.types';

interface StatusConfig {
    label: string;
    className: string;
    dot: string;
    style?: React.CSSProperties;
}

// Muốn đổi nhãn/màu trạng thái: chỉ sửa ở đây là mọi nơi dùng nhãn này cùng đổi.
const STATUS_CONFIG: Record<EmploymentStatus, StatusConfig> = {
    OFFICIAL: { label: 'Chính thức', className: 'badge-success', dot: '#10B981' },
    PROBATION: { label: 'Thử việc', className: 'badge-warning', dot: '#F59E0B' },
    ON_LEAVE: {
        label: 'Nghỉ chế độ',
        className: '',
        dot: '#3B82F6',
        style: { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
    },
    RESIGNED: {
        label: 'Đã nghỉ việc',
        className: '',
        dot: '#94A3B8',
        style: { backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' },
    },
};

export const EmploymentStatusBadge: React.FC<{ status: EmploymentStatus }> = ({ status }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OFFICIAL;
    return (
        <span className={`badge ${cfg.className}`.trim()} style={cfg.style}>
      <span className="badge-dot" style={{ backgroundColor: cfg.dot }} />
            {cfg.label}
    </span>
    );
};