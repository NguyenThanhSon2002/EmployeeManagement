import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileDropdown } from '../UserProfileDropdown';
import type { Employee } from '@/types/domain.types';

const mockUser: Employee = {
  id: 1,
  employeeCode: 'EMP-001',
  fullName: 'Nguyễn Văn An',
  email: 'nguyen.van.an@company.com',
  phoneNumber: '0901234567',
  departmentId: 1,
  positionId: 1,
  managerId: null,
  employmentStatus: 'OFFICIAL',
  hireDate: '2023-01-01',
  isActive: true,
};

describe('UserProfileDropdown Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <UserProfileDropdown
        isOpen={false}
        user={mockUser}
        role="ROLE_ADMIN"
        onClose={vi.fn()}
        onLogout={vi.fn()}
        onViewProfile={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders user details and role badge properly when open', () => {
    render(
      <UserProfileDropdown
        isOpen={true}
        user={mockUser}
        role="ROLE_ADMIN"
        onClose={vi.fn()}
        onLogout={vi.fn()}
        onViewProfile={vi.fn()}
      />
    );

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('nguyen.van.an@company.com')).toBeInTheDocument();
    expect(screen.getByText('Quản trị viên (ADMIN)')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ của tôi')).toBeInTheDocument();
    expect(screen.getByText(/Đăng xuất/i)).toBeInTheDocument();
  });

  it('calls onViewProfile when clicking "Hồ sơ của tôi"', () => {
    const handleViewProfile = vi.fn();
    render(
      <UserProfileDropdown
        isOpen={true}
        user={mockUser}
        role="ROLE_ADMIN"
        onClose={vi.fn()}
        onLogout={vi.fn()}
        onViewProfile={handleViewProfile}
      />
    );

    fireEvent.click(screen.getByText('Hồ sơ của tôi'));
    expect(handleViewProfile).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when clicking "Đăng xuất"', () => {
    const handleLogout = vi.fn();
    render(
      <UserProfileDropdown
        isOpen={true}
        user={mockUser}
        role="ROLE_ADMIN"
        onClose={vi.fn()}
        onLogout={handleLogout}
        onViewProfile={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Đăng xuất/i));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when pressing Escape key', () => {
    const handleClose = vi.fn();
    render(
      <UserProfileDropdown
        isOpen={true}
        user={mockUser}
        role="ROLE_ADMIN"
        onClose={handleClose}
        onLogout={vi.fn()}
        onViewProfile={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking outside dropdown', () => {
    const handleClose = vi.fn();
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <UserProfileDropdown
          isOpen={true}
          user={mockUser}
          role="ROLE_ADMIN"
          onClose={handleClose}
          onLogout={vi.fn()}
          onViewProfile={vi.fn()}
        />
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
