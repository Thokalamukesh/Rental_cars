import { login } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#1E1E24] p-8 text-center">
          <div className="w-16 h-16 bg-[#00E676] rounded-xl flex items-center justify-center font-bold text-white text-3xl shadow-lg shadow-[#00E676]/30 mx-auto mb-4">
            D
          </div>
          <h1 className="text-2xl font-bold text-white">DriveNow Admin</h1>
          <p className="text-gray-400 mt-2">Sign in to manage your fleet</p>
        </div>
        
        <div className="p-8">
          {searchParams?.error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {searchParams.error}
            </div>
          )}
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] focus:border-[#00E676] outline-none transition-all"
                placeholder="admin@drivenow.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] focus:border-[#00E676] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <button
              formAction={login}
              className="w-full bg-[#00E676] hover:bg-[#00c968] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex justify-center"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
