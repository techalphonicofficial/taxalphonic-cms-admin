import React from 'react';
import Breadcrumb from './Breadcrumb';

/**
 * Sticky editor header (`.ta-editor-bar`, global.scss): breadcrumb, title and the editor's
 * buttons (children), always visible at the top while the form scrolls. Put it first on the page.
 * A Save button outside the <form> submits it with form="<form id>".
 */
const EditorBar = ({ title, breadcrumb, subtitle, children }) => (
  <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
    <div className="w-100" style={{ minWidth: 0 }}>
      {breadcrumb?.length > 0 && <Breadcrumb items={breadcrumb} />}
      <h2 className="fw-bold mb-0 text-body fs-5 text-truncate" style={{ letterSpacing: '-0.5px' }}>{title}</h2>
      {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
    </div>
    {children && <div className="d-flex gap-2 flex-shrink-0 flex-wrap justify-content-end">{children}</div>}
  </div>
);

export default EditorBar;
