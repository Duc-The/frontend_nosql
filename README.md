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

## Thư viện và luồng dùng chung

- React Router: route lồng nhau, giữ URL tìm kiếm, điều hướng SPA và kiểm tra vai trò trước khi mở trang.
- Redux Toolkit và React Redux: session đăng nhập dùng chung; lưu session trong sessionStorage. Khi đổi tài khoản hoặc đăng xuất, xóa cache dữ liệu.
- Axios: base URL, Bearer token, multipart upload, timeout và thông báo lỗi. Request xác thực dùng chung một lần refresh token khi nhiều request cùng hết hạn.
- TanStack Query: cache dữ liệu theo đường dẫn và phiên đăng nhập, loading/error/refetch; làm mới dữ liệu sau thao tác ghi thành công.
- React Hook Form, Zod và resolvers: form tái sử dụng, kiểm tra dữ liệu và lỗi ngay dưới từng ô.
- Tailwind CSS, shadcn/Radix và Lucide: giao diện nền tảng. MUI cung cấp Pagination và Skeleton theo màu thương hiệu. Day.js định dạng ngày giờ Việt Nam; clsx và tailwind-merge gộp class.

`src/app` chứa provider, Redux store và QueryClient. `src/components/forms` chứa form/schema dùng chung; `src/hooks` chứa hook truy vấn. Các trang nghiệp vụ được tải theo route để giảm mã tải ban đầu.

## Kiểm tra

```bash
npm run lint
npm run build
npm audit --omit=dev
```

Các lệnh trên kiểm tra mã và bản build. Để kiểm tra nghiệp vụ thật, cần chạy backend ở cổng 8088 cùng MongoDB/Redis theo cấu hình backend. Build SEO cần `VITE_SITE_URL` là URL công khai khi triển khai.
