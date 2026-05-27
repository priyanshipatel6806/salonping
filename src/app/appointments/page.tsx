import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AppointmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons').select('id').eq('owner_id', user.id).single()

  const { data: appointments } = await supabase
    .from('appointments').select('*')
    .eq('salon_id', salon?.id)
    .order('scheduled_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav style={{background:'linear-gradient(135deg,#0f172a,#1e3a5f)'}} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-base">💇</span>
            </div>
            <span className="text-white font-bold text-lg">SalonPing</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-blue-200 hover:text-white text-sm transition-colors">Dashboard</a>
            <a href="/services" className="text-blue-200 hover:text-white text-sm transition-colors">Services</a>
            <a href="/settings" className="text-blue-200 hover:text-white text-sm transition-colors">Settings</a>
            <a href="/customise" className="text-blue-200 hover:text-white text-sm transition-colors">Customise</a>
            <a href="/appointments/new" className="bg-blue-500 hover:bg-blue-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
              + New
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
            <p className="text-gray-500 text-sm mt-1">{appointments?.length || 0} total appointments</p>
          </div>
          <a
            href="/appointments/new"
            className="text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all"
            style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
          >
            + Add appointment
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {appointments && appointments.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
                          {apt.client_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{apt.client_name}</div>
                          <div className="text-xs text-gray-400">{apt.client_phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{apt.service}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {new Date(apt.scheduled_at).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(apt.scheduled_at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                        apt.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                        apt.status === 'no_show' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {apt.status === 'confirmed' && (
                        <form action={`/api/appointments/${apt.id}/cancel`} method="POST">
                          <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline transition-colors">
                            Cancel
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No appointments yet</h3>
              <p className="text-gray-400 text-sm mb-4">Add your first appointment to get started</p>
              <a
                href="/appointments/new"
                className="inline-block text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all"
                style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
              >
                + Add appointment
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}