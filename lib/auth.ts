import prisma from "./prisma"
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";

if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not defined in environment variables");
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    debug: process.env.NODE_ENV === "development",
    cookies: {
        sessionToken: {
            name:
                process.env.NODE_ENV === "production"
                    ? "__Secure-next-auth.session-token"
                    : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production", // HTTPS only in production
            },
        },
    },
    providers: [
        CredentialsProvider({
            name: "Crendentials",
            id: "credentials",
            type: "credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "Email"
                },
                password: {
                    label: "Password",
                    type: "password",
                    placeholder: "Password"
                },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("No credentials provided");
                }

                const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email
                        },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            password: true,
                            createdAt: true   
                        }
                    })

                    if (!user) {
                        throw new Error("No user found!!")
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        throw new Error("Invalid credentials")
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        createdAt: user.createdAt
                    }
                }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/error"
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
            }
            return session;
        }
    }
}