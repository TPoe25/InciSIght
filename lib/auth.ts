// lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Configure NextAuth with a credentials provider for user authentication
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        // If the user exists and the password is valid, return it; otherwise, return null
        if (!user) return null

        // Hash the password before storing it in the database
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password!
        )

        // If the password is valid, return the user; otherwise, return null
        if (!valid) return null

        // Return the user to the client
        return user
      }
    })
  ],
  // Use JWT for session management
  session: { strategy: "jwt" }
})
