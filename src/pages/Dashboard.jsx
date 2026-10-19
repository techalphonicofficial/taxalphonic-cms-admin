import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { AuthService } from '../services/auth.service';
import { useTheme } from '../context/ThemeContext';
import { SITE_URL } from '../config/siteUrl';
import { STORAGE_LABELS } from '../utils/storageLabels';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler);

/**
 * Admin home: one report of the whole CMS (GET /dashboard/stats, backend DashboardController).
 * Every number is a link to the list behind it; tiles the user has no permission for are hidden.
 */

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const formatBytes = (bytes) => {
  if (!bytes) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
};
const timeAgo = (value) => {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)} d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Lead statuses: label, colour (also used by the doughnut) and the CRM filter.
const LEAD_STATUS = [
  { key: 'new', label: 'New', color: '#0e96ac', param: 'NEW' },
  { key: 'contacted', label: 'Contacted', color: '#6366f1', param: 'CONTACTED' },
  { key: 'in_progress', label: 'In follow-up', color: '#f59e0b', param: 'IN_PROGRESS' },
  { key: 'converted', label: 'Converted', color: '#16a34a', param: 'CONVERTED' },
  { key: 'closed', label: 'Closed', color: '#64748b', param: 'CLOSED' },
  { key: 'junk', label: 'Junk', color: '#ef4444', param: 'JUNK' },
];
const statusOf = (status) => LEAD_STATUS.find((s) => s.key === String(status || '').toLowerCase()) || LEAD_STATUS[0];

const ACTIVITY_ICON = { CREATE: 'bi-plus-lg', UPDATE: 'bi-pencil', DELETE: 'bi-trash3', RESTORE: 'bi-arrow-counterclockwise', LOGIN: 'bi-box-arrow-in-right' };

function useCan() {
  return useMemo(() => {
    const user = AuthService.getCurrentUser();
    const isAdmin = user?.role?.name === 'Admin';
    const perms = user?.role?.permissions || [];
    return (module, action = 'read') => !module || isAdmin || perms.some((p) => p.module === module && p.action === action);
  }, []);
}

const Panel = ({ title, icon, link, linkText = 'View all', children, className = '', bodyClass = '' }) => (
  <section className={`dash-panel ${className}`}>
    <header className="dash-panel-head">
      <h3><i className={`bi ${icon}`}></i>{title}</h3>
      {link && <Link to={link} className="dash-link">{linkText} <i className="bi bi-arrow-right-short"></i></Link>}
    </header>
    <div className={`dash-panel-body ${bodyClass}`}>{children}</div>
  </section>
);

const Kpi = ({ to, icon, tone, label, value, sub, progress, trend }) => (
  <Link to={to} className={`dash-kpi tone-${tone}`}>
    <div className="dash-kpi-top">
      <span className="dash-kpi-label">{label}</span>
      <span className="dash-icon"><i className={`bi ${icon}`}></i></span>
    </div>
    <div className="dash-kpi-value">{value}</div>
    {progress != null && (
      <div className="dash-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, progress)}%` }}></span></div>
    )}
    <div className="dash-kpi-sub">
      {trend != null && (
        <span className={`dash-trend ${trend >= 0 ? 'up' : 'down'}`}>
          <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}-right`}></i>{Math.abs(trend)}%
        </span>
      )}
      {sub}
    </div>
  </Link>
);

const Tile = ({ to, icon, tone, label, value, sub }) => (
  <Link to={to} className={`dash-tile tone-${tone}`}>
    <span className="dash-icon"><i className={`bi ${icon}`}></i></span>
    <span className="dash-tile-text">
      <span className="dash-tile-value">{fmt(value)}</span>
      <span className="dash-tile-label">{label}</span>
      {sub && <span className="dash-tile-sub">{sub}</span>}
    </span>
    <i className="bi bi-chevron-right dash-tile-go"></i>
  </Link>
);

const ServiceList = ({ rows }) => (rows.length ? (
  <ul className="dash-rows">
    {rows.map((s) => (
      <li key={s.id}>
        <Link to={`/services/edit/${s.id}`}>
          <span className={`dash-status ${s.status}`} title={s.status}></span>
          <span>{s.title}</span>
          <small>{timeAgo(s.updatedAt)}</small>
        </Link>
      </li>
    ))}
  </ul>
) : <div className="dash-empty">No services yet.</div>);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(30);
  const navigate = useNavigate();
  const can = useCan();
  const { theme } = useTheme();
  const user = AuthService.getCurrentUser();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dark = theme === 'dark';
  const axis = dark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.5)';
  const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';

  // Chart configs are memoised: a new object on every render makes Chart.js restart its animation.
  const charts = useMemo(() => {
    if (!data) return null;
    const series = data.leads.series.slice(-range);
    const statusRows = LEAD_STATUS.map((s) => ({ ...s, count: data.leads.byStatus[s.key] || 0 })).filter((s) => s.count > 0);
    const lineData = {
      labels: series.map((d) => d.label),
      datasets: [{
        label: 'Enquiries',
        data: series.map((d) => d.count),
        borderColor: '#0e96ac',
        // A plain colour: a CanvasGradient here breaks Chart.js' colour animation (charts freeze mid-way).
        backgroundColor: 'rgba(14,150,172,0.14)',
        borderWidth: 2.5,
        pointRadius: range <= 7 ? 4 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0e96ac',
        fill: true,
        tension: 0.35,
      }],
    };
    const lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: axis }, border: { display: false }, grid: { color: grid } },
        x: { ticks: { color: axis, maxRotation: 0, autoSkipPadding: 14 }, border: { display: false }, grid: { display: false } },
      },
    };
    const doughnutData = {
      labels: statusRows.map((s) => s.label),
      datasets: [{ data: statusRows.map((s) => s.count), backgroundColor: statusRows.map((s) => s.color), borderWidth: 0, hoverOffset: 6 }],
    };
    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: '72%',
      plugins: { legend: { display: false } },
      onClick: (_, elements) => {
        if (elements.length) navigate(`/crm/leads?status=${statusRows[elements[0].index].param}`);
      },
    };

      return { lineData, lineOptions, doughnutData, doughnutOptions };
  }, [data, range, axis, grid, navigate]);

  if (loading && !data) {
    return <div className="ta-dash"><div className="dash-loading"><div className="spinner-border text-primary"></div><span>Loading your dashboard…</span></div></div>;
  }
  if (!data) {
    return (
      <div className="ta-dash">
        <div className="dash-panel dash-error">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error || 'Nothing to show.'}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={load}>Try again</button>
        </div>
      </div>
    );
  }

  const { counts: c, leads, media, attention: todo = {}, recentActivity = [], recentServices = [], topBlogs = [] } = data;
  const series = leads.series.slice(-range);
  const rangeTotal = series.reduce((a, d) => a + d.count, 0);
  const statusRows = LEAD_STATUS.map((s) => ({ ...s, count: leads.byStatus[s.key] || 0 })).filter((s) => s.count > 0);
  const sourceMax = Math.max(1, ...leads.bySource.map((s) => s.count));
  const oldServicesLink = c.oldServiceCategoryId ? `/services?category=${c.oldServiceCategoryId}` : '/services';

  const quickActions = [
    { label: 'Add service', icon: 'bi-briefcase', to: '/services/new', module: 'Services', action: 'create' },
    { label: 'New page', icon: 'bi-file-earmark-plus', to: '/pages/new', module: 'CMS', action: 'create' },
    { label: 'Write blog', icon: 'bi-pencil-square', to: '/blogs/new', module: 'Blogs', action: 'create' },
    { label: 'SEO pages', icon: 'bi-diagram-3', to: '/seo-pages/new', module: 'SEO', action: 'create' },
    { label: 'Upload media', icon: 'bi-cloud-arrow-up', to: '/media', module: 'Media', action: 'create' },
  ].filter((a) => can(a.module, a.action));

  const attentionRows = [
    { show: can('CRM'), icon: 'bi-bell', tone: 'teal', label: 'New enquiries waiting', value: todo.newLeads, to: '/crm/leads?status=NEW' },
    { show: can('CRM'), icon: 'bi-exclamation-diamond', tone: 'red', label: 'High-priority leads open', value: todo.highPriorityLeads, to: '/crm/leads' },
    { show: can('Services'), icon: 'bi-pencil', tone: 'amber', label: 'Draft services to review', value: todo.draftServices, to: '/services?status=draft' },
    { show: can('Services'), icon: 'bi-search', tone: 'violet', label: 'Live services missing SEO title / description', value: todo.servicesWithoutSeo, to: '/services?status=published' },
    { show: can('SEO'), icon: 'bi-geo-alt', tone: 'blue', label: 'Draft SEO location pages', value: todo.draftSeoPages, to: '/seo-pages' },
    { show: can('Blogs'), icon: 'bi-journal', tone: 'pink', label: 'Draft blog posts', value: todo.draftBlogs, to: '/blogs' },
    { show: true, icon: 'bi-trash3', tone: 'slate', label: 'Items in Trash', value: todo.trash, to: '/trash' },
  ].filter((r) => r.show && r.value > 0);

  const library = [
    {
      title: 'Services & SEO', tiles: [
        { module: 'Services', to: '/services', icon: 'bi-briefcase', tone: 'teal', label: 'Services', value: c.services.total, sub: `${fmt(c.services.published)} live · ${fmt(c.services.draft)} draft` },
        { module: 'Services', to: '/service-categories', icon: 'bi-tags', tone: 'blue', label: 'Service categories', value: c.serviceCategories },
        { module: 'Services', to: oldServicesLink, icon: 'bi-archive', tone: 'slate', label: 'Old services', value: c.services.old, sub: 'Old data category' },
        { module: 'Packages', to: '/packages', icon: 'bi-box-seam', tone: 'amber', label: 'Packages', value: c.packages.total, sub: `${fmt(c.packages.active)} active` },
        { module: 'Forms', to: '/forms', icon: 'bi-ui-checks', tone: 'violet', label: 'Forms', value: c.forms.total, sub: `${fmt(c.forms.active)} active` },
        { module: 'SEO', to: '/seo-pages', icon: 'bi-diagram-3', tone: 'green', label: 'SEO location pages', value: c.seoPages.total, sub: `${fmt(c.seoPages.published)} live · ${fmt(c.seoPages.indexable)} indexable` },
        { module: 'SEO', to: '/cms/seo', icon: 'bi-search', tone: 'pink', label: 'SEO configs', value: c.seoConfigs.total, sub: `${fmt(c.seoConfigs.active)} active` },
        { module: 'SEO', to: '/locations', icon: 'bi-geo-alt', tone: 'blue', label: 'Locations', value: c.locations, sub: `${fmt(c.states)} states` },
        { module: 'SEO', to: '/industries', icon: 'bi-building', tone: 'slate', label: 'Industries', value: c.industries, sub: `${fmt(c.technologies)} technologies · ${fmt(c.problems)} problems` },
      ],
    },
    {
      title: 'Website content', tiles: [
        { module: 'CMS', to: '/pages', icon: 'bi-file-earmark-text', tone: 'teal', label: 'Pages', value: c.pages.total, sub: `${fmt(c.pages.published)} published` },
        { module: 'Blogs', to: '/blogs', icon: 'bi-journal-richtext', tone: 'pink', label: 'Blog posts', value: c.blogs.total, sub: `${fmt(c.blogs.published)} live · ${fmt(c.blogs.views)} views` },
        { module: 'Portfolio', to: '/portfolio-items', icon: 'bi-collection', tone: 'violet', label: 'Portfolio items', value: c.portfolio.total, sub: `${fmt(c.portfolio.published)} published` },
        { module: 'CMS', to: '/cms/testimonials', icon: 'bi-chat-quote', tone: 'amber', label: 'Testimonials', value: c.testimonials.total, sub: `${fmt(c.testimonials.published)} published` },
        { module: 'CMS', to: '/cms/faqs', icon: 'bi-question-circle', tone: 'blue', label: 'FAQs', value: c.faqs.total, sub: `${fmt(c.faqs.published)} published` },
        { module: 'CMS', to: '/cms/team', icon: 'bi-person-badge', tone: 'green', label: 'Team members', value: c.team.total },
        { module: 'CMS', to: '/cms/banners', icon: 'bi-images', tone: 'red', label: 'Banners', value: c.banners.total, sub: `${fmt(c.banners.published)} published` },
        { module: 'CMS', to: '/cms/partners', icon: 'bi-people', tone: 'slate', label: 'Partners & clients', value: c.partners.total },
        { module: 'CMS', to: '/cms/branches', icon: 'bi-building', tone: 'teal', label: 'Branches', value: c.branches.total, sub: `${fmt(c.countries.total)} countries` },
        { module: 'CMS', to: '/pages/menus', icon: 'bi-list-nested', tone: 'violet', label: 'Menus', value: c.menus.total, sub: `${fmt(c.menus.active)} active` },
      ],
    },
    {
      title: 'Team & access', tiles: [
        { module: 'Users', to: '/users', icon: 'bi-person', tone: 'blue', label: 'Users', value: c.users },
        { module: 'Roles', to: '/roles', icon: 'bi-shield-lock', tone: 'amber', label: 'Roles', value: c.roles },
        { module: 'Media', to: '/media', icon: 'bi-folder2', tone: 'green', label: 'Media folders', value: media.folders },
      ],
    },
  ].map((g) => ({ ...g, tiles: g.tiles.filter((t) => can(t.module)) })).filter((g) => g.tiles.length);

  return (
    <div className="ta-dash">
      {/* Header */}
      <div className="dash-hero">
        <div>
          <div className="dash-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1>{greeting()}, {user?.firstName || 'there'} 👋</h1>
          <p>Here is everything happening on Tax Alphonic. Click any number to open it.</p>
        </div>
        <div className="dash-hero-actions">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="dash-action"><i className={`bi ${a.icon}`}></i>{a.label}</Link>
          ))}
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="dash-action ghost"><i className="bi bi-box-arrow-up-right"></i>View website</a>
          <button type="button" className="dash-action ghost icon-only" onClick={load} disabled={loading} title="Refresh" aria-label="Refresh">
            <i className={`bi bi-arrow-clockwise ${loading ? 'dash-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-kpis">
        {can('CRM') && (
          <Kpi
            to="/crm/leads" icon="bi-envelope-paper" tone="teal" label="Enquiries this month" value={fmt(leads.month)}
            trend={leads.monthChange}
            sub={<span>{leads.monthChange == null ? `${fmt(leads.total)} all time` : `vs ${fmt(leads.lastMonth)} last month`}</span>}
          />
        )}
        {can('Services') && (
          <Kpi
            to="/services?status=published" icon="bi-briefcase" tone="violet" label="Live services" value={fmt(c.services.published)}
            progress={c.services.total ? (c.services.published / c.services.total) * 100 : 0}
            sub={<span>of {fmt(c.services.total)} services · {fmt(c.services.draft)} draft</span>}
          />
        )}
        {can('SEO') && (
          <Kpi
            to="/seo-pages" icon="bi-geo-alt" tone="green" label="SEO location pages live" value={fmt(c.seoPages.published)}
            progress={c.seoPages.total ? (c.seoPages.published / c.seoPages.total) * 100 : 0}
            sub={<span>of {fmt(c.seoPages.total)} generated · {fmt(c.seoPages.indexable)} indexable</span>}
          />
        )}
        {can('CRM') && (
          <Kpi
            to="/crm/leads?status=CONVERTED" icon="bi-trophy" tone="amber" label="Conversion rate" value={`${leads.conversionRate}%`}
            progress={leads.conversionRate}
            sub={<span>{fmt(leads.converted)} converted of {fmt(leads.total)} leads</span>}
          />
        )}
      </div>

      {can('CRM') && (
        <div className="dash-grid g-8-4">
          <Panel title="Enquiries" icon="bi-graph-up-arrow" link="/crm/leads" linkText="Open CRM">
            <div className="dash-chart-head">
              <div className="dash-mini-stats">
                <div><b>{fmt(leads.today)}</b><span>Today</span></div>
                <div><b>{fmt(leads.week)}</b><span>Last 7 days</span></div>
                <div><b>{fmt(rangeTotal)}</b><span>Last {range} days</span></div>
                <div><b>{fmt(leads.total)}</b><span>All time</span></div>
              </div>
              <div className="dash-seg" role="group" aria-label="Range">
                {[7, 14, 30].map((d) => (
                  <button key={d} type="button" className={range === d ? 'active' : ''} onClick={() => setRange(d)}>{d}d</button>
                ))}
              </div>
            </div>
            <div className="dash-chart"><Line data={charts.lineData} options={charts.lineOptions} /></div>
          </Panel>

          <Panel title="Lead status" icon="bi-pie-chart" link="/crm/leads" linkText="All leads">
            {statusRows.length ? (
              <>
                <div className="dash-doughnut">
                  <Doughnut data={charts.doughnutData} options={charts.doughnutOptions} />
                  <div className="dash-doughnut-center"><b>{fmt(leads.total)}</b><span>leads</span></div>
                </div>
                <ul className="dash-legend">
                  {statusRows.map((s) => (
                    <li key={s.key}>
                      <Link to={`/crm/leads?status=${s.param}`}>
                        <span className="dot" style={{ background: s.color }}></span>{s.label}
                        <b>{fmt(s.count)}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : <div className="dash-empty">No enquiries yet.</div>}
          </Panel>
        </div>
      )}

      <div className="dash-grid g-4-8">
        <Panel title="Needs your attention" icon="bi-lightning-charge">
          {attentionRows.length ? (
            <ul className="dash-todo">
              {attentionRows.map((r) => (
                <li key={r.label}>
                  <Link to={r.to} className={`tone-${r.tone}`}>
                    <span className="dash-icon sm"><i className={`bi ${r.icon}`}></i></span>
                    <span className="dash-todo-label">{r.label}</span>
                    <b>{fmt(r.value)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dash-empty"><i className="bi bi-check2-circle"></i>All caught up. Nothing waiting.</div>
          )}
        </Panel>

        {can('CRM') ? (
          <Panel title="Latest enquiries" icon="bi-inbox" link="/crm/leads" bodyClass="p-0">
            {leads.latest.length ? (
              <div className="table-responsive">
                <table className="dash-table">
                  <thead><tr><th>Name</th><th>Source</th><th>Status</th><th className="text-end">Received</th></tr></thead>
                  <tbody>
                    {leads.latest.map((l) => {
                      const s = statusOf(l.status);
                      return (
                        <tr key={l.id} onClick={() => navigate(`/crm/leads?status=${s.param}`)}>
                          <td>
                            <div className="dash-person">
                              <span className="dash-avatar">{(l.name || '?').trim().charAt(0).toUpperCase()}</span>
                              <span>
                                <b>{l.name || 'Unknown'}</b>
                                <small>{l.email || l.phone || '—'}</small>
                              </span>
                            </div>
                          </td>
                          <td><span className="dash-source" title={l.source || ''}>{l.source || l.subject || 'Website'}</span></td>
                          <td className="text-nowrap"><span className="dash-pill" style={{ '--pill': s.color }}>{s.label}</span>{l.priority === 'HIGH' && <span className="dash-pill hot">High</span>}</td>
                          <td className="text-end dash-muted text-nowrap">{timeAgo(l.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <div className="dash-empty">No enquiries yet.</div>}
          </Panel>
        ) : (
          <Panel title="Recently updated services" icon="bi-clock-history" link="/services">
            <ServiceList rows={recentServices} />
          </Panel>
        )}
      </div>

      {/* Everything in the CMS */}
      {library.map((group) => (
        <section className="dash-library" key={group.title}>
          <h2>{group.title}</h2>
          <div className="dash-tiles">
            {group.tiles.map((t) => <Tile key={t.label} {...t} />)}
          </div>
        </section>
      ))}

      <div className="dash-grid g-4-4-4">
        {can('CRM') && (
          <Panel title="Where leads come from" icon="bi-signpost-split" link="/crm/leads">
            {leads.bySource.length ? (
              <ul className="dash-bars">
                {leads.bySource.map((s) => (
                  <li key={s.source}>
                    <div className="dash-bar-label"><span title={s.source}>{s.source}</span><b>{fmt(s.count)}</b></div>
                    <div className="dash-bar"><span style={{ width: `${(s.count / sourceMax) * 100}%` }}></span></div>
                  </li>
                ))}
              </ul>
            ) : <div className="dash-empty">No data yet.</div>}
            {leads.byForm.length > 0 && (
              <>
                <div className="dash-subhead">Top forms</div>
                <ul className="dash-rows">
                  {leads.byForm.map((f) => (
                    <li key={f.formId}>
                      <Link to={`/forms/edit/${f.formId}`}><i className="bi bi-ui-checks"></i><span>{f.name}</span><b>{fmt(f.count)}</b></Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        )}

        {can('Services') && can('CRM') && (
          <Panel title="Recently updated services" icon="bi-clock-history" link="/services">
            <ServiceList rows={recentServices} />
          </Panel>
        )}

        <Panel title="Recent activity" icon="bi-activity" link={can('AuditLogs') ? '/audit-logs' : null}>
          {recentActivity.length ? (
            <ul className="dash-activity">
              {recentActivity.map((a) => (
                <li key={a.id}>
                  <span className={`dash-act-icon act-${String(a.action).toLowerCase()}`}><i className={`bi ${ACTIVITY_ICON[a.action] || 'bi-activity'}`}></i></span>
                  <div>
                    <p>{a.description}</p>
                    <small>{a.user} · {a.module} · {timeAgo(a.time)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : <div className="dash-empty">No activity yet.</div>}
        </Panel>
      </div>

      <div className="dash-grid g-4-8">
        {can('Media') && (
          <Panel title="Media & storage" icon="bi-hdd-stack" link="/media" linkText="Media library">
            <div className="dash-media">
              <div><b>{fmt(media.files)}</b><span>Files</span></div>
              <div><b>{fmt(media.images)}</b><span>Images</span></div>
              <div><b>{fmt(media.folders)}</b><span>Folders</span></div>
              <div><b>{formatBytes(media.bytes)}</b><span>Used</span></div>
            </div>
            <Link to="/media/settings" className="dash-storage">
              <i className="bi bi-cloud-check"></i>
              <span>Files are stored in <b>{STORAGE_LABELS[media.provider] || media.provider}</b></span>
              <i className="bi bi-chevron-right ms-auto"></i>
            </Link>
          </Panel>
        )}

        <Panel title="Shortcuts" icon="bi-compass">
          <div className="dash-shortcuts">
            {[
              { to: '/pages/home', icon: 'bi-house-door', label: 'Home page builder', module: 'CMS' },
              { to: '/about-page', icon: 'bi-person-lines-fill', label: 'About page', module: 'CMS' },
              { to: '/pages/menus', icon: 'bi-list-nested', label: 'Header & footer menus', module: 'CMS' },
              { to: '/seo-pages/ai-settings', icon: 'bi-robot', label: 'AI settings', module: 'SEO' },
              { to: '/settings/organization', icon: 'bi-building', label: 'Organization & logo', module: 'Settings' },
              { to: '/settings/contact', icon: 'bi-telephone', label: 'Contact details', module: 'Settings' },
              { to: '/media/settings', icon: 'bi-cloud-arrow-up', label: 'Media storage', module: 'Media' },
              { to: '/trash', icon: 'bi-trash3', label: 'Trash', module: null },
              { href: `${SITE_URL}/sitemap.xml`, icon: 'bi-diagram-2', label: 'Sitemap', module: null },
            ].filter((s) => can(s.module)).map((s) => (s.href ? (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"><i className={`bi ${s.icon}`}></i>{s.label}<i className="bi bi-box-arrow-up-right ext"></i></a>
            ) : (
              <Link key={s.label} to={s.to}><i className={`bi ${s.icon}`}></i>{s.label}</Link>
            )))}
          </div>
          {topBlogs.length > 0 && can('Blogs') && (
            <>
              <div className="dash-subhead">Most read blog posts</div>
              <ul className="dash-rows">
                {topBlogs.map((b) => (
                  <li key={b.id}><Link to={`/blogs/edit/${b.id}`}><i className="bi bi-journal-text"></i><span>{b.title}</span><b>{fmt(b.viewCount)} views</b></Link></li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="dash-foot">Updated {timeAgo(data.generatedAt)} · numbers include everything not in the Trash</div>
    </div>
  );
};

export default Dashboard;
