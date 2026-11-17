import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, Grid, PageTitle, Pager, choices, column, field, useAction, useResource } from '@/components/page-kit'
import { price, statusLabel } from '@/lib/format'
import { ResourcePage } from './ResourcePage'

const catalog = '/admin/catalog'
const active = choices({ ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động' })
const roles = choices({ ADMIN: 'Chủ cửa hàng', SALES_STAFF: 'Nhân viên bán hàng', WAREHOUSE_STAFF: 'Nhân viên kho' })
const stateField = field('status', 'Trạng thái', { required: true, options: active })
const stateColumn = column('Trạng thái', (row) => statusLabel(row.status))
const number = (name, label, extra = {}) => field(name, label, { type: 'number', min: 0, ...extra })

export function EmployeesPage({ request }) {
  const profile = [field('fullName', 'Họ tên', { required: true }), field('email', 'Email', { type: 'email' }),
    field('phoneNumber', 'Điện thoại', { type: 'tel' }), field('jobTitle', 'Chức danh'), field('hiredOn', 'Ngày vào làm', { type: 'date' })]
  return <ResourcePage request={request} path="/admin/employees" title="Nhân viên"
    fields={[field('username', 'Tên đăng nhập', { required: true, pattern: '[A-Za-z0-9_]{3,32}' }),
      field('password', 'Mật khẩu ban đầu', { type: 'password', required: true, minLength: 8, autoComplete: 'new-password' }),
      field('role', 'Vai trò', { options: roles, required: true }), ...profile]} editFields={profile}
    prepare={(values, row) => {
      if (row.id) return values
      const { username, password, role, ...details } = values
      return { username, password, role, profile: details }
    }}
    columns={[column('Mã', 'employeeCode'), column('Tên', 'fullName'), column('Tên đăng nhập', 'username'),
      column('Vai trò', (row) => row.roles.map((role) => roles.find((option) => option.value === role)?.label || role).join(', ')),
      column('Tài khoản', (row) => statusLabel(row.accountStatus))]}
    actions={(row, mutate, busy) => <>
      <Form fields={[field('status', 'Tài khoản', { required: true, options: choices({ ACTIVE: 'Mở khóa', LOCKED: 'Khóa' }) })]}
        values={{ status: row.accountStatus }} busy={busy} label="Lưu trạng thái" submit={(body) => mutate('/status', body)} />
      <Form fields={[field('role', 'Vai trò', { required: true, options: roles })]} values={{ role: row.roles[0] }}
        busy={busy} label="Đổi vai trò" submit={(body) => mutate('/role', body)} />
      <Form fields={[field('newPassword', 'Mật khẩu mới', { required: true, type: 'password', minLength: 8, autoComplete: 'new-password' })]}
        busy={busy} label="Đặt lại mật khẩu" submit={(body) => mutate('/password', body)} />
    </>} />
}

export function CustomersPage({ request }) {
  return <ResourcePage request={request} path="/admin/customers" title="Khách hàng" searchable
    columns={[column('Mã khách', 'customerCode'), column('Họ tên', 'fullName'), column('Email', 'email'),
      column('Điểm thưởng', 'rewardPoints'), stateColumn]} />
}

export function CategoriesPage({ request }) {
  const categories = useResource(request, catalog + '/categories?size=100')
  const options = (categories.data?.items || []).map((row) => ({ value: row.id, label: row.name }))
  return <ResourcePage request={request} path={catalog + '/categories'} title="Danh mục" searchable
    defaults={{ status: 'ACTIVE', sortOrder: 0 }}
    fields={[field('categoryCode', 'Mã danh mục', { required: true }), field('name', 'Tên', { required: true }),
      field('slug', 'Slug', { required: true, pattern: '[a-z0-9]+(-[a-z0-9]+)*' }),
      field('parentCategoryId', 'Danh mục cha', { options }), field('description', 'Mô tả'), field('imageUrl', 'URL ảnh', { type: 'url' }),
      number('sortOrder', 'Thứ tự', { required: true }), stateField]}
    columns={[column('Mã', 'categoryCode'), column('Tên', 'name'), column('Slug', 'slug'),
      column('Danh mục cha', (row) => options.find((option) => option.value === row.parentCategoryId)?.label), stateColumn]} />
}

export function ProductsPage({ request }) {
  const categories = useResource(request, catalog + '/categories?size=100')
  const options = (categories.data?.items || []).map((row) => ({ value: row.id, label: row.name }))
  return <ResourcePage request={request} path={catalog + '/products'} title="Sản phẩm" searchable
    defaults={{ status: 'ACTIVE', featuredOrder: 0 }}
    fields={[field('productCode', 'Mã sản phẩm', { required: true }), field('name', 'Tên', { required: true }),
      field('slug', 'Slug', { required: true, pattern: '[a-z0-9]+(-[a-z0-9]+)*' }), field('categoryId', 'Danh mục', { required: true, options }),
      field('brandName', 'Thương hiệu'), field('originDescription', 'Xuất xứ'), field('description', 'Mô tả', { type: 'textarea' }),
      field('storageInstructions', 'Bảo quản'), field('featured', 'Nổi bật', { type: 'checkbox' }),
      number('featuredOrder', 'Thứ tự nổi bật', { required: true }), stateField]}
    columns={[column('Mã', 'productCode'), column('Tên', 'name'), column('Xuất xứ', 'originDescription'), stateColumn,
      column('SKU và ảnh', (row) => <a className="page-link" href={'/van-hanh/san-pham/' + encodeURIComponent(row.id)}>Quản lý SKU và ảnh</a>)]} />
}

export function ProductAssetsPage({ request, id }) {
  const path = catalog + '/products/' + encodeURIComponent(id)
  const product = useResource(request, path)
  const action = useAction()
  function changeImage(suffix, method, body) {
    return action.run(async () => {
      await request(path + '/images' + suffix, { method, body })
      product.reload()
    }, 'Đã cập nhật ảnh.')
  }
  return <>
    <a className="page-link" href="/van-hanh/san-pham">Quay lại sản phẩm</a>
    <DataState resource={product}>{(data) => <section className="page-box">
      <h2>Ảnh · {data.name}</h2><p>ID sản phẩm: <code>{data.id}</code></p><ActionMessage action={action} />
      <Form fields={[field('file', 'Tệp ảnh', { type: 'file', required: true, accept: 'image/jpeg,image/png,image/webp' }),
        field('altText', 'Mô tả ảnh'), number('sortOrder', 'Thứ tự'), field('primary', 'Ảnh chính', { type: 'checkbox' })]}
        busy={action.busy} label="Tải ảnh" submit={(body, form) => {
          const payload = new FormData()
          payload.set('file', form.get('file'))
          payload.set('sortOrder', body.sortOrder ?? 0)
          payload.set('primary', body.primary)
          if (body.altText) payload.set('altText', body.altText)
          changeImage('', 'POST', payload)
        }} />
      {data.images?.map((image) => <div className="asset-row" key={image.publicId || image.url}>
        <img src={image.url} alt={image.altText || data.name} loading="lazy" />
        <div className="grid gap-2">{image.primary && <strong>Ảnh chính</strong>}
          {image.publicId && <><Form fields={[field('altText', 'Mô tả ảnh'), number('sortOrder', 'Thứ tự', { required: true }),
            field('primary', 'Ảnh chính', { type: 'checkbox' })]} values={image} busy={action.busy} submit={(body) =>
            changeImage('?publicId=' + encodeURIComponent(image.publicId), 'PUT', body)} />
            <Button className="justify-self-start" variant="outline" disabled={action.busy} onClick={() => {
              if (window.confirm('Gỡ ảnh này khỏi sản phẩm?')) changeImage('?publicId=' + encodeURIComponent(image.publicId), 'DELETE')
            }}>Gỡ ảnh</Button></>}
        </div>
      </div>)}
    </section>}</DataState>
    <ResourcePage request={request} path={path + '/variants'} title="Quy cách và SKU"
      defaults={{ status: 'ACTIVE', reorderLevel: 0, unitCode: 'G' }}
      columns={[column('SKU', 'sku'), column('Tên quy cách', 'name'), column('Giá bán', (row) => price(row.sellingPrice)),
        column('Ngưỡng tồn', 'reorderLevel'), stateColumn]}
      fields={[field('sku', 'SKU', { required: true }), field('name', 'Quy cách', { required: true }), field('barcode', 'Mã vạch'),
        number('netQuantity', 'Khối lượng', { required: true, min: 0.001, step: 0.001 }), field('unitCode', 'Đơn vị', { required: true }),
        number('sellingPrice', 'Giá bán', { required: true }), number('compareAtPrice', 'Giá so sánh'),
        number('reorderLevel', 'Ngưỡng tồn', { required: true, step: 0.001 }), stateField]} />
  </>
}

const promotionPath = '/admin/promotions'
export function PromotionsPage({ request }) {
  return <ResourcePage request={request} path={promotionPath} title="Khuyến mãi" searchable
    columns={[column('Mã', 'promotionCode'), column('Tên', 'name'), column('Phạm vi', (row) => ({ ORDER: 'Toàn đơn', PRODUCT: 'Sản phẩm', BATCH: 'Lô' })[row.target]),
      column('Đã dùng', 'usageCount'), stateColumn, column('Chi tiết', (row) => <a className="page-link" href={'/van-hanh/khuyen-mai/' + encodeURIComponent(row.id)}>Mở</a>)]}
  />
}

const timeInput = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ''

export function PromotionEditor({ request, id }) {
  const path = id ? promotionPath + '/' + encodeURIComponent(id) : promotionPath
  const promotion = useResource(request, id ? path : null)
  return <><PageTitle title={id ? 'Chi tiết khuyến mãi' : 'Tạo khuyến mãi'} />
    <a className="page-link" href="/van-hanh/khuyen-mai">Quay lại khuyến mãi</a>
    {id ? <DataState resource={promotion}>{(data) => <PromotionForm request={request} path={path} id={id} data={data} />}</DataState>
      : <PromotionForm request={request} path={path} />}</>
}

function PromotionForm({ request, path, id, data }) {
  const row = data?.promotion || {}
  const [target, setTarget] = useState(row.target || 'ORDER')
  const [rules, setRules] = useState(() => ({ [row.target || 'ORDER']: data?.targets || [] }))
  const targets = rules[target] || []
  const [voucherPage, setVoucherPage] = useState(1)
  const vouchers = useResource(request, id && row.audience === 'ASSIGNED_CUSTOMERS' ? path + '/vouchers?page=' + voucherPage : null)
  const [customerSearch, setCustomerSearch] = useState('')
  const customers = useResource(request, id && row.audience === 'ASSIGNED_CUSTOMERS' && !id.startsWith('loyalty-')
    ? '/admin/customers?' + new URLSearchParams({ activeOnly: true, size: 20, q: customerSearch }) : null)
  const action = useAction()
  const managed = id?.startsWith('loyalty-')
  return <>
    <ActionMessage action={action} />
    {managed ? <section className="page-box"><h2>{row.name}</h2><p>Ưu đãi này lấy điều kiện từ cấu hình điểm thưởng.</p></section>
      : <>
        <section className="page-box"><h2>Sản phẩm hoặc lô áp dụng</h2>
          <fieldset className="page-actions"><legend>Phạm vi ưu đãi</legend>
            {Object.entries({ ORDER: 'Toàn đơn', PRODUCT: 'Sản phẩm', BATCH: 'Lô hàng' }).map(([value, label]) =>
              <Button key={value} type="button" aria-pressed={target === value}
                variant={target === value ? 'default' : 'outline'} onClick={() => setTarget(value)}>{label}</Button>)}
          </fieldset>
          {target === 'ORDER' ? <p>Ưu đãi áp dụng trên toàn bộ tiền hàng.</p>
            : <PromotionTargetPicker key={target} request={request} target={target} targets={targets}
                update={(change) => setRules((current) => ({ ...current, [target]: change(current[target] || []) }))} />}
        </section>
        <section className="page-box"><h2>Điều kiện ưu đãi</h2>
          <Form fields={[field('promotionCode', 'Mã ưu đãi', { required: true }), field('name', 'Tên', { required: true }), field('description', 'Mô tả'),
            field('audience', 'Khách áp dụng', { required: true, options: choices({ ALL_CUSTOMERS: 'Tất cả khách', ASSIGNED_CUSTOMERS: 'Khách được cấp voucher' }) }),
            field('discountType', 'Cách giảm', { required: true, options: choices({ PERCENTAGE: 'Theo phần trăm', FIXED_AMOUNT: 'Số tiền cố định' }) }),
            number('discountValue', 'Giá trị giảm', { required: true, min: 0.01, step: 0.01 }), number('maxDiscountAmount', 'Giảm tối đa'),
            number('minOrderValue', 'Tiền hàng tối thiểu'), number('usageLimit', 'Tổng số lượt', { min: 1 }),
            number('perCustomerLimit', 'Lượt mỗi khách', { min: 1 }), field('startsAt', 'Bắt đầu', { type: 'datetime-local', required: true }),
            field('endsAt', 'Kết thúc', { type: 'datetime-local', required: true }), stateField]}
            values={{ target: 'ORDER', audience: 'ALL_CUSTOMERS', status: 'ACTIVE', ...row, startsAt: timeInput(row.startsAt), endsAt: timeInput(row.endsAt) }}
            busy={action.busy} submit={(body) => action.run(async () => {
              if (target !== 'ORDER' && !targets.length) throw new Error('Chọn ít nhất một sản phẩm hoặc lô hàng áp dụng.')
              const result = await request(path, { method: id ? 'PUT' : 'POST', body: {
                ...body, target, targets: target === 'ORDER' ? [] : targets.map(({ id: ruleId, minimumQuantity }) => ({
                  id: ruleId, minimumQuantity,
                })),
              } })
              location.assign('/van-hanh/khuyen-mai/' + encodeURIComponent(result.promotion.id))
            })} />
        </section>
      </>}
    {id && row.audience === 'ASSIGNED_CUSTOMERS' && <section className="page-box"><h2>Voucher cá nhân</h2>
      {!managed && <><Form fields={[field('q', 'Tìm theo tên, email hoặc mã khách')]} label="Tìm khách"
        submit={({ q }) => setCustomerSearch(q || '')} />
        <DataState resource={customers}>{(result) => <Form fields={[field('customerId', 'Khách hàng', { required: true,
          options: result.items.map((item) => ({ value: item.id, label: item.fullName + ' · ' + item.email })) }),
        number('usageLimit', 'Số lượt', { min: 1 }),
        field('expiresAt', 'Hạn dùng', { type: 'datetime-local' })]} values={{ usageLimit: 1 }} busy={action.busy}
        label="Cấp voucher" submit={(body) => action.run(async () => {
          await request(path + '/vouchers', { method: 'POST', body }); setVoucherPage(1); vouchers.reload()
        }, 'Đã cấp voucher.')} />}</DataState></>}
      <DataState resource={vouchers}>{(list) => <>
        <Grid items={list.items} columns={[column('Mã', 'voucherCode'),
          column('Khách hàng', 'customerId'), column('Lượt dùng', 'usageCount')]} />
        <Pager pagination={list.pagination} setPage={setVoucherPage} />
      </>}</DataState>
    </section>}
  </>
}

function PromotionTargetPicker({ request, target, targets, update }) {
  const [q, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const batch = target === 'BATCH'
  const path = batch ? '/staff/warehouse/inventory/batches' : catalog + '/products'
  const results = useResource(request, path + '?' + new URLSearchParams({ q, page, size: 20, status: 'ACTIVE' }))
  const describe = (row) => batch
    ? [row.batchCode, row.sku, row.expiryDate && 'HSD ' + row.expiryDate].filter(Boolean).join(' · ')
    : row.name + ' · ' + row.productCode
  return <>
    <Form fields={[field('q', batch ? 'Tìm mã lô' : 'Tìm tên hoặc mã sản phẩm', { maxLength: 100 })]}
      label="Tìm" submit={(body) => { setQuery(body.q || ''); setPage(1) }} />
    <DataState resource={results}>{(data) => <>
      {data.items.length ? <Form key={q + ':' + page} fields={[
        field('id', batch ? 'Lô hàng' : 'Sản phẩm', { required: true,
          options: data.items.map((row) => ({ value: row.id, label: describe(row) })) }),
        number('minimumQuantity', 'Số lượng tối thiểu', { min: 0.001, step: 0.001 }),
      ]} values={{ minimumQuantity: 1 }} label="Thêm điều kiện" submit={(rule) => {
        const selected = data.items.find((row) => row.id === rule.id)
        if (selected) update((previous) => [...previous.filter((item) => item.id !== rule.id),
          { ...rule, label: describe(selected) }])
      }} /> : <p>Không tìm thấy đối tượng phù hợp.</p>}
      <Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState>
    <Grid items={targets} columns={[column(batch ? 'Lô đã chọn' : 'Sản phẩm đã chọn', (item) => {
      const row = results.data?.items.find((entry) => entry.id === item.id)
      return item.label || (row ? describe(row) : item.id)
    }), column('Tối thiểu', (item) => item.minimumQuantity ?? 1),
    column('Thao tác', (item) => <Button size="sm" variant="outline"
      onClick={() => update((list) => list.filter((entry) => entry.id !== item.id))}>Bỏ</Button>)]} />
  </>
}
