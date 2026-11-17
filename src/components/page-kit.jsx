import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function PageTitle({ title, children }) {
  return <header className="page-heading"><div><h1>{title}</h1></div>{children}</header>
}

export function Message({ error, children }) {
  return <p role={error ? 'alert' : 'status'} className={error ? 'page-error' : 'page-message'}>{children}</p>
}

export function DataState({ resource, children }) {
  if (resource.error) return <div className="grid gap-3"><Message error>{resource.error}</Message>
    <Button type="button" variant="outline" onClick={resource.reload} className="justify-self-start">Thử lại</Button></div>
  if (!resource.loaded) return <Message>Đang tải dữ liệu…</Message>
  return children(resource.data)
}

export function useResource(request, path) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    request(path, { signal: controller.signal }).then(
      (data) => { if (!controller.signal.aborted) setResult({ path, revision, data }) },
      (error) => { if (!controller.signal.aborted) setResult({ path, revision, error: error.message }) },
    )
    return () => controller.abort()
  }, [request, path, revision])
  const current = result?.path === path && result?.revision === revision ? result : null
  return { ...current, loaded: Boolean(current), reload: () => setRevision((value) => value + 1) }
}

export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function run(work, success = '') {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await work()
      setNotice(success)
      return result
    } catch (failure) {
      setError(failure.message)
      return undefined
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, notice, run }
}

export function ActionMessage({ action }) {
  return action.error ? <Message error>{action.error}</Message> : action.notice ? <Message>{action.notice}</Message> : null
}

export function Form({ fields, values = {}, submit, label = 'Lưu thay đổi', busy = false }) {
  return <form className="entry-form" onSubmit={(event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    submit(Object.fromEntries(fields.map((field) => {
      const raw = form.get(field.name)
      let value = raw === '' ? null : raw
      if (field.type === 'checkbox') value = raw === 'on'
      if (field.type === 'number' && value !== null) value = Number(value)
      if (field.type === 'datetime-local' && value !== null) value = new Date(value).toISOString()
      return [field.name, value]
    })), form)
  }}>
    {fields.map(({ name, label: title, options, type, required = false, ...attributes }) => {
      const value = values[name] ?? ''
      if (type === 'password') return <PasswordInput key={name} name={name} label={title}
        required={required} defaultValue={value} {...attributes} />
      return <label key={name} className={type === 'checkbox' ? 'check-field' : undefined}>
        {type !== 'checkbox' && title}
        {options ? <select name={name} required={required} defaultValue={value}>
          <option value="">Chọn {title.toLowerCase()}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : type === 'textarea' ? <textarea name={name} required={required} defaultValue={value} {...attributes} />
          : type === 'checkbox' ? <><input name={name} type="checkbox" defaultChecked={Boolean(value)} /> {title}</>
            : <Input name={name} type={type || 'text'} required={required} {...(type === 'file' ? {} : { defaultValue: value })} {...attributes} />}
      </label>
    })}
    <Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : label}</Button>
  </form>
}

export function Grid({ columns, items, rowKey = (row) => row.id }) {
  if (!items?.length) return <Message>Chưa có dữ liệu.</Message>
  return <Table><TableHeader><TableRow>{columns.map(({ label }) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{items.map((row) => <TableRow key={rowKey(row)}>{columns.map(({ label, cell }) =>
      <TableCell key={label}>{cell(row) ?? '—'}</TableCell>)}</TableRow>)}</TableBody>
  </Table>
}

export function Pager({ pagination, setPage }) {
  if (!pagination || pagination.totalPages <= 1) return null
  return <nav aria-label="Phân trang" className="page-pager">
    <Button variant="outline" disabled={!pagination.hasPrevious} onClick={() => setPage(pagination.page - 1)}>Trang trước</Button>
    <span>{pagination.page} / {pagination.totalPages}</span>
    <Button variant="outline" disabled={!pagination.hasNext} onClick={() => setPage(pagination.page + 1)}>Trang sau</Button>
  </nav>
}

export function field(name, label, options = {}) {
  return { name, label, ...options }
}

export function column(label, key) {
  return { label, cell: typeof key === 'function' ? key : (row) => row[key] }
}

export function choices(values) {
  return Object.entries(values).map(([value, label]) => ({ value, label }))
}
