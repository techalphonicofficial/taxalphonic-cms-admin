import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import { InquiryService } from '../../services/inquiry.service';
import { toast } from 'react-toastify';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import { confirmDialog, confirmDelete } from '../../components/common/confirm';
import { M, can } from '../../utils/permissions';

const STATUS_CONFIG = {
  NEW: { label: 'New', bg: 'danger', icon: 'bi-bell-fill' },
  CONTACTED: { label: 'Contacted', bg: 'warning', icon: 'bi-telephone-fill' },
  IN_PROGRESS: { label: 'In Progress', bg: 'primary', icon: 'bi-hourglass-split' },
  CONVERTED: { label: 'Converted', bg: 'success', icon: 'bi-check-circle-fill' },
  CLOSED: { label: 'Closed', bg: 'secondary', icon: 'bi-archive-fill' },
  JUNK: { label: 'Junk / Spam', bg: 'dark', icon: 'bi-trash-fill' }
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', bg: 'secondary' },
  MEDIUM: { label: 'Medium', bg: 'info' },
  HIGH: { label: 'High', bg: 'danger' }
};

const LeadsList = () => {
  // Buttons follow the role (backend: CRM / Inquiries update and delete).
  const canUpdate = can('update', M.leads);
  const canDelete = can('delete', M.leads);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatusParam = searchParams.get('status') || 'ALL';
  const currentFormIdParam = searchParams.get('formId') || '';

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, inProgress: 0, converted: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 15 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [availableSources, setAvailableSources] = useState([]);

  // Modal State
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [modalStatus, setModalStatus] = useState('NEW');
  const [modalPriority, setModalPriority] = useState('MEDIUM');
  const [isUpdating, setIsUpdating] = useState(false);

  // Selection State
  const [selectedLeads, setSelectedLeads] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await InquiryService.getStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch lead stats:', err);
    }
  }, []);

  const fetchLeads = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      if (currentStatusParam && currentStatusParam !== 'ALL') {
        params.status = currentStatusParam;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (sourceFilter && sourceFilter !== 'ALL') {
        params.source = sourceFilter;
      }
      if (currentFormIdParam) {
        params.formId = currentFormIdParam;
      }

      const res = await InquiryService.getAll(params);
      const items = res?.data || [];
      setLeads(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }

      // Collect unique sources
      const sources = new Set();
      items.forEach(item => { if (item.source) sources.add(item.source); });
      setAvailableSources(prev => Array.from(new Set([...prev, ...sources])));
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      toast.error('Failed to load leads.');
    } finally {
      setIsLoading(false);
    }
  }, [currentStatusParam, currentFormIdParam, searchQuery, sourceFilter]);

  useEffect(() => {
    fetchStats();
    fetchLeads(1);
  }, [fetchStats, fetchLeads]);

  // A new lead arrived (LeadNotificationsContext): reload the counts and the first page.
  useEffect(() => {
    const onNewLeads = () => {
      fetchStats();
      if ((pagination.currentPage || 1) === 1) fetchLeads(1);
    };
    window.addEventListener('ta:new-leads', onNewLeads);
    return () => window.removeEventListener('ta:new-leads', onNewLeads);
  }, [fetchStats, fetchLeads, pagination.currentPage]);

  // ?lead=<id> (from the bell, a toast or a desktop notification) opens that lead.
  const leadParam = searchParams.get('lead');
  useEffect(() => {
    if (!leadParam) return;
    let cancelled = false;
    InquiryService.getById(leadParam)
      .then((res) => { if (!cancelled && res?.data) handleOpenModal(res.data); })
      .catch(() => { if (!cancelled) toast.error('That lead could not be opened (deleted, or no access).'); })
      .finally(() => {
        if (cancelled) return;
        const next = new URLSearchParams(searchParams);
        next.delete('lead');
        setSearchParams(next, { replace: true });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadParam]);

  const handleStatusTabChange = (status) => {
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const handleQuickStatusChange = async (leadId, newStatus) => {
    try {
      await InquiryService.update(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success(`Lead status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchStats();
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleOpenModal = (lead) => {
    setSelectedLead(lead);
    setModalNotes(lead.notes || '');
    setModalStatus(lead.status || 'NEW');
    setModalPriority(lead.priority || 'MEDIUM');
    setShowModal(true);
  };

  const handleSaveModal = async () => {
    if (!selectedLead) return;
    setIsUpdating(true);
    try {
      await InquiryService.update(selectedLead.id, {
        status: modalStatus,
        priority: modalPriority,
        notes: modalNotes
      });

      setLeads(prev => prev.map(l => l.id === selectedLead.id ? {
        ...l,
        status: modalStatus,
        priority: modalPriority,
        notes: modalNotes
      } : l));

      toast.success('Lead updated successfully.');
      setShowModal(false);
      fetchStats();
    } catch (err) {
      console.error('Modal save failed:', err);
      toast.error('Failed to save changes.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (lead) => {
    if ((await confirmDelete(null, { what: 'inquiry', extra: `The inquiry from ${lead.name} will be removed from the CRM.` }))) {
      try {
        await InquiryService.delete(lead.id);
        toast.success('Inquiry deleted.');
        fetchLeads(pagination.currentPage);
        fetchStats();
      } catch (err) {
        console.error('Delete failed:', err);
        toast.error('Failed to delete inquiry.');
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelect = (e, id) => {
    if (e.target.checked) {
      setSelectedLeads(prev => [...prev, id]);
    } else {
      setSelectedLeads(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if ((await confirmDialog({ title: `Delete ${selectedLeads.length} selected leads?`, message: 'They will be removed from the CRM.', note: 'This cannot be undone.', confirmText: 'Delete' }))) {
      setIsUpdating(true);
      try {
        await Promise.all(selectedLeads.map(id => InquiryService.delete(id)));
        toast.success(`${selectedLeads.length} leads deleted successfully.`);
        setSelectedLeads([]);
        fetchLeads(pagination.currentPage);
        fetchStats();
      } catch (err) {
        console.error('Bulk delete failed:', err);
        toast.error('Failed to delete some leads.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) {
      toast.warn('No leads to export.');
      return;
    }

    const headers = ['Date', 'Name', 'Email', 'Phone', 'Website', 'Subject', 'Source', 'Status', 'Priority', 'Message', 'Notes'];
    const rows = leads.map(l => [
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      `"${(l.source || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported to CSV successfully.');
  };

  return (
    <div className="container-fluid p-0">
      <Breadcrumb
        items={[
          { label: 'CRM', path: '/crm/leads' },
          { label: 'Lead Management', active: true }
        ]}
      />

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Lead Management System</h4>
          <p className="text-muted small mb-0">Capture, qualify, track, and convert visitor queries from digitalprisma.com</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={exportToCSV} className="d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-arrow-down"></i> Export CSV
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => { fetchStats(); fetchLeads(1); }} className="d-flex align-items-center gap-2">
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 rounded-4 h-100 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase tracking-wider">Total Inquiries</span>
                <h2 className="fw-bolder mt-2 mb-0 text-dark">{stats.total}</h2>
              </div>
              <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary fs-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-inbox-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 rounded-4 h-100 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase tracking-wider">New / Uncontacted</span>
                <h2 className="fw-bolder mt-2 mb-0 text-danger">{stats.new}</h2>
              </div>
              <div className="rounded-circle p-3 bg-danger bg-opacity-10 text-danger fs-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-bell-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 rounded-4 h-100 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase tracking-wider">In Follow-Up</span>
                <h2 className="fw-bolder mt-2 mb-0 text-warning">{(stats.contacted || 0) + (stats.inProgress || 0)}</h2>
              </div>
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning fs-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-hourglass-split"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 rounded-4 h-100 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase tracking-wider">Converted Deals</span>
                <h2 className="fw-bolder mt-2 mb-0 text-success">{stats.converted}</h2>
              </div>
              <div className="rounded-circle p-3 bg-success bg-opacity-10 text-success fs-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-check-circle-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card border-0 rounded-4 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="card-header bg-transparent border-bottom-0 p-4 pb-2">
          {/* Status Tabs */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {['ALL', 'NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED', 'JUNK'].map(st => (
              <button
                key={st}
                className={`btn btn-sm px-3 rounded-pill fw-medium ${currentStatusParam === st ? 'btn-primary shadow text-white' : 'btn-light text-secondary border'}`}
                style={{ transition: 'all 0.2s' }}
                onClick={() => handleStatusTabChange(st)}
              >
                {st === 'ALL' ? 'All Leads' : STATUS_CONFIG[st]?.label || st}
                {st === 'NEW' && stats.new > 0 && (
                  <span className="badge bg-danger ms-2 rounded-pill shadow-sm">{stats.new}</span>
                )}
              </button>
            ))}
          </div>

          {currentFormIdParam && (
            <div className="mb-3">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">
                <i className="bi bi-ui-checks me-1"></i>
                Form: {leads.find(l => l.form)?.form?.name || 'Selected form'}
                <button
                  type="button"
                  className="btn btn-link p-0 ms-2 text-primary text-decoration-none"
                  title="Clear form filter"
                  onClick={() => { searchParams.delete('formId'); setSearchParams(searchParams); }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            </div>
          )}

          {/* Search and Source Filter Row */}
          <div className="row g-3 align-items-center mb-2">
            <div className="col-md-5">
              <div className="d-flex align-items-center bg-light border rounded-pill px-3 py-1">
                <i className="bi bi-search text-muted me-2"></i>
                <input
                  type="text"
                  className="form-control form-control-sm bg-transparent border-0 shadow-none px-0"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchLeads(1); }}
                />
                {searchQuery && (
                  <button className="btn btn-link text-muted p-0 ms-2 text-decoration-none" onClick={() => { setSearchQuery(''); fetchLeads(1); }}>
                    <i className="bi bi-x-circle-fill fs-5"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <select
                className="form-select form-select-sm rounded-pill bg-light border shadow-none px-3 py-2"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="ALL">All Lead Sources</option>
                {availableSources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3 text-md-end">
              {canDelete && selectedLeads.length > 0 && (
                <button
                  className="btn btn-sm btn-danger me-3 px-3 rounded-pill shadow-sm"
                  onClick={handleBulkDelete}
                  disabled={isUpdating}
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete Selected ({selectedLeads.length})
                </button>
              )}
              <small className="text-muted">
                Showing <strong>{leads.length}</strong> of <strong>{pagination.totalItems}</strong> leads
              </small>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="table-responsive p-3 pt-0">
          <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead className="bg-light rounded-top">
              <tr className="small text-muted text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>
                <th style={{ width: '40px', borderBottom: 'none', padding: '15px 20px' }}>
                  <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={leads.length > 0 && selectedLeads.length === leads.length}
                  />
                </th>
                <th style={{ width: '130px', borderBottom: 'none', padding: '15px 20px' }}>Date</th>
                <th style={{ borderBottom: 'none', padding: '15px 20px' }}>Contact</th>
                <th style={{ borderBottom: 'none', padding: '15px 20px' }}>Subject &amp; Message</th>
                <th style={{ borderBottom: 'none', padding: '15px 20px' }}>Source</th>
                <th style={{ borderBottom: 'none', padding: '15px 20px' }}>Status</th>
                <th style={{ borderBottom: 'none', padding: '15px 20px' }}>Priority</th>
                <th style={{ width: '120px', borderBottom: 'none', padding: '15px 20px' }} className="text-end sticky-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const statusInfo = STATUS_CONFIG[lead.status] || { label: lead.status, bg: 'secondary' };
                  const priorityInfo = PRIORITY_CONFIG[lead.priority] || { label: lead.priority, bg: 'secondary' };

                  return (
                    <tr key={lead.id} className={selectedLeads.includes(lead.id) ? 'bg-light' : ''}>
                      <td style={{ padding: '15px 20px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                        <Form.Check
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => handleSelect(e, lead.id)}
                        />
                      </td>
                      <td className="small text-muted">
                        <div>{new Date(lead.createdAt).toLocaleDateString()}</div>
                        <small>{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </td>

                      <td style={{ padding: '15px 20px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', textWrap: 'nowrap' }}>
                        <div className="fw-bold text-dark fs-6">{lead.name}</div>
                        <div className="small mt-1">
                          <a href={`mailto:${lead.email}`} className="text-decoration-none text-muted me-2" style={{ transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#0d6efd'} onMouseOut={e => e.target.style.color = ''}>
                            <i className="bi bi-envelope me-1 text-primary"></i>{lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="small">
                            <a href={`tel:${lead.phone}`} className="text-decoration-none text-muted">
                              <i className="bi bi-telephone me-1"></i>{lead.phone}
                            </a>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '15px 20px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                        <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '280px', fontSize: '14px' }}>
                          {lead.subject || 'No Subject'}
                        </div>
                        <div className="small text-muted text-truncate mt-1" style={{ maxWidth: '320px', lineHeight: '1.5' }}>
                          {lead.message}
                        </div>
                        {lead.notes && (
                          <div className="badge bg-warning-subtle text-warning-emphasis mt-1 small">
                            <i className="bi bi-sticky me-1"></i>Has Admin Note
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="badge bg-light text-dark border small">
                          {lead.source || 'Website'}
                        </span>
                      </td>

                      <td>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant={statusInfo.bg}
                            disabled={!canUpdate}
                            size="sm"
                            className="rounded-pill px-2 py-1 small fw-semibold"
                          >
                            {statusInfo.label}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {Object.entries(STATUS_CONFIG).map(([stKey, stVal]) => (
                              <Dropdown.Item
                                key={stKey}
                                active={lead.status === stKey}
                                onClick={() => handleQuickStatusChange(lead.id, stKey)}
                              >
                                <span className={`badge bg-${stVal.bg} me-2 rounded-circle`} style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                                {stVal.label}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>

                      <td>
                        <span className={`badge bg-${priorityInfo.bg}-subtle text-${priorityInfo.bg} border border-${priorityInfo.bg}-subtle`}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      <td className="text-end sticky-actions">
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal(lead)}
                            title="View Details & Notes"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {canDelete && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(lead)}
                            title="Delete Lead"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="card-footer bg-transparent border-top d-flex justify-content-between align-items-center p-3">
            <span className="small text-muted">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <Button
                variant="outline-secondary"
                disabled={pagination.currentPage <= 1}
                onClick={() => fetchLeads(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline-secondary"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => fetchLeads(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Details & Notes Modal */}
      <style>
        {`
          .custom-high-z-modal {
            z-index: 10600 !important;
          }
          .custom-high-z-backdrop {
            z-index: 10500 !important;
          }
        `}
      </style>
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        className="custom-high-z-modal"
        backdropClassName="custom-high-z-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">
            Lead Details: {selectedLead?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLead && (
            <div className="row g-3">
              {/* Customer Info Box */}
              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-light border">
                  <h6 className="fw-bold mb-2 text-primary">Contact Information</h6>
                  <div className="mb-1"><strong>Name:</strong> {selectedLead.name}</div>
                  <div className="mb-1">
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a>
                  </div>
                  <div className="mb-1">
                    <strong>Phone:</strong>{' '}
                    {selectedLead.phone
                      ? <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a>
                      : <span className="text-muted">Not provided</span>}
                  </div>
                  {selectedLead.website && (
                    <div className="mb-1">
                      <strong>Website:</strong>{' '}
                      <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noreferrer">
                        {selectedLead.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Source & Tracking Info */}
              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-light border">
                  <h6 className="fw-bold mb-2 text-primary">Lead Meta &amp; Source</h6>
                  <div className="mb-1"><strong>Source:</strong> <span className="badge bg-secondary">{selectedLead.source}</span></div>
                  {selectedLead.form && (
                    <div className="mb-1"><strong>Form:</strong> {selectedLead.form.name}</div>
                  )}
                  <div className="mb-1"><strong>Received:</strong> {new Date(selectedLead.createdAt).toLocaleString()}</div>
                  {selectedLead.ipAddress && (
                    <div className="mb-1"><strong>Client IP:</strong> <code>{selectedLead.ipAddress}</code></div>
                  )}
                  {selectedLead.userAgent && (
                    <div className="small text-muted text-truncate" title={selectedLead.userAgent}>
                      <strong>Browser:</strong> {selectedLead.userAgent}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="col-12">
                <div className="p-3 rounded-3 border bg-body">
                  <h6 className="fw-bold mb-2">Subject: {selectedLead.subject || 'N/A'}</h6>
                  <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedLead.message}
                  </p>
                </div>
              </div>

              {/* Form Builder submission: every field as submitted */}
              {Array.isArray(selectedLead.formData) && selectedLead.formData.length > 0 && (
                <div className="col-12">
                  <div className="p-3 rounded-3 border bg-body">
                    <h6 className="fw-bold mb-2">Form Submission</h6>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {selectedLead.formData.map(item => (
                          <tr key={item.name}>
                            <th className="text-muted fw-medium" style={{ width: '35%' }}>{item.label}</th>
                            <td style={{ whiteSpace: 'pre-wrap' }}>
                              {Array.isArray(item.value)
                                ? item.value.join(', ')
                                : typeof item.value === 'boolean'
                                  ? (item.value ? 'Yes' : 'No')
                                  : (item.value === '' || item.value === null ? <span className="text-muted">—</span> : String(item.value))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status and Priority Controls */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold small">Update Lifecycle Status</Form.Label>
                  <Form.Select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold small">Priority</Form.Label>
                  <Form.Select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Internal Admin Remarks / Follow-up Notes */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-bold small">
                    <i className="bi bi-journal-text me-1"></i>Internal Admin Remarks &amp; Follow-up Notes
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Add follow-up notes (e.g., 'Called client on Tuesday, requested quote for WordPress redesign, follow-up scheduled for Friday')..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    These notes are strictly private and visible only to administrators.
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {canUpdate && <Button variant="primary" onClick={handleSaveModal} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LeadsList;
