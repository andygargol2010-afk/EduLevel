import React, { useEffect } from 'react'

export default function Contact({ onBack }: { onBack?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Contacto — EduLevel'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header
        className="relative overflow-hidden dot-grid-bg"
        style={{ background: 'linear-gradient(160deg, #0E1D54 0%, #152A79 45%, #2347C5 100%)' }}
      >
        <div
          className="pointer-events-none absolute -top-24 right-[-10%] w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-[900px] mx-auto px-4 pt-10 pb-12">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100 hover:text-white transition-colors mb-6"
          >
            ← Volver
          </button>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider backdrop-blur-sm">
            💬 Estamos para ayudarte
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Contacto</h1>
          <p className="text-blue-100 max-w-lg leading-relaxed">
            Canal para consultas técnicas, legales, de privacidad y correcciones.
          </p>
        </div>
        <svg className="relative block w-full text-background" viewBox="0 0 900 28" fill="none" preserveAspectRatio="none" style={{ height: '24px' }} aria-hidden="true">
          <path d="M0 28 C 225 0, 675 0, 900 28 L900 28 L0 28 Z" fill="currentColor" />
        </svg>
      </header>

      <main className="max-w-[900px] mx-auto px-4 -mt-2 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <a
            href="mailto:andygargol2010@gmail.com"
            className="group bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              ✉️
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-data mb-0.5">Email</p>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors break-all">
                andygargol2010@gmail.com
              </p>
            </div>
          </a>

          <a
            href="https://wa.me/5491162517976"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              📱
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-data mb-0.5">Teléfono y WhatsApp</p>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                +54 9 11 6251-7976
              </p>
            </div>
          </a>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🛟</span>
            <h2 className="font-display text-lg font-bold text-slate-900">Soporte</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            Escribinos para reportar errores, solicitar correcciones, hacer consultas técnicas o legales, o ejercer dudas relacionadas con privacidad.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-full font-data">
            ⏱ Respondemos en 48 horas laborables
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onBack} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            ← Volver al inicio
          </button>
        </div>
      </main>
    </div>
  )
}
