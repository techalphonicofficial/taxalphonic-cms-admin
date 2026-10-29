import React from 'react';
import { useLocation } from 'react-router-dom';
import { HistoryButton, recordTitle } from './RecordHistory';
import { canOnPage } from '../../utils/permissions';

const ActionColumn = ({
  onView,
  onEdit: onEditProp,
  onDelete: onDeleteProp,
  onDuplicate: onDuplicateProp,
  row
}) => {
  // Edit / Duplicate / Delete only when the role may update / create / delete on this list page
  // (utils/permissions.js ROUTES); View and History stay.
  const { pathname } = useLocation();
  const onEdit = canOnPage('update', pathname) ? onEditProp : undefined;
  const onDuplicate = canOnPage('create', pathname) ? onDuplicateProp : undefined;
  const onDelete = canOnPage('delete', pathname) ? onDeleteProp : undefined;
  return (
    <div className="action-buttons d-flex align-items-center gap-1 justify-content-end w-100">
      {onView && (
        <button
          className="btn"
          title="View"
          onClick={(e) => { e.stopPropagation(); onView(row); }}
        >
          <i className="bi bi-eye"></i>
        </button>
      )}

      {onEdit && (
        <button
          className="btn"
          title="Edit"
          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
        >
          <i className="bi bi-pencil"></i>
        </button>
      )}

      {onDuplicate && (
        <button
          className="btn"
          title="Duplicate"
          onClick={(e) => { e.stopPropagation(); onDuplicate(row); }}
        >
          <i className="bi bi-files"></i>
        </button>
      )}

      {onDelete && (
        <button
          className="btn text-danger"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
        >
          <i className="bi bi-trash"></i>
        </button>
      )}

      <HistoryButton recordId={row?.id} title={recordTitle(row)} />
    </div>
  );
};

export default ActionColumn;
