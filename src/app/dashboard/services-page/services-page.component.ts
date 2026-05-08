import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ServicesService } from '../../services/services.service';
import { Service } from '../../interfaces/service.interface';
import { ToastService } from '../../services/toast.service';

type ServiceFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-services-page',
  standalone: false,
  templateUrl: './services-page.component.html',
})
export class ServicesPageComponent implements OnInit {
  private services$ = new BehaviorSubject<Service[]>([]);
  private filter$ = new BehaviorSubject<ServiceFilter>('ALL');

  public filteredServices$!: Observable<Service[]>;
  public isModalOpen = false;
  public selectedService: Service | null = null;

  readonly filterOptions: { value: ServiceFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ACTIVE', label: 'Ativos' },
    { value: 'INACTIVE', label: 'Inativos' },
  ];

  get filter(): ServiceFilter {
    return this.filter$.getValue();
  }

  constructor(
    private servicesService: ServicesService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.filteredServices$ = combineLatest([this.services$, this.filter$]).pipe(
      map(([services, f]) => {
        if (f === 'ACTIVE') return services.filter((s) => s.active);
        if (f === 'INACTIVE') return services.filter((s) => !s.active);
        return services;
      }),
    );

    this.loadServices();
  }

  private loadServices(): void {
    this.servicesService.findAll().subscribe((services) => {
      this.services$.next(services);
    });
  }

  setFilter(f: ServiceFilter): void {
    this.filter$.next(f);
  }

  openCreate(): void {
    this.selectedService = null;
    this.isModalOpen = true;
  }

  openEdit(service: Service): void {
    this.selectedService = { ...service };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedService = null;
  }

  onSaved(): void {
    this.closeModal();
    this.loadServices();
    this.toast.success('Serviço salvo com sucesso.');
  }

  toggleActive(service: Service): void {
    if (!service.id) return;
    this.servicesService.update(service.id, { active: !service.active }).subscribe({
      next: () => {
        this.loadServices();
        this.toast.success(service.active ? 'Serviço desativado.' : 'Serviço ativado.');
      },
      error: () => {
        this.toast.error('Erro ao atualizar serviço.');
      },
    });
  }
}
