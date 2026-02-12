import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/security";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Rate limiting: 5 attempts per 15 minutes per email
        const rateLimit = checkRateLimit(credentials.email, {
          maxAttempts: 5,
          windowMs: 15 * 60 * 1000, // 15 minutes
          lockoutDurationMs: 15 * 60 * 1000, // Lock for 15 minutes after max attempts
        });

        if (!rateLimit.allowed) {
          console.warn(`Rate limit exceeded for ${credentials.email}. Retry after ${rateLimit.retryAfter} seconds`);
          throw new Error(`Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Don't reveal that user doesn't exist (security best practice)
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        // Reset rate limit on successful login
        resetRateLimit(credentials.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, populate token with user data
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.iat = Math.floor(Date.now() / 1000); // Issue time
      }
      
      // On update(), fetch fresh user data from database
      if (trigger === "update" && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, name: true, email: true, role: true },
        });
        
        if (freshUser) {
          token.name = freshUser.name;
          token.email = freshUser.email;
          token.role = freshUser.role;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours - session expires after 2 hours
    updateAge: 10 * 60, // 10 minutes - update session every 10 minutes of activity
  },
  jwt: {
    maxAge: 2 * 60 * 60, // 2 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
