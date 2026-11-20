import { useNavigate } from 'react-router-dom'

export function SearchForm({ action, children, ...props }) {
  const navigate = useNavigate()
  return <form {...props} action={action} onSubmit={(event) => {
    event.preventDefault()
    const params = new URLSearchParams(new FormData(event.currentTarget))
    for (const [name, value] of [...params]) if (!value) params.delete(name)
    navigate(action + (params.size ? '?' + params.toString() : ''))
  }}>{children}</form>
}
