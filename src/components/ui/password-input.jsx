import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function PasswordInput({ label, id, className = '', ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return <div className="grid min-w-0 gap-1.5">
    {label && <label htmlFor={inputId}>{label}</label>}
    <div className="relative">
      <Input {...props} id={inputId} type={visible ? 'text' : 'password'} spellCheck={false}
        className={`pr-12 [&::-ms-reveal]:hidden ${className}`} />
      <button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-controls={inputId}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
        onClick={() => setVisible((value) => !value)}>
        <Icon size={18} aria-hidden="true" />
      </button>
    </div>
  </div>
}
