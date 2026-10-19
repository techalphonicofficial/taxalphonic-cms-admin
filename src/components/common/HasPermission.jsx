import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';

const HasPermission = ({ action, module, children, fallback = null }) => {
    const user = AuthService.getCurrentUser();
    
    if (!user) {
        return fallback;
    }

    if (user.role?.name === 'Admin') {
        return <>{children}</>;
    }

    const permissions = user.role?.permissions || [];
    const hasPerm = permissions.some(p => p.action === action && p.module === module);

    if (!hasPerm) {
        return fallback;
    }

    return <>{children}</>;
};

export const RoutePermission = ({ action, module, children }) => {
    return (
        <HasPermission action={action} module={module} fallback={<Navigate to="/unauthorized" replace />}>
            {children}
        </HasPermission>
    );
};

export default HasPermission;
