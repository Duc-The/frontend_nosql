import test from 'node:test'
import assert from 'node:assert/strict'
import { postLoginPath } from '../src/lib/route-access.js'

const session = (role) => ({ roles: [role] })

test('admin returns to operations when next points at a customer address page', () => {
  assert.equal(postLoginPath(session('ADMIN'), '/tai-khoan/dia-chi'), '/van-hanh')
})

test('customers retain their next page and payment return query', () => {
  assert.equal(postLoginPath(session('CUSTOMER'), '/tai-khoan/dia-chi'), '/tai-khoan/dia-chi')
  assert.equal(postLoginPath(session('CUSTOMER'), '/payment/result?merchantOrderCode=123'), '/payment/result?merchantOrderCode=123')
})

test('staff retain only operation pages permitted for their role', () => {
  assert.equal(postLoginPath(session('WAREHOUSE_STAFF'), '/van-hanh/ton-kho/lot-1'), '/van-hanh/ton-kho/lot-1')
  assert.equal(postLoginPath(session('SALES_STAFF'), '/van-hanh/don-hang/HD01'), '/van-hanh/don-hang/HD01')
  assert.equal(postLoginPath(session('SALES_STAFF'), '/van-hanh/nhan-vien'), '/van-hanh')
  assert.equal(postLoginPath(session('WAREHOUSE_STAFF'), '/van-hanh/don-hang'), '/van-hanh')
  assert.equal(postLoginPath(session('CUSTOMER'), '/van-hanh/nhan-vien'), '/')
})

test('missing, unknown and external targets use the role landing page', () => {
  for (const target of [undefined, '', '/unknown', '//example.com', 'https://example.com', '/\\example.com', '/van-hanh/unknown']) {
    assert.equal(postLoginPath(session('ADMIN'), target), '/van-hanh')
  }
  assert.equal(postLoginPath(session('CUSTOMER')), '/')
  assert.equal(postLoginPath(session('ADMIN')), '/van-hanh')
  assert.equal(postLoginPath(session('CUSTOMER'), '/san-pham?q=rau'), '/san-pham?q=rau')
})
