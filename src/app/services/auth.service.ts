import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Login } from '../interfaces/login.interface';
import { API_URL } from '../../env/environments';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { StoreService } from './store.service';
import { User } from '../interfaces/user.interface';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { UserRole } from '../utils/enums/UserRole';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = inject(API_URL);

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private storeService: StoreService,
  ) {}

  private logoutClear() {
    this.storeService.updateAcessToken('');
    this.storeService.updateCurrentUser(null);
    this.router.navigate(['/']);
  }

  public getAccessToken(): string {
    return this.storeService.accessToken();
  }

  public initSession() {
    return this.httpClient
      .post<Omit<AuthResponse, 'user'>>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.storeService.updateAcessToken(res.accessToken);
        }),
        switchMap(() =>
          this.httpClient.get<Omit<User, 'password'>>(`${this.apiUrl}/auth/me`, {
            withCredentials: true,
          }),
        ),
        tap((user) => this.storeService.updateCurrentUser(user)),
        catchError(() => {
          this.storeService.updateAcessToken('');
          this.storeService.updateCurrentUser(null);
          return of(null);
        }),
      );
  }

  public login(login: Login) {
    return this.httpClient
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, login, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.storeService.updateAcessToken(res.accessToken);
          this.storeService.updateCurrentUser(res.user);

          if (res.user.role === UserRole.CLIENT) this.router.navigate(['/appointment']);
          else if (res.user.role === UserRole.MANAGER) this.router.navigate(['/dashboard']);
          else if (res.user.role === UserRole.PROFESSIONAL) this.router.navigate(['/agenda']);
        }),
      );
  }

  public logout() {
    return this.httpClient.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.logoutClear();
        this.router.navigate(['/']);
      }),
      catchError(() => {
        this.logoutClear();
        return of(null);
      }),
    );
  }

  public register(dto: User) {
    return this.httpClient.post<AuthResponse>(`${this.apiUrl}/auth/sign-up`, dto, {
      withCredentials: true,
    });
  }
}
