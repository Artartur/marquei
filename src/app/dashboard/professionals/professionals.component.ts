import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject, of } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap } from 'rxjs/operators';
import { ProfissionalsService } from '../../services/profissionals.service';
import { ServicesService } from '../../services/services.service';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { Service } from '../../interfaces/service.interface';
import { UserRole } from '../../utils/enums/UserRole';
import { ToastService } from '../../services/toast.service';

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-professionals',
  standalone: false,
  templateUrl: './professionals.component.html',
})
export class ProfessionalsComponent implements OnInit {
  private search$ = new BehaviorSubject<string>('');
  private refresh$ = new Subject<void>();

  public filteredProfessionals$!: Observable<User[]>;

  public selectedProfessional: User | null = null;
  public activeTab: 'schedule' | 'services' | 'role' = 'schedule';

  public readonly days = [
    { key: 'SEGUNDA', label: 'Segunda' },
    { key: 'TERCA', label: 'Terça' },
    { key: 'QUARTA', label: 'Quarta' },
    { key: 'QUINTA', label: 'Quinta' },
    { key: 'SEXTA', label: 'Sexta' },
    { key: 'SABADO', label: 'Sábado' },
    { key: 'DOMINGO', label: 'Domingo' },
  ];

  public scheduleForm: Record<string, DaySchedule> = {};
  public scheduleLoading = false;
  public savingSchedule = false;

  public linkedServices: Service[] = [];
  public allServices: Service[] = [];
  public linkingServiceId = '';
  public servicesLoading = false;
  public linkingSaving = false;

  public updatingRole = false;
  public UserRole = UserRole;

  public roleOptions = [
    { value: UserRole.CLIENT, label: 'Cliente' },
    { value: UserRole.PROFESSIONAL, label: 'Profissional' },
    { value: UserRole.MANAGER, label: 'Gestor' },
  ];

  private professionalRecords: User[] = [];

  constructor(
    private profissionalsService: ProfissionalsService,
    private servicesService: ServicesService,
    private userService: UserService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const professionals$ = this.refresh$.pipe(
      startWith(undefined as void),
      switchMap(() => this.userService.findProfessionals().pipe(catchError(() => of([])))),
    );

    this.profissionalsService
      .findAll()
      .pipe(catchError(() => of([])))
      .subscribe((records) => (this.professionalRecords = records));

    this.filteredProfessionals$ = combineLatest([professionals$, this.search$]).pipe(
      map(([professionals, q]) =>
        !q
          ? professionals
          : professionals.filter(
              (p) =>
                p.name.toLowerCase().includes(q.toLowerCase()) ||
                p.email.toLowerCase().includes(q.toLowerCase()) ||
                p.phone.includes(q),
            ),
      ),
    );

    this.servicesService
      .findAll()
      .pipe(
        map((services) => services.filter((s) => s.active)),
        catchError(() => of([])),
      )
      .subscribe((services) => (this.allServices = services));

    this.initScheduleForm();
  }

  public onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  public openManage(professional: User): void {
    const record = this.professionalRecords.find((r) => r.id === professional.id);
    this.selectedProfessional = { ...professional, professionalId: record?.professionalId };
    this.activeTab = 'schedule';
    this.initScheduleForm();
    this.linkedServices = [];

    if (!this.selectedProfessional.professionalId) return;
    this.loadSchedule(this.selectedProfessional.professionalId);
    this.loadLinkedServices(this.selectedProfessional.professionalId);
  }

  public closeModal(): void {
    this.selectedProfessional = null;
  }

  public updateRole(role: UserRole): void {
    if (
      !this.selectedProfessional?.id ||
      this.updatingRole ||
      this.selectedProfessional.role === role
    )
      return;
    this.updatingRole = true;
    this.userService
      .updateRole(this.selectedProfessional.id, role)
      .pipe(finalize(() => (this.updatingRole = false)))
      .subscribe({
        next: () => {
          this.selectedProfessional = null;
          this.refresh$.next();
          this.toast.success('Cargo atualizado com sucesso.');
        },
        error: () => {
          this.toast.error('Erro ao atualizar cargo.');
        },
      });
  }

  private initScheduleForm(): void {
    this.days.forEach((d) => {
      this.scheduleForm[d.key] = { enabled: false, startTime: '08:00', endTime: '18:00' };
    });
  }

  private loadSchedule(professionalId: string): void {
    this.scheduleLoading = true;
    this.profissionalsService.getSchedule(professionalId).subscribe({
      next: (schedules) => {
        this.initScheduleForm();
        schedules.forEach((s) => {
          this.scheduleForm[s.dayOfWeek] = {
            enabled: true,
            startTime: s.startTime,
            endTime: s.endTime,
          };
        });
        this.scheduleLoading = false;
      },
      error: () => {
        this.scheduleLoading = false;
      },
    });
  }

  private loadLinkedServices(professionalId: string): void {
    this.servicesLoading = true;
    this.profissionalsService.getProfessionalServices(professionalId).subscribe({
      next: (services) => {
        this.linkedServices = services;
        this.servicesLoading = false;
      },
      error: () => {
        this.servicesLoading = false;
      },
    });
  }

  public saveSchedule(): void {
    if (!this.selectedProfessional?.professionalId) return;

    const schedules = this.days
      .filter((d) => this.scheduleForm[d.key].enabled)
      .map((d) => ({
        dayOfWeek: d.key,
        startTime: this.scheduleForm[d.key].startTime,
        endTime: this.scheduleForm[d.key].endTime,
      }));

    this.savingSchedule = true;
    this.profissionalsService
      .replaceSchedule(this.selectedProfessional.professionalId, schedules)
      .subscribe({
        next: () => {
          this.savingSchedule = false;
          this.toast.success('Agenda salva com sucesso.');
        },
        error: () => {
          this.savingSchedule = false;
          this.toast.error('Erro ao salvar agenda.');
        },
      });
  }

  public doLinkService(): void {
    if (!this.selectedProfessional?.professionalId || !this.linkingServiceId) return;

    this.linkingSaving = true;
    this.profissionalsService
      .linkService(this.selectedProfessional.professionalId, this.linkingServiceId)
      .subscribe({
        next: () => {
          this.linkingServiceId = '';
          this.linkingSaving = false;
          this.loadLinkedServices(this.selectedProfessional!.professionalId!);
          this.toast.success('Serviço vinculado com sucesso.');
        },
        error: () => {
          this.linkingSaving = false;
          this.toast.error('Erro ao vincular serviço.');
        },
      });
  }

  public doUnlinkService(serviceId: string | undefined): void {
    if (!this.selectedProfessional?.professionalId || !serviceId) return;

    this.profissionalsService
      .unlinkService(this.selectedProfessional.professionalId, serviceId)
      .subscribe({
        next: () => {
          this.linkedServices = this.linkedServices.filter((s) => s.id !== serviceId);
          this.toast.success('Serviço removido.');
        },
        error: () => {
          this.toast.error('Erro ao remover serviço.');
        },
      });
  }

  get availableToLink(): Service[] {
    return this.allServices.filter((s) => !this.linkedServices.some((ls) => ls.id === s.id));
  }
}
