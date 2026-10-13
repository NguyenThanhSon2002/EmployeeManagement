import React from 'react';
import type { ShiftAssignment, ScheduleConflict } from '@/types/domain.types';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { AlertTriangle, Moon, Sun, Sunrise, Sunset } from 'lucide-react';

interface ShiftCardProps {
  assignment: ShiftAssignment;
  conflicts: ScheduleConflict[];
  onClick: () => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({ assignment, conflicts, onClick }) => {
  const { netHours } = calculateShiftDurations(
    assignment.snapshotStartTime,
    assignment.snapshotEndTime,
    assignment.snapshotBreakMinutes,
    assignment.snapshotCrossMidnight
  );

  let icon = <Sun size={13} />;
  let borderColor = 'var(--shift-morning-border)';
  let bgColor = 'var(--shift-morning-bg)';
  let textColor = 'var(--shift-morning-text)';

  if (assignment.snapshotCrossMidnight || assignment.snapshotStartTime >= '22:00') {
    icon = <Moon size={13} />;
    borderColor = 'var(--shift-night-border)';
    bgColor = 'var(--shift-night-bg)';
    textColor = 'var(--shift-night-text)';
  } else if (assignment.snapshotStartTime >= '14:00') {
    icon = <Sunset size={13} />;
    borderColor = 'var(--shift-afternoon-border)';
    bgColor = 'var(--shift-afternoon-bg)';
    textColor = 'var(--shift-afternoon-text)';
  } else if (assignment.snapshotStartTime < '07:00') {
    icon = <Sunrise size={13} />;
    borderColor = 'var(--shift-early-border)';
    bgColor = 'var(--shift-early-bg)';
    textColor = 'var(--shift-early-text)';
  }

  const hasWarning = conflicts.some((c) => c.severity === 'WARNING');
  const hasMandatory = conflicts.some((c) => c.severity === 'MANDATORY');

  const conflictTooltip = conflicts.map((c) => c.message).join(' | ');

  const ariaDescription = `${assignment.snapshotShiftName}, từ ${assignment.snapshotStartTime} đến ${
    assignment.snapshotEndTime
  }${assignment.snapshotCrossMidnight ? ' hôm sau' : ''}, ${netHours} giờ. ${
    conflicts.length > 0 ? `Cảnh báo: ${conflictTooltip}` : ''
  }`;

  return (
    <div
      role="button"
      tabIndex={0}
      className="shift-card"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={ariaDescription}
      title={conflictTooltip || ariaDescription}
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <div className="shift-card-header">
        <span className="shift-card-title">
          {icon}
          <span>{assignment.snapshotShiftName}</span>
        </span>

        {/* Conflict Flag Indicator */}
        {hasMandatory && (
          <span className="card-conflict-icon" title={conflictTooltip} style={{ color: 'var(--color-error)' }}>
            <AlertTriangle size={14} color="var(--color-error)" />
          </span>
        )}
        {!hasMandatory && hasWarning && (
          <span className="card-conflict-icon" title={conflictTooltip} style={{ color: 'var(--color-warning)' }}>
            <AlertTriangle size={14} color="#d48806" />
          </span>
        )}
      </div>

      <div className="shift-card-time">
        {assignment.snapshotStartTime} - {assignment.snapshotEndTime}
        {assignment.snapshotCrossMidnight && <span style={{ fontWeight: 600 }}> (+1)</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span className="shift-card-badge" style={{ color: textColor }}>
          {netHours.toFixed(1)}h
        </span>
        {assignment.overrideRule && (
          <span style={{ fontSize: 9, fontStyle: 'italic', opacity: 0.8 }}>
            Đặc cách
          </span>
        )}
      </div>
    </div>
  );
};
