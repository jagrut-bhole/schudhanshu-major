"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchHistory, deleteGeneration } from "@/apiRequests/generationRequest";
import { toast } from "sonner";

type FilterType = "ALL" | "SCRIPT" | "IMAGE" | "BLOG";

interface GenerationItem {
    id: string;
    type: "SCRIPT" | "IMAGE" | "BLOG";
    content: string | null;
    imageData: string | null;
    imageMime: string | null;
    createdAt: string;
    topic: {
        title: string;
        imageUrl: string | null;
    };
}

/* Relative time helper */
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    return "just now";
}

/* Type badge colors */
const typeBadge: Record<string, { bg: string; text: string; label: string }> = {
    SCRIPT: { bg: "rgba(37, 99, 235, 0.12)", text: "#1E40AF", label: "🎬 Script" },
    IMAGE: { bg: "rgba(37, 99, 235, 0.10)", text: "#1E40AF", label: "🖼️ Image" },
    BLOG: { bg: "rgba(37, 99, 235, 0.12)", text: "#1E40AF", label: "📝 Blog" },
};

export default function HistoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<GenerationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("ALL");
    const [viewModal, setViewModal] = useState<GenerationItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await fetchHistory();
            if (res.success && res.data) {
                setItems(res.data);
            } else {
                toast.error(res.message || "Failed to load history");
            }
            setLoading(false);
        })();
    }, []);

    const filtered = filter === "ALL" ? items : items.filter((i) => i.type === filter);

    const handleDelete = useCallback(async (id: string) => {
        const res = await deleteGeneration(id);
        if (res.success) {
            setItems((prev) => prev.filter((i) => i.id !== id));
            toast.success("Deleted successfully");
        } else {
            toast.error(res.message);
        }
        setDeleteConfirm(null);
    }, []);

    const handleCopy = useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    }, []);

    const handleDownload = useCallback(async (url: string, title: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${title.replace(/\s+/g, "_")}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            toast.success("Image downloaded!");
        } catch {
            toast.error("Failed to download");
        }
    }, []);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#EFF6FF" }}>
            {/* ── Page title ── */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8 pb-2 flex items-center justify-between">
                <div>
                    <h1
                        className="text-xl sm:text-2xl font-bold tracking-tight"
                        // style={{ color: "#1D4ED8" }}
                    >
                        📚 Your Content History
                    </h1>
                    <p
                        className="text-xs sm:text-sm mt-0.5"
                        // style={{ color: "#4B5563" }}
                    >
                        All your generated scripts, images and blog posts
                    </p>
                </div>
                <button
                    onClick={() => router.push("/trending")}
                    className="cursor-pointer hidden sm:inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                    style={{
                        background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                        boxShadow: "0 3px 12px rgba(37,99,235,0.22)",
                    }}
                >
                    🔥 Browse Topics
                </button>
            </div>

            <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
                {/* ── Filter tabs ── */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(["ALL", "SCRIPT", "IMAGE", "BLOG"] as FilterType[]).map((f) => {
                        const labels: Record<FilterType, string> = {
                            ALL: "All",
                            SCRIPT: "🎬 Scripts",
                            IMAGE: "🖼️ Images",
                            BLOG: "📝 Blogs",
                        };
                        const isActive = filter === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                                style={{
                                    background: isActive
                                        ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                                        : "rgba(37, 99, 235, 0.08)",
                                    color: isActive ? "#fff" : "#4B5563",
                                    boxShadow: isActive
                                        ? "0 3px 12px rgba(37, 99, 235, 0.22)"
                                        : "none",
                                }}
                            >
                                {labels[f]}
                            </button>
                        );
                    })}
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex flex-col items-center gap-6 py-16">
                        <div
                            className="h-12 w-12 animate-spin rounded-full border-4"
                            style={{ borderColor: "#60A5FA", borderTopColor: "#1D4ED8" }}
                        />
                        <p className="font-medium text-sm" style={{ color: "#2563EB" }}>
                            Loading your history...
                        </p>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && filtered.length === 0 && (
                    <div
                        className="rounded-2xl bg-white p-10 sm:p-16 text-center"
                        style={{
                            boxShadow: "0 4px 24px rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                        }}
                    >
                        <div className="text-5xl mb-5">✨</div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "#2563EB" }}>
                            No content yet!
                        </h3>
                        <p className="text-sm mb-6" style={{ color: "#4B5563" }}>
                            Go pick a trending topic and create something amazing.
                        </p>
                        <button
                            onClick={() => router.push("/trending")}
                            className="cursor-pointer rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                            style={{
                                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.25)",
                            }}
                        >
                            Browse Trending Topics →
                        </button>
                    </div>
                )}

                {/* ── Cards grid ── */}
                {!loading && filtered.length > 0 && (
                    <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((item) => {
                            const badge = typeBadge[item.type];
                            return (
                                <div
                                    key={item.id}
                                    className="group rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1"
                                    style={{
                                        boxShadow: "0 4px 20px rgba(37, 99, 235, 0.08)",
                                    }}
                                >
                                    {/* Topic thumbnail */}
                                    <div className="relative w-full h-32 overflow-hidden">
                                        {item.type === "IMAGE" && item.imageData ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.imageData}
                                                alt={item.topic.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : item.topic.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.topic.imageUrl}
                                                alt={item.topic.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center text-3xl"
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
                                                }}
                                            >
                                                🔥
                                            </div>
                                        )}

                                        {/* Type badge */}
                                        <span
                                            className="absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                            style={{
                                                backgroundColor: badge.bg,
                                                color: badge.text,
                                            }}
                                        >
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4 sm:p-5 flex flex-col gap-2">
                                        <h3
                                            className="text-sm sm:text-[15px] font-bold leading-snug line-clamp-1"
                                            style={{ color: "#1A1A2E" }}
                                        >
                                            {item.topic.title}
                                        </h3>

                                        <p
                                            className="text-[12px] italic"
                                            style={{ color: "#4B5563" }}
                                        >
                                            {timeAgo(item.createdAt)}
                                        </p>

                                        {/* Preview */}
                                        {item.type === "SCRIPT" && item.content && (
                                            <p
                                                className="text-xs leading-relaxed line-clamp-2"
                                                style={{ color: "#374151" }}
                                            >
                                                {item.content.slice(0, 100)}...
                                            </p>
                                        )}
                                        {item.type === "BLOG" && item.content && (() => {
                                            try {
                                                const parsed = JSON.parse(item.content);
                                                return (
                                                    <div>
                                                        <p
                                                            className="text-xs font-semibold line-clamp-1 mb-0.5"
                                                            style={{ color: "#1E40AF" }}
                                                        >
                                                            {parsed.title || "Blog Post"}
                                                        </p>
                                                        <p
                                                            className="text-xs leading-relaxed line-clamp-1"
                                                            style={{ color: "#374151" }}
                                                        >
                                                            {parsed.metaDescription || ""}
                                                        </p>
                                                    </div>
                                                );
                                            } catch {
                                                return (
                                                    <p
                                                        className="text-xs leading-relaxed line-clamp-2"
                                                        style={{ color: "#374151" }}
                                                    >
                                                        {item.content.slice(0, 100)}...
                                                    </p>
                                                );
                                            }
                                        })()}

                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    if (item.type === "BLOG") {
                                                        window.open(`/blog-preview/${item.id}`, "_blank");
                                                    } else {
                                                        setViewModal(item);
                                                    }
                                                }}
                                                className="cursor-pointer flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                                                style={{
                                                    backgroundColor: "rgba(37, 99, 235, 0.08)",
                                                    color: "#1E40AF",
                                                }}
                                            >
                                                {item.type === "BLOG" ? "👁️ Preview" : "👁️ View"}
                                            </button>

                                            {item.type === "IMAGE" && item.imageData && (
                                                <button
                                                    onClick={() =>
                                                        handleDownload(
                                                            item.imageData!,
                                                            item.topic.title
                                                        )
                                                    }
                                                    className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(37, 99, 235, 0.08)",
                                                        color: "#1E40AF",
                                                    }}
                                                >
                                                    ⬇️
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                                                style={{
                                                    backgroundColor: "rgba(37, 99, 235, 0.07)",
                                                    color: "#1D4ED8",
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ═══ DELETE CONFIRM DIALOG ═══ */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.70)" }}
                >
                    <div
                        className="rounded-2xl bg-white p-6 sm:p-8 max-w-sm w-full text-center"
                        style={{ boxShadow: "0 8px 40px rgba(37, 99, 235, 0.15)" }}
                    >
                        <div className="text-3xl mb-3">🗑️</div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "#1D4ED8" }}>
                            Delete this generation?
                        </h3>
                        <p className="text-sm mb-5" style={{ color: "#4B5563" }}>
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="cursor-pointer flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: "rgba(37, 99, 235, 0.08)",
                                    color: "#4B5563",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="cursor-pointer flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                                style={{
                                    background: "linear-gradient(135deg, #EF4444, #DC2626)",
                                    boxShadow: "0 3px 12px rgba(37, 99, 235, 0.25)",
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ VIEW MODAL ═══ */}
            {viewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.75)" }}
                    onClick={() => setViewModal(null)}
                >
                    <div
                        className="relative rounded-2xl bg-white w-full max-w-3xl my-8"
                        style={{ boxShadow: "0 8px 40px rgba(37, 99, 235, 0.15)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div
                            className="sticky top-0 z-10 rounded-t-2xl px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-3"
                            style={{
                                background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                                borderBottom: "1px solid rgba(37, 99, 235, 0.15)",
                            }}
                        >
                            <div>
                                <h3
                                    className="text-base sm:text-lg font-bold"
                                    style={{ color: "#1E40AF" }}
                                >
                                    {typeBadge[viewModal.type]?.label} — {viewModal.topic.title}
                                </h3>
                                <p
                                    className="text-xs sm:text-sm mt-0.5"
                                    style={{ color: "#4B5563" }}
                                >
                                    Created {timeAgo(viewModal.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewModal(null)}
                                className="cursor-pointer shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: "rgba(37, 99, 235, 0.10)",
                                    color: "#1D4ED8",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-5 sm:p-7">
                            {/* Script view */}
                            {viewModal.type === "SCRIPT" && viewModal.content && (
                                <div>
                                    <div className="flex justify-end mb-3">
                                        <button
                                            onClick={() => handleCopy(viewModal.content!)}
                                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                                boxShadow:
                                                    "0 3px 12px rgba(37,99,235,0.22)",
                                            }}
                                        >
                                            📋 Copy Script
                                        </button>
                                    </div>
                                    <div
                                        className="rounded-xl p-4 sm:p-5"
                                        style={{
                                            backgroundColor: "#EFF6FF",
                                            border: "1px solid rgba(37, 99, 235, 0.12)",
                                        }}
                                    >
                                        <p
                                            className="text-sm leading-relaxed whitespace-pre-line"
                                            style={{ color: "#1F2937" }}
                                        >
                                            {viewModal.content}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Image view */}
                            {viewModal.type === "IMAGE" && viewModal.imageData && (
                                <div>
                                    <div className="flex justify-end mb-3">
                                        <button
                                            onClick={() =>
                                                handleDownload(
                                                    viewModal.imageData!,
                                                    viewModal.topic.title
                                                )
                                            }
                                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                                boxShadow:
                                                    "0 3px 12px rgba(37,99,235,0.22)",
                                            }}
                                        >
                                            ⬇️ Download Image
                                        </button>
                                    </div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={viewModal.imageData}
                                        alt={viewModal.topic.title}
                                        className="w-full rounded-xl object-contain"
                                        style={{
                                            border: "1px solid rgba(37, 99, 235, 0.12)",
                                        }}
                                    />
                                </div>
                            )}

                            {/* Blog view */}
                            {viewModal.type === "BLOG" && viewModal.content && (
                                <div>
                                    <div className="flex justify-end mb-3">
                                        <button
                                            onClick={() => handleCopy(viewModal.content!)}
                                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                                boxShadow:
                                                    "0 3px 12px rgba(37,99,235,0.22)",
                                            }}
                                        >
                                            📋 Copy Blog
                                        </button>
                                    </div>
                                    <div
                                        className="rounded-xl p-4 sm:p-5"
                                        style={{
                                            backgroundColor: "#EFF6FF",
                                            border: "1px solid rgba(37, 99, 235, 0.12)",
                                        }}
                                    >
                                        <p
                                            className="text-sm leading-relaxed whitespace-pre-line"
                                            style={{ color: "#1F2937" }}
                                        >
                                            {viewModal.content}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
