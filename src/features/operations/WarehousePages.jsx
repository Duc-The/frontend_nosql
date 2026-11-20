import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, Grid, PageTitle, Pager, choices, column, field, useAction, useResource } from '@/components/page-kit'
import { dateTime, price, statusLabel } from '@/lib/format'
import { ResourcePage } from './ResourcePage'

const warehouse = '/staff/warehouse'
const inventory = warehouse + '/inventory'
const statusColumn = column('Trạng thái', (row) => statusLabel(row.status))
const activeOptions = choices({ ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động' })

export function SuppliersPage({ request }) {
  return <ResourcePage request={request} path={warehouse + '/suppliers'} title="Nhà cung cấp" searchable
    columns={[column('Mã', 'supplierCode'), column('Tên', 'name'), column('Liên hệ', 'contactPerson'), column('Điện thoại', 'phoneNumber'), statusColumn]}
    fields={[field('supplierCode', 'Mã nhà cung cấp', { required: true }), field('name', 'Tên', { required: true }),
      field('taxCode', 'Mã số thuế'), field('contactPerson', 'Người liên hệ'), field('phoneNumber', 'Điện thoại', { type: 'tel' }),
      field('email', 'Email', { type: 'email' }), field('address', 'Địa chỉ'), field('note', 'Ghi chú')]}
    actions={(row, mutate, busy) => <Form fields={[field('status', 'Trạng thái', { options: activeOptions, required: true })]}
      values={row} busy={busy} label="Đổi trạng thái" submit={(body) => mutate('/status', body)} />} />
}

export function InventoryPage({ request }) {
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get('muc') === 'lo' ? 'batches' : 'stock')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  const path = inventory + (mode === 'stock' ? '/sku-stock' : '/batches')
  const data = useResource(request, path + '?' + new URLSearchParams({ page, ...filters }))
  const columns = mode === 'stock' ? [column('SKU', 'sku'), column('Quy cách', 'name'),
    column('Tồn thực tế', 'quantityOnHand'), column('Đang giữ', 'quantityReserved'), column('Bán được', 'quantityAvailable'),
    column('Ngưỡng', 'reorderLevel'), column('Cảnh báo', (row) => row.lowStock ? 'Tồn thấp' : '—')]
    : [column('Mã lô', 'batchCode'), column('SKU', 'sku'), column('Hạn dùng', 'expiryDate'),
      column('Tồn thực tế', 'quantityOnHand'), column('Đang giữ', 'quantityReserved'), column('Bán được', 'quantityAvailable'),
      column('Cảnh báo hạn', (row) => statusLabel(row.expiry)), statusColumn,
      column('Thao tác', (row) => <Link className="page-link" to={'/van-hanh/ton-kho/' + encodeURIComponent(row.id)}>Xem chi tiết</Link>)]
  return <>
    <PageTitle title="Tồn kho và hạn dùng" />
    <div className="page-actions">{[['stock', 'Theo SKU'], ['batches', 'Theo lô']].map(([key, label]) =>
      <Button key={key} variant={mode === key ? 'default' : 'outline'} onClick={() => {
        setMode(key); setPage(1); setFilters({})
      }}>{label}</Button>)}</div>
    <Form key={mode} fields={mode === 'stock' ? [field('q', 'Tìm SKU'), field('lowStock', 'Chỉ tồn thấp', { type: 'checkbox' })]
      : [field('q', 'Tìm mã lô'), field('expiry', 'Hạn dùng', { options: choices({ EXPIRING_SOON: 'Cận hạn', EXPIRED: 'Hết hạn', FRESH: 'Còn hạn', UNKNOWN: 'Chưa rõ' }) }),
        field('inStockOnly', 'Chỉ lô còn tồn', { type: 'checkbox' })]}
      submit={(body) => { setFilters(Object.fromEntries(Object.entries(body).filter(([, value]) => value))); setPage(1) }} label="Lọc" />
    <section className="page-box"><DataState resource={data}>{(value) => <>
      <Grid columns={columns} items={value.items} rowKey={(row) => row.id || row.variantId} />
      <Pager pagination={value.pagination} setPage={setPage} />
    </>}</DataState></section>
  </>
}

export function InventoryBatchPage({ request, id }) {
  const path = inventory + '/batches/' + encodeURIComponent(id)
  const resource = useResource(request, path)
  const action = useAction()
  return <>
    <PageTitle title="Chi tiết lô hàng"><Link className="page-link" to="/van-hanh/ton-kho?muc=lo">Về danh sách lô</Link></PageTitle>
    <ActionMessage action={action} />
    <DataState resource={resource}>{(batch) => <>
      <section className="page-box">
        <div className="ops-report-heading"><h2>{batch.batchCode}</h2>
          <span className="ops-stock-badge" data-warning={['EXPIRED', 'EXPIRING_SOON'].includes(batch.expiry) || undefined}>{statusLabel(batch.expiry)}</span></div>
        <dl className="ops-detail-facts">
          <div><dt>SKU</dt><dd>{batch.sku}</dd></div><div><dt>Quy cách</dt><dd>{batch.variantName}</dd></div>
          <div><dt>Lô nhà cung cấp</dt><dd>{batch.lotCode || '—'}</dd></div><div><dt>Xuất xứ</dt><dd>{batch.originDescription || '—'}</dd></div>
          <div><dt>Ngày sản xuất</dt><dd>{batch.manufactureDate || '—'}</dd></div><div><dt>Hạn dùng</dt><dd>{batch.expiryDate || '—'}</dd></div>
          <div><dt>Tồn thực tế</dt><dd>{batch.quantityOnHand}</dd></div><div><dt>Đang giữ</dt><dd>{batch.quantityReserved}</dd></div>
          <div><dt>Có thể bán</dt><dd>{batch.quantityAvailable}</dd></div><div><dt>Trạng thái</dt><dd>{statusLabel(batch.status)}</dd></div>
        </dl>
        {batch.statusReason && <p>Lý do cập nhật: {batch.statusReason}</p>}
        {batch.statusChangedAt && <p>Cập nhật lúc {dateTime(batch.statusChangedAt)}</p>}
      </section>
      <section className="page-box"><h2>Điều chỉnh trạng thái</h2>
        <Form fields={[field('status', 'Trạng thái', { required: true, options: activeOptions }), field('reason', 'Lý do', { maxLength: 500 })]}
          values={{ status: batch.status }} busy={action.busy} submit={(body) => action.run(async () => {
            await request(path + '/status', { method: 'PUT', body })
            resource.reload()
          }, 'Đã cập nhật trạng thái lô.')} />
      </section>
    </>}</DataState>
  </>
}

export function TracePage({ request }) {
  const [code, setCode] = useState('')
  const [page, setPage] = useState(1)
  const [batch, setBatch] = useState(null)
  const [orderPage, setOrderPage] = useState(1)
  const path = inventory + '/traceability'
  const lots = useResource(request, code ? path + '?' + new URLSearchParams({ code, page }) : null)
  const orders = useResource(request, batch ? path + '/batches/' + encodeURIComponent(batch.id) + '/orders?page=' + orderPage : null)
  return <><PageTitle title="Truy xuất lô hàng" />
    <Form fields={[field('code', 'Mã lô nội bộ hoặc nhà cung cấp', { required: true })]} label="Tra cứu"
      submit={(body) => { setCode(body.code.trim()); setBatch(null); setPage(1) }} />
    {code && <DataState resource={lots}>{(data) => <>
      {!data.items.length && <p>Không tìm thấy mã lô này.</p>}
      {data.items.map((lot) => <section className="page-box" key={lot.id}>
        <h2>{lot.batchCode}</h2><p>{lot.sku} · {lot.originDescription} · Hạn dùng {lot.expiryDate || '—'}</p>
        <Grid items={lot.origins} rowKey={(row) => row.receiptDetailId} columns={[column('Phiếu nhập', 'receiptCode'),
          column('Nhà cung cấp', (row) => row.supplier?.name), column('Liên hệ', (row) => row.supplier?.phoneNumber || row.supplier?.email),
          column('Ngày nhận', (row) => dateTime(row.receivedAt)), column('Nhận', 'quantityReceived'), column('Từ chối', 'quantityRejected')]} />
        <Button className="justify-self-start" variant="outline" onClick={() => { setBatch(lot); setOrderPage(1) }}>Xem đơn đã xuất lô</Button>
      </section>)}
      <Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState>}
    {batch && <section className="page-box"><h2>Đơn đã xuất lô {batch.batchCode}</h2><DataState resource={orders}>{(data) => <>
      <Grid items={data.items} rowKey={(row) => row.orderCode} columns={[column('Mã đơn', 'orderCode'), column('Số lượng xuất', 'quantityIssued'),
        column('Trạng thái', (row) => statusLabel(row.orderStatus)), column('Lần xuất cuối', (row) => dateTime(row.lastIssuedAt))]} />
      <Pager pagination={data.pagination} setPage={setOrderPage} />
    </>}</DataState></section>}
  </>
}

const queuePath = inventory + '/orders'

export function IssuePage({ request }) {
  const [page, setPage] = useState(1)
  const queue = useResource(request, queuePath + '?page=' + page)
  return <><PageTitle title="Xuất kho theo đơn" />
    <section className="page-box"><h2>Đơn chờ xuất kho</h2><DataState resource={queue}>{(data) => <>
      <Grid items={data.items} rowKey={(row) => row.orderCode} columns={[column('Mã đơn', (row) =>
        <Link className="page-link" to={'/van-hanh/xuat-kho/' + encodeURIComponent(row.orderCode)}>{row.orderCode}</Link>),
      column('Ngày đặt', (row) => dateTime(row.orderedAt)), statusColumn, column('Hạn giữ', (row) => dateTime(row.stockReservedUntil))]} />
      <Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState></section>
  </>
}

export function IssueDetailPage({ request, code }) {
  const detailPath = queuePath + '/' + encodeURIComponent(code)
  const detail = useResource(request, detailPath)
  const action = useAction()
  return <><PageTitle title="Chi tiết xuất kho"><Link className="page-link" to="/van-hanh/xuat-kho">Về đơn chờ xuất</Link></PageTitle>
    <ActionMessage action={action} />
    <DataState resource={detail}>{(data) => <section className="page-box">
      <div className="ops-report-heading"><h2>{code}</h2><span className="ops-chip">{statusLabel(data.order.status)}</span></div>
      {data.stockIssuedAt && <p>Đã xuất kho lúc {dateTime(data.stockIssuedAt)}</p>}
      <Grid items={data.allocations} rowKey={(row) => row.orderDetailId + ':' + row.batchId}
        columns={[column('SKU', 'sku'), column('Mã lô', (row) => row.batchId ?
          <Link to={'/van-hanh/ton-kho/' + encodeURIComponent(row.batchId)} className="page-link">{row.batchCode}</Link> : row.batchCode),
          column('Hạn dùng', 'expiryDate'), column('Số lượng', 'quantity'), statusColumn]} />
      {data.order.status === 'PACKING' && <Button className="justify-self-start" disabled={action.busy} onClick={() => {
        if (window.confirm('Xác nhận xuất kho đơn này?')) action.run(async () => {
          await request(detailPath + '/issue', { method: 'POST' }); detail.reload()
        }, 'Đã xuất kho.')
      }}>Xác nhận xuất kho</Button>}
    </section>}</DataState>
  </>
}

const receiptPath = warehouse + '/goods-receipts'
export function ReceiptsPage({ request }) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const receipts = useResource(request, receiptPath + '?page=' + page)
  const path = selected ? receiptPath + '/' + encodeURIComponent(selected) : null
  const detail = useResource(request, path)
  const action = useAction()
  function save(body) {
    return action.run(async () => {
      const result = await request(path || receiptPath, { method: path ? 'PUT' : 'POST', body })
      setSelected(result.summary.receipt.id); setEditing(false); receipts.reload(); detail.reload()
    }, 'Đã lưu phiếu nhập.')
  }
  function update(suffix, body) {
    return action.run(async () => {
      await request(path + suffix, { method: 'POST', body }); receipts.reload(); detail.reload()
    }, 'Đã cập nhật phiếu nhập.')
  }
  return <><PageTitle title="Phiếu nhập"><Button onClick={() => { setSelected(null); setEditing(true) }}>Lập phiếu nhập</Button></PageTitle>
    <ActionMessage action={action} />
    {editing && (!selected ? <ReceiptEditor key="new" request={request} busy={action.busy} save={save} />
      : <DataState resource={detail}>{(data) => <ReceiptEditor key={selected} request={request} data={data} busy={action.busy} save={save} />}</DataState>)}
    {editing && <Button variant="outline" className="justify-self-start" onClick={() => setEditing(false)}>Đóng biểu mẫu</Button>}
    {selected && !editing && <DataState resource={detail}>{(data) => <section className="page-box">
      <h2>{data.summary.receipt.receiptCode}</h2>
      <p>{data.summary.supplierName} · {statusLabel(data.summary.receipt.status)} · {price(data.summary.receipt.totalCost)}</p>
      <p>Người nhận: {data.summary.receivedByName || '—'} · Người xác nhận: {data.summary.confirmedByName || '—'}</p>
      <Grid items={data.items} columns={[column('SKU', 'sku'), column('Mã lô', (row) => row.batchCode || row.lotCode),
        column('Nhận', 'quantityReceived'), column('Từ chối', 'quantityRejected'), column('Lý do từ chối', 'discrepancyReason'),
        column('Đạt', 'quantityAccepted'), column('Giá vốn', (row) => price(row.unitCost))]} />
      {data.summary.receipt.status === 'DRAFT' && <>
        <Button className="justify-self-start" variant="outline" onClick={() => setEditing(true)}>Sửa phiếu</Button>
        <Form fields={[field('note', 'Ghi chú xác nhận')]} busy={action.busy} label="Xác nhận nhập kho" submit={(body) => {
          if (window.confirm('Xác nhận phiếu và cộng phần hàng đạt vào kho?')) update('/confirm', body)
        }} />
        <Form fields={[field('reason', 'Lý do hủy', { required: true })]} busy={action.busy} label="Hủy phiếu" submit={(body) => {
          if (window.confirm('Hủy phiếu nhập nháp?')) update('/cancel', body)
        }} />
      </>}
    </section>}</DataState>}
    <section className="page-box"><DataState resource={receipts}>{(data) => <>
      <Grid items={data.items} rowKey={(row) => row.receipt.id} columns={[
        column('Mã phiếu', (row) => <Button size="sm" variant="outline" onClick={() => {
          setSelected(row.receipt.id); setEditing(false)
        }}>{row.receipt.receiptCode}</Button>),
        column('Nhà cung cấp', 'supplierName'), column('Ngày nhận', (row) => dateTime(row.receipt.receivedAt)),
        column('Trạng thái', (row) => statusLabel(row.receipt.status)),
        column('Tổng giá vốn', (row) => price(row.receipt.totalCost)),
      ]} /><Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState></section>
  </>
}

function ReceiptEditor({ request, data, save, busy }) {
  const suppliers = useResource(request, warehouse + '/suppliers?status=ACTIVE&size=100')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(data?.items || [])
  const variants = useResource(request, warehouse + '/variants?' + new URLSearchParams({ q: query, size: 30 }))
  return <section className="page-box"><h2>{data ? 'Sửa phiếu nhập' : 'Phiếu nhập mới'}</h2>
    <Form fields={[field('q', 'Tìm SKU để nhập')]} label="Tìm" submit={({ q }) => setQuery(q || '')} />
    <DataState resource={variants}>{(rows) => <Form fields={[
      field('variantId', 'SKU', { required: true, options: rows.items.map((row) => ({ value: row.id, label: row.sku + ' · ' + row.productName + ' ' + row.name })) }),
      field('quantityReceived', 'Số lượng nhận', { type: 'number', min: 1, required: true }),
      field('quantityRejected', 'Số lượng từ chối', { type: 'number', min: 0, required: true }),
      field('unitCost', 'Giá vốn mỗi SKU', { type: 'number', min: 0, required: true }), field('discrepancyReason', 'Lý do từ chối'),
      field('lotCode', 'Mã lô nhà cung cấp'), field('originDescription', 'Xuất xứ'),
      field('manufactureDate', 'Ngày sản xuất', { type: 'date' }), field('expiryDate', 'Hạn dùng', { type: 'date' }),
    ]} values={{ quantityRejected: 0 }} label="Thêm dòng nhập" submit={(body) => {
      setItems((previous) => [...previous, { ...body, id: crypto.randomUUID(), sku: rows.items.find((row) => row.id === body.variantId)?.sku }])
    }} />}</DataState>
    <Grid items={items} columns={[column('SKU', (row) => row.sku || row.variantId), column('Mã lô', 'lotCode'),
      column('Nhận', 'quantityReceived'), column('Từ chối', 'quantityRejected'), column('Giá vốn', (row) => price(row.unitCost)),
      column('Thao tác', (row) => <Button size="sm" variant="outline" onClick={() => setItems((list) => list.filter((item) => item.id !== row.id))}>Bỏ dòng</Button>)]} />
    <DataState resource={suppliers}>{(rows) => <Form fields={[field('supplierId', 'Nhà cung cấp', { required: true,
      options: rows.items.map((row) => ({ value: row.id, label: row.name })) }), field('note', 'Ghi chú phiếu')]}
      values={data?.summary.receipt} busy={busy} label="Lưu phiếu nháp" submit={(body) => {
        if (items.length) save({ ...body, items: items.map(({ variantId, quantityReceived, quantityRejected, unitCost,
          discrepancyReason, lotCode, manufactureDate, expiryDate, originDescription }) => ({
          variantId, quantityReceived, quantityRejected, unitCost, discrepancyReason, lotCode, manufactureDate, expiryDate, originDescription,
        })) })
      }} />}</DataState>
    {!items.length && <p>Thêm ít nhất một dòng hàng trước khi lưu.</p>}
  </section>
}
