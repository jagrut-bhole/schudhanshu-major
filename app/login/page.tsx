"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const { status } = useSession();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    /* Redirect if already signed in */
    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/trending");
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const result = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid email or password");
            } else {
                toast.success("Welcome back! 🔥");
                router.replace("/trending");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || status === "authenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E8F0FE]">
                <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#E8F0FE] via-[#F0F4F8] to-[#E8F0FE] text-slate-800 font-sans">
            <div className="relative z-10 w-full max-w-md">
                {/* Back to home */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70 text-slate-500"
                >
                    ← Back to home
                </Link>

                {/* Card */}
                <div className="rounded-3xl p-8 sm:p-10 bg-white/80 backdrop-blur-md border border-blue-100 shadow-xl shadow-blue-900/5">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <h1 className="text-2xl font-black text-slate-900">
                            Welcome back
                        </h1>
                        <p className="text-sm mt-1 text-slate-500">
                            Sign in to your TrendForge account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold tracking-wide text-slate-600"
                            >
                                EMAIL ADDRESS
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                placeholder="you@example.com"
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 bg-white border border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold tracking-wide text-slate-600"
                            >
                                PASSWORD
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                                placeholder="••••••••"
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 bg-white border border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer w-full rounded-2xl py-3.5 text-base font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In →"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 border-t border-blue-100" />

                    {/* Register link */}
                    <p className="text-center text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-blue-600 transition-opacity hover:opacity-80"
                        >
                            Create one for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
