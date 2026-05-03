import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly _activeTab = signal<'login' | 'register'>('login');

  public readonly activeTab = this._activeTab.asReadonly();

  public updateActiveTab(name: 'login' | 'register'): void {
    this._activeTab.set(name);
  }
}
