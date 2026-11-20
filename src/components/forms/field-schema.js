import { z } from 'zod'

function validateField(field, value, context) {
  const empty = value == null || value === '' || (typeof value === 'string' && !value.trim())
  const fail = (message) => context.addIssue({ code: 'custom', message })
  if (field.type === 'file') {
    if (field.required && !value?.length) fail('Vui lòng chọn ' + field.label.toLowerCase() + '.')
    return
  }
  if (empty) {
    if (field.required) fail('Vui lòng nhập ' + field.label.toLowerCase() + '.')
    return
  }
  if (field.type === 'checkbox') return
  const text = String(value)
  if (field.minLength && text.length < field.minLength) fail('Cần ít nhất ' + field.minLength + ' ký tự.')
  if (field.maxLength && text.length > field.maxLength) fail('Tối đa ' + field.maxLength + ' ký tự.')
  if (field.type === 'email' && !z.email().safeParse(text).success) fail('Vui lòng nhập email hợp lệ.')
  if (field.type === 'url' && !z.url().safeParse(text).success) fail('Vui lòng nhập URL hợp lệ.')
  if (['date', 'datetime-local'].includes(field.type) && Number.isNaN(new Date(text).getTime())) fail('Vui lòng nhập ngày giờ hợp lệ.')
  if (field.pattern && !new RegExp('^(?:' + field.pattern + ')$').test(text)) {
    fail(field.type === 'tel' ? 'Nhập 9–15 chữ số, có thể bắt đầu bằng +.' : 'Dữ liệu chưa đúng định dạng yêu cầu.')
  }
  if (field.type === 'password' && new TextEncoder().encode(text).length > 72) fail('Mật khẩu tối đa 72 byte UTF-8.')
  if (field.type === 'number') {
    const number = Number(value)
    if (!Number.isFinite(number)) fail('Vui lòng nhập số hợp lệ.')
    if (field.min !== undefined && number < Number(field.min)) fail('Giá trị tối thiểu là ' + field.min + '.')
    if (field.max !== undefined && number > Number(field.max)) fail('Giá trị tối đa là ' + field.max + '.')
    if (field.step !== 'any' && Number.isFinite(number)) {
      const step = Number(field.step ?? 1)
      const units = (number - Number(field.min ?? 0)) / step
      if (step > 0 && Math.abs(units - Math.round(units)) > 1e-7) fail('Giá trị phải theo bước ' + step + '.')
    }
  }
  if (field.options && !field.options.some((option) => String(option.value) === text)) fail('Vui lòng chọn một giá trị trong danh sách.')
  if (field.type === 'date' && ['dateOfBirth', 'hiredOn'].includes(field.name)) {
    const today = new Date()
    const localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-')
    if (text > localToday) fail('Ngày không được ở tương lai.')
  }
}

export function fieldSchema(fields) {
  return z.object(Object.fromEntries(fields.map((field) => [
    field.name, z.any().superRefine((value, context) => validateField(field, value, context)),
  ])))
}

export function formValues(fields, values) {
  return Object.fromEntries(fields.filter((field) => field.type !== 'file')
    .map((field) => [field.name, values[field.name] ?? (field.type === 'checkbox' ? false : '')]))
}

export function serializeFields(fields, data) {
  return Object.fromEntries(fields.map((field) => {
    const raw = data[field.name]
    let value = raw === '' || raw === undefined ? null : raw
    if (field.type === 'file') value = raw?.[0] || null
    if (field.type === 'checkbox') value = Boolean(raw)
    if (field.type === 'number' && value !== null) value = Number(value)
    if (field.type === 'datetime-local' && value !== null) value = new Date(value).toISOString()
    return [field.name, value]
  }))
}
