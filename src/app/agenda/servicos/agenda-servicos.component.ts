import { Component } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { ProfissionalsService } from '../../services/profissionals.service';
import { ServicesService } from '../../services/services.service';
import { StoreService } from '../../services/store.service';
import { Service } from '../../interfaces/service.interface';

@Component({
  selector: 'app-agenda-servicos',
  standalone: false,
  templateUrl: './agenda-servicos.component.html',
})
export class AgendaServicosComponent {
  readonly services$: Observable<Service[]>;

  constructor(
    private readonly storeService: StoreService,
    private readonly profissionalsService: ProfissionalsService,
    private readonly servicesService: ServicesService,
  ) {
    this.services$ = toObservable(this.storeService.currentUser).pipe(
      switchMap(user => {
        if (!user) return of<Service[]>([]);
        return user.professionalId
          ? this.profissionalsService.getProfessionalServices(user.professionalId)
          : this.servicesService.findAllActiveServices(true);
      }),
      shareReplay(1),
    );
  }

  formatRevenue(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
