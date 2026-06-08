import Link from 'next/link'

const GOLD = '#c9a84c'

const features = [
  { icon: '💬', title: 'Automatic SMS & WhatsApp Reminders', desc: 'Clients get reminders 48h, 24h, and 2h before their appointment. Zero effort from you.' },
  { icon: '📅', title: 'Beautiful Online Booking Page', desc: 'Your own branded link with custom URL. Share on Instagram, Google, WhatsApp — clients book 24/7.' },
  { icon: '🤖', title: 'AI Assistant on Every Booking Page', desc: 'An intelligent chat widget answers client questions about services and availability.' },
  { icon: '🚫', title: 'Reduce No-Shows by 27%', desc: 'Automatic reminders at 48h, 24h, and 2h before every appointment keep clients from forgetting.' },
  { icon: '⭐', title: 'Auto Google Review Requests', desc: 'After every completed appointment, clients automatically receive a text asking for a Google review.' },
  { icon: '👥', title: 'Built-in Client Database', desc: 'See every client, their visit history, total spend, and favourite services — all in one place.' },
]

const steps = [
  { n: '01', title: 'Create your account', desc: 'Sign up with just your email — no password needed.' },
  { n: '02', title: 'Add your services & hours', desc: 'Enter what you offer, how long each takes, and when you are open.' },
  { n: '03', title: 'Share your booking link', desc: 'Your unique link is instantly live. Share it everywhere.' },
  { n: '04', title: 'Clients book. Reminders send.', desc: 'Sit back. SalonPing handles the rest.' },
]

const testimonials = [
  { quote: 'I used to lose $200-300 a week to no-shows. SalonPing basically pays for itself ten times over.', name: 'Aaliya M.', role: 'Independent Stylist, Toronto' },
  { quote: 'My clients love being able to book themselves online at midnight. Bookings went up 40% in two months.', name: 'Priya K.', role: 'Salon Owner, Waterloo' },
  { quote: 'Setup took me 5 minutes. The AI chat widget answers client DMs for me.', name: 'Simone R.', role: 'Stylist & Colourist, Vancouver' },
]

export default function LandingPage() {
  return (
    <div style={{background:'#0a0a0a', color:'#fff', fontFamily:'system-ui, sans-serif'}}>

      {/* NAV */}
      <nav style={{borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, zIndex:50,
        background:'rgba(10,10,10,0.9)', backdropFilter:'blur(12px)'}}>
        <div style={{maxWidth:1100, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,#2a1f08,${GOLD})`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18}}>&#9986;</div>
            <span style={{fontWeight:800, fontSize:20, color:'#fff', letterSpacing:'-0.5px'}}>SalonPing</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:24}}>
            <a href="#features" style={{color:'rgba(255,255,255,0.5)', fontSize:14, textDecoration:'none'}}>Features</a>
            <a href="#how-it-works" style={{color:'rgba(255,255,255,0.5)', fontSize:14, textDecoration:'none'}}>How it works</a>
            <Link href="/pricing" style={{color:'rgba(255,255,255,0.5)', fontSize:14, textDecoration:'none'}}>Pricing</Link>
            <Link href="/login" style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:700,
              fontSize:14, padding:'10px 20px', borderRadius:10, textDecoration:'none'}}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:'100px 24px 80px', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)',
          width:600, height:400, borderRadius:'50%', background:`radial-gradient(ellipse,${GOLD}18 0%,transparent 70%)`, pointerEvents:'none'}} />
        <div style={{maxWidth:800, margin:'0 auto', position:'relative'}}>
          <div style={{display:'inline-flex', alignItems:'center', gap:8, background:'rgba(201,168,76,0.1)',
            border:'1px solid rgba(201,168,76,0.3)', borderRadius:100, padding:'6px 16px', marginBottom:28}}>
            <span style={{width:7, height:7, borderRadius:'50%', background:GOLD, display:'inline-block'}} />
            <span style={{fontSize:13, color:GOLD, fontWeight:600}}>Now live — free to get started</span>
          </div>
          <h1 style={{fontSize:'clamp(40px,6vw,72px)', fontWeight:900, lineHeight:1.08, letterSpacing:'-2px', margin:'0 0 24px', color:'#fff'}}>
            Stop losing money<br />
            <span style={{background:`linear-gradient(90deg,${GOLD},#f5e18a,${GOLD})`,
              backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
              to no-shows
            </span>
          </h1>
          <p style={{fontSize:'clamp(16px,2vw,20px)', color:'rgba(255,255,255,0.55)', maxWidth:560, margin:'0 auto 40px', lineHeight:1.7}}>
            SalonPing sends automatic SMS & WhatsApp reminders to every client before their appointment.
            Reduce no-shows by 27% — set up in 5 minutes.
          </p>
          <div style={{display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap'}}>
            <Link href="/login" style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:800,
              fontSize:16, padding:'16px 36px', borderRadius:14, textDecoration:'none', display:'inline-block'}}>
              Start free — no card needed
            </Link>
            <a href="#how-it-works" style={{background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.8)', fontWeight:600,
              fontSize:16, padding:'16px 28px', borderRadius:14, textDecoration:'none', border:'1px solid rgba(255,255,255,0.1)', display:'inline-block'}}>
              See how it works
            </a>
          </div>
          <div style={{display:'flex', gap:48, justifyContent:'center', marginTop:64, flexWrap:'wrap'}}>
            {[{val:'27%',label:'avg. no-show reduction'},{val:'5 min',label:'to set up'},{val:'24/7',label:'online bookings'}].map(s => (
              <div key={s.val} style={{textAlign:'center'}}>
                <div style={{fontSize:36, fontWeight:900, color:GOLD, letterSpacing:'-1px'}}>{s.val}</div>
                <div style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'20px 24px', textAlign:'center'}}>
        <p style={{fontSize:13, color:'rgba(255,255,255,0.3)', marginBottom:12}}>Trusted by independent stylists and salons across Canada</p>
        <div style={{display:'flex', gap:32, justifyContent:'center', flexWrap:'wrap'}}>
          {['Toronto','Waterloo','Vancouver','Calgary','Ottawa'].map(city => (
            <span key={city} style={{fontSize:14, color:'rgba(255,255,255,0.25)', fontWeight:500}}>&#10022; {city}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{padding:'100px 24px'}}>
        <div style={{maxWidth:1100, margin:'0 auto'}}>
          <div style={{textAlign:'center', marginBottom:64}}>
            <h2 style={{fontSize:'clamp(28px,4vw,48px)', fontWeight:900, letterSpacing:'-1.5px', margin:'0 0 16px', color:'#fff'}}>
              Everything you need.<br />
              <span style={{color:GOLD}}>Nothing you don&apos;t.</span>
            </h2>
            <p style={{fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:500, margin:'0 auto'}}>
              Built specifically for salon owners who want fewer no-shows and more time doing what they love.
            </p>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20}}>
            {features.map(f => (
              <div key={f.title} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'28px 28px 24px'}}>
                <div style={{fontSize:32, marginBottom:12}}>{f.icon}</div>
                <h3 style={{fontSize:17, fontWeight:700, marginBottom:10, color:'#fff'}}>{f.title}</h3>
                <p style={{fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, margin:0}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{padding:'80px 24px', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:800, margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(28px,4vw,48px)', fontWeight:900, letterSpacing:'-1.5px', textAlign:'center', marginBottom:56, color:'#fff'}}>
            Up and running in <span style={{color:GOLD}}>4 steps</span>
          </h2>
          <div style={{display:'grid', gap:16}}>
            {steps.map(step => (
              <div key={step.n} style={{display:'flex', gap:24, alignItems:'flex-start',
                background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'24px 28px'}}>
                <div style={{fontWeight:900, fontSize:28, color:GOLD, letterSpacing:'-1px', flexShrink:0, lineHeight:1}}>{step.n}</div>
                <div>
                  <h3 style={{fontSize:17, fontWeight:700, margin:'0 0 6px', color:'#fff'}}>{step.title}</h3>
                  <p style={{fontSize:14, color:'rgba(255,255,255,0.45)', margin:0, lineHeight:1.6}}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:'80px 24px', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:1100, margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(24px,3vw,40px)', fontWeight:900, letterSpacing:'-1px', textAlign:'center', marginBottom:48, color:'#fff'}}>
            Salon owners <span style={{color:GOLD}}>love it</span>
          </h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20}}>
            {testimonials.map(t => (
              <div key={t.name} style={{background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:20, padding:'28px'}}>
                <div style={{fontSize:22, color:GOLD, marginBottom:16}}>&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p style={{fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.7, marginBottom:20, fontStyle:'italic'}}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{fontWeight:700, fontSize:14, color:'#fff'}}>{t.name}</div>
                <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2}}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 24px', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.06)', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:500, height:300, borderRadius:'50%', background:`radial-gradient(ellipse,${GOLD}15 0%,transparent 70%)`, pointerEvents:'none'}} />
        <div style={{position:'relative', maxWidth:600, margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(32px,5vw,56px)', fontWeight:900, letterSpacing:'-2px', marginBottom:20, lineHeight:1.1, color:'#fff'}}>
            Ready to stop<br />the no-shows?
          </h2>
          <p style={{fontSize:17, color:'rgba(255,255,255,0.5)', marginBottom:40, lineHeight:1.7}}>
            Join salon owners across Canada who have taken back control of their schedule and their income.
          </p>
          <Link href="/login" style={{background:`linear-gradient(135deg,#2a1f08,${GOLD})`, color:'#0a0a0a', fontWeight:800,
            fontSize:18, padding:'18px 48px', borderRadius:14, textDecoration:'none', display:'inline-block'}}>
            Get started — it&apos;s free
          </Link>
          <p style={{fontSize:12, color:'rgba(255,255,255,0.25)', marginTop:16}}>No credit card. No commitment. Set up in 5 minutes.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid rgba(255,255,255,0.06)', padding:'40px 24px', textAlign:'center'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:16}}>
          <div style={{width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,#2a1f08,${GOLD})`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:14}}>&#9986;</div>
          <span style={{fontWeight:800, fontSize:16, color:'#fff'}}>SalonPing</span>
        </div>
        <div style={{display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap', marginBottom:14}}>
          <Link href="/pricing" style={{fontSize:13, color:'rgba(255,255,255,0.35)', textDecoration:'none'}}>Pricing</Link>
          <a href="mailto:support@salonping.com" style={{fontSize:13, color:'rgba(255,255,255,0.35)', textDecoration:'none'}}>Contact</a>
          <a href="/privacy" style={{fontSize:13, color:'rgba(255,255,255,0.35)', textDecoration:'none'}}>Privacy Policy</a>
          <a href="/terms" style={{fontSize:13, color:'rgba(255,255,255,0.35)', textDecoration:'none'}}>Terms of Service</a>
        </div>
        <p style={{fontSize:13, color:'rgba(255,255,255,0.25)', margin:0}}>
          &copy; {new Date().getFullYear()} SalonPing. Built for salon owners who value their time.
        </p>
      </footer>
    </div>
  )
}
