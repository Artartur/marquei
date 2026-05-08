import { Component } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { AppointmentService } from '../services/appointment.service';
import { StoreService } from '../services/store.service';
import { ToastService } from '../services/toast.service';
import { ClientAppointment } from '../interfaces/client-appointment.interface';
import { AppointmentStatus } from '../utils/enums/AppointmentStatus';
import { User } from '../interfaces/user.interface';

interface WeekDay {
  date: Date;
  label: string;
  dayNum: string;
  isToday: boolean;
}

interface CalendarCell {
  appointment: ClientAppointment | null;
  isToday: boolean;
}

interface CalendarRow {
  time: string;
  cells: CalendarCell[];
}

interface AgendaVm {
  currentUser: User | null;
  weekRange: string;
  weekDays: WeekDay[];
  todayCount: number;
  weekCount: number;
  weekRevenue: number;
  nextAppointment: ClientAppointment | null;
  calendarGrid: CalendarRow[];
}

@Component({
  selector: 'app-agenda',
  standalone: false,
  templateUrl: './agenda.component.html',
})
export class AgendaComponent {
  private weekOffset$ = new BehaviorSubject<number>(0);
  private refresh$ = new Subject<void>();

  public selectedAppointment: ClientAppointment | null = null;
  public updatingStatus = false;

  public AppointmentStatus = AppointmentStatus;
  public timeSlots = this.generateTimeSlots(7, 20);
  public vm$: Observable<AgendaVm>;

  private DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

  constructor(
    private appointmentService: AppointmentService,
    private storeService: StoreService,
    private toast: ToastService,
  ) {
    const currentUser$ = toObservable(this.storeService.currentUser);

    const weekStart$ = this.weekOffset$.pipe(
      map((offset) => this.getWeekStart(offset)),
      shareReplay(1),
    );

    const weekDays$ = weekStart$.pipe(
      map((start) => this.buildWeekDays(start)),
      shareReplay(1),
    );

    const weekRange$ = weekStart$.pipe(map((start) => this.formatWeekRange(start)));

    const appointments$ = this.refresh$.pipe(
      startWith(undefined as void),
      switchMap(() => this.appointmentService.getAppointments().pipe(catchError(() => of([])))),
      shareReplay(1),
    );

    const todayCount$ = appointments$.pipe(
      map((apps) => {
        const today = this.startOfDay(new Date());
        return apps.filter(
          (a) =>
            this.startOfDay(new Date(a.scheduledAt)).getTime() === today.getTime() &&
            a.status === AppointmentStatus.SCHEDULED,
        ).length;
      }),
    );

    const weekCount$ = combineLatest([appointments$, weekStart$]).pipe(
      map(([apps, weekStart]) => {
        const weekEnd = this.addDays(weekStart, 5);
        return apps.filter((a) => {
          const d = new Date(a.scheduledAt);
          return d >= weekStart && d < weekEnd && a.status !== AppointmentStatus.CANCELLED;
        }).length;
      }),
    );

    const weekRevenue$ = combineLatest([appointments$, weekStart$]).pipe(
      map(([apps, weekStart]) => {
        const weekEnd = this.addDays(weekStart, 5);
        return apps
          .filter((a) => {
            const d = new Date(a.scheduledAt);
            return d >= weekStart && d < weekEnd && a.status === AppointmentStatus.COMPLETED;
          })
          .reduce((sum, a) => sum + a.service.price, 0);
      }),
    );

    const nextAppointment$ = appointments$.pipe(
      map((apps) => {
        const now = new Date();
        return (
          apps
            .filter(
              (a) => new Date(a.scheduledAt) > now && a.status === AppointmentStatus.SCHEDULED,
            )
            .sort(
              (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
            )[0] ?? null
        );
      }),
    );

    const calendarGrid$ = combineLatest([appointments$, weekDays$]).pipe(
      map(([apps, weekDays]) => this.buildCalendarGrid(apps, weekDays)),
    );

    this.vm$ = combineLatest({
      currentUser: currentUser$,
      weekRange: weekRange$,
      weekDays: weekDays$,
      todayCount: todayCount$,
      weekCount: weekCount$,
      weekRevenue: weekRevenue$,
      nextAppointment: nextAppointment$,
      calendarGrid: calendarGrid$,
    });
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
    this.appointmentService
      .updateStatus(this.selectedAppointment.id, status)
      .pipe(finalize(() => (this.updatingStatus = false)))
      .subscribe({
        next: () => {
          this.selectedAppointment = null;
          this.refresh$.next();
          this.toast.success('Status atualizado com sucesso.');
        },
        error: () => {
          this.toast.error('Erro ao atualizar status.');
        },
      });
  }

  public statusLabel(status: string): string {
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendado',
      COMPLETED: 'Realizado',
      CANCELLED: 'Cancelado',
      NO_SHOW: 'Não compareceu',
    };
    return labels[status] ?? status;
  }

  previousWeek(): void {
    this.weekOffset$.next(this.weekOffset$.value - 1);
  }

  nextWeek(): void {
    this.weekOffset$.next(this.weekOffset$.value + 1);
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatRevenue(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  getAppointmentClass(isToday: boolean): string {
    return isToday
      ? 'bg-[#185FA5] rounded-lg p-2 text-white'
      : 'bg-[#EBF4FD] border border-[#B5D4F4] rounded-lg p-2';
  }

  getAppointmentNameClass(isToday: boolean): string {
    return isToday
      ? 'text-xs font-semibold leading-tight'
      : 'text-xs font-semibold text-[#185FA5] leading-tight';
  }

  getAppointmentSubtextClass(isToday: boolean): string {
    return isToday ? 'text-[10px] text-[#B5D4F4] mt-0.5' : 'text-[10px] text-[#5F5E5A] mt-0.5';
  }

  getAppointmentTimeClass(isToday: boolean): string {
    return isToday ? 'text-[10px] text-[#B5D4F4]' : 'text-[10px] text-[#888780]';
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private getWeekStart(offset: number): Date {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private buildWeekDays(start: Date): WeekDay[] {
    const today = this.startOfDay(new Date());
    return this.DAY_LABELS.map((label, i) => {
      const date = this.addDays(start, i);
      return {
        date,
        label,
        dayNum: String(date.getDate()).padStart(2, '0'),
        isToday: date.getTime() === today.getTime(),
      };
    });
  }

  private formatWeekRange(start: Date): string {
    const end = this.addDays(start, 4);
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}–${end.getDate()} ${months[start.getMonth()]}, ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${months[start.getMonth()]}–${end.getDate()} ${months[end.getMonth()]}, ${start.getFullYear()}`;
  }

  private generateTimeSlots(startHour: number, endHour: number): string[] {
    const slots: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }

  private buildCalendarGrid(appointments: ClientAppointment[], weekDays: WeekDay[]): CalendarRow[] {
    return this.timeSlots.map((time) => {
      const [slotH] = time.split(':').map(Number);
      const cells: CalendarCell[] = weekDays.map((day) => {
        const slotStart = new Date(day.date);
        slotStart.setHours(slotH, 0, 0, 0);
        const slotEnd = new Date(day.date);
        slotEnd.setHours(slotH + 1, 0, 0, 0);

        const appointment =
          appointments.find((a) => {
            const d = new Date(a.scheduledAt);
            return d >= slotStart && d < slotEnd && a.status !== AppointmentStatus.CANCELLED;
          }) ?? null;

        return { appointment, isToday: day.isToday };
      });
      return { time, cells };
    });
  }
}
