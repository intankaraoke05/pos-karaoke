import { ActiveSession, Room } from '../types';

export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTimeHM(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimeIndo(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateInvoiceNumber(seq: number = 1): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `INV-KTV${y}${m}${d}-${String(seq).padStart(3, '0')}-${randomSuffix}`;
}

/**
 * Calculates remaining seconds and status for a room's active session
 */
export function getRoomSessionTiming(session?: ActiveSession): {
  remainingSeconds: number;
  elapsedSeconds: number;
  totalPlannedSeconds: number;
  progressPercent: number;
  isExpired: boolean;
  isWarning: boolean; // < 15 mins (900 seconds)
  formattedRemaining: string;
  formattedElapsed: string;
} {
  if (!session) {
    return {
      remainingSeconds: 0,
      elapsedSeconds: 0,
      totalPlannedSeconds: 0,
      progressPercent: 0,
      isExpired: false,
      isWarning: false,
      formattedRemaining: '00:00:00',
      formattedElapsed: '00:00:00',
    };
  }

  const checkInMs = new Date(session.checkInTime).getTime();
  const nowMs = session.isPaused && session.pausedAt ? new Date(session.pausedAt).getTime() : Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - checkInMs) / 1000));

  if (session.isFlexible) {
    // Open time / flexible: counts up
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return {
      remainingSeconds: 0,
      elapsedSeconds,
      totalPlannedSeconds: 0,
      progressPercent: 100,
      isExpired: false,
      isWarning: false,
      formattedRemaining: 'OPEN TIME',
      formattedElapsed: formatted,
    };
  }

  const totalPlannedMinutes = session.durationHours * 60 + (session.extendedMinutes || 0);
  const totalPlannedSeconds = totalPlannedMinutes * 60;
  
  let remainingSeconds = totalPlannedSeconds - elapsedSeconds;
  if (session.isPaused && session.pausedRemainingSeconds !== undefined) {
    remainingSeconds = session.pausedRemainingSeconds;
  }

  const isExpired = remainingSeconds <= 0;
  const isWarning = !isExpired && remainingSeconds <= 900; // <= 15 minutes

  const absRemaining = Math.abs(remainingSeconds);
  const rHours = Math.floor(absRemaining / 3600);
  const rMinutes = Math.floor((absRemaining % 3600) / 60);
  const rSeconds = absRemaining % 60;

  const formattedRemaining = `${isExpired ? '-' : ''}${String(rHours).padStart(2, '0')}:${String(rMinutes).padStart(2, '0')}:${String(rSeconds).padStart(2, '0')}`;

  const eHours = Math.floor(elapsedSeconds / 3600);
  const eMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const eSeconds = elapsedSeconds % 60;
  const formattedElapsed = `${String(eHours).padStart(2, '0')}:${String(eMinutes).padStart(2, '0')}:${String(eSeconds).padStart(2, '0')}`;

  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalPlannedSeconds) * 100));

  return {
    remainingSeconds,
    elapsedSeconds,
    totalPlannedSeconds,
    progressPercent,
    isExpired,
    isWarning,
    formattedRemaining,
    formattedElapsed,
  };
}

/**
 * Calculates current room total fee based on hourly rate and duration or elapsed time
 */
export function calculateRoomCharge(session: ActiveSession): {
  billableHours: number;
  roomCharge: number;
} {
  if (session.isFlexible) {
    const checkInMs = new Date(session.checkInTime).getTime();
    const nowMs = session.isPaused && session.pausedAt ? new Date(session.pausedAt).getTime() : Date.now();
    const elapsedMinutes = Math.max(1, Math.ceil((nowMs - checkInMs) / (60 * 1000)));
    // Min 1 hour, then rounded to 30 mins or fractional
    const billableHours = Math.max(1, Math.ceil(elapsedMinutes / 30) * 0.5);
    return {
      billableHours,
      roomCharge: Math.round(billableHours * session.hourlyRate),
    };
  }

  const totalMinutes = session.durationHours * 60 + (session.extendedMinutes || 0);
  const billableHours = totalMinutes / 60;
  return {
    billableHours,
    roomCharge: Math.round(billableHours * session.hourlyRate),
  };
}

export function calculateBillSummary(
  session: ActiveSession,
  taxPercent: number = 10,
  servicePercent: number = 5,
  discountAmount: number = 0
) {
  const { billableHours, roomCharge } = calculateRoomCharge(session);

  const fnbTotal = (session.fnbOrders || []).reduce((sum, item) => sum + item.price * item.qty, 0);

  const lcTotal = (session.lcBookings || []).reduce((sum, item) => {
    return sum + (item.totalFee || item.durationHours * item.hourlyRate);
  }, 0);

  const subtotal = roomCharge + fnbTotal + lcTotal;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  const serviceChargeAmount = Math.round((taxableAmount * servicePercent) / 100);
  const taxAmount = Math.round(((taxableAmount + serviceChargeAmount) * taxPercent) / 100);
  
  const grandTotal = Math.max(0, taxableAmount + serviceChargeAmount + taxAmount);
  const remainingToPay = Math.max(0, grandTotal - (session.deposit || 0));

  return {
    billableHours,
    roomCharge,
    fnbTotal,
    lcTotal,
    subtotal,
    discountAmount,
    serviceChargeAmount,
    taxAmount,
    grandTotal,
    deposit: session.deposit || 0,
    remainingToPay,
  };
}
