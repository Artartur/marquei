import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: false,
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent {
  public currentUser: User | null = null;

  constructor(
    private storeService: StoreService,
    private authService: AuthService,
  ) {
    this.currentUser = this.storeService.currentUser();
  }

  public logout(): void {
    this.authService.logout().subscribe();
  }
}
