import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: (allowedRoles: string[]) => CanActivateFn = (allowedRoles: string[]) => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      return router.createUrlTree(['/login']);
    }

    const userRole = await authService.getUserRole();

    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard or show error
      return router.createUrlTree(['/login']);
    }

    return true;
  };
};
