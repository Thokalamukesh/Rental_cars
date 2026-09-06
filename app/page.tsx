import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
      </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Total Users" value="1,245" trend="+12%" isPositive={true} />
            <MetricCard title="Active Cars" value="342" trend="+5%" isPositive={true} />
            <MetricCard title="Pending Approvals" value="12" trend="-2" isPositive={false} />
            <MetricCard title="Active Bookings" value="85" trend="+18%" isPositive={true} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Recent Bookings</h2>
              <button className="text-sm text-[#00E676] font-medium hover:underline">View All</button>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Booking ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Car</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">#BK-8472</td>
                  <td className="px-6 py-4">Alex Johnson</td>
                  <td className="px-6 py-4">Tesla Model 3</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Trip</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">$145.00</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">#BK-8471</td>
                  <td className="px-6 py-4">Sarah Smith</td>
                  <td className="px-6 py-4">Hyundai Creta</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Upcoming</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">$85.00</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">#BK-8470</td>
                  <td className="px-6 py-4">Mike Davis</td>
                  <td className="px-6 py-4">BMW X5</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Completed</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">$220.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
  );
}

function MetricCard({ title, value, trend, isPositive }: { title: string, value: string, trend: string, isPositive: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
      <div className="text-gray-500 font-medium text-sm">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
          {isPositive ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
          )}
          {trend}
        </div>
      </div>
    </div>
  );
}
