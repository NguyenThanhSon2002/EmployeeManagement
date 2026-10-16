# Phase 01: Cập Nhật Bố Cục Grid & Thiết Kế Ô Nghỉ Giữa Ca

**Mục tiêu:** Sửa layout Hàng 2 trong [`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx) để 3 cột hiển thị cân đối hoàn hảo và không bị co ép.

---

## 1. Chi Tiết Thay Đổi Trong [`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx)

### A. CSS Grid Hàng 2
Thay thế:
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
```
Thành:
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.9fr)', gap: 12 }}>
```
- Sử dụng `minmax(0, ...)` để xóa bỏ kích thước `min-content` mặc định của CSS Grid.

### B. Nâng Cấp Cột 3 "Nghỉ Giữa Ca"
```tsx
<div style={{ minWidth: 0 }}>
  <label style={{ display: 'block', fontSize: 11.5, color: '#64748B', marginBottom: 4, fontWeight: 500 }}>
    Nghỉ giữa ca
  </label>
  <div style={{ position: 'relative' }}>
    <input
      type="number"
      min="0"
      step="15"
      className="input-base"
      value={breakMinutes}
      onChange={(e) => setBreakMinutes(Math.max(0, Number(e.target.value)))}
      style={{
        width: '100%',
        height: 40,
        paddingRight: 45,
        fontWeight: 600,
        backgroundColor: '#F8FAFC',
      }}
    />
    <span
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 12,
        fontWeight: 500,
        color: '#64748B',
        pointerEvents: 'none',
      }}
    >
      phút
    </span>
  </div>
</div>
```
