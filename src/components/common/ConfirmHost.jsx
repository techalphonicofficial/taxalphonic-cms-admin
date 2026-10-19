import React, { useEffect, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { setConfirmOpener } from './confirm';

/** Renders the dialog behind confirmDialog() / confirmDelete() (confirm.js). Mounted once in App.jsx. */
export default function ConfirmHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    setConfirmOpener((next) => setState(next));
    return () => setConfirmOpener(null);
  }, []);

  const close = (answer) => {
    state?.resolve(answer);
    setState(null);
  };

  return (
    <ConfirmDialog
      show={Boolean(state)}
      title={state?.title}
      message={state?.message}
      items={state?.items || []}
      note={state?.note}
      tone={state?.tone || 'danger'}
      confirmText={state?.confirmText || 'Confirm'}
      cancelText={state?.cancelText || 'Cancel'}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );
}
