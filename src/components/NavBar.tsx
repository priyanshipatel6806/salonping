'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const GOLD = '#c9a84c'

const ALL_NAV = [
  '/dashboard|Dashboard',
  '/appointments|Appointments',
  '/calendar|Calendar',
  '/clients|Clients',
  '/analytics|Analytics',
  '/services|Services',
  '/staff|Staff',
  '/hours|Hours',
  '/blocked|Block-out',
  '/intake|Intake Forms',
  '/waitlist|Waitlist',
  '/loyalty|Loyalty',
  '/customise|Customise',
  '/settings|Settings',
]

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <style>{`
        .sp-nav-scroll::-webkit-scrollbar { display: none; }
        .sp-nav-link:hover { color: #e8c96a !important; }
        .sp-hamburger { display: none; }
        .sp-nav-desktop { display: flex; }
        @media (max-width: 900px) {
          .sp-nav-desktop { display: none !important; }
          .sp-hamburger { display: flex !important; }
        }
        .sp-mobile-menu {
          position: absolute; top: 56px; left: 0; right: 0;
          background: #111; border-bottom: 1px solid rgba(201,168,76,0.2);
          padding: 12px 16px; display: flex; flex-direction: column; gap: 4px;
          z-index: 49;
        }
        .sp-mobile-link {
          padding: 10px 12px; border-radius: 8px; text-decoration: none;
          font-size: 14px; font-weight: 500; transition: background 0.15s;
        }
        .sp-mobile-link:hover { background: rgba(255,255,255,0.06); }
      `}</style>

      <nav style={{
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 16px',
          height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8,
        }}>
          {/* Logo */}
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg,#2a1f08,${GOLD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>✄</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>SalonPing</span>
          </a>

          {/* Desktop nav — scrollable, no visible scrollbar */}
          <div
            className="sp-nav-desktop sp-nav-scroll"
            style={{
              display: 'flex', alignItems: 'center', gap: 1,
              overflowX: 'auto', scrollbarWidth: 'none', flex: 1,
              justifyContent: 'flex-end', msOverflowStyle: 'none',
            }}
          >
            {ALL_NAV.map(l => {
              const [href, label] = l.split('|')
              const active = isActive(href)
              return (
                <a
                  key={href}
                  href={href}
                  className="sp-nav-link"
                  style={{
                    color: active ? GOLD : 'rgba(255,255,255,0.5)',
                    fontSize: 12, padding: '5px 9px', borderRadius: 8,
                    textDecoration: 'none', fontWeight: active ? 700 : 400,
                    whiteSpace: 'nowrap', transition: 'color 0.15s',
                  }}
                >{label}</a>
              )
            })}
            <a
              href="/appointments/new"
              style={{
                marginLeft: 8, flexShrink: 0,
                background: `linear-gradient(135deg,#2a1f08,${GOLD})`,
                color: '#0a0a0a', fontWeight: 700, fontSize: 12,
                padding: '7px 13px', borderRadius: 8, textDecoration: 'none',
              }}
            >+ New</a>
          </div>

          {/* Mobile: + New + hamburger */}
          <div className="sp-hamburger" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <a
              href="/appointments/new"
              style={{
                background: `linear-gradient(135deg,#2a1f08,${GOLD})`,
                color: '#0a0a0a', fontWeight: 700, fontSize: 12,
                padding: '7px 12px', borderRadius: 8, textDecoration: 'none',
              }}
            >+ New</a>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '7px 10px', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontSize: 16, lineHeight: 1,
              }}
            >{menuOpen ? '✕' : '☰'}</button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sp-mobile-menu">
            {ALL_NAV.map(l => {
              const [href, label] = l.split('|')
              const active = isActive(href)
              return (
                <a
                  key={href}
                  href={href}
                  className="sp-mobile-link"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: active ? GOLD : 'rgba(255,255,255,0.65)', fontWeight: active ? 700 : 400 }}
                >{label}</a>
              )
            })}
          </div>
        )}
       </nav>
    </>
  )
}
