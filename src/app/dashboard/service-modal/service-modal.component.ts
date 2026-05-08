import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Service } from '../../interfaces/service.interface';
import { ServicesService } from '../../services/services.service';

@Component({
  selector: 'app-service-modal',
  standalone: false,
  templateUrl: './service-modal.component.html',
})
export class ServiceModalComponent implements OnChanges {
  @Input() service: Service | null = null;
  @Input() isOpen = false;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  public form!: FormGroup;
  public loading = false;

  constructor(
    private fb: FormBuilder,
    private servicesService: ServicesService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      durationMinutes: [30, [Validators.required, Validators.min(1)]],
      active: [true],
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      if (this.service) {
        this.form.setValue({
          name: this.service.name,
          price: this.service.price,
          durationMinutes: this.service.durationMinutes,
          active: this.service.active,
        });
      } else {
        this.form.reset({ active: true, price: 0, durationMinutes: 30, name: '' });
      }
    }
  }

  get isEditMode(): boolean {
    return !!this.service?.id;
  }

  public submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const data: Service = this.form.value;

    const request$ = this.isEditMode
      ? this.servicesService.update(this.service!.id!, data)
      : this.servicesService.create(data);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
        this.close();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  public close(): void {
    this.closed.emit();
  }
}
