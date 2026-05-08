import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../../env/environments';
import { Service } from '../interfaces/service.interface';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  constructor(private httpClient: HttpClient) {}

  public findAll() {
    return this.httpClient.get<Service[]>(`${apiUrl}/services`);
  }

  public findAllActiveServices(isActive: boolean) {
    return this.httpClient.get<Service[]>(`${apiUrl}/services/active/${isActive}`);
  }

  public findServiceById(id: string) {
    return this.httpClient.get<Service>(`${apiUrl}/services/id/${id}`);
  }

  public create(serviceData: Service) {
    return this.httpClient.post<Service>(`${apiUrl}/services`, serviceData);
  }

  public update(id: string, serviceData: Partial<Service>) {
    return this.httpClient.patch<Service>(`${apiUrl}/services/${id}`, serviceData);
  }
}
