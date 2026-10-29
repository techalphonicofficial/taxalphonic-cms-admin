import { Link } from 'react-router-dom';
import { canOpen } from '../../utils/permissions';

/**
 * A <Link> shown only when the user may open its page (utils/permissions.js ROUTES).
 * asText: when not allowed, show the content as plain text instead (e.g. a record name that
 * links to its edit page), so the list still reads the same.
 */
export default function PermLink({ to, children, asText = false, ...props }) {
  if (canOpen(to)) return <Link to={to} {...props}>{children}</Link>;
  return asText ? <span className={props.className}>{children}</span> : null;
}
