# 🚀 Hướng Dẫn Deploy Lên GitHub và Railway

Dự án đã được đóng gói toàn bộ và cấu hình sẵn Dockerfile đa tầng (`Dockerfile`), file cấu hình Railway (`railway.json`), file `.gitignore` chuẩn hóa và logic tự động chuyển đổi giữa môi trường Local và Production.

---

## 📦 BƯỚC 1: Đẩy Mã Nguồn Lên GitHub

Mã nguồn trên máy của bạn đã được khởi tạo Git repository và commit lần đầu thành công (`feat: initial commit`).

1. Mở trình duyệt, truy cập [GitHub](https://github.com) và tạo một **New Repository** (ví dụ đặt tên là `kanban-flow`, chọn chế độ **Public** hoặc **Private**).
2. Mở PowerShell trong thư mục dự án và chạy 3 lệnh sau (thay URL bằng link repo GitHub của bạn):

```bash
git branch -M main
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/<ten-repo>.git
git push -u origin main
```

---

## 🚆 BƯỚC 2: Deploy Lên Railway (Khoảng 2 Phút)

Railway là nền tảng Cloud hiện đại hỗ trợ Docker container, Go và PostgreSQL cực kỳ mạnh mẽ.

### 🌟 Cách A: Deploy All-in-One (Khuyến nghị — Nhanh nhất & Tối ưu chi phí)
Ở chế độ này, 1 container duy nhất sẽ chạy cả Backend Go tốc độ cao và phục vụ toàn bộ giao diện Web React tĩnh (SPA).

1. Truy cập [railway.com](https://railway.com) và đăng nhập bằng tài khoản GitHub.
2. Bấm nút **New Project** $\to$ Chọn **Deploy from GitHub repo**.
3. Chọn repository `kanban-flow` bạn vừa push ở Bước 1.
4. Bấm **Deploy Now**.
   - Railway sẽ tự động đọc file `Dockerfile` và `railway.json` ở thư mục gốc:
     - Tự động biên dịch Frontend React TSX (`npm run build`).
     - Tự động biên dịch Backend Go thành file nhị phân Linux (`CGO_ENABLED=0 go build`).
     - Đóng gói vào Alpine image siêu nhẹ (~25MB).
5. **Tạo Domain công khai**:
   - Bấm vào service vừa tạo trên Railway $\to$ chọn tab **Settings**.
   - Kéo xuống mục **Networking** $\to$ bấm nút **Generate Domain**.
   - Bạn sẽ nhận được đường dẫn dạng `https://kanban-flow-production-xxxx.up.railway.app`.

---

### 🗄️ BƯỚC 3: Thêm Cơ Sở Dữ Liệu PostgreSQL Trên Railway (Tùy chọn)

Mặc định khi không có PostgreSQL, backend Go sẽ chạy SQLite độc lập tự động. Nếu muốn dữ liệu lưu trữ vĩnh viễn trên Cloud PostgreSQL:

1. Trong trang dự án Railway, bấm nút **+ New** (góc trên bên phải).
2. Chọn **Database** $\to$ Chọn **Add PostgreSQL**.
3. Railway sẽ tự động tạo một database PostgreSQL và sinh biến môi trường `DATABASE_URL`.
4. Bấm vào Service Kanban của bạn $\to$ chọn tab **Variables** $\to$ bấm **Add Reference Variable** $\to$ chọn `DATABASE_URL` từ PostgreSQL vừa tạo.
5. Service sẽ tự động redeploy:
   - Backend Go tự động phát hiện `DATABASE_URL` dạng `postgresql://...` $\to$ chuyển sang kết nối PostgreSQL.
   - Tự động chạy AutoMigrate và seed dữ liệu khởi tạo.

---

## ⚙️ Các Biến Môi Trường (Environment Variables)

Nếu cần tùy biến, bạn có thể thêm các biến sau trong tab **Variables** trên Railway:

| Tên biến | Giá trị mẫu | Ý nghĩa |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Đường dẫn kết nối DB (Railway tự cấp) |
| `JWT_SECRET` | `chuoi-bi-mat-tuy-y-2026` | Khóa bảo mật mã hóa JWT token |
| `GIN_MODE` | `release` | Chế độ chạy tối ưu của Gin Go Framework |
| `PORT` | `8080` | Cổng HTTP (Railway tự động truyền) |

---

## 💻 Kiểm Tra Lại Chạy Local

Bất cứ lúc nào trên máy local của bạn:
- Nhấp đúp vào [start.bat](file:///d:/Dat/App_Kanban/start.bat) để khởi chạy đồng thời cả Frontend và Backend Go.
- Giao diện: [http://localhost:3000](http://localhost:3000)
- API Backend: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
