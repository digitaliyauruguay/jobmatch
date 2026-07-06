/*
 * Archivo: src/app/api/auth/[...nextauth]/route.ts
 * Qué hace: Configura NextAuth v4 para manejar autenticación con email
 * y contraseña. Verifica las credenciales contra la base de datos,
 * compara la contraseña encriptada con bcrypt, y agrega el rol y estado
 * del usuario al token JWT y a la sesión.
 * El callback jwt re-verifica el status del usuario en cada request
 * (cada 60 segundos como máximo) consultando la DB directamente —
 * esto permite detectar bloqueos/desactivaciones sin depender del
 * middleware Edge que no puede usar Prisma en Vercel.
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

        if (user.status === "PENDING") throw new Error("PENDING");
        if (user.status === "BLOCKED") throw new Error("BLOCKED");
        if (user.status === "INACTIVE") throw new Error("INACTIVE");

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
    async jwt({ token, user, trigger }) {
      // Login inicial — setear datos del usuario en el token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.statusCheckedAt = Date.now();
        return token;
      }

      // Re-verificar status en DB cada 60 segundos
      // Esto detecta bloqueos/desactivaciones sin depender del middleware Edge
      const now = Date.now();
      const lastCheck = (token.statusCheckedAt as number) || 0;
      const CHECK_INTERVAL_MS = 60 * 1000; // 60 segundos

      if (now - lastCheck > CHECK_INTERVAL_MS) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { status: true },
          });

          if (freshUser) {
            token.status = freshUser.status;
          }
          token.statusCheckedAt = now;
        } catch (error) {
          console.error("Error al re-verificar status en JWT callback:", error);
          // Si falla la consulta, no romper la sesión — mantener el status actual
        }
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