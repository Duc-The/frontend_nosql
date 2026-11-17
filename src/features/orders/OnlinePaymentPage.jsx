import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { PaymentCard, PaymentOutcome } from './payment-ui'

export function OnlinePaymentPage({ request, code }) {
  const [result, setResult] = useState(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const path = '/orders/' + encodeURIComponent(code) + '/payment'
    let timer

    async function read(initial) {
      try {
        let payment = await request(path, { signal: controller.signal })
        if (controller.signal.aborted) return
        const payable = payment.status === 'PENDING' && payment.method !== 'COD'
          && (!payment.expiresAt || Date.parse(payment.expiresAt) > Date.now())
        if (initial && payable && !payment.paymentUrl && !payment.qrPayload) {
          payment = await request(path, { method: 'POST', signal: controller.signal })
        }
        if (controller.signal.aborted) return
        if (payable && payment.status === 'PENDING' && payment.method === 'VNPAY') {
          const url = payment.paymentUrl
          if (!url || !/^https:\/\//i.test(url)) throw new Error('Chưa mở được cổng VNPAY.')
          location.replace(url)
          return
        }
        setResult({ payment })
        if (payment.status === 'PENDING' && payment.method === 'VIETQR'
            && (!payment.expiresAt || Date.parse(payment.expiresAt) > Date.now())) {
          timer = setTimeout(() => read(false), 3000)
        }
      } catch (error) {
        if (!controller.signal.aborted) setResult((previous) => ({ ...previous, error: error.message }))
      }
    }

    read(true)
    return () => { clearTimeout(timer); controller.abort() }
  }, [code, request, revision])

  function retry() {
    setResult(null)
    setRevision((value) => value + 1)
  }

  const payment = result?.payment
  if (result?.error) return <PaymentCard title="Chưa tải được thông tin thanh toán" code={code} payment={payment}>
    <p role="alert">{result.error}</p><Button onClick={retry}>Thử lại</Button>
  </PaymentCard>
  if (!payment) return <PaymentCard title="Đang chuẩn bị thanh toán" code={code} />
  if (payment.status !== 'PENDING' || payment.method !== 'VIETQR'
      || (payment.expiresAt && Date.parse(payment.expiresAt) <= Date.now())) {
    return <PaymentOutcome code={code} payment={payment} />
  }

  return <PaymentCard title="Quét mã VietQR" tone="qr" code={code} payment={payment}>
    {payment.qrPayload ? <PaymentQr value={payment.qrPayload} /> : payment.paymentUrl && /^https:\/\//i.test(payment.paymentUrl)
      ? <Button asChild><a href={payment.paymentUrl}>Mở mã VietQR trên payOS</a></Button>
      : <p role="alert">Mã QR chưa khả dụng.</p>}
    <p role="status">Kết quả sẽ tự cập nhật sau khi chuyển khoản.</p>
  </PaymentCard>
}

function PaymentQr({ value }) {
  const [image, setImage] = useState(null)
  useEffect(() => {
    let active = true
    QRCode.toDataURL(value, { width: 256, margin: 4, errorCorrectionLevel: 'M' })
      .then((src) => { if (active) setImage({ value, src }) })
      .catch(() => { if (active) setImage({ value }) })
    return () => { active = false }
  }, [value])

  if (image?.value === value && !image.src) return <p role="alert">Không hiển thị được mã VietQR.</p>
  if (image?.value !== value) return <p role="status">Đang tạo ảnh QR…</p>
  return <div className="payment-qr">
    <img src={image.src} width="256" height="256" alt="Mã VietQR của đơn hàng" />
    <p>Mở ứng dụng ngân hàng và quét mã.</p>
    <a href={image.src} download="VietQR.png">Lưu mã QR</a>
  </div>
}
