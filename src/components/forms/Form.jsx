import { useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { fieldSchema, formValues, serializeFields } from './field-schema'

export function Form({ fields, values = {}, submit, label = 'Lưu thay đổi', busy = false }) {
  const id = useId()
  const element = useRef(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(fieldSchema(fields)),
    values: formValues(fields, values),
    resetOptions: { keepDirtyValues: true },
    mode: 'onTouched',
  })
  const pending = busy || isSubmitting
  const onSubmit = handleSubmit(async (data) => {
    await submit(serializeFields(fields, data), new FormData(element.current))
  })

  return <form ref={element} className="entry-form" noValidate onSubmit={onSubmit} aria-busy={pending}>
    {fields.map(({ name, label: title, options, type, required = false, ...attributes }) => {
      const inputId = id + '-' + name
      const errorId = inputId + '-error'
      const error = errors[name]?.message
      const props = {
        ...attributes, ...register(name), id: inputId, required,
        'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined,
      }
      return <div key={name} className="form-field">
        <label htmlFor={inputId} className={type === 'checkbox' ? 'check-field' : undefined}>
          {type === 'checkbox' && <input type="checkbox" {...props} />}
          {title}{required && <span className="field-required" aria-hidden="true"> *</span>}
        </label>
        {type === 'password' ? <PasswordInput {...props} /> : options ? <select {...props}>
          <option value="">Chọn {title.toLowerCase()}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : type === 'textarea' ? <textarea {...props} />
          : type !== 'checkbox' && <Input type={type || 'text'} {...props} />}
        {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
      </div>
    })}
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {pending ? 'Đang xử lý…' : label}
    </Button>
  </form>
}
