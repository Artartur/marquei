import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientRoutingModule } from './client-routing.module';
import { MyAppointmentsComponent } from './my-appointments/my-appointments.component';

@NgModule({
  declarations: [MyAppointmentsComponent],
  imports: [CommonModule, FormsModule, ClientRoutingModule],
})
export class ClientModule {}
