import { Component, OnInit } from '@angular/core';
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
import { DashboardMetricsService } from '../services/dashboard-metrics.service';
import { DashboardMetrics } from '../interfaces/dashboard-metrics.interface';

type TodayAppointment = ClientAppointment & { formattedHour: string };

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  public createServiceForm!: FormGroup;
  public services$!: Observable<Service[]>;
  public todayAppointments$!: Observable<TodayAppointment[]>;

  public currentUser: User | null = null;
  public selectedService: Service | null = null;
  public isServiceModalOpen = false;

  public clientsCount = 0;
  public professionalsCount = 0;

  public metrics: DashboardMetrics | null = null;
  public loadingMetrics = false;

  public fromDate: string;
  public toDate: string;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private storeService: StoreService,
    private servicesService: ServicesService,
    private usersService: UserService,
    private metricsService: DashboardMetricsService,
  ) {
    const today = new Date();
    this.toDate = today.toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' });
    this.fromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
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
    this.getTodayAppointments();
    this.getUserCounts();
    this.loadMetrics();
  }

  private isToday(iso: string): boolean {
    const tz = 'America/Sao_Paulo';
    const today = new Date().toLocaleDateString('sv', { timeZone: tz });
    return new Date(iso).toLocaleDateString('sv', { timeZone: tz }) === today;
  }

  public avgOccupation(): number {
    const profs = this.metrics?.occupationByProfessional ?? [];
    if (!profs.length) return 0;
    return profs.reduce((sum, p) => sum + p.occupationRate, 0) / profs.length;
  }

  public closeServiceModal(): void {
    this.isServiceModalOpen = false;
    this.selectedService = null;
  }

  public createService() {
    if (this.createServiceForm.invalid) return;
    this.servicesService.create(this.createServiceForm.value).subscribe({
      next: () => {
        this.createServiceForm.reset({ active: true, durationMinutes: 0, price: 0 });
        this.getServices();
      },
    });
  }

  public getServices() {
    this.services$ = this.servicesService.findAll();
  }

  public getTodayAppointments() {
    this.todayAppointments$ = this.appointmentService.getAppointments().pipe(
      map((appointments) => {
        const tz = 'America/Sao_Paulo';
        return appointments
          .filter((a) => this.isToday(a.scheduledAt))
          .map((a) => ({
            ...a,
            date: new Date(a.scheduledAt),
            formattedHour: new Date(a.scheduledAt).toLocaleTimeString('pt-BR', {
              timeZone: tz,
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
      }),
    );
  }

  public getUserCounts() {
    this.usersService.findAll().subscribe((users) => {
      this.professionalsCount = users.filter((u) => u.role === UserRole.PROFESSIONAL).length;
      this.clientsCount = users.filter((u) => u.role === UserRole.CLIENT).length;
    });
  }

  public loadMetrics(): void {
    this.loadingMetrics = true;
    this.metricsService.getMetrics(this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.metrics = data;
        this.loadingMetrics = false;
      },
      error: () => (this.loadingMetrics = false),
    });
  }

  public logout(): void {
    this.authService.logout().subscribe();
  }

  public occupationBarWidth(rate: number): number {
    return Math.round(rate * 100);
  }

  public onPeriodChange(): void {
    if (this.fromDate && this.toDate) this.loadMetrics();
  }

  public onServiceSaved(): void {
    this.getServices();
  }

  public openCreateModal(): void {
    this.selectedService = null;
    this.isServiceModalOpen = true;
  }

  public openEditModal(service: Service): void {
    this.selectedService = service;
    this.isServiceModalOpen = true;
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
