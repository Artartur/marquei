import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { finalize, map, startWith, switchMap } from 'rxjs/operators';
import { AppointmentService } from '../../services/appointment.service';
import { ClientAppointment } from '../../interfaces/client-appointment.interface';
import { AppointmentStatus } from '../../utils/enums/AppointmentStatus';
import { ToastService } from '../../services/toast.service';

type AppointmentGroup = { date: string; appointments: AppointmentWithHour[] };
type AppointmentWithHour = ClientAppointment & { formattedHour: string };

const TZ = 'America/Sao_Paulo';

@Component({
  selector: 'app-appointments',
  standalone: false,
  templateUrl: './appointments.component.html',
})
export class AppointmentsComponent implements OnInit {
  public appointments$!: Observable<AppointmentGroup[]>;

  public selectedAppointment: ClientAppointment | null = null;
  public updatingStatus = false;

  public AppointmentStatus = AppointmentStatus;

  public statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'SCHEDULED', label: 'Agendado' },
    { value: 'COMPLETED', label: 'Concluído' },
    { value: 'CANCELLED', label: 'Cancelado' },
    { value: 'NO_SHOW', label: 'Não compareceu' },
  ];

  private status$ = new BehaviorSubject<string>('ALL');
  private search$ = new BehaviorSubject<string>('');
  private fromDate$ = new BehaviorSubject<string>('');
  private toDate$ = new BehaviorSubject<string>('');
  private refresh$ = new BehaviorSubject<void>(undefined);

  public statusFilter = 'ALL';
  public searchText = '';
  public fromDate = '';
  public toDate = '';

  constructor(
    private appointmentsService: AppointmentService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const all$ = this.refresh$.pipe(switchMap(() => this.appointmentsService.getAppointments()));

    this.appointments$ = combineLatest([
      all$,
      this.status$,
      this.search$,
      this.fromDate$,
      this.toDate$,
    ]).pipe(
      map(([appoints, status, search, from, to]) => {
        let list = appoints;

        if (status !== 'ALL') list = list.filter((a) => a.status === status);

        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (a) =>
              a.client.name.toLowerCase().includes(q) ||
              a.professional.user.name.toLowerCase().includes(q) ||
              a.service.name.toLowerCase().includes(q),
          );
        }

        if (from) list = list.filter((a) => a.scheduledAt >= `${from}T00:00:00.000Z`);
        if (to) list = list.filter((a) => a.scheduledAt <= `${to}T23:59:59.999Z`);

        const formatted = list.map((a) => {
          const date = new Date(a.scheduledAt);
          return {
            ...a,
            formattedHour: date.toLocaleTimeString('pt-BR', {
              timeZone: TZ,
              hour: '2-digit',
              minute: '2-digit',
            }),
            formattedDate: date.toLocaleDateString('pt-BR', {
              timeZone: TZ,
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
          };
        });

        return formatted.reduce((acc, a) => {
          const group = acc.find((g) => g.date === a.formattedDate);
          if (group) group.appointments.push(a);
          else acc.push({ date: a.formattedDate, appointments: [a] });
          return acc;
        }, [] as AppointmentGroup[]);
      }),
    );
  }

  public onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  public setFilter(status: string): void {
    this.statusFilter = status;
    this.status$.next(status);
  }

  public onFromChange(event: Event): void {
    this.fromDate$.next((event.target as HTMLInputElement).value);
  }

  public onToChange(event: Event): void {
    this.toDate$.next((event.target as HTMLInputElement).value);
  }

  public clearFilters(): void {
    this.statusFilter = 'ALL';
    this.searchText = '';
    this.fromDate = '';
    this.toDate = '';
    this.status$.next('ALL');
    this.search$.next('');
    this.fromDate$.next('');
    this.toDate$.next('');
  }

  public hasActiveFilters(): boolean {
    return this.statusFilter !== 'ALL' || !!this.searchText || !!this.fromDate || !!this.toDate;
  }

  public openAppointment(appt: ClientAppointment): void {
    this.selectedAppointment = appt;
  }

  public closeAppointment(): void {
    this.selectedAppointment = null;
  }

  public updateStatus(status: AppointmentStatus): void {
    if (!this.selectedAppointment || this.updatingStatus) return;
    this.updatingStatus = true;
    this.appointmentsService
      .updateStatus(this.selectedAppointment.id, status)
      .pipe(finalize(() => (this.updatingStatus = false)))
      .subscribe({
        next: () => {
          this.selectedAppointment = null;
          this.refresh$.next();
          this.toast.success('Status atualizado com sucesso.');
        },
        error: () => this.toast.error('Erro ao atualizar status.'),
      });
  }

  public formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  public statusClass(status: string): string {
    const map: Record<string, string> = {
      CANCELLED: 'bg-red-50 text-red-700',
      COMPLETED: 'bg-green-50 text-green-700',
      SCHEDULED: 'bg-[#D4F0FF] text-[#1496DE]',
      NO_SHOW: 'bg-[#FEF3C7] text-[#92400E]',
    };
    return map[status] ?? '';
  }

  public statusLabel(status: string): string {
    const map: Record<string, string> = {
      CANCELLED: 'Cancelado',
      COMPLETED: 'Concluído',
      NO_SHOW: 'Não compareceu',
      SCHEDULED: 'Agendado',
    };
    return map[status] ?? status;
  }
}
