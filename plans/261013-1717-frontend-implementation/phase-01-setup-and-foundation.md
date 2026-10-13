# GIAI ĐOẠN 01: KHỞI TẠO DỰ ÁN & NỀN TẢNG KỸ THUẬT (PHASE 01)

## Context Links
- Kế hoạch tổng thể: [plan.md](./plan.md)
- Kiến trúc Frontend: [`docs/10-frontend-architecture-plan.md`](../../docs/10-frontend-architecture-plan.md)
- Hệ thống Design Tokens: [`docs/12-frontend-design-system-and-screens.md`](../../docs/12-frontend-design-system-and-screens.md)
- Lộ trình chi tiết: [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md) (Stage 0)

---

## Overview
- **Mã giai đoạn:** Phase 01 (Stage 0)
- **Mức độ ưu tiên:** P1 (Bắt buộc - Nền móng)
- [x] **Trạng thái:** Completed (Hoàn thành)
- **Thời lượng ước tính:** 6 giờ làm việc
- **Mô tả vắn tắt:** Tạo mới thư mục `frontend/`, thiết lập dự án Vite với React 18/19 và TypeScript Strict Mode 100%, cài đặt toàn bộ dependencies cốt lõi, cấu hình Vitest test runner, nạp font Be Vietnam Pro/Inter ngoại tuyến và xây dựng file CSS Variables chứa toàn bộ Design Tokens WCAG 2.1 AA.

---

## Key Insights
1. **Kiểm soát thư mục gốc:** Thư mục gốc repo `D:\Project\Employee Management` giữ nguyên cho Backend Spring Boot. Toàn bộ mã nguồn giao diện nằm độc lập bên trong `frontend/`.
2. **Kỷ luật TypeScript Strict:** Bật `noImplicitAny: true`, `strictNullChecks: true`, cấm hoàn toàn `any`. Việc ép kiểu chặt chẽ ngay từ ngày đầu giúp loại bỏ 100% runtime type errors khi xử lý cấu trúc dữ liệu ca kíp phức tạp.
3. **Phông chữ ngoại tuyến hoàn toàn:** Cài đặt `@fontsource/be-vietnam-pro` và `@fontsource/inter` thông qua npm để chạy 100% offline trong môi trường mạng nội bộ doanh nghiệp mà không phụ thuộc Google Fonts.

---

## Requirements
- **Kỹ thuật:** Khởi động Vite dev server trong $< 200$ms, nạp Hot Module Replacement (HMR).
- **Thiết kế:** File `src/styles/tokens.css` phải chứa đầy đủ các biến màu sắc, typography, spacing 8pt, radius, shadows, breakpoints khớp 100% với Bảng Tokens tại Tài liệu 12.
- **Kiểm thử:** Lệnh `npm test` (Vitest) chạy thành công trên môi trường jsdom.

---

## Architecture & Design
```text
frontend/
├── index.html                  # Thiết lập viewport, nạp Be Vietnam Pro
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript Strict configuration
├── vite.config.ts              # Alias '@/' trỏ tới 'src/'
├── vitest.config.ts            # Cấu hình Vitest (jsdom)
└── src/
    ├── styles/
    │   ├── tokens.css          # CSS Variables (Colors, Typography, Spacing, Shadows)
    │   ├── reset.css           # CSS Reset chuẩn hóa box-sizing
    │   └── global.css          # Phong cách chung
    └── main.tsx                # Điểm khởi chạy React
```

---

## Related Code Files
| Thao Tác | Đường Dẫn File | Mô Tả Trách Nhiệm |
|:---:|:---|:---|
| **Create** | `frontend/package.json` | Khai báo dependencies: react, react-router-dom, zustand, date-fns, fontsource, vitest... |
| **Create** | `frontend/tsconfig.json` | Cấu hình TypeScript Strict 100% |
| **Create** | `frontend/vite.config.ts` | Cấu hình Vite dev server và path alias `@/` |
| **Create** | `frontend/vitest.config.ts`| Cấu hình Vitest runner với jsdom environment |
| **Create** | `frontend/index.html` | Entry point HTML có thẻ meta và tiêu đề tiếng Việt |
| **Create** | `frontend/src/styles/tokens.css` | Hệ thống Design Tokens CSS Variables toàn cục |
| **Create** | `frontend/src/styles/reset.css` | Reset CSS box-sizing và font-smoothing |
| **Create** | `frontend/src/styles/global.css`| Styles toàn cục cho layout và scrollbar |
| **Create** | `frontend/src/main.tsx` | Khởi chạy React DOM bọc App |
| **Create** | `frontend/src/App.tsx` | Component gốc chứa placeholder kiểm tra build |

---

## Implementation Steps

### Bước 1: Khởi tạo Project qua Vite Scaffolding (TSK-001)
1. Di chuyển vào thư mục dự án và chạy scaffolding Vite tạo `frontend/`:
   ```bash
   npm create vite@latest frontend -- --template react-ts
   ```
2. Cấu hình `frontend/tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "useDefineForClassFields": true,
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": false,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     },
     "include": ["src"]
   }
   ```

### Bước 2: Cài đặt Dependencies Cốt lõi (TSK-002)
Di chuyển vào `frontend/` và cài đặt các thư viện đã quyết định:
```bash
npm install react-router-dom zustand date-fns @fontsource/be-vietnam-pro @fontsource/inter lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/node
```

### Bước 3: Cấu hình Vite Alias & Vitest (TSK-003)
Tạo `frontend/vite.config.ts` hỗ trợ alias `@/`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
```
Tạo `frontend/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Bước 4: Thiết lập Hệ thống CSS Design Tokens (TSK-004)
Tạo file `frontend/src/styles/tokens.css` chứa toàn bộ biến CSS từ Tài liệu 12:
- Mã màu thương hiệu: `--color-primary: #1677FF`, `--color-bg-layout: #F5F7FA`, `--color-surface: #FFFFFF`.
- Bảng màu ca làm việc WCAG AA: Sáng (`#E6F7FF`), Chiều (`#FFF7E6`), Tối (`#F9F0FF`), Đêm (`#FFF1F0`), Phép (`#F6FFED`), Lễ (`#FFF0F6`).
- Thang cỡ chữ: `--font-h1` (24px), `--font-h2` (20px), `--font-body` (14px), `--font-caption` (12px).
- Hệ thống Spacing 8pt: `--space-xs` (8px), `--space-md` (16px), `--space-lg` (24px).
- Bo góc & Shadows: `--radius-md` (6px), `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
- Breakpoints: `--bp-mobile: 768px`, `--bp-tablet: 1024px`, `--bp-desktop: 1440px`.

### Bước 5: Khởi tạo Khung Thư mục Chuẩn (TSK-005)
Tạo cấu trúc thư mục rỗng trong `src/`:
`assets/`, `components/ui/`, `components/layout/`, `components/feedback/`, `data/mock/`, `data/repositories/`, `data/services/`, `features/`, `hooks/`, `routes/`, `store/`, `styles/`, `types/`, `utils/`.

---

## Todo List
- [x] Khởi tạo thư mục `frontend/` qua Vite React-TS.
- [x] Cấu hình strict type checks trong `tsconfig.json`.
- [x] Cài đặt đầy đủ runtime dependencies và test devDependencies.
- [x] Cấu hình alias `@/` trong `vite.config.ts` và `vitest.config.ts`.
- [x] Viết file `src/styles/tokens.css`, `reset.css`, `global.css`.
- [x] Import fonts Be Vietnam Pro và Inter trong `main.tsx`.
- [x] Chạy kiểm thử mẫu `vitest run` xác nhận test runner hoạt động.
- [x] Chạy lệnh `npm run build` xác nhận zero build errors.

---

## Success Criteria (Definition of Done)
1. Thư mục `frontend/` tồn tại độc lập, không làm ảnh hưởng repo gốc.
2. Lệnh `npm run build` thực thi thành công với mã thoát 0 (Exit code 0).
3. Lệnh `npx vitest run` thực thi thành công.
4. Mở `npm run dev` trên trình duyệt hiển thị màn hình kiểm tra nền tảng với font chữ Be Vietnam Pro và màu sắc Design Tokens chính xác.

---

## Risk Assessment
- **Rủi ro:** Xung đột phiên bản package giữa React 19 và các thư viện phụ thuộc chưa cập nhật peer dependencies.
  - *Giải pháp:* Nếu npm báo lỗi peer dependency khi cài đặt, sử dụng cờ `--legacy-peer-deps` hoặc chỉ định `react@^18.3.1` và `react-dom@^18.3.1`.
- **Rủi ro:** Lỗi đường dẫn alias `@/` khi chạy Vitest.
  - *Giải pháp:* Cấu hình `resolve.alias` đồng bộ cả trong `vite.config.ts` và `vitest.config.ts`.

---

## Next Steps
Sau khi Phase 01 hoàn tất và vượt qua tiêu chí nghiệm thu, chuyển tiếp ngay sang [Phase 02: Khung Ứng Dụng, State & Scheduling Engine](./phase-02-app-shell-and-engine.md).
