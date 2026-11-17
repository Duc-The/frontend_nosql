import { useEffect } from 'react'
import { homeDescription, homeTitle, siteLink } from '@/lib/seo'

export const siteUrl = import.meta.env.VITE_SITE_URL

export function useSeo({ title = homeTitle, description = homeDescription, path, url, image, schema, noindex = false, enabled = true }) {
  useEffect(() => {
    if (!enabled) return
    document.title = title
    const canonical = url || (path && siteLink(siteUrl, path))
    function put(tag, attribute, key, valueAttribute, value) {
      let element = document.head.querySelector(`${tag}[${attribute}="${key}"]`)
      if (!value) {
        element?.remove()
        return
      }
      if (!element) {
        element = document.createElement(tag)
        element.setAttribute(attribute, key)
        document.head.append(element)
      }
      element.setAttribute(valueAttribute, value)
    }
    put('meta', 'name', 'description', 'content', description)
    put('meta', 'name', 'robots', 'content', noindex ? 'noindex, follow' : 'index, follow')
    put('meta', 'property', 'og:title', 'content', title)
    put('meta', 'property', 'og:description', 'content', description)
    put('meta', 'property', 'og:url', 'content', canonical)
    put('meta', 'property', 'og:image', 'content', image)
    put('link', 'rel', 'canonical', 'href', canonical)
    put('script', 'id', 'page-schema', 'type', schema ? 'application/ld+json' : undefined)
    const element = document.getElementById('page-schema')
    if (element) element.textContent = JSON.stringify(schema)
  }, [title, description, path, url, image, schema, noindex, enabled])
}
