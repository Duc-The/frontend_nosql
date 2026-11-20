import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Pagination from '@mui/material/Pagination'
import Skeleton from '@mui/material/Skeleton'
export { useResource } from '@/hooks/use-resource'
export { Form } from '@/components/forms/Form'
import { Button } from '@/components/ui/button'
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
  if (!resource.loaded) return <div className="data-skeleton" role="status" aria-label="Đang tải dữ liệu">
    <span className="sr-only">Đang tải dữ liệu…</span>
    {[0, 1, 2].map((line) => <Skeleton key={line} variant="rounded" height={52} animation="wave" />)}
  </div>
  return children(resource.data)
}

export function useAction() {
  const [notice, setNotice] = useState('')
  const mutation = useMutation({ mutationFn: (work) => work() })
  async function run(work, success = '') {
    setNotice('')
    try {
      const result = await mutation.mutateAsync(work)
      setNotice(success)
      return result
    } catch {
      return undefined
    }
  }
  return { busy: mutation.isPending, error: mutation.error?.message || '', notice, run }
}

export function ActionMessage({ action }) {
  return action.error ? <Message error>{action.error}</Message> : action.notice ? <Message>{action.notice}</Message> : null
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
    <Pagination count={pagination.totalPages} page={pagination.page} color="primary" shape="rounded"
      onChange={(_, page) => setPage(page)}
      getItemAriaLabel={(type, page) => ({
        page: 'Trang ' + page, first: 'Trang đầu', last: 'Trang cuối',
        previous: 'Trang trước', next: 'Trang sau',
      })[type] || 'Chuyển trang'} />
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
