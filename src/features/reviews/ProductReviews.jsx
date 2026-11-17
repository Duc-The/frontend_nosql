import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, MessageSquare, Star } from 'lucide-react'
import { useRequest } from '@/hooks/use-request'
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
      <a className="page-link" href="/don-hang">Đánh giá từ đơn hàng</a></div>
    {feed.loading && <Message>Đang tải đánh giá…</Message>}
    {feed.error && <div className="page-error" role="alert">{feed.error.message} <button type="button" className="page-link" onClick={feed.retry}>Thử lại</button></div>}
    {feed.data && <ReviewFeed data={feed.data} setPage={setPage} />}
  </section>
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
          <a key={media.url} href={media.url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh đánh giá ${index + 1}`}>
            <img loading="lazy" src={media.url} alt={`Ảnh đánh giá ${index + 1}`} />
          </a>)}</div>}
      </article>)}</div>
      <Pager pagination={data.reviews.pagination} setPage={setPage} />
    </> : <div className="review-empty"><MessageSquare size={24} aria-hidden="true" /><p>Sản phẩm chưa có đánh giá.</p></div>
}
