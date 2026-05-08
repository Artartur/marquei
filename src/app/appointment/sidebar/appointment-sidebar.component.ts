import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-appointment-sidebar',
  standalone: false,
  templateUrl: './appointment-sidebar.component.html',
})
export class AppointmentSidebarComponent {
  readonly currentUser: User | null;

  constructor(
    private readonly authService: AuthService,
    private readonly storeService: StoreService,
  ) {
    this.currentUser = this.storeService.currentUser();
  }

  public getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  public logout(): void {
    this.authService.logout().subscribe();
  }
}
