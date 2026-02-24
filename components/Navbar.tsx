"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const navLinks = [
    { href: "/trending", label: "🔥 Trending", auth: false },
    { href: "/history", label: "📚 History", auth: true },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav
            className="sticky top-0 z-30 border-b backdrop-blur-md"
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: "rgba(59, 130, 246, 0.25)",
            }}
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
                {/* Logo / brand */}
                <button
                    onClick={() => router.push("/trending")}
                    className="cursor-pointer text-lg sm:text-xl font-bold tracking-tight flex items-center gap-1.5"
                    style={{ color: "#2563EB" }}
                >
                    <span className="hidden sm:inline">TrendForge</span>
                </button>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-1">
                    {navLinks
                        .filter((l) => !l.auth || session)
                        .map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => router.push(link.href)}
                                    className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                                    style={{
                                        backgroundColor: isActive
                                            ? "rgba(59, 130, 246, 0.12)"
                                            : "transparent",
                                        color: isActive
                                            ? "#2563EB"
                                            : "#475569",
                                        borderBottom: isActive
                                            ? "2px solid #2563EB"
                                            : "2px solid transparent",
                                    }}
                                >
                                    {link.label}
                                </button>
                            );
                        })}
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2">
                    {session ? (
                        <>
                            <span
                                className="hidden md:inline text-xs font-medium"
                                style={{ color: "#475569" }}
                            >
                                {session.user?.name || session.user?.email}
                            </span>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                                    color: "#2563EB",
                                }}
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            className="cursor-pointer rounded-xl px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                            style={{
                                background:
                                    "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                boxShadow:
                                    "0 3px 10px rgba(37, 99, 235, 0.25)",
                            }}
                        >
                            Sign in
                        </button>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="cursor-pointer sm:hidden rounded-lg p-1.5 transition-all duration-200 hover:opacity-80"
                        style={{
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                            color: "#2563EB",
                        }}
                        aria-label="Toggle menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            {menuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div
                    className="sm:hidden border-t px-4 py-3 space-y-1"
                    style={{ borderColor: "rgba(59, 130, 246, 0.2)" }}
                >
                    {navLinks
                        .filter((l) => !l.auth || session)
                        .map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => {
                                        router.push(link.href);
                                        setMenuOpen(false);
                                    }}
                                    className="cursor-pointer w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                                    style={{
                                        backgroundColor: isActive
                                            ? "rgba(59, 130, 246, 0.12)"
                                            : "transparent",
                                        color: isActive
                                            ? "#2563EB"
                                            : "#475569",
                                    }}
                                >
                                    {link.label}
                                </button>
                            );
                        })}
                </div>
            )}
        </nav>
    );
}
