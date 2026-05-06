import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  const authReq = req.clone({
    withCredentials: true,
    ...(token && { setHeaders: { Authorization: `Bearer ${token}` } }),
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isRefreshUrl = req.url.includes('/auth/refresh');

      if (error.status === 401 && !isRefreshUrl) {
        return authService.initSession().pipe(
          switchMap(() => {
            const newToken = authService.getAccessToken();
            const retried = req.clone({
              withCredentials: true,
              ...(newToken && {
                setHeaders: { Authorization: `Bearer ${newToken}` },
              }),
            });
            return next(retried);
          }),
          catchError(() => {
            router.navigate(['/']);
            return throwError(() => error);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
