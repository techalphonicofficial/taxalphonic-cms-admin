/*
 * Editors stay open after Save (2026-11-11). Every editor / builder calls this after a successful
 * save instead of going back to its list:
 *   - editing an existing record: nothing happens, the editor stays as it is;
 *   - creating a new record: the editor opens that record's edit page (replace, so Back does not
 *     return to the empty "new" form) and the next Save updates it instead of creating a copy.
 *     The routes use key="new" / key="edit", so the edit page loads the saved record fresh.
 * When the create response has no id, it falls back to the list (old behaviour).
 */

/** The id of a saved record from an axios response, a service wrapper's result or the record itself. */
export function savedIdOf(result) {
  const candidates = [result?.data?.data, result?.data, result];
  for (const item of candidates) {
    const id = item?.id ?? item?._id ?? item?.data?.id;
    if (id !== undefined && id !== null && id !== '') return id;
  }
  return null;
}

export function stayAfterSave(navigate, { isEdit, result, editPath, listPath }) {
  if (isEdit) return;
  const id = savedIdOf(result);
  navigate(id ? `${editPath}/${id}` : listPath, { replace: true });
}
