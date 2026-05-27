import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: salon } = await supabase
    .from('salons').select('*').eq('owner_id', user.id).single()

  if (!salon) {
    const { data: newSalon } = await supabase
      .from('salons')
      .insert({ owner_id: user.id, name: 'My Salon' })
      .select().single()
    salon = newSalon
  }

  const serviceClient = createServiceClient()
  const { data: bookingSettings } = await serviceClient
    .from('booking_settings')
    .select('slug')
    .eq('salon_id', salon?.id)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayAppointments } = await supabase
    .from('appointments').select('*')
    .eq('salon_id', salon?.id)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString())
    .eq('status', 'confirmed')
    .order('scheduled_at')

  const { data: reminders } = await supabase
    .from('reminders').select('id').eq('status', 'sent')

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
            <a href="/appointments" className="text-blue-200 hover:text-white text-sm transition-colors">Appointments</a>
            <a href="/services" className="text-blue-200 hover:text-white text-sm transition-colors">Services</a>
            <a href="/hours" className="text-blue-200 hover:text-white text-sm transition-colors">Hours</a>
            <a href="/settings" className="text-blue-200 hover:text-white text-sm transition-colors">Settings</a>
            <a href="/appointments/new" className="bg-blue-500 hover:bg-blue-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
              + New
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {salon?.name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Today's Appointments</span>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-base">📅</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{todayAppointments?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-1">scheduled for today</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Reminders This Month</span>
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-base">💬</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{salon?.reminders_sent_this_month || 0}</div>
            <div className="text-xs text-gray-400 mt-1">reminders sent</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Reminders</span>
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <span className="text-base">📊</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{reminders?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-1">all time</div>
          </div>
        </div>

        {bookingSettings && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔗</span>
                  <h3 className="font-bold text-gray-900">Your Client Booking Page</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">Share this link — clients can book appointments 24/7</p>
                <code className="text-xs bg-white px-3 py-1.5 rounded-lg border border-blue-100 text-blue-700 font-mono">
                  {process.env.NEXT_PUBLIC_APP_URL}/book/{bookingSettings.slug}
                </code>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${bookingSettings.slug}`}
                target="_blank"
                className="text-white text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-all"
                style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
              >
                View page →
              </a>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900">Today's Appointments</h2>
              <p className="text-xs text-gray-400 mt-0.5">{todayAppointments?.length || 0} appointments scheduled</p>
            </div>
            <a
              href="/appointments/new"
              className="text-white text-sm px-4 py-2 rounded-xl font-medium transition-all hover:opacity-90"
              style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}
            >
              + Add appointment
            </a>
          </div>

          {todayAppointments && todayAppointments.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
                      {apt.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{apt.client_name}</div>
                      <div className="text-xs text-gray-400">{apt.service}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(apt.scheduled_at).toLocaleTimeString('en-CA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Toronto'
                      })}
                    </span>
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No appointments today</h3>
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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}