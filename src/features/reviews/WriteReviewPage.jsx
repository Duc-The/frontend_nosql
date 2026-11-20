import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Camera, CheckCircle2, Film, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, useAction, useResource } from '@/components/page-kit'
import { CustomerTitle } from '@/features/account/customer-ui'
import './reviews.css'

const mb = 1024 * 1024
const photoTypes = ['image/jpeg', 'image/png', 'image/webp']
const videoTypes = ['video/mp4', 'video/webm']

export function WriteReviewPage({ request, orderCode, productId }) {
  const path = '/orders/' + encodeURIComponent(orderCode) + '/reviews/' + encodeURIComponent(productId)
  const info = useResource(request, path)
  return <>
    <CustomerTitle title="Viết đánh giá"><Link className="customer-text-link" to={'/don-hang/' + encodeURIComponent(orderCode)}>
      <ArrowLeft size={17} aria-hidden="true" /> Về đơn hàng</Link></CustomerTitle>
    <DataState resource={info}>{(data) => <ReviewForm request={request} path={path} orderCode={orderCode} info={data} />}</DataState>
  </>
}

function ReviewForm({ request, path, orderCode, info }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState([])
  const [video, setVideo] = useState(null)
  const [fileError, setFileError] = useState('')
  const [sent, setSent] = useState(false)
  const action = useAction()

  function select(event, isVideo) {
    const files = [...event.target.files]
    event.target.value = ''
    if (!files.length) return
    const allowed = isVideo ? videoTypes : photoTypes
    const limit = isVideo ? 25 : 5
    if (files.some((file) => !allowed.includes(file.type) || file.size === 0 || file.size > limit * mb)) {
      setFileError(isVideo ? 'Chọn video MP4 hoặc WebM tối đa 25 MB.' : 'Chọn ảnh JPEG, PNG hoặc WebP tối đa 5 MB mỗi ảnh.')
      return
    }
    if (!isVideo && photos.length + files.length > 4) {
      setFileError('Bạn có thể gửi tối đa 4 ảnh.')
      return
    }
    setFileError('')
    if (isVideo) setVideo(files[0])
    else setPhotos((current) => [...current, ...files])
  }

  if (sent || info.alreadyReviewed) return <section className="page-box review-success">
    <CheckCircle2 size={34} aria-hidden="true" /><h2>{sent ? 'Đã gửi đánh giá' : 'Bạn đã đánh giá sản phẩm này'}</h2>
    <p>{info.productName}</p>
    <Button asChild><Link to={info.productSlug ? '/san-pham/' + encodeURIComponent(info.productSlug) + '#danh-gia'
      : '/don-hang/' + encodeURIComponent(orderCode)}>{info.productSlug ? 'Xem đánh giá' : 'Về đơn hàng'}</Link></Button>
  </section>

  return <form className="page-box review-editor" onSubmit={(event) => {
    event.preventDefault()
    if (!rating || action.busy) return
    action.run(async () => {
      const body = new FormData()
      body.set('review', new Blob([JSON.stringify({ rating, comment: comment.trim() })], { type: 'application/json' }))
      for (const file of photos) body.append('photos', file)
      if (video) body.set('video', video)
      await request(path, { method: 'POST', body })
      setSent(true)
    })
  }}>
    <div className="review-editor-product"><span>Sản phẩm đã mua</span><h2>{info.productName}</h2></div>
    <fieldset disabled={action.busy}>
      <legend>Mức độ hài lòng</legend>
      <div className="review-rating-picker">{[1, 2, 3, 4, 5].map((value) => <label key={value} title={value + ' sao'}>
        <input className="sr-only" type="radio" name="rating" value={value} aria-label={value + ' sao'} checked={rating === value}
          onChange={() => setRating(value)} required />
        <Star size={26} data-filled={value <= rating || undefined} aria-hidden="true" />
      </label>)}<span>{rating ? rating + '/5 sao' : 'Chọn số sao'}</span></div>
    </fieldset>
    <label className="review-comment-input">Nhận xét của bạn <small>Không bắt buộc</small>
      <textarea maxLength={1000} rows={4} value={comment} disabled={action.busy} onChange={(event) => setComment(event.target.value)}
        placeholder="Bạn thấy sản phẩm thế nào?" /><small>{comment.length}/1000</small>
    </label>
    <div className="review-upload">
      <div><h3>Ảnh và video</h3><p>Tối đa 4 ảnh, 5 MB mỗi ảnh, và 1 video, tối đa 25 MB. Tệp đính kèm sẽ hiển thị công khai cùng đánh giá.</p></div>
      <div className="page-actions">
        <label className="review-upload-button"><Camera size={18} aria-hidden="true" /> Thêm ảnh
          <input type="file" className="sr-only" accept={photoTypes.join(',')} multiple onChange={(event) => select(event, false)}
            disabled={photos.length === 4 || action.busy} /></label>
        <label className="review-upload-button"><Film size={18} aria-hidden="true" /> {video ? 'Đổi video' : 'Thêm video'}
          <input type="file" className="sr-only" accept={videoTypes.join(',')} onChange={(event) => select(event, true)} disabled={action.busy} /></label>
      </div>
      {fileError && <p className="page-error" role="alert">{fileError}</p>}
      {(photos.length > 0 || video) && <div className="review-gallery">
        {photos.map((file, index) => <Preview key={file.name + index} file={file} disabled={action.busy}
          remove={() => { setPhotos((items) => items.filter((_, position) => position !== index)); setFileError('') }} />)}
        {video && <Preview file={video} video disabled={action.busy} remove={() => { setVideo(null); setFileError('') }} />}
      </div>}
    </div>
    <ActionMessage action={action} />
    <Button type="submit" disabled={!rating || action.busy}>{action.busy ? 'Đang gửi đánh giá…' : 'Gửi đánh giá'}</Button>
  </form>
}

function Preview({ file, video, remove, disabled }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <div className="review-preview">
    {src && (video ? <video src={src} controls preload="metadata" playsInline aria-label={file.name} /> : <img src={src} alt={file.name} />)}
    <button type="button" onClick={remove} disabled={disabled} aria-label={'Bỏ ' + file.name}><X size={15} aria-hidden="true" /></button>
  </div>
}
