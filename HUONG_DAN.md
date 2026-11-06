# 🔮 HƯỚNG DẪN SỬ DỤNG TRÊN TIKTOK LIVE STUDIO & OBS STUDIO
**Dự án: Interactive Tarot TikTok Live Overlay (Nền Cô Phù Thủy Xinh Đẹp Bốc Bài)**

---

## 1. Khởi chạy nhanh trên Windows

1. Nhấp đúp chuột vào file **`start.bat`** trong thư mục dự án.
2. Hệ thống tự động khởi chạy Server ở cổng `3000` và mở trình duyệt tới trang điều khiển **Admin** tại: `http://localhost:3000/admin`.

---

## 2. Cách phát trực tiếp trên **TikTok Live Studio** (2 Cách)

### Cách A: Dùng nguồn "Liên kết" (Link / Browser Source) — *Khuyên dùng, nét nhất*
1. Mở phần mềm **TikTok Live Studio** trên máy tính và chọn bố cục dọc **Dọc (9:16)**.
2. Tại mục **Nguồn (Sources)** góc dưới trái, bấm **`+ Thêm nguồn (Add Source)`** &rarr; Chọn **`Liên kết (Link)`** (hoặc **Trình duyệt / Browser**).
3. Dán đường dẫn:
   ```text
   http://localhost:3000/overlay.html
   ```
4. Chỉnh kích thước khung:
   - **Chiều rộng (Width)**: `1080`
   - **Chiều cao (Height)**: `1920`
5. Bấm **Thêm (Add)** và kéo khung vừa khít màn hình dọc 9:16 của TikTok Live Studio.

### Cách B: Dùng nguồn "Quay cửa sổ" (Window Capture)
1. Tại trang Admin (`http://localhost:3000/admin`), bấm nút **"📱 Mở Cửa Sổ 9:16 (Quay Cửa Sổ TikTok Live Studio)"** ở góc phải trên cùng.
2. Trong **TikTok Live Studio**, bấm **`+ Thêm nguồn (Add Source)`** &rarr; chọn **`Quay cửa sổ (Window Capture)`**.
3. Chọn cửa sổ **`Tarot TikTok Live Studio Overlay (9:16)`** vừa bật lên rồi bấm **OK**.

---

## 3. Tính năng chuyên biệt cho TikTok Live Studio (Trên trang Admin)

Tại mục **"🎬 2. Tính Năng TikTok Live Studio & Hình Nền Cô Phù Thủy"** trong trang `http://localhost:3000/admin`, bạn có thể điều khiển tức thì:

- **🧙‍♀️ Cô Phù Thủy Bốc Bài (Mặc định)**: Hiển thị hình nền cô phù thủy xinh đẹp bên bàn nhung tím cùng quả cầu pha lê và hiệu ứng tụ phép sáng rực mỗi khi rút bài.
- **🟩 Phông Xanh (Chroma Key)**: Chuyển nền sang xanh lá `#00FF00` để bạn dùng bộ lọc *Chroma Key* trong TikTok Live Studio (ghép đè lá bài lên Camera thật của bạn hoặc video nền có sẵn).
- **🔊 Giọng đọc AI Phù Thủy (TTS)**: Tự động phát giọng đọc Tiếng Việt chào tên người xem (`@username`), đọc tên lá bài và lời khuyên vũ trụ ngay khi lật bài.
- **⚡ Tự động bốc bài Hàng chờ (Auto-Live)**: Tự động gọi lần lượt câu hỏi trong hàng chờ mỗi 18 giây và rút bài hoàn toàn tự động (phù hợp treo máy livestream tương tác liên tục).
- **📋 Kho 32+ Comment Mẫu Sẵn Theo Cú Pháp**: Bấm nút màu xanh lục **"📋 Mở Bảng 32+ Comment Mẫu Sẵn"** để chọn gửi ngay bất kỳ comment nào, hoặc bấm **"⚡ Bơm 5 Khách Vào Hàng Chờ"** để mô phỏng tương tác sôi động cho phòng live tức thì.

---

## 4. Cách thêm vào OBS Studio (Chuẩn dọc 9:16)

1. Mở **OBS Studio**, vào **Settings** &rarr; **Video**, đặt độ phân giải `1080x1920`.
2. Bấm **`+`** trong bảng **Sources** &rarr; chọn **Browser**:
   - **URL**: `http://localhost:3000/overlay.html`
   - **Width**: `1080`
   - **Height**: `1920`
   - Tích chọn ô: **`Shutdown source when not visible`**.
3. Bấm **OK** để hoàn tất.

---

## 5. Cú pháp tương tác người xem bình luận trên TikTok Live

Hệ thống được tối ưu hóa theo phong cách trải bài Tarot chuyên nghiệp trên TikTok:

### 🌟 1. Bói bài cá nhân (Tự động vào Hàng chờ bốc bài)
- **Cú pháp chuẩn**: `[Tên] - [Ngày/Tháng/Năm sinh]` (hoặc có thể kèm câu hỏi)
- **Ví dụ bình luận**:
  - `Minh - 15/08/2000`
  - `Lan - 2002`
  - `Mai Anh - 12.09.2001 - Tình cảm sắp tới thế nào ạ?`
  - `Nguyễn Tuấn - 05/11/1997: Công việc chuyển chỗ mới có tốt không?`
- **Hiệu ứng**: Hệ thống tự động trích xuất Tên và Ngày sinh vào Hàng chờ. Khi bốc bài, giọng đọc AI sẽ đọc đích danh: *"Chào bạn Minh sinh ngày 15 tháng 8 năm 2000..."* và luận giải lá bài.

### 💘 2. Bói Ghép Đôi Tình Duyên (Love Compatibility Radar)
- **Cú pháp chuẩn**: `#tinhyeu "[Tên 1 - Ngày sinh]" "[Tên 2 - Ngày sinh]"`
- **Ví dụ bình luận**:
  - `#tinhyeu "Minh - 15/08/2000" "Lan - 01/02/2002"`
  - `#tinhyeu "Tuấn - 20/05/1998" "Hoa - 14/02/2001"`
  - `#tinhyeu "Hoàng - 2000" "Mai - 2003"`
  - *(Hệ thống cũng linh hoạt hỗ trợ khi viết không ngoặc kép: `#tinhyeu Minh - 15/08/2000 và Lan - 01/02/2002`)*
- **Hiệu ứng**: Quả cầu Radar Tình Duyên xoay rực rỡ, tính chỉ số hòa hợp (75% -> 99%), hiển thị 2 lá bài tình cảm của 2 người và đọc lời khuyên đôi lứa.
