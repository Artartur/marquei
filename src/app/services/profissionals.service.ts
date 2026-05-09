import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../env/environments';
import { User } from '../interfaces/user.interface';
import { Service } from '../interfaces/service.interface';

export interface WorkSchedule {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfissionalsService {
  private apiUrl = inject(API_URL);

  constructor(private httpClient: HttpClient) {}

  public findAll() {
    return this.httpClient.get<User[]>(`${this.apiUrl}/professionals`);
  }

  public getSchedule(professionalId: string) {
    return this.httpClient.get<WorkSchedule[]>(
      `${this.apiUrl}/professionals/${professionalId}/schedule`,
    );
  }

  public replaceSchedule(
    professionalId: string,
    schedules: { dayOfWeek: string; startTime: string; endTime: string }[],
  ) {
    return this.httpClient.put<WorkSchedule[]>(
      `${this.apiUrl}/professionals/${professionalId}/schedule`,
      { schedules },
    );
  }

  public getProfessionalServices(professionalId: string) {
    return this.httpClient.get<Service[]>(`${this.apiUrl}/professionals/${professionalId}/services`);
  }

  public linkService(professionalId: string, serviceId: string) {
    return this.httpClient.post(`${this.apiUrl}/professionals/${professionalId}/services`, {
      serviceId,
    });
  }

  public unlinkService(professionalId: string, serviceId: string) {
    return this.httpClient.delete(
      `${this.apiUrl}/professionals/${professionalId}/services/${serviceId}`,
    );
  }
}
