import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/vi'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('vi')

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
export const price = (value) => vnd.format(value)

export const dateTime = (value) => value && dayjs(value).isValid()
  ? dayjs(value).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm') : '—'

const statuses = {
  PENDING: 'Đang chờ', CONFIRMED: 'Đã xác nhận', PACKING: 'Đang đóng gói', PACKED: 'Đã xuất kho',
  SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán', FAILED: 'Thất bại', EXPIRED: 'Hết hạn', ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa', USED: 'Đã dùng', UNAVAILABLE: 'Không khả dụng',
  DRAFT: 'Nháp', RESERVED: 'Đang giữ', RELEASED: 'Đã nhả', ISSUED: 'Đã xuất',
  EXPIRING_SOON: 'Cận hạn', FRESH: 'Còn hạn', UNKNOWN: 'Chưa rõ',
}

export const statusLabel = (value) => statuses[value] ?? value ?? '—'
export const paymentLabel = (method) => ({ COD: 'Tiền mặt khi nhận hàng', VIETQR: 'VietQR qua payOS', VNPAY: 'VNPAY' })[method] ?? method
