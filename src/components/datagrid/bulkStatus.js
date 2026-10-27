import { toast } from 'react-toastify';
import { confirmDialog } from '../common/confirm';
import { AuthService } from '../../services/auth.service';

// Bulk status changes from a DataGrid bulk bar (Services, Pages, Landing Pages): confirm with the
// list of records, run one request per record (so one failure doesn't stop the rest), then toast
// how many worked and why the others did not.

export function canDo(action, module) {
  const user = AuthService.getCurrentUser();
  if (!user) return false;
  if (user.role?.name === 'Admin') return true;
  return (user.role?.permissions || []).some((p) => p.module === module && p.action === action);
}

const reason = (error) => {
  const body = error?.response?.data;
  const first = Array.isArray(body?.errors) ? body.errors.find((e) => e?.message)?.message : '';
  return first || body?.message || error?.message || 'failed';
};

/**
 * rows: selected records. skip(row): a reason to leave a row out (already in that state), or ''.
 * run(row): the request for one record. Returns true when something ran (the caller reloads).
 */
export async function runBulk(rows, { title, message, note, confirmText, tone = 'warning', label = (r) => r.title, skip = () => '', run, done }) {
  const todo = rows.filter((r) => !skip(r));
  const skipped = rows.length - todo.length;
  if (!todo.length) {
    toast.info(`Nothing to do: ${skip(rows[0]) || 'the selected items are already in that state'}.`);
    return false;
  }
  const ok = await confirmDialog({
    title: title(todo.length),
    message,
    items: todo.map(label),
    note: [note, skipped ? `${skipped} selected item(s) are already in that state and are left as they are.` : ''].filter(Boolean).join(' '),
    tone,
    confirmText,
  });
  if (!ok) return false;

  const toastId = toast.loading(`${confirmText}: 0 / ${todo.length}…`);
  let count = 0;
  const failed = [];
  for (const row of todo) {
    try {
      await run(row);
      count += 1;
    } catch (error) {
      failed.push(`${label(row)}: ${reason(error)}`);
    }
    toast.update(toastId, { render: `${confirmText}: ${count + failed.length} / ${todo.length}…` });
  }
  toast.dismiss(toastId);
  if (count) toast.success(`${count} ${done}.`);
  if (failed.length) toast.error(`${failed.length} not done — ${failed.slice(0, 5).join(' · ')}${failed.length > 5 ? ' …' : ''}`, { autoClose: 12000 });
  return true;
}
