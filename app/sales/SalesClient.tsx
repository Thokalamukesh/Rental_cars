'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

export default function SalesClient({ initialData, role }: { initialData: any[], role: string }) {
  const [filter, setFilter] = useState('ALL');

  const filteredData = initialData.filter(item => {
    if (filter === 'ALL') return true;
    const date = new Date(item.date);
    const now = new Date();
    if (filter === 'TODAY') {
      return date.toDateString() === now.toDateString();
    }
    if (filter === 'THIS_MONTH') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (filter === 'THIS_YEAR') {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totals = filteredData.reduce((acc, item) => {
    acc.gross += item.gross;
    acc.refund += item.refund;
    acc.commission += item.commission;
    acc.payout += item.payout;
    return acc;
  }, { gross: 0, refund: 0, commission: 0, payout: 0 });

  const exportCSV = () => {
    const headers = ['Date,Car,Customer,Shop,Status,Gross,Refund,Commission,Payout'];
    const rows = filteredData.map(d => 
      `"${d.date}","${d.car}","${d.customer}","${d.shop}","${d.status}",${d.gross},${d.refund},${d.commission},${d.payout}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${filter.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="THIS_MONTH">This Month</option>
          <option value="THIS_YEAR">This Year</option>
        </select>
        
        <button 
          onClick={exportCSV}
          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Gross Sales" value={totals.gross} color="text-gray-800" />
        <StatCard title="Total Refunds" value={totals.refund} color="text-red-500" />
        {role === 'SUPER_ADMIN' && <StatCard title="Platform Commission" value={totals.commission} color="text-indigo-600" />}
        <StatCard title={role === 'SUPER_ADMIN' ? "Total Shop Payouts" : "Your Payout"} value={totals.payout} color="text-green-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Car</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              {role === 'SUPER_ADMIN' && <th className="px-6 py-4 font-medium">Shop</th>}
              <th className="px-6 py-4 font-medium text-right">Gross</th>
              <th className="px-6 py-4 font-medium text-right">Refund</th>
              {role === 'SUPER_ADMIN' && <th className="px-6 py-4 font-medium text-right">Commission</th>}
              <th className="px-6 py-4 font-medium text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-600">{item.date}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.car}</td>
                <td className="px-6 py-4 text-gray-600">{item.customer}</td>
                {role === 'SUPER_ADMIN' && <td className="px-6 py-4 text-gray-600">{item.shop}</td>}
                <td className="px-6 py-4 text-right font-medium text-gray-800">₹{item.gross.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-red-500">₹{item.refund.toFixed(2)}</td>
                {role === 'SUPER_ADMIN' && <td className="px-6 py-4 text-right text-indigo-600">₹{item.commission.toFixed(2)}</td>}
                <td className="px-6 py-4 text-right font-bold text-green-600">₹{item.payout.toFixed(2)}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No sales data found for this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="text-gray-500 font-medium text-sm mb-2">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>₹{value.toFixed(2)}</div>
    </div>
  );
}
