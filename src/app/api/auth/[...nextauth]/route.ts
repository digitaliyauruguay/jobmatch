//Archivo 1 — route.ts (configuración de NextAuth)
//Este es el cerebro de la autenticación. Hace tres cosas:
//Primero, define cómo se loguea un usuario. En nuestro caso con email y contraseña. Cuando alguien intenta entrar, este archivo busca el usuario en la base de datos, compara la contraseña encriptada, y verifica que el estado sea ACTIVE. Si todo está bien, lo deja pasar. Si no, lo rechaza.
//Segundo, cuando el login es exitoso, crea un token JWT — que es básicamente un ticket digital que el navegador guarda y manda en cada petición para identificar al usuario sin tener que consultar la base de datos todo el tiempo. En ese token guardamos el id, el role y el status del usuario.
//Tercero, convierte ese token en una sesión — que es lo que tu aplicación usa para saber quién está logueado en cada momento. Gracias a esto podés hacer cosas como "si el rol es WORKER mostrá este menú, si es COMPANY mostrá el otro".

/*
 * Archivo: src/app/api/auth/[...nextauth]/route.ts
 * Qué hace: Configura NextAuth para manejar autenticación con email
 * y contraseña. Verifica las credenciales contra la base de datos,
 * encripta contraseñas con bcrypt, y agrega el rol y estado del
 * usuario al token JWT y a la sesión.
 */

/*
 * Archivo: src/app/api/auth/[...nextauth]/route.ts
 * Qué hace: Configura NextAuth para manejar autenticación con email
 * y contraseña. Verifica las credenciales contra la base de datos,
 * encripta contraseñas con bcrypt, y agrega el rol y estado del
 * usuario al token JWT y a la sesión.
 */

/*
/*
 * Archivo: src/app/api/auth/[...nextauth]/route.ts
 * Qué hace: Configura NextAuth v4 para manejar autenticación con email
 * y contraseña. Verifica las credenciales contra la base de datos,
 * compara la contraseña encriptada con bcrypt, y agrega el rol y estado
 * del usuario al token JWT y a la sesión.
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(
    credentials.password,
    user.password
  );

  if (!passwordMatch) return null;

  if (user.status === "PENDING") {
    throw new Error("PENDING");
  }

  if (user.status === "BLOCKED") {
    throw new Error("BLOCKED");
  }

  if (user.status === "INACTIVE") {
    throw new Error("INACTIVE");
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
},
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };