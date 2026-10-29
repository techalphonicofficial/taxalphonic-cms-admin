import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { InquiryService } from '../services/inquiry.service';
import { M, can } from '../utils/permissions';
import { isRingReady, playLeadRing, unlockLeadRing } from '../utils/leadRing';

/*
 * New-lead alerts for the whole admin (mounted in AdminLayout, shown by the Header bell).
 * Every POLL_MS it asks GET /inquiries?status=NEW for the newest leads; a lead newer than the
 * last one seen (localStorage, shared by all open tabs) rings, shows a toast, a desktop
 * notification (when allowed and the admin tab is not in front) and "(n)" in the tab title,
 * and fires the window event "ta:new-leads" (LeadsList reloads). The ring repeats every
 * REPEAT_MS (up to MAX_REPEATS) until someone looks: the bell, the toast or the Leads page.
 * Only for users who can read CRM leads. Settings (sound / desktop / repeat) are per browser.
 */

const POLL_MS = 15000;
const REPEAT_MS = 20000;
const MAX_REPEATS = 3;
const SETTINGS_KEY = 'ta-lead-alerts';
const LATEST_KEY = 'ta-lead-latest';
const RUNG_KEY = 'ta-lead-rung';
const DEFAULTS = { sound: true, desktop: true, repeat: true };

const LeadNotificationsContext = createContext(null);

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(store.get(SETTINGS_KEY) || '{}') }; } catch { return DEFAULTS; }
}

export function canReadLeads() {
  return can('read', M.leads);
}

export const leadSourceLabel = (lead) => lead?.form?.name || lead?.source || 'Website';

const leadLink = (lead) => `/crm/leads?status=NEW${lead?.id ? `&lead=${lead.id}` : ''}`;

const desktopPermission = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

function LeadToast({ leads, onOpen }) {
  const first = leads[0];
  return (
    <button type="button" className="ta-lead-toast" onClick={onOpen}>
      <span className="ta-lead-toast-ic"><i className="bi bi-bell-fill"></i></span>
      <span className="ta-lead-toast-body">
        <b>{leads.length > 1 ? `${leads.length} new leads` : 'New lead'}</b>
        <span>{first.name}{first.phone ? ` · ${first.phone}` : ''}</span>
        <small>{leadSourceLabel(first)}{leads.length > 1 ? ` and ${leads.length - 1} more` : ''} · click to open</small>
      </span>
    </button>
  );
}

export function LeadNotificationsProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const enabled = useMemo(() => canReadLeads(), []);

  const [leads, setLeads] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [unseen, setUnseen] = useState(0);
  const [settings, setSettings] = useState(readSettings);
  const [soundReady, setSoundReady] = useState(isRingReady());
  const [permission, setPermission] = useState(desktopPermission());

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const repeat = useRef({ timer: null, count: 0 });
  const baseTitle = useRef(document.title.replace(/^\(\d+\+?\) /, ''));

  const stopRepeat = useCallback(() => {
    clearInterval(repeat.current.timer);
    repeat.current = { timer: null, count: 0 };
  }, []);

  const acknowledge = useCallback(() => {
    stopRepeat();
    setUnseen(0);
  }, [stopRepeat]);

  const openLeads = useCallback((lead) => {
    acknowledge();
    navigate(leadLink(lead));
  }, [acknowledge, navigate]);

  const alertFor = useCallback((fresh, { ring }) => {
    setUnseen((n) => n + fresh.length);
    window.dispatchEvent(new CustomEvent('ta:new-leads', { detail: { leads: fresh } }));

    const s = settingsRef.current;
    let heard = true;
    if (ring && s.sound) {
      heard = playLeadRing({ times: 2 });
      stopRepeat();
      if (s.repeat) {
        repeat.current.timer = setInterval(() => {
          repeat.current.count += 1;
          if (repeat.current.count > MAX_REPEATS) { stopRepeat(); return; }
          playLeadRing({ times: 1 });
        }, REPEAT_MS);
      }
    }

    toast(<LeadToast leads={fresh} onOpen={() => openLeads(fresh[0])} />, {
      toastId: `lead-${fresh[0].id}`,
      autoClose: 15000,
      closeOnClick: true,
      className: 'ta-lead-toast-wrap',
    });
    if (ring && s.sound && !heard) {
      toast.info('🔇 Click anywhere in the admin once so the new-lead ring can play.', { toastId: 'lead-sound-blocked', autoClose: 8000 });
    }

    const showDesktop = ring && s.desktop && desktopPermission() === 'granted' && (document.hidden || !document.hasFocus());
    if (showDesktop) {
      const first = fresh[0];
      try {
        const note = new Notification(fresh.length > 1 ? `${fresh.length} new leads` : `New lead: ${first.name}`, {
          body: [first.phone, first.email, leadSourceLabel(first)].filter(Boolean).join(' · '),
          tag: 'ta-new-lead',
          renotify: true,
          requireInteraction: true,
        });
        note.onclick = () => { window.focus(); openLeads(first); note.close(); };
      } catch { /* some browsers only allow notifications from a service worker */ }
    }
  }, [openLeads, stopRepeat]);

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await InquiryService.getAll({ status: 'NEW', limit: 10, page: 1, sortBy: 'createdAt', sortOrder: 'DESC' });
      const items = Array.isArray(res?.data) ? res.data : [];
      setLeads(items);
      setNewCount(res?.pagination?.totalItems ?? res?.pagination?.total ?? items.length);

      const newest = items[0]?.createdAt;
      const seen = store.get(LATEST_KEY);
      if (!seen) {
        // First run in this browser: older leads are not "new".
        store.set(LATEST_KEY, newest || '1970-01-01T00:00:00.000Z');
        return;
      }
      const fresh = items.filter((lead) => new Date(lead.createdAt) > new Date(seen));
      if (!fresh.length) return;
      store.set(LATEST_KEY, fresh[0].createdAt);
      // Several admin tabs: only the first one to see this lead rings.
      const ring = store.get(RUNG_KEY) !== fresh[0].id;
      store.set(RUNG_KEY, fresh[0].id);
      alertFor(fresh, { ring });
    } catch {
      /* offline / logged out: try again on the next tick */
    }
  }, [enabled, alertFor]);

  // Poll, and right away when the tab comes back to the front.
  useEffect(() => {
    if (!enabled) return undefined;
    poll();
    const timer = setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      stopRepeat();
    };
  }, [enabled, poll, stopRepeat]);

  // Sound is allowed only after a click / key press on the page.
  useEffect(() => {
    if (!enabled) return undefined;
    const unlock = () => {
      unlockLeadRing();
      setTimeout(() => setSoundReady(isRingReady()), 50);
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, [enabled]);

  // Looking at the Leads page counts as seen.
  useEffect(() => {
    if (location.pathname.startsWith('/crm')) acknowledge();
  }, [location.pathname, acknowledge]);

  // "(2) Tax Alphonic CMS" while there are leads nobody has looked at.
  useEffect(() => {
    document.title = unseen > 0 ? `(${unseen > 99 ? '99+' : unseen}) ${baseTitle.current}` : baseTitle.current;
  }, [unseen]);

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      store.set(SETTINGS_KEY, JSON.stringify(next));
      if (key === 'sound' && !value) stopRepeat();
      return next;
    });
  }, [stopRepeat]);

  const requestDesktop = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') setSetting('desktop', true);
    return result;
  }, [setSetting]);

  const testRing = useCallback(() => {
    unlockLeadRing();
    setTimeout(() => {
      const ok = playLeadRing({ times: 1 });
      setSoundReady(isRingReady());
      if (!ok) toast.info('Your browser blocked the sound. Click on the page and try again.');
    }, 60);
  }, []);

  const value = useMemo(() => ({
    enabled, leads, newCount, unseen, settings, soundReady, permission,
    acknowledge, openLeads, setSetting, requestDesktop, testRing, refresh: poll,
  }), [enabled, leads, newCount, unseen, settings, soundReady, permission, acknowledge, openLeads, setSetting, requestDesktop, testRing, poll]);

  return <LeadNotificationsContext.Provider value={value}>{children}</LeadNotificationsContext.Provider>;
}

export const useLeadNotifications = () => useContext(LeadNotificationsContext);
