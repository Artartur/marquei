import { computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreService } from '../services/store.service';
import { UserRole } from '../utils/enums/UserRole';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const storeService = inject(StoreService);
    const router = inject(Router);
    const role = storeService.currentUser()?.role ?? null;

    if (role && allowedRoles.includes(role)) return true;

    router.navigate(['/unauthorized']);
    return false;
  };
};
