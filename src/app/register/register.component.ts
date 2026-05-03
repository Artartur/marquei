import { Component } from '@angular/core';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  public activeTab;

  constructor(private storeService: StoreService) {
    this.activeTab = this.storeService.activeTab;
  }

  public showLogin(): void {
    this.storeService.updateActiveTab('login');
  }
}
