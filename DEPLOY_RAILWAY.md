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

### 🗄️ BƯỚC 3: Cấu Hình Cơ Sở Dữ Liệu PostgreSQL Riêng (Không Lo Mất Dữ Liệu)

> [!WARNING]
> **Tại sao deploy lên Railway lại bị mất dữ liệu cũ?**
> Container của Railway là dạng **Ephemeral (bộ nhớ tạm)**. Khi bạn không gắn Database riêng, hệ thống sẽ tự động dùng SQLite (`kanban.db` lưu trong ổ đĩa của container). Mỗi khi bạn đẩy code mới hoặc Railway tự động redeploy/rebuild, container cũ sẽ bị xóa và một container mới được tạo ra $\to$ file `kanban.db` bị mất sạch!
>
> **Để dữ liệu tồn tại vĩnh viễn**, bạn cần dùng một Database PostgreSQL độc lập theo 1 trong 2 cách sau:

#### 🌟 Cách 1: Thêm PostgreSQL ngay trên Railway (Khuyên dùng — 1 phút)
1. Trong màn hình Project trên Railway, bấm nút **+ New** (góc trên bên phải hoặc phím `Ctrl + K`).
2. Chọn **Database** $\to$ Chọn **Add PostgreSQL**.
3. Railway sẽ tạo một service database PostgreSQL riêng biệt (có ổ đĩa lưu trữ vĩnh viễn, không bao giờ bị xóa khi deploy app).
4. Bấm vào Service Web Kanban của bạn $\to$ Chuyển sang tab **Variables**:
   - Bấm **New Variable** $\to$ Bấm **Add Reference** $\to$ Chọn `DATABASE_URL` từ PostgreSQL vừa tạo.
   - Thêm tiếp biến: `DB_TYPE` = `postgres`.
5. Railway sẽ tự động kết nối và redeploy:
   - Backend Go tự động phát hiện `DATABASE_URL` PostgreSQL $\to$ Tự động chạy `AutoMigrate` tạo đầy đủ bảng.
   - Dữ liệu của bạn từ nay sẽ được lưu trữ vĩnh viễn trên PostgreSQL độc lập, dù có redeploy 100 lần cũng không bao giờ mất!

#### 🌐 Cách 2: Dùng Database Cloud Độc Lập Bên Ngoài (Supabase hoặc Neon.tech)
Nếu bạn muốn cơ sở dữ liệu hoàn toàn độc lập với Railway (kể cả xóa project Railway hay chuyển sang host khác vẫn giữ nguyên 100% dữ liệu):
1. Truy cập [Supabase.com](https://supabase.com) hoặc [Neon.tech](https://neon.tech) tạo tài khoản miễn phí.
2. Tạo một Project mới và copy chuỗi **Connection String** dạng:
   `postgresql://postgres:[password]@[host]:5432/postgres` (hoặc `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
3. Mở Railway $\to$ Tab **Variables** của service $\to$ Điền:
   - `DATABASE_URL` = `chuỗi connection string bạn vừa copy`
   - `DB_TYPE` = `postgres`

---

### 🚚 BƯỚC 4: Chuyển Dữ Liệu Cũ (SQLite) Sang PostgreSQL Mới

Nếu bạn đã có các thẻ công việc (Cards), Cột (Columns) hoặc Dự án trong file `kanban.db` ở máy tính và muốn nạp toàn bộ sang Database PostgreSQL mới:

Mở PowerShell trong thư mục `server/` và chạy lệnh sau:
```bash
go run ./cmd/migrate -from ./kanban.db -to "postgresql://postgres:password@host:port/dbname"
```
*(Thay thế chuỗi URL bằng `DATABASE_URL` PostgreSQL của bạn trên Railway hoặc Supabase/Neon)*

Công cụ sẽ tự động:
- Đọc toàn bộ người dùng, workspace, projects, boards, columns, cards, nhãn labels, checklists và comments từ file `kanban.db`.
- Tự động nạp toàn bộ vào database PostgreSQL chỉ trong 3 giây mà không làm trùng lặp dữ liệu.

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
