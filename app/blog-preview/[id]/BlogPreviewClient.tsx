"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface BlogContent {
    title: string;
    metaDescription: string;
    readTime: string;
    body: string;
    htmlBody: string;
    imageData: string;
    imageMime: string;
}

interface Props {
    blogContent: BlogContent;
    topicTitle: string;
    formattedDate: string;
}

export default function BlogPreviewClient({
    blogContent,
    topicTitle,
    formattedDate,
}: Props) {
    const router = useRouter();
    const [copyMenuOpen, setCopyMenuOpen] = useState(false);

    const handleCopy = useCallback(async (text: string, label: string) => {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
        setCopyMenuOpen(false);
    }, []);

    const handleDownloadImage = useCallback(() => {
        if (!blogContent.imageData) return;
        const link = document.createElement("a");
        link.href = `data:${blogContent.imageMime || "image/png"};base64,${blogContent.imageData}`;
        link.download = `${topicTitle.replace(/\s+/g, "-")}-featured-image.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
    }, [blogContent, topicTitle]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#FFF8F0" }}>
            {/* Warm gradient top border */}
            <div
                className="h-1"
                style={{
                    background:
                        "linear-gradient(90deg, #FFD700, #FF8C00, #FF4500)",
                }}
            />

            {/* Header bar */}
            <header
                className="sticky top-0 z-20 border-b backdrop-blur-md"
                style={{
                    backgroundColor: "rgba(255, 248, 240, 0.92)",
                    borderColor: "rgba(255, 179, 0, 0.25)",
                }}
            >
                <div className="mx-auto max-w-[820px] px-4 sm:px-6 py-3 flex items-center justify-between">
                    <span
                        className="text-lg font-bold tracking-tight"
                        style={{ color: "#FF4500" }}
                    >
                        🔥 TrendForge
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:opacity-80"
                            style={{
                                backgroundColor: "rgba(255, 179, 0, 0.1)",
                                color: "#8D6E3F",
                            }}
                        >
                            ← Back
                        </button>

                        {/* Copy dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setCopyMenuOpen(!copyMenuOpen)}
                                className="cursor-pointer inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: "rgba(255, 179, 0, 0.1)",
                                    color: "#E65100",
                                }}
                            >
                                📋 Copy
                            </button>
                            {copyMenuOpen && (
                                <div
                                    className="absolute right-0 top-full mt-1 z-20 rounded-xl bg-white py-1 min-w-[220px]"
                                    style={{
                                        boxShadow:
                                            "0 4px 20px rgba(0,0,0,0.12)",
                                        border: "1px solid rgba(255,179,0,0.2)",
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            handleCopy(
                                                blogContent.title +
                                                "\n\n" +
                                                blogContent.body,
                                                "Plain text"
                                            )
                                        }
                                        className="cursor-pointer w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors"
                                        style={{ color: "#4A3F2F" }}
                                    >
                                        📄 Copy Plain Text
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleCopy(
                                                "<h1>" +
                                                blogContent.title +
                                                "</h1>\n" +
                                                blogContent.htmlBody,
                                                "HTML"
                                            )
                                        }
                                        className="cursor-pointer w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors"
                                        style={{ color: "#4A3F2F" }}
                                    >
                                        🌐 Copy HTML Version
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ARTICLE */}
            <article className="mx-auto max-w-[780px] px-4 sm:px-6 py-8 sm:py-12">
                {/* Topic badge */}
                <span
                    className="inline-block rounded-full px-3 py-1 text-[11px] font-bold mb-4"
                    style={{
                        background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                        color: "#fff",
                    }}
                >
                    🔥 {topicTitle}
                </span>

                {/* Blog title */}
                <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3"
                    style={{ color: "#1A1A2E" }}
                >
                    {blogContent.title}
                </h1>

                {/* Meta description */}
                <p
                    className="text-sm sm:text-base italic mb-4"
                    style={{ color: "#8D6E3F" }}
                >
                    {blogContent.metaDescription}
                </p>

                {/* Date + Read time */}
                <div
                    className="flex flex-wrap items-center gap-3 text-xs mb-6 pb-6"
                    style={{
                        color: "#B8860B",
                        borderBottom: "1px solid rgba(255, 179, 0, 0.2)",
                    }}
                >
                    <span>📅 Generated on {formattedDate}</span>
                    {blogContent.readTime && (
                        <span>⏱️ {blogContent.readTime}</span>
                    )}
                </div>

                {/* Featured image */}
                {blogContent.imageData && (
                    <div className="mb-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`data:${blogContent.imageMime || "image/png"};base64,${blogContent.imageData}`}
                            alt={blogContent.title}
                            className="w-full rounded-xl object-cover max-h-[420px]"
                            style={{
                                border: "1px solid rgba(255, 179, 0, 0.15)",
                            }}
                        />
                        <p
                            className="text-xs mt-2 italic text-center"
                            style={{ color: "#B8860B" }}
                        >
                            Featured image generated by AI
                        </p>
                    </div>
                )}

                {/* Blog Body — rendered HTML */}
                <div
                    className="blog-body"
                    dangerouslySetInnerHTML={{
                        __html: blogContent.htmlBody,
                    }}
                />

                {/* Custom styles for blog body */}
                <style jsx>{`
                    .blog-body :global(h2) {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #e65100;
                        margin-top: 2rem;
                        margin-bottom: 0.75rem;
                        line-height: 1.3;
                    }
                    .blog-body :global(h3) {
                        font-size: 1.2rem;
                        font-weight: 700;
                        color: #bf360c;
                        margin-top: 1.5rem;
                        margin-bottom: 0.5rem;
                        line-height: 1.3;
                    }
                    .blog-body :global(p) {
                        font-size: 1rem;
                        line-height: 1.8;
                        color: #4a3f2f;
                        margin-bottom: 1rem;
                    }
                    .blog-body :global(blockquote) {
                        border-left: 4px solid #ff8c00;
                        background-color: rgba(255, 179, 0, 0.06);
                        padding: 1rem 1.25rem;
                        margin: 1.25rem 0;
                        border-radius: 0 0.75rem 0.75rem 0;
                        font-style: italic;
                        color: #6b5b3e;
                    }
                    .blog-body :global(ul) {
                        list-style: none;
                        padding-left: 0;
                        margin-bottom: 1rem;
                    }
                    .blog-body :global(li) {
                        position: relative;
                        padding-left: 1.5rem;
                        margin-bottom: 0.5rem;
                        font-size: 1rem;
                        line-height: 1.7;
                        color: #4a3f2f;
                    }
                    .blog-body :global(li)::before {
                        content: "🔸";
                        position: absolute;
                        left: 0;
                        top: 0;
                        font-size: 0.7rem;
                    }
                    .blog-body :global(strong) {
                        color: #e65100;
                        font-weight: 700;
                    }
                    .blog-body :global(em) {
                        color: #8d6e3f;
                    }
                `}</style>

                {/* Divider */}
                <div
                    className="my-8"
                    style={{
                        borderTop: "1px solid rgba(255, 179, 0, 0.2)",
                    }}
                />

                {/* Footer */}
                <div className="text-center space-y-4">
                    <p
                        className="text-sm font-medium"
                        style={{ color: "#B8860B" }}
                    >
                        Generated with{" "}
                        <span style={{ color: "#FF4500", fontWeight: 700 }}>
                            TrendForge
                        </span>
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() =>
                                handleCopy(
                                    blogContent.title +
                                    "\n\n" +
                                    blogContent.body,
                                    "Plain text"
                                )
                            }
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                            style={{
                                backgroundColor: "rgba(255, 179, 0, 0.1)",
                                color: "#E65100",
                            }}
                        >
                            📋 Copy Plain Text
                        </button>
                        <button
                            onClick={() =>
                                handleCopy(
                                    "<h1>" +
                                    blogContent.title +
                                    "</h1>\n" +
                                    blogContent.htmlBody,
                                    "HTML"
                                )
                            }
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                            style={{
                                backgroundColor: "rgba(255, 179, 0, 0.1)",
                                color: "#E65100",
                            }}
                        >
                            🌐 Copy HTML
                        </button>
                        {blogContent.imageData && (
                            <button
                                onClick={handleDownloadImage}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: "rgba(255, 87, 34, 0.1)",
                                    color: "#BF360C",
                                }}
                            >
                                ⬇️ Download Image
                            </button>
                        )}
                    </div>
                </div>
            </article>
        </div>
    );
}
