'use client';

import { useState } from 'react';
import { cancelBooking, completeBooking } from './actions';
import { ShieldAlert, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function BookingDetailsClient({ booking }: { booking: any }) {
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('0');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [damageReport, setDamageReport] = useState('');
  const [extraCharges, setExtraCharges] = useState('0');
  const [securityDeposit, setSecurityDeposit] = useState('PENDING'); // PENDING, REFUNDED, DEDUCTED
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await cancelBooking(booking.id, cancelReason, parseFloat(refundAmount) || 0);
    if (res.success) {
      window.location.reload();
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await completeBooking(booking.id, damageReport, parseFloat(extraCharges) || 0, securityDeposit);
    if (res.success) {
      window.location.reload();
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-6">
          <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
            {booking.cars?.images && booking.cars.images.length > 0 ? (
              <img src={booking.cars.images[0]} alt="Car" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{booking.cars?.brand} {booking.cars?.model}</h2>
            <div className="mt-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-800">Booking Ref:</span> {booking.id}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              <span className="font-semibold text-gray-800">Period:</span> {new Date(booking.start_date).toLocaleString()} - {new Date(booking.end_date).toLocaleString()}
            </div>
            <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold ${
              booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              STATUS: {booking.status}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Financial Breakdown</h3>
          <div className="space-y-3 max-w-sm">
            <div className="flex justify-between text-gray-600">
              <span>Base Rental Price:</span>
              <span>${booking.total_price}</span>
            </div>
            {booking.extra_charges > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Extra Charges (Penalty):</span>
                <span>+${booking.extra_charges}</span>
              </div>
            )}
            {booking.refund_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Refunded Amount:</span>
                <span>-${booking.refund_amount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 border-t pt-2 mt-2">
              <span>Net Paid (Gross):</span>
              <span>${(Number(booking.total_price) + Number(booking.extra_charges) - Number(booking.refund_amount)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {booking.cancellation_reason && (
          <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-100">
            <h3 className="font-bold mb-2 flex items-center gap-2"><ShieldAlert size={18}/> Cancellation Details</h3>
            <p className="text-sm"><strong>Reason:</strong> {booking.cancellation_reason}</p>
          </div>
        )}

        {booking.damage_report && (
          <div className="bg-orange-50 text-orange-800 p-6 rounded-xl border border-orange-100">
            <h3 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Damage / Post-Rental Report</h3>
            <p className="text-sm"><strong>Notes:</strong> {booking.damage_report}</p>
            <p className="text-sm mt-1"><strong>Security Deposit Action:</strong> {booking.security_deposit_status}</p>
          </div>
        )}
      </div>

      {/* Right Column: Actions */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Customer Details</h3>
          <div className="text-sm space-y-2 text-gray-600">
            <p><strong className="text-gray-800">Name:</strong> {booking.customer?.full_name}</p>
            <p><strong className="text-gray-800">Email:</strong> {booking.customer?.email}</p>
            <p><strong className="text-gray-800">Phone:</strong> {booking.customer?.mobile_number || 'N/A'}</p>
          </div>
        </div>

        {booking.status === 'APPROVED' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Management Actions</h3>
            
            {!showCompleteModal && !showCancelModal && (
              <>
                <button 
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle size={18} /> Complete & Inspect Return
                </button>
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel Booking
                </button>
              </>
            )}

            {/* Cancel Flow */}
            {showCancelModal && (
              <form onSubmit={handleCancel} className="space-y-4 border-t pt-4">
                <h4 className="font-bold text-red-600">Cancel Booking</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Cancellation Reason</label>
                  <textarea 
                    required 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-red-500 outline-none" 
                    rows={3} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Refund Amount ($)</label>
                  <input 
                    type="number" step="any"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-red-500 outline-none" 
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded font-medium flex justify-center">{loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Cancel'}</button>
                  <button type="button" onClick={() => setShowCancelModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded font-medium">Back</button>
                </div>
              </form>
            )}

            {/* Complete Flow */}
            {showCompleteModal && (
              <form onSubmit={handleComplete} className="space-y-4 border-t pt-4">
                <h4 className="font-bold text-green-600">Complete & Inspect Return</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Damage Report / Notes (Optional)</label>
                  <textarea 
                    value={damageReport}
                    onChange={(e) => setDamageReport(e.target.value)}
                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
                    rows={3} 
                    placeholder="E.g. No damage, car returned clean."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Extra Penalty Charges ($)</label>
                  <input 
                    type="number" step="any"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Security Deposit Action</label>
                  <select 
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
                  >
                    <option value="PENDING">Pending Action</option>
                    <option value="REFUNDED">Fully Refunded</option>
                    <option value="DEDUCTED">Deducted for Damage</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded font-medium flex justify-center">{loading ? <Loader2 size={16} className="animate-spin" /> : 'Complete'}</button>
                  <button type="button" onClick={() => setShowCompleteModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded font-medium">Back</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
