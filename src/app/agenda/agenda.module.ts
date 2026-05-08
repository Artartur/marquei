import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaRoutingModule } from './agenda-routing.module';
import { AgendaComponent } from './agenda.component';
import { AgendaSidebarComponent } from './sidebar/agenda-sidebar.component';
import { AgendaClientesComponent } from './clientes/agenda-clientes.component';
import { AgendaServicosComponent } from './servicos/agenda-servicos.component';

@NgModule({
  declarations: [
    AgendaComponent,
    AgendaSidebarComponent,
    AgendaClientesComponent,
    AgendaServicosComponent,
  ],
  imports: [CommonModule, FormsModule, AgendaRoutingModule],
})
export class AgendaModule {}
