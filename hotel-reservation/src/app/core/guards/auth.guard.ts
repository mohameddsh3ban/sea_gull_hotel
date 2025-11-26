import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoading$.pipe(
    // 1. Wait until the initial Firebase check is done
    filter(loading => !loading),
    take(1),
    // 2. Synchronously check the result using the Signal or Subject
    map(() => {
      const isAuth = authService.isAuthenticated();
      if (isAuth) {
        return true;
      }
      // Not authenticated
      console.log("AuthGuard: Not authenticated, redirecting to login");
      return router.parseUrl('/auth/login');
    })
  );
};
