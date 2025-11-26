import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, take, filter } from "rxjs/operators";

export const initialRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoading$.pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      const isAuth = authService.isAuthenticated();
      if (isAuth) {
        if (state.url === "" || state.url === "/") {
          return router.parseUrl("/dashboard");
        }
      }
      return true;
    })
  );
};
