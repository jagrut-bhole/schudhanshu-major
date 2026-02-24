"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";

export default function RegisterPage() {
    const router = useRouter();
    const { status } = useSession();
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [loading, setLoading] = useState(false);

    /* Redirect if already signed in */
    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/trending");
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim() || !form.email || !form.password || !form.confirm) {
            toast.error("Please fill in all fields");
            return;
        }
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (form.password !== form.confirm) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            /* 1. Register */
            const res = await axios.post("/api/auth/register", {
                name: form.name.trim(),
                email: form.email,
                password: form.password,
            });

            if (!res.data.success) {
                toast.error(res.data.message || "Registration failed");
                return;
            }

            /* 2. Auto sign-in right after */
            const signInResult = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (signInResult?.error) {
                toast.success("Account created! Please sign in.");
                router.replace("/login");
            } else {
                toast.success("Account created! Welcome to TrendForge 🔥");
                router.replace("/trending");
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-linear-to-br from-[#E8F0FE] via-[#F0F4F8] to-[#E8F0FE] text-slate-800 font-sans">
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
                            Create your account
                        </h1>
                        <p className="text-sm mt-1 text-slate-500">
                            Join TrendForge — free forever
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="name"
                                className="block text-xs font-semibold tracking-wide text-slate-600"
                            >
                                FULL NAME
                            </label>
                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="Your name"
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 bg-white border border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="reg-email"
                                className="block text-xs font-semibold tracking-wide text-slate-600"
                            >
                                EMAIL ADDRESS
                            </label>
                            <input
                                id="reg-email"
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
                                htmlFor="reg-password"
                                className="block text-xs font-semibold tracking-wide text-slate-600"
                            >
                                PASSWORD
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                                placeholder="Min. 6 characters"
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 bg-white border border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="confirm"
                                className="block text-xs font-semibold tracking-wide text-slate-600"
                            >
                                CONFIRM PASSWORD
                            </label>
                            <input
                                id="confirm"
                                type="password"
                                autoComplete="new-password"
                                value={form.confirm}
                                onChange={(e) =>
                                    setForm({ ...form, confirm: e.target.value })
                                }
                                placeholder="Repeat password"
                                className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 bg-white text-slate-900 focus:ring-2 ${form.confirm && form.confirm !== form.password ? 'border border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border border-blue-200 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer w-full rounded-2xl py-3.5 text-base font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 bg-linear-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account →"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 border-t border-blue-100" />

                    {/* Login link */}
                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-blue-600 transition-opacity hover:opacity-80"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
