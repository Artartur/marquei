import { UserRole } from '../utils/enums/UserRole';

export interface User {
  id?: string;
  cpf: string;
  email: string;
  name: string;
  password?: string;
  phone: string;
  professionalId?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}
