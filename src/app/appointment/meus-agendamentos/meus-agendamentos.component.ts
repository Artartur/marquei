import { Component, OnInit } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { AppointmentService } from '../../services/appointment.service';
import { StoreService } from '../../services/store.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../interfaces/user.interface';
import { ClientAppointment } from '../../interfaces/client-appointment.interface';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: false,
  templateUrl: './meus-agendamentos.component.html',
})
export class MeusAgendamentosComponent implements OnInit {
  public user: User | null = null;
  public activeTab: 'upcoming' | 'history' = 'upcoming';

  private refresh$ = new Subject<void>();

  private allAppointments$: Observable<ClientAppointment[]> = this.refresh$.pipe(
    startWith(undefined as void),
    switchMap(() => {
      if (!this.user?.id) return of([] as ClientAppointment[]);
      return this.appointmentService
        .getMyAppointments(this.user.id)
        .pipe(catchError(() => of([] as ClientAppointment[])));
    }),
    shareReplay(1),
  );

  public loading$: Observable<boolean> = merge(
    this.refresh$.pipe(
      startWith(undefined as void),
      map(() => true),
    ),
    this.allAppointments$.pipe(map(() => false)),
  ).pipe(distinctUntilChanged());

  public upcomingAppointments$: Observable<ClientAppointment[]> = this.allAppointments$.pipe(
    map((appointments) => {
      const now = new Date();
      return appointments
        .filter(
          (a) => a.status === 'SCHEDULED' && new Date(a.scheduledAt).getTime() > now.getTime(),
        )
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }),
  );

  public historyAppointments$: Observable<ClientAppointment[]> = this.allAppointments$.pipe(
    map((appointments) =>
      appointments
        .filter((a) => a.status !== 'SCHEDULED')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    ),
  );

  public cancelTarget: ClientAppointment | null = null;
  public cancellationNote = '';
  public cancelling = false;

  public rescheduleTarget: ClientAppointment | null = null;
  public rescheduleMonth: Date = new Date();
  public rescheduleDays: (Date | null)[] = [];
  public rescheduleDate: Date | null = null;
  private rescheduleSlotsTrigger$ = new Subject<{
    date: string;
    professionalId: string;
    serviceId: string;
  }>();
  public rescheduleSlots$!: Observable<string[] | null>;
  public rescheduleSlot: string | null = null;
  public rescheduling = false;

  readonly weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  get rescheduleMonthLabel(): string {
    return this.rescheduleMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  constructor(
    private appointmentService: AppointmentService,
    private storeService: StoreService,
    private toast: ToastService,
  ) {
    this.user = this.storeService.currentUser();
  }

  ngOnInit(): void {
    this.rescheduleSlots$ = this.rescheduleSlotsTrigger$.pipe(
      switchMap(({ date, professionalId, serviceId }) =>
        this.appointmentService.getAvailableSlots(date, professionalId, serviceId).pipe(
          catchError(() => of([] as string[])),
          map((slots) => slots as string[] | null),
          startWith(null as string[] | null),
        ),
      ),
    );
  }

  private buildRescheduleCalendar(): void {
    const year = this.rescheduleMonth.getFullYear();
    const month = this.rescheduleMonth.getMonth();
    const firstWeekDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.rescheduleDays = [];
    for (let i = 0; i < firstWeekDay; i++) this.rescheduleDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) this.rescheduleDays.push(new Date(year, month, d));
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public closeCancel(): void {
    this.cancelTarget = null;
  }

  public closeReschedule(): void {
    this.rescheduleTarget = null;
  }

  public doCancel(): void {
    if (!this.cancelTarget || this.cancelling) return;
    this.cancelling = true;
    this.appointmentService
      .cancel(this.cancelTarget.id, this.cancellationNote || undefined)
      .pipe(finalize(() => (this.cancelling = false)))
      .subscribe({
        next: () => {
          this.cancelTarget = null;
          this.refresh$.next();
          this.toast.success('Agendamento cancelado.');
        },
        error: (e) => {
          this.cancelling = false;
          const msg = e?.error?.message;
          this.toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Erro ao cancelar agendamento.'));
        },
      });
  }

  public doReschedule(): void {
    if (!this.rescheduleTarget || !this.rescheduleSlot || this.rescheduling) return;
    this.rescheduling = true;
    this.appointmentService
      .reschedule(this.rescheduleTarget.id, this.rescheduleSlot)
      .pipe(finalize(() => (this.rescheduling = false)))
      .subscribe({
        next: () => {
          this.rescheduleTarget = null;
          this.refresh$.next();
          this.toast.success('Agendamento remarcado com sucesso.');
        },
        error: (e) => {
          this.rescheduling = false;
          const msg = e?.error?.message;
          this.toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Erro ao remarcar agendamento.'));
        },
      });
  }

  public formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  public formatSlot(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  public isToday(date: Date | null): boolean {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  }

  public isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  public isSelectedRescheduleDate(date: Date | null): boolean {
    if (!date || !this.rescheduleDate) return false;
    return date.toDateString() === this.rescheduleDate.toDateString();
  }

  public nextRescheduleMonth(): void {
    this.rescheduleMonth = new Date(
      this.rescheduleMonth.getFullYear(),
      this.rescheduleMonth.getMonth() + 1,
      1,
    );
    this.buildRescheduleCalendar();
  }

  public openCancel(appointment: ClientAppointment): void {
    this.cancelTarget = appointment;
    this.cancellationNote = '';
  }

  public openReschedule(appointment: ClientAppointment): void {
    this.rescheduleTarget = appointment;
    this.rescheduleMonth = new Date();
    this.rescheduleDate = null;
    this.rescheduleSlot = null;
    this.buildRescheduleCalendar();
  }

  public prevRescheduleMonth(): void {
    this.rescheduleMonth = new Date(
      this.rescheduleMonth.getFullYear(),
      this.rescheduleMonth.getMonth() - 1,
      1,
    );
    this.buildRescheduleCalendar();
  }

  public selectRescheduleDate(date: Date | null): void {
    if (!date || this.isPastDate(date) || !this.rescheduleTarget) return;
    this.rescheduleDate = date;
    this.rescheduleSlot = null;
    this.rescheduleSlotsTrigger$.next({
      date: this.toLocalDateString(date),
      professionalId: this.rescheduleTarget.professional.id,
      serviceId: this.rescheduleTarget.service.id,
    });
  }

  public selectRescheduleSlot(slot: string): void {
    this.rescheduleSlot = slot;
  }

  public statusLabel(status: string): string {
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      NO_SHOW: 'Não compareceu',
    };
    return labels[status] ?? status;
  }

  public statusClasses(status: string): string {
    const classes: Record<string, string> = {
      SCHEDULED: 'bg-[#EBF4FD] text-[#185FA5]',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-600',
      NO_SHOW: 'bg-gray-100 text-gray-500',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-500';
  }
}
