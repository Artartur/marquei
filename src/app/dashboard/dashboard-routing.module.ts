import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { ClientsComponent } from './clients/clients.component';
import { ServicesPageComponent } from './services-page/services-page.component';
import { ProfessionalsComponent } from './professionals/professionals.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'agendamentos', component: AppointmentsComponent },
  { path: 'clientes', component: ClientsComponent },
  { path: 'servicos', component: ServicesPageComponent },
  { path: 'profissionais', component: ProfessionalsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
