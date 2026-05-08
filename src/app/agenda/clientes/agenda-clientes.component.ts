import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AppointmentService } from '../../services/appointment.service';
import { ClientAppointment } from '../../interfaces/client-appointment.interface';
import { AppointmentStatus } from '../../utils/enums/AppointmentStatus';

interface ClientEntry {
  id: string;
  name: string;
  totalAppointments: number;
  lastAppointment: ClientAppointment;
}

@Component({
  selector: 'app-agenda-clientes',
  standalone: false,
  templateUrl: './agenda-clientes.component.html',
})
export class AgendaClientesComponent {
  private readonly search$ = new BehaviorSubject<string>('');
  readonly clients$: Observable<ClientEntry[]>;

  constructor(private readonly appointmentService: AppointmentService) {
    const allClients$ = this.appointmentService.getAppointments().pipe(
      map(apps => {
        const clientMap = new Map<string, ClientEntry>();
        apps.forEach(a => {
          const entry = clientMap.get(a.client.id);
          if (!entry) {
            clientMap.set(a.client.id, {
              id: a.client.id,
              name: a.client.name,
              totalAppointments: 1,
              lastAppointment: a,
            });
          } else {
            entry.totalAppointments++;
            if (new Date(a.scheduledAt) > new Date(entry.lastAppointment.scheduledAt)) {
              entry.lastAppointment = a;
            }
          }
        });
        return Array.from(clientMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR'),
        );
      }),
      shareReplay(1),
    );

    this.clients$ = combineLatest([allClients$, this.search$]).pipe(
      map(([clients, q]) =>
        !q ? clients : clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())),
      ),
    );
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'Agendado',
      [AppointmentStatus.COMPLETED]: 'Concluído',
      [AppointmentStatus.CANCELLED]: 'Cancelado',
      [AppointmentStatus.NO_SHOW]: 'Não compareceu',
    };
    return labels[status] ?? status;
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'bg-[#EBF4FD] text-[#185FA5]',
      [AppointmentStatus.COMPLETED]: 'bg-[#D1FAE5] text-[#065F46]',
      [AppointmentStatus.CANCELLED]: 'bg-[#F3F4F6] text-[#6B7280]',
      [AppointmentStatus.NO_SHOW]: 'bg-[#FEE2E2] text-[#991B1B]',
    };
    return classes[status] ?? 'bg-[#F3F4F6] text-[#6B7280]';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
}
