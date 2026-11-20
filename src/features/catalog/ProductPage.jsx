import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight, ChevronRight, Leaf, MapPin, Minus, Plus, ShoppingBag, Thermometer } from 'lucide-react'
import { siteUrl, useSeo } from '@/hooks/use-seo'
import { productSeo } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { StoreLayout } from '@/layouts/StoreLayout'
import { useRequest } from '@/hooks/use-request'
import { useSession } from '@/features/account/use-session'
import { price } from '@/lib/format'
import { ProductReviews } from '@/features/reviews/ProductReviews'
import { ProductCard, ProductPhoto } from './ProductPanel'

const categoryLink = (slug) => '/san-pham?' + new URLSearchParams({ categorySlug: slug })

function findCategory(categories, id) {
  for (const category of categories) {
    if (category.id === id) return category
    const match = findCategory(category.children || [], id)
    if (match) return match
  }
}

export function ProductPage({ slug }) {
  const product = useRequest('/catalog/products/' + encodeURIComponent(slug))
  const categoryId = product.data?.categoryId
  const categories = useRequest(categoryId ? '/catalog/categories' : null)
  const category = categoryId && categories.data ? findCategory(categories.data, categoryId) : null
  const [cartCount, setCartCount] = useState(null)

  useSeo(product.data ? productSeo(product.data, siteUrl) : {
    title: 'Chi tiết sản phẩm | Mùa Xanh', noindex: Boolean(product.error), enabled: Boolean(product.error),
  })

  return <StoreLayout cartCount={cartCount}>
    <section className="store-shell product-page">
      <nav aria-label="Đường dẫn" className="product-breadcrumb">
        <Link to="/">Trang chủ</Link><ChevronRight size={14} aria-hidden="true" />
        <Link to="/san-pham">Sản phẩm</Link><ChevronRight size={14} aria-hidden="true" />
        {category && <><Link to={categoryLink(category.slug)}>{category.name}</Link><ChevronRight size={14} aria-hidden="true" /></>}
        <span aria-current="page">{product.data?.name || 'Chi tiết sản phẩm'}</span>
      </nav>
      {product.loading && <div className="product-editorial" role="status">
        <span className="sr-only">Đang tải sản phẩm…</span><div className="product-loading-photo" /><div className="product-loading-info" />
      </div>}
      {product.error && <div className="catalog-state" role="alert">
        <p>{product.error.status === 404 ? 'Sản phẩm này hiện không có trong cửa hàng.' : product.error.message}</p>
        {product.error.status !== 404 && <Button variant="outline" onClick={product.retry}>Thử lại</Button>}
        <Link to="/san-pham">Xem sản phẩm khác</Link>
      </div>}
      {product.data && <ProductDetails key={product.data.id} product={product.data} onCart={setCartCount} />}
      {product.data && <ProductReviews key={slug} slug={slug} />}
      {category && <RelatedProducts category={category} productId={product.data.id} />}
    </section>
  </StoreLayout>
}

function ProductDetails({ product, onCart }) {
  const { session, request } = useSession()
  const variants = product.variants || []
  const [variantId, setVariantId] = useState(variants[0]?.id)
  const [quantity, setQuantity] = useState(1)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const variant = variants.find((item) => item.id === variantId)
  const login = '/dang-nhap?next=' + encodeURIComponent(location.pathname)
  const canShop = session?.roles?.includes('CUSTOMER')

  function changeQuantity(delta) {
    setQuantity((value) => Math.max(1, Math.min(99, (Number(value) || 1) + delta)))
  }

  async function add(event) {
    event.preventDefault()
    if (!canShop || !variant || pending) return
    setPending(true)
    setFeedback(null)
    try {
      const cart = await request('/cart/items', { method: 'POST', body: { variantId, quantity: Number(quantity) } })
      onCart(cart.items.reduce((sum, item) => sum + item.quantity, 0))
      setFeedback({ text: 'Đã thêm vào giỏ hàng.' })
    } catch (error) {
      setFeedback({ text: error.message, error: true })
    } finally {
      setPending(false)
    }
  }

  return <>
    <div className="product-editorial">
      <ProductGallery product={product} />
      <div className="product-purchase">
        <header className="product-heading">
          {product.brandName && <p className="product-brand"><Leaf size={16} aria-hidden="true" />{product.brandName}</p>}
          <h1>{product.name}</h1>
          {product.originDescription && <p className="product-origin"><MapPin size={17} aria-hidden="true" />{product.originDescription}</p>}
        </header>
        {variant && <div className="product-price" aria-live="polite">
          <strong>{price(variant.sellingPrice)}</strong>
          {Number(variant.compareAtPrice) > Number(variant.sellingPrice) && <del>{price(variant.compareAtPrice)}</del>}
          {variant.sku && <span>SKU {variant.sku}</span>}
        </div>}
        {variant ? <form className="product-buy" onSubmit={add}>
          <fieldset disabled={pending}>
            <legend>Chọn quy cách</legend>
            <div className="variant-list">
              {variants.map((item) => <label key={item.id}>
                <input className="sr-only" type="radio" name="variant" checked={variantId === item.id} onChange={() => {
                  setVariantId(item.id); setFeedback(null)
                }} />
                <strong>{item.name}</strong>
                <span>{price(item.sellingPrice)}</span>
              </label>)}
            </div>
          </fieldset>
          <div className="product-quantity">
            <label htmlFor="product-quantity">Số lượng</label>
            <div className="product-stepper">
              <button type="button" aria-label="Giảm số lượng" onClick={() => changeQuantity(-1)} disabled={pending || Number(quantity) <= 1}><Minus size={17} aria-hidden="true" /></button>
              <input id="product-quantity" type="number" min="1" max="99" step="1" inputMode="numeric" required
                disabled={pending} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              <button type="button" aria-label="Tăng số lượng" onClick={() => changeQuantity(1)} disabled={pending || Number(quantity) >= 99}><Plus size={17} aria-hidden="true" /></button>
            </div>
          </div>
          {canShop ? <Button type="submit" disabled={pending}><ShoppingBag size={19} aria-hidden="true" />
            {pending ? 'Đang thêm…' : 'Thêm vào giỏ'}</Button>
            : !session ? <Button asChild><Link to={login}><ShoppingBag size={19} aria-hidden="true" />Đăng nhập để mua</Link></Button>
              : <p className="product-origin">Đăng nhập bằng tài khoản khách hàng để mua sản phẩm.</p>}
        </form> : <p className="product-origin">Sản phẩm chưa có quy cách mở bán.</p>}
        {feedback && <div className={feedback.error ? 'page-error' : 'page-message'} role={feedback.error ? 'alert' : 'status'}>
          {feedback.text} {!feedback.error && <Link to="/gio-hang" className="page-link">Xem giỏ hàng</Link>}
        </div>}
      </div>
    </div>
    {(product.description || product.storageInstructions) && <section className="product-facts" aria-label="Thông tin sản phẩm">
      {product.description && <article><Leaf size={24} aria-hidden="true" /><div><h2>Về sản phẩm</h2><p>{product.description}</p></div></article>}
      {product.storageInstructions && <article><Thermometer size={24} aria-hidden="true" /><div><h2>Cách bảo quản</h2><p>{product.storageInstructions}</p></div></article>}
    </section>}
  </>
}

function ProductGallery({ product }) {
  const [imageIndex, setImageIndex] = useState(null)
  const images = (product.images || []).filter((image) => image.url)
  const primary = images.findIndex((image) => image.primary)
  const index = imageIndex ?? Math.max(0, primary)
  const selected = images[index]

  return <div className="product-gallery">
    <ProductPhoto product={{ name: product.name, images: selected ? [selected] : [] }}
      className="detail-photo" loading="eager" showMissing />
    {images.length > 1 && <div className="product-thumbnails" aria-label="Ảnh sản phẩm">
      {images.map((image, itemIndex) => <button type="button" key={image.url + itemIndex} onClick={() => setImageIndex(itemIndex)}
        aria-label={image.altText ? `Xem ảnh ${itemIndex + 1} · ${image.altText}` : `Xem ảnh ${itemIndex + 1}`}
        aria-pressed={index === itemIndex}>
        <ProductPhoto product={{ name: product.name, images: [image] }} className="thumbnail-photo" />
      </button>)}
    </div>}
  </div>
}

function RelatedProducts({ category, productId }) {
  const query = new URLSearchParams({ categorySlug: category.slug, size: '5' })
  const related = useRequest('/catalog/products?' + query)
  const items = related.data?.items.filter((item) => item.id !== productId).slice(0, 4)
  if (!items?.length) return null

  return <section className="product-related" aria-labelledby="related-title">
    <header><h2 id="related-title">Cùng danh mục</h2>
      <Link to={categoryLink(category.slug)}>Xem {category.name.toLowerCase()} <ArrowRight size={17} aria-hidden="true" /></Link></header>
    <div className="product-grid">{items.map((item) => <ProductCard key={item.id} product={item} />)}</div>
  </section>
}
