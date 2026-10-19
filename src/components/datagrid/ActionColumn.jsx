import React from 'react';
import { HistoryButton, recordTitle } from './RecordHistory';

const ActionColumn = ({
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  row
}) => {
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
