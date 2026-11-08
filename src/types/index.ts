export type RoomType = 'Small' | 'Medium' | 'Large' | 'VIP' | 'VVIP';

export type RoomStatus = 'available' | 'occupied' | 'warning' | 'cleaning' | 'maintenance';

export interface FnbOrderItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  timestamp: string;
}

export interface LcBookingItem {
  id: string;
  lcId: string;
  lcName: string;
  startTime: string;
  durationHours: number;
  hourlyRate: number;
  totalFee: number;
  notes?: string;
}

export interface ActiveSession {
  customerName: string;
  customerPhone?: string;
  checkInTime: string; // ISO string
  durationHours: number; // in hours (e.g., 1, 2, 3 or flexible)
  isFlexible: boolean; // open time
  hourlyRate: number;
  deposit: number;
  isPaused: boolean;
  pausedAt?: string;
  pausedRemainingSeconds?: number;
  extendedMinutes: number;
  notes?: string;
  fnbOrders: FnbOrderItem[];
  lcBookings: LcBookingItem[];
}

export interface Room {
  id: string;
  number: string;
  name: string;
  type: RoomType;
  capacity: number;
  hourlyRate: number;
  status: RoomStatus;
  activeSession?: ActiveSession;
}

export interface FnbItem {
  id: string;
  code: string;
  name: string;
  category: 'Minuman' | 'Makanan Berat' | 'Snack & Bites' | 'Paket Combo' | 'Rokok & Lainnya';
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  isAvailable: boolean;
  image?: string;
}

export interface LadyCompanion {
  id: string;
  code: string;
  name: string;
  nickname: string;
  phone: string;
  hourlyRate: number;
  commissionPercent: number; // e.g. 70% to LC, 30% to lounge
  status: 'ready' | 'on_duty' | 'break' | 'off';
  currentRoomId?: string;
  currentRoomName?: string;
  activeStartTime?: string;
  activeDurationHours?: number;
  totalHoursToday: number;
  totalEarningsToday: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  roomId?: string;
  roomName: string;
  roomType?: string;
  customerName: string;
  customerPhone?: string;
  checkInTime: string;
  checkOutTime: string;
  roomDurationHours: number;
  roomRate: number;
  roomTotal: number;
  fnbOrders: FnbOrderItem[];
  fnbTotal: number;
  lcBookings: LcBookingItem[];
  lcTotal: number;
  subtotal: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'qris' | 'debit' | 'transfer';
  cashGiven?: number;
  changeGiven?: number;
  depositUsed: number;
  cashierName: string;
  shiftId?: string;
  notes?: string;
  createdAt: string;
  syncedToAppsScript?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Operasional' | 'Dapur & Bahan' | 'Tips/Insentif' | 'Maintenance & Sound' | 'Lainnya';
  description: string;
  amount: number;
  cashierName: string;
  createdAt: string;
  syncedToAppsScript?: boolean;
}

export interface ShiftSession {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  totalCashSales: number;
  totalNonCashSales: number;
  totalExpenses: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'cashier';
  pin: string;
}

export interface AppsScriptConfig {
  webAppUrl: string;
  isConfigured: boolean;
  autoSync: boolean;
  lastSyncTime?: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastError?: string;
}

export type ReceiptPaperWidth = '58mm' | '80mm';

export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  footerNote: string;
  taxPercent: number;
  serviceChargePercent: number;
  defaultPaperWidth: ReceiptPaperWidth;
}
