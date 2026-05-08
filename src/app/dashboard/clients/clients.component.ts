import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject, of } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { UserRole } from '../../utils/enums/UserRole';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-clients',
  standalone: false,
  templateUrl: './clients.component.html',
})
export class ClientsComponent implements OnInit {
  private search$ = new BehaviorSubject<string>('');
  private refresh$ = new Subject<void>();

  public filteredClients$!: Observable<User[]>;

  public selectedClient: User | null = null;
  public updatingRole = false;

  public UserRole = UserRole;

  public roleOptions = [
    { value: UserRole.CLIENT, label: 'Cliente' },
    { value: UserRole.PROFESSIONAL, label: 'Profissional' },
    { value: UserRole.MANAGER, label: 'Gestor' },
  ];

  constructor(
    private userService: UserService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const users$ = this.refresh$.pipe(
      startWith(undefined as void),
      switchMap(() => this.userService.findAll().pipe(catchError(() => of([])))),
    );

    this.filteredClients$ = combineLatest([users$, this.search$]).pipe(
      map(([users, q]) => {
        const clients = users.filter((u) => u.role === UserRole.CLIENT);
        return !q
          ? clients
          : clients.filter(
              (c) =>
                c.name.toLowerCase().includes(q.toLowerCase()) ||
                c.email.toLowerCase().includes(q.toLowerCase()) ||
                c.phone.includes(q),
            );
      }),
    );
  }

  public onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  public openClient(client: User): void {
    this.selectedClient = client;
  }

  public closeClient(): void {
    this.selectedClient = null;
  }

  public updateRole(role: UserRole): void {
    if (!this.selectedClient?.id || this.updatingRole || this.selectedClient.role === role) return;
    this.updatingRole = true;
    this.userService
      .updateRole(this.selectedClient.id, role)
      .pipe(finalize(() => (this.updatingRole = false)))
      .subscribe({
        next: () => {
          this.selectedClient = null;
          this.refresh$.next();
          this.toast.success('Cargo atualizado com sucesso.');
        },
        error: () => {
          this.toast.error('Erro ao atualizar cargo.');
        },
      });
  }

  public roleLabel(role: string | undefined): string {
    const labels: Record<string, string> = {
      CLIENT: 'Cliente',
      PROFESSIONAL: 'Profissional',
      MANAGER: 'Gestor',
    };
    return labels[role ?? ''] ?? role ?? '';
  }
}
