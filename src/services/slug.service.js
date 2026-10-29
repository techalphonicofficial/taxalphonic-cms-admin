import api from './api';

// Slug clash check (backend services/slugRegistry.js, GET /slugs/check). Types: service, page,
// seo_page, blog, service_category, page_category, blog_category, blog_tag, portfolio_category,
// portfolio_item, form. Services, pages and pSEO pages share one URL space (taxalphonic.com/<slug>).
export const SlugService = {
  check: (type, slug, id) =>
    api.get('/slugs/check', { params: { type, slug, id: id || undefined } }).then((res) => res.data?.data),
};
