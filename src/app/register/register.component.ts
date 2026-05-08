import { Component } from '@angular/core';
import { StoreService } from '../services/store.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  public registerForm: FormGroup;

  public isLoading = false;

  public activeTab;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private storeService: StoreService,
    private toast: ToastService,
  ) {
    this.activeTab = this.storeService.activeTab;

    this.registerForm = this.fb.group({
      cpf: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  public showLogin(): void {
    this.storeService.updateActiveTab('login');
  }

  public onSubmit() {
    if (this.registerForm.invalid) return;
    this.isLoading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Cadastro realizado! Faça login para continuar.');
        this.storeService.updateActiveTab('login');
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Erro ao criar conta. Verifique os dados e tente novamente.');
      },
    });
  }
}
