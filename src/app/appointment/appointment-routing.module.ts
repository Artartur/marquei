import { RouterModule, Routes } from '@angular/router';
import { AppointmentComponent } from './appointment.component';
import { MeusAgendamentosComponent } from './meus-agendamentos/meus-agendamentos.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: '', component: AppointmentComponent },
  { path: 'meus-agendamentos', component: MeusAgendamentosComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppointmentRoutingModule {}
