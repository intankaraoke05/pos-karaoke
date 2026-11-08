/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Room,
  FnbItem,
  LadyCompanion,
  Transaction,
  Expense,
  ShiftSession,
  UserAccount,
  AppsScriptConfig,
  ReceiptPaperWidth,
  BusinessProfile,
  ActiveSession,
  FnbOrderItem,
  LcBookingItem,
} from './types';
import {
  INITIAL_ROOMS,
  INITIAL_FNB,
  INITIAL_LC,
  INITIAL_USERS,
  INITIAL_BUSINESS_PROFILE,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { RoomGrid } from './components/RoomGrid';
import { CheckInModal } from './components/CheckInModal';
import { ExtendRoomModal } from './components/ExtendRoomModal';
import { OrderFnbModal } from './components/OrderFnbModal';
import { LcAssignModal } from './components/LcAssignModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptView } from './components/ReceiptView';
import { LcManagement } from './components/LcManagement';
import { FnbManagement } from './components/FnbManagement';
import { FinancialReports } from './components/FinancialReports';
import { AppsScriptSettingsModal } from './components/AppsScriptSettingsModal';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { RoomOrderManagerModal } from './components/RoomOrderManagerModal';
import { soundManager } from './services/soundService';
import { getRoomSessionTiming } from './utils/formatters';
import {
  syncTransactionToAppsScript,
  syncExpenseToAppsScript,
  syncShiftToAppsScript,
} from './services/appsScriptService';

export default function App() {
  // LocalStorage-backed state initialization
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_rooms');
      return saved ? JSON.parse(saved) : INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [fnbCatalog, setFnbCatalog] = useState<FnbItem[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_fnb');
      return saved ? JSON.parse(saved) : INITIAL_FNB;
    } catch {
      return INITIAL_FNB;
    }
  });

  const [lcRoster, setLcRoster] = useState<LadyCompanion[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_lc');
      return saved ? JSON.parse(saved) : INITIAL_LC;
    } catch {
      return INITIAL_LC;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_transactions');
      if (saved) return JSON.parse(saved);
      // Sample recent transactions
      return [
        {
          id: 'tx-sample-1',
          invoiceNumber: 'INV-KTV20261108-001-492',
          roomId: 'rm-03',
          roomName: 'Room 03 (Medium)',
          roomType: 'Medium',
          customerName: 'Ibu Ratna & Teman',
          checkInTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          checkOutTime: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          roomDurationHours: 2,
          roomRate: 90000,
          roomTotal: 180000,
          fnbOrders: [
            { id: '1', itemId: 'fnb-1', name: 'Ice Tea Manis Jumbo', price: 15000, qty: 3, timestamp: '' },
            { id: '2', itemId: 'fnb-7', name: 'French Fries Crispy', price: 25000, qty: 1, timestamp: '' },
          ],
          fnbTotal: 70000,
          lcBookings: [],
          lcTotal: 0,
          subtotal: 250000,
          serviceChargePercent: 5,
          serviceChargeAmount: 12500,
          taxPercent: 10,
          taxAmount: 26250,
          discountAmount: 0,
          grandTotal: 288750,
          paymentMethod: 'qris',
          cashGiven: 288750,
          changeGiven: 0,
          depositUsed: 0,
          cashierName: 'Siti Rahma (Kasir 1)',
          createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          syncedToAppsScript: true,
        },
      ];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_expenses');
      return saved ? JSON.parse(saved) : [
        {
          id: 'exp-1',
          date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          category: 'Operasional',
          description: 'Beli es batu kristal 2 kantong besar & spons mic sanitasi',
          amount: 45000,
          cashierName: 'Siti Rahma (Kasir 1)',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          syncedToAppsScript: true,
        },
      ];
    } catch {
      return [];
    }
  });

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem('ktv_profile');
      return saved ? JSON.parse(saved) : INITIAL_BUSINESS_PROFILE;
    } catch {
      return INITIAL_BUSINESS_PROFILE;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ktv_user');
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Admin by default
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [appsScriptConfig, setAppsScriptConfig] = useState<AppsScriptConfig>(() => {
    try {
      const saved = localStorage.getItem('ktv_appsscript');
      return saved
        ? JSON.parse(saved)
        : {
            webAppUrl: '',
            isConfigured: false,
            autoSync: true,
            status: 'disconnected',
          };
    } catch {
      return {
        webAppUrl: '',
        isConfigured: false,
        autoSync: true,
        status: 'disconnected',
      };
    }
  });

  const [currentShift, setCurrentShift] = useState<ShiftSession>(() => {
    try {
      const saved = localStorage.getItem('ktv_shift');
      if (saved) return JSON.parse(saved);
      return {
        id: 'shift-' + Date.now(),
        cashierId: currentUser?.id || 'u-1',
        cashierName: currentUser?.name || 'Kasir',
        startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        initialCash: 500000, // Rp 500.000 modal awal laci
        totalCashSales: 0,
        totalNonCashSales: 0,
        totalExpenses: 45000,
        expectedCash: 455000,
        status: 'open',
      };
    } catch {
      return {
        id: 'shift-default',
        cashierId: 'u-1',
        cashierName: 'Admin',
        startTime: new Date().toISOString(),
        initialCash: 500000,
        totalCashSales: 0,
        totalNonCashSales: 0,
        totalExpenses: 0,
        expectedCash: 500000,
        status: 'open',
      };
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'rooms' | 'fnb' | 'lc' | 'reports' | 'catalog'>('rooms');
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>('58mm');
  const [, setTimerTick] = useState(0);

  // Modals state
  const [checkInModalRoom, setCheckInModalRoom] = useState<Room | null>(null);
  const [extendModalRoom, setExtendModalRoom] = useState<Room | null>(null);
  const [orderFnbModalOpen, setOrderFnbModalOpen] = useState(false);
  const [orderFnbTargetRoomId, setOrderFnbTargetRoomId] = useState<string | undefined>(undefined);
  const [assignLcModalRoomId, setAssignLcModalRoomId] = useState<string | null>(null);
  const [checkoutModalRoomId, setCheckoutModalRoomId] = useState<string | null>(null);
  const [orderManagerModalRoomId, setOrderManagerModalRoomId] = useState<string | null>(null);
  const [receiptViewTx, setReceiptViewTx] = useState<Transaction | null>(null);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Dynamically derived modal room objects (always reactive to room changes!)
  const assignLcModalRoom = rooms.find((r) => r.id === assignLcModalRoomId) || null;
  const checkoutModalRoom = rooms.find((r) => r.id === checkoutModalRoomId) || null;
  const orderManagerModalRoom = rooms.find((r) => r.id === orderManagerModalRoomId) || null;

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('ktv_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('ktv_fnb', JSON.stringify(fnbCatalog));
  }, [fnbCatalog]);

  useEffect(() => {
    localStorage.setItem('ktv_lc', JSON.stringify(lcRoster));
  }, [lcRoster]);

  useEffect(() => {
    localStorage.setItem('ktv_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ktv_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('ktv_appsscript', JSON.stringify(appsScriptConfig));
  }, [appsScriptConfig]);

  useEffect(() => {
    localStorage.setItem('ktv_shift', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('ktv_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ktv_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // User / Employee Management handlers
  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      }
    }
  };

  // Live Timer Loop: ticks every second to update room countdowns and chime alerts
  const warnedRoomsRef = useRef<Set<string>>(new Set());
  const expiredRoomsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick((t) => t + 1);

      // Check rooms for timer chime warnings
      rooms.forEach((room) => {
        if (room.status === 'occupied' && room.activeSession && !room.activeSession.isPaused && !room.activeSession.isFlexible) {
          const timing = getRoomSessionTiming(room.activeSession);
          if (timing.isExpired && !expiredRoomsRef.current.has(room.id)) {
            expiredRoomsRef.current.add(room.id);
            soundManager.playExpiredAlert();
          } else if (timing.isWarning && !warnedRoomsRef.current.has(room.id)) {
            warnedRoomsRef.current.add(room.id);
            soundManager.playWarningChime();
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rooms]);

  // Keyboard shortcut listener (F2: Quick F&B, Esc: close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setOrderFnbTargetRoomId(undefined);
        setOrderFnbModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Room Actions
  const handleCheckInConfirm = (session: ActiveSession) => {
    if (!checkInModalRoom) return;

    soundManager.playSuccess();

    setRooms((prev) =>
      prev.map((r) =>
        r.id === checkInModalRoom.id
          ? {
              ...r,
              status: 'occupied',
              activeSession: session,
            }
          : r
      )
    );

    setCheckInModalRoom(null);
  };

  const handleExtendConfirm = (additionalMinutes: number) => {
    if (!extendModalRoom || !extendModalRoom.activeSession) return;

    soundManager.playClick();

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === extendModalRoom.id && r.activeSession) {
          return {
            ...r,
            activeSession: {
              ...r.activeSession,
              extendedMinutes: (r.activeSession.extendedMinutes || 0) + additionalMinutes,
            },
          };
        }
        return r;
      })
    );

    // Clear alert flags so user can be reminded again near the new end time
    warnedRoomsRef.current.delete(extendModalRoom.id);
    expiredRoomsRef.current.delete(extendModalRoom.id);

    setExtendModalRoom(null);
  };

  const handleTogglePause = (room: Room) => {
    if (!room.activeSession) return;
    soundManager.playClick();

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === room.id && r.activeSession) {
          const timing = getRoomSessionTiming(r.activeSession);
          if (r.activeSession.isPaused) {
            // Unpause: recalculate check-in time to compensate
            return {
              ...r,
              activeSession: {
                ...r.activeSession,
                isPaused: false,
                pausedAt: undefined,
                pausedRemainingSeconds: undefined,
              },
            };
          } else {
            // Pause
            return {
              ...r,
              activeSession: {
                ...r.activeSession,
                isPaused: true,
                pausedAt: new Date().toISOString(),
                pausedRemainingSeconds: timing.remainingSeconds,
              },
            };
          }
        }
        return r;
      })
    );
  };

  const handleSetRoomStatus = (room: Room, status: Room['status']) => {
    soundManager.playClick();
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              status,
              activeSession: status === 'available' ? undefined : r.activeSession,
            }
          : r
      )
    );
  };

  // F&B Order confirmation
  const handleConfirmFnbOrder = (targetRoomId: string, orderItems: FnbOrderItem[]) => {
    soundManager.playSuccess();

    // 1. Add order items to room
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === targetRoomId && r.activeSession) {
          return {
            ...r,
            activeSession: {
              ...r.activeSession,
              fnbOrders: [...r.activeSession.fnbOrders, ...orderItems],
            },
          };
        }
        return r;
      })
    );

    // 2. Reduce stock in inventory
    setFnbCatalog((prev) =>
      prev.map((catalogItem) => {
        const ordered = orderItems.find((oi) => oi.itemId === catalogItem.id);
        if (ordered) {
          return {
            ...catalogItem,
            stock: Math.max(0, catalogItem.stock - ordered.qty),
          };
        }
        return catalogItem;
      })
    );

    setOrderFnbModalOpen(false);
  };

  // LC Assignment
  const handleAssignLc = (roomId: string, booking: LcBookingItem) => {
    soundManager.playSuccess();

    // Add booking to room
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId && r.activeSession) {
          return {
            ...r,
            activeSession: {
              ...r.activeSession,
              lcBookings: [...r.activeSession.lcBookings, booking],
            },
          };
        }
        return r;
      })
    );

    // Update LC status to on_duty
    setLcRoster((prev) =>
      prev.map((lc) => {
        if (lc.id === booking.lcId) {
          const targetRoom = rooms.find((r) => r.id === roomId);
          return {
            ...lc,
            status: 'on_duty',
            currentRoomId: roomId,
            currentRoomName: targetRoom?.name || 'Room',
            activeStartTime: booking.startTime,
            activeDurationHours: booking.durationHours,
            totalHoursToday: (lc.totalHoursToday || 0) + booking.durationHours,
            totalEarningsToday:
              (lc.totalEarningsToday || 0) + Math.round((booking.totalFee * lc.commissionPercent) / 100),
          };
        }
        return lc;
      })
    );

    setAssignLcModalRoomId(null);
  };

  const handleRemoveLc = (roomId: string, bookingId: string, lcId: string) => {
    soundManager.playClick();

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId && r.activeSession) {
          const bookings = r.activeSession.lcBookings || [];
          // Match by booking ID first, with fallback to lcId
          let removeIdx = bookings.findIndex((b) => b.id && String(b.id) === String(bookingId));
          if (removeIdx === -1 && lcId) {
            removeIdx = bookings.findIndex((b) => b.lcId === lcId);
          }
          const updatedBookings = removeIdx !== -1
            ? bookings.filter((_, idx) => idx !== removeIdx)
            : bookings.filter((b) => String(b.id) !== String(bookingId));

          return {
            ...r,
            activeSession: {
              ...r.activeSession,
              lcBookings: updatedBookings,
            },
          };
        }
        return r;
      })
    );

    setLcRoster((prev) =>
      prev.map((lc) => {
        if (lc.id === lcId) {
          return {
            ...lc,
            status: 'ready',
            currentRoomId: undefined,
            currentRoomName: undefined,
          };
        }
        return lc;
      })
    );
  };

  // Cancel / remove F&B item from room and return stock to inventory
  const handleRemoveFnbItemFromRoom = (
    roomId: string,
    orderItemId: string,
    itemCatalogId: string,
    qty: number
  ) => {
    soundManager.playClick();

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId && r.activeSession) {
          const orders = r.activeSession.fnbOrders || [];
          // Match by orderItemId, with fallback to catalogId
          let removeIdx = orders.findIndex((oi) => oi.id && String(oi.id) === String(orderItemId));
          if (removeIdx === -1 && itemCatalogId) {
            removeIdx = orders.findIndex((oi) => oi.itemId === itemCatalogId);
          }
          const updatedOrders = removeIdx !== -1
            ? orders.filter((_, idx) => idx !== removeIdx)
            : orders.filter((oi) => String(oi.id) !== String(orderItemId));

          return {
            ...r,
            activeSession: {
              ...r.activeSession,
              fnbOrders: updatedOrders,
            },
          };
        }
        return r;
      })
    );

    // Return stock to inventory
    setFnbCatalog((prev) =>
      prev.map((catItem) =>
        catItem.id === itemCatalogId
          ? { ...catItem, stock: catItem.stock + qty }
          : catItem
      )
    );
  };

  // Change quantity of F&B item in room
  const handleChangeFnbQtyInRoom = (
    roomId: string,
    orderItemId: string,
    itemCatalogId: string,
    newQty: number,
    oldQty: number
  ) => {
    const diff = oldQty - newQty;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId && r.activeSession) {
          const orders = r.activeSession.fnbOrders || [];
          let updatedOrders = orders.map((oi) => {
            if ((oi.id && String(oi.id) === String(orderItemId)) || (!oi.id && oi.itemId === itemCatalogId)) {
              return { ...oi, qty: newQty };
            }
            return oi;
          });

          // If newQty <= 0, filter it out completely
          if (newQty <= 0) {
            updatedOrders = updatedOrders.filter((oi) => oi.qty > 0);
          }

          return {
            ...r,
            activeSession: {
              ...r.activeSession,
              fnbOrders: updatedOrders,
            },
          };
        }
        return r;
      })
    );

    // Adjust stock
    setFnbCatalog((prev) =>
      prev.map((catItem) =>
        catItem.id === itemCatalogId
          ? { ...catItem, stock: Math.max(0, catItem.stock + diff) }
          : catItem
      )
    );
  };

  // Checkout Completion
  const handleCompleteCheckout = (transaction: Transaction) => {
    // 1. Free up room & free up any assigned LC
    if (transaction.roomId) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === transaction.roomId
            ? {
                ...r,
                status: 'cleaning', // set to cleaning after checkout
                activeSession: undefined,
              }
            : r
        )
      );

      // Release LC assigned to this room
      setLcRoster((prev) =>
        prev.map((lc) =>
          lc.currentRoomId === transaction.roomId
            ? { ...lc, status: 'ready', currentRoomId: undefined, currentRoomName: undefined }
            : lc
        )
      );
    }

    // 2. Add transaction to ledger
    setTransactions((prev) => [transaction, ...prev]);

    // 3. Update current shift session totals
    setCurrentShift((prev) => {
      const isCash = transaction.paymentMethod === 'cash';
      const newCashSales = prev.totalCashSales + (isCash ? transaction.grandTotal : 0);
      const newNonCashSales = prev.totalNonCashSales + (!isCash ? transaction.grandTotal : 0);
      const newExpectedCash = prev.initialCash + newCashSales - prev.totalExpenses;
      return {
        ...prev,
        totalCashSales: newCashSales,
        totalNonCashSales: newNonCashSales,
        expectedCash: newExpectedCash,
      };
    });

    // 4. Background Sync to Google Apps Script if configured
    if (appsScriptConfig.autoSync && appsScriptConfig.webAppUrl) {
      syncTransactionToAppsScript(appsScriptConfig.webAppUrl, transaction).then((res) => {
        if (res.success) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === transaction.id ? { ...t, syncedToAppsScript: true } : t))
          );
        }
      });
    }

    setCheckoutModalRoomId(null);

    // 5. Open thermal receipt modal immediately for customer printing!
    setReceiptViewTx(transaction);
  };

  // Expenses & Shift handlers
  const handleAddExpense = (expense: Expense) => {
    soundManager.playClick();
    setExpenses((prev) => [expense, ...prev]);

    // Update shift cash
    setCurrentShift((prev) => {
      const newExpenses = prev.totalExpenses + expense.amount;
      const newExpectedCash = prev.initialCash + prev.totalCashSales - newExpenses;
      return {
        ...prev,
        totalExpenses: newExpenses,
        expectedCash: newExpectedCash,
      };
    });

    // Sync to Apps Script if configured
    if (appsScriptConfig.autoSync && appsScriptConfig.webAppUrl) {
      syncExpenseToAppsScript(appsScriptConfig.webAppUrl, expense);
    }
  };

  const handleCloseShift = (actualCash: number, notes?: string) => {
    soundManager.playSuccess();
    const diff = actualCash - currentShift.expectedCash;
    const closedShift: ShiftSession = {
      ...currentShift,
      endTime: new Date().toISOString(),
      actualCash,
      difference: diff,
      status: 'closed',
      notes,
    };

    if (appsScriptConfig.webAppUrl) {
      syncShiftToAppsScript(appsScriptConfig.webAppUrl, closedShift);
    }

    setToastMessage(`Shift Kasir berhasil ditutup! Kas Diharapkan: Rp ${currentShift.expectedCash.toLocaleString('id-ID')} · Kas Aktual: Rp ${actualCash.toLocaleString('id-ID')} · Selisih: ${diff >= 0 ? '+' : ''}Rp ${diff.toLocaleString('id-ID')}`);
    setTimeout(() => setToastMessage(''), 6000);
  };

  const occupiedRoomsCount = rooms.filter((r) => r.status === 'occupied').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        appsScriptConfig={appsScriptConfig}
        paperWidth={paperWidth}
        onChangePaperWidth={setPaperWidth}
        onOpenAppsScriptSettings={() => setIsAppsScriptModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        businessProfile={businessProfile}
        occupiedRoomsCount={occupiedRoomsCount}
      />

      {/* Floating System Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-bounce">
          <div className="bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between text-xs font-semibold backdrop-blur-md">
            <span>✓ {toastMessage}</span>
            <button
              onClick={() => setToastMessage('')}
              className="text-emerald-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'rooms' && (
          <RoomGrid
            rooms={rooms}
            onCheckIn={(room) => setCheckInModalRoom(room)}
            onExtend={(room) => setExtendModalRoom(room)}
            onOrderFnb={(room) => {
              setOrderFnbTargetRoomId(room.id);
              setOrderFnbModalOpen(true);
            }}
            onAssignLc={(room) => setAssignLcModalRoomId(room.id)}
            onTogglePause={handleTogglePause}
            onCheckout={(room) => setCheckoutModalRoomId(room.id)}
            onSetStatus={handleSetRoomStatus}
            onManageOrders={(room) => setOrderManagerModalRoomId(room.id)}
          />
        )}

        {activeTab === 'fnb' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Menu Order F&B (Kitchen & Bar)</h2>
                <p className="text-xs text-slate-400">Pilih menu untuk langsung dimasukkan ke tagihan Room Karaoke</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderFnbTargetRoomId(rooms.find((r) => r.status === 'occupied')?.id || rooms[0]?.id);
                  setOrderFnbModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20"
              >
                + Buka POS Order F&B (F2)
              </button>
            </div>
            {/* Embedded Order Modal component or full view */}
            <OrderFnbModal
              rooms={rooms}
              selectedRoomId={rooms.find((r) => r.status === 'occupied')?.id || rooms[0]?.id}
              fnbCatalog={fnbCatalog}
              onClose={() => setActiveTab('rooms')}
              onConfirmOrder={handleConfirmFnbOrder}
            />
          </div>
        )}

        {activeTab === 'lc' && (
          <LcManagement
            lcRoster={lcRoster}
            rooms={rooms}
            isAdmin={currentUser?.role === 'admin'}
            onUpdateLc={(updated) => {
              setLcRoster((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            }}
            onAddLc={(newLc) => {
              setLcRoster((prev) => [...prev, newLc]);
            }}
            onDeleteLc={(id) => {
              setLcRoster((prev) => prev.filter((l) => l.id !== id));
            }}
          />
        )}

        {activeTab === 'reports' && (
          <FinancialReports
            transactions={transactions}
            expenses={expenses}
            currentShift={currentShift}
            businessProfile={businessProfile}
            isAdmin={currentUser?.role === 'admin'}
            onAddExpense={handleAddExpense}
            onCloseShift={handleCloseShift}
            onReprintReceipt={(tx) => setReceiptViewTx(tx)}
          />
        )}

        {activeTab === 'catalog' && currentUser?.role === 'admin' && (
          <FnbManagement
            fnbCatalog={fnbCatalog}
            isAdmin={true}
            onUpdateItem={(updated) => {
              setFnbCatalog((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            }}
            onAddItem={(newItem) => {
              setFnbCatalog((prev) => [...prev, newItem]);
            }}
            onDeleteItem={(id) => {
              setFnbCatalog((prev) => prev.filter((item) => item.id !== id));
            }}
          />
        )}
      </main>

      {/* MODALS */}

      {/* 1. Check-in Modal */}
      {checkInModalRoom && (
        <CheckInModal
          room={checkInModalRoom}
          onClose={() => setCheckInModalRoom(null)}
          onConfirm={handleCheckInConfirm}
        />
      )}

      {/* 2. Extend Room Modal */}
      {extendModalRoom && (
        <ExtendRoomModal
          room={extendModalRoom}
          onClose={() => setExtendModalRoom(null)}
          onConfirm={handleExtendConfirm}
        />
      )}

      {/* 3. F&B Order POS Modal */}
      {orderFnbModalOpen && (
        <OrderFnbModal
          rooms={rooms}
          selectedRoomId={orderFnbTargetRoomId}
          fnbCatalog={fnbCatalog}
          onClose={() => setOrderFnbModalOpen(false)}
          onConfirmOrder={handleConfirmFnbOrder}
        />
      )}

      {/* 4. LC Assignment Modal */}
      {assignLcModalRoom && (
        <LcAssignModal
          room={assignLcModalRoom}
          lcRoster={lcRoster}
          onClose={() => setAssignLcModalRoomId(null)}
          onAssignLc={handleAssignLc}
          onRemoveLc={handleRemoveLc}
        />
      )}

      {/* 5. Checkout & Billing Payment Modal */}
      {checkoutModalRoom && (
        <CheckoutModal
          room={checkoutModalRoom}
          businessProfile={businessProfile}
          cashierName={currentUser?.name || 'Kasir'}
          onClose={() => setCheckoutModalRoomId(null)}
          onCompleteCheckout={handleCompleteCheckout}
          onRemoveFnbItem={handleRemoveFnbItemFromRoom}
          onRemoveLcBooking={handleRemoveLc}
        />
      )}

      {/* 6. Thermal Receipt View & Print Modal (58mm / 80mm) */}
      {receiptViewTx && (
        <ReceiptView
          transaction={receiptViewTx}
          businessProfile={businessProfile}
          initialPaperWidth={paperWidth}
          onClose={() => setReceiptViewTx(null)}
        />
      )}

      {/* 7. Apps Script Cloud Settings Modal */}
      {isAppsScriptModalOpen && (
        <AppsScriptSettingsModal
          config={appsScriptConfig}
          transactions={transactions}
          expenses={expenses}
          onClose={() => setIsAppsScriptModalOpen(false)}
          onSaveConfig={(newConfig) => setAppsScriptConfig(newConfig)}
          onBatchSyncComplete={() => {
            setTransactions((prev) => prev.map((t) => ({ ...t, syncedToAppsScript: true })));
            setExpenses((prev) => prev.map((e) => ({ ...e, syncedToAppsScript: true })));
          }}
        />
      )}

      {/* 8. Login Admin & Kasir Modal */}
      {isLoginModalOpen && (
        <LoginModal
          users={users}
          currentUser={currentUser}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={(user) => {
            setCurrentUser(user);
            soundManager.playClick();
          }}
          onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        />
      )}

      {/* 9. Kelola Karyawan & Akun Pengguna Modal */}
      {isUserManagementModalOpen && (
        <UserManagementModal
          users={users}
          currentUser={currentUser}
          onClose={() => setIsUserManagementModalOpen(false)}
          onUpdateUser={handleUpdateUser}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {/* 10. Kelola & Batalkan Pesanan Room (F&B / LC) */}
      {orderManagerModalRoom && (
        <RoomOrderManagerModal
          room={orderManagerModalRoom}
          onClose={() => setOrderManagerModalRoomId(null)}
          onRemoveFnbItem={handleRemoveFnbItemFromRoom}
          onChangeFnbQty={handleChangeFnbQtyInRoom}
          onRemoveLcBooking={handleRemoveLc}
          onOpenOrderFnb={(roomId) => {
            setOrderFnbTargetRoomId(roomId);
            setOrderFnbModalOpen(true);
          }}
          onOpenAssignLc={(room) => setAssignLcModalRoomId(room.id)}
        />
      )}
    </div>
  );
}
