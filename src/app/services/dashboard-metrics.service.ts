import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../env/environments';
import { DashboardMetrics } from '../interfaces/dashboard-metrics.interface';

@Injectable({ providedIn: 'root' })
export class DashboardMetricsService {
  private apiUrl = inject(API_URL);

  constructor(private http: HttpClient) {}

  public getMetrics(from: string, to: string) {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard`, {
      params: { from, to },
    });
  }
}
