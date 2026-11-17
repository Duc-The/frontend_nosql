import { useSeo } from '@/hooks/use-seo'
import { catalogTitle } from '@/lib/seo'
import { ArrowRight, ChevronLeft, ChevronRight, Flame, SearchX, Sparkles, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreLayout } from '@/layouts/StoreLayout'
import { ProductCard } from './ProductPanel'
import { useRequest } from '@/hooks/use-request'
import './storefront.css'

const params = new URLSearchParams(window.location.search)
const q = params.get('q') || ''
const category = params.get('categorySlug') || ''
const minPrice = params.get('minPrice') || ''
const maxPrice = params.get('maxPrice') || ''
const featured = params.get('featured') === 'true'
const shelfLabels = { DISCOUNTED: 'Sản phẩm giảm giá', BESTSELLING: 'Sản phẩm bán chạy' }
const shelfFilter = Object.hasOwn(shelfLabels, params.get('shelf')) ? params.get('shelf') : ''
const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)

function catalogLink(changes = {}) {
  const values = { q, categorySlug: category, minPrice, maxPrice, featured: featured ? 'true' : '', shelf: shelfFilter, ...changes }
  const query = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== ''))
  return '/san-pham' + (query.size ? '?' + query : '')
}

function flatten(categories, depth = 0) {
  return categories.flatMap((item) => [{ ...item, depth }, ...flatten(item.children || [], depth + 1)])
}

const homeShelves = [
  { id: 'giam-gia', title: 'Đang giảm giá', icon: Tag, query: 'shelf=DISCOUNTED' },
  { id: 'ban-chay', title: 'Bán chạy', description: 'Theo số lượng bán trong 30 ngày qua', icon: Flame, query: 'shelf=BESTSELLING' },
  { id: 'noi-bat', title: 'Sản phẩm nổi bật', icon: Sparkles, query: 'featured=true' },
]

function HomeShelf({ id, title, description, icon, query }) {
  const Icon = icon
  const products = useRequest('/catalog/products?size=8&' + query)
  if (!products.data?.items.length) return null
  return <section id={id} className="store-shell home-shelf" aria-labelledby={id + '-title'}>
    <header className="home-shelf-heading">
      <div className="home-shelf-label"><span className="home-shelf-icon"><Icon size={21} aria-hidden="true" /></span>
        <div><h2 id={id + '-title'}>{title}</h2>{description && <p>{description}</p>}</div></div>
      <a href={'/san-pham?' + query}>Xem tất cả <ArrowRight size={16} aria-hidden="true" /></a>
    </header>
    <div className="product-grid">{products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
  </section>
}

export function Storefront({ catalogOnly = false }) {
  useSeo({
    title: catalogOnly ? (shelfLabels[shelfFilter] ? shelfLabels[shelfFilter] + ' | Mùa Xanh' : catalogTitle) : undefined,
    path: catalogOnly ? '/san-pham' : '/',
    noindex: Boolean(location.search && [...new URLSearchParams(location.search).keys()]
      .some((key) => ['q', 'categorySlug', 'minPrice', 'maxPrice', 'featured', 'shelf', 'page'].includes(key))),
  })
  const categoryRequest = useRequest('/catalog/categories')
  const filter = new URLSearchParams({ page: catalogOnly ? String(page) : '1', size: catalogOnly ? '12' : '16' })
  for (const name of ['q', 'categorySlug', 'minPrice', 'maxPrice', 'featured']) {
    if (catalogOnly && params.get(name)) filter.set(name, params.get(name))
  }
  if (catalogOnly && shelfFilter) filter.set('shelf', shelfFilter)
  const products = useRequest('/catalog/products?' + filter)
  const categories = flatten(categoryRequest.data || [])
  const shelf = categories.filter((item) => item.depth > 0)
  const categoryLinks = shelf.length ? shelf : categories
  const activeCategory = categories.find((item) => item.slug === category)

  return (
    <StoreLayout search={q}>
      {!catalogOnly && <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="hero-label">Cửa hàng thực phẩm organic</p>
          <h1 id="hero-title">Từ vườn xanh<br />đến bữa nhà.</h1>
          <p className="hero-intro">Rau củ, trái cây và đồ khô cho những bữa ăn bạn tự tay chuẩn bị.</p>
          <a className="hero-link" href="/san-pham">Xem sản phẩm <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
        <figure className="hero-photo">
          <img src="/images/market-basket.png" width="1536" height="1024" fetchPriority="high"
            alt="Rổ tre đựng rau xanh, cà chua, cà rốt và dưa leo" />
        </figure>
      </section>}

      <section id="danh-muc" className="store-shell category-section" aria-labelledby="category-title">
        <h2 id="category-title">Mua theo danh mục</h2>
        {categoryRequest.loading && <p role="status" className="origin">Đang tải danh mục…</p>}
        {categoryRequest.error && <div className="category-message"><p>Danh mục tạm thời chưa tải được.</p><Button variant="outline" onClick={categoryRequest.retry}>Thử lại</Button></div>}
        {!categoryRequest.loading && !categoryRequest.error && !categoryLinks.length && <p>Chưa có danh mục.</p>}
        {categoryLinks.length > 0 && <nav className="category-links" aria-label="Danh mục sản phẩm">
          <a href="/san-pham" aria-current={!category ? 'true' : undefined}>Tất cả</a>
          {categoryLinks.map((item) => <a href={catalogLink({ categorySlug: item.slug, q: '', minPrice: '', maxPrice: '', featured: '' })}
            key={item.id} aria-current={category === item.slug ? 'true' : undefined}>{item.name}</a>)}
        </nav>}
      </section>

      {!catalogOnly && homeShelves.map((shelf) => <HomeShelf key={shelf.id} {...shelf} />)}

      <section id="san-pham" className="store-shell catalog-section" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>{catalogOnly ? <h1 id="catalog-title">{q ? `Kết quả cho “${q}”` : shelfLabels[shelfFilter] || activeCategory?.name || (featured ? 'Sản phẩm nổi bật' : 'Sản phẩm')}</h1>
            : <h2 id="catalog-title">Khám phá cửa hàng</h2>}
            {products.data && <p>{products.data.pagination.totalElements} sản phẩm</p>}</div>
          {catalogOnly && (q || category || minPrice || maxPrice || featured || shelfFilter) && <a href="/san-pham" className="reset-filter"><X size={16} /> Xóa bộ lọc</a>}
        </div>
        {catalogOnly && <form className="catalog-filters" action="/san-pham" aria-label="Lọc sản phẩm">
          {q && <input type="hidden" name="q" value={q} />}
          {shelfFilter && <input type="hidden" name="shelf" value={shelfFilter} />}
          <label>Danh mục
            <select name="categorySlug" defaultValue={category}>
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => <option key={item.id} value={item.slug}>{'  '.repeat(item.depth) + item.name}</option>)}
            </select>
          </label>
          <label>Giá từ<input name="minPrice" type="number" min="0" step="1" defaultValue={minPrice} placeholder="0 ₫" /></label>
          <label>Đến<input name="maxPrice" type="number" min="0" step="1" defaultValue={maxPrice} placeholder="Không giới hạn" /></label>
          <label className="featured-filter"><input type="checkbox" name="featured" value="true" defaultChecked={featured} /> Nổi bật</label>
          <Button type="submit" variant="outline">Áp dụng</Button>
        </form>}
        {products.loading && <div className="product-grid" aria-label="Đang tải sản phẩm" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => <Skeleton className="product-skeleton" key={index} />)}
        </div>}
        {products.error && <div className="catalog-state" role="alert"><p>{products.error.message}</p>
          <Button variant="outline" onClick={products.retry}>Thử lại</Button></div>}
        {products.data?.items.length === 0 && <div className="catalog-state"><SearchX size={25} aria-hidden="true" />
          <p>Chưa tìm thấy sản phẩm phù hợp.</p><a href="/san-pham">Xem tất cả sản phẩm</a></div>}
        {products.data?.items.length > 0 && <div className="product-grid">
          {products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>}
        {catalogOnly && products.data?.pagination.totalPages > 1 && <nav className="pagination" aria-label="Phân trang sản phẩm">
          {page > 1 && <a href={catalogLink({ page: page - 1 })}><ChevronLeft size={18} /> Trang trước</a>}
          <span>Trang {page} / {products.data.pagination.totalPages}</span>
          {products.data.pagination.hasNext && <a href={catalogLink({ page: page + 1 })}>Trang sau <ChevronRight size={18} /></a>}
        </nav>}
        {!catalogOnly && products.data?.items.length > 0 && <div className="home-catalog-more">
          <Button asChild variant="outline"><a href="/san-pham">Xem toàn bộ sản phẩm <ArrowRight size={16} aria-hidden="true" /></a></Button>
        </div>}
      </section>

    </StoreLayout>
  )
}
