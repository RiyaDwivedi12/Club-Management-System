import React from 'react';
import {
  Receipt, ShieldCheck, CheckCircle2, Printer, X,
  Building2, CreditCard, Calendar, User, Hash, FileText
} from 'lucide-react';

const PaymentReceiptModal = ({ receipt, student, onClose }) => {
  if (!receipt) return null;

  const studentName = receipt.userId?.name || student?.name || 'Student';
  const rollNo = receipt.userId?.roll_no || student?.roll_no || 'N/A';
  const dept = receipt.userId?.department || student?.department || 'General';
  const year = receipt.userId?.year || student?.year || '1';
  const section = receipt.userId?.section || student?.section || 'A';
  const email = receipt.userId?.email || student?.email || '';
  const clubName = receipt.clubId?.name || 'Campus Club Membership';
  const clubCategory = receipt.clubId?.category || 'Student Activity';
  const receiptNo = receipt.receiptNumber || `RCP-${(receipt._id || '').slice(-8).toUpperCase()}`;
  const paymentDate = receipt.createdAt || receipt.date || new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel sm:max-w-xl overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Receipt Header Banner */}
        <div className="bg-brand-gradient p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 inline-flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3.5 mb-2 pr-10">
            <div className="w-11 h-11 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center text-blue-200 shrink-0">
              <Receipt size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">Official Fee Voucher</p>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Campus Membership Receipt</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-blue-50 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 min-w-0 break-all">
              <Hash size={13} className="text-blue-300 shrink-0" />
              <span>{receiptNo}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
              <ShieldCheck size={14} />
              <span>Payment Verified</span>
            </div>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-5 sm:p-6 md:p-8 space-y-5 text-slate-800 bg-white printable-receipt">

          {/* Institution Subheader */}
          <div className="text-center pb-4 border-b border-slate-100">
            <h3 className="font-bold text-dark-900 text-base sm:text-lg tracking-tight">ClubSphere Collegiate Network</h3>
            <p className="text-xs text-slate-500">Department of Student Affairs & Campus Life</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Academic Session 2025–2026 • Electronic Student Ledger
            </p>
          </div>

          {/* Student & Club Dual Column Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            {/* Student Info */}
            <div className="space-y-2 min-w-0">
              <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                <User size={12} /> Student Details
              </p>
              <div>
                <p className="font-bold text-dark-900 text-sm break-words">{studentName}</p>
                <p className="font-mono font-semibold text-blue-700 mt-0.5">Roll No: {rollNo}</p>
                <p className="text-slate-600 mt-0.5">{dept} • Year {year} ({section})</p>
                {email && <p className="text-slate-500 text-[11px] truncate">{email}</p>}
              </div>
            </div>

            {/* Club Info */}
            <div className="space-y-2 min-w-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
              <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                <Building2 size={12} /> Club & Membership
              </p>
              <div>
                <p className="font-bold text-dark-900 text-sm break-words">{clubName}</p>
                <span className="badge-blue mt-1">
                  {clubCategory}
                </span>
                <p className="text-slate-500 text-[11px] mt-1">Annual Club Membership & Privileges</p>
              </div>
            </div>
          </div>

          {/* Payment Particulars Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="table-wrap">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Particulars</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800 min-w-[160px]">
                      Club Membership Fee
                      <div className="text-[11px] font-normal text-slate-500">
                        Standard student dues for club activity & voting rights
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard size={12} className="text-slate-400 shrink-0" />
                        {receipt.paymentMethod || 'Razorpay / UPI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-dark-900 text-sm whitespace-nowrap">
                      ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-slate-700">Total Paid (INR)</td>
                    <td className="py-3 px-4 text-right text-emerald-600 text-base whitespace-nowrap">
                      ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit & Transaction Metadata */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Authorized Campus Verification</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {receipt.offlineNotes || 'Membership credentials recorded into official student registry.'}
              </p>
              {receipt.razorpayPaymentId && (
                <p className="text-[11px] font-mono text-slate-500 mt-1 break-all">
                  Gateway Ref: {receipt.razorpayPaymentId}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
              <p className="font-semibold text-slate-700 flex items-center sm:justify-end gap-1">
                <Calendar size={12} />
                {new Date(paymentDate).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {new Date(paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Keep this digital receipt for event registrations and club elections.
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn bg-dark-900 hover:bg-dark-800 text-white"
            >
              <Printer size={15} />
              <span>Print / Download Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
