/*
 * Archivo: src/lib/emails.ts
 * Qué hace: Define los templates HTML de todos los emails que envía
 * la plataforma. Cada función recibe los datos necesarios y devuelve
 * el subject y el html del email listo para enviar con sendMail.
 */

export const emailUserApproved = (firstName: string) => ({
  subject: "Tu cuenta fue aprobada — JobMatch Uruguay",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">¡Bienvenido a JobMatch Uruguay!</h2>
      <p>Hola ${firstName},</p>
      <p>Tu cuenta fue aprobada. Ya podés ingresar a la plataforma y empezar a usar todos los servicios.</p>
      <a href="${process.env.NEXTAUTH_URL}/login"
        style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        Ingresar a JobMatch
      </a>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Si tenés alguna consulta podés responder este email.
      </p>
    </div>
  `,
});

export const emailRegistrationReceived = (firstName: string) => ({
  subject: "Recibimos tu registro — JobMatch Uruguay",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">¡Gracias por registrarte!</h2>
      <p>Hola ${firstName},</p>
      <p>Recibimos tu registro en JobMatch Uruguay. Nuestro equipo va a revisar tu cuenta y aprobarla en un plazo de hasta 48 horas hábiles.</p>
      <p>Te vamos a avisar por este mismo correo en cuanto tu cuenta esté activa.</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Si tenés alguna consulta, podés responder este email.
      </p>
    </div>
  `,
});

export const emailUserBlocked = (firstName: string, reason?: string) => ({
  subject: "Tu cuenta fue bloqueada — JobMatch Uruguay",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Tu cuenta fue bloqueada</h2>
      <p>Hola ${firstName},</p>
      <p>Tu cuenta en JobMatch Uruguay fue bloqueada temporalmente.</p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ""}
      <p>Si creés que esto es un error, respondé este email para contactar al equipo.</p>
    </div>
  `,
});

export const emailNewApplication = (
  companyName: string,
  jobTitle: string,
  workerName: string
) => ({
  subject: `Nueva postulación para "${jobTitle}" — JobMatch Uruguay`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">Nueva postulación recibida</h2>
      <p>Hola ${companyName},</p>
      <p><strong>${workerName}</strong> se postuló a tu oferta <strong>"${jobTitle}"</strong>.</p>
      <a href="${process.env.NEXTAUTH_URL}/company/dashboard"
        style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        Ver postulaciones
      </a>
    </div>
  `,
});

export const emailApplicationApproved = (
  workerName: string,
  jobTitle: string,
  companyName: string
) => ({
  subject: `Tu postulación fue aprobada — JobMatch Uruguay`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">¡Tu postulación fue aprobada!</h2>
      <p>Hola ${workerName},</p>
      <p>La empresa <strong>${companyName}</strong> aprobó tu postulación para el puesto <strong>"${jobTitle}"</strong>.</p>
      <p>La empresa se pondrá en contacto con vos a la brevedad.</p>
      <a href="${process.env.NEXTAUTH_URL}/worker/dashboard"
        style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        Ver mis postulaciones
      </a>
    </div>
  `,
});

export const emailApplicationRejected = (
  workerName: string,
  jobTitle: string,
  companyName: string
) => ({
  subject: `Actualización de tu postulación — JobMatch Uruguay`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4b5563;">Actualización de tu postulación</h2>
      <p>Hola ${workerName},</p>
      <p>La empresa <strong>${companyName}</strong> revisó tu postulación para <strong>"${jobTitle}"</strong> y en esta oportunidad no fue seleccionada.</p>
      <p>No te desanimes, seguí explorando otras ofertas disponibles.</p>
      <a href="${process.env.NEXTAUTH_URL}/worker/dashboard"
        style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        Ver más ofertas
      </a>
    </div>
  `,
});

export const emailIndicated = (
  workerName: string,
  jobTitle: string,
  companyName: string
) => ({
  subject: `Una empresa te indicó para una oferta — JobMatch Uruguay`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">¡Te indicaron para una oferta!</h2>
      <p>Hola ${workerName},</p>
      <p>La empresa <strong>${companyName}</strong> te indicó para el puesto <strong>"${jobTitle}"</strong>.</p>
      <a href="${process.env.NEXTAUTH_URL}/worker/dashboard"
        style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        Ver indicaciones
      </a>
    </div>
  `,
});

export const emailJobBlocked = (
  companyName: string,
  jobTitle: string,
  reason?: string
) => ({
  subject: `Tu oferta fue bloqueada — JobMatch Uruguay`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Tu oferta fue bloqueada</h2>
      <p>Hola ${companyName},</p>
      <p>Tu oferta <strong>"${jobTitle}"</strong> fue bloqueada por el administrador.</p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ""}
      <p>Revisá el contenido y contactá al equipo si tenés dudas.</p>
    </div>
  `,
});

export const emailPasswordReset = (code: string) => ({
  subject: "Código para recuperar tu contraseña — JobMatch Uruguay",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">Recuperá tu contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña en JobMatch Uruguay.</p>
      <p>Usá este código para continuar:</p>
      <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1d4ed8;">${code}</span>
      </div>
      <p>Este código vence en 30 minutos.</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Si no solicitaste este cambio, podés ignorar este email de forma segura.
      </p>
    </div>
  `,
});