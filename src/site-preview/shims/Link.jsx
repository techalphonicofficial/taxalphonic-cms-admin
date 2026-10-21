// next/link for the preview: a plain anchor (the preview frame does not navigate on click).
export default function Link({ href, children, prefetch: _prefetch, replace: _replace, scroll: _scroll, shallow: _shallow, ...props }) {
  const url = typeof href === 'string' ? href : `${href?.pathname || ''}${href?.hash || ''}`;
  return <a href={url} {...props}>{children}</a>;
}
