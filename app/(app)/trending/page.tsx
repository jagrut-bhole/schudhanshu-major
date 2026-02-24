"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    fetchTrendingTopics,
    TrendingTopic,
} from "@/apiRequests/trendingRequest";
import { toast } from "sonner";

export default function TrendingPage() {
    const router = useRouter();
    const [topics, setTopics] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTopics = async () => {
            setLoading(true);
            setError(null);

            const response = await fetchTrendingTopics();

            if (response.success && response.data) {
                setTopics(response.data);
            } else {
                setError(response.message);
                toast.error(response.message);
            }

            setLoading(false);
        };

        loadTopics();
    }, []);

    const handleSelect = (topic: TrendingTopic) => {
        sessionStorage.setItem("selectedTopic", JSON.stringify(topic));
        router.push("/topic");
    };

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: "#EFF6FF" }}
        >
            {/* ── Page title ── */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8 pb-2 flex items-center justify-between">
                <div>
                    <h1
                        className="text-xl sm:text-2xl font-bold tracking-tight"
                        // style={{ color: "#2563EB" }}
                    >
                        🔥 Trending in India
                    </h1>
                    <p
                        className="text-xs sm:text-sm mt-0.5"
                        // style={{ color: "#4B5563" }}
                    >
                        Real-time trending topics — pick one to create content
                    </p>
                </div>
            </div>

            <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
                {/* ── Loading state ── */}
                {loading && (
                    <div className="flex flex-col items-center gap-6 py-16">
                        <div
                            className="h-12 w-12 animate-spin rounded-full border-4"
                            style={{
                                borderColor: "#60A5FA",
                                borderTopColor: "#1D4ED8",
                            }}
                        />
                        <p
                            className="font-medium text-sm"
                            style={{ color: "#2563EB" }}
                        >
                            Fetching trending topics...
                        </p>

                        {/* Skeleton grid */}
                        <div className="w-full grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl bg-white p-0 overflow-hidden animate-pulse"
                                    style={{
                                        boxShadow:
                                            "0 4px 20px rgba(37, 99, 235, 0.06)",
                                    }}
                                >
                                    <div
                                        className="h-40 w-full"
                                        style={{
                                            backgroundColor: "#DBEAFE",
                                        }}
                                    />
                                    <div className="p-5 space-y-3">
                                        <div
                                            className="h-4 w-20 rounded-full"
                                            style={{
                                                backgroundColor: "#DBEAFE",
                                            }}
                                        />
                                        <div
                                            className="h-5 w-3/4 rounded-md"
                                            style={{
                                                backgroundColor: "#DBEAFE",
                                            }}
                                        />
                                        <div className="space-y-2">
                                            <div
                                                className="h-3 w-full rounded-md"
                                                style={{
                                                    backgroundColor: "#DBEAFE",
                                                }}
                                            />
                                            <div
                                                className="h-3 w-5/6 rounded-md"
                                                style={{
                                                    backgroundColor: "#DBEAFE",
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="h-9 w-32 rounded-lg mt-2"
                                            style={{
                                                backgroundColor: "#DBEAFE",
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Error state ── */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-full mb-5"
                            style={{
                                backgroundColor: "rgba(37, 99, 235, 0.10)",
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#1D4ED8"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2
                            className="text-xl font-semibold mb-2"
                            style={{ color: "#1D4ED8" }}
                        >
                            Something went wrong
                        </h2>
                        <p
                            className="text-sm max-w-md mb-6"
                            style={{ color: "#4B5563" }}
                        >
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="cursor-pointer rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.97]"
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                boxShadow:
                                    "0 4px 16px rgba(37, 99, 235, 0.25)",
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* ── Topic cards ── */}
                {!loading && !error && topics.length > 0 && (
                    <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {topics.map((topic, index) => (
                            <div
                                key={index}
                                className="group relative rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1"
                                style={{
                                    boxShadow:
                                        "0 4px 20px rgba(37, 99, 235, 0.08)",
                                }}
                                onMouseEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLDivElement
                                    ).style.boxShadow =
                                        "0 8px 32px rgba(37, 99, 235, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLDivElement
                                    ).style.boxShadow =
                                        "0 4px 20px rgba(37, 99, 235, 0.08)";
                                }}
                            >
                                {/* Topic image */}
                                <div className="relative w-full h-40 sm:h-44 overflow-hidden">
                                    {topic.picture ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={topic.picture}
                                            alt={topic.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-4xl"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
                                            }}
                                        >
                                            🔥
                                        </div>
                                    )}

                                    {/* Traffic badge */}
                                    {topic.traffic && (
                                        <span
                                            className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                                boxShadow:
                                                    "0 2px 8px rgba(37, 99, 235, 0.25)",
                                            }}
                                        >
                                            {topic.traffic} searches
                                        </span>
                                    )}
                                </div>

                                {/* Card body */}
                                <div className="p-4 sm:p-5 flex flex-col gap-2">
                                    <h3
                                        className="text-[15px] sm:text-base font-bold leading-snug"
                                        style={{ color: "#1A1A2E" }}
                                    >
                                        {topic.newsTitle}
                                    </h3>

                                    <p
                                        className="text-[13px] sm:text-sm leading-relaxed line-clamp-3"
                                        style={{ color: "#374151" }}
                                    >
                                        {topic.description}
                                    </p>

                                    {/* Image credit */}
                                    {topic.pictureSource && (
                                        <p
                                            className="text-[11px] italic"
                                            style={{ color: "#4B5563" }}
                                        >
                                            📷 {topic.pictureSource}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => handleSelect(topic)}
                                        className="cursor-pointer mt-2 inline-flex items-center gap-1.5 self-start rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.97]"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                            boxShadow:
                                                "0 3px 12px rgba(37, 99, 235, 0.22)",
                                        }}
                                    >
                                        Select Topic
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
