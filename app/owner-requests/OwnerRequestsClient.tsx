'use client';

import { useState } from 'react';
import { approveCarRequest, rejectCarRequest } from './actions';
import { Check, X, Loader2 } from 'lucide-react';

export default function OwnerRequestsClient({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleApprove = async (request: any) => {
    setLoadingId(request.id);
    const result = await approveCarRequest(request);
    setLoadingId(null);
    if (result.success) {
      setRequests(requests.map(r => r.id === request.id ? { ...r, status: 'APPROVED' } : r));
    } else {
      alert("Failed to approve: " + result.error);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason) return alert("Reason is required");
    setLoadingId(id);
    const result = await rejectCarRequest(id, rejectReason);
    setLoadingId(null);
    setRejectingId(null);
    setRejectReason('');
    
    if (result.success) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED', rejection_reason: rejectReason } : r));
    } else {
      alert("Failed to reject: " + result.error);
    }
  };

  return (
    <div className="space-y-6">
      {requests.map(req => (
        <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between">
              <h3 className="text-xl font-bold text-gray-800">{req.brand} {req.model} ({req.year})</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {req.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 text-sm text-gray-600 gap-2">
              <div><strong>Owner:</strong> {req.owner?.full_name || req.owner?.email}</div>
              <div><strong>Location:</strong> {req.location_name}</div>
              <div><strong>Price:</strong> ${req.price_per_day}/day</div>
              <div><strong>Transmission:</strong> {req.transmission}</div>
            </div>

            {req.rejection_reason && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                <strong>Rejection Reason:</strong> {req.rejection_reason}
              </div>
            )}
            
            {req.status === 'PENDING' && rejectingId !== req.id && (
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button 
                  onClick={() => handleApprove(req)}
                  disabled={loadingId === req.id}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  {loadingId === req.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Approve & Publish
                </button>
                <button 
                  onClick={() => setRejectingId(req.id)}
                  disabled={loadingId === req.id}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            )}

            {rejectingId === req.id && (
              <div className="pt-4 border-t border-gray-50 space-y-3">
                <input 
                  type="text" 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-600"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleReject(req.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Confirm Reject</button>
                  <button onClick={() => setRejectingId(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          No car requests found.
        </div>
      )}
    </div>
  );
}
