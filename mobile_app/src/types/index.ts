export interface User {
  _id: string;
  username: string;
  name: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  total: string;
  headquarters: string;
  team: string;
  position: string;
  isWorking: boolean;
  lastCheckIn?: Date;
  lastCheckOut?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Customer {
  _id: string;
  hasReservation: boolean;
  name: string;
  phone: string;
  city: string;
  district: string;
  gender: 'male' | 'female';
  ageGroup: '10s' | '20s' | '30s' | '40s' | '50s' | '60s' | '70s' | '80s' | '90s';
  visitDate: Date;
  visitTime: string;
  assignedTo?: User;
  customerType: 'reserved' | 'walkin' | 'returning';
  reservationInfo?: {
    total: string;
    headquarters: string;
    team: string;
    position: string;
  };
  status: 'waiting' | 'confirmed' | 'completed';
  notificationSent: boolean;
  notificationConfirmed: boolean;
}

export interface CustomerCall {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: 'reserved' | 'walkin' | 'returning';
  assignedTo: User;
  timestamp: Date;
  status: 'pending' | 'confirmed';
}

export interface WorkingOrder {
  _id: string;
  order: number;
  staff: User;
  total: string;
  headquarters: string;
  team: string;
  position: string;
  isActive: boolean;
  currentCustomers: number;
  maxCustomers: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface NotificationState {
  notifications: CustomerCall[];
  unreadCount: number;
}