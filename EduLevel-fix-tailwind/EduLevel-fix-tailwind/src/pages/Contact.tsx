import React, { useEffect } from 'react'

export default function Contact({ onBack }: { onBack?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Contacto — EduLevel'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b py-6">
        <div className="max-w-[900px] mx-auto px-4">
          <h1 className="text-2xl font-black text-slate-900">Contacto</h1>
          <p className="text-sm text-slate-500 mt-2">Canal para consultas técnicas, legales, de privacidad y correcciones.</p>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-8">
        <section className="prose prose-slate">
          <h2>Contacto directo</h2>
          <p>Email: <a href="mailto:andygargol2010@gmail.com">andygargol2010@gmail.com</a></p>
          <p>Teléfono y WhatsApp: <a href="tel:+5491162517976">+54 9 11 6251-7976</a></p>

          <h2>Soporte</h2>
          <p>Escribe para reportar errores, solicitar correcciones, hacer consultas técnicas o legales, o ejercer dudas relacionadas con privacidad. Intentamos responder en 48 horas laborables.</p>
        </section>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="max-w-[900px] mx-auto px-4 text-sm text-slate-500">
          <button onClick={onBack} className="text-blue-600 hover:underline">← Volver</button>
        </div>
      </footer>
    </div>
  )
}
