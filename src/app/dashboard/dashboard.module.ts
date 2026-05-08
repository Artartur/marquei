import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ServiceModalComponent } from './service-modal/service-modal.component';
import { DashboardSidebarComponent } from './sidebar/dashboard-sidebar.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { ClientsComponent } from './clients/clients.component';
import { ServicesPageComponent } from './services-page/services-page.component';
import { ProfessionalsComponent } from './professionals/professionals.component';

@NgModule({
  declarations: [
    AppointmentsComponent,
    ClientsComponent,
    DashboardSidebarComponent,
    DashboardComponent,
    ServiceModalComponent,
    ServicesPageComponent,
    ProfessionalsComponent,
  ],
  imports: [CommonModule, DashboardRoutingModule, FormsModule, ReactiveFormsModule],
})
export class DashboardModule {}
