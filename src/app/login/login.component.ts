import { Component } from '@angular/core';
import { StoreService } from '../services/store.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  public loginForm: FormGroup;

  public isLoading = false;

  public activeTab;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private storeService: StoreService,
    private toast: ToastService,
  ) {
    this.activeTab = this.storeService.activeTab;

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  public showLogin(): void {
    this.storeService.updateActiveTab('login');
  }

  public showRegister(): void {
    this.storeService.updateActiveTab('register');
  }

  public onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('E-mail ou senha incorretos.');
      },
    });
  }
}
