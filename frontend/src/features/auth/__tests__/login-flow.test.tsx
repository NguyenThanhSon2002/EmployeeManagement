import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { useAuthStore } from '@/shared/auth/useAuthStore';

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements and 1-Click quick access section', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Header & Titles
    expect(screen.getByText('HỆ THỐNG HRMS PHÂN CA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng nhập hệ thống' })).toBeInTheDocument();

    // 1-Click Quick Access Buttons
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Trưởng phòng')).toBeInTheDocument();
    expect(screen.getByText('Nhân viên')).toBeInTheDocument();
  });

  it('validates empty username and password fields', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: 'Đăng nhập hệ thống' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập tên tài khoản.')).toBeInTheDocument();

    const userInput = screen.getByPlaceholderText(/Nhập username/i);
    fireEvent.change(userInput, { target: { value: 'admin' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const passInput = screen.getByPlaceholderText(/Nhập mật khẩu/i) as HTMLInputElement;
    expect(passInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText('Hiện mật khẩu');
    fireEvent.click(toggleBtn);
    expect(passInput.type).toBe('text');

    const hideBtn = screen.getByLabelText('Ẩn mật khẩu');
    fireEvent.click(hideBtn);
    expect(passInput.type).toBe('password');
  });

  it('calls login function when clicking 1-Click quick access button', async () => {
    const loginMock = vi.fn().mockResolvedValue(true);
    useAuthStore.setState({ login: loginMock });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const adminQuickBtn = screen.getByRole('button', { name: /Admin/i });
    fireEvent.click(adminQuickBtn);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin', 'Admin@123');
    });
  });
});
