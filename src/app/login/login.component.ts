import { Component } from '@angular/core';
import { StoreService } from '../services/store.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public loginForm: FormGroup;

  public isLoading = false;

  public activeTab;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private storeService: StoreService,
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
        console.log('entrou');
        // redirecionar, ex: this.router.navigate(['/dashboard'])
      },
      error: () => {
        this.isLoading = false;
        // tratar erro
      },
    });
  }
}
