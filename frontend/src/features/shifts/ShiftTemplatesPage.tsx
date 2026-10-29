import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import type { ShiftTemplate } from '@/types/domain.types';
import { ShiftTemplateCard } from './components/ShiftTemplateCard';
import { ShiftTemplateFormModal } from './components/ShiftTemplateFormModal';
import { PageHeader } from '@/components/common/PageHeader';
import { BranchSelect } from '@/components/common/BranchSelect';
import {
  Plus,
  Layers,
  Sun,
  Moon,
  Users,
  CalendarCheck,
} from 'lucide-react';

export const ShiftTemplatesPage: React.FC = () => {
  const { shiftTemplates, fetchShiftTemplates, addShiftTemplate, updateShiftTemplate, deleteShiftTemplate } =
    useScheduleStore();
  const { addToast } = useUIStore();
  const { currentRole, currentUser } = useAuthStore();
  const { branches, fetchDirectory } = useDirectoryStore();
  const isDirector = currentRole === 'ROLE_DIRECTOR';
  const canManageShifts = isDirector || currentRole === 'ROLE_MANAGER';

  // Quản lý cơ sở: Quản lý cố định chi nhánh của mình, Giám đốc mặc định xem tất cả (undefined)
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(() => {
    return !isDirector && currentUser?.branchId ? currentUser.branchId : undefined;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  useEffect(() => {
    fetchShiftTemplates(selectedBranchId);
  }, [fetchShiftTemplates, selectedBranchId]);

  const handleCreateNew = () => {
    if (!canManageShifts) {
      addToast({
        type: 'error',
        title: 'Từ chối quyền hạn',
        message: 'Tài khoản nhân viên chỉ có quyền xem danh mục mẫu ca.',
      });
      return;
    }
    setEditingTemplate(null);
    setIsCopyMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (template: ShiftTemplate) => {
    if (!canManageShifts) {
      addToast({
        type: 'error',
        title: 'Từ chối quyền hạn',
        message: 'Tài khoản nhân viên chỉ có quyền xem danh mục mẫu ca.',
      });
      return;
    }
    setEditingTemplate(template);
    setIsCopyMode(false);
    setIsModalOpen(true);
  };

  const handleDuplicate = (template: ShiftTemplate) => {
    if (!canManageShifts) {
      addToast({
        type: 'error',
        title: 'Từ chối quyền hạn',
        message: 'Tài khoản nhân viên chỉ có quyền xem danh mục mẫu ca.',
      });
      return;
    }
    setEditingTemplate(template);
    setIsCopyMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canManageShifts) {
      addToast({
        type: 'error',
        title: 'Từ chối quyền hạn',
        message: 'Tài khoản nhân viên không có quyền xóa mẫu ca.',
      });
      return;
    }
    const target = shiftTemplates.find((t) => t.id === id);
    if (!target) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu ca "${target.shiftName}" khỏi danh mục chuẩn?`)) {
      const res = await deleteShiftTemplate(id);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Đã xóa mẫu ca',
          message: `Đã xóa mẫu ca "${target.shiftName}" thành công.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Không thể xóa mẫu ca',
          message: res.error || 'Mẫu ca đang được phân công trong lịch tuần.',
        });
      }
    }
  };

  const handleSave = async (data: Omit<ShiftTemplate, 'id'>, editId?: number) => {
    if (!canManageShifts) {
      addToast({
        type: 'error',
        title: 'Từ chối quyền hạn',
        message: 'Tài khoản nhân viên không có quyền tạo hoặc chỉnh sửa mẫu ca.',
      });
      return;
    }
    try {
      if (editId) {
        await updateShiftTemplate(editId, data);
        addToast({
          type: 'success',
          title: 'Cập nhật thành công',
          message: `Đã cập nhật mẫu ca "${data.shiftName}" thành công.`,
        });
      } else {
        await addShiftTemplate(data);
        addToast({
          type: 'success',
          title: 'Thêm mẫu ca thành công',
          message: `Đã tạo mẫu ca mới "${data.shiftName}" thành công.`,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi lưu mẫu ca',
        message: err?.message || 'Không thể lưu mẫu ca vào máy chủ.',
      });
    }
  };

  // Metrics computation
  const totalShifts = shiftTemplates.length;
  const overnightShifts = shiftTemplates.filter((t) => t.isCrossMidnight).length;
  const dayShifts = totalShifts - overnightShifts;
  const totalMinStaffing = shiftTemplates.reduce((sum, t) => sum + (t.minStaffing || 0), 0);
  const totalMaxStaffing = shiftTemplates.reduce((sum, t) => sum + (t.maxStaffing || 0), 0);
  const avgMinStaffing = totalShifts > 0 ? Math.round(totalMinStaffing / totalShifts) : 0;
  const avgMaxStaffing = totalShifts > 0 ? Math.round(totalMaxStaffing / totalShifts) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Page Header */}
      <PageHeader
        icon={<Layers size={20} />}
        title="Danh Mục Mẫu Ca Làm Việc"
        subtitle="Quản lý chuẩn hóa khung giờ ca làm việc, định biên nhân sự tối thiểu/tối đa và màu sắc nhận diện trực quan."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Component Lọc Theo Chi Nhánh Chuẩn UI/UX */}
            <BranchSelect
              branches={branches}
              selectedBranchId={selectedBranchId ?? 0}
              onChange={(id) => setSelectedBranchId(id === 0 ? undefined : id)}
              disabled={!isDirector && Boolean(currentUser?.branchId)}
              disabledTooltip="Bạn chỉ có quyền xem mẫu ca thuộc chi nhánh làm việc của mình"
              allowAll={isDirector}
              allLabel="Tất cả chi nhánh (Chuỗi)"
              allSubLabel="Xem danh mục ca toàn bộ hệ thống"
              minWidth={220}
            />

            {canManageShifts && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateNew}
                style={{
                  height: 40,
                  padding: '0 18px',
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Plus size={17} strokeWidth={2.5} /> Thêm Mẫu Ca Mới
              </button>
            )}
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {/* KPI 1: Tổng số ca */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Tổng Số Mẫu Ca
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              {totalShifts} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>mẫu chuẩn</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Ca ban ngày */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sun size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Ca Làm Ban Ngày
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              {dayShifts} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>khung giờ</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Ca qua đêm */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#EDE9FE',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Moon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Ca Qua Đêm (+1 Ngày)
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              {overnightShifts} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>ca đêm</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Định biên trung bình */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#D1FAE5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Định Biên TB / Ca
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              {avgMinStaffing} - {avgMaxStaffing} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>người</span>
            </div>
          </div>
        </div>
      </div>



      {/* Templates Grid */}
      {shiftTemplates.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            border: '2px dashed #E2E8F0',
          }}
        >
          <Layers size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Chưa có mẫu ca nào</h3>
          <p style={{ color: '#64748B', fontSize: 13.5, maxWidth: 400, margin: '6px auto 16px' }}>
            Hệ thống cần ít nhất một mẫu ca làm việc để tiến hành xếp lịch trên Ma Trận Lịch Tuần.
          </p>
          {canManageShifts && (
            <button type="button" className="btn btn-primary" onClick={handleCreateNew}>
              <Plus size={16} /> Tạo mẫu ca đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {shiftTemplates.map((template) => (
            <ShiftTemplateCard
              key={template.id}
              template={template}
              readOnly={!canManageShifts}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ShiftTemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingTemplate}
        defaultBranchId={selectedBranchId || branches[0]?.id}
        isCopy={isCopyMode}
      />
    </div>
  );
};
