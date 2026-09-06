export default function UsersPage() {
  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
      </header>
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4">Alex Johnson</td>
                <td className="px-6 py-4">Customer</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span></td>
                <td className="px-6 py-4 text-right text-blue-600 cursor-pointer">View</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4">Sarah Smith</td>
                <td className="px-6 py-4">Host</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Pending KYC</span></td>
                <td className="px-6 py-4 text-right text-blue-600 cursor-pointer">Verify</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
