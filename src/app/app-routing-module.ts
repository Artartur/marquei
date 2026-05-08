import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './utils/enums/UserRole';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login/login.module').then((m) => m.LoginModule),
  },
  {
    path: 'agenda',
    canActivate: [authGuard, roleGuard([UserRole.PROFESSIONAL])],
    loadChildren: () => import('./agenda/agenda.module').then((m) => m.AgendaModule),
  },
  {
    path: 'appointment',
    canActivate: [authGuard, roleGuard([UserRole.CLIENT])],
    loadChildren: () => import('./appointment/appointment.module').then((m) => m.AppointmentModule),
  },
  {
    path: 'client',
    redirectTo: '/appointment/meus-agendamentos',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard([UserRole.MANAGER])],
    loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
