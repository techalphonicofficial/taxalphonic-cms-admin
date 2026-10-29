import { useEffect, useState } from 'react';
import { SlugService } from '../../services/slug.service';

/*
 * Live slug check under a slug input: "available", or who already uses it (with a link to that
 * record) and a free suggestion to use instead. `type` is a backend slug kind (slug.service.js);
 * `id` is the record being edited, so its own slug counts as free. Saving is checked again on the
 * server, this only warns early. `onChange(result)` receives each result (e.g. to disable Save).
 */
export default function SlugStatus({ type, slug, id, onUseSuggestion, onChange, prefix = '/' }) {
  const [state, setState] = useState({ status: 'idle', result: null });
  const value = String(slug || '').trim();

  useEffect(() => {
    if (!value) {
      setState({ status: 'idle', result: null });
      onChange?.(null);
      return undefined;
    }
    let stale = false;
    setState((prev) => ({ ...prev, status: 'checking' }));
    const timer = setTimeout(() => {
      SlugService.check(type, value, id)
        .then((result) => {
          if (stale) return;
          setState({ status: 'done', result });
          onChange?.(result);
        })
        .catch(() => {
          if (!stale) setState({ status: 'error', result: null });
        });
    }, 400);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // onChange is a callback prop; re-checking on every render is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, value, id]);

  if (state.status === 'idle') return null;
  if (state.status === 'checking') {
    return (
      <div className="small text-muted mt-1">
        <span className="spinner-border spinner-border-sm me-1" style={{ width: '0.7rem', height: '0.7rem' }} />
        Checking the slug…
      </div>
    );
  }
  if (state.status === 'error') {
    return <div className="small text-muted mt-1"><i className="bi bi-question-circle me-1" />Could not check the slug now; it is checked again on save.</div>;
  }

  const { result } = state;
  if (result.available) {
    return (
      <div className="small text-success mt-1">
        <i className="bi bi-check-circle-fill me-1" />
        Available: <code>{prefix}{result.slug}</code>
      </div>
    );
  }
  return (
    <div className="small text-danger mt-1">
      <i className="bi bi-exclamation-triangle-fill me-1" />
      {result.reason}
      {result.conflict?.adminUrl && (
        <a href={result.conflict.adminUrl} target="_blank" rel="noreferrer" className="ms-1">
          Open it <i className="bi bi-box-arrow-up-right" />
        </a>
      )}
      {result.suggestion && onUseSuggestion && (
        <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={() => onUseSuggestion(result.suggestion)}>
          Use “{result.suggestion}”
        </button>
      )}
    </div>
  );
}
