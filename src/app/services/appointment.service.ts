import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../../env/environments';
import { ClientAppointment } from '../interfaces/client-appointment.interface';

export interface CreateAppointmentDto {
  serviceId: string;
  professionalId: string;
  scheduledAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  constructor(private httpClient: HttpClient) {}

  public cancel(id: string, cancellationNote?: string) {
    return this.httpClient.patch(`${apiUrl}/appointments/${id}/cancel`, { cancellationNote });
  }

  public create(dto: CreateAppointmentDto) {
    return this.httpClient.post(`${apiUrl}/appointments`, dto);
  }

  public getAppointments() {
    return this.httpClient.get<ClientAppointment[]>(`${apiUrl}/appointments/history`);
  }

  public getMyAppointments(clientId: string) {
    return this.httpClient.get<ClientAppointment[]>(`${apiUrl}/appointments/history`, {
      params: { clientId },
    });
  }

  public getAvailableSlots(date: string, professionalId: string, serviceId: string) {
    return this.httpClient.get<string[]>(`${apiUrl}/appointments/available`, {
      params: { date, professionalId, serviceId },
    });
  }

  public updateStatus(id: string, status: string) {
    return this.httpClient.patch(`${apiUrl}/appointments/${id}/status`, { status });
  }

  public reschedule(id: string, scheduledAt: string) {
    return this.httpClient.patch(`${apiUrl}/appointments/${id}/reschedule`, { scheduledAt });
  }
}
