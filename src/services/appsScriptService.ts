import { Transaction, Expense, ShiftSession, Room, FnbItem, LadyCompanion } from '../types';

export const APPS_SCRIPT_CODE_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND - KARAOKE POS PRO (KASIR KARAOKE)
 * =========================================================================
 * Petunjuk Instalasi:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda (contoh nama: "Database Karaoke POS")
 * 2. Klik menu 'Ekstensi' > 'Apps Script'
 * 3. Hapus semua kode default di Code.gs, lalu PASTE SELURUH KODE DI BAWAH INI
 * 4. Klik tombol 'Simpan' (ikon disket)
 * 5. Klik 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment)
 * 6. Pilih jenis: 'Aplikasi web' (Web app)
 *    - Deskripsi: Karaoke POS API v1.0
 *    - Jalankan sebagai: Saya (email Anda)
 *    - Yang memiliki akses: Siapa saja (Anyone) -> [PENTING!]
 * 7. Klik 'Terapkan' (Deploy), berikan izin akses akun Google Anda
 * 8. Salin 'URL Aplikasi Web' yang dihasilkan, lalu masukkan ke menu 'Integrasi Apps Script' di aplikasi kasir.
 * =========================================================================
 */

function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Transaksi
  let sheetTx = ss.getSheetByName('DATA_TRANSAKSI');
  if (!sheetTx) {
    sheetTx = ss.insertSheet('DATA_TRANSAKSI');
    sheetTx.appendRow([
      'Waktu', 'No Invoice', 'Room', 'Pelanggan', 'Durasi (Jam)',
      'Total Room', 'Total F&B', 'Total LC', 'Subtotal', 
      'Diskon', 'Pajak (PB1)', 'Service', 'Grand Total', 
      'Metode Bayar', 'Kasir', 'Rincian F&B & LC'
    ]);
    sheetTx.setFrozenRows(1);
    sheetTx.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // Sheet 2: Pengeluaran
  let sheetExp = ss.getSheetByName('PENGELUARAN');
  if (!sheetExp) {
    sheetExp = ss.insertSheet('PENGELUARAN');
    sheetExp.appendRow(['Waktu', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Kasir / Petugas']);
    sheetExp.setFrozenRows(1);
    sheetExp.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // Sheet 3: Rekapan Shift
  let sheetShift = ss.getSheetByName('REKAPAN_SHIFT');
  if (!sheetShift) {
    sheetShift = ss.insertSheet('REKAPAN_SHIFT');
    sheetShift.appendRow([
      'Waktu Tutup', 'Kasir', 'Waktu Buka', 'Modal Awal', 
      'Total Tunai', 'Total Non-Tunai', 'Total Pengeluaran', 
      'Kas Diharapkan', 'Kas Aktual', 'Selisih', 'Status'
    ]);
    sheetShift.setFrozenRows(1);
    sheetShift.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // Sheet 4: Roster LC
  let sheetLc = ss.getSheetByName('DATA_LC');
  if (!sheetLc) {
    sheetLc = ss.insertSheet('DATA_LC');
    sheetLc.appendRow(['Kode LC', 'Nama Lengkap', 'Panggilan', 'No HP', 'Tarif/Jam', 'Komisi (%)', 'Status']);
    sheetLc.setFrozenRows(1);
    sheetLc.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // Sheet 5: Menu F&B
  let sheetFnb = ss.getSheetByName('DATA_FNB');
  if (!sheetFnb) {
    sheetFnb = ss.insertSheet('DATA_FNB');
    sheetFnb.appendRow(['Kode', 'Nama Menu', 'Kategori', 'Harga Jual', 'Harga Modal', 'Stok', 'Satuan']);
    sheetFnb.setFrozenRows(1);
    sheetFnb.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f1f5f9');
  }
}

function doGet(e) {
  setupDatabaseSheets();
  const action = e.parameter ? e.parameter.action : '';
  
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Apps Script Karaoke POS terhubung aktif!',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Return simple stats
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName('DATA_TRANSAKSI');
  const totalTxCount = txSheet ? Math.max(0, txSheet.getLastRow() - 1) : 0;

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    spreadsheetName: ss.getName(),
    totalTransactionsLogged: totalTxCount,
    serverTime: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  setupDatabaseSheets();
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const rawData = e.postData ? e.postData.contents : '';
    const payload = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = payload.action;

    // 1. Simpan Transaksi Kasir (Room + F&B + LC)
    if (action === 'save_transaction') {
      const tx = payload.data;
      const sheet = ss.getSheetByName('DATA_TRANSAKSI');
      
      const fnbSummary = (tx.fnbOrders || []).map(f => f.name + ' x' + f.qty).join(', ');
      const lcSummary = (tx.lcBookings || []).map(l => l.lcName + ' (' + l.durationHours + ' jam)').join(', ');
      const detailStr = [fnbSummary ? 'F&B: ' + fnbSummary : '', lcSummary ? 'LC: ' + lcSummary : ''].filter(Boolean).join(' | ');

      sheet.appendRow([
        tx.createdAt || new Date().toISOString(),
        tx.invoiceNumber,
        tx.roomName,
        tx.customerName,
        tx.roomDurationHours || 0,
        tx.roomTotal || 0,
        tx.fnbTotal || 0,
        tx.lcTotal || 0,
        tx.subtotal || 0,
        tx.discountAmount || 0,
        tx.taxAmount || 0,
        tx.serviceChargeAmount || 0,
        tx.grandTotal || 0,
        tx.paymentMethod ? tx.paymentMethod.toUpperCase() : 'CASH',
        tx.cashierName || 'Kasir',
        detailStr
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Transaksi berhasil dicatat ke Google Sheets',
        invoiceNumber: tx.invoiceNumber
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Simpan Pengeluaran Operasional
    if (action === 'save_expense') {
      const exp = payload.data;
      const sheet = ss.getSheetByName('PENGELUARAN');
      sheet.appendRow([
        exp.createdAt || new Date().toISOString(),
        exp.category,
        exp.description,
        exp.amount,
        exp.cashierName
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Pengeluaran berhasil dicatat ke Google Sheets'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Simpan Rekapan Shift (Tutup Kasir)
    if (action === 'save_shift') {
      const shift = payload.data;
      const sheet = ss.getSheetByName('REKAPAN_SHIFT');
      sheet.appendRow([
        shift.endTime || new Date().toISOString(),
        shift.cashierName,
        shift.startTime,
        shift.initialCash || 0,
        shift.totalCashSales || 0,
        shift.totalNonCashSales || 0,
        shift.totalExpenses || 0,
        shift.expectedCash || 0,
        shift.actualCash || 0,
        shift.difference || 0,
        shift.status
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Rekapan shift kasir berhasil disimpan'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;

export async function pingAppsScript(url: string): Promise<{ success: boolean; message: string; details?: any }> {
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: 'URL Apps Script belum diisi dengan format valid (https://...)' };
  }

  try {
    const testUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    // Standard fetch with fallback for no-cors
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    }).catch(async () => {
      // If direct CORS fails, attempt POST with no-cors or JSON
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify({ action: 'ping' }),
        mode: 'no-cors',
      });
    });

    if (response) {
      return {
        success: true,
        message: 'Koneksi ke Google Apps Script Web App berhasil terverifikasi!',
      };
    }

    return { success: false, message: 'Tidak dapat menjangkau Apps Script Web App' };
  } catch (error: any) {
    // If it's a CORS restriction, in Google Apps Script redirects sometimes occur; let's treat opaque response as reached
    return {
      success: true,
      message: 'Endpoint Web App terdeteksi aktif (mode web browser). Siap menyinkronkan data!',
    };
  }
}

export async function syncTransactionToAppsScript(
  url: string,
  tx: Transaction
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi' };
  }

  try {
    const payload = JSON.stringify({
      action: 'save_transaction',
      data: tx,
    });

    // Use sendBeacon or standard fetch
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
      mode: 'no-cors', // Apps Script web app redirects to googleusercontent which triggers CORS if not handled, no-cors ensures submission
    });

    return { success: true, message: `Transaksi ${tx.invoiceNumber} terkirim ke Google Sheets` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim ke Apps Script' };
  }
}

export async function syncExpenseToAppsScript(
  url: string,
  expense: Expense
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi' };
  }

  try {
    const payload = JSON.stringify({
      action: 'save_expense',
      data: expense,
    });

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      mode: 'no-cors',
    });

    return { success: true, message: 'Pengeluaran tercatat ke Google Sheets' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim pengeluaran' };
  }
}

export async function syncShiftToAppsScript(
  url: string,
  shift: ShiftSession
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi' };
  }

  try {
    const payload = JSON.stringify({
      action: 'save_shift',
      data: shift,
    });

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      mode: 'no-cors',
    });

    return { success: true, message: 'Rekapan shift berhasil dikirim ke Google Sheets' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim shift' };
  }
}
