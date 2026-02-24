import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlogPreviewClient from "./BlogPreviewClient";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BlogPreviewPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: "#FFF8F0" }}
            >
                <div
                    className="rounded-2xl bg-white p-10 sm:p-14 text-center max-w-md w-full"
                    style={{
                        boxShadow: "0 4px 24px rgba(255, 140, 0, 0.1)",
                        border: "1px solid rgba(255, 179, 0, 0.2)",
                    }}
                >
                    <div className="text-4xl mb-4">🔒</div>
                    <h2
                        className="text-xl font-bold mb-2"
                        style={{ color: "#FF4500" }}
                    >
                        Sign In Required
                    </h2>
                    <p className="text-sm" style={{ color: "#8D6E3F" }}>
                        Please sign in to view this blog post.
                    </p>
                </div>
            </div>
        );
    }

    const generation = await prisma.generation.findUnique({
        where: { id },
        include: { topic: true },
    });

    if (!generation || generation.type !== "BLOG") {
        notFound();
    }

    if (generation.userId !== session.user.id) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: "#FFF8F0" }}
            >
                <div
                    className="rounded-2xl bg-white p-10 sm:p-14 text-center max-w-md w-full"
                    style={{
                        boxShadow: "0 4px 24px rgba(255, 140, 0, 0.1)",
                        border: "1px solid rgba(255, 179, 0, 0.2)",
                    }}
                >
                    <div className="text-4xl mb-4">🚫</div>
                    <h2
                        className="text-xl font-bold mb-2"
                        style={{ color: "#FF4500" }}
                    >
                        Access Denied
                    </h2>
                    <p className="text-sm" style={{ color: "#8D6E3F" }}>
                        You do not have permission to view this blog post.
                    </p>
                </div>
            </div>
        );
    }

    /* Parse stored JSON content */
    let blogContent: {
        title: string;
        metaDescription: string;
        readTime: string;
        body: string;
        htmlBody: string;
        imageData: string;
        imageMime: string;
    };

    try {
        blogContent = JSON.parse(generation.content || "{}");
    } catch {
        notFound();
    }

    const formattedDate = new Date(generation.createdAt).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );

    return (
        <BlogPreviewClient
            blogContent={blogContent}
            topicTitle={generation.topic.title}
            formattedDate={formattedDate}
        />
    );
}
