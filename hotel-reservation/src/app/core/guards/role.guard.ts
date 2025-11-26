import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';

export function roleGuard(allowedRoles: Array<'student' | 'teacher' | 'admin' | 'reception' | 'kitchen' | 'accounting'>): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isLoading$.pipe(
      filter(loading => !loading),
      take(1),
      switchMap(() => authService.user$),
      take(1),
      map(currentUser => {
        if (!currentUser || !allowedRoles.includes(currentUser.role as 'student' | 'teacher' | 'admin' | 'reception' | 'kitchen' | 'accounting')) {
          console.warn(`Role guard: Access denied.`);
          // If user is missing (logged out), let AuthGuard handle the redirect usually,
          // but if we are here, redirect to login or appropriate dashboard
          if(!currentUser) return router.parseUrl('/auth/login');
          // Assuming role specific dashboards exist like /admin, /reception etc.
          return router.parseUrl(`/${currentUser.role}`);
        }
        return true;
      })
    );
  };
}
