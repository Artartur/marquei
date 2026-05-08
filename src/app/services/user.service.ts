import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../../env/environments';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private httpClient: HttpClient) {}

  public me() {
    return this.httpClient.get<User>(`${apiUrl}/auth/me`);
  }

  public findAll() {
    return this.httpClient.get<User[]>(`${apiUrl}/users`);
  }

  public findProfessionals() {
    return this.httpClient.get<User[]>(`${apiUrl}/users/professionals`);
  }

  public findProfessionalRecords() {
    return this.httpClient.get<User[]>(`${apiUrl}/professionals`);
  }

  public updateRole(id: string, role: string) {
    return this.httpClient.patch<User>(`${apiUrl}/users/${id}`, { role });
  }
}
