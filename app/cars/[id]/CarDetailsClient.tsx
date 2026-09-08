'use client';

import { useState } from 'react';
import { updateCarStatus } from './actions';
import { Car, DollarSign, Calendar, Settings, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default function CarDetailsClient({ car, bookings, totalRevenue }: { car: any, bookings: any[], totalRevenue: number }) {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [status, setStatus] = useState(car.availability_status);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const res = await updateCarStatus(car.id, newStatus);
    setLoading(false);
    if (res.success) {
      setStatus(newStatus);
    } else {
      alert("Failed to update status: " + res.error);
    }
  };

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {car.images && car.images.length > 0 ? (
             <img src={car.images[0]} alt="Car" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon size={48} />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{car.brand} {car.model} ({car.year})</h2>
              <p className="text-gray-500 mt-1">Owned by: {car.owner?.shop_name || car.owner?.email}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <select 
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className={`font-bold px-4 py-2 rounded-lg outline-none border ${
                  status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' :
                  status === 'BOOKED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  status === 'MAINTENANCE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="BOOKED" disabled>BOOKED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <Stat icon={<DollarSign size={20} />} label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
            <Stat icon={<CheckCircle size={20} />} label="Total Trips" value={completedBookings.toString()} />
            <Stat icon={<Car size={20} />} label="Price/Day" value={`$${car.price_per_day}`} />
            <Stat icon={<Calendar size={20} />} label="Location" value={car.location_name || car.city} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 px-4">
          <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} label="Overview & Specs" icon={<Settings size={18} />} />
          <TabButton active={activeTab === 'BOOKINGS'} onClick={() => setActiveTab('BOOKINGS')} label="Booking History" icon={<Calendar size={18} />} />
          <TabButton active={activeTab === 'DOCUMENTS'} onClick={() => setActiveTab('DOCUMENTS')} label="Car Documents" icon={<AlertCircle size={18} />} />
        </div>
        
        <div className="p-6">
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 max-w-2xl">
              <Spec label="Brand" value={car.brand} />
              <Spec label="Model" value={car.model} />
              <Spec label="Year" value={car.year} />
              <Spec label="Transmission" value={car.transmission} />
              <Spec label="Fuel Type" value={car.fuel_type} />
              <Spec label="Seats" value={car.seats} />
              <Spec label="Location Name" value={car.location_name} />
              <Spec label="Coordinates" value={`${car.latitude}, ${car.longitude}`} />
            </div>
          )}

          {activeTab === 'BOOKINGS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td className="px-6 py-4 text-gray-600">{new Date(b.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{b.customer?.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          b.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                          b.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">${b.total_price}</td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No bookings yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-6">
              <div className="bg-orange-50 text-orange-800 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Missing Documents</h4>
                  <p className="text-sm mt-1">This car does not have RC or Insurance documents uploaded yet. Customers may be hesitant to book unverified cars.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-2">Registration Certificate (RC)</h3>
                  {car.rc_document_url ? (
                    <a href={car.rc_document_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Document</a>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-2">Insurance Policy</h3>
                  {car.insurance_document_url ? (
                    <a href={car.insurance_document_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Document</a>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                  {car.insurance_expiry_date && (
                    <p className="text-sm text-gray-500 mt-2">Expires: {new Date(car.insurance_expiry_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-indigo-600 bg-indigo-50 p-2 rounded-lg">{icon}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold">{label}</div>
        <div className="font-bold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
        active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Spec({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="font-medium text-gray-800">{value || 'N/A'}</div>
    </div>
  );
}
