'use client';

import { useState } from 'react';
import { blockDates } from './actions';
import { Calendar, Loader2 } from 'lucide-react';

export default function CalendarClient({ events, cars, shopId }: { events: any[], cars: any[], shopId: string }) {
  const [selectedCar, setSelectedCar] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !startDate || !endDate) return alert('All fields required');
    
    setLoading(true);
    const res = await blockDates(selectedCar, startDate, endDate, shopId);
    setLoading(false);
    
    if (res.success) {
      alert('Dates blocked successfully!');
      setStartDate('');
      setEndDate('');
      setSelectedCar('');
      // In a real app we might refetch events here or just reload
      window.location.reload();
    } else {
      alert('Failed to block dates: ' + res.error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Block Dates Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-indigo-600" />
          Manually Block Dates (Maintenance)
        </h2>
        <form onSubmit={handleBlockDates} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Car</label>
            <select 
              value={selectedCar} 
              onChange={(e) => setSelectedCar(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">-- Choose Car --</option>
              {cars.map(c => (
                <option key={c.id} value={c.id}>{c.brand} {c.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Block Dates'}
            </button>
          </div>
        </form>
      </div>

      {/* Upcoming Events List (Simple Alternative to full Calendar Grid) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Active Schedule</h2>
        </div>
        <div className="p-0">
          {events.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {events.map((event) => (
                <li key={event.id} className="p-6 hover:bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 text-indigo-800 font-bold w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl leading-none">{event.start.getDate()}</span>
                      <span className="text-xs uppercase">{event.start.toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{event.title}</h4>
                      <p className="text-gray-500 text-sm">
                        {event.start.toLocaleDateString()} - {event.end.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      event.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No active bookings or blocked dates found.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
