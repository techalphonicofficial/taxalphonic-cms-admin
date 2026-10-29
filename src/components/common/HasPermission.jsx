import React from 'react';
import { Navigate } from 'react-router-dom';
import { can } from '../../utils/permissions';

/** Shows `children` only when the role allows `action` on `module` (a module or a list, any one is enough). */
const HasPermission = ({ action, module, children, fallback = null }) => (
  can(action, module) ? <>{children}</> : fallback
);

export const RoutePermission = ({ action, module, children }) => (
  <HasPermission action={action} module={module} fallback={<Navigate to="/unauthorized" replace />}>
    {children}
  </HasPermission>
);

export default HasPermission;
