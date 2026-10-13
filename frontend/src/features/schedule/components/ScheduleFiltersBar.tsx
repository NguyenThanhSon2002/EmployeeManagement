import React, { useState, useEffect } from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { Search, Filter, AlertTriangle, X } from 'lucide-react';

interface ScheduleFiltersBarProps {
  searchTerm: string;
  shiftCodeFilter: string;
  onlyShowConflicts: boolean;
  shiftTemplates: ShiftTemplate[];
  totalEmployees: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onShiftFilterChange: (value: string) => void;
  onToggleConflicts: (value: boolean) => void;
  onResetFilters: () => void;
}

export const ScheduleFiltersBar: React.FC<ScheduleFiltersBarProps> = ({
  searchTerm,
  shiftCodeFilter,
  onlyShowConflicts,
  shiftTemplates,
  totalEmployees,
  filteredCount,
  onSearchChange,
  onShiftFilterChange,
  onToggleConflicts,
  onResetFilters,
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // 300ms debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange]);

  const hasActiveFilters = Boolean(searchTerm || shiftCodeFilter || onlyShowConflicts);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        padding: '10px 16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Left: Search & Filter Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: 240 }}>
          <Search
            size={16}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-base"
            placeholder="Tìm theo tên hoặc mã NV..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, paddingRight: localSearch ? 28 : 10, height: 34, fontSize: 'var(--font-caption)' }}
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Shift Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={15} color="var(--color-text-muted)" />
          <select
            className="input-base"
            value={shiftCodeFilter}
            onChange={(e) => onShiftFilterChange(e.target.value)}
            style={{ height: 34, fontSize: 'var(--font-caption)', minWidth: 160 }}
          >
            <option value="">Tất cả ca làm việc</option>
            {shiftTemplates.map((t) => (
              <option key={t.id} value={t.shiftCode}>
                {t.shiftName}
              </option>
            ))}
          </select>
        </div>

        {/* Conflicts Toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            fontSize: 'var(--font-caption)',
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: onlyShowConflicts ? '#fffbe6' : 'var(--color-bg-layout)',
            border: onlyShowConflicts ? '1px solid var(--color-warning)' : '1px solid var(--color-border-subtle)',
            color: onlyShowConflicts ? '#d46b08' : 'var(--color-text-secondary)',
          }}
        >
          <input
            type="checkbox"
            checked={onlyShowConflicts}
            onChange={(e) => onToggleConflicts(e.target.checked)}
            style={{ accentColor: 'var(--color-warning)' }}
          />
          <AlertTriangle size={14} />
          <span>Chỉ hiện có cảnh báo ⚠️</span>
        </label>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setLocalSearch('');
              onResetFilters();
            }}
            style={{ height: 30, padding: '0 8px', fontSize: 12, color: 'var(--color-primary)' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Right: Counter */}
      <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)' }}>
        Hiển thị <strong>{filteredCount}</strong> / {totalEmployees} nhân sự
      </div>
    </div>
  );
};
