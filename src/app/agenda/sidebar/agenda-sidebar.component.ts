import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-agenda-sidebar',
  standalone: false,
  templateUrl: './agenda-sidebar.component.html',
})
export class AgendaSidebarComponent {
  readonly currentUser: User | null;

  constructor(
    private readonly storeService: StoreService,
    private readonly authService: AuthService,
  ) {
    this.currentUser = this.storeService.currentUser();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
}
