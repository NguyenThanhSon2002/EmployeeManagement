import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';

interface SmartTimePickerProps {
  label?: string;
  value: string; // "HH:mm", e.g. "08:00"
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

// Generate 48 time slots (30-minute intervals from 00:00 to 23:30)
const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_SLOTS.push(`${hh}:00`);
  TIME_SLOTS.push(`${hh}:30`);
}

// Common shift presets
const POPULAR_PRESETS = ['06:00', '08:00', '12:00', '14:00', '17:00', '22:00'];

// Helper to normalize user input to valid HH:mm
function normalizeTimeInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Exact match HH:mm
  const exactMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (exactMatch) {
    const h = exactMatch[1].padStart(2, '0');
    const m = exactMatch[2];
    return `${h}:${m}`;
  }

  // Single or double digit hour only e.g. "8" or "14"
  const hourMatch = trimmed.match(/^([01]?\d|2[0-3])$/);
  if (hourMatch) {
    const h = hourMatch[1].padStart(2, '0');
    return `${h}:00`;
  }

  // 3 or 4 digits without colon e.g. "830" or "1430"
  const digitsMatch = trimmed.match(/^([01]?\d|2[0-3])([0-5]\d)$/);
  if (digitsMatch) {
    const h = digitsMatch[1].padStart(2, '0');
    const m = digitsMatch[2];
    return `${h}:${m}`;
  }

  return null;
}

export const SmartTimePicker: React.FC<SmartTimePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [typedText, setTypedText] = useState(value || '08:00');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Sync internal text with value prop
  useEffect(() => {
    setTypedText(value || '08:00');
  }, [value]);

  // Click outside and escape handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll active item into view when opening
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      if (typeof activeItemRef.current.scrollIntoView === 'function') {
        activeItemRef.current.scrollIntoView({ block: 'nearest' });
      } else if (listRef.current) {
        listRef.current.scrollTop = activeItemRef.current.offsetTop - 50;
      }
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTypedText(raw);
    const normalized = normalizeTimeInput(raw);
    if (normalized && normalized !== value) {
      onChange(normalized);
    }
  };

  const handleInputBlur = () => {
    const normalized = normalizeTimeInput(typedText);
    if (normalized) {
      setTypedText(normalized);
      if (normalized !== value) {
        onChange(normalized);
      }
    } else {
      // Revert to current valid value if invalid input
      setTypedText(value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelectSlot = (slot: string) => {
    setTypedText(slot);
    onChange(slot);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '11.5px',
            color: '#64748B',
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}

      {/* Input Capsule Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 40,
          backgroundColor: disabled ? '#F1F5F9' : isOpen ? '#FFFFFF' : '#F8FAFC',
          border: isOpen ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
          borderRadius: 8,
          padding: '0 8px 0 10px',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'var(--shadow-xs)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <Clock
          size={16}
          color={isOpen ? '#2563EB' : '#64748B'}
          style={{ flexShrink: 0, marginRight: 6, cursor: 'pointer' }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />

        <input
          id={id}
          type="text"
          value={typedText}
          disabled={disabled}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder="08:00"
          maxLength={5}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 700,
            color: '#0F172A',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
            padding: 0,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          aria-label={label || 'Chọn giờ'}
          aria-expanded={isOpen}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Mở danh sách mốc giờ ${label || ''}`}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            color: '#94A3B8',
          }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>

      {/* Dropdown Menu (Gợi ý mốc giờ) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            minWidth: 190,
            zIndex: 1000,
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Quick Preset Pills */}
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            {POPULAR_PRESETS.map((preset) => {
              const isSelected = value === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  data-testid={`preset-${preset}`}
                  aria-label={`Gợi ý ${preset}`}
                  onClick={() => handleSelectSlot(preset)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    color: isSelected ? '#1D4ED8' : '#475569',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {/* Time Slots List */}
          <div
            ref={listRef}
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {TIME_SLOTS.map((slot) => {
              const isSelected = value === slot;
              return (
                <button
                  key={slot}
                  ref={isSelected ? activeItemRef : undefined}
                  type="button"
                  data-testid={`slot-${slot}`}
                  aria-label={`Mốc ${slot}`}
                  onClick={() => handleSelectSlot(slot)}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                    color: isSelected ? '#1D4ED8' : '#334155',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{slot}</span>
                  {isSelected && <Check size={14} color="#1D4ED8" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
