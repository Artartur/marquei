import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentComponent } from './appointment.component';
import { AppointmentRoutingModule } from './appointment-routing.module';
import { AppointmentSidebarComponent } from './sidebar/appointment-sidebar.component';
import { MeusAgendamentosComponent } from './meus-agendamentos/meus-agendamentos.component';

@NgModule({
  declarations: [AppointmentComponent, AppointmentSidebarComponent, MeusAgendamentosComponent],
  imports: [CommonModule, FormsModule, RouterModule, AppointmentRoutingModule],
})
export class AppointmentModule {}
