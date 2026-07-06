/*
 * Archivo: src/lib/emails.ts
 * Qué hace: Define los templates HTML de los emails que envía
 * la plataforma. Solo se mantienen los eventos imprescindibles:
 * aprobación de cuenta, bloqueo de cuenta, bloqueo de oferta,
 * y recuperación de contraseña. Los demás eventos (registro recibido,
 * nueva postulación, postulación aprobada/rechazada, indicación)
 * se manejan solo con notificaciones internas para preservar el
 * cupo diario de emails de Brevo.
 */

export const emailUserApproved = (firstName: string) => ({
  subject: "Tu cuenta fue aprobada — JobMatch Uruguay",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #993556;">¡Bienvenido a JobMatch Uruguay!</h2>
      <p>Hola ${firstName},</p>
      <p>Tu cuenta fue aprobada. Ya podés ingresar a la plataforma y empezar a usar todos los servicios.</p>
      <a href="${process.env.NEXTAUTH_URL}/login"
        style="display: inline-block; background: #993556; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        Ingresar a JobMatch
      </a>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Si tenés alguna consulta podés responder este email.
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
      <h2 style="color: #993556;">Recuperá tu contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña en JobMatch Uruguay.</p>
      <p>Usá este código para continuar:</p>
      <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #993556;">${code}</span>
      </div>
      <p>Este código vence en 30 minutos.</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Si no solicitaste este cambio, podés ignorar este email de forma segura.
      </p>
    </div>
  `,
});