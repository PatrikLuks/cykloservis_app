import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../img/BIKESERVIS.svg';
import showroomFallback from '../img/showroomBike.png';

export default function Landing(){
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <header className="w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={Logo} alt="Bikeservis" className="h-7 w-auto" />
            <span className="font-semibold text-lg tracking-tight group-hover:text-brand transition-colors">Bikeservis</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-brand transition">Funkce</a>
            <a href="#process" className="hover:text-brand transition">Proces servisu</a>
            <a href="#references" className="hover:text-brand transition">Reference</a>
            <a href="#faq" className="hover:text-brand transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium hover:text-brand">Přihlásit</Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand transition">
              Začít zdarma
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(57,79,247,0.12),transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-5 pt-20 pb-28 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 max-w-xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                Kompletní digitální servisní kniha a příjem kol
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Zrychlete příjem, plánování, komunikaci i vyúčtování servisu. 50+ servisních úkonů
                s kalkulací, historie komponent a automatické notifikace zákazníkovi.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/register" className="bg-brand text-white font-semibold px-7 py-3 rounded-xl shadow-sm hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand transition text-sm">
                  Vyzkoušejte zdarma
                </Link>
                <a href="#references" className="text-sm font-semibold text-slate-700 hover:text-brand flex items-center gap-2">
                  Důvěřují nám cyklo nadšenci
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </a>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="font-bold text-xl">50+</div>
                  <div className="text-slate-500">Servisních úkonů</div>
                </div>
                <div>
                  <div className="font-bold text-xl">∞</div>
                  <div className="text-slate-500">Komponent v evidenci</div>
                </div>
                <div>
                  <div className="font-bold text-xl">24/7</div>
                  <div className="text-slate-500">Notifikace</div>
                </div>
                <div>
                  <div className="font-bold text-xl">+30 %</div>
                  <div className="text-slate-500">Rychlejší příjem</div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-xl">
              <div className="relative rounded-3xl border border-slate-200 shadow-xl bg-white/70 backdrop-blur p-2">
                <picture>
                  <source type="image/avif" srcSet={require('../img/showroomBike-768.avif')} />
                  <source type="image/webp" srcSet={require('../img/showroomBike-768.webp')} />
                  <img src={showroomFallback} alt="Ukázka aplikace servisu" className="rounded-2xl w-full h-auto" loading="lazy" />
                </picture>
                <div className="absolute -bottom-5 -left-5 bg-white shadow-md rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime stav zakázky
                </div>
                <div className="absolute -top-5 -right-5 bg-white shadow-md rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                  Historie komponent
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5">
            <h2 className="text-3xl font-extrabold mb-12 tracking-tight">Klíčové Funkce</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                ['Příjem a kalkulace','Standardizovaný příjem na jedno kliknutí + kalkulace 50 úkonů.'],
                ['Komponentové počítadla','Sledujte nájezd, opotřebení a plán údržby.'],
                ['Servisní historie','Kompletní záznam všech zásahů a nákladů.'],
                ['Notifikace a e-maily','Automatické informování o stavu zakázky.'],
                ['Chat se zákazníkem','Kontextová komunikace přímo k zakázce.'],
                ['Reporty a výkon','Přehled vytížení a profitability.']
              ].map(([title,desc])=> (
                <div key={title} className="p-6 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition flex flex-col">
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{desc}</p>
                  <div className="mt-4 text-xs font-medium text-brand/70">Součást plánu Beta</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Process */}
        <section id="process" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-5">
            <h2 className="text-3xl font-extrabold mb-12 tracking-tight">Proces Servisu</h2>
            <ol className="grid md:grid-cols-3 gap-10 list-decimal list-inside">
              {['Příjem & diagnostika','Kalkulace & schválení','Realizace & notifikace','Kontrola & výstup','Fakturace','Historie & analýza'].map((step,i)=>(
                <li key={step} className="relative pl-6">
                  <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-[10px] font-bold text-brand">{i+1}</span>
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
        {/* References */}
        <section id="references" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5">
            <h2 className="text-3xl font-extrabold mb-12 tracking-tight">Reference</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {['Ušetřili jsme desítky minut na příjmu každé zakázky.','Mít historii komponent na jednom místě je game changer.','Zákazníci oceňují transparentnost a notifikace.'].map(txt => (
                <div key={txt} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 backdrop-blur shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-700">“{txt}”</p>
                  <div className="mt-4 text-xs font-semibold text-slate-500">Beta uživatel</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* FAQ placeholder */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">Často kladené otázky</h2>
            <div className="space-y-6 text-sm text-slate-600">
              <div>
                <div className="font-medium text-slate-800">Je systém dostupný zdarma?</div>
                <p>Aktuálně ve verzi Beta – registrace je zdarma.</p>
              </div>
              <div>
                <div className="font-medium text-slate-800">Mohu exportovat data?</div>
                <p>Export servisní historie plánujeme v GA verzi.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-slate-900 text-slate-300 text-sm py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row gap-8 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Bikeservis" className="h-6 w-auto" />
            <span className="font-semibold">Bikeservis</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition">Funkce</a>
            <a href="#process" className="hover:text-white transition">Proces</a>
            <a href="#references" className="hover:text-white transition">Reference</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} Bikeservis. Všechna práva vyhrazena.</div>
        </div>
      </footer>
    </div>
  );
}
