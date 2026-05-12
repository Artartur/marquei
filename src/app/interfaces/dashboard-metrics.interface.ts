export interface ProfessionalOccupation {
  professionalId: string;
  professionalName: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  bookedMinutes: number;
  availableMinutes: number;
  occupationRate: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  estimatedRevenue: number;
}

export interface DashboardMetrics {
  period: { from: string; to: string };
  totalAppointments: number;
  noShowRate: number;
  estimatedRevenue: number;
  occupationByProfessional: ProfessionalOccupation[];
  topServices: TopService[];
}
