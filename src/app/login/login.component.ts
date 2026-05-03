import { Component } from '@angular/core';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public activeTab;

  constructor(private storeService: StoreService) {
    this.activeTab = this.storeService.activeTab;
  }

  public showLogin(): void {
    this.storeService.updateActiveTab('login');
  }

  public showRegister(): void {
    this.storeService.updateActiveTab('register');
  }
}
