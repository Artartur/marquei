import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../env/environments';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = inject(API_URL);

  constructor(private httpClient: HttpClient) {}

  public me() {
    return this.httpClient.get<User>(`${this.apiUrl}/auth/me`);
  }

  public findAll() {
    return this.httpClient.get<User[]>(`${this.apiUrl}/users`);
  }

  public findProfessionals() {
    return this.httpClient.get<User[]>(`${this.apiUrl}/users/professionals`);
  }

  public findProfessionalRecords() {
    return this.httpClient.get<User[]>(`${this.apiUrl}/professionals`);
  }

  public updateRole(id: string, role: string) {
    return this.httpClient.patch<User>(`${this.apiUrl}/users/${id}`, { role });
  }
}
