"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingTopic } from "@/apiRequests/trendingRequest";
import {
    saveTopic,
    generateScriptNew,
    generateImage,
    generateBlog,
    saveGeneration,
} from "@/apiRequests/generationRequest";
import { toast } from "sonner";

type ActiveOption = "script" | "image" | "blog" | null;

interface ScriptData {
    script: string;
    wordCount: number;
    speakingMinutes: number;
}

interface ImageData {
    imageUrl: string;
    imageMime: string;
}

interface BlogData {
    generationId: string;
    title: string;
    metaDescription: string;
    readTime: string;
    body: string;
    htmlBody: string;
    imageData: string;
    imageMime: string;
}

/* Parse the Groq script into displayable sections */
function parseScriptSections(
    script: string
): { emoji: string; title: string; content: string }[] {
    const parts = script.split(/(?=🎬|📖|🔍|💡|📢)/);
    const sections: { emoji: string; title: string; content: string }[] = [];

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const firstLine = trimmed.split("\n")[0];
        const emoji = firstLine.match(/^(🎬|📖|🔍|💡|📢)/)?.[1] || "📄";
        const title = firstLine.replace(/^(🎬|📖|🔍|💡|📢)\s*/, "").trim();
        const content = trimmed.split("\n").slice(1).join("\n").trim();

        if (title || content) {
            sections.push({ emoji, title, content });
        }
    }

    return sections;
}

export default function TopicPage() {
    const router = useRouter();
    const resultRef = useRef<HTMLDivElement>(null);

    const [topic, setTopic] = useState<TrendingTopic | null>(null);
    const [activeOption, setActiveOption] = useState<ActiveOption>(null);
    const [loading, setLoading] = useState(false);
    const [scriptData, setScriptData] = useState<ScriptData | null>(null);
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [blogData, setBlogData] = useState<BlogData | null>(null);
    const [blogLoadingStep, setBlogLoadingStep] = useState(0);
    const [copyMenuOpen, setCopyMenuOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("selectedTopic");
        if (stored) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTopic(JSON.parse(stored));
        } else {
            router.push("/trending");
        }
    }, [router]);

    /* Smooth scroll to result area */
    useEffect(() => {
        if (
            (scriptData ||
                imageData ||
                blogData ||
                loading ||
                error) &&
            resultRef.current
        ) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 200);
        }
    }, [scriptData, imageData, blogData, loading, error]);

    const handleBack = () => {
        sessionStorage.removeItem("selectedTopic");
        router.push("/trending");
    };

    const handleCopy = useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    }, []);

    /* ── Helper: persist topic to DB ── */
    const persistTopic = async (): Promise<string | null> => {
        if (!topic) return null;

        const topicRes = await saveTopic({
            title: topic.title,
            description: topic.description,
            imageUrl: topic.picture || undefined,
            traffic: topic.traffic || undefined,
            source: topic.pictureSource || undefined,
        });

        if (topicRes.success && topicRes.data?.topicId) {
            return topicRes.data.topicId;
        }
        return null;
    };

    /* ── Generate Script ── */
    const handleGenerateScript = async () => {
        if (!topic) return;
        setActiveOption("script");
        setScriptData(null);
        setImageData(null);
        setBlogData(null);
        setError(null);
        setLoading(true);

        const response = await generateScriptNew(
            topic.title,
            topic.description
        );

        if (response.success && response.data) {
            setScriptData(response.data);

            /* Save to DB in background */
            const topicId = await persistTopic();
            if (topicId) {
                const saveRes = await saveGeneration({
                    type: "SCRIPT",
                    content: response.data.script,
                    topicId,
                });
                if (saveRes.success) {
                    toast.success("✅ Script saved to your history!");
                }
            }
        } else {
            setError(response.message);
            toast.error(response.message);
        }

        setLoading(false);
    };

    /* ── Generate Image ── */
    const handleGenerateImage = async () => {
        if (!topic) return;
        setActiveOption("image");
        setScriptData(null);
        setImageData(null);
        setBlogData(null);
        setError(null);
        setLoading(true);

        const response = await generateImage(
            topic.title,
            topic.description
        );

        if (response.success && response.data) {
            setImageData({
                imageUrl: response.data.imageUrl,
                imageMime: response.data.imageMime,
            });

            /* Save to DB in background */
            const topicId = await persistTopic();
            if (topicId) {
                const saveRes = await saveGeneration({
                    type: "IMAGE",
                    imageData: response.data.imageUrl,
                    imageMime: response.data.imageMime,
                    topicId,
                });
                if (saveRes.success) {
                    toast.success("✅ Image saved to your history!");
                }
            }
        } else {
            setError(response.message);
            toast.error(response.message);
        }

        setLoading(false);
    };

    /* ── Download image ── */
    const handleDownload = async () => {
        if (!imageData) return;
        try {
            const res = await fetch(imageData.imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${topic?.title?.replace(/\s+/g, "_") || "thumbnail"}.${imageData.imageMime?.split("/")?.[1] || "png"}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Image downloaded!");
        } catch {
            toast.error("Failed to download image");
        }
    };

    /* ── Generate Blog ── */
    const handleGenerateBlog = async () => {
        if (!topic) return;
        setActiveOption("blog");
        setScriptData(null);
        setImageData(null);
        setBlogData(null);
        setError(null);
        setLoading(true);
        setBlogLoadingStep(0);
        setCopyMenuOpen(false);

        /* Animated progress steps */
        const stepTimers = [
            setTimeout(() => setBlogLoadingStep(1), 500),
            setTimeout(() => setBlogLoadingStep(2), 2000),
            setTimeout(() => setBlogLoadingStep(3), 4000),
            setTimeout(() => setBlogLoadingStep(4), 6000),
        ];

        const response = await generateBlog(
            topic.title,
            topic.description
        );

        stepTimers.forEach(clearTimeout);

        if (response.success && response.data) {
            setBlogData(response.data);
            toast.success("✅ Blog saved to your history!");
        } else {
            setError(response.message);
            toast.error(response.message);
        }

        setLoading(false);
        setBlogLoadingStep(0);
    };

    /* ── Download blog featured image (base64) ── */
    const handleDownloadBlogImage = () => {
        if (!blogData?.imageData) return;
        const link = document.createElement("a");
        link.href = `data:${blogData.imageMime || "image/png"};base64,${blogData.imageData}`;
        link.download = `${topic?.title?.replace(/\s+/g, "-") || "blog"}-featured-image.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
    };

    /* Not loaded yet */
    if (!topic) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: "#EFF6FF" }}
            >
                <div
                    className="h-12 w-12 animate-spin rounded-full border-4"
                    style={{
                        borderColor: "#60A5FA",
                        borderTopColor: "#1D4ED8",
                    }}
                />
            </div>
        );
    }

    const scriptSections = scriptData
        ? parseScriptSections(scriptData.script)
        : [];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#EFF6FF" }}>
            {/* ═══ HERO SECTION ═══ */}
            <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
                {topic.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={topic.picture}
                        alt={topic.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{
                            background:
                                "linear-gradient(135deg, #60A5FA, #2563EB, #1D4ED8)",
                        }}
                    />
                )}

                {/* Warm gradient overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(20,8,0,0.85) 0%, rgba(20,8,0,0.4) 40%, transparent 100%)",
                    }}
                />

                {/* Back button */}
                <button
                    onClick={handleBack}
                    className="cursor-pointer absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:opacity-80 active:scale-95"
                    style={{ backgroundColor: "rgba(37,99,235,0.35)" }}
                >
                    ← Back to Topics
                </button>

                {/* Hero text */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-10">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                        {topic.newsTitle || topic.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {topic.traffic && (
                            <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                }}
                            >
                                🔥 {topic.traffic} searches
                            </span>
                        )}
                        {topic.pictureSource && (
                            <span className="text-[12px] text-white/70 italic">
                                📷 {topic.pictureSource}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ DESCRIPTION ═══ */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5">
                <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "#374151" }}
                >
                    {topic.description}
                </p>
            </div>

            {/* ═══ WHAT DO YOU WANT TO CREATE? ═══ */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-6">
                <h2
                    className="text-lg sm:text-xl font-bold mb-5"
                    style={{ color: "#1D4ED8" }}
                >
                    ✨ What do you want to create?
                </h2>

                <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-3">
                    {/* Card 1 — Script */}
                    <div
                        className="relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        style={{
                            background:
                                "linear-gradient(145deg, #EFF6FF, #DBEAFE)",
                            boxShadow:
                                "0 4px 20px rgba(37, 99, 235, 0.12)",
                        }}
                    >
                        <div className="text-3xl sm:text-4xl mb-3">🎬</div>
                        <h3
                            className="text-base sm:text-lg font-bold mb-1"
                            style={{ color: "#1E40AF" }}
                        >
                            Video Script
                        </h3>
                        <p
                            className="text-xs sm:text-sm mb-4 leading-relaxed"
                            style={{ color: "#4B5563" }}
                        >
                            Get a full YouTube/Reel script for this topic
                        </p>
                        <button
                            onClick={handleGenerateScript}
                            disabled={loading && activeOption === "script"}
                            className="cursor-pointer w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background:
                                    "linear-gradient(135deg, #3B82F6, #2563EB)",
                                boxShadow:
                                    "0 3px 12px rgba(255, 140, 0, 0.3)",
                            }}
                        >
                            {loading && activeOption === "script"
                                ? "Generating..."
                                : "Generate Script"}
                        </button>
                    </div>

                    {/* Card 2 — Image */}
                    <div
                        className="relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        style={{
                            background:
                                "linear-gradient(145deg, #F0F9FF, #BAE6FD)",
                            boxShadow:
                                "0 4px 20px rgba(37, 99, 235, 0.10)",
                        }}
                    >
                        <div className="text-3xl sm:text-4xl mb-3">🖼️</div>
                        <h3
                            className="text-base sm:text-lg font-bold mb-1"
                            style={{ color: "#1E40AF" }}
                        >
                            Thumbnail Image
                        </h3>
                        <p
                            className="text-xs sm:text-sm mb-4 leading-relaxed"
                            style={{ color: "#4B5563" }}
                        >
                            AI-generated thumbnail for your content
                        </p>
                        <button
                            onClick={handleGenerateImage}
                            disabled={loading && activeOption === "image"}
                            className="cursor-pointer w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                boxShadow:
                                    "0 3px 12px rgba(37, 99, 235, 0.25)",
                            }}
                        >
                            {loading && activeOption === "image"
                                ? "Generating..."
                                : "Generate Image"}
                        </button>
                    </div>

                    {/* Card 3 — Blog */}
                    <div
                        className="relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        style={{
                            background:
                                "linear-gradient(145deg, #EFF6FF, #BFDBFE)",
                            boxShadow:
                                "0 4px 20px rgba(37, 99, 235, 0.12)",
                        }}
                    >
                        <div className="text-3xl sm:text-4xl mb-3">📝</div>
                        <h3
                            className="text-base sm:text-lg font-bold mb-1"
                            style={{ color: "#1E40AF" }}
                        >
                            Blog Post
                        </h3>
                        <p
                            className="text-xs sm:text-sm mb-4 leading-relaxed"
                            style={{ color: "#4B5563" }}
                        >
                            Full blog with title, description and images
                        </p>
                        <button
                            onClick={handleGenerateBlog}
                            disabled={loading && activeOption === "blog"}
                            className="cursor-pointer w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background:
                                    "linear-gradient(135deg, #60A5FA, #2563EB)",
                                boxShadow:
                                    "0 3px 12px rgba(255, 140, 0, 0.3)",
                            }}
                        >
                            {loading && activeOption === "blog"
                                ? "Generating..."
                                : "Generate Blog"}
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══ RESULT AREA ═══ */}
            <div
                ref={resultRef}
                className="mx-auto max-w-5xl px-4 sm:px-6 pb-12"
            >
                {/* Loading state */}
                {loading && (
                    <div
                        className="rounded-2xl bg-white p-8 sm:p-12 flex flex-col items-center gap-4"
                        style={{
                            boxShadow:
                                "0 4px 24px rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                        }}
                    >
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
                            {activeOption === "script"
                                ? "Generating your script..."
                                : activeOption === "image"
                                    ? "Generating your thumbnail..."
                                    : activeOption === "blog"
                                        ? "\u270d\ufe0f Writing your blog post..."
                                        : "Processing..."}
                        </p>

                        {/* Blog progress steps */}
                        {activeOption === "blog" && (
                            <div className="w-full max-w-xs space-y-2 mt-2">
                                {[
                                    { step: 1, label: "\ud83d\udce1 Fetching topic context..." },
                                    { step: 2, label: "\u270d\ufe0f Writing blog content..." },
                                    { step: 3, label: "\ud83c\udfa8 Generating featured image..." },
                                    { step: 4, label: "\ud83d\udcbe Saving to your history..." },
                                ].map(({ step, label }) => (
                                    <div
                                        key={step}
                                        className="flex items-center gap-2 text-xs transition-all duration-500"
                                        style={{
                                            opacity: blogLoadingStep >= step ? 1 : 0.3,
                                            color:
                                                blogLoadingStep >= step
                                                    ? "#1E40AF"
                                                    : "#4B5563",
                                        }}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full shrink-0"
                                            style={{
                                                backgroundColor:
                                                    blogLoadingStep >= step
                                                        ? "#1D4ED8"
                                                        : "#DDD",
                                            }}
                                        />
                                        {label}
                                    </div>
                                ))}
                                <p
                                    className="text-[11px] mt-2 text-center"
                                    style={{ color: "#4B5563" }}
                                >
                                    This takes about 10\u201315 seconds
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div
                        className="rounded-2xl bg-white p-6 sm:p-8 text-center"
                        style={{
                            boxShadow:
                                "0 4px 24px rgba(37, 99, 235, 0.10)",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                        }}
                    >
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4"
                            style={{
                                backgroundColor: "rgba(37, 99, 235, 0.07)",
                            }}
                        >
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3
                            className="text-lg font-bold mb-2"
                            style={{ color: "#1D4ED8" }}
                        >
                            Generation Failed
                        </h3>
                        <p
                            className="text-sm mb-4"
                            style={{ color: "#4B5563" }}
                        >
                            {error}
                        </p>
                        <button
                            onClick={
                                activeOption === "script"
                                    ? handleGenerateScript
                                    : activeOption === "image"
                                        ? handleGenerateImage
                                        : activeOption === "blog"
                                            ? handleGenerateBlog
                                            : handleGenerateScript
                            }
                            className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563EB, #1D4ED8)",
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Script result ── */}
                {scriptData && !loading && activeOption === "script" && (
                    <div
                        className="rounded-2xl bg-white overflow-hidden"
                        style={{
                            boxShadow:
                                "0 4px 24px rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                        }}
                    >
                        {/* Script header */}
                        <div
                            className="px-5 sm:px-7 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            style={{
                                background:
                                    "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                                borderBottom:
                                    "1px solid rgba(37, 99, 235, 0.15)",
                            }}
                        >
                            <div>
                                <h3
                                    className="text-base sm:text-lg font-bold"
                                    style={{ color: "#1E40AF" }}
                                >
                                    📄 Script for: {topic.title}
                                </h3>
                                <p
                                    className="text-xs sm:text-sm mt-0.5"
                                    style={{ color: "#4B5563" }}
                                >
                                    ~{scriptData.wordCount} words ·{" "}
                                    ~{scriptData.speakingMinutes} min video
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    handleCopy(scriptData.script)
                                }
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] shrink-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                    boxShadow:
                                        "0 3px 12px rgba(37, 99, 235, 0.22)",
                                }}
                            >
                                📋 Copy Full Script
                            </button>
                        </div>

                        {/* Script sections */}
                        <div className="p-5 sm:p-7 space-y-5">
                            {scriptSections.map((section, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl p-4 sm:p-5 relative group"
                                    style={{
                                        backgroundColor: "#EFF6FF",
                                        border: "1px solid rgba(37, 99, 235, 0.12)",
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h4
                                            className="text-sm sm:text-base font-bold"
                                            style={{ color: "#2563EB" }}
                                        >
                                            {section.emoji} {section.title}
                                        </h4>
                                        <button
                                            onClick={() =>
                                                handleCopy(
                                                    `${section.emoji} ${section.title}\n${section.content}`
                                                )
                                            }
                                            className="cursor-pointer opacity-0 group-hover:opacity-100 shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 hover:opacity-80"
                                            style={{
                                                color: "#2563EB",
                                                backgroundColor:
                                                    "rgba(37, 99, 235, 0.08)",
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p
                                        className="text-sm leading-relaxed whitespace-pre-line"
                                        style={{ color: "#1F2937" }}
                                    >
                                        {section.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Image result ── */}
                {imageData && !loading && activeOption === "image" && (
                    <div
                        className="rounded-2xl bg-white overflow-hidden"
                        style={{
                            boxShadow:
                                "0 4px 24px rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                        }}
                    >
                        <div
                            className="px-5 sm:px-7 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            style={{
                                background:
                                    "linear-gradient(135deg, #F0F9FF, #BAE6FD)",
                                borderBottom:
                                    "1px solid rgba(37, 99, 235, 0.15)",
                            }}
                        >
                            <div>
                                <h3
                                    className="text-base sm:text-lg font-bold"
                                    style={{ color: "#1E40AF" }}
                                >
                                    🖼️ Thumbnail for: {topic.title}
                                </h3>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] shrink-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                    boxShadow:
                                        "0 3px 12px rgba(37, 99, 235, 0.22)",
                                }}
                            >
                                ⬇️ Download Image
                            </button>
                        </div>

                        <div className="p-5 sm:p-7">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageData.imageUrl}
                                alt={`Thumbnail for ${topic.title}`}
                                className="w-full rounded-xl object-contain max-h-[500px]"
                                style={{
                                    border: "1px solid rgba(37, 99, 235, 0.12)",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Blog result ── */}
                {blogData && !loading && activeOption === "blog" && (
                    <div
                        className="rounded-2xl bg-white overflow-hidden"
                        style={{
                            boxShadow:
                                "0 4px 24px rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                        }}
                    >
                        {/* Blog header */}
                        <div
                            className="px-5 sm:px-7 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            style={{
                                background:
                                    "linear-gradient(135deg, #EFF6FF, #BFDBFE)",
                                borderBottom:
                                    "1px solid rgba(37, 99, 235, 0.15)",
                            }}
                        >
                            <div>
                                <h3
                                    className="text-base sm:text-lg font-bold"
                                    style={{ color: "#1E40AF" }}
                                >
                                    📝 Blog Post Generated
                                </h3>
                            </div>
                        </div>

                        <div className="p-5 sm:p-7 space-y-5">
                            {/* Featured image */}
                            {blogData.imageData && (
                                <div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`data:${blogData.imageMime || "image/png"};base64,${blogData.imageData}`}
                                        alt={blogData.title}
                                        className="w-full rounded-xl object-cover max-h-[360px]"
                                        style={{
                                            border: "1px solid rgba(37, 99, 235, 0.12)",
                                        }}
                                    />
                                    <button
                                        onClick={handleDownloadBlogImage}
                                        className="cursor-pointer mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                                        style={{
                                            backgroundColor: "rgba(37, 99, 235, 0.08)",
                                            color: "#1E40AF",
                                        }}
                                    >
                                        ⬇️ Download Featured Image
                                    </button>
                                </div>
                            )}

                            {/* Title + Meta */}
                            <div>
                                <h3
                                    className="text-lg sm:text-xl font-bold leading-tight"
                                    style={{ color: "#1A1A2E" }}
                                >
                                    {blogData.title}
                                </h3>
                                <p
                                    className="text-xs sm:text-sm mt-1.5 italic"
                                    style={{ color: "#4B5563" }}
                                >
                                    {blogData.metaDescription}
                                </p>
                                {blogData.readTime && (
                                    <span
                                        className="inline-block mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                        style={{
                                            backgroundColor: "rgba(37, 99, 235, 0.10)",
                                            color: "#1E40AF",
                                        }}
                                    >
                                        ⏱️ {blogData.readTime}
                                    </span>
                                )}
                            </div>

                            {/* Body preview with gradient fade */}
                            <div
                                className="relative rounded-xl p-4 sm:p-5 overflow-hidden"
                                style={{
                                    backgroundColor: "#EFF6FF",
                                    border: "1px solid rgba(37, 99, 235, 0.12)",
                                    maxHeight: "200px",
                                }}
                            >
                                <p
                                    className="text-sm leading-relaxed whitespace-pre-line"
                                    style={{ color: "#1F2937" }}
                                >
                                    {blogData.body.slice(0, 500)}...
                                </p>
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-20"
                                    style={{
                                        background:
                                            "linear-gradient(to top, #EFF6FF, transparent)",
                                    }}
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Preview Blog button */}
                                <button
                                    onClick={() =>
                                        window.open(
                                            `/blog-preview/${blogData.generationId}`,
                                            "_blank"
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
                                    �️ Preview Blog
                                </button>

                                {/* Copy dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setCopyMenuOpen(!copyMenuOpen)
                                        }
                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                                        style={{
                                            backgroundColor:
                                                "rgba(37, 99, 235, 0.08)",
                                            color: "#1E40AF",
                                        }}
                                    >
                                        � Copy
                                    </button>
                                    {copyMenuOpen && (
                                        <div
                                            className="absolute left-0 top-full mt-1 z-20 rounded-xl bg-white py-1 min-w-[220px]"
                                            style={{
                                                boxShadow:
                                                    "0 4px 20px rgba(0,0,0,0.12)",
                                                border: "1px solid rgba(37,99,235,0.15)",
                                            }}
                                        >
                                            <button
                                                onClick={() => {
                                                    handleCopy(
                                                        blogData.title +
                                                        "\n\n" +
                                                        blogData.body
                                                    );
                                                    setCopyMenuOpen(false);
                                                }}
                                                className="cursor-pointer w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors"
                                                style={{ color: "#1F2937" }}
                                            >
                                                📄 Copy Title + Body (Plain Text)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleCopy(
                                                        "<h1>" +
                                                        blogData.title +
                                                        "</h1>\n" +
                                                        blogData.htmlBody
                                                    );
                                                    setCopyMenuOpen(false);
                                                }}
                                                className="cursor-pointer w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors"
                                                style={{ color: "#1F2937" }}
                                            >
                                                🌐 Copy HTML Version
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Download featured image */}
                                {blogData.imageData && (
                                    <button
                                        onClick={handleDownloadBlogImage}
                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                                        style={{
                                            backgroundColor:
                                                "rgba(37, 99, 235, 0.08)",
                                            color: "#1E40AF",
                                        }}
                                    >
                                        ⬇️ Download Image
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
