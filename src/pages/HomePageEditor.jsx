import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { HOME_PAGE_SLUG } from '../components/page-builder/homeBlocks';

/**
 * /pages/home: opens the website homepage (the page with slug "home") in the Home Page
 * Builder, or starts a new one prefilled with the current homepage when none exists yet.
 */
const HomePageEditor = () => {
  const [target, setTarget] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/pages', { params: { slug: HOME_PAGE_SLUG, limit: 1 } })
      .then(res => {
        if (cancelled) return;
        const page = (res.data?.data || [])[0];
        setTarget(page ? `/pages/edit/${page.id}` : '/pages/new?template=home');
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load the home page.');
      });
    return () => { cancelled = true; };
  }, []);

  if (target) return <Navigate to={target} replace />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  return (
    <div className="text-center text-muted py-5">
      <span className="spinner-border spinner-border-sm me-2"></span>Opening the home page…
    </div>
  );
};

export default HomePageEditor;
