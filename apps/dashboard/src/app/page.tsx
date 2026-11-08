'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ─── Animated counter ─────────────────────────────────────────────────────────
function LiveCounter() {
  const [count, setCount] = useState(2847293.41);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => c + (Math.random() * 12 + 3));
    }, 800);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-sm text-slate-400 font-mono tracking-tight mb-8">
      Total volume processed on ATLAS:{' '}
      <span className="text-slate-700 font-semibold">
        GHS {count.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </p>
  );
}

// ─── Fluid gradient orb (Stripe-style) ───────────────────────────────────────
function GradientOrb() {
  return (
    <div className="absolute right-0 top-0 w-[58vw] h-screen overflow-hidden pointer-events-none select-none">
      <div className="relative w-full h-full">
        {/* Main blobs */}
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-70 animate-blob1"
          style={{ background: 'radial-gradient(circle, #2D8EFF 0%, #60A5FA 40%, transparent 75%)', filter: 'blur(40px)', top: '-100px', right: '-100px' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-60 animate-blob2"
          style={{ background: 'radial-gradient(circle, #818CF8 0%, #A78BFA 45%, transparent 75%)', filter: 'blur(50px)', top: '50px', right: '200px' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-50 animate-blob3"
          style={{ background: 'radial-gradient(circle, #38BDF8 0%, #67E8F9 50%, transparent 75%)', filter: 'blur(45px)', top: '200px', right: '-50px' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-40 animate-blob1"
          style={{ background: 'radial-gradient(circle, #C084FC 0%, #F0ABFC 50%, transparent 75%)', filter: 'blur(60px)', top: '300px', right: '300px', animationDelay: '2s' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full opacity-55 animate-blob2"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, #22D3EE 50%, transparent 75%)', filter: 'blur(35px)', top: '100px', right: '400px', animationDelay: '1s' }} />
        {/* Mesh overlay for depth */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, transparent 0%, white 85%)' }} />
      </div>
    </div>
  );
}

// ─── Nav dropdown data ────────────────────────────────────────────────────────
const NAV_MENUS: Record<string, { icon: string; title: string; desc: string; href: string }[]> = {
  Products: [
    { icon: '💳', title: 'Collect Payments',  desc: 'Accept mobile money, cards & bank transfers across Africa', href: '/register' },
    { icon: '📤', title: 'Send Payouts',       desc: 'Disburse funds instantly to any account or mobile wallet',   href: '/register' },
    { icon: '🔗', title: 'Payment Pages',      desc: 'No-code hosted payment forms — live in minutes',             href: '/register' },
    { icon: '🔄', title: 'Subscriptions',      desc: 'Recurring billing for daily, weekly or monthly plans',       href: '/register' },
    { icon: '➗', title: 'Split Payments',      desc: 'Split a single payment across multiple parties',             href: '/register' },
    { icon: '📊', title: 'Reconciliation',     desc: 'Automated settlement matching and gap detection',            href: '/register' },
  ],
  Solutions: [
    { icon: '🛍️', title: 'E-commerce',        desc: 'Sell products online to customers across Africa',            href: '/register' },
    { icon: '🏪', title: 'Marketplaces',       desc: 'Connect buyers and sellers with built-in escrow',           href: '/register' },
    { icon: '🏢', title: 'Platforms & SaaS',  desc: 'Embed ATLAS payments inside your own product',              href: '/register' },
    { icon: '🏦', title: 'Fintech Builders',   desc: 'Build financial products on the ATLAS infrastructure',      href: '/register' },
  ],
  Developers: [
    { icon: '📖', title: 'API Reference',      desc: 'Full REST API documentation with live examples',            href: 'http://localhost:3000/docs' },
    { icon: '🔔', title: 'Webhooks',           desc: 'Real-time HMAC-signed event notifications',                 href: '/dashboard/webhooks' },
    { icon: '🔑', title: 'API Keys',           desc: 'Create and manage test & live credentials',                 href: '/dashboard/developers' },
    { icon: '🚀', title: 'Quickstart Guide',   desc: 'Integrate payments and go live in under 30 minutes',        href: '/register' },
    { icon: '💡', title: 'API Status',         desc: 'Live uptime and latency across all regions',                href: '/register' },
  ],
};

function DropdownItem({ icon, title, desc, href }: { icon: string; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-lg flex-shrink-0 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
      </div>
    </Link>
  );
}

function NavItem({ label, hasDropdown }: { label: string; hasDropdown: boolean }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = NAV_MENUS[label] ?? [];
  const show = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setOpen(true); };
  const hide = () => { timeoutRef.current = setTimeout(() => setOpen(false), 120); };
  if (!hasDropdown) return <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{label}</Link>;
  const cols = items.length > 4 ? 2 : 1;
  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button className={`flex items-center gap-1 text-sm font-medium transition-colors ${open ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
        {label}
        <svg className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50 transition-all duration-200 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-100 rotate-45" />
        <div className={`relative bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/60 p-3 ${cols === 2 ? 'w-[480px] grid grid-cols-2 gap-1' : 'w-[280px] flex flex-col gap-1'}`}>
          {items.map(item => <DropdownItem key={item.title} {...item} />)}
          {label === 'Products' && (
            <div className="col-span-2 mt-2 pt-3 border-t border-slate-100 flex items-center justify-between px-3">
              <span className="text-xs text-slate-400">Explore the full ATLAS platform</span>
              <Link href="/register" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-white/80 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">ATLAS</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <NavItem label="Products"   hasDropdown={true} />
            <NavItem label="Solutions"  hasDropdown={true} />
            <NavItem label="Developers" hasDropdown={true} />
            <NavItem label="Pricing"    hasDropdown={false} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors">Sign in</Link>
          <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5850EC] hover:bg-[#4F46E5] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            Get started <span className="text-blue-200">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Product feature card (Stripe-style) ─────────────────────────────────────
function ProductCard({ title, description, gradient, children, expand = false }: {
  title: string; description?: string; gradient: string; children: React.ReactNode; expand?: boolean;
}) {
  return (
    <div className={`relative bg-white rounded-2xl border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-500 ${expand ? 'lg:col-span-2' : ''}`}>
      <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
      </div>
      <div className="p-7 pb-0">
        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{title}</h3>
        {description && <p className="text-slate-400 text-sm mb-6">{description}</p>}
      </div>
      <div className={`relative mx-4 mb-0 rounded-xl overflow-hidden mt-4`} style={{ background: gradient, minHeight: 220 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Mock payment UI (inside card) ───────────────────────────────────────────
function PaymentMockup() {
  return (
    <div className="absolute bottom-0 left-6 w-56 bg-white rounded-t-2xl shadow-2xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
        </div>
        <span className="text-xs font-bold text-slate-800">ATLAS PAY</span>
      </div>
      <p className="text-2xl font-black text-slate-900 mb-1">GHS 249.00</p>
      <p className="text-xs text-slate-400 mb-3">Deluxe Business Package</p>
      <div className="space-y-1.5 mb-3 text-xs text-slate-600">
        <div className="flex justify-between"><span>Subtotal</span><span>GHS 221.43</span></div>
        <div className="flex justify-between"><span>VAT (12.5%)</span><span>GHS 27.57</span></div>
        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1"><span>Total</span><span>GHS 249.00</span></div>
      </div>
      <button className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg">Pay GHS 249.00</button>
    </div>
  );
}

function PayoutMockup() {
  const rows = [
    { name: 'Kwame Mensah', bank: 'GCB Bank', amount: 'GHS 4,200', flag: '🇬🇭', status: 'Sent' },
    { name: 'Amara Diallo', bank: 'GTBank NG', amount: 'NGN 185K', flag: '🇳🇬', status: 'Sent' },
    { name: 'Fatima Hassan', bank: 'M-Pesa KE', amount: 'KES 12,500', flag: '🇰🇪', status: 'Pending' },
  ];
  return (
    <div className="absolute bottom-0 inset-x-4 bg-white/95 backdrop-blur-sm rounded-t-2xl shadow-2xl overflow-hidden border border-slate-100/50">
      <div className="px-4 py-3 border-b border-slate-50">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Payouts</p>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0">
          <div className="flex items-center gap-3">
            <span className="text-base">{r.flag}</span>
            <div><p className="text-xs font-semibold text-slate-800">{r.name}</p><p className="text-[10px] text-slate-400">{r.bank}</p></div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">{r.amount}</p>
            <p className={`text-[10px] font-semibold ${r.status === 'Sent' ? 'text-emerald-500' : 'text-amber-500'}`}>{r.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex gap-1.5">{['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}} />)}</div>
        <div className="flex-1 bg-white rounded-md mx-2 px-3 py-1 text-[10px] text-slate-400 border border-slate-100">dashboard.atlaspay.io</div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[['GHS 245K','Volume'],['1,240','Transactions'],['GHS 180K','Payouts']].map(([v,l]) => (
            <div key={l} className="bg-blue-50 rounded-lg p-2"><p className="text-xs font-bold text-blue-700">{v}</p><p className="text-[9px] text-blue-400">{l}</p></div>
          ))}
        </div>
        <div className="bg-slate-50 rounded-lg p-2 mb-2">
          <p className="text-[9px] font-semibold text-slate-500 mb-1.5">Connected Accounts</p>
          {[['MTN Ghana','GHS 8,348','$71,502'],['Vodafone','GHS 1,502','$8,879'],['AirtelTigo','GHS 1,247','$24,569']].map(([n,a,v]) => (
            <div key={n} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
              <p className="text-[9px] font-medium text-slate-700">{n}</p>
              <p className="text-[9px] text-slate-500">{a}</p>
              <p className="text-[9px] font-semibold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GlobeMockup() {
  const PINS = [{x:38,y:52},{x:44,y:49},{x:67,y:60},{x:55,y:84},{x:65,y:67}];
  const W=260,H=260,COLS=30,ROWS=30;
  const dots:any[]=[];
  function inAfrica(col:number,row:number){
    const x=col/COLS,y=row/ROWS;
    if(y<0.12||y>0.95||x<0.12||x>0.88)return false;
    if(y<0.2&&(x<0.3||x>0.8))return false;
    if(x<0.18&&y<0.4)return false;
    if(y>0.88&&(x<0.38||x>0.62))return false;
    return true;
  }
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(inAfrica(c,r))dots.push({cx:(c/COLS)*W+4,cy:(r/ROWS)*H+4});
  return(
    <div className="flex items-center justify-center py-6">
      <div className="relative">
        <svg width={W} height={H}>
          {dots.map((d,i)=><circle key={i} cx={d.cx} cy={d.cy} r={3} fill="white" fillOpacity={0.3}/>)}
          {PINS.map((p,i)=>{
            const px=(p.x/100)*W+4,py=(p.y/100)*H+4;
            return(<g key={i}><circle cx={px} cy={py} r={12} fill="white" fillOpacity={0.1}/><circle cx={px} cy={py} r={6} fill="white" fillOpacity={0.15}/><circle cx={px} cy={py} r={3.5} fill="white" stroke="white" strokeWidth="1"/></g>);
          })}
          {([[38,52,44,49],[44,49,67,60],[44,49,55,84],[67,60,65,67]] as const).map(([x1,y1,x2,y2],i)=>(
            <line key={i} x1={(x1/100)*W+4} y1={(y1/100)*H+4} x2={(x2/100)*W+4} y2={(y2/100)*H+4} stroke="white" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3,3"/>
          ))}
        </svg>
        <div className="absolute top-8 right-0 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-bold text-slate-800">
          <span className="text-emerald-500">↑</span> GHS 155 USDC
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1) rotate(0deg)} 33%{transform:translate(-40px,-60px) scale(1.15) rotate(5deg)} 66%{transform:translate(30px,30px) scale(0.9) rotate(-5deg)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(50px,-30px) scale(1.1)} 70%{transform:translate(-20px,40px) scale(0.95)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(-30px,50px) scale(1.05)} 60%{transform:translate(40px,-20px) scale(1.1)} }
        .animate-blob1{animation:blob1 12s ease-in-out infinite}
        .animate-blob2{animation:blob2 15s ease-in-out infinite}
        .animate-blob3{animation:blob3 10s ease-in-out infinite}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .animate-marquee{animation:marquee 28s linear infinite}
      `}</style>

      <div className="min-h-screen bg-white font-sans antialiased">
        <Navbar />

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <GradientOrb />
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20 pb-24">
            <LiveCounter />
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.02] tracking-tight max-w-3xl mb-6">
              Financial infrastructure{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400">
                to grow your business.
              </span>
            </h1>
            <p className="text-xl text-slate-500 max-w-xl leading-relaxed mb-10">
              Accept payments, handle payouts, and reconcile settlements across Africa—from your first transaction to your millionth.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-2 px-7 py-4 bg-[#5850EC] hover:bg-[#4F46E5] text-white font-bold rounded-xl shadow-xl shadow-indigo-200 transition-all hover:-translate-y-0.5 text-base">
                Get started <span>→</span>
              </Link>
              <Link href="/login"
                className="inline-flex items-center gap-2 px-7 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-base">
                Sign in to dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* ── TRUST LOGOS ───────────────────────────────────────────────────── */}
        <section className="border-t border-slate-100 py-10 overflow-hidden bg-white">
          <div className="flex whitespace-nowrap animate-marquee gap-0">
            {[...['MTN', 'Vodafone', 'Bolt', 'Jumia', 'Total Energies', 'Zipline', 'Flutterwave', 'Wave', 'Chipper Cash', 'M-KOPA', 'Andela', 'Paystack'],...['MTN', 'Vodafone', 'Bolt', 'Jumia', 'Total Energies', 'Zipline', 'Flutterwave', 'Wave', 'Chipper Cash', 'M-KOPA', 'Andela', 'Paystack']].map((b, i) => (
              <span key={i} className="inline-block px-10 text-slate-300 font-black text-lg tracking-tight hover:text-slate-400 transition-colors cursor-default">{b}</span>
            ))}
          </div>
        </section>

        {/* ── PRODUCT CARDS ─────────────────────────────────────────────────── */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <p className="text-sm text-slate-400 font-medium mb-2">Unified payment platform</p>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight max-w-2xl leading-tight">
                Everything your business needs to move money
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Card 1 — Collect Payments */}
              <ProductCard
                title="Accept and collect payments—online and in person"
                gradient="linear-gradient(135deg, #1E40AF 0%, #2D8EFF 40%, #60A5FA 70%, #BAE6FD 100%)"
                expand>
                <div className="relative" style={{ height: 240 }}>
                  <PaymentMockup />
                </div>
              </ProductCard>

              {/* Card 2 — Enable billing */}
              <ProductCard
                title="Enable any payout model"
                gradient="linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A78BFA 100%)">
                <div className="relative" style={{ height: 240 }}>
                  <PayoutMockup />
                </div>
              </ProductCard>

              {/* Card 3 — Agentic / Insights */}
              <ProductCard
                title="AI-powered reconciliation insights"
                gradient="linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #5EEAD4 100%)">
                <div className="p-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
                    <p className="text-xs font-semibold opacity-70 mb-2">Settlement match rate</p>
                    <p className="text-3xl font-black mb-1">98.4%</p>
                    <div className="h-1.5 bg-white/20 rounded-full mt-3 mb-1"><div className="h-1.5 bg-white rounded-full" style={{width:'98.4%'}} /></div>
                    <p className="text-[10px] opacity-60 mt-2">847 of 861 transactions matched this period</p>
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {['GHS','NGN','KES','ZAR','XOF'].map(c=>(
                      <span key={c} className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              </ProductCard>

              {/* Card 4 — Embed payments */}
              <ProductCard
                title="Embed payments in your platform"
                gradient="linear-gradient(135deg, #1E293B 0%, #334155 60%, #475569 100%)"
                expand>
                <div className="relative" style={{ height: 260 }}>
                  <DashboardMockup />
                </div>
              </ProductCard>

              {/* Card 5 — Borderless */}
              <ProductCard
                title="Access borderless money movement across Africa"
                gradient="linear-gradient(135deg, #1D4ED8 0%, #3730A3 50%, #312E81 100%)">
                <GlobeMockup />
              </ProductCard>

            </div>
          </div>
        </section>

        {/* ── DEVELOPER SECTION ─────────────────────────────────────────────── */}
        <section className="bg-slate-950 py-24 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-blue-400 text-xs font-semibold">For developers</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-6">
                Integrate payments in minutes, not months
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Clean REST API. Real-time webhooks. SDKs for every stack. Start accepting live payments this afternoon.
              </p>
              <div className="flex gap-4">
                <Link href="http://localhost:3000/docs" target="_blank"
                  className="px-6 py-3 bg-[#5850EC] hover:bg-[#4F46E5] text-white font-semibold rounded-xl transition-colors text-sm">
                  Read the docs
                </Link>
                <Link href="/register"
                  className="px-6 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-xl transition-colors text-sm">
                  Get API keys
                </Link>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-800/60 border-b border-slate-800">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" /></div>
                <span className="text-slate-500 text-xs font-mono ml-2">collect-payment.js</span>
              </div>
              <pre className="p-6 text-[13px] font-mono overflow-x-auto leading-7 text-slate-300"><code>{`const atlas = require('@atlas/node')('sk_test_...');

const intent = await atlas.paymentIntents.create({
  amount: 24900,      // GHS 249.00 in pesewas
  currency: 'GHS',
  description: 'Annual subscription',
  customer: {
    email: 'kwame@example.com',
    name: 'Kwame Mensah',
  },
});

// Redirect customer to hosted payment page
console.log(intent.paymentUrl);
// → https://pay.atlaspay.io/pi_01J...`}</code></pre>
              <div className="mx-5 mb-5 bg-emerald-950/60 border border-emerald-800/40 rounded-xl p-4">
                <p className="text-emerald-400 text-[11px] font-mono">// Response — 201 Created</p>
                <p className="text-slate-300 text-[11px] font-mono mt-1">{'{ id: "pi_01JXYZ...", status: "CREATED",'}</p>
                <p className="text-slate-300 text-[11px] font-mono">{'  amount: 24900, currency: "GHS" }'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
        <section className="relative bg-white py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full opacity-8"
              style={{ background: 'radial-gradient(circle, #EEF2FF 0%, transparent 70%)' }} />
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Start accepting payments <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">today.</span>
            </h2>
            <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto">
              Create your free account. No contracts, no monthly fees. Pay only when you earn.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#5850EC] hover:bg-[#4F46E5] text-white font-bold rounded-xl shadow-2xl shadow-indigo-200/60 transition-all hover:-translate-y-0.5 text-base">
                Create free account →
              </Link>
              <Link href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-base">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-100 py-10 px-6 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              </div>
              <span className="font-black text-slate-800 text-lg">ATLAS</span>
              <span className="text-slate-300 text-sm ml-2">© 2026 ATLAS Payments Inc.</span>
            </div>
            <div className="flex items-center gap-8">
              {['Privacy', 'Terms', 'Security', 'Cookies', 'Status'].map(l => (
                <Link key={l} href="#" className="text-slate-400 hover:text-slate-700 text-sm transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
