import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _items$ = new BehaviorSubject<Toast[]>([]);
  public items$ = this._items$.asObservable();

  private _id = 0;

  private _add(message: string, type: ToastType, duration: number): void {
    const id = ++this._id;
    this._items$.next([...this._items$.value, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  public dismiss(id: number): void {
    this._items$.next(this._items$.value.filter((t) => t.id !== id));
  }

  public error(message: string, duration = 4000): void {
    this._add(message, 'error', duration);
  }

  public success(message: string, duration = 4000): void {
    this._add(message, 'success', duration);
  }

  public warning(message: string, duration = 4000): void {
    this._add(message, 'warning', duration);
  }
}
