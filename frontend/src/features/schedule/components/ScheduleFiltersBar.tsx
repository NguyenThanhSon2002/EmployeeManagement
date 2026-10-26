import React, {useState, useEffect} from 'react';
import type {Branch, ShiftTemplate} from '@/types/domain.types';
import {Search, AlertTriangle, X, Lock} from 'lucide-react';

interface ScheduleFiltersBarProps {
    searchTerm: string;
    shiftCodeFilter: string;
    onlyShowConflicts: boolean;
    shiftTemplates: ShiftTemplate[];
    branches: Branch[];
    selectedBranchId: number;
    branchLocked?: boolean;
    onBranchChange: (branchId: number) => void;
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
                                                                          branches,
                                                                          selectedBranchId,
                                                                          branchLocked = false,
                                                                          onBranchChange,
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
                gap: '12px',
                padding: '10px 16px',
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
        >
            {/* Left: Search & Filter Controls */}
            <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
                {/* Search Input with Clear Button */}
                <div style={{position: 'relative', width: 250}}>
                    <Search
                        size={14}
                        color="#94A3B8"
                        style={{position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)'}}
                    />
                    <input
                        type="text"
                        className="input-base"
                        placeholder="Tìm nhân sự hoặc mã NV..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        style={{
                            width: '100%',
                            paddingLeft: 32,
                            paddingRight: localSearch ? 28 : 10,
                            height: 34,
                            fontSize: '12.5px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F8FAFC',
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
                                color: '#94A3B8',
                                padding: 2,
                            }}
                            aria-label="Xóa từ khóa tìm kiếm"
                        >
                            <X size={14}/>
                        </button>
                    )}
                </div>

                {/* Shift Filter Dropdown */}
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <select
                        className="input-base"
                        value={shiftCodeFilter}
                        onChange={(e) => onShiftFilterChange(e.target.value)}
                        style={{
                            height: 34,
                            fontSize: '12.5px',
                            minWidth: 160,
                            fontWeight: 500,
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                        }}
                    >
                        <option value="">Tất cả ca làm việc</option>
                        {shiftTemplates.map((t) => (
                            <option key={t.id} value={t.shiftCode}>
                                {t.shiftName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Branch Filter Dropdown */}
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <select
                        className="input-base"
                        value={selectedBranchId}
                        disabled={branchLocked}
                        onChange={(e) => onBranchChange(Number(e.target.value))}
                        title={branchLocked ? 'Chỉ Giám đốc mới được xem chi nhánh khác' : undefined}
                        style={{
                            height: 34,
                            fontSize: '12.5px',
                            minWidth: 180,
                            fontWeight: 500,
                            cursor: branchLocked ? 'not-allowed' : 'pointer',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: branchLocked ? '#F1F5F9' : '#F8FAFC',
                            color: '#1E293B',
                        }}
                    >
                        {branches.length === 0 && <option value="">Đang tải chi nhánh...</option>}
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.branchName}
                            </option>
                        ))}
                    </select>
                    {branchLocked && (
                        <span
                            style={{
                                fontSize: '11px',
                                color: '#64748B',
                                backgroundColor: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 500,
                            }}
                        >
                          <Lock size={11} color="#64748B" /> Khóa
                        </span>
                    )}
                </div>

                {/* Conflicts Toggle Pill */}
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '5px 12px',
                        borderRadius: '8px',
                        backgroundColor: onlyShowConflicts ? '#FEF2F2' : '#F8FAFC',
                        border: onlyShowConflicts ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        color: onlyShowConflicts ? '#DC2626' : '#475569',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={onlyShowConflicts}
                        onChange={(e) => onToggleConflicts(e.target.checked)}
                        style={{accentColor: '#DC2626', cursor: 'pointer'}}
                    />
                    <AlertTriangle size={13} color={onlyShowConflicts ? '#DC2626' : '#94A3B8'}/>
                    <span>Chỉ hiện có xung đột</span>
                </label>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={() => {
                            setLocalSearch('');
                            onResetFilters();
                        }}
                        style={{
                            height: 32,
                            padding: '0 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#64748B',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <X size={12} />
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* Right: Counter Badge */}
            <div
                style={{
                    fontSize: '12px',
                    color: onlyShowConflicts ? '#B45309' : '#64748B',
                    backgroundColor: onlyShowConflicts ? '#FFFBEB' : '#F8FAFC',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: onlyShowConflicts ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                    fontWeight: 500,
                }}
            >
                Hiển thị <strong style={{color: onlyShowConflicts ? '#D97706' : '#2563EB', fontWeight: 700}}>{filteredCount}</strong> / {totalEmployees} nhân sự{onlyShowConflicts ? ' có xung đột' : ''}
            </div>
        </div>
    );
};
