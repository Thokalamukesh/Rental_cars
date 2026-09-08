'use client';

import { useState } from 'react';
import { updateKycStatus } from './actions';
import { ShieldCheck, AlertTriangle, FileText, Check, X, Loader2 } from 'lucide-react';

export default function DocumentsClient({ kycDocs, cars }: { kycDocs: any[], cars: any[] }) {
  const [activeTab, setActiveTab] = useState('KYC');
  const [docs, setDocs] = useState(kycDocs);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatus = async (id: string, status: string) => {
    setLoadingId(id);
    const res = await updateKycStatus(id, status);
    setLoadingId(null);
    if (res.success) {
      setDocs(docs.map(d => d.id === id ? { ...d, status } : d));
    } else {
      alert("Failed to update status");
    }
  };

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiringCars = cars.filter(c => {
    const expiryDate = new Date(c.insurance_expiry_date);
    return expiryDate <= thirtyDaysFromNow;
  });

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('KYC')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'KYC' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
        >
          <ShieldCheck size={18} /> User KYC Approvals
        </button>
        <button 
          onClick={() => setActiveTab('INSURANCE')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'INSURANCE' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
        >
          <AlertTriangle size={18} /> Insurance Expiry Alerts ({expiringCars.length})
        </button>
      </div>

      {activeTab === 'KYC' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-6">
              <div className="w-32 h-24 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                 {doc.license_image_url ? (
                   <img src={doc.license_image_url} alt="License" className="w-full h-full object-cover" />
                 ) : (
                   <FileText className="text-gray-400" />
                 )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{doc.user?.full_name || doc.user?.email}</h3>
                    <p className="text-sm text-gray-500">Submitted: {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                
                {doc.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatus(doc.id, 'APPROVED')}
                      disabled={loadingId === doc.id}
                      className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded flex items-center gap-1 text-sm font-medium"
                    >
                      {loadingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                    </button>
                    <button 
                      onClick={() => handleStatus(doc.id, 'REJECTED')}
                      disabled={loadingId === doc.id}
                      className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded flex items-center gap-1 text-sm font-medium"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
                <a href={doc.license_image_url} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline block">View Full Size</a>
              </div>
            </div>
          ))}
          {docs.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              No KYC documents found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'INSURANCE' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Car</th>
                <th className="px-6 py-4 font-medium">Shop / Owner</th>
                <th className="px-6 py-4 font-medium">Expiry Date</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expiringCars.map(car => {
                const isExpired = new Date(car.insurance_expiry_date) < today;
                return (
                  <tr key={car.id} className={isExpired ? 'bg-red-50/50' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-800">{car.brand} {car.model}</td>
                    <td className="px-6 py-4 text-gray-600">{car.owner?.shop_name || car.owner?.email}</td>
                    <td className="px-6 py-4 text-gray-800">{new Date(car.insurance_expiry_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {isExpired ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">EXPIRED</span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">EXPIRING SOON</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {expiringCars.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No cars have insurance expiring in the next 30 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
