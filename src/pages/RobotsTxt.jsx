import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import EditorBar from '../components/common/EditorBar';
import HasPermission from '../components/common/HasPermission';
import { confirmDialog } from '../components/common/confirm';
import { siteUrl } from '../config/siteUrl';

/*
 * SEO → Robots.txt. The website serves an automatic robots.txt (all pages crawlable except the
 * CMS live preview, plus the sitemap). Uploading / writing a file here replaces it on the website
 * at once (GET/PUT /seo/robots-txt, stored in settings); "Use automatic" switches back.
 */

const LIVE_URL = siteUrl('/robots.txt');
const SITEMAP_URL = siteUrl('/sitemap.xml');
const AUTO_PREVIEW = `User-agent: *
Allow: /
Disallow: /cms-preview

Sitemap: ${SITEMAP_URL}
`;
const MAX_BYTES = 64 * 1024;

/** Simple checks that catch the costly mistakes (not a full validator). */
function checksFor(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
  const out = [];
  if (!lines.some((l) => /^user-agent\s*:/i.test(l))) out.push({ tone: 'danger', text: 'No "User-agent:" line: search engines ignore the rules without one.' });
  // "Disallow: /" right under "User-agent: *" blocks the whole site.
  let star = false;
  lines.forEach((l) => {
    if (/^user-agent\s*:/i.test(l)) star = /^user-agent\s*:\s*\*$/i.test(l);
    else if (star && /^disallow\s*:\s*\/$/i.test(l)) out.push({ tone: 'danger', text: '"Disallow: /" for all robots blocks the whole website from Google.' });
  });
  if (!lines.some((l) => /^sitemap\s*:/i.test(l))) out.push({ tone: 'warning', text: `No "Sitemap:" line. Add: Sitemap: ${SITEMAP_URL}` });
  const unknown = lines.filter((l) => !/^(user-agent|allow|disallow|sitemap|crawl-delay|host|clean-param|noindex)\s*:/i.test(l));
  if (unknown.length) out.push({ tone: 'warning', text: `Lines robots don't understand: ${unknown.slice(0, 3).join(' · ')}${unknown.length > 3 ? ' …' : ''}` });
  return out;
}

const RobotsTxt = () => {
  const [state, setState] = useState(null); // { content, enabled, updatedAt }
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/seo/robots-txt');
      const data = res.data?.data || { content: '', enabled: false };
      setState(data);
      setText(data.content || AUTO_PREVIEW);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load robots.txt');
      setState({ content: '', enabled: false });
      setText(AUTO_PREVIEW);
    }
  };
  useEffect(() => { load(); }, []);

  const checks = useMemo(() => checksFor(text), [text]);
  const bytes = new Blob([text]).size;
  const dirty = state && (state.enabled ? text !== state.content : true);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.txt$/i.test(file.name) && file.type && file.type !== 'text/plain') {
      toast.error('Choose a plain text file (robots.txt).');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('The file is larger than 64 KB.');
      return;
      
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ''));
      toast.info(`"${file.name}" loaded. Check it below, then click "Save & publish".`);
    };
    reader.readAsText(file);
  };

  const save = async () => {
    if (!text.trim()) { toast.error('robots.txt is empty.'); return; }
    if (bytes > MAX_BYTES) { toast.error('robots.txt is larger than 64 KB.'); return; }
    const blocking = checks.filter((c) => c.tone === 'danger');
    const ok = await confirmDialog({
      title: 'Publish this robots.txt?',
      message: `It replaces the automatic file at ${LIVE_URL} right away. Search engines read it on their next visit.`,
      items: blocking.map((c) => `⚠ ${c.text}`),
      tone: blocking.length ? 'danger' : 'warning',
      confirmText: 'Save & publish',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await api.put('/seo/robots-txt', { content: text, enabled: true });
      setState(res.data?.data);
      setText(res.data?.data?.content || text);
      toast.success('Custom robots.txt is live.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save robots.txt');
    } finally {
      setSaving(false);
    }
  };

  const useAutomatic = async () => {
    const ok = await confirmDialog({
      title: 'Go back to the automatic robots.txt?',
      message: 'The website serves the automatic file again (all pages crawlable except the CMS preview, plus the sitemap). Your custom text is kept here for later.',
      tone: 'warning',
      confirmText: 'Use automatic',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await api.put('/seo/robots-txt', { enabled: false });
      setState(res.data?.data);
      toast.success('Automatic robots.txt is live.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not switch to automatic');
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'robots.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!state) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid p-0">
      <EditorBar
        title="Robots.txt"
        breadcrumb={[{ label: 'SEO', link: '/cms/seo' }, { label: 'Robots.txt' }]}
        subtitle="Tell search engines which parts of the website they may crawl."
      >
        <a href={LIVE_URL} target="_blank" rel="noreferrer" className="btn btn-light border rounded-pill px-3"><i className="bi bi-box-arrow-up-right me-1"></i>View live</a>
        <HasPermission action="update" module="SEO">
          {state.enabled && (
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={useAutomatic} disabled={saving}>
              <i className="bi bi-magic me-1"></i>Use automatic
            </button>
          )}
          <button type="button" className="btn btn-primary rounded-pill px-4" onClick={save} disabled={saving || !dirty}>
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-upload me-2"></i>}Save &amp; publish
          </button>
        </HasPermission>
      </EditorBar>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                {state.enabled ? (
                  <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-2"><i className="bi bi-file-earmark-check me-1"></i>Custom file is live</span>
                ) : (
                  <span className="badge rounded-pill bg-info-subtle text-info-emphasis px-3 py-2"><i className="bi bi-magic me-1"></i>Automatic file is live</span>
                )}
                {state.updatedAt && state.enabled && <small className="text-muted">Last saved {new Date(state.updatedAt).toLocaleString('en-IN')}</small>}
                <div className="ms-auto d-flex gap-2">
                  <HasPermission action="update" module="SEO">
                    <input ref={fileRef} type="file" accept=".txt,text/plain" className="d-none" onChange={onFile} />
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => fileRef.current?.click()}>
                      <i className="bi bi-upload me-1"></i>Upload robots.txt
                    </button>
                  </HasPermission>
                  <button type="button" className="btn btn-sm btn-light border" onClick={download}><i className="bi bi-download me-1"></i>Download</button>
                </div>
              </div>

              {!state.enabled && (
                <div className="alert alert-light border small py-2">
                  The website is using the automatic file shown below. Upload your own file or edit the text, then click <b>Save &amp; publish</b> to replace it.
                </div>
              )}

              <textarea
                className="form-control font-monospace"
                style={{ minHeight: 360, fontSize: '0.875rem', whiteSpace: 'pre', overflowWrap: 'normal' }}
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="robots.txt content"
              />
              <div className="d-flex justify-content-between mt-2 small text-muted">
                <span>{text.split('\n').length} lines</span>
                <span className={bytes > MAX_BYTES ? 'text-danger' : ''}>{(bytes / 1024).toFixed(1)} KB / 64 KB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3"><i className="bi bi-clipboard-check me-2 text-primary"></i>Checks</h6>
              {checks.length === 0 ? (
                <p className="small text-success mb-0"><i className="bi bi-check-circle me-1"></i>Looks good.</p>
              ) : (
                <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
                  {checks.map((c, i) => (
                    <li key={i} className={c.tone === 'danger' ? 'text-danger' : 'text-warning-emphasis'}>
                      <i className={`bi ${c.tone === 'danger' ? 'bi-x-octagon' : 'bi-exclamation-triangle'} me-1`}></i>{c.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 small text-muted">
              <h6 className="fw-bold text-body mb-2">How it works</h6>
              <ul className="ps-3 mb-0 d-flex flex-column gap-1">
                <li>Automatic: every page may be crawled except the CMS preview, and Google is pointed to the sitemap.</li>
                <li>Custom: your file is served exactly as saved at <code>/robots.txt</code>, straight away.</li>
                <li>"Use automatic" switches back; the custom text stays saved here.</li>
                <li>To hide one page from Google, prefer its SEO "noindex" setting: robots.txt only stops crawling.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobotsTxt;
