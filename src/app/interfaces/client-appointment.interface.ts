import { AppointmentStatus } from '../utils/enums/AppointmentStatus';

export interface ClientAppointment {
  id: string;
  status: AppointmentStatus;
  scheduledAt: string;
  endsAt: string;
  cancelledAt?: string | null;
  cancellationNote?: string | null;
  client: { id: string; name: string };
  professional: { id: string; user: { id: string; name: string } };
  service: { id: string; name: string; price: number };
}
