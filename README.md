# Mùa Xanh

Frontend cửa hàng thực phẩm organic. Dùng React, Vite, Tailwind CSS và shadcn/ui.

## Chạy local

```bash
npm ci
npm run dev
```

Frontend mặc định ở `http://localhost:5173`. Vite chuyển tiếp `/api` sang backend ở cổng 8088. Khi triển khai riêng hai ứng dụng, đặt `VITE_API_BASE_URL` thành URL API đầy đủ có hậu tố `/api/v1`, hoặc cấu hình reverse proxy cùng origin.

Để bật nút Google, đặt `VITE_GOOGLE_CLIENT_ID` trong `.env.local` bằng **Client ID công khai** đang dùng ở backend. Thêm origin frontend vào Authorized JavaScript origins trong Google Cloud. Chỉ đặt Client ID ở frontend.

## Các khu vực

- `/` là cửa hàng, tìm kiếm, danh mục, chi tiết và giỏ.
- `/dang-nhap`, `/dang-ky`, `/quen-mat-khau` dành cho xác thực.
- `/tai-khoan`, `/thanh-toan`, `/don-hang` dành cho khách mua.
- `/van-hanh` dẫn đến các màn theo vai trò chủ cửa hàng, bán hàng và kho.
- `/payment/result` và `/payment/cancel` đọc mã đơn từ URL và lấy trạng thái từ backend.

Nếu host SPA riêng, cấu hình fallback về `index.html` cho các URL frontend. API backend vẫn thực thi quyền của từng vai trò.

## Cấu trúc

`src/features` tách các luồng khách, checkout, đơn hàng và vận hành. `src/layouts` giữ khung trang, `src/components` giữ UI tái sử dụng và `src/lib/api.js` chuẩn hóa yêu cầu API.
