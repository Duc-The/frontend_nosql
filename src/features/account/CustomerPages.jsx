import { useNavigate } from 'react-router-dom'
import { Gift, LockKeyhole, MapPin, Pencil, Plus, Ticket, Trash2, UserRound, WalletCards } from 'lucide-react'
import { CustomerEmpty, CustomerSections, CustomerTitle, PanelTitle } from './customer-ui'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, Grid, Pager, column, field, useAction, useResource } from '@/components/page-kit'
import { price, dateTime, statusLabel } from '@/lib/format'

const me = '/customers/me'
const addressPath = me + '/addresses'
const addressFields = [
  field('label', 'Tên địa chỉ', { required: true }),
  field('receiverName', 'Người nhận', { required: true }),
  field('receiverPhone', 'Số điện thoại', { type: 'tel', required: true, pattern: '\\+?[0-9]{9,15}' }),
  field('province', 'Tỉnh / Thành phố', { required: true }),
  field('district', 'Quận / Huyện'),
  field('ward', 'Phường / Xã', { required: true }),
  field('streetAddress', 'Số nhà và tên đường', { required: true }),
]

export function ProfilePage({ request, save }) {
  const [section, setSection] = useState('profile')
  const profile = useResource(request, section === 'profile' ? me : null)
  const action = useAction()
  return <>
    <CustomerTitle title="Hồ sơ của tôi" description="Quản lý thông tin cá nhân và bảo mật tài khoản." />
    <CustomerSections label="Thiết lập tài khoản" items={ [['profile', 'Thông tin cá nhân'], ['security', 'Bảo mật']] }
      active={section} onChange={setSection} />
    {section === 'profile' ? <section className="page-box">
      <DataState resource={profile}>{(data) => <>
        <div className="customer-identity">
          <span className="customer-icon"><UserRound size={25} aria-hidden="true" /></span>
          <div><h2>{data.fullName || data.username}</h2><p>{data.email}</p><small>@{data.username}</small></div>
        </div>
        <PanelTitle title="Thông tin cá nhân" icon={UserRound} />
        <Form values={data} fields={[field('fullName', 'Họ và tên', { required: true }),
          field('phoneNumber', 'Số điện thoại', { type: 'tel', pattern: '\\+?[0-9]{9,15}' }),
          field('dateOfBirth', 'Ngày sinh', { type: 'date' })]} busy={action.busy}
          submit={(body) => action.run(async () => {
            await request(me, { method: 'PUT', body }); profile.reload()
          }, 'Đã cập nhật hồ sơ.')} />
      </>}</DataState>
      <ActionMessage action={action} />
    </section> : <PasswordSection request={request} save={save} />}
  </>
}

function PasswordSection({ request, save }) {
  const navigate = useNavigate()
  const action = useAction()
  return <section className="page-box"><PanelTitle title="Đổi mật khẩu" icon={LockKeyhole}><p>Bạn sẽ đăng nhập lại sau khi đổi mật khẩu.</p></PanelTitle>
    <Form fields={[field('currentPassword', 'Mật khẩu hiện tại', { type: 'password', required: true, autoComplete: 'current-password' }),
      field('newPassword', 'Mật khẩu mới', { type: 'password', required: true, minLength: 8, autoComplete: 'new-password' })]}
      busy={action.busy} label="Đổi mật khẩu" submit={(body) => action.run(async () => {
        await request('/auth/change-password', { method: 'POST', body })
        save(null)
        navigate('/dang-nhap')
      })} />
    <ActionMessage action={action} />
  </section>
}

export function AddressesPage({ request }) {
  const addresses = useResource(request, addressPath)
  const [editing, setEditing] = useState(null)
  const action = useAction()
  function mutate(path, method, body, message) {
    return action.run(async () => {
      await request(path, { method, body })
      setEditing(null)
      addresses.reload()
    }, message)
  }
  return <>
    <CustomerTitle title="Sổ địa chỉ" description="Quản lý các địa chỉ nhận hàng của bạn."><Button onClick={() => setEditing({})}><Plus size={17} />Thêm địa chỉ</Button></CustomerTitle>
    <ActionMessage action={action} />
    {editing && <section className="page-box" key={editing.id || 'new'}>
      <PanelTitle title={editing.id ? 'Sửa địa chỉ' : 'Địa chỉ mới'} icon={MapPin} />
      <Form fields={addressFields} values={editing} busy={action.busy} submit={(body) =>
        mutate(editing.id ? addressPath + '/' + encodeURIComponent(editing.id) : addressPath,
          editing.id ? 'PUT' : 'POST', body, 'Đã lưu địa chỉ.')} />
      <Button className="justify-self-start" variant="outline" onClick={() => setEditing(null)}>Bỏ qua</Button>
    </section>}
    {!editing && <DataState resource={addresses}>{(rows) => rows.length ? <div className="customer-address-grid">{[...rows].sort((a, b) => Number(b.defaultAddress) - Number(a.defaultAddress)).map((address) => {
      const path = addressPath + '/' + encodeURIComponent(address.id)
      return <section className="page-box customer-address" key={address.id} data-default={address.defaultAddress || undefined}>
        <div className="customer-card-top"><PanelTitle title={address.label} icon={MapPin} />
          {address.defaultAddress && <span className="customer-badge">Mặc định</span>}</div>
        <strong>{address.receiverName}</strong><p>{address.receiverPhone}</p>
        <p>{[address.streetAddress, address.ward, address.district, address.province].filter(Boolean).join(', ')}</p>
        <div className="page-actions">
          <Button variant="outline" onClick={() => setEditing(address)}><Pencil size={15} />Sửa</Button>
          {!address.defaultAddress && <Button variant="outline" disabled={action.busy}
            onClick={() => mutate(path + '/default', 'PUT', undefined, 'Đã đặt địa chỉ mặc định.')}>Đặt mặc định</Button>}
          <Button variant="ghost" disabled={action.busy} onClick={() => {
            if (window.confirm('Xóa địa chỉ này?')) mutate(path, 'DELETE', undefined, 'Đã xóa địa chỉ.')
          }}><Trash2 size={15} />Xóa</Button>
        </div>
      </section>
    })}</div> : <CustomerEmpty icon={MapPin} title="Bạn chưa có địa chỉ giao hàng">
      <Button onClick={() => setEditing({})}>Thêm địa chỉ đầu tiên</Button>
    </CustomerEmpty>}</DataState>}
  </>
}

export function LoyaltyPage({ request }) {
  const [section, setSection] = useState('points')
  const [voucherPage, setVoucherPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const balance = useResource(request, me + '/points')
  const vouchers = useResource(request, section === 'vouchers' ? me + '/vouchers?page=' + voucherPage : null)
  const history = useResource(request, section === 'history' ? me + '/points/transactions?page=' + historyPage : null)
  const action = useAction()
  const key = useRef(null)
  return <>
    <CustomerTitle title="Điểm và voucher" description="Theo dõi điểm thưởng và ưu đãi của bạn." />
    <CustomerSections label="Điểm thưởng và ưu đãi" items={ [['points', 'Điểm thưởng'], ['vouchers', 'Voucher cá nhân'], ['history', 'Lịch sử điểm']] }
      active={section} onChange={setSection} />
    <ActionMessage action={action} />
    {section === 'points' && <section className="page-box customer-points"><DataState resource={balance}>{(data) => <>
      <PanelTitle title="Điểm khả dụng" icon={Gift} />
      <strong className="customer-points-value">{Number(data.points).toLocaleString('vi-VN')} <small>điểm</small></strong>
      <p>{data.offer.pointsRequired} điểm đổi voucher {price(data.offer.voucherValue)} cho đơn từ {price(data.offer.minimumOrderValue)}.</p>
      <Button className="justify-self-start" disabled={action.busy || data.points < data.offer.pointsRequired} onClick={() => action.run(async () => {
        key.current ??= crypto.randomUUID()
        const voucher = await request(me + '/vouchers/redeem', { method: 'POST', headers: { 'Idempotency-Key': key.current } })
        key.current = null
        balance.reload(); vouchers.reload(); history.reload(); setVoucherPage(1); setSection('vouchers')
        return voucher
      }, 'Đã đổi điểm lấy voucher.')}>Đổi voucher</Button>
    </>}</DataState></section>}
    {section === 'vouchers' && <section className="page-box"><PanelTitle title="Voucher cá nhân" icon={Ticket} /><DataState resource={vouchers}>{(data) => <>
      {data.items.length ? <div className="customer-vouchers">{data.items.map((row) => <article className="customer-voucher" key={row.id || row.code}>
        <div className="customer-card-top"><strong>{row.code}</strong><span className="customer-badge" data-status={row.status}>{statusLabel(row.status)}</span></div>
        <p>{row.discountValue == null ? 'Ưu đãi' : row.discountType === 'PERCENTAGE' ? 'Giảm ' + row.discountValue + '%' : 'Giảm ' + price(row.discountValue)}</p>
        {row.expiresAt && <small>Hạn dùng {dateTime(row.expiresAt)}</small>}
      </article>)}</div> : <CustomerEmpty icon={Ticket} title="Bạn chưa có voucher" />}
      <Pager pagination={data.pagination} setPage={setVoucherPage} />
    </>}</DataState></section>}
    {section === 'history' && <section className="page-box"><PanelTitle title="Lịch sử điểm" icon={WalletCards} /><DataState resource={history}>{(data) => <>
      <Grid items={data.items} columns={[column('Thời gian', (row) => dateTime(row.occurredAt)), column('Nội dung', 'reason'),
        column('Thay đổi', (row) => (row.pointsDelta > 0 ? '+' : '') + row.pointsDelta), column('Số dư', 'balanceAfter')]} />
      <Pager pagination={data.pagination} setPage={setHistoryPage} />
    </>}</DataState></section>}
  </>
}
