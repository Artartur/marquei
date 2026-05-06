import { computed, Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly _currentUser = signal<User | null>(null);

  private readonly _activeTab = signal<'login' | 'register'>('login');
  private readonly _accessToken = signal<string>('');

  public readonly currentUser = this._currentUser.asReadonly();

  public readonly activeTab = this._activeTab.asReadonly();
  public readonly accessToken = this._accessToken.asReadonly();

  public readonly isAuthenticated = computed(() => !!this._currentUser());

  public updateCurrentUser(user: User | null): void {
    this._currentUser.set(user);
  }

  public updateActiveTab(name: 'login' | 'register'): void {
    this._activeTab.set(name);
  }

  public updateAcessToken(token: string): void {
    this._accessToken.set(token);
  }
}
