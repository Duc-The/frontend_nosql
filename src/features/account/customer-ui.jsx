import { PageTitle } from '@/components/page-kit'

export function CustomerTitle({ title, description, children }) {
  return <div className="customer-title">
    <PageTitle title={title}>{children}</PageTitle>
    {description && <p>{description}</p>}
  </div>
}

export function PanelTitle({ title, icon, children }) {
  const Icon = icon
  return <div className="customer-panel-heading">
    <span className="customer-icon"><Icon size={19} aria-hidden="true" /></span>
    <div><h2>{title}</h2>{children}</div>
  </div>
}

export function CustomerEmpty({ icon, title, children }) {
  const Icon = icon
  return <div className="customer-empty">
    <span className="customer-icon"><Icon size={24} aria-hidden="true" /></span>
    <h2>{title}</h2>{children}
  </div>
}

export function CustomerSections({ label, items, active, onChange }) {
  return <div className="customer-sections" role="group" aria-label={label}>
    {items.map(([id, name]) => <button key={id} type="button" aria-pressed={active === id}
      onClick={() => onChange(id)}>{name}</button>)}
  </div>
}
