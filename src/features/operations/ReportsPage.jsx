import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowUpRight, CalendarDays, CircleCheck, ShoppingBag, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './reports.css'
import { DataState, Form, Grid, PageTitle, column, field, useResource } from '@/components/page-kit'
import { paymentLabel, price, statusLabel } from '@/lib/format'

const number = new Intl.NumberFormat('vi-VN')
const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
const date = (value) => value.slice(5).split('-').reverse().join('/')
const fullDate = (value) => value.split('-').reverse().join('/')
const salesFields = [field('from', 'Từ ngày', { type: 'date' }), field('to', 'Đến ngày', { type: 'date' })]

function recentPeriod(days) {
  const vietnamDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const start = new Date(vietnamDay + 'T00:00:00Z')
  start.setUTCDate(start.getUTCDate() - days + 1)
  return { from: start.toISOString().slice(0, 10), to: vietnamDay }
}

export function ReportsPage({ request }) {
  const [period, setPeriod] = useState({})
  const [preset, setPreset] = useState('30')
  const [custom, setCustom] = useState(false)
  const [rangeError, setRangeError] = useState('')
  const query = new URLSearchParams(Object.entries(period).filter(([, value]) => value))
  const sales = useResource(request, '/admin/reports/sales?' + query)
  const top = useResource(request, '/admin/reports/top-skus?' + query)

  function applyPeriod(next) {
    if (next.from && next.to && next.from > next.to) {
      setRangeError('Ngày kết thúc phải từ ngày bắt đầu trở đi.')
      return
    }
    setRangeError('')
    setPreset('custom')
    setPeriod(next)
  }

  return <>
    <div className="report-heading">
      <div><PageTitle title="Tổng quan cửa hàng" />
        <p>{sales.data ? `${fullDate(sales.data.from)} – ${fullDate(sales.data.to)} · Giờ Việt Nam` : 'Kỳ báo cáo · Giờ Việt Nam'}</p>
      </div>
      <div className="report-period-options" role="group" aria-label="Kỳ báo cáo">
        {[7, 30].map((days) => <Button key={days} type="button" variant="ghost" aria-pressed={preset === String(days)}
          onClick={() => { setPreset(String(days)); setRangeError(''); setCustom(false); setPeriod(recentPeriod(days)) }}>{days} ngày</Button>)}
        <Button type="button" variant="ghost" aria-expanded={custom} aria-controls="report-custom-period" onClick={() => setCustom(!custom)}>
          <CalendarDays size={16} aria-hidden="true" /> Tùy chọn
        </Button>
      </div>
    </div>
    {custom && <section id="report-custom-period" className="page-box ops-period" aria-label="Chọn khoảng ngày">
      <Form key={sales.data?.from + ':' + sales.data?.to} fields={salesFields}
        values={{ from: sales.data?.from, to: sales.data?.to, ...period }} submit={applyPeriod} label="Áp dụng" />
      {rangeError && <p className="page-error" role="alert">{rangeError}</p>}
    </section>}
    <DataState resource={sales}>{(data) => <>
      <div className="report-summary">
        <section className="report-hero">
          <div className="report-hero-top"><h2>Tiền đã thu</h2><Wallet size={21} aria-hidden="true" /></div>
          <strong>{price(data.collectedAmount)}</strong>
          <dl><div><dt>Tiền hàng sau giảm</dt><dd>{price(data.netMerchandiseAmount)}</dd></div>
            <div><dt>Phí giao đã thu</dt><dd>{price(data.shippingFee)}</dd></div></dl>
        </section>
        <div className="report-metric-pair">
          <Metric label="Đơn được đặt" value={number.format(data.placedOrderCount)} icon={ShoppingBag}
            href="/van-hanh/don-hang" linkLabel="Xem đơn bán hàng" />
          <Metric label="Đơn đã thu tiền" value={number.format(data.paidOrderCount)} icon={CircleCheck} tone="mint"
            href="#report-payments" linkLabel="Xem theo phương thức" />
        </div>
      </div>
      <div className="report-charts">
        <RevenueChart rows={data.dailyRevenue} key={query.toString()} />
        <OrderStatus rows={data.ordersByStatus} />
      </div>
      <section id="report-payments" className="page-box ops-report-table">
        <div className="ops-section-heading"><div><h2>Thanh toán</h2><p>Tiền đã thu theo phương thức</p></div>
        </div>
        <Grid items={data.paymentsByMethod} rowKey={(row) => row.method} columns={[
          column('Phương thức', (row) => paymentLabel(row.method)),
          column('Số đơn', (row) => number.format(row.paidOrderCount)),
          column('Đã thu', (row) => price(row.collectedAmount)),
        ]} />
      </section>
    </>}</DataState>
    <section className="page-box ops-report-table">
      <div className="ops-section-heading"><div><h2>SKU bán chạy</h2><p>Xếp theo số lượng bán</p></div></div>
      <DataState resource={top}>{(data) => <Grid items={data.items} rowKey={(row) => row.variantId} columns={[
        column('Sản phẩm', (row) => <span className="ops-product-cell"><strong>{row.productName}</strong><small>{row.variantName}</small></span>),
        column('SKU', (row) => <span className="ops-chip">{row.sku}</span>),
        column('Đã bán', (row) => number.format(row.quantitySold)),
        column('Tiền hàng trước giảm', (row) => price(row.grossMerchandiseAmount)),
      ]} />}</DataState>
    </section>
  </>
}

function Metric({ label, value, icon, tone, href, linkLabel }) {
  const Icon = icon
  return <section className="report-metric" data-tone={tone}>
    <span className="report-metric-icon"><Icon size={21} aria-hidden="true" /></span>
    <h2>{label}</h2><strong>{value}</strong>
    <Link to={href}>{linkLabel} <ArrowUpRight size={15} aria-hidden="true" /></Link>
  </section>
}

function RevenueChart({ rows = [] }) {
  const [grouped, setGrouped] = useState(rows.length > 14)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const step = grouped ? Math.max(7, Math.ceil(rows.length / 24)) : Math.max(1, Math.ceil(rows.length / 35))
  const buckets = Array.from({ length: Math.ceil(rows.length / step) }, (_, index) => {
    const slice = rows.slice(index * step, (index + 1) * step)
    const start = date(slice[0].date)
    const end = date(slice.at(-1).date)
    return { label: start === end ? start : start + ' – ' + end, start,
      amount: slice.reduce((sum, row) => sum + Number(row.collectedAmount), 0),
      count: slice.reduce((sum, row) => sum + Number(row.paidOrderCount), 0) }
  })
  const maximum = Math.max(0, ...buckets.map((row) => row.amount))
  const peak = buckets.findIndex((row) => row.amount === maximum)
  const active = hovered ?? selected ?? peak
  const detail = buckets[active]
  const dateLabels = [...new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1])]

  return <section className="page-box ops-revenue">
    <div className="ops-section-heading"><div><h2>Tiền đã thu theo thời gian</h2>
      <p>{step > 1 ? `Gộp theo nhóm tối đa ${step} ngày` : 'Theo ngày'} · VND</p></div>
      {rows.length > 14 && <Button type="button" size="sm" variant="outline" onClick={() => {
        setGrouped(!grouped); setSelected(null); setHovered(null)
      }}>{grouped ? (rows.length > 35 ? 'Chia chi tiết hơn' : 'Xem theo ngày') : 'Gộp theo kỳ'}</Button>}
    </div>
    {maximum > 0 && detail && <div className="report-chart-value">
      <strong>{price(detail.amount)}</strong><small>{detail.label} · {number.format(detail.count)} đơn</small>
    </div>}
    {maximum > 0 ? <div className="ops-chart">
      <div className="ops-chart-scale" aria-hidden="true">
        {[1, .75, .5, .25, 0].map((value) => <span key={value}>{compact.format(maximum * value)}</span>)}
      </div>
      <div>
        <div className="ops-chart-plot" aria-label="Biểu đồ cột tiền đã thu">
          {buckets.map((bucket, index) => <button key={bucket.label} type="button"
            aria-label={`${bucket.label}, ${price(bucket.amount)}, ${bucket.count} đơn`}
            aria-pressed={active === index} onClick={() => setSelected(index)} onFocus={() => setSelected(index)}
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(index) }} onPointerLeave={() => setHovered(null)}>
            <span style={{ height: bucket.amount / maximum * 100 + '%' }} />
          </button>)}
        </div>
        <div className="ops-chart-dates" aria-hidden="true">
          {dateLabels.map((index) => <span key={index}>{buckets[index].start}</span>)}
        </div>
      </div>
    </div> : <p className="ops-empty">Chưa ghi nhận tiền đã thu trong kỳ này.</p>}
    <details className="ops-chart-data"><summary>Xem số liệu từng ngày</summary>
      <Grid items={rows} rowKey={(row) => row.date} columns={[
        column('Ngày', 'date'), column('Đơn đã thu', 'paidOrderCount'), column('Đã thu', (row) => price(row.collectedAmount)),
      ]} />
    </details>
  </section>
}

const statusColors = {
  COMPLETED: '#256046', DELIVERED: '#5a9576', CANCELLED: '#ba6555', PENDING: '#d09a3a',
  CONFIRMED: '#537c9a', PACKING: '#796ca0', PACKED: '#9c8057', SHIPPING: '#538c92',
}

function OrderStatus({ rows = [] }) {
  const sorted = rows.filter((row) => row.count > 0).sort((a, b) => b.count - a.count)
  const total = sorted.reduce((sum, row) => sum + Number(row.count), 0)
  let offset = 0
  const segments = sorted.map((row) => {
    const width = row.count / total * 100
    const start = offset
    offset += width
    return { ...row, width, stop: `${statusColors[row.status] || '#65756c'} ${start}% ${offset}%` }
  })
  return <section className="page-box report-orders">
    <div className="ops-section-heading"><div><h2>Trạng thái đơn hàng</h2><p>Đơn được đặt trong kỳ</p></div></div>
    {total ? <>
      <div className="report-donut" style={{ backgroundImage: 'conic-gradient(' + segments.map((row) => row.stop).join(',') + ')' }}
        aria-label={`${number.format(total)} đơn`}>
        <div><strong>{number.format(total)}</strong><span>đơn hàng</span></div>
      </div>
      <ul className="report-status-list">{segments.map((row) => <li key={row.status}>
        <span style={{ '--status-color': statusColors[row.status] || '#65756c' }}>{statusLabel(row.status)}</span>
        <strong>{number.format(row.count)}</strong><small>{number.format(Math.round(row.width * 10) / 10)}%</small>
      </li>)}</ul>
    </> : <p className="ops-empty">Chưa có đơn hàng trong kỳ này.</p>}
  </section>
}
