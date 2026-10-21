// The website's form Server Action, for the preview: nothing is sent, so trying a form in the
// admin never creates a CRM lead.
export async function submitCmsForm() {
  return {
    status: 'error',
    message: 'Preview only: submissions are not sent from the admin. The form works on the live website.',
    fieldErrors: {},
  };
}
