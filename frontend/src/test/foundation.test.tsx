import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import App from '../App';

describe('Phase 02: App Shell and Navigation Verification', () => {
  it('renders topbar title and system portal subtitle', () => {
    render(<App />);
    expect(
      screen.getByText(/Hệ Thống Quản Lý Phân Ca & Nhân Sự/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Phòng Vận hành Dịch vụ/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders navigation sidebar with 7 core modules and RoleSwitcher', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText(/Lịch Phân Ca/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Tổng Quan/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Nhân Sự/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Chấm Công/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Mẫu Ca/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Nghỉ Phép/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Báo Cáo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chuyển đổi vai trò người dùng/i })).toBeInTheDocument();
  });
});
