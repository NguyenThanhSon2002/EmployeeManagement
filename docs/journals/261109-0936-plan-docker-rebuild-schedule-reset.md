# Nhật Ký Kỹ Thuật: Lập Kế Hoạch Rebuild Docker & Đồng Bộ Reset Tuần

- **Thời gian:** 09/11/2026 09:36:00
- **Tác vụ:** Lập kế hoạch 4 phase để hoàn thiện tối ưu mã nguồn và rebuild lại Docker containers cho môi trường thực thi cổng 8082.
- **Kế hoạch đã lập:** `plans/261109-0936-docker-rebuild-and-reset-sync/plan.md`

## Tóm Tắt 4 Phase Của Kế Hoạch
1. **Phase 1:** Backend JPA Bulk Delete Optimization (`ShiftAssignmentRepository.java` với `@Modifying @Transactional @Query`).
2. **Phase 2:** Frontend Store Authoritative Refresh (Đồng bộ gọi `fetchWeeklySchedule` sau khi reset thành công trong `useScheduleStore.ts`).
3. **Phase 3:** Docker Containers Rebuild & Deployment (`docker compose up -d --build frontend backend`).
4. **Phase 4:** End-to-End Verification & Persistence Testing (Kiểm chứng dọn sạch dữ liệu qua F5 trên `http://localhost:8082`).

## Lệnh Thực Thi Kế Tiếp
- `/aikit-core:xd:cook plans/261109-0936-docker-rebuild-and-reset-sync`
