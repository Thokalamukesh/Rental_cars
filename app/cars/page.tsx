export default function CarsPage() {
  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Cars & Approvals</h1>
        <button className="bg-[#00E676] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#00C853] transition-colors">Add Car</button>
      </header>
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Car Details</th>
                <th className="px-6 py-4 font-medium">Host</th>
                <th className="px-6 py-4 font-medium">Price/Day</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium">Tesla Model 3<br/><span className="text-sm font-normal text-gray-500">EV • Auto</span></td>
                <td className="px-6 py-4">Elite Rentals</td>
                <td className="px-6 py-4">$120</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span></td>
                <td className="px-6 py-4 text-right text-blue-600 cursor-pointer">Edit</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium">Mahindra Thar<br/><span className="text-sm font-normal text-gray-500">SUV • Manual</span></td>
                <td className="px-6 py-4">John Doe</td>
                <td className="px-6 py-4">$65</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Pending Review</span></td>
                <td className="px-6 py-4 text-right text-blue-600 cursor-pointer">Review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
