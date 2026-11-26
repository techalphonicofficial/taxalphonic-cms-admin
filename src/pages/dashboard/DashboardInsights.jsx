import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../../services/api';
import { canOpen } from '../../utils/permissions';
import { Panel, Kpi, fmt, timeAgo, dateTime } from './dashParts';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * Dashboard reports for running the business and watching the team (backend
 * controllers/dashboardInsights.js, part of GET /dashboard/stats):
 * - MyAccount: the logged-in user's previous login, failed attempts, own work, own logins.
 * - BusinessSection (CRM read): pipeline, waiting / unassigned leads, 12-month trend, what people
 *   ask for, best time for enquiries (India time), team pipeline, newsletter.
 * - TeamSection (Users or AuditLogs read): who is online, last seen / last login, logins,
 *   changes per person, failed logins, latest logins with device + IP. Refreshes every minute
 *   (GET /dashboard/team); "online" = used the admin in the last 5 minutes (AdminLayout heartbeat).
 */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
const initial = (name) => String(name || '?').trim().charAt(0).toUpperCase();

function chartColors(dark) {
  return { axis: dark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.5)', grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' };
}

// ---- Your account --------------------------------------------------------------------------

export const MyAccount = ({ me, showLeads }) => {
  const [open, setOpen] = useState(false);
  if (!me) return null;
  const current = me.currentLogin;
  const prev = me.previousLogin;
  return (
    <section className="dash-me">
      <div className="dash-me-row">
        <div className="dash-me-main tone-blue">
          <span className="dash-icon sm"><i className="bi bi-shield-check"></i></span>
          <div>
            <b>Your account</b>
            <small>
              {current ? <>Signed in {timeAgo(current.time)} · {current.device}{current.ip ? ` · IP ${current.ip}` : ''}</> : 'Signed in'}
            </small>
            <small>
              {prev ? <>Previous login: {dateTime(prev.time)} · {prev.device}{prev.ip ? ` · IP ${prev.ip}` : ''}</> : 'This is your first recorded login.'}
            </small>
          </div>
        </div>
        <div className="dash-me-stats">
          <div><b>{fmt(me.actionsToday)}</b><span>Your changes today</span></div>
          <div><b>{fmt(me.actions7)}</b><span>Last 7 days</span></div>
          {showLeads && (
            <Link to="/crm/leads"><b>{fmt(me.leads?.open)}</b><span>Leads assigned to you{me.leads?.new ? ` · ${fmt(me.leads.new)} new` : ''}</span></Link>
          )}
          {showLeads && <div><b>{fmt(me.leads?.converted)}</b><span>You converted</span></div>}
        </div>
        <button type="button" className="dash-me-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Hide' : 'Your logins & work'} <i className={`bi bi-chevron-${open ? 'up' : 'down'}`}></i>
        </button>
      </div>
      {me.failedSinceLogin > 0 && (
        <div className="dash-me-alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {fmt(me.failedSinceLogin)} failed login attempt{me.failedSinceLogin > 1 ? 's' : ''} on your account. Not you? <Link to="/profile">Change your password</Link>.
        </div>
      )}
      {open && (
        <div className="dash-me-more">
          <div>
            <div className="dash-subhead mt-0">Your recent logins</div>
            <ul className="dash-rows">
              {me.logins.map((l) => (
                <li key={l.id}>
                  <span className="dash-row-static">
                    <i className={`bi ${l.mobile ? 'bi-phone' : 'bi-laptop'}`}></i>
                    <span>{l.device}{l.ip ? ` · ${l.ip}` : ''}{l.status === 'FAILED' && <span className="dash-pill hot">Failed</span>}</span>
                    <small>{dateTime(l.time)}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="dash-subhead mt-0">Your recent changes</div>
            {me.recent.length ? (
              <ul className="dash-rows">
                {me.recent.map((a) => (
                  <li key={a.id}><span className="dash-row-static"><i className="bi bi-pencil"></i><span>{a.description}</span><small>{timeAgo(a.time)}</small></span></li>
                ))}
              </ul>
            ) : <div className="dash-empty">No changes yet.</div>}
          </div>
        </div>
      )}
    </section>
  );
};

// ---- Business ------------------------------------------------------------------------------

const PIPELINE = [
  { key: 'new', label: 'New', color: '#0e96ac', param: 'NEW' },
  { key: 'contacted', label: 'Contacted', color: '#6366f1', param: 'CONTACTED' },
  { key: 'in_progress', label: 'In follow-up', color: '#f59e0b', param: 'IN_PROGRESS' },
  { key: 'converted', label: 'Converted (won)', color: '#16a34a', param: 'CONVERTED' },
];

export const BusinessSection = ({ business: b, leads, dark }) => {
  const navigate = useNavigate();
  const { axis, grid } = chartColors(dark);

  const chart = useMemo(() => {
    if (!b) return null;
    return {
      data: {
        labels: b.months.map((m) => m.label),
        datasets: [
          { label: 'Enquiries', data: b.months.map((m) => m.leads), backgroundColor: 'rgba(14,150,172,0.75)', borderRadius: 6, maxBarThickness: 26 },
          { label: 'Converted', data: b.months.map((m) => m.converted), backgroundColor: 'rgba(22,163,74,0.85)', borderRadius: 6, maxBarThickness: 26 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { position: 'bottom', labels: { color: axis, boxWidth: 10, boxHeight: 10, usePointStyle: true } }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0, color: axis }, border: { display: false }, grid: { color: grid } },
          x: { ticks: { color: axis, maxRotation: 0, autoSkipPadding: 8 }, border: { display: false }, grid: { display: false } },
        },
      },
    };
  }, [b, axis, grid]);

  if (!b) return null;

  const yearLeads = b.months.reduce((a, m) => a + m.leads, 0);
  const yearWon = b.months.reduce((a, m) => a + m.converted, 0);
  const best = b.months.reduce((top, m) => (m.leads > (top?.leads || 0) ? m : top), null);
  const total = Math.max(1, leads.total);
  const lost = (leads.byStatus.closed || 0) + (leads.byStatus.junk || 0);
  const topicMax = Math.max(1, ...b.topics.map((t) => t.count));
  const news = b.newsletter;
  const newsTrend = news && news.lastMonth ? Math.round(((news.month - news.lastMonth) / news.lastMonth) * 100) : null;

  // Heat map in 2-hour slots (India time, last 90 days).
  const slots = Array.from({ length: 12 }, (_, i) => i * 2);
  const cell = (d, h) => (b.heat[d]?.[h] || 0) + (b.heat[d]?.[h + 1] || 0);
  const cellMax = Math.max(1, ...DAYS.flatMap((_, d) => slots.map((h) => cell(d, h))));

  return (
    <>
      <h2 className="dash-section-title"><i className="bi bi-graph-up-arrow"></i>Business overview</h2>
      <div className="dash-kpis">
        <Kpi to="/crm/leads" icon="bi-kanban" tone="violet" label="Open leads (pipeline)" value={fmt(b.open)} sub={<span>New, contacted or in follow-up</span>} />
        <Kpi
          to="/crm/leads?status=NEW" icon={b.waiting ? 'bi-alarm' : 'bi-check2-circle'} tone={b.waiting ? 'red' : 'green'}
          label="Waiting more than 24 h" value={fmt(b.waiting)}
          sub={<span>{b.waiting ? 'New leads nobody has contacted yet' : 'Every lead got a reply in time'}</span>}
        />
        <Kpi to="/crm/leads" icon="bi-person-dash" tone={b.unassigned ? 'amber' : 'green'} label="Open leads not assigned" value={fmt(b.unassigned)} sub={<span>Assign them in CRM so someone follows up</span>} />
        {news && (
          <Kpi to="/crm/newsletter" icon="bi-envelope-heart" tone="pink" label="Newsletter subscribers" value={fmt(news.total)} trend={newsTrend} sub={<span>{fmt(news.month)} joined this month</span>} />
        )}
      </div>

      <div className="dash-grid g-8-4">
        <Panel title="Enquiries & conversions, last 12 months" icon="bi-bar-chart-line" link="/crm/leads" linkText="Open CRM">
          <div className="dash-mini-stats mb-2">
            <div><b>{fmt(yearLeads)}</b><span>Enquiries in 12 months</span></div>
            <div><b>{fmt(yearWon)}</b><span>Converted</span></div>
            <div><b>{yearLeads ? Math.round((yearWon / yearLeads) * 100) : 0}%</b><span>Conversion</span></div>
            {best && <div><b>{best.label}</b><span>Best month ({fmt(best.leads)})</span></div>}
          </div>
          <div className="dash-chart"><Bar data={chart.data} options={chart.options} /></div>
        </Panel>

        <Panel title="Sales pipeline" icon="bi-funnel" link="/crm/leads" linkText="All leads">
          <ul className="dash-funnel">
            {PIPELINE.map((s) => {
              const n = leads.byStatus[s.key] || 0;
              return (
                <li key={s.key}>
                  <Link to={`/crm/leads?status=${s.param}`}>
                    <div className="dash-bar-label"><span>{s.label}</span><b>{fmt(n)} <small>{Math.round((n / total) * 100)}%</small></b></div>
                    <div className="dash-bar"><span style={{ width: `${(n / total) * 100}%`, background: s.color }}></span></div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="dash-funnel-foot">
            <span><i className="bi bi-trophy text-success"></i> Win rate <b>{leads.conversionRate}%</b></span>
            <Link to="/crm/leads?status=CLOSED"><i className="bi bi-x-circle"></i> Lost / closed / junk <b>{fmt(lost)}</b></Link>
          </div>
        </Panel>
      </div>

      <div className="dash-grid g-4-4-4">
        <Panel title="What people ask for (30 days)" icon="bi-briefcase">
          {b.topics.length ? (
            <ul className="dash-bars">
              {b.topics.map((t) => (
                <li key={t.topic}>
                  <div className="dash-bar-label"><span title={t.topic}>{t.topic}</span><b>{fmt(t.count)}</b></div>
                  <div className="dash-bar"><span style={{ width: `${(t.count / topicMax) * 100}%` }}></span></div>
                </li>
              ))}
            </ul>
          ) : <div className="dash-empty">No enquiries in the last 30 days.</div>}
        </Panel>

        <Panel title="Best time for enquiries" icon="bi-clock">
          {b.heatMax ? (
            <>
              <p className="dash-note">
                Most enquiries come on <b>{DAY_NAMES[b.bestDay]}</b>, around <b>{hourLabel(b.bestHour)} – {hourLabel((b.bestHour + 1) % 24)}</b> (India time, last 90 days). Keep someone ready to call back then.
              </p>
              <div className="dash-heat" role="table" aria-label="Enquiries by day and time">
                <span></span>
                {slots.map((h) => <span key={h} className="dash-heat-h">{h % 6 === 0 ? hourLabel(h).replace(' ', '') : ''}</span>)}
                {DAYS.map((d, di) => (
                  <React.Fragment key={d}>
                    <span className="dash-heat-d">{d}</span>
                    {slots.map((h) => {
                      const n = cell(di, h);
                      return (
                        <span
                          key={h}
                          className="dash-heat-c"
                          style={{ '--a': n ? 0.15 + (n / cellMax) * 0.85 : 0 }}
                          title={`${DAY_NAMES[di]} ${hourLabel(h)}–${hourLabel((h + 2) % 24)}: ${n} enquir${n === 1 ? 'y' : 'ies'}`}
                        ></span>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : <div className="dash-empty">Not enough enquiries yet.</div>}
        </Panel>

        <Panel title="Team pipeline" icon="bi-people" link="/crm/leads" linkText="CRM">
          {b.team.length ? (
            <table className="dash-table compact">
              <thead><tr><th>Person</th><th className="text-end">Open</th><th className="text-end">Won</th><th className="text-end">Win %</th></tr></thead>
              <tbody>
                {b.team.map((p) => (
                  <tr key={p.userId} onClick={() => navigate('/crm/leads')}>
                    <td><div className="dash-person"><span className="dash-avatar sm">{initial(p.name)}</span><span><b>{p.name}</b><small>{fmt(p.total)} leads</small></span></div></td>
                    <td className="text-end"><b>{fmt(p.open)}</b></td>
                    <td className="text-end">{fmt(p.converted)}</td>
                    <td className="text-end">{p.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="dash-empty"><i className="bi bi-person-plus text-secondary"></i>No leads are assigned yet. Assign leads in CRM to see who is following up and who converts best.</div>
          )}
          {b.pendingComments > 0 && (
            <Link to="/blogs/comments" className="dash-storage mt-3"><i className="bi bi-chat-dots"></i><span><b>{fmt(b.pendingComments)}</b> blog comment{b.pendingComments > 1 ? 's' : ''} waiting for approval</span><i className="bi bi-chevron-right ms-auto"></i></Link>
          )}
        </Panel>
      </div>
    </>
  );
};

// ---- Team & logins -------------------------------------------------------------------------

export const TeamSection = ({ initial: first, dark }) => {
  const [team, setTeam] = useState(first);
  const [updated, setUpdated] = useState(() => Date.now());
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { axis, grid } = chartColors(dark);

  useEffect(() => { setTeam(first); setUpdated(Date.now()); }, [first]);

  // "Online now" changes by the minute: refresh only this part.
  useEffect(() => {
    if (!first) return undefined;
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await api.get('/dashboard/team');
        if (res.data?.data) { setTeam(res.data.data); setUpdated(Date.now()); }
      } catch { /* keep the last numbers */ }
    }, 60000);
    return () => clearInterval(timer);
  }, [first]);

  const chart = useMemo(() => (team ? {
    data: {
      labels: team.activity.map((d) => d.label),
      datasets: [{ label: 'Changes', data: team.activity.map((d) => d.count), backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 5, maxBarThickness: 18 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { intersect: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: axis }, border: { display: false }, grid: { color: grid } },
        x: { ticks: { color: axis, maxRotation: 0, autoSkipPadding: 6 }, border: { display: false }, grid: { display: false } },
      },
    },
  } : null), [team, axis, grid]);

  if (!team) return null;
  const canEdit = canOpen('/users');
  const members = team.members.filter((m) => (filter === 'online' ? m.online : filter === 'inactive' ? !m.isActive : true));

  return (
    <>
      <h2 className="dash-section-title">
        <i className="bi bi-people"></i>Team & logins
        <span className="dash-section-note">Live · updated {timeAgo(updated)}</span>
      </h2>
      <div className="dash-kpis">
        <Kpi icon="bi-broadcast" tone="green" label="Online now" value={fmt(team.online)} sub={<span>of {fmt(team.active)} active users · used the admin in the last 5 min</span>} />
        <Kpi icon="bi-box-arrow-in-right" tone="blue" label="Logins today" value={fmt(team.loginsToday)} sub={<span>Successful sign-ins since midnight</span>} />
        <Kpi
          icon={team.failed24 ? 'bi-shield-exclamation' : 'bi-shield-check'} tone={team.failed24 ? 'red' : 'green'}
          label="Failed logins (24 h)" value={fmt(team.failed24)}
          sub={<span>{fmt(team.failed7)} in the last 7 days{team.failed24 >= 5 ? ' · check the list below' : ''}</span>}
        />
        <Kpi to={canOpen('/audit-logs') ? '/audit-logs' : undefined} icon="bi-pencil-square" tone="violet" label="Changes in 7 days" value={fmt(team.actions7)} sub={<span>Creates, edits and deletes by the team</span>} />
      </div>

      <div className="dash-grid g-8-4">
        <Panel
          title="Team members" icon="bi-person-lines-fill" link={canEdit ? '/users' : null} linkText="Manage users" bodyClass="p-0"
          extra={(
            <div className="dash-seg ms-auto" role="group" aria-label="Show">
              {[['all', 'All'], ['online', 'Online'], ['inactive', 'Deactivated']].map(([k, label]) => (
                <button key={k} type="button" className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{label}</button>
              ))}
            </div>
          )}
        >
          {members.length ? (
            <div className="table-responsive">
              <table className="dash-table">
                <thead><tr><th>User</th><th>Status</th><th>Last login</th><th className="text-end">Logins (30 d)</th><th className="text-end">Changes (7 d)</th></tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} onClick={canEdit ? () => navigate(`/users/edit/${m.id}`) : undefined} style={canEdit ? undefined : { cursor: 'default' }}>
                      <td>
                        <div className="dash-person">
                          <span className="dash-avatar">{initial(m.name)}<span className={`dash-presence ${m.online ? 'on' : ''}`}></span></span>
                          <span><b>{m.name}</b><small>{m.role} · {m.email}</small></span>
                        </div>
                      </td>
                      <td className="text-nowrap">
                        {!m.isActive ? <span className="dash-pill" style={{ '--pill': '#64748b' }}>Deactivated</span>
                          : m.online ? <span className="dash-pill" style={{ '--pill': '#16a34a' }}>Online{m.device ? ` · ${m.device}` : ''}</span>
                            : <span className="dash-muted">Seen {timeAgo(m.lastSeen)}</span>}
                      </td>
                      <td className="dash-muted text-nowrap">{dateTime(m.lastLoginAt)}</td>
                      <td className="text-end">{fmt(m.logins30)}</td>
                      <td className="text-end"><b>{fmt(m.actions7)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="dash-empty">{filter === 'online' ? 'Nobody else is online right now.' : 'No users here.'}</div>}
        </Panel>

        <Panel title="Team activity, 14 days" icon="bi-activity" link={canOpen('/audit-logs') ? '/audit-logs' : null} linkText="Audit log">
          <div className="dash-chart sm"><Bar data={chart.data} options={chart.options} /></div>
          <div className="dash-subhead">Most active this week</div>
          <ul className="dash-rows">
            {[...team.members].filter((m) => m.actions7 > 0).sort((a, b) => b.actions7 - a.actions7).slice(0, 4).map((m) => (
              <li key={m.id}><span className="dash-row-static"><span className="dash-avatar xs">{initial(m.name)}</span><span>{m.name}</span><b>{fmt(m.actions7)}</b></span></li>
            ))}
            {!team.members.some((m) => m.actions7 > 0) && <li className="dash-muted small px-1">No changes this week.</li>}
          </ul>
        </Panel>
      </div>

      <Panel title="Latest logins" icon="bi-door-open" bodyClass="p-0" className="mb-4">
        {team.recentLogins.length ? (
          <div className="table-responsive">
            <table className="dash-table">
              <thead><tr><th>User</th><th>Result</th><th>Device</th><th>IP address</th><th className="text-end">When</th></tr></thead>
              <tbody>
                {team.recentLogins.map((l) => (
                  <tr key={l.id} style={{ cursor: 'default' }}>
                    <td><div className="dash-person"><span className="dash-avatar sm">{initial(l.name)}</span><span><b>{l.name}</b><small>{l.email}</small></span></div></td>
                    <td className="text-nowrap">
                      {l.status === 'SUCCESS'
                        ? <span className="dash-pill" style={{ '--pill': '#16a34a' }}><i className="bi bi-check2 me-1"></i>Signed in</span>
                        : <span className="dash-pill" style={{ '--pill': '#dc2626' }} title={l.reason || ''}><i className="bi bi-x me-1"></i>{/password/i.test(l.reason || '') ? 'Wrong password' : 'Failed'}</span>}
                    </td>
                    <td className="text-nowrap"><i className={`bi ${l.mobile ? 'bi-phone' : 'bi-laptop'} me-1 dash-muted`}></i>{l.device}</td>
                    <td className="dash-muted text-nowrap">{l.ip || '—'}</td>
                    <td className="text-end dash-muted text-nowrap" title={dateTime(l.time)}>{timeAgo(l.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="dash-empty">No logins recorded yet.</div>}
      </Panel>
    </>
  );
};
