# TÀI LIỆU 00: SỔ BỘ QUYẾT ĐỊNH, GIẢ ĐỊNH VÀ THUẬT NGỮ HỆ THỐNG
**Dự án:** Employee Management System (Hệ thống Quản lý Nhân sự, Ca làm việc & Chấm công)  
**Phiên bản:** 1.0.0  
**Ngày lập:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. MỤC TIÊU VÀ PHẠM VI TÀI LIỆU
Tài liệu này ghi nhận toàn bộ các quyết định kiến trúc cốt lõi (Architectural Decision Records - ADR), các giả định nghiệp vụ - kỹ thuật, các giới hạn ngoài phạm vi (Out of Scope), và bảng thuật ngữ chuẩn hóa áp dụng xuyên suốt dự án **Employee Management System**.

Mọi thành viên tham gia phát triển (Backend, Frontend, QA, DevOps, Product) bắt buộc phải tuân thủ các quyết định trong tài liệu này. Bất kỳ sự thay đổi nào đều phải tuân theo quy trình "How to change it later" được định nghĩa trong từng mục.

---

## 2. SỔ BỘ QUYẾT ĐỊNH (DECISION REGISTER - DEC)

### DEC-001: Nền tảng Backend - Java 21 LTS & Spring Boot 3.3.x
- **Bối cảnh:** Cần xây dựng backend enterprise vững chắc cho doanh nghiệp quy mô 50 - 300 nhân sự, dễ bảo trì, có khả năng xử lý concurrency tốt khi chấm công tập trung đầu giờ và kiểm tra xung đột lịch làm việc. Đội ngũ là Java developer đang phát triển kỹ năng full-stack.
- **Quyết định:** Chọn **Java 21 LTS** và **Spring Boot 3.3.x** làm framework nền tảng chính thức. Sử dụng Spring Web, Spring Data JPA/Hibernate, Spring Security 6, Bean Validation (Hibernate Validator), MapStruct (DTO mapping) và Maven làm build tool.
- **Lý do & Đánh đổi:**
  - *Ưu điểm:* Java 21 LTS mang lại hiệu năng vượt trội, hỗ trợ Virtual Threads (Project Loom) giúp xử lý I/O non-blocking nhẹ nhàng mà không cần lập trình reactive phức tạp; Record classes và Pattern Matching giúp code ngắn gọn, an toàn kiểu dữ liệu. Spring Boot 3.3 chuẩn hóa cấu hình, tích hợp hoàn hảo với Spring Security 6 và JPA 3.
  - *Đánh đổi:* Cần môi trường chạy tối thiểu Java 21; một số thư viện cũ của bên thứ ba nếu chưa nâng cấp lên Jakarta EE 10 có thể cần giải pháp thay thế.
- **Phương án thay thế đã xem xét:**
  - *Java 17 LTS:* Rất ổn định nhưng thiếu Virtual Threads chính thức và các cú pháp pattern matching hiện đại của Java 21.
  - *Node.js (NestJS) / Python (FastAPI):* Dễ học nhưng không tận dụng được thế mạnh cốt lõi của lập trình viên Java và khả năng kiểm soát type-safe mạnh mẽ của Spring Data JPA trong mô hình dữ liệu quan hệ phức tạp.
- **Tác động:** Toàn bộ backend tuân thủ chuẩn Spring Boot 3.x, sử dụng namespace `jakarta.*`.
- **Cách thay đổi sau này:** Nếu buộc phải hạ xuống Java 17 vì hạ tầng server cũ, chỉ cần đổi `java.version` trong `pom.xml` thành 17 và tắt các tính năng Virtual Threads, không làm vỡ cấu trúc domain.

---

### DEC-002: Cơ sở dữ liệu quan hệ MySQL 8.0 & Flyway Migrations
- **Bối cảnh:** Dữ liệu nhân sự, ca làm việc, chấm công và phép năm đòi hỏi tính toàn vẹn dữ liệu nghiêm ngặt (ACID), hỗ trợ khóa ngoại, ràng buộc kiểm tra (Check Constraints) và đánh chỉ mục phức tạp phục vụ truy vấn dải ngày (date range overlap).
- **Quyết định:** Sử dụng **MySQL 8.0+** làm hệ quản trị CSDL quan hệ chính thức. Quản lý toàn bộ vòng đời schema và dữ liệu khởi tạo thông qua **Flyway Migration**.
- **Lý do & Đánh đổi:**
  - *Ưu điểm:* MySQL 8.0 hỗ trợ Window Functions, Common Table Expressions (CTE), Check Constraints, JSON type và cải tiến InnoDB locking rất mạnh mẽ. Flyway đảm bảo tính bất biến (immutable), tự động hóa triển khai trên mọi môi trường (Dev, Staging, Prod) thông qua versioned SQL scripts (`V1__...sql`).
  - *Đánh đổi:* Không có một số kiểu dữ liệu dải ngày chuyên biệt như `tstzrange` của PostgreSQL (sẽ giải quyết bằng index tổ hợp và logic JPA Specification).
- **Phương án thay thế đã xem xét:**
  - *PostgreSQL 16:* Rất tốt cho date-range index (`btree_gist`), nhưng MySQL 8.0 phổ biến hơn tại phần lớn doanh nghiệp vừa và nhỏ ở Việt Nam, chi phí vận hành hosting/cloud rẻ hơn và thân thiện với developer Java hơn.
- **Tác động:** Cấm tuyệt đối bật `hibernate.ddl-auto=update` trên môi trường Production; mọi thay đổi bảng đều phải qua script Flyway.
- **Cách thay đổi sau này:** Flyway phân lập script SQL độc lập. Nếu sau này migrate sang PostgreSQL, viết bộ script Flyway mới với dialect PostgreSQL.

---

### DEC-003: Kiến trúc Frontend - React 18/19, TypeScript, Vite & TanStack Query
- **Bối cảnh:** Frontend cần giao diện quản trị nhanh, tin cậy, type-safe từ đầu đến cuối, render bảng lịch biểu tuần mượt mà và quản lý trạng thái server bất đồng bộ hiệu quả.
- **Quyết định:** Chọn **React (phiên bản ổn định 18.3/19)** kết hợp **TypeScript 5.x**, công cụ đóng gói siêu tốc **Vite**, định tuyến **React Router v6**, quản lý server-state bằng **TanStack Query (React Query v5)**, quản lý form và xác thực bằng **React Hook Form + Zod**.
- **Lý do & Đánh đổi:**
  - *Ưu điểm:* Vite khởi động dev server trong vài trăm mili-giây. TypeScript loại bỏ lỗi runtime giao diện. TanStack Query tự động caching, refetch, stale-time và optimistic UI cho các thao tác đổi ca/chấm công mà không cần viết boilerplate Redux cồng kềnh. Zod chia sẻ cấu trúc validation logic tương đồng với backend Bean Validation.
  - *Đánh đổi:* Lập trình viên Java mới học frontend cần nắm rõ vòng đời hooks và mô hình bất đồng bộ của React.
- **Phương án thay thế đã xem xét:**
  - *Next.js (App Router):* Tốt cho SEO/SSR, nhưng hệ thống HRMS là ứng dụng nội bộ (Internal Dashboard), SSR chỉ làm tăng độ phức tạp của server và chi phí hosting không cần thiết.
  - *Redux Toolkit:* Quá nhiều boilerplate cho ứng dụng mà 90% trạng thái là dữ liệu đồng bộ từ REST API (Server State).
- **Tác động:** Mã nguồn frontend tổ chức theo module tính năng, chia sẻ kiểu TypeScript sinh từ schema API.
- **Cách thay đổi sau này:** Thay thế các thư viện tiện ích cục bộ mà không ảnh hưởng tới kiến trúc component và routing.

---

### DEC-004: Lựa chọn Thư viện Giao diện (UI Library) - Ant Design 5.x
- **Bối cảnh:** Cần một thư viện giao diện chuẩn Enterprise Dashboard, hỗ trợ đầy đủ các thành phần quản trị phức tạp (bảng dữ liệu lớn, lọc đa cột, phân trang server-side, cây phòng ban, bộ chọn ngày giờ, modal, drawer, form validation) và hỗ trợ hoàn hảo tiếng Việt.
- **So sánh đánh giá:**

| Tiêu chí | Ant Design 5.x (Được chọn) | Material UI (MUI v5/v6) | CoreUI React |
|:---|:---|:---|:---|
| **Định hướng ứng dụng** | Chuyên biệt cho Enterprise Admin/B2B Backoffice | Ứng dụng B2C, Mobile-first, Custom theme cao | Admin template sẵn |
| **Hệ thống Table & Form** | Cực mạnh, tích hợp lọc, sắp xếp, TreeTable, Form dynamic | Mạnh nhưng cần tự ghép nối nhiều component phụ | Đơn giản, tính năng nâng cao hạn chế |
| **Hỗ trợ Tiếng Việt (i18n)** | Có sẵn `vi_VN` locale chuẩn xác cho DatePicker, Table, Pagination | Phải cấu hình locale thủ công nhiều vị trí | Hạn chế, tự dịch |
| **Tốc độ phát triển** | Nhanh nhất (Out-of-the-box components cho CRUD) | Trung bình (Tốn thời gian style và theme) | Nhanh ban đầu, khó tùy biến sâu |
| **Độ thẩm mỹ doanh nghiệp** | Thanh lịch, gọn gàng, tiêu chuẩn phần mềm quản trị | Trực quan kiểu Google Material | Cổ điển kiểu Bootstrap |

- **Quyết định:** Chọn **Ant Design 5.x**.
- **Lý do:** Ant Design được thiết kế đặc thù cho các hệ thống phần mềm quản trị nội bộ (B2B Enterprise). Hệ thống component Table, DatePicker, TreeSelect, Modal, Notification hoạt động mượt mà, tài liệu phong phú và cung cấp sẵn gói locale `antd/locale/vi_VN`.
- **Cách thay đổi sau này:** Bọc (wrap) các component cơ bản (Button, Input, Table, Modal) qua một lớp UIKit nội bộ (`components/ui/*`) để không bị phụ thuộc cứng (vendor lock-in).

---

### DEC-005: Giải pháp Bảng Lịch Biểu Tuần (Weekly Timetable Grid) - Custom CSS Grid / Virtual Table
- **Bối cảnh:** Tính năng cốt lõi của hệ thống là **Lịch làm việc tuần (Màn hình SCR-11)** hiển thị theo ma trận: **Hàng = Nhân viên (Resources)**, **Cột = 7 ngày trong tuần (Thứ 2 đến Chủ nhật)**. Mỗi ô hiển thị 1 hoặc nhiều ca làm việc (Shift Chips), trạng thái (Draft/Published), cảnh báo xung đột (Conflict Badges), hỗ trợ click để gán ca, sao chép và xem chi tiết.
- **So sánh đánh giá:**

| Tiêu chí | Custom CSS Grid / HTML Table (Được chọn) | FullCalendar (Resource Timeline) | React Big Calendar |
|:---|:---|:---|:---|
| **Mô hình Resource Matrix** | 100% linh hoạt theo đúng yêu cầu "Nhân viên x Ngày" | Rất tốt, nhưng tính năng Resource Timeline **đòi hỏi gói trả phí Premium Commercial License ($480+)** | Chỉ hỗ trợ tốt Day/Week view theo trục thời gian giờ, không tối ưu cho danh sách nhân sự dạng hàng |
| **Tùy biến Chip & Badge** | Tự do can thiệp DOM, icon, màu sắc WCAG, popover chi tiết | Hạn chế qua template function, styling phức tạp | Khó tùy biến giao diện dạng ca phân tầng |
| **Chi phí bản quyền** | **Miễn phí 100% (Open Source)** | Tốn phí bản quyền thương mại hàng năm | Miễn phí (MIT) |
| **Hiệu năng với 200 nhân sự** | Tối ưu tuyệt đối bằng CSS Grid cố định cột + Virtual Scrolling (TanStack Virtual) | Nặng DOM nếu render nhiều event | Suy giảm hiệu năng khi nhiều sự kiện |

- **Quyết định:** 
  1. Sử dụng **Custom Grid Component** xây dựng bằng **CSS Grid + Flexbox** kết hợp **TanStack Virtual** (để ảo hóa danh sách 200+ nhân viên) cho màn hình **Weekly Timetable (Lịch tuần nhân viên theo hàng)**.
  2. Sử dụng component **Calendar có sẵn của Ant Design** cho chế độ xem tổng quan theo tháng (Monthly Overview).
- **Lý do:** Tiết kiệm 100% chi phí bản quyền thương mại cho doanh nghiệp SME, nắm quyền kiểm soát 100% logic hiển thị thẻ ca, cờ cảnh báo (Mandatory/Warning badge), thao tác kéo chọn hoặc mở drawer gán ca.
- **Cách thay đổi sau này:** Toàn bộ logic hiển thị lịch tuần được đóng gói trong component `<WeeklyRosterGrid />`, nhận dữ liệu chuẩn DTO từ backend, dễ dàng thay thế thư viện khác nếu mua bản quyền sau này.

---

### DEC-006: Chiến lược Xác thực & Phân quyền - Stateless JWT kết hợp Refresh Token trong HttpOnly Cookie
- **Bối cảnh:** Cần phương thức xác thực an toàn, phù hợp với kiến trúc Single Page Application (React) giao tiếp qua REST API với Spring Boot backend, thân thiện với developer Java đang học full-stack nhưng không hy sinh tính bảo mật.
- **So sánh đánh giá:**

| Tiêu chí | JWT (Access Token + HttpOnly Refresh Token) (Được chọn) | Server-side Session (Spring Session + Redis) | Pure JWT trong LocalStorage |
|:---|:---|:---|:---|
| **Bảo mật XSS / CSRF** | An toàn cao: Access Token lưu bộ nhớ JS (in-memory), Refresh Token lưu HttpOnly Cookie (chống XSS) | Cần cấu hình bảo vệ CSRF chặt chẽ cho cookie `JSESSIONID` | **Rất nguy hiểm**: Access Token dễ bị mã độc XSS đánh cắp từ LocalStorage |
| **Khả năng thu hồi (Revoke)** | Thu hồi tức thì bằng cách xóa Refresh Token trong DB/Cache khi người dùng đăng xuất | Hủy session trên server ngay lập tức | Không thể thu hồi JWT trước khi hết hạn tự nhiên |
| **Mức độ phức tạp triển khai** | Vừa phải: Chuẩn mực cho SPA REST API, Spring Security 6 hỗ trợ bộ lọc Bearer Token rõ ràng | Cần duy trì stateful session, cần thêm Redis nếu mở rộng đa node | Cực kỳ đơn giản nhưng vi phạm tiêu chuẩn an toàn doanh nghiệp |

- **Quyết định:** Sử dụng **Stateless JWT**:
  - `Access Token`: Thời hạn ngắn (15 phút), gửi qua HTTP Header `Authorization: Bearer <token>`, lưu trong bộ nhớ React state (không lưu LocalStorage).
  - `Refresh Token`: Thời hạn dài (7 ngày), lưu trữ trong `HttpOnly`, `Secure`, `SameSite=Strict` Cookie; có lưu bản ghi hash trong database để hỗ trợ thu hồi (Revoke/Blacklist) khi đăng xuất hoặc khóa tài khoản.
- **Lý do:** Cân bằng hoàn hảo giữa tính bảo mật chuẩn OWASP và sự thuận tiện của kiến trúc RESTful. Lập trình viên nắm rõ cơ chế bảo vệ token mà không bị phụ thuộc hạ tầng Redis phức tạp.
- **Cách thay đổi sau này:** Nếu hệ thống mở rộng quy mô lớn, chỉ cần chuyển bảng lưu `refresh_tokens` từ MySQL sang Redis để tăng tốc độ kiểm tra.

---

### DEC-007: Kiến trúc Hệ thống - Modular Monolith (Package-by-Feature)
- **Bối cảnh:** Hệ thống phục vụ doanh nghiệp quy mô 50 - 300 nhân sự, đơn công ty, một chi nhánh. Đội ngũ phát triển tinh gọn.
- **Quyết định:** Chọn mô hình kiến trúc **Modular Monolith** (Đơn khối mô-đun hóa) tổ chức mã nguồn theo hướng **Package-by-Feature**.
  - Các module độc lập: `auth`, `employee`, `department`, `shift`, `schedule`, `attendance`, `leave`, `report`, `audit`, `setting`.
  - Phân tầng nghiêm ngặt trong từng module: `controller` -> `service` -> `repository` -> `domain/entity` -> `dto`.
  - Giao tiếp giữa các module thông qua Service Interface hoặc Spring Application Events, tuyệt đối không truy vấn chéo Repository của module khác.
- **Lý do & Đánh đổi:**
  - *Tại sao không dùng Microservices?* Microservices tạo ra chi phí vô ích cực lớn tại thời điểm này: phân mảnh database (mất ACID, khó kiểm tra xung đột phân ca), độ trễ mạng giữa các service, triển khai phức tạp (Service Discovery, API Gateway, Distributed Tracing), trong khi tải thực tế của 300 nhân sự là rất nhỏ đối với một JVM server hiện đại.
  - *Tại sao không dùng Layered Architecture truyền thống (Package-by-Layer)?* Package-by-layer gom toàn bộ Controller vào một chỗ, Service vào một chỗ, khiến mã nguồn nhanh chóng biến thành "bát mì Ý", khó kiểm soát ranh giới nghiệp vụ (bounded context).
- **Cách thay đổi sau này:** Nhờ phân chia theo Feature Bounded Context, nếu trong tương lai module Chấm công hoặc Phân ca có lượng tải đột biến, có thể tách thành Microservice riêng biệt trong vòng 1-2 tuần mà không cần viết lại toàn bộ mã nguồn.

---

### DEC-008: Chiến lược Bất biến Lịch phân ca - Snapshotting dữ liệu Ca làm việc
- **Bối cảnh:** Người quản lý tạo mẫu ca (Shift Template, ví dụ "Ca Sáng: 08:00 - 17:00, nghỉ 60 phút"). Khi gán ca cho nhân viên vào các ngày trong tháng, dữ liệu lịch làm việc được sinh ra. Sau đó, nếu người quản lý sửa mẫu ca thành "08:30 - 17:30", việc này **không được phép làm thay đổi hồi tố** các ca làm việc đã xếp hoặc đã chấm công trong quá khứ.
- **Quyết định:** Áp dụng chiến lược **Snapshotting**:
  - Bảng `shift_assignments` lưu khóa ngoại `work_shift_id` tới mẫu ca gốc.
  - Đồng thời, sao chép bất biến các trường cấu hình tại thời điểm gán: `snapshot_shift_name`, `snapshot_start_time`, `snapshot_end_time`, `snapshot_break_minutes`, `snapshot_cross_midnight` vào thẳng bản ghi `shift_assignments`.
- **Lý do:** Đảm bảo toàn vẹn dữ liệu lịch sử kiểm toán (Audit Trail) tuyệt đối. Khi tính toán số giờ làm việc theo kế hoạch, hệ thống luôn đọc từ snapshot của bản ghi phân ca, không bao giờ phụ thuộc vào mẫu ca có thể bị sửa đổi trong tương lai.
- **Cách thay đổi sau này:** Nếu mẫu ca được nâng cấp thành phiên bản có quản lý version (Shift Template Versioning), chỉ cần liên kết tới `work_shift_versions` mà không làm thay đổi logic truy vấn hiện tại.

---

### DEC-009: Xử lý Múi giờ và Thời gian - UTC Lưu trữ, Asia/Ho_Chi_Minh Tính toán
- **Bối cảnh:** Trụ sở công ty hoạt động tại Việt Nam (múi giờ `Asia/Ho_Chi_Minh`, UTC+7). Cần thiết kế an toàn để không xảy ra sai lệch khi tính ngày công, chuyển ca đêm qua ngày và sẵn sàng mở rộng trong tương lai.
- **Quyết định:**
  - Cơ sở dữ liệu: Lưu toàn bộ mốc thời gian sự kiện (check-in, check-out, thời điểm tạo/sửa) dưới dạng `DATETIME` hoặc `TIMESTAMP` theo chuẩn **UTC**.
  - Các trường chỉ mang tính ngày lịch (ví dụ ngày phân ca `work_date`, ngày sinh, ngày vào làm): Lưu kiểu `DATE` (YYYY-MM-DD), gắn chặt với múi giờ hành chính `Asia/Ho_Chi_Minh`.
  - Backend Spring Boot: Đặt múi giờ mặc định của ứng dụng là `Asia/Ho_Chi_Minh` cho các phép tính nghiệp vụ (xác định ca làm việc thuộc ngày nào, kiểm tra ca đêm từ 22:00 - 06:00), nhưng serialize qua REST API theo chuẩn ISO-8601 kèm offset UTC (ví dụ: `2026-10-13T08:00:00Z`).
  - Frontend: Sử dụng Day.js với timezone plugin để hiển thị thời gian chính xác theo giờ địa phương của người dùng (`Asia/Ho_Chi_Minh`).
- **Lý do:** Việt Nam hiện không áp dụng giờ mùa hè (DST - Daylight Saving Time), nhưng việc lưu trữ chuẩn UTC giúp hệ thống không bao giờ gặp lỗi lệch giờ khi chuyển đổi server hay sao lưu đám mây.
- **Cách thay đổi sau này:** Nếu mở rộng sang các chi nhánh quốc tế (Nhật Bản, Singapore), bổ sung cột `timezone` trong bảng `departments` hoặc `system_settings`.

---

### DEC-010: Các Tham số Pháp định theo Bộ luật Lao động Việt Nam 2019
- **Bối cảnh:** Hệ thống vận hành tại Việt Nam, cần áp dụng các giới hạn theo Bộ luật Lao động số 45/2019/QH14.
- **Quyết định:** Toàn bộ các giới hạn pháp lý được **CẤU HÌNH ĐỘNG** trong bảng `system_settings`, tuyệt đối **KHÔNG HARD-CODE** trong mã nguồn. Giá trị mặc định (Seed data) ban đầu được thiết lập như sau:
  - Giờ làm việc bình thường: Tối đa 8 giờ/ngày, 48 giờ/tuần *(Điều 105 BLLĐ 2019)*.
  - Khung giờ làm việc ban đêm: Từ **22:00 đến 06:00** sáng hôm sau *(Điều 106 BLLĐ 2019)*.
  - Giới hạn làm thêm giờ (Overtime): Không quá 50% số giờ làm việc bình thường trong 01 ngày; tổng số giờ làm thêm không quá 40 giờ/tháng và 200 giờ/năm (trường hợp đặc biệt không quá 300 giờ) *(Điều 107 BLLĐ 2019)*.
  - Thời gian nghỉ ngơi tối thiểu giữa 2 ca làm việc liên tiếp: Ít nhất **12 giờ** *(Điều 110 BLLĐ 2019)*.
  - Nghỉ hàng tuần: Người lao động được nghỉ ít nhất 24 giờ liên tục trong 1 tuần *(Điều 111 BLLĐ 2019)*.
  - Phép năm cơ bản: **12 ngày/năm** cho người lao động làm việc đủ 12 tháng trong điều kiện bình thường *(Điều 113 BLLĐ 2019)*.
- **Lưu ý pháp lý bắt buộc:** `[NEEDS VERIFICATION by HR/legal]` - Toàn bộ các giá trị mặc định trên chỉ mang tính thiết lập kỹ thuật tham khảo theo luật định, không cấu thành ý kiến tư vấn pháp lý. Ban nhân sự và Pháp chế của doanh nghiệp có quyền điều chỉnh phù hợp với Nội quy lao động và Thỏa ước lao động tập thể thông qua màn hình Cài đặt hệ thống.
- **Cách thay đổi sau này:** Quản trị viên điều chỉnh trực tiếp trên giao diện Cài đặt (SCR-16 / `system_settings`).

---

### DEC-011: Phương thức Chấm công MVP - Web Check-in / Check-out
- **Bối cảnh:** Giai đoạn MVP ưu tiên triển khai nhanh chóng, chi phí thấp cho khối văn phòng và nhân viên ca kíp. Doanh nghiệp chưa đầu tư máy chấm công vân tay, camera AI khuôn mặt hay thiết bị định vị GPS tại điểm làm việc.
- **Quyết định:**
  - Chấm công MVP thực hiện qua giao diện Web: Nhân viên đăng nhập vào hệ thống và nhấn nút **Check-in** / **Check-out** trên Dashboard (SCR-02) hoặc Trang cá nhân (SCR-17).
  - Bảng `attendance_records` lưu trường `source` với giá trị mặc định là `'WEB_PORTAL'`.
  - Thiết kế kiến trúc hỗ trợ mở rộng thêm các nguồn: `'BIOMETRIC_DEVICE'`, `'QR_CODE'`, `'GPS_MOBILE'`, `'IMPORT_EXCEL'`, `'MANUAL_CORRECTION'` mà không làm thay đổi schema cốt lõi.
- **Lý do:** Đảm bảo hệ thống hoạt động ngay lập tức mà không phụ thuộc vào hạ tầng phần cứng của bên thứ ba, đồng thời kiến trúc sẵn sàng cho tương lai.
- **Cách thay đổi sau này:** Bổ sung API webhook hoặc cron job đồng bộ log từ máy chấm công vân tay ZKTeco / Ronald Jack vào bảng `attendance_records` với `source = 'BIOMETRIC_DEVICE'`.

---

### DEC-012: Kiểm soát Đồng thời (Concurrency Control) - Optimistic Locking
- **Bối cảnh:** Nhiều Trưởng bộ phận hoặc nhân sự có thể cùng mở giao diện Lịch tuần (SCR-11) của cùng một phòng ban tại một thời điểm để xếp ca, dẫn đến nguy cơ ghi đè dữ liệu của nhau (Lost Update).
- **Quyết định:** Áp dụng cơ chế **Optimistic Locking (Khóa lạc quan)**:
  - Bảng `schedules` và `shift_assignments` đều có cột `version INT NOT NULL DEFAULT 0`.
  - Entity JPA sử dụng annotation `@Version private Integer version;`.
  - Khi frontend gửi yêu cầu cập nhật lịch, bắt buộc gửi kèm giá trị `version` hiện tại.
  - Nếu bản ghi đã bị người khác cập nhật trước đó, Spring Data JPA sẽ ném ngoại lệ `OptimisticLockException`. Backend bắt ngoại lệ này và trả về mã lỗi HTTP `409 Conflict`.
  - Frontend hiển thị thông báo rõ ràng: *"Lịch làm việc này vừa được cập nhật bởi một người quản lý khác. Vui lòng tải lại dữ liệu mới nhất trước khi thực hiện thao tác."*
- **Lý do:** Khóa lạc quan không giữ khóa trong database (Pessimistic lock), không gây nghẽn kết nối DB (deadlock), mang lại trải nghiệm tối ưu cho hệ thống web doanh nghiệp.
- **Cách thay đổi sau này:** Có thể nâng cấp kết hợp WebSocket để bắn thông báo real-time khi có người đang chỉnh sửa chung một bảng lịch.

---

### DEC-013: Xóa mềm (Soft Delete) và Toàn vẹn Dữ liệu
- **Bối cảnh:** Dữ liệu nhân sự, phòng ban, ca làm việc và bảng chấm công liên quan trực tiếp đến pháp lý lao động và tính liên tục của lịch sử. Xóa vật lý (Hard Delete) sẽ làm vỡ các mối quan hệ khóa ngoại và phá hủy bằng chứng kiểm toán.
- **Quyết định:** Áp dụng chính sách **Xóa mềm 100% (Soft Delete)** trên toàn bộ các bảng nghiệp vụ:
  - Bảng sử dụng 2 trường: `is_active BOOLEAN NOT NULL DEFAULT TRUE` và `deleted_at DATETIME NULL`.
  - Tất cả các câu truy vấn thông thường đều tự động kèm điều kiện `deleted_at IS NULL` (thông qua `@SQLRestriction("deleted_at IS NULL")` của Hibernate 6.x).
  - Không bao giờ thực thi câu lệnh SQL `DELETE` trên bảng nghiệp vụ; chỉ thực thi cập nhật `deleted_at = NOW()`, `is_active = FALSE`.
- **Lý do:** Bảo vệ dữ liệu tuyệt đối trước thao tác nhầm lẫn của người dùng, cho phép khôi phục khi cần thiết.
- **Cách thay đổi sau này:** Tạo định kỳ job lưu trữ (Archiving job) chuyển dữ liệu đã xóa mềm trên 5 năm sang bảng lưu trữ lạnh (Cold Storage Archive) nếu dung lượng DB tăng cao.

---

### DEC-014: Phân tách Độc lập Kế hoạch Phân ca và Bản ghi Chấm công Thực tế
- **Bối cảnh:** Phân ca làm việc (Work Schedule) là kế hoạch doanh nghiệp kỳ vọng nhân viên thực hiện (Planned). Chấm công (Attendance) là thực tế người lao động có mặt làm việc (Actual). Có trường hợp nhân viên đi làm không có ca xếp trước, hoặc có ca nhưng vắng mặt, hoặc làm ca này nhưng thực tế làm thay ca khác.
- **Quyết định:**
  - Tách thành hai thực thể độc lập hoàn toàn: Bảng `shift_assignments` (Kế hoạch) và bảng `attendance_records` (Thực tế).
  - Bảng `attendance_records` có khóa ngoại `shift_assignment_id` trỏ tới ca làm việc tương ứng (có thể `NULL` nếu nhân viên đi làm ngoài lịch phân ca).
  - Tuyệt đối **KHÔNG ĐƯỢC GHI ĐÈ** dữ liệu giờ kế hoạch bằng giờ thực tế và ngược lại.
- **Lý do:** Đảm bảo báo cáo đối chiếu giữa Kế hoạch và Thực tế (Scheduled vs. Actual Hours) luôn chính xác 100%, phục vụ minh bạch trong đánh giá kỷ luật lao động và hiệu suất.
- **Cách thay đổi sau này:** Dễ dàng bổ sung tính năng tự động khớp ca linh hoạt (Auto-matching shift logic) dựa trên giờ check-in thực tế của nhân viên.

---

### DEC-015: Quy tắc Ca làm việc Qua đêm (Overnight Shift Attribution & Hour Splitting)
- **Bối cảnh:** Doanh nghiệp có các ca làm việc qua đêm (ví dụ: Ca đêm bắt đầu từ 22:00 hôm nay đến 06:00 sáng hôm sau). Cần xác định ca này thuộc về ngày nào trong lịch phân ca và số giờ làm việc được phân bổ như thế nào trong báo cáo ngày/tháng.
- **Quyết định:**
  - **Quy tắc Phân ca (Roster Attribution):** Ca làm việc qua đêm **thuộc về ngày mà ca bắt đầu**. Ví dụ: Ca 22:00 ngày Thứ Hai đến 06:00 ngày Thứ Ba được xếp và hiển thị trên ô lịch ngày Thứ Hai.
  - **Quy tắc Tách giờ Công (Hour Splitting for Timesheet):**
    - Trong bản ghi chấm công tổng thể của ca: Tổng giờ làm việc thực tế (8 giờ) và tổng giờ làm việc ban đêm (8 giờ đêm từ 22:00-06:00) được gắn liền với ca làm việc đó.
    - Trong báo cáo thống kê theo ngày hành chính thực tế (Calendar Day Report): Hệ thống hỗ trợ cờ tính toán tách giờ qua ranh giới 00:00 (2 giờ thuộc ngày bắt đầu, 6 giờ thuộc ngày hôm sau) phục vụ việc tính toán giới hạn giờ làm việc trong ngày chuẩn xác.
- **Lý do:** Phù hợp với thói quen phân ca thực tế tại các nhà máy, nhà hàng, khách sạn và văn phòng trực ca tại Việt Nam; nhân viên nhìn vào lịch ngày Thứ Hai biết mình phải đi làm ca đêm đó.
- **Cách thay đổi sau này:** Cung cấp tùy chọn cấu hình trong `system_settings`: `OVERNIGHT_SHIFT_ATTRIBUTION = 'START_DATE'` (mặc định) hoặc `'END_DATE'`.

---

## 3. CÁC GIẢ ĐỊNH NGHIỆP VỤ (BUSINESS ASSUMPTIONS)

1. **Quy mô và Thực thể Doanh nghiệp:**
   - Hệ thống phục vụ 01 pháp nhân doanh nghiệp duy nhất (Single Company/Single Tenant), 01 trụ sở chính tại Việt Nam, quy mô nhân sự từ 50 đến 300 nhân viên, cơ cấu tổ chức gồm 5 đến 15 phòng ban.
2. **Hình thức Làm việc:**
   - Kết hợp giữa nhân viên khối văn phòng (giờ hành chính cố định, ví dụ 08:00 - 17:00, nghỉ trưa 12:00 - 13:00) và nhân viên khối vận hành/dịch vụ (làm việc theo ca xoay vòng: sáng, chiều, tối, đêm, ca qua đêm).
3. **Múi giờ và Định dạng:**
   - Múi giờ duy nhất: `Asia/Ho_Chi_Minh` (GMT+7).
   - Định dạng ngày tháng hiển thị người dùng: `dd/MM/yyyy` (ví dụ: `13/10/2026`).
   - Định dạng giờ hiển thị: 24 giờ (`HH:mm`, ví dụ: `08:30`, `22:00`).
   - Số điện thoại nhân viên: Định dạng số điện thoại di động Việt Nam (10 chữ số, đầu số `03x`, `05x`, `07x`, `08x`, `09x` hoặc tiền tố quốc tế `+84`).
4. **Ngôn ngữ và Ký hiệu:**
   - Giao diện người dùng (UI), thông báo lỗi hiển thị, tài liệu hướng dẫn và báo cáo xuất ra: **100% Tiếng Việt**.
   - Tên bảng CSDL, tên cột, endpoint API, biến mã nguồn, class model: **Tiếng Anh chuẩn kỹ thuật (snake_case cho DB/API, camelCase cho Java/TypeScript)**.
   - Dữ liệu mẫu (Seed Data / Fixtures): Sử dụng tên người Việt Nam thực tế, tên phòng ban thực tế tại doanh nghiệp Việt Nam.

---

## 4. DANH MỤC NGOÀI PHẠM VI (EXPLICIT OUT-OF-SCOPE)

Các tính năng sau đây **tuyệt đối không nằm trong phạm vi phát triển của giai đoạn MVP**, được ghi nhận để loại trừ các rủi ro phát sinh công việc ngoài kiểm soát. Chúng được xem xét trong Lộ trình Tương lai (Future Roadmap):

1. **Tính lương và Bảng lương tự động (Payroll & Salary Calculation):** Không tính số tiền lương thực nhận, không tính thuế thu nhập cá nhân (TNCN), không tính bảo hiểm xã hội (BHXH/BHYT/BHTN). Hệ thống chỉ xuất dữ liệu số giờ công thực tế, giờ tăng ca, số ngày nghỉ phép để chuyển giao cho bộ phận kế toán tiền lương.
2. **Tuyển dụng và Tiếp nhận nhân sự (Recruitment & Onboarding):** Không quản lý ứng viên, tin tuyển dụng, phỏng vấn.
3. **Quản lý Hợp đồng lao động chi tiết (Labor Contract Management):** Không lưu trữ file scan hợp đồng, không ký số điện tử hợp đồng, chỉ quản lý thuộc tính loại hợp đồng (`employment_type`) và ngày vào làm.
4. **Đánh giá hiệu suất và KPI (Performance Review / OKRs / KPIs):** Không đánh giá định kỳ nhân viên.
5. **Đa chi nhánh và Đa công ty (Multi-branch / Multi-tenant / Multi-company):** Hệ thống chỉ chạy cho một đơn vị duy nhất.
6. **Ứng dụng Di động Native (Native Mobile App iOS / Android):** Hệ thống là Web Application Responsive (hoạt động tối ưu trên trình duyệt di động cho các tác vụ chấm công và xem lịch cá nhân).
7. **Tích hợp Phần cứng Sinh trắc học trực tiếp (Direct Biometric Device Drivers):** Không viết driver giao tiếp socket trực tiếp với máy chấm công trong MVP; chỉ thiết kế sẵn cấu trúc bảng và trường `source` để tiếp nhận dữ liệu sau này.
8. **Đa ngôn ngữ Giao diện (Multi-language UI):** Giao diện MVP chỉ hỗ trợ tiếng Việt.

---

## 5. BẢNG THUẬT NGỮ CHUẨN HÓA (GLOSSARY)

| Thuật ngữ Tiếng Anh | Thuật ngữ Tiếng Việt | Định nghĩa & Ý nghĩa Nghiệp vụ trong Hệ thống |
|:---|:---|:---|
| **Employee** | Nhân viên | Người lao động có hồ sơ hoạt động trong hệ thống, thuộc một phòng ban và chức danh cụ thể. |
| **Department** | Phòng ban | Đơn vị tổ chức trong doanh nghiệp, có quan hệ phân cấp cây (phòng ban cha - con) và người quản lý trực tiếp. |
| **Position / Job Title** | Chức danh / Vị trí | Vị trí công việc của nhân viên (ví dụ: Nhân viên kinh doanh, Trưởng nhóm kỹ thuật, Chuyên viên nhân sự). |
| **Work Shift (Template)** | Mẫu ca làm việc | Cấu hình ca tái sử dụng định nghĩa giờ bắt đầu, giờ kết thúc, thời gian nghỉ và màu sắc hiển thị. |
| **Shift Assignment** | Phân ca làm việc | Bản ghi chỉ định một nhân viên cụ thể làm một ca cụ thể vào một ngày làm việc cụ thể. |
| **Work Schedule (Roster)** | Lịch làm việc tuần / kỳ | Khung chứa tập hợp các phân ca làm việc của một phòng ban trong một khoảng thời gian, có trạng thái Draft hoặc Published. |
| **Draft Schedule** | Lịch nháp | Lịch làm việc đang được người quản lý soạn thảo, chưa công bố, nhân viên chưa nhìn thấy trên lịch cá nhân. |
| **Published Schedule** | Lịch đã công bố | Lịch làm việc chính thức đã được phê duyệt và phát hành; nhân viên nhìn thấy ca làm việc của mình. Mọi thay đổi sau khi công bố đều bị ghi log kiểm toán. |
| **Attendance Record** | Bản ghi chấm công | Bản ghi ghi nhận thời điểm Check-in và Check-out thực tế của nhân viên trong ngày làm việc. |
| **Attendance Correction** | Giải trình / Điều chỉnh chấm công | Quy trình nhân viên gửi yêu cầu sửa giờ chấm công (do quên quét, công tác) và được người quản lý phê duyệt. |
| **Actual Working Hours** | Số giờ làm việc thực tế | Tổng số giờ nhân viên thực sự có mặt làm việc sau khi đã trừ thời gian nghỉ không hưởng lương. |
| **Scheduled Hours** | Số giờ làm việc theo kế hoạch | Tổng số giờ làm việc được quy định trong ca được phân công (đã trừ giờ nghỉ theo ca). |
| **Overtime (OT)** | Làm thêm giờ / Tăng ca | Số giờ làm việc thực tế vượt quá giờ chuẩn của ca làm việc hoặc làm việc vào ngày nghỉ, ngày lễ theo phê duyệt. |
| **Night Shift Hours** | Giờ làm việc ban đêm | Số giờ làm việc thực tế rơi vào khoảng thời gian từ 22:00 hôm trước đến 06:00 sáng hôm sau. |
| **Leave Request** | Đơn xin nghỉ phép | Yêu cầu nghỉ (phép năm, nghỉ ốm, việc riêng, không lương) của nhân viên gửi lên quản lý phê duyệt. |
| **Leave Balance** | Quỹ phép / Số dư ngày phép | Số ngày nghỉ phép có hưởng lương còn lại của nhân viên trong năm dương lịch. |
| **Company Holiday** | Ngày lễ / Ngày nghỉ công ty | Ngày nghỉ lễ theo quy định nhà nước (Tết, 30/4, 1/5...) hoặc ngày nghỉ riêng theo chính sách công ty. |
| **Conflict Detection** | Phát hiện xung đột lịch | Cơ chế tự động quét và cảnh báo các vi phạm quy tắc phân ca (trùng ca, trùng lịch nghỉ phép, vượt giờ làm). |
| **Mandatory Error** | Lỗi bắt buộc (Chặn) | Vi phạm nghiêm trọng không cho phép lưu/công bố lịch (ví dụ: trùng ca cùng giờ, phân ca cho nhân viên đã thôi việc). |
| **Warning (Overrideable)** | Cảnh báo (Cho phép ghi đè) | Vi phạm chính sách có thể chấp nhận nếu người quản lý nhập lý do giải trình (ví dụ: làm ca vào ngày lễ, thiếu nhân sự tối thiểu). |
| **Optimistic Locking** | Khóa lạc quan | Cơ chế bảo vệ dữ liệu chống ghi đè đồng thời thông qua cột số hiệu phiên bản (`version`). |
| **Soft Delete** | Xóa mềm | Ẩn bản ghi khỏi các thao tác nghiệp vụ bằng cờ thời gian (`deleted_at`), không xóa dòng vật lý trong database. |
| **Audit Trail / Log** | Nhật ký kiểm toán | Bản ghi lưu vết lịch sử mọi hành động nhạy cảm trong hệ thống: ai thực hiện, lúc nào, giá trị cũ, giá trị mới, địa chỉ IP. |

---
*Kết thúc Tài liệu 00.*
