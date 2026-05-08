import { Component, inject } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  public items$!: Observable<Toast[]>;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.items$ = this.toastService.items$;
  }

  public trackById(_: number, toast: Toast): number {
    return toast.id;
  }

  public dismiss(id: number) {
    this.toastService.dismiss(id);
  }
}
