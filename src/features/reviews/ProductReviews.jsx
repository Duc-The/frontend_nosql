import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, MessageSquare, Star } from 'lucide-react'
import { useRequest } from '@/hooks/use-request'
import { useResource } from '@/hooks/use-resource'
import { useSession } from '@/features/account/use-session'
import { Button } from '@/components/ui/button'
import { Message, Pager } from '@/components/page-kit'
import { dateTime } from '@/lib/format'
import './reviews.css'

const formatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function Stars({ rating }) {
  return <span className="review-stars" role="img" aria-label={`${formatter.format(rating)} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={17} data-filled={value <= Math.round(rating) || undefined} aria-hidden="true" />)}
  </span>
}

export function ProductReviews({ slug }) {
  const [page, setPage] = useState(1)
  const section = useRef(null)
  useEffect(() => {
    if (location.hash === '#danh-gia') section.current?.scrollIntoView()
  }, [])
  const feed = useRequest('/catalog/products/' + encodeURIComponent(slug) + '/reviews?page=' + page)
  return <section ref={section} className="product-reviews" id="danh-gia" aria-labelledby="product-review-title">
    <div className="review-heading"><div><h2 id="product-review-title">Đánh giá từ khách hàng</h2>
      <p>Đánh giá từ khách có đơn hàng đã hoàn tất.</p></div>
      <ReviewEntry slug={slug} /></div>
    {feed.loading && <Message>Đang tải đánh giá…</Message>}
    {feed.error && <div className="page-error" role="alert">{feed.error.message} <button type="button" className="page-link" onClick={feed.retry}>Thử lại</button></div>}
    {feed.data && <ReviewFeed data={feed.data} setPage={setPage} />}
  </section>
}

function ReviewEntry({ slug }) {
  const { session, request } = useSession()
  const customer = session?.roles?.includes('CUSTOMER')
  const access = useResource(request, customer ? '/orders/review-eligibility/' + encodeURIComponent(slug) : null)
  if (!session) return <Link className="page-link" to={'/dang-nhap?next=' + encodeURIComponent('/san-pham/' + slug + '#danh-gia')}>
    Đăng nhập để đánh giá</Link>
  if (!customer) return <p className="review-entry-note">Đăng nhập bằng tài khoản khách đã mua để viết đánh giá.</p>
  if (access.error) return <div className="review-entry-note" role="alert">{access.error} <button className="page-link" onClick={access.reload}>Thử lại</button></div>
  if (!access.loaded) return <p role="status" className="review-entry-note">Đang kiểm tra đơn đã mua…</p>
  if (access.data.alreadyReviewed) return <p className="review-entry-note">Bạn đã đánh giá sản phẩm này.</p>
  if (!access.data.canReview) return <p className="review-entry-note">Bạn có thể đánh giá sau khi đơn mua sản phẩm này hoàn tất và đã thanh toán.</p>
  return <Button asChild><Link to={'/don-hang/' + encodeURIComponent(access.data.orderCode) + '/danh-gia/' + encodeURIComponent(access.data.productId)}>
    Viết đánh giá</Link></Button>
}

function ReviewFeed({ data, setPage }) {
  return data.total ? <>
      <div className="review-summary">
        <div><strong>{formatter.format(data.average)}<small> / 5</small></strong><Stars rating={data.average} />
          <p>{data.total} đánh giá</p></div>
        <ul>{[...data.distribution].reverse().map(({ rating, count }) => <li key={rating}>
          <span>{rating} sao</span><span className="review-track" aria-hidden="true"><span style={{ width: (count / data.total * 100) + '%' }} /></span>
          <span>{count}</span>
        </li>)}</ul>
      </div>
      <div className="review-list">{data.reviews.items.map((review) => <article className="review-card" key={review.id}>
        <div className="review-card-head"><div><strong>{review.author}</strong>
          <span className="review-verified"><BadgeCheck size={15} aria-hidden="true" /> Đã mua hàng</span></div>
          <time dateTime={review.createdAt}>{dateTime(review.createdAt)}</time></div>
        <Stars rating={review.rating} />
        {review.comment && <p className="review-comment">{review.comment}</p>}
        {review.media.length > 0 && <div className="review-gallery">{review.media.map((media, index) => media.type === 'video' ?
          <video key={media.url} controls playsInline preload="none" src={media.url} aria-label="Video đánh giá sản phẩm" /> :
          <Link key={media.url} to={media.url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh đánh giá ${index + 1}`}>
            <img loading="lazy" src={media.url} alt={`Ảnh đánh giá ${index + 1}`} />
          </Link>)}</div>}
      </article>)}</div>
      <Pager pagination={data.reviews.pagination} setPage={setPage} />
    </> : <div className="review-empty"><MessageSquare size={24} aria-hidden="true" /><p>Sản phẩm chưa có đánh giá.</p></div>
}
