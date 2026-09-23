# BẢNG TỔNG HỢP KIỂM THỬ TOÀN DIỆN (TEST CASES & VERIFICATION REPORT)

Dự án: **Kanban Flow (Go Backend + React TSX Tailwind)**  
Phiên bản: **1.0.0**  
Ngày kiểm thử: **23/09/2026**  
Trạng thái kiểm thử: **100% PASS** (Tất cả chức năng và nút bấm đều hoạt động hoàn hảo)

---

## 📋 Ma Trận Test Cases Chi Tiết

| Mã TC | Phân hệ | Tên Test Case | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Backend Auth | Đăng ký tài khoản mới (`POST /api/v1/auth/register`) | Backend đang chạy | 1. Gửi email, password, full_name<br>2. Kiểm tra status code và response | Trả về HTTP 201 Created, kèm JWT token và thông tin user | **PASS** |
| **TC-02** | Backend Auth | Đăng nhập tài khoản (`POST /api/v1/auth/login`) | Tài khoản đã tạo ở TC-01 | 1. Gửi email và password<br>2. Kiểm tra response | Trả về HTTP 200 OK, cấp token hợp lệ | **PASS** |
| **TC-03** | Backend Auth | Xác thực Route bảo vệ (`GET /api/v1/auth/me`) | Token từ TC-02 | 1. Gửi request kèm header `Authorization: Bearer <token>` | Trả về HTTP 200 OK và profile user | **PASS** |
| **TC-04** | Project Mgmt | Tạo dự án mới (`POST /api/v1/projects`) | Workspace ID hợp lệ | 1. Nhấp nút `+` tại mục Projects trên Sidebar hoặc gửi API<br>2. Nhập Name: "Mobile App 2026", Key: "MOB" | Trả về HTTP 201, tự động sinh Sprint Board và 4 cột mặc định | **PASS** |
| **TC-05** | Board & Views | Tải chi tiết Board (`GET /api/v1/boards/:id`) | Board ID hợp lệ | 1. Mở trang web hoặc gửi request lấy board | Trả về HTTP 200, preloaded đầy đủ Columns, Cards, Assignees, Labels, Checklists, Comments | **PASS** |
| **TC-06** | Views Switch | Chuyển đổi đa góc nhìn (Board, List, Calendar, Timeline) | Dữ liệu bảng đã tải | 1. Nhấp lần lượt vào các nút góc nhìn trên Sidebar: Kanban, List, Calendar, Timeline | Giao diện chuyển đổi tức thì: Kanban kéo thả, List dạng bảng, Calendar theo ngày trong tháng, Timeline dạng biểu đồ Gantt | **PASS** |
| **TC-07** | UI Density | Tùy chọn Card Density (Compact / Comfortable / Spacious) | Màn hình Kanban Board | 1. Nhấp các icon density trên thanh Header | Khoảng cách padding, độ giãn thẻ thay đổi ngay lập tức theo phong cách PLANKA | **PASS** |
| **TC-08** | Search & Filter | Tìm kiếm thời gian thực | Có các card trên board | 1. Nhập từ khóa (vd: "checkout", "ENG-101") vào ô tìm kiếm trên Header | Các thẻ khớp từ khóa được giữ lại, các thẻ khác ẩn ngay lập tức | **PASS** |
| **TC-09** | Filter | Lọc "My Issues" | Sidebar đang hiển thị | 1. Nhấp nút "My Issues" trên Sidebar | Board lọc chỉ hiển thị các thẻ được gán cho Alex Morgan, nhấp lại để bỏ lọc | **PASS** |
| **TC-10** | Column Mgmt | Thêm cột mới (Add Column) | Màn hình Board | 1. Nhấp "+ Add Column" ở cuối bảng<br>2. Nhập tên cột "QA Testing"<br>3. Bấm Add Column | Cột mới xuất hiện ngay trên giao diện, lưu vào DB và broadcast WebSocket | **PASS** |
| **TC-11** | Column Mgmt | Đổi tên cột (Inline Rename & Dropdown) | Cột đã tồn tại | 1. Nhấp `...` trên cột -> chọn "Rename Column" (hoặc nhấp đúp tiêu đề)<br>2. Sửa tên và nhấn Enter | Tiêu đề cột cập nhật ngay lập tức qua API `PATCH /api/v1/columns/:id` | **PASS** |
| **TC-12** | Column Mgmt | Xóa cột (Delete Column) | Cột đang có trên board | 1. Nhấp `...` trên cột -> chọn "Delete Column"<br>2. Xác nhận hộp thoại | Cột và các task bên trong bị xóa sạch, giao diện cập nhật ngay | **PASS** |
| **TC-13** | Card Mgmt | Thêm card nhanh (Quick Add Card) | Cột đang hiển thị | 1. Nhấp `+ Add card` ở chân cột hoặc icon `+` trên header cột<br>2. Nhập tiêu đề và bấm Add | Card được tạo với issue key tự động (ENG-xxx), xuất hiện dưới đáy cột | **PASS** |
| **TC-14** | Card Mgmt | Tạo thẻ chi tiết (New Issue Modal) | Nút "New Issue" trên Header | 1. Bấm "New Issue"<br>2. Điền Title, Description, Status, Priority, Cover URL<br>3. Bấm Create Issue | Card được tạo với đầy đủ thông tin, hiển thị ảnh bìa nếu có | **PASS** |
| **TC-15** | Drag & Drop | Kéo thả thẻ cùng cột & khác cột (Fractional Indexing) | Có ít nhất 2 thẻ | 1. Dùng chuột kéo thẻ từ cột này sang cột khác<br>2. Thả vào vị trí bất kỳ | Vị trí cập nhật tức thì (Optimistic UI), vị trí `position` tính toán chuẩn theo `(prev+next)/2`, DB chỉ tốn 1 lệnh UPDATE | **PASS** |
| **TC-16** | Card Detail | Chỉnh sửa chi tiết Thẻ (Card Detail Modal) | Card trên board | 1. Nhấp vào card để mở modal<br>2. Chỉnh sửa title, description, priority, due date, status | Các trường tự động lưu (onBlur/onChange) và đồng bộ ngay lập tức | **PASS** |
| **TC-17** | Checklist | Tick chọn và thêm Checklist Item | Card Detail Modal đang mở | 1. Tick chọn checkbox công việc con<br>2. Nhập tên item mới và bấm Add | Item chuyển trạng thái gạch ngang, progress bar trên card ngoài board cập nhật (`x/y`) | **PASS** |
| **TC-18** | Comments | Bình luận hoạt động (Activity & Comments) | Card Detail Modal đang mở | 1. Nhập nội dung vào ô "Leave a comment..."<br>2. Bấm "Send" | Comment xuất hiện ngay kèm avatar, tên người dùng và thời gian thực | **PASS** |
| **TC-19** | Card Mgmt | Xóa thẻ (Delete Card) | Card Detail Modal đang mở | 1. Nhấp icon thùng rác màu đỏ trên góc modal<br>2. Xác nhận | Card bị xóa khỏi board, modal đóng lại | **PASS** |
| **TC-20** | Command Palette | Gọi lệnh phím tắt (`Ctrl + K` hoặc `Cmd + K`) | Bất kỳ vị trí nào trong app | 1. Nhấn tổ hợp phím `Ctrl + K`<br>2. Thử gõ tìm lệnh<br>3. Bấm Escape để đóng | Hộp thoại lệnh xuất hiện mượt mà, hỗ trợ tạo issue nhanh và đổi view | **PASS** |
| **TC-21** | Real-time Sync | Đồng bộ đa người dùng qua WebSocket | 2 tab trình duyệt cùng mở board | 1. Tab 1 kéo thả card hoặc thêm comment<br>2. Quan sát Tab 2 | Tab 2 tự động cập nhật ngay lập tức mà không cần reload trang | **PASS** |

---

## 🔬 Kết Quả Chạy Kiểm Thử Tự Động (Automated Test Execution)

### 1. Backend Go Unit & Integration Tests:
```
=== RUN   TestHealthCheck
--- PASS: TestHealthCheck (0.00s)
=== RUN   TestAuthFlow
--- PASS: TestAuthFlow (0.01s)
=== RUN   TestWorkspacesAndBoardsFlow
--- PASS: TestWorkspacesAndBoardsFlow (0.01s)
=== RUN   TestCardCRUDAndFractionalIndexing
--- PASS: TestCardCRUDAndFractionalIndexing (0.01s)
=== RUN   TestCalculatePosition
--- PASS: TestCalculatePosition (0.00s)
=== RUN   TestNeedsRebalance
--- PASS: TestNeedsRebalance (0.00s)
PASS
ok  	kanban-server/internal/handlers	3.280s
ok  	kanban-server/internal/services	(cached)
```

### 2. Frontend Production Bundling & TypeScript Static Analysis:
```
✓ 1593 modules transformed.
dist/index.html                   1.08 kB
dist/assets/index-DaY1KYKe.css   26.65 kB
dist/assets/index-Dv1tUxq0.js   304.08 kB
✓ built in 2.32s (0 errors, 0 warnings)
```

### 3. End-to-End API Integration Suite:
```
=== TEST 1: Health Check === -> PASSED
=== TEST 2: Workspaces & Board Detail === -> PASSED
=== TEST 3: Create Column === -> PASSED
=== TEST 4: Update Column === -> PASSED
=== TEST 5: Create Card === -> PASSED
=== TEST 6: Move Card (Fractional Indexing) === -> PASSED
=== TEST 7: Add Checklist Item & Toggle === -> PASSED
=== TEST 8: Add Comment === -> PASSED
=== TEST 9: Delete Card === -> PASSED
=== TEST 10: Delete Column === -> PASSED
>>> ALL 10 E2E AUTOMATED TESTS PASSED WITH 100% SUCCESS! <<<
```

---

## 🎯 Kết Luận
Toàn bộ 21 trường hợp kiểm thử chức năng, giao diện, phím tắt, tương tác nút bấm và đồng bộ dữ liệu thời gian thực giữa Backend Go và Frontend React đều đạt chuẩn **100% PASS**. Không có bất kỳ nút bấm hay thao tác nào bị đơ hoặc thiếu tính năng.
