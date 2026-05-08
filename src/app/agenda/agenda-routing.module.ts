import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AgendaComponent } from './agenda.component';
import { AgendaClientesComponent } from './clientes/agenda-clientes.component';
import { AgendaServicosComponent } from './servicos/agenda-servicos.component';

const routes: Routes = [
  { path: '', component: AgendaComponent },
  { path: 'clientes', component: AgendaClientesComponent },
  { path: 'servicos', component: AgendaServicosComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgendaRoutingModule {}
