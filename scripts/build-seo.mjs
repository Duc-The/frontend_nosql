import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadEnv } from 'vite'
import { catalogTitle, homeDescription, homeTitle, productSeo, siteLink } from '../src/lib/seo.js'

const env = loadEnv('production', process.cwd(), '')
const site = env.VITE_SITE_URL
if (!site) {
  console.log('SEO: set VITE_SITE_URL to generate public HTML and sitemap.')
  process.exit(0)
}
if (!siteLink(site, '/')) throw new Error('VITE_SITE_URL must be an absolute HTTP(S) URL.')

const api = env.SEO_API_BASE_URL?.replace(/\/$/, '')
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char])
const template = await readFile('dist/index.html', 'utf8')
const paths = []

async function catalog(path) {
  const response = await fetch(api + '/catalog/products' + path, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Catalog SEO request failed (HTTP ${response.status}).`)
  const payload = await response.json()
  if (!payload.success || !payload.data) throw new Error('Unexpected catalog response.')
  return payload.data
}

async function writePage(path, { title, description, url = siteLink(site, path), image, schema }, content) {
  const meta = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}">`,
    `<link rel="canonical" href="${escape(url)}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    `<meta property="og:url" content="${escape(url)}">`,
    image && `<meta property="og:image" content="${escape(image)}">`,
    schema && `<script type="application/ld+json" id="page-schema">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n    ')
  const page = template.replace(/<meta name="description"[^>]*>/, '')
    .replace(/<title>[^<]*<\/title>/, () => meta)
    .replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
  const folder = join('dist', path.slice(1))
  await mkdir(folder, { recursive: true })
  await writeFile(join(folder, 'index.html'), page)
  paths.push(url)
}

const products = new Map()
if (api) {
  let page = 1
  let result
  do {
    result = await catalog('?page=' + page++)
    for (const item of result.items) {
      if (item.slug) products.set(item.slug, item)
    }
  } while (result.pagination?.hasNext)
}

const list = [...products.values()].map(({ slug, name }) =>
  `<li><a href="/san-pham/${escape(encodeURIComponent(slug))}">${escape(name)}</a></li>`).join('')
await writePage('/', { title: homeTitle, description: homeDescription },
  `<main><h1>Mùa Xanh</h1><p>${escape(homeDescription)}</p><a href="/san-pham">Xem sản phẩm</a></main>`)
await writePage('/san-pham', { title: catalogTitle, description: homeDescription },
  `<main><h1>Sản phẩm hữu cơ</h1><ul>${list}</ul></main>`)

for (const slug of products.keys()) {
  if (slug === '.' || slug === '..') continue
  const encoded = encodeURIComponent(slug)
  const product = await catalog('/' + encoded)
  const seo = productSeo(product, site)
  await writePage('/san-pham/' + encoded, seo,
    `<main><a href="/san-pham">Sản phẩm</a><h1>${escape(product.name)}</h1><p>${escape(seo.description)}</p>${seo.image ? `<img src="${escape(seo.image)}" alt="${escape(product.name)}">` : ''}</main>`)
}
await writeFile('dist/404.html', template.replace('</head>', '<meta name="robots" content="noindex"></head>'))
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteLink(site, '/sitemap.xml')}\n`)
await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  paths.map((url) => `<url><loc>${escape(url)}</loc></url>`).join('') + '</urlset>\n')
console.log(`SEO: generated ${paths.length} public pages and sitemap.`)
