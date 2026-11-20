import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PaymentCard, PaymentOutcome } from './payment-ui'

function vnpayFields() {
  const fields = new URLSearchParams(location.search)
  const entries = [...fields].filter(([key]) => key.startsWith('vnp_'))
  if (!fields.has('vnp_SecureHash') || new Set(entries.map(([key]) => key)).size !== entries.length) return null
  return Object.fromEntries(entries)
}

export function PaymentResultPage({ request, code, cancelled }) {
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!code) return
    const controller = new AbortController()
    const path = '/orders/' + encodeURIComponent(code) + '/payment'
    let timer
    let reported

    async function read(attempt) {
      try {
        const payment = await request(path, { signal: controller.signal })
        if (controller.signal.aborted) return
        const fields = attempt === 1 && payment.method === 'VNPAY' && payment.status === 'PENDING' ? vnpayFields() : null
        if (fields) {
          try {
            reported = (await request(path + '/vnpay-result', {
              method: 'POST', body: fields, signal: controller.signal,
            })).status
          } catch (error) {
            if (controller.signal.aborted) return
            if (error.status === 401) throw error
          }
        }
        if (controller.signal.aborted) return
        setResult({ payment, reported })
        if (!cancelled && payment.status === 'PENDING' && reported !== 'FAILED' && attempt < 15) {
          timer = setTimeout(() => read(attempt + 1), 3000)
        }
      } catch (error) {
        if (!controller.signal.aborted) setResult((previous) => previous?.payment ? previous : { error: error.message })
      }
    }

    read(1)
    return () => { clearTimeout(timer); controller.abort() }
  }, [request, code, cancelled])

  if (!code || result?.error) return <PaymentCard title="Chưa xem được kết quả" code={code}>
    {result?.error && <p role="alert">{result.error}</p>}
    <Button asChild><Link to="/don-hang">Xem đơn hàng</Link></Button>
  </PaymentCard>
  if (!result) return <PaymentCard title="Đang kiểm tra giao dịch" code={code} />
  return <PaymentOutcome code={code} payment={result.payment} reported={result.reported} cancelled={cancelled} />
}
