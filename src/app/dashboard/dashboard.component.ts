import { Component } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Service } from '../interfaces/service.interface';
import { map, Observable } from 'rxjs';
import { StoreService } from '../services/store.service';
import { User } from '../interfaces/user.interface';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UserRole } from '../utils/enums/UserRole';
import { ClientAppointment } from '../interfaces/client-appointment.interface';
import { AppointmentService } from '../services/appointment.service';

type TodayAppointment = ClientAppointment & {
  formattedHour: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  public createServiceForm!: FormGroup;
  public services$!: Observable<Service[]>;
  public todayAppointments$!: Observable<TodayAppointment[]>;
  public appointmentsByProfessional$!: Observable<
    {
      professionalName: string;
      total: number;
    }[]
  >;
  public todayRevenue$!: Observable<number>;

  public currentUser: User | null = null;
  public professionals: User[] = [];
  public selectedService: Service | null = null;

  public isServiceModalOpen = false;

  public clientsCount = 0;
  public professionalsCount = 0;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private storeService: StoreService,
    private servicesService: ServicesService,
    private usersService: UserService,
  ) {
    this.currentUser = this.storeService.currentUser();
  }

  ngOnInit() {
    this.createServiceForm = this.fb.group({
      active: true,
      durationMinutes: [0, [Validators.required]],
      name: ['', [Validators.required]],
      price: [0, [Validators.required]],
    });

    this.getServices();
    this.getAppointmentsByProfessional();
    this.getTodayAppointments();
    this.getTodayRevenue();
    this.getUserCounts();
  }

  public createService() {
    if (this.createServiceForm.invalid) return;
    this.servicesService.create(this.createServiceForm.value).subscribe({
      next: () => {
        this.createServiceForm.reset();
        this.getServices();
      },
      error: () => console.log('erro ao criar um serviço'),
    });
  }

  public getServices() {
    this.services$ = this.servicesService.findAll();
  }

  private isToday(iso: string): boolean {
    const tz = 'America/Sao_Paulo';
    const today = new Date().toLocaleDateString('sv', { timeZone: tz });
    return new Date(iso).toLocaleDateString('sv', { timeZone: tz }) === today;
  }

  public getAppointmentsByProfessional() {
    this.appointmentsByProfessional$ = this.appointmentService.getAppointments().pipe(
      map((appointments) => {
        const todayAppointments = appointments.filter((a) => this.isToday(a.scheduledAt));

        const grouped = todayAppointments.reduce(
          (acc, appointment) => {
            const professionalName = appointment.professional.user.name;

            const existing = acc.find((p) => p.professionalName === professionalName);

            if (existing) {
              existing.total += 1;
            } else {
              acc.push({
                professionalName,
                total: 1,
              });
            }

            return acc;
          },
          [] as {
            professionalName: string;
            total: number;
          }[],
        );

        return grouped.sort((a, b) => b.total - a.total);
      }),
    );
  }

  public getTodayAppointments() {
    this.todayAppointments$ = this.appointmentService.getAppointments().pipe(
      map((appointments) => {
        const tz = 'America/Sao_Paulo';
        return appointments
          .filter((a) => this.isToday(a.scheduledAt))
          .map((appointment) => {
            const date = new Date(appointment.scheduledAt);
            return {
              ...appointment,
              date,
              formattedHour: date.toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' }),
            };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime());
      }),
    );
  }

  public getTodayRevenue() {
    this.todayRevenue$ = this.appointmentService.getAppointments().pipe(
      map((appointments) => {
        return appointments
          .filter((appointment) => this.isToday(appointment.scheduledAt) && appointment.status !== 'CANCELLED')
          .reduce((total, appointment) => {
            return total + Number(appointment.service.price);
          }, 0);
      }),
    );
  }

  public getUserCounts() {
    this.usersService.findAll().subscribe((users) => {
      const professionalsList = users.filter((u) => u.role === UserRole.PROFESSIONAL);

      this.professionals = professionalsList;
      this.professionalsCount = professionalsList.length;
      this.clientsCount = users.filter((u) => u.role === UserRole.CLIENT).length;
    });
  }

  public openCreateModal(): void {
    this.selectedService = null;
    this.isServiceModalOpen = true;
  }

  public openEditModal(service: Service): void {
    this.selectedService = service;
    this.isServiceModalOpen = true;
  }

  public closeServiceModal(): void {
    this.isServiceModalOpen = false;
    this.selectedService = null;
  }

  public onServiceSaved(): void {
    this.getServices();
  }

  public logout(): void {
    this.authService.logout().subscribe();
  }

  public statusClass(status: string): string {
    const map: Record<string, string> = {
      CANCELLED: 'bg-red-50 text-red-700',
      COMPLETED: 'bg-green-50 text-green-700',
      SCHEDULED: 'bg-[#D4F0FF] text-[#1496DE]',
      NO_SHOW: 'bg-[#FAA53E] text-[#ED7300]',
    };

    return map[status] ?? '';
  }

  public statusLabel(status: string): string {
    const map: Record<string, string> = {
      CANCELLED: 'Cancelado',
      COMPLETED: 'Concluído',
      NO_SHOW: 'Não compareceu',
      SCHEDULED: 'Agendado',
    };

    return map[status] ?? status;
  }
}
