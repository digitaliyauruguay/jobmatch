/*
 * Archivo: src/app/(auth)/pending/page.tsx
 * Qué hace: Página que ve el usuario después de registrarse.
 * Le informa que su cuenta está siendo revisada por el administrador
 * y que recibirá un email cuando sea aprobada.
 */

export default function PendingPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          ¡Cuenta creada!
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu cuenta está siendo revisada por nuestro equipo. Te avisaremos por email cuando esté aprobada y puedas empezar a usar la plataforma.
        </p>
        <a
          href="/login"
          className="text-blue-600 text-sm hover:underline"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </main>
  );
}