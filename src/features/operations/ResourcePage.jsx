import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, Grid, PageTitle, Pager, column, field, useAction, useResource } from '@/components/page-kit'

export function ResourcePage({ request, path, title, columns, fields, defaults, editFields, prepare, actions, extra, searchable = false }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [editSection, setEditSection] = useState('details')
  const action = useAction()
  const rows = useResource(request, path + (path.includes('?') ? '&' : '?') + new URLSearchParams({ page, ...(search ? { q: search } : {}) }))
  const detailPath = editing?.id ? path.split('?')[0] + '/' + encodeURIComponent(editing.id) : null
  const detail = useResource(request, detailPath)

  function openEditor(row) {
    setEditSection('details')
    setEditing(row)
  }

  function save(values) {
    return action.run(async () => {
      await request(detailPath || path.split('?')[0], {
        method: detailPath ? 'PUT' : 'POST',
        body: prepare ? prepare(values, editing) : values,
      })
      setEditing(null)
      rows.reload()
    }, 'Đã lưu thay đổi.')
  }
  function mutate(suffix, body, method = 'PUT') {
    return action.run(async () => {
      const result = await request(detailPath + suffix, { method, body })
      detail.reload()
      rows.reload()
      return result
    }, 'Đã lưu thay đổi.')
  }

  return <>
    <PageTitle title={title}>{fields && !editing && <Button onClick={() => openEditor(defaults || {})}>Thêm mới</Button>}</PageTitle>
    {!editing && searchable && <Form fields={[field('q', 'Tìm kiếm')]} values={{ q: search }} label="Tìm" submit={({ q }) => { setSearch(q || ''); setPage(1) }} />}
    <ActionMessage action={action} />
    {editing && fields && <section className="page-box" key={editing.id || 'new'}>
      <div className="page-actions"><h2>{editing.id ? 'Chỉnh sửa' : 'Thêm mới'}</h2>
        <Button variant="outline" onClick={() => setEditing(null)}>Đóng</Button></div>
      {detailPath && actions && <div className="customer-sections" role="group" aria-label="Nội dung chỉnh sửa">
        <button type="button" aria-pressed={editSection === 'details'} onClick={() => setEditSection('details')}>Thông tin</button>
        <button type="button" aria-pressed={editSection === 'actions'} onClick={() => setEditSection('actions')}>Thiết lập</button>
      </div>}
      {detailPath ? <DataState resource={detail}>{(row) => editSection === 'actions' ? actions(row, mutate, action.busy) : <>
        <Form fields={editFields || fields} values={row} busy={action.busy} submit={save} />
        {extra?.(row)}
      </>}</DataState> : <Form fields={fields} values={editing} busy={action.busy} submit={save} />}

    </section>}
    {!editing && <section className="page-box"><DataState resource={rows}>{(data) => <>
      <Grid items={data.items} columns={fields ? [...columns,
        column('Thao tác', (row) => <Button variant="outline" size="sm" onClick={() => openEditor(row)}>Sửa</Button>)] : columns} />
      <Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState></section>}
  </>
}
