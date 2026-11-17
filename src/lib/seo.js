export const homeTitle = 'Mùa Xanh | Cửa hàng thực phẩm hữu cơ'
export const homeDescription = 'Mua thực phẩm hữu cơ tại Mùa Xanh. Khám phá rau củ, trái cây và thực phẩm theo danh mục, quy cách và mức giá.'
export const catalogTitle = 'Sản phẩm hữu cơ | Mùa Xanh'

export function siteLink(base, path) {
  try {
    const url = new URL(path, base)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

export function productSeo(product, base) {
  const path = '/san-pham/' + encodeURIComponent(product.slug)
  const url = siteLink(base, path)
  const description = (product.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    || [product.name, product.brandName, product.originDescription].filter(Boolean).join(' · ')
  const images = (product.images || []).map(({ url: image }) => image && siteLink(base, image)).filter(Boolean)
  const offers = (product.variants || []).filter(({ sellingPrice }) => sellingPrice != null && Number.isFinite(Number(sellingPrice)))
    .map(({ sellingPrice }) => ({ '@type': 'Offer', priceCurrency: 'VND', price: Number(sellingPrice), url }))
  return {
    title: product.name + ' | Mùa Xanh', description, url, image: images[0],
    schema: {
      '@context': 'https://schema.org', '@type': 'Product', name: product.name, description, url,
      image: images.length ? images : undefined,
      brand: product.brandName ? { '@type': 'Brand', name: product.brandName } : undefined,
      offers: offers.length ? offers : undefined,
    },
  }
}
