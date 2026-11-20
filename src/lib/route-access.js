export const operationRoles = {
  'bao-cao': ['ADMIN'],
  'bao-cao-kho': ['ADMIN'],
  'don-hang': ['ADMIN', 'SALES_STAFF'],
  'xuat-kho': ['ADMIN', 'WAREHOUSE_STAFF'],
  'ton-kho': ['ADMIN', 'WAREHOUSE_STAFF'],
  'truy-xuat': ['ADMIN', 'WAREHOUSE_STAFF'],
  'nha-cung-cap': ['ADMIN', 'WAREHOUSE_STAFF'],
  'phieu-nhap': ['ADMIN', 'WAREHOUSE_STAFF'],
  'nhan-vien': ['ADMIN'],
  'khach-hang': ['ADMIN'],
  'danh-muc': ['ADMIN'],
  'san-pham': ['ADMIN'],
  'khuyen-mai': ['ADMIN'],
}

const detailPages = new Set(['don-hang', 'xuat-kho', 'ton-kho', 'san-pham', 'khuyen-mai'])
const customerPath = /^\/(?:tai-khoan(?:\/(?:dia-chi|uu-dai))?|don-hang(?:\/[^/]+(?:\/danh-gia\/[^/]+)?)?|gio-hang|thanh-toan(?:\/(?:xac-nhan|giao-dich)\/[^/]+)?|payment\/(?:result|cancel))\/?$/

export function postLoginPath(session, target) {
  const roles = session?.roles || []
  const staff = Object.values(operationRoles).some((allowed) => allowed.some((role) => roles.includes(role)))
  const fallback = staff ? '/van-hanh' : '/'
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\') || [...target].some((char) => char.charCodeAt(0) < 32)) return fallback
  const url = new URL(target, 'https://muaxanh.invalid')
  const path = url.pathname
  let allowed = path === '/' || /^\/san-pham(?:\/[^/]+)?\/?$/.test(path)
  if (roles.includes('CUSTOMER') && customerPath.test(path)) allowed = true
  const match = path.match(/^\/van-hanh(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/)
  if (staff && match) {
    const [, page, detail] = match
    allowed = !page || Boolean(operationRoles[page]?.some((role) => roles.includes(role)) && (!detail || detailPages.has(page)))
  }
  return allowed ? path + url.search + url.hash : fallback
}
