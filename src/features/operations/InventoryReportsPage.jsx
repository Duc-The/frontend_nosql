import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AlertTriangle, Boxes, CalendarDays } from 'lucide-react'
import { CustomerSections } from '@/features/account/customer-ui'
import { DataState, Form, Grid, PageTitle, Pager, choices, column, field, useResource } from '@/components/page-kit'
import { statusLabel } from '@/lib/format'

const number = new Intl.NumberFormat('vi-VN')
const amount = (key) => (row) => row[key] == null ? '—' : number.format(row[key])
const date = (value) => value ? value.split('-').reverse().join('/') : '—'
const batchLink = (id) => '/van-hanh/ton-kho/' + encodeURIComponent(id)

export function InventoryReportsPage({ request }) {
  const [view, setView] = useState('stock')
  const [stock, setStock] = useState({ q: '', lowStock: false })
  const [expired, setExpired] = useState(false)
  const [page, setPage] = useState(1)
  const isStock = view === 'stock'
  const query = new URLSearchParams(isStock ? { ...stock, page } : { expired, page })
  const resource = useResource(request, '/admin/reports/inventory/' + (isStock ? 'sku-stock' : 'expiring-batches') + '?' + query)
  const columns = isStock ? [
    column('SKU / Quy cách', (row) => <span className="ops-product-cell"><strong>{row.sku}</strong><small>{row.name}</small></span>),
    column('Tồn thực tế', amount('quantityOnHand')), column('Đang giữ', amount('quantityReserved')),
    column('Có thể bán', amount('quantityAvailable')), column('Ngưỡng cảnh báo', amount('reorderLevel')),
    column('Tình trạng', (row) => <span className="ops-stock-badge" data-warning={row.lowStock || undefined}>{row.lowStock ? 'Tồn thấp' : 'Đủ ngưỡng'}</span>),
  ] : [
    column('Mã lô / SKU', (row) => <span className="ops-product-cell">
      <Link to={batchLink(row.id)} className="page-link">{row.batchCode}</Link><small>{row.sku}</small>
    </span>),
    column('Hạn dùng', (row) => date(row.expiryDate)), column('Còn trong kho', amount('quantityOnHand')),
    column('Tình trạng', (row) => <span className="ops-stock-badge" data-warning>{statusLabel(row.expiry)}</span>),
  ]

  return <>
    <div className="ops-overview-heading"><PageTitle title="Báo cáo kho" />
      <p>Theo dõi lượng hàng có thể bán, SKU tồn thấp và lô cần xử lý theo hạn dùng.</p></div>
    <CustomerSections label="Loại báo cáo kho" items={ [['stock', 'Tồn theo SKU'], ['expiry', 'Hạn dùng theo lô']] }
      active={view} onChange={(next) => { setView(next); setPage(1) }} />
    <section className="page-box">
      <div className="ops-report-heading">
        {isStock ? <Boxes size={22} aria-hidden="true" /> : <CalendarDays size={22} aria-hidden="true" />}
        <div><h2>{isStock ? 'Tồn kho theo SKU' : 'Hạn dùng theo lô'}</h2>
          <p>{isStock ? 'Số lượng có thể bán đã trừ hàng đang giữ.' : 'Bấm mã lô để xem chi tiết và tình trạng mở bán.'}</p></div>
      </div>
      {isStock ? <Form key="stock" fields={[field('q', 'Tìm theo SKU hoặc tên quy cách', { maxLength: 100 }),
        field('lowStock', 'Chỉ hiện SKU tồn thấp', { type: 'checkbox' })]} values={stock} label="Lọc báo cáo"
        submit={({ q, lowStock }) => { setStock({ q: q?.trim() || '', lowStock }); setPage(1) }} />
        : <Form key="expiry" fields={[field('period', 'Tình trạng hạn dùng', { required: true,
          options: choices({ soon: 'Sắp hết hạn', expired: 'Đã hết hạn' }) })]} values={{ period: expired ? 'expired' : 'soon' }}
          label="Lọc báo cáo" submit={({ period }) => { setExpired(period === 'expired'); setPage(1) }} />}
    </section>
    <section className="page-box">
      <DataState resource={resource}>{(data) => <>
        {data.items.length ? <>
          <div className="ops-report-heading"><h2>Kết quả báo cáo</h2><span className="ops-chip">{data.pagination.totalElements} kết quả</span></div>
          <Grid columns={columns} items={data.items} rowKey={(row) => row.id || row.variantId} />
          <Pager pagination={data.pagination} setPage={setPage} />
        </> : <div className="ops-empty ops-report-empty"><AlertTriangle size={19} aria-hidden="true" />
          Không có dữ liệu phù hợp với bộ lọc.</div>}
      </>}</DataState>
    </section>
  </>
}
