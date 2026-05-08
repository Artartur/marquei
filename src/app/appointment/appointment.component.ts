import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../services/user.service';
import { ServicesService } from '../services/services.service';
import { AppointmentService } from '../services/appointment.service';
import { ToastService } from '../services/toast.service';
import { User } from '../interfaces/user.interface';
import { Service } from '../interfaces/service.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointment',
  standalone: false,
  templateUrl: './appointment.component.html',
})
export class AppointmentComponent implements OnInit {
  public currentStep = 1;

  public services$!: Observable<Service[]>;
  public selectedService: Service | null = null;

  public professionals$!: Observable<User[]>;
  public selectedProfessional: User | null = null;

  public professionalRecords$!: Observable<User[]>;
  private professionalRecords: User[] = [];
  private selectedProfessionalRecord: User | null = null;

  public calendarMonth: Date = new Date();
  public calendarDays: (Date | null)[] = [];
  public selectedDate: Date | null = null;

  private slotsTrigger$ = new Subject<{
    date: string;
    professionalId: string;
    serviceId: string;
  }>();
  public availableSlots$!: Observable<string[] | null>;
  public selectedSlot: string | null = null;

  public notes = '';
  public submitted = false;
  public confirming = false;

  readonly weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  get calendarMonthLabel(): string {
    return this.calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  get selectedDateLabel(): string {
    if (!this.selectedDate) return '—';
    return this.selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  get selectedSlotLabel(): string {
    return this.selectedSlot ? this.formatSlot(this.selectedSlot) : '—';
  }

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
    private servicesService: ServicesService,
    private userService: UserService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.availableSlots$ = this.slotsTrigger$.pipe(
      switchMap(({ date, professionalId, serviceId }) =>
        this.appointmentService.getAvailableSlots(date, professionalId, serviceId).pipe(
          catchError(() => of([] as string[])),
          map((slots) => slots as string[] | null),
          startWith(null as string[] | null),
        ),
      ),
    );

    this.services$ = this.servicesService.findAll().pipe(
      map((services) => services.filter((s) => s.active)),
      tap((services) => {
        if (services.length > 0) this.selectedService = services[0];
      }),
    );

    this.professionals$ = this.userService.findProfessionals().pipe(catchError(() => of([])));

    this.professionalRecords$ = this.userService
      .findProfessionalRecords()
      .pipe(catchError(() => of([])));
    this.professionalRecords$.subscribe((records) => (this.professionalRecords = records));

    this.buildCalendar();
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public buildCalendar(): void {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstWeekDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarDays = [];
    for (let i = 0; i < firstWeekDay; i++) this.calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) this.calendarDays.push(new Date(year, month, d));
  }

  public canProceed(): boolean {
    if (this.currentStep === 1) return !!this.selectedService;
    if (this.currentStep === 2) return !!this.selectedProfessional;
    if (this.currentStep === 3) return !!this.selectedDate && !!this.selectedSlot;
    return true;
  }

  public confirm(): void {
    if (
      this.confirming ||
      !this.selectedService?.id ||
      !this.selectedProfessionalRecord?.professionalId ||
      !this.selectedSlot
    )
      return;

    this.confirming = true;
    this.appointmentService
      .create({
        serviceId: this.selectedService.id,
        professionalId: this.selectedProfessionalRecord.professionalId,
        scheduledAt: this.selectedSlot,
      })
      .subscribe({
        next: () => {
          this.confirming = false;
          this.submitted = true;
          this.toast.success('Agendamento realizado com sucesso!');
          this.router.navigate(['/appointment']);
        },
        error: (e) => {
          this.confirming = false;
          const msg = e?.error?.message;
          this.toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Erro ao realizar agendamento.'));
        },
      });
  }

  public formatSlot(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  public isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  public isSelectedDate(date: Date | null): boolean {
    if (!date || !this.selectedDate) return false;
    return date.toDateString() === this.selectedDate.toDateString();
  }

  public isToday(date: Date | null): boolean {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  }

  public nextStep(): void {
    if (this.canProceed() && this.currentStep < 4) this.currentStep++;
  }

  public nextMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + 1,
      1,
    );
    this.buildCalendar();
  }

  public prevMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() - 1,
      1,
    );
    this.buildCalendar();
  }

  public prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  public selectDate(date: Date | null): void {
    if (!date || this.isPastDate(date)) return;
    this.selectedDate = date;
    this.selectedSlot = null;

    if (this.selectedProfessionalRecord?.professionalId && this.selectedService?.id) {
      this.slotsTrigger$.next({
        date: this.toLocalDateString(date),
        professionalId: this.selectedProfessionalRecord.professionalId,
        serviceId: this.selectedService.id,
      });
    }
  }

  public selectProfessional(professional: User): void {
    this.selectedProfessional = professional;
    this.selectedProfessionalRecord =
      this.professionalRecords.find((r) => r.id === professional.id) ?? null;
  }

  public selectService(service: Service): void {
    this.selectedService = service;
  }

  public selectSlot(slot: string): void {
    this.selectedSlot = slot;
  }
}
