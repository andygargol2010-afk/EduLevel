import React, { useEffect } from 'react'

export default function Terms({ onBack }: { onBack?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Aviso Legal y Términos — EduLevel'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b py-6">
        <div className="max-w-[900px] mx-auto px-4">
          <h1 className="text-2xl font-black text-slate-900">Aviso Legal y Términos de Uso</h1>
          <p className="text-sm text-slate-500 mt-2">Condiciones para utilizar los contenidos educativos de EduLevel.</p>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-8">
        <section className="prose prose-slate">
          <h2>Responsable y condiciones generales</h2>
          <p>El responsable del sitio es Andrés García, residente en Argentina, y el servicio está dirigido a un público internacional. El acceso y uso del sitio implica la aceptación de estos términos. No se publica ninguna dirección residencial.</p>

          <h2>Carácter educativo</h2>
          <p>Los tests, guías y simulacros son herramientas informativas y educativas. Sus resultados no garantizan calificaciones ni sustituyen la orientación de docentes o instituciones educativas.</p>

          <h2>Propiedad intelectual</h2>
          <p>Los contenidos, diseño y código son propiedad de EduLevel o de sus licenciantes. No se permite la reproducción sin permiso.</p>

          <h2>Limitación de responsabilidad</h2>
          <p>EduLevel no garantiza la exactitud, disponibilidad o idoneidad de los contenidos para una situación académica concreta. El uso de la información es responsabilidad del usuario.</p>

          <h2>Contacto</h2>
          <p>Para consultas técnicas, legales, de privacidad o correcciones, escribe a <a href="mailto:andygargol2010@gmail.com">andygargol2010@gmail.com</a> o llama al <a href="tel:+5491162517976">+54 9 11 6251-7976</a>.</p>
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
