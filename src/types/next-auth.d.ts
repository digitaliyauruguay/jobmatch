//Archivo 2 — next-auth.d.ts (extensión de tipos)
//Este archivo es más técnico pero simple de entender. NextAuth por defecto solo guarda name, email e image en la sesión. Nosotros necesitamos guardar también id, role y status.
//Este archivo le dice a TypeScript "che, la sesión de NextAuth en este proyecto tiene estos campos extra". Sin él, TypeScript se quejaría cada vez que intentaras acceder a session.user.role porque no lo conocería.

/*
 * Archivo: src/types/next-auth.d.ts
 * Qué hace: Extiende los tipos de NextAuth v4 para incluir los campos
 * personalizados que usamos en nuestra app: id, role y status.
 * Sin este archivo TypeScript no reconocería esos campos en la sesión.
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    status: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    status: string;
  }
}