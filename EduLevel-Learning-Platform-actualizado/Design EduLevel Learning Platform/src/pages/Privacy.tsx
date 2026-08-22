import React, { useEffect } from 'react'

export default function Privacy({ onBack }: { onBack?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Política de Privacidad — EduLevel'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b py-6">
        <div className="max-w-[900px] mx-auto px-4">
          <h1 className="text-2xl font-black text-slate-900">Política de Privacidad</h1>
          <p className="text-sm text-slate-500 mt-2">Información sobre datos, cookies y tecnologías publicitarias.</p>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-8">
        <section className="prose prose-slate">
          <h2>Responsable y alcance</h2>
          <p>El responsable es Andrés García, residente en Argentina, con público objetivo internacional. Para consultas sobre privacidad puedes escribir a <a href="mailto:andygargol2010@gmail.com">andygargol2010@gmail.com</a> o llamar al <a href="tel:+5491162517976">+54 9 11 6251-7976</a>. No publicamos una dirección residencial.</p>

          <h2>Datos de la plataforma</h2>
          <p>Los tests y ejercicios se ejecutan principalmente en el navegador. EduLevel no solicita contraseñas bancarias ni números de cuentas bancarias. Podemos recibir datos técnicos mínimos necesarios para seguridad, funcionamiento y medición del sitio.</p>

          <h2>Uso de la información</h2>
          <p>Las direcciones IP, identificadores técnicos, información del dispositivo y datos de uso pueden utilizarse para seguridad, análisis, mostrar anuncios, medir su rendimiento y limitar la frecuencia de los anuncios.</p>

          <h2>Cookies y tecnologías similares</h2>
          <p>Podemos utilizar cookies, balizas web y tecnologías similares. Google y sus partners publicitarios pueden leer o instalar cookies y utilizar tecnologías publicitarias para personalizar, mostrar, medir y limitar anuncios, según la configuración de consentimiento aplicable.</p>
          <p>Puedes aceptar, rechazar o modificar tus preferencias mediante el mecanismo de consentimiento disponible en el sitio o desde la configuración de tu navegador. La información de Google sobre tecnologías de partners está disponible en <a href="https://policies.google.com/technologies/partner-sites?hl=es" target="_blank" rel="noreferrer">policies.google.com</a>.</p>

          <h2>Consentimiento y publicidad</h2>
          <p>La publicidad personalizada no debe cargarse antes del consentimiento cuando Google lo requiera. El sitio debe incorporar el CMP certificado generado desde la cuenta de Google AdSense antes de activar ese tratamiento.</p>

          <h2>Contacto</h2>
          <p>Para consultas sobre privacidad, escribe a <a href="mailto:andygargol2010@gmail.com">andygargol2010@gmail.com</a>.</p>
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
