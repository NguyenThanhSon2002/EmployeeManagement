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
      className="card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        padding: '10px 18px',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Left: Search & Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Search Input with Clear Button */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search
            size={15}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-base"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 34,
              paddingRight: localSearch ? 28 : 10,
              height: 34,
              fontSize: '12.5px',
            }}
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
                padding: 2,
              }}
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Shift Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} color="var(--color-text-muted)" />
          <select
            className="input-base"
            value={shiftCodeFilter}
            onChange={(e) => onShiftFilterChange(e.target.value)}
            style={{ height: 34, fontSize: '12.5px', minWidth: 170, fontWeight: 500 }}
          >
            <option value="">Tất cả ca làm việc</option>
            {shiftTemplates.map((t) => (
              <option key={t.id} value={t.shiftCode}>
                {t.shiftName}
              </option>
            ))}
          </select>
        </div>

        {/* Conflicts Toggle Pill */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: onlyShowConflicts ? '#FFFBEB' : '#F8FAFC',
            border: onlyShowConflicts ? '1px solid #F59E0B' : '1px solid var(--color-border)',
            color: onlyShowConflicts ? '#B45309' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <input
            type="checkbox"
            checked={onlyShowConflicts}
            onChange={(e) => onToggleConflicts(e.target.checked)}
            style={{ accentColor: '#F59E0B' }}
          />
          <AlertTriangle size={13} color={onlyShowConflicts ? '#D97706' : 'var(--color-text-muted)'} />
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

      {/* Right: Counter Badge */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          backgroundColor: '#F8FAFC',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        Đang hiển thị <strong style={{ color: 'var(--color-primary)' }}>{filteredCount}</strong> / {totalEmployees} nhân sự
      </div>
    </div>
  );
};
