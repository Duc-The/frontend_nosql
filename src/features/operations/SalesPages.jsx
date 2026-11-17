import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, Grid, PageTitle, Pager, choices, column, field, useAction, useResource } from '@/components/page-kit'
import { dateTime, paymentLabel, price, statusLabel } from '@/lib/format'
import { OrderDetails } from '@/features/orders/OrdersPage'

const path = '/staff/orders'
const statuses = ['PENDING', 'CONFIRMED', 'PACKING', 'PACKED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED']
const statusChoices = choices(Object.fromEntries(statuses.map((status) => [status, statusLabel(status)])))

export function SalesList({ request }) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({})
  const query = new URLSearchParams({ page, ...filter })
  const orders = useResource(request, path + '?' + query)
  return <><PageTitle title="Quản lý đơn hàng" />
    <Form fields={[field('q', 'Mã đơn'), field('status', 'Trạng thái', { options: statusChoices })]} label="Lọc" submit={(body) => {
      setFilter(Object.fromEntries(Object.entries(body).filter(([, value]) => value))); setPage(1)
    }} />
    <section className="page-box"><DataState resource={orders}>{(data) => <>
      <Grid items={data.items} rowKey={(row) => row.orderCode} columns={[
        column('Mã đơn', (row) => <a className="page-link" href={'/van-hanh/don-hang/' + encodeURIComponent(row.orderCode)}>{row.orderCode}</a>),
        column('Ngày đặt', (row) => dateTime(row.orderedAt)), column('Trạng thái', (row) => statusLabel(row.status)),
        column('Phụ trách', 'assignedEmployeeName'), column('Tổng tiền', (row) => price(row.totalAmount)),
      ]} /><Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState></section>
  </>
}

export function SalesDetail({ request, session, code }) {
  const endpoint = path + '/' + encodeURIComponent(code)
  const order = useResource(request, endpoint)
  const action = useAction()
  const admin = session.roles.includes('ADMIN')
  const staff = useResource(request, admin ? '/admin/employees?size=100' : null)
  function mutate(suffix, method, body) {
    return action.run(async () => {
      await request(endpoint + suffix, { method, body }); order.reload()
    }, 'Đã cập nhật đơn.')
  }
  return <><PageTitle title="Xử lý đơn hàng" /><a href="/van-hanh/don-hang" className="page-link">Quay lại danh sách</a>
    <ActionMessage action={action} />
    <DataState resource={order}>{(data) => {
      const summary = data.order.order
      const next = ({ PENDING: 'CONFIRMED', CONFIRMED: 'PACKING', PACKED: 'SHIPPING', SHIPPING: 'DELIVERED', DELIVERED: 'COMPLETED' })[summary.status]
      return <>
        <section className="page-box"><h2>Vận hành đơn</h2>
          <p>Phụ trách: {data.assignment.employeeName || 'Chưa phân công'}</p>
          <p>{paymentLabel(summary.paymentMethod)} · {statusLabel(summary.paymentStatus)}</p>
          {admin && !['CANCELLED', 'COMPLETED'].includes(summary.status) && <DataState resource={staff}>{(employees) => {
            const options = employees.items.filter((employee) => employee.accountStatus === 'ACTIVE' && employee.workStatus === 'ACTIVE' &&
              employee.roles.some((role) => ['ADMIN', 'SALES_STAFF'].includes(role))).map((employee) => ({ value: employee.id, label: employee.fullName }))
            return <Form fields={[field('employeeId', 'Người phụ trách', { options, required: true })]}
              values={data.assignment} submit={(body) => mutate('/assignment', 'PUT', body)} label="Phân công" busy={action.busy} />
          }}</DataState>}
          {!admin && !data.assignment.employeeId && summary.status === 'PENDING' &&
            <Button className="justify-self-start" disabled={action.busy} onClick={() => mutate('/assignment', 'PUT', {})}>Nhận đơn</Button>}
          {summary.status === 'PACKING' && <p>Đang chờ kho xác nhận xuất hàng.</p>}
          {next === 'SHIPPING' ? <Form fields={[field('carrierName', 'Đơn vị giao'), field('trackingCode', 'Mã vận đơn')]}
            busy={action.busy} label="Bắt đầu giao" submit={(body) => mutate('/status', 'PUT', { ...body, status: next })} />
            : next && (next !== 'COMPLETED' || summary.paymentStatus === 'PAID') &&
              <Button className="justify-self-start" disabled={action.busy || (summary.status === 'PENDING' && summary.paymentMethod !== 'COD' && summary.paymentStatus !== 'PAID')}
                onClick={() => mutate('/status', 'PUT', { status: next })}>
                {({ CONFIRMED: 'Xác nhận đơn', PACKING: 'Chuyển kho đóng gói', DELIVERED: 'Xác nhận đã giao', COMPLETED: 'Hoàn tất đơn' })[next]}
              </Button>}
          {summary.status === 'DELIVERED' && summary.paymentMethod === 'COD' && summary.paymentStatus === 'PENDING' &&
            <Button className="justify-self-start" variant="outline" disabled={action.busy} onClick={() => {
              if (window.confirm('Xác nhận cửa hàng đã thu đủ tiền COD?')) mutate('/payment/confirm-cod', 'POST')
            }}>Xác nhận thu COD</Button>}
        </section>
        <OrderDetails data={data.order} />
      </>
    }}</DataState>
  </>
}
