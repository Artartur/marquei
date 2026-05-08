import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { ClientAppointment } from '../../interfaces/client-appointment.interface';
import { AppointmentStatus } from '../../utils/enums/AppointmentStatus';
import { finalize, map, Observable } from 'rxjs';
import { ToastService } from '../../services/toast.service';

type AppointmentGroup = {
  date: string;
  appointments: AppointmentWithFormattedHour[];
};

type AppointmentWithFormattedHour = ClientAppointment & {
  formattedHour: string;
};

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
    { value: 'CANCELLED', label: 'Cancelado' },
    { value: 'COMPLETED', label: 'Concluído' },
    { value: 'NO_SHOW', label: 'Não compareceu' },
    { value: 'SCHEDULED', label: 'Agendado' },
  ];

  public statusFilter = 'ALL';

  constructor(
    private appointmentsService: AppointmentService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.getAppointments();
  }

  public getAppointments() {
    this.appointments$ = this.appointmentsService.getAppointments().pipe(
      map((appoints) => {
        const filtered =
          this.statusFilter === 'ALL'
            ? appoints
            : appoints.filter((a) => a.status === this.statusFilter);

        const formattedAppointments = filtered.map((appoint) => {
          const date = new Date(appoint.scheduledAt);
          date.setHours(date.getHours() - 3);

          return {
            ...appoint,
            formattedHour: date.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            formattedDate: date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
          };
        });

        return formattedAppointments.reduce((acc, appoint) => {
          const existingGroup = acc.find((group) => group.date === appoint.formattedDate);
          if (existingGroup) {
            existingGroup.appointments.push(appoint);
          } else {
            acc.push({ date: appoint.formattedDate, appointments: [appoint] });
          }
          return acc;
        }, [] as AppointmentGroup[]);
      }),
    );
  }

  public setFilter(status: string): void {
    this.statusFilter = status;
    this.getAppointments();
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
          this.getAppointments();
          this.toast.success('Status atualizado com sucesso.');
        },
        error: () => {
          this.toast.error('Erro ao atualizar status.');
        },
      });
  }

  public formatTime(iso: string): string {
    const date = new Date(iso);
    date.setHours(date.getHours() - 3);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  public statusClass(status: string): string {
    const classes: Record<string, string> = {
      CANCELLED: 'bg-red-50 text-red-700',
      COMPLETED: 'bg-green-50 text-green-700',
      SCHEDULED: 'bg-[#D4F0FF] text-[#1496DE]',
      NO_SHOW: 'bg-[#FEF3C7] text-[#92400E]',
    };
    return classes[status] ?? '';
  }

  public statusLabel(status: string): string {
    const labels: Record<string, string> = {
      CANCELLED: 'Cancelado',
      COMPLETED: 'Concluído',
      NO_SHOW: 'Não compareceu',
      SCHEDULED: 'Agendado',
    };
    return labels[status] ?? status;
  }
}
