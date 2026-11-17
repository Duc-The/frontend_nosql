import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
let sdk

function loadSdk() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  sdk ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else reject(new Error('Không tải được đăng nhập Google.'))
    }
    script.onerror = () => {
      script.remove()
      reject(new Error('Không tải được đăng nhập Google.'))
    }
    document.head.append(script)
  }).catch((error) => { sdk = undefined; throw error })
  return sdk
}

export function GoogleSignIn({ onSignIn }) {
  const container = useRef(null)
  const callback = useRef(onSignIn)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [sdkFailed, setSdkFailed] = useState(false)
  useEffect(() => { callback.current = onSignIn }, [onSignIn])
  useEffect(() => {
    if (!clientId) return
    let active = true
    loadSdk().then((google) => {
      if (!active) return
      google.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!active || !credential) return
          setMessage('')
          setPending(true)
          try {
            const session = await api('/auth/google', { method: 'POST', body: { idToken: credential } })
            if (active) callback.current(session)
          } catch (error) {
            if (active) setMessage(error.message)
          } finally {
            if (active) setPending(false)
          }
        },
      })
      container.current.replaceChildren()
      google.renderButton(container.current, { theme: 'outline', size: 'large', locale: 'vi' })
    }).catch((error) => {
      if (active) { setSdkFailed(true); setMessage(error.message) }
    })
    return () => { active = false }
  }, [attempt])

  return <div className="grid justify-items-center gap-3">
    <div className="flex w-full items-center gap-3 text-sm text-muted-foreground">
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      Hoặc tiếp tục với Google
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
    <div ref={container} />
    {!clientId && <p className="text-sm text-muted-foreground">Đăng nhập Google chưa được cấu hình.</p>}
    {pending && <p role="status">Đang xác thực với Google…</p>}
    {message && <p role="alert" className="page-error">{message}</p>}
    {sdkFailed && <button type="button" className="page-link" onClick={() => {
      setSdkFailed(false); setMessage(''); setAttempt((value) => value + 1)
    }}>Tải lại nút Google</button>}
  </div>
}
