import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useScheduleStore } from '../store/useScheduleStore';

describe('Phase 03: Core Weekly Schedule Grid & Drawer Integration', () => {
  beforeEach(() => {
    // Reset stores to default state
    useAuthStore.getState().setRole('ROLE_ADMIN');
    useScheduleStore.getState().resetDemoData();
  });

  it('renders weekly roster grid with toolbar, KPI summary cards, and employee rows', () => {
    render(<App />);

    // Check KPI cards
    expect(screen.getByText(/TỔNG SỐ CA TUẦN NÀY/i)).toBeInTheDocument();
    expect(screen.getByText(/TỔNG GIỜ LÀM VIỆC/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CẢNH BÁO XUNG ĐỘT/i).length).toBeGreaterThanOrEqual(1);

    // Check specific seed employees
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
    expect(screen.getByText('Phạm Văn Dũng')).toBeInTheDocument();
    expect(screen.getByText('Dương Văn Phúc')).toBeInTheDocument();
  });

  it('verifies EX-01: Overnight shift (+1 ngày) renders properly for EMP-003', () => {
    render(<App />);

    // EMP-003 has overnight shifts with (+1) label
    const overnightLabels = screen.getAllByText(/\(\+1\)/i);
    expect(overnightLabels.length).toBeGreaterThan(0);
  });

  it('verifies EX-06 / TC-INT-04: Warning conflict flag ⚠️ is rendered for EMP-002', () => {
    render(<App />);

    // Click "Chỉ hiện có cảnh báo ⚠️"
    const conflictToggle = screen.getByLabelText(/Chỉ hiện có cảnh báo/i);
    fireEvent.click(conflictToggle);

    // Grid should now filter to only employees with conflicts (Trần Thị Bích and Phạm Văn Dũng)
    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
    expect(screen.getByText('Phạm Văn Dũng')).toBeInTheDocument();
    // Nguyễn Văn An has zero conflicts and should be filtered out
    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
  });

  it('verifies TC-INT-08: Switching role to ROLE_EMPLOYEE enters read-only mode', () => {
    useAuthStore.getState().setRole('ROLE_EMPLOYEE');
    render(<App />);

    // Action buttons like "Công bố lịch", "Sao chép tuần", "Gán hàng loạt" should NOT be visible
    expect(screen.queryByText(/Sao chép tuần/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gán hàng loạt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Công bố lịch/i)).not.toBeInTheDocument();
  });
});
