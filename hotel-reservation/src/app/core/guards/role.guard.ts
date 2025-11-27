import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isLoading$.pipe(
      // 1. Wait for Firebase to initialize (on page refresh)
      filter(isLoading => !isLoading),
      take(1),
      // 2. Check User State
      map(() => {
        const user = authService.user();
        
        // Not logged in?
        if (!user) {
          return router.createUrlTree(['/login']);
        }

        // Check Role
        if (allowedRoles.includes(user.role)) {
          return true;
        }

        // Logged in but wrong role?
        console.warn(`Access Denied: User role '${user.role}' not in [${allowedRoles}]`);
        return router.createUrlTree(['/login']); // Redirect to login as requested
      })
    );
  };
}
