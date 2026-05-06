import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreService } from '../services/store.service';

export const authGuard: CanActivateFn = (route, state) => {
  const storeService = inject(StoreService);
  const router = inject(Router);

  if (storeService.isAuthenticated()) return true;

  router.navigate(['/']);
  return false;
};
