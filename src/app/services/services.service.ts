import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../env/environments';
import { Service } from '../interfaces/service.interface';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private apiUrl = inject(API_URL);

  constructor(private httpClient: HttpClient) {}

  public findAll() {
    return this.httpClient.get<Service[]>(`${this.apiUrl}/services`);
  }

  public findAllActiveServices(isActive: boolean) {
    return this.httpClient.get<Service[]>(`${this.apiUrl}/services/active/${isActive}`);
  }

  public findServiceById(id: string) {
    return this.httpClient.get<Service>(`${this.apiUrl}/services/id/${id}`);
  }

  public create(serviceData: Service) {
    return this.httpClient.post<Service>(`${this.apiUrl}/services`, serviceData);
  }

  public update(id: string, serviceData: Partial<Service>) {
    return this.httpClient.patch<Service>(`${this.apiUrl}/services/${id}`, serviceData);
  }
}
