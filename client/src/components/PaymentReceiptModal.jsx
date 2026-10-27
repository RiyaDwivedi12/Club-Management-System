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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Receipt Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-11 h-11 bg-teal-500/20 border border-teal-400/40 rounded-2xl flex items-center justify-center text-teal-300">
              <Receipt size={22} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-teal-300 font-extrabold">Official Fee Voucher</p>
              <h2 className="text-xl font-black tracking-tight text-white">Campus Membership Receipt</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Hash size={13} className="text-teal-400" />
              <span>{receiptNo}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
              <ShieldCheck size={14} />
              <span>PAYMENT VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-6 md:p-8 space-y-6 text-slate-800 bg-white printable-receipt">
          
          {/* Institution Subheader */}
          <div className="text-center pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-wide">ClubSphere Collegiate Network</h3>
            <p className="text-xs text-slate-500 font-medium">Department of Student Affairs & Campus Life</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Academic Session 2025–2026 • Electronic Student Ledger
            </p>
          </div>

          {/* Student & Club Dual Column Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            {/* Student Info */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                <User size={12} /> Student Details
              </p>
              <div>
                <p className="font-black text-slate-900 text-sm">{studentName}</p>
                <p className="font-mono font-bold text-teal-700 mt-0.5">Roll No: {rollNo}</p>
                <p className="text-slate-600 mt-0.5">{dept} • Year {year} ({section})</p>
                {email && <p className="text-slate-500 text-[11px] truncate">{email}</p>}
              </div>
            </div>

            {/* Club Info */}
            <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-4">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                <Building2 size={12} /> Club & Membership
              </p>
              <div>
                <p className="font-black text-slate-900 text-sm">{clubName}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                  {clubCategory}
                </span>
                <p className="text-slate-500 text-[11px] mt-1">Annual Club Membership & Privileges</p>
              </div>
            </div>
          </div>

          {/* Payment Particulars Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Particulars</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    Club Membership Fee
                    <div className="text-[11px] font-normal text-slate-500">
                      Standard student dues for club activity & voting rights
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <CreditCard size={12} className="text-slate-400" />
                      {receipt.paymentMethod || 'Razorpay / UPI'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                    ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-black">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-700">Total Paid (INR)</td>
                  <td className="py-3 px-4 text-right text-emerald-600 text-base">
                    ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Audit & Transaction Metadata */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Authorized Campus Verification</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {receipt.offlineNotes || 'Membership credentials recorded into official student registry.'}
              </p>
              {receipt.razorpayPaymentId && (
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Gateway Ref: {receipt.razorpayPaymentId}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
              <p className="font-bold text-slate-700 flex items-center sm:justify-end gap-1">
                <Calendar size={12} />
                {new Date(paymentDate).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-6 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Keep this digital receipt for event registrations and club elections.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <Printer size={15} />
              <span>Print / Download Slip</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
