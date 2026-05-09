import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../env/environments';
import { ImportError, ImportJob, ImportType } from '../interfaces/import-job.interface';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private apiUrl = inject(API_URL);

  constructor(private http: HttpClient) {}

  public getErrors(id: string) {
    return this.http.get<ImportError[]>(`${this.apiUrl}/import/${id}/errors`);
  }

  public getJob(id: string) {
    return this.http.get<ImportJob>(`${this.apiUrl}/import/${id}`);
  }

  public getJobs() {
    return this.http.get<ImportJob[]>(`${this.apiUrl}/import`);
  }

  public upload(file: File, importType: ImportType) {
    const form = new FormData();

    form.append('file', file);
    return this.http.post<ImportJob>(`${this.apiUrl}/import?type=${importType}`, form);
  }
}
