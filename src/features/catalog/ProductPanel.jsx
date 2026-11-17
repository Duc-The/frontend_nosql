import { ChevronRight, Leaf } from 'lucide-react'
import { useState } from 'react'
import { price } from '@/lib/format'

export function ProductPhoto({ product, className, loading = 'lazy', showMissing = false }) {
  const image = product.images?.find((item) => item.primary) || product.images?.[0]
  const [failedUrl, setFailedUrl] = useState(null)
  return image?.url && image.url !== failedUrl
    ? <img className={className} src={image.url} alt={image.altText || product.name} loading={loading}
        onError={() => setFailedUrl(image.url)} />
    : <div className={`product-fallback ${className || ''}`} role="img" aria-label="Chưa có ảnh sản phẩm"><span className="product-photo-placeholder"><Leaf size={showMissing ? 64 : 34} strokeWidth={1.1} aria-hidden="true" />
      {showMissing && <span>Ảnh sản phẩm chưa được cập nhật</span>}</span></div>
}

export function ProductCard({ product }) {
  const sale = product.salePrice != null && Number(product.saleCompareAtPrice) > Number(product.salePrice)
  const saleMatchesMinimum = sale && Number(product.salePrice) === Number(product.minPrice)
  const discount = sale ? Math.floor((1 - Number(product.salePrice) / Number(product.saleCompareAtPrice)) * 100 + 1e-9) : 0
  return <article className="product-card">
    <a href={'/san-pham/' + encodeURIComponent(product.slug)} className="product-card-button">
      <div className="product-card-visual"><ProductPhoto product={product} className="product-photo" />
        {sale && <span className="product-sale-badge">{discount > 0 ? '−' + discount + '%' : 'Giảm giá'}</span>}
      </div>
      <div className="product-card-body">
        <p className="origin">{product.originDescription || product.brandName}</p>
        <h3>{product.name}</h3>
        <div className="product-card-price">
          <strong>{product.minPrice !== product.maxPrice ? 'Từ ' : ''}{price(product.minPrice)}</strong>
          {saleMatchesMinimum && <del>{price(product.saleCompareAtPrice)}</del>}
          <span aria-hidden="true"><ChevronRight size={18} /></span>
        </div>
        {sale && !saleMatchesMinimum && <p className="product-sale-option">Quy cách giảm còn {price(product.salePrice)} <del>{price(product.saleCompareAtPrice)}</del></p>}
      </div>
    </a>
  </article>
}
