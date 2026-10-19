import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { toast } from 'react-toastify';
import FooterDisplaySettings from '../components/menus/FooterDisplaySettings';
import MenuTree from '../components/menus/MenuTree';

const MenuBuilder = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Array of items, each can have a 'children' array
  const [menuItems, setMenuItems] = useState([]);
  // Display options saved with the menu (menu.settings); the footer menu uses them.
  const [menuSettings, setMenuSettings] = useState(null);

  // For adding new top-level item
  const [newItem, setNewItem] = useState({ title: '', url: '', target: '_self' });

  // Helper to auto-generate URL from title
  const generateUrl = (title) => {
    if (!title) return '';
    return '/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNewItemTitleChange = (e) => {
    const title = e.target.value;
    setNewItem({ ...newItem, title, url: generateUrl(title) });
  };

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      location: '',
      status: 'active',
    }
  });

  useEffect(() => {
    if (isEditMode) {
      api.get(`/menus/${id}`)
        .then(res => {
          const d = res.data?.data || res.data;
          reset({
            name: d.name || '',
            location: d.location || '',
            status: d.status || 'active',
          });
          setMenuSettings(d.settings && typeof d.settings === 'object' ? d.settings : null);
          if (d.items) {
            // Backend returns nested structure. Just need to ensure sorted.
            const sortItems = (items) => {
              return items.sort((a, b) => a.displayOrder - b.displayOrder).map(item => ({
                ...item,
                children: item.children ? sortItems(item.children) : []
              }));
            };
            setMenuItems(sortItems(d.items));
          }
        })
        .catch(() => { toast.error('Failed to load menu'); navigate('/pages/menus'); });
    }
  }, [id, isEditMode, reset, navigate]);

  // --- Top Level Actions ---
  const handleAddItem = () => {
    if (!newItem.title.trim() || !newItem.url.trim()) {
      toast.warn('Please provide a title and URL for the menu link');
      return;
    }
    setMenuItems([{ ...newItem, id: Date.now().toString(), children: [] }, ...menuItems]);
    setNewItem({ title: '', url: '', target: '_self' });
  };

  // Nested items for the API (any depth; the backend saves them recursively).
  const toPayload = (items) => items.map((item, index) => ({
    title: item.title,
    url: item.url,
    target: item.target,
    icon: item.icon || '',
    displayOrder: index,
    children: toPayload(item.children || [])
  }));

  const isFooter = String(watch('location') || '').trim().toLowerCase() === 'footer';
  const isHeader = String(watch('location') || '').trim().toLowerCase() === 'header';

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        settings: menuSettings,
        items: toPayload(menuItems)
      };

      if (isEditMode) {
        await api.put(`/menus/${id}`, payload);
        toast.success('Menu updated successfully');
      } else {
        await api.post('/menus', payload);
        toast.success('Menu created successfully');
      }
      navigate('/pages/menus');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Pages', link: '/pages' }, { label: 'Menus', link: '/pages/menus' }, { label: isEditMode ? 'Edit' : 'New' }]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Menu' : 'Add Menu'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-list-nested me-2 text-primary"></i>Menu Details
                </h5>
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Menu Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      {...register('name', { required: 'Name is required' })}
                      placeholder="e.g. Main Header Menu"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Location Identifier</label>
                    <input
                      type="text"
                      className="form-control"
                      {...register('location')}
                      placeholder="e.g. header, footer_col_1"
                    />
                    <div className="form-text">Used by developers to place this menu in the theme.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-link me-2 text-primary"></i>Menu Links
                </h5>

                {/* Add new top-level link form */}
                <div className="bg-light p-3 rounded-3 mb-4">
                  <h6 className="fw-semibold mb-3">Add Top-Level Link</h6>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label small fw-medium">Link Title</label>
                      <input type="text" className="form-control form-control-sm" value={newItem.title} onChange={handleNewItemTitleChange} placeholder="e.g. Services" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-medium">URL</label>
                      <input type="text" className="form-control form-control-sm" value={newItem.url} onChange={e => setNewItem({ ...newItem, url: e.target.value })} placeholder="e.g. # or /about" />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-medium">Target</label>
                      <select className="form-select form-select-sm" value={newItem.target} onChange={e => setNewItem({ ...newItem, target: e.target.value })}>
                        <option value="_self">Same Tab</option>
                        <option value="_blank">New Tab</option>
                      </select>
                    </div>
                    <div className="col-md-2 d-grid">
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleAddItem}>
                        <i className="bi bi-plus-lg"></i> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Links (footer: Main heading → Column heading → Link) */}
                {isFooter && (
                  <div className="alert alert-info small py-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Footer layout: a <b>Main heading</b> (e.g. Business Services) holds <b>Column headings</b> (e.g. 🚀 Startup), and each column holds its <b>Links</b>.
                    A top-level link with only links under it becomes one column; a link with nothing under it goes to the bottom row.
                    A link whose title starts with <b>+</b> (e.g. "+14 more →") shows as the blue "more" link. Use <code>#</code> as the URL of a heading.
                  </div>
                )}
                {isHeader && (
                  <div className="alert alert-info small py-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Header layout: the <b>first five</b> menus sit in the top bar beside search (e.g. Taxpedia, GeM Services, Quick Update, Government Notices, Loan Bazar); the rest form the main menu row.
                    A menu's links show in its dropdown; give a link its own links to make it a <b>column heading</b> (e.g. Compliance → 🧾 Compliance Services → FDI Filing). Use <code>#</code> as the URL of a heading.
                  </div>
                )}
                <MenuTree
                  items={menuItems}
                  onChange={setMenuItems}
                  maxDepth={isFooter || isHeader ? 3 : 2}
                  labels={isFooter ? ['Main heading', 'Column heading', 'Link'] : isHeader ? ['Menu', 'Link / column heading', 'Link'] : ['Link', 'Sub-link']}
                />

              </div>
            </div>

            {/* The website footer reads these from the menu with location "footer". */}
            {isFooter && (
              <FooterDisplaySettings value={menuSettings} onChange={setMenuSettings} />
            )}
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4 sticky-top" style={{ top: '100px' }}>
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Publishing</h5>
                <div className="mb-4">
                  <label className="form-label fw-medium">Status</label>
                  <select className="form-select bg-light border-0" {...register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <hr className="my-4 text-muted opacity-25" />
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary rounded-3 py-2" disabled={isSubmitting}>
                    {isSubmitting
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                      : <><i className="bi bi-check-circle me-2"></i>{isEditMode ? 'Update Menu' : 'Save Menu'}</>
                    }
                  </button>
                  <Link to="/pages/menus" className="btn btn-light rounded-3 py-2">Cancel</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MenuBuilder;
