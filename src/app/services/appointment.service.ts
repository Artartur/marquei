import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../env/environments';
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
  private apiUrl = inject(API_URL);

  constructor(private httpClient: HttpClient) {}

  public cancel(id: string, cancellationNote?: string) {
    return this.httpClient.patch(`${this.apiUrl}/appointments/${id}/cancel`, { cancellationNote });
  }

  public create(dto: CreateAppointmentDto) {
    return this.httpClient.post(`${this.apiUrl}/appointments`, dto);
  }

  public getAppointments() {
    return this.httpClient.get<ClientAppointment[]>(`${this.apiUrl}/appointments/history`);
  }

  public getMyAppointments(clientId: string) {
    return this.httpClient.get<ClientAppointment[]>(`${this.apiUrl}/appointments/history`, {
      params: { clientId },
    });
  }

  public getAvailableSlots(date: string, professionalId: string, serviceId: string) {
    return this.httpClient.get<string[]>(`${this.apiUrl}/appointments/available`, {
      params: { date, professionalId, serviceId },
    });
  }

  public updateStatus(id: string, status: string) {
    return this.httpClient.patch(`${this.apiUrl}/appointments/${id}/status`, { status });
  }

  public reschedule(id: string, scheduledAt: string) {
    return this.httpClient.patch(`${this.apiUrl}/appointments/${id}/reschedule`, { scheduledAt });
  }
}
