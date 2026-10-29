import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import EditorBar from '../../components/common/EditorBar';
import { confirmDialog } from '../../components/common/confirm';
import { LandingPageService, apiErrorText, canLanding } from '../../services/landingPage.service';
import './landing.css';

/*
 * Landing Pages → Thank-you page & tracking (/landing-pages/thank-you).
 * One thank-you page for every landing page: after a landing form is sent, the website opens
 * <landing site>/lp/thank-you?from=<URL name> (website app/lp/thank-you, ThankYouPage.jsx), in the
 * colours, logo and footer of the landing page the visitor came from.
 * Tracking codes (Google tag / GTM / Meta Pixel ...): "every landing page" codes run on all landing
 * pages and the thank-you page; "thank-you page" codes only there (the conversion event).
 * Backend: GET/PUT /landing-pages/thank-you (settings group "landing", key "thank_you").
 */

const FORM_ID = 'landing-thank-you-form';
const EMPTY = { enabled: true, icon: '', heading: '', message: '', stepsTitle: '', steps: [], backText: '', showCall: true, callText: '', allHead: '', allBody: '', thanksHead: '', thanksBody: '' };
const MAX_CODE = 20000;

const CODES = [
  {
    group: 'Every landing page (and the thank-you page)',
    note: 'Base tags: Google tag (gtag.js), Google Tag Manager, Meta Pixel base code, LinkedIn Insight… They must be on the landing pages too, so the ad click is remembered and the conversion on the thank-you page is counted.',
    fields: [
      { key: 'allHead', label: 'Head code', hint: 'Placed at the very top of the page. E.g. the Google tag, the GTM <script>, the Meta Pixel base code.', example: '<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag(\'js\', new Date());\n  gtag(\'config\', \'AW-XXXXXXXXX\');\n</script>' },
      { key: 'allBody', label: 'Body code', hint: 'Placed at the end of the page. E.g. the GTM <noscript> iframe, chat widgets.', example: '<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>' },
    ],
  },
  {
    group: 'Thank-you page only (conversion)',
    note: 'Runs only when someone has sent a landing form, so each lead counts as one conversion. {{page}} becomes the landing page’s URL name (e.g. cbdt), useful as a label.',
    fields: [
      { key: 'thanksHead', label: 'Head code', hint: 'E.g. the Google Ads conversion event snippet, Meta Pixel fbq(\'track\', \'Lead\').', example: '<!-- Google Ads conversion -->\n<script>\n  gtag(\'event\', \'conversion\', { send_to: \'AW-XXXXXXXXX/AbCdEfGhIj\' });\n</script>\n<!-- Meta Pixel lead -->\n<script>\n  if (window.fbq) fbq(\'track\', \'Lead\', { content_name: \'{{page}}\' });\n</script>' },
      { key: 'thanksBody', label: 'Body code', hint: 'Placed at the end of the thank-you page. E.g. <noscript> pixels.', example: '<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=XXXXXXXXXXXX&ev=Lead&noscript=1" /></noscript>' },
    ],
  },
];

/** Problems worth a warning before saving (not blocking). */
function codeWarnings(values) {
  const out = [];
  const all = `${values.allHead}\n${values.allBody}`;
  const thanks = `${values.thanksHead}\n${values.thanksBody}`;
  CODES.flatMap((g) => g.fields).forEach(({ key, label }) => {
    const code = String(values[key] || '').trim();
    if (code && !code.includes('<')) out.push(`${label} (${key.startsWith('all') ? 'every page' : 'thank-you'}): paste the whole snippet, including the <script> tags.`);
    if (code.length > MAX_CODE) out.push(`${label}: too long (max ${MAX_CODE} characters).`);
  });
  if (/gtag\(\s*['"]event['"]\s*,\s*['"]conversion/.test(thanks) && !/googletagmanager\.com\/gtag\/js/.test(all + thanks)) {
    out.push('The thank-you code sends a Google Ads conversion, but no Google tag (gtag.js) is set. Add the Google tag to “Every landing page → Head code”.');
  }
  if (/fbq\(/.test(thanks) && !/connect\.facebook\.net\/[^"']*fbevents\.js/.test(all + thanks)) {
    out.push('The thank-you code calls the Meta Pixel (fbq), but the Pixel base code is not set. Add it to “Every landing page → Head code”.');
  }
  return out;
}

const ThanksPreview = ({ v }) => {
  const steps = (v.steps || []).filter((s) => s.text?.trim());
  return (
    <div className="lp-ty-preview" aria-label="Preview">
      <div className="lp-ty-preview-bar"><span className="lp-ty-dot" /><span>services.taxalphonic.com/lp/thank-you</span></div>
      <div className="lp-ty-preview-body">
        <div className="lp-ty-card">
          {v.icon && <div className="lp-ty-icon">{v.icon}</div>}
          {v.heading && <div className="lp-ty-h">{v.heading}</div>}
          {v.message && <p className="lp-ty-msg">{v.message}</p>}
          {steps.length > 0 && (
            <div className="lp-ty-steps">
              {v.stepsTitle && <div className="lp-ty-steps-t">{v.stepsTitle}</div>}
              {steps.map((s, i) => <div key={i} className="lp-ty-step"><span>{i + 1}</span>{s.text}</div>)}
            </div>
          )}
          <div className="lp-ty-actions">
            {v.showCall && <span className="lp-ty-btn solid">📞 {v.callText || 'Call us'}</span>}
            {v.backText && <span className="lp-ty-btn">← {v.backText}</span>}
          </div>
        </div>
      </div>
      <div className="small text-muted mt-2">The live page uses the colour theme, logo and footer of the landing page the visitor came from.</div>
    </div>
  );
};

export default function LandingThankYou() {
  const [values, setValues] = useState(EMPTY);
  const [saved, setSaved] = useState(null);
  const [pageUrl, setPageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExample, setShowExample] = useState({});
  const canEdit = canLanding('update');

  useEffect(() => {
    LandingPageService.thankYou()
      .then(({ pageUrl: url, ...rest }) => {
        const next = { ...EMPTY, ...rest, steps: Array.isArray(rest.steps) ? rest.steps : [] };
        setValues(next);
        setSaved(next);
        setPageUrl(url || '');
      })
      .catch((e) => toast.error(apiErrorText(e, 'Could not load the thank-you page')))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => saved && JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const warnings = useMemo(() => codeWarnings(values), [values]);
  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setValues((v) => ({ ...v, [key]: value }));
  };
  const setStep = (i, text) => setValues((v) => ({ ...v, steps: v.steps.map((s, j) => (j === i ? { text } : s)) }));
  const moveStep = (i, d) => setValues((v) => {
    const steps = [...v.steps];
    const j = i + d;
    if (j < 0 || j >= steps.length) return v;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    return { ...v, steps };
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (warnings.length) {
      const ok = await confirmDialog({
        title: 'Save with these warnings?',
        message: 'The tracking codes may not work as expected:',
        items: warnings,
        tone: 'warning',
        confirmText: 'Save anyway',
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const body = { ...values, steps: values.steps.filter((s) => s.text?.trim()) };
      const next = await LandingPageService.saveThankYou(body);
      const merged = { ...EMPTY, ...next };
      setValues(merged);
      setSaved(merged);
      toast.success('Thank-you page saved. It is live on the website within a minute.');
    } catch (err) {
      toast.error(apiErrorText(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const breadcrumb = [{ label: 'Landing Pages', link: '/landing-pages' }, { label: 'Thank-you page & tracking' }];

  return (
    <div className="container-fluid p-0 lp-ty">
      <EditorBar
        title="Thank-you page & tracking"
        breadcrumb={breadcrumb}
        subtitle="Shown after a landing page form is sent, for every landing page. Add your ad tracking codes here."
      >
        {pageUrl && values.enabled && (
          <a href={pageUrl} target="_blank" rel="noreferrer" className="btn btn-outline-secondary rounded-pill px-3">
            <i className="bi bi-box-arrow-up-right me-1" />View page
          </a>
        )}
        {canEdit && (
          <button type="submit" form={FORM_ID} className="btn btn-primary rounded-pill px-4" disabled={saving || loading || !dirty}>
            {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
        )}
      </EditorBar>

      {loading ? (
        <div className="text-center text-muted py-5"><div className="spinner-border spinner-border-sm me-2" />Loading…</div>
      ) : (
        <form id={FORM_ID} onSubmit={onSubmit}>
          <fieldset disabled={!canEdit} className="row g-4">
            <div className="col-xl-7">
              <div className="premium-card mb-4">
                <div className="premium-card-header d-flex justify-content-between align-items-center gap-2">
                  <h5 className="premium-card-title mb-0">Thank-you page</h5>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id="ty-enabled" checked={values.enabled} onChange={set('enabled')} />
                    <label className="form-check-label small fw-semibold" htmlFor="ty-enabled">{values.enabled ? 'On' : 'Off'}</label>
                  </div>
                </div>
                <div className="premium-card-body">
                  {!values.enabled && (
                    <div className="alert alert-warning small py-2">
                      Off: after a form is sent the visitor stays on the landing page and sees the form’s success message. The thank-you codes do not run.
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-3 col-md-2">
                      <label className="form-label small fw-semibold">Icon</label>
                      <input className="form-control text-center" value={values.icon} onChange={set('icon')} maxLength={16} placeholder="✅" />
                    </div>
                    <div className="col-9 col-md-10">
                      <label className="form-label small fw-semibold">Heading</label>
                      <input className="form-control" value={values.heading} onChange={set('heading')} maxLength={160} placeholder="Thank you! We have received your details" />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Message</label>
                      <textarea className="form-control" rows={2} value={values.message} onChange={set('message')} maxLength={1000} placeholder="Our expert will call you back shortly." />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">“What happens next” steps</label>
                      <input className="form-control form-control-sm mb-2" value={values.stepsTitle} onChange={set('stepsTitle')} maxLength={80} placeholder="Title, e.g. What happens next" />
                      {values.steps.map((s, i) => (
                        <div key={i} className="input-group input-group-sm mb-2">
                          <span className="input-group-text">{i + 1}</span>
                          <input className="form-control" value={s.text} onChange={(e) => setStep(i, e.target.value)} maxLength={160} />
                          <button type="button" className="btn btn-outline-secondary" onClick={() => moveStep(i, -1)} disabled={i === 0} title="Move up"><i className="bi bi-arrow-up" /></button>
                          <button type="button" className="btn btn-outline-secondary" onClick={() => moveStep(i, 1)} disabled={i === values.steps.length - 1} title="Move down"><i className="bi bi-arrow-down" /></button>
                          <button type="button" className="btn btn-outline-danger" onClick={() => setValues((v) => ({ ...v, steps: v.steps.filter((_, j) => j !== i) }))} title="Remove"><i className="bi bi-x-lg" /></button>
                        </div>
                      ))}
                      {values.steps.length < 6 && (
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => setValues((v) => ({ ...v, steps: [...v.steps, { text: '' }] }))}>
                          <i className="bi bi-plus-lg me-1" />Add step
                        </button>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">“Back to the page” button</label>
                      <input className="form-control" value={values.backText} onChange={set('backText')} maxLength={60} placeholder="Back to the page (empty = no button)" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold d-flex justify-content-between">
                        <span>Call button</span>
                        <span className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" checked={values.showCall} onChange={set('showCall')} aria-label="Show the call button" />
                        </span>
                      </label>
                      <input className="form-control" value={values.callText} onChange={set('callText')} maxLength={60} disabled={!values.showCall} placeholder="Call us now" />
                      <div className="form-text">Calls the phone number in Settings → Contact.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <div className="premium-card-header">
                  <h5 className="premium-card-title mb-0">Ad tracking codes</h5>
                </div>
                <div className="premium-card-body">
                  <div className="alert alert-info small py-2 mb-3">
                    Paste the snippets exactly as Google Ads, Google Tag Manager or Meta give them. They run on the website as they are, so paste only code from those dashboards. Never paste passwords or API keys here.
                  </div>
                  {CODES.map((g) => (
                    <div key={g.group} className="mb-4">
                      <div className="fw-semibold">{g.group}</div>
                      <div className="small text-muted mb-2">{g.note}</div>
                      {g.fields.map((f) => (
                        <div key={f.key} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <label className="form-label small fw-semibold mb-1" htmlFor={`ty-${f.key}`}>{f.label}</label>
                            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setShowExample((s) => ({ ...s, [f.key]: !s[f.key] }))}>
                              {showExample[f.key] ? 'Hide example' : 'Example'}
                            </button>
                          </div>
                          {showExample[f.key] && <pre className="lp-ty-example">{f.example}</pre>}
                          <textarea
                            id={`ty-${f.key}`}
                            className="form-control lp-ty-code"
                            rows={Math.min(14, Math.max(4, String(values[f.key] || '').split('\n').length + 1))}
                            value={values[f.key]}
                            onChange={set(f.key)}
                            spellCheck={false}
                            placeholder="<script>…</script>"
                          />
                          <div className="form-text d-flex justify-content-between">
                            <span>{f.hint}</span>
                            <span className={String(values[f.key] || '').length > MAX_CODE ? 'text-danger' : ''}>{String(values[f.key] || '').length.toLocaleString()} / {MAX_CODE.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {warnings.length > 0 && (
                    <div className="alert alert-warning small mb-0">
                      <div className="fw-semibold mb-1"><i className="bi bi-exclamation-triangle me-1" />Check these</div>
                      <ul className="mb-0 ps-3">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-xl-5">
              <div className="ta-below-bar" style={{ position: 'sticky' }}>
                <div className="premium-card">
                  <div className="premium-card-header"><h5 className="premium-card-title mb-0">Preview</h5></div>
                  <div className="premium-card-body">
                    {values.enabled ? <ThanksPreview v={values} /> : <div className="text-muted small">The thank-you page is off.</div>}
                  </div>
                </div>
                <div className="premium-card mt-4">
                  <div className="premium-card-header"><h5 className="premium-card-title mb-0">How the tracking works</h5></div>
                  <div className="premium-card-body small">
                    <ol className="ps-3 mb-2">
                      <li className="mb-1">A visitor clicks your ad and opens a landing page: the “every landing page” codes run (the ad click is remembered).</li>
                      <li className="mb-1">They send the form: the lead is saved in CRM → Leads and they are taken to <code>/lp/thank-you?from=&lt;URL name&gt;</code>.</li>
                      <li>The thank-you page runs the conversion code: Google Ads / Meta count one lead.</li>
                    </ol>
                    <div className="text-muted">In Google Ads, use a conversion action of type “Website” with “Page load” on URL contains <code>/lp/thank-you</code>, or the event snippet above. Test with Google Tag Assistant / Meta Pixel Helper after saving. The thank-you page is never indexed by Google.</div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
