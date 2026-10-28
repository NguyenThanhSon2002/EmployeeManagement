import React, { useState, useRef, useEffect, useId } from 'react';
import type { Branch } from '@/types/domain.types';
import { Building2, ChevronDown, Check, Lock, Loader2, Globe, MapPin } from 'lucide-react';

export interface BranchSelectProps {
  branches: Branch[];
  selectedBranchId?: number | null;
  onChange: (branchId: number) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  allowAll?: boolean;
  allLabel?: string;
  allSubLabel?: string;
  isLoading?: boolean;
  placeholder?: string;
  minWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const BranchSelect: React.FC<BranchSelectProps> = ({
  branches,
  selectedBranchId,
  onChange,
  disabled = false,
  disabledTooltip,
  allowAll = false,
  allLabel = 'Tất cả chi nhánh',
  allSubLabel = 'Xem toàn bộ hệ thống chuỗi',
  isLoading = false,
  placeholder = 'Chọn chi nhánh...',
  minWidth = 190,
  className = '',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  // Danh sách các tùy chọn có thể chọn
  const options = React.useMemo(() => {
    const list: Array<{ id: number; name: string; subText?: string; isAll?: boolean }> = [];
    if (allowAll) {
      list.push({
        id: 0,
        name: allLabel,
        subText: allSubLabel,
        isAll: true,
      });
    }
    branches.forEach((b) => {
      list.push({
        id: b.id,
        name: b.branchName,
        subText: b.address || b.branchCode,
      });
    });
    return list;
  }, [allowAll, allLabel, allSubLabel, branches]);

  // Chi nhánh đang chọn
  const selectedOption = React.useMemo(() => {
    if (selectedBranchId === 0 && allowAll) {
      return { id: 0, name: allLabel, subText: allSubLabel, isAll: true };
    }
    const found = branches.find((b) => b.id === selectedBranchId);
    if (found) {
      return { id: found.id, name: found.branchName, subText: found.address || found.branchCode };
    }
    // Nếu chưa chọn hoặc không khớp, nếu allowAll thì default 0, ngược lại chọn nhánh đầu tiên nếu có
    if (allowAll && selectedBranchId === undefined) {
      return { id: 0, name: allLabel, subText: allSubLabel, isAll: true };
    }
    if (branches.length > 0 && selectedBranchId !== undefined) {
      return { id: branches[0].id, name: branches[0].branchName, subText: branches[0].address };
    }
    return null;
  }, [selectedBranchId, allowAll, allLabel, allSubLabel, branches]);

  // Đóng khi click ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Quản lý phím bấm điều hướng Accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = options.findIndex((o) => o.id === selectedOption?.id);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
      case 'Tab':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].id);
        }
        break;
      }
    }
  };

  const handleSelect = (branchId: number) => {
    onChange(branchId);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: minWidth,
        ...style,
      }}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {/* Nút bấm hiển thị chi nhánh (Trigger) */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label="Chọn chi nhánh làm việc"
        disabled={disabled}
        title={disabled ? disabledTooltip : undefined}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: 34,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderRadius: 8,
          border: isOpen ? '1px solid #2563EB' : '1px solid #E2E8F0',
          backgroundColor: disabled ? '#F1F5F9' : '#F8FAFC',
          color: disabled ? '#64748B' : '#1E293B',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(37, 99, 235, 0.12)'
            : '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', flex: 1 }}>
          {selectedOption?.isAll ? (
            <Globe size={14} color="#2563EB" style={{ flexShrink: 0 }} />
          ) : (
            <Building2 size={14} color={disabled ? '#94A3B8' : '#2563EB'} style={{ flexShrink: 0 }} />
          )}

          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#1E293B',
              letterSpacing: '-0.01em',
            }}
          >
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>

        {/* Trạng thái bên phải (Khóa / Đang tải / Mũi tên) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {disabled ? (
            <span
              style={{
                fontSize: '11px',
                color: '#64748B',
                backgroundColor: '#E2E8F0',
                padding: '1px 5px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontWeight: 600,
              }}
            >
              <Lock size={10} color="#64748B" /> Khóa
            </span>
          ) : isLoading ? (
            <Loader2 size={13} className="animate-spin" color="#2563EB" />
          ) : (
            <ChevronDown
              size={14}
              color="#64748B"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          )}
        </div>
      </button>

      {/* Menu thả xuống (Popover Dropdown) */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Danh sách chi nhánh"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            minWidth: Math.max(typeof minWidth === 'number' ? minWidth : 220, 240),
            zIndex: 100,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
            padding: '4px',
            animation: 'schedule-view-enter 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header nhỏ thông tin */}
          <div
            style={{
              padding: '6px 10px 6px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #F1F5F9',
              marginBottom: 4,
            }}
          >
            <span>Chi nhánh hệ thống</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#2563EB',
                backgroundColor: '#EFF6FF',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {branches.length} cơ sở
            </span>
          </div>

          {/* Danh sách items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 280, overflowY: 'auto' }}>
            {options.map((item, idx) => {
              const isSelected = selectedOption?.id === item.id;
              const isHighlighted = highlightedIndex === idx;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item.id)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: isSelected
                      ? '#EFF6FF'
                      : isHighlighted
                      ? '#F8FAFC'
                      : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.12s ease',
                    outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                        color: isSelected ? '#1D4ED8' : '#64748B',
                      }}
                    >
                      {item.isAll ? <Globe size={13} /> : <MapPin size={13} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#1D4ED8' : '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </span>
                      {item.subText && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: isSelected ? '#60A5FA' : '#94A3B8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.subText}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      size={14}
                      color="#2563EB"
                      strokeWidth={2.5}
                      style={{ flexShrink: 0, marginLeft: 6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
