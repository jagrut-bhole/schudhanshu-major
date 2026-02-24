import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ── Blog generation via Groq + Gemini featured image ── */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!groqApiKey) {
            return NextResponse.json(
                { success: false, message: "Groq API key is not configured" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { topicTitle, topicDescription } = body;

        if (!topicTitle) {
            return NextResponse.json(
                { success: false, message: "Topic title is required" },
                { status: 400 }
            );
        }

        /* ──────────────────────────────────────────────
           Run Groq text + Gemini image generation
           in PARALLEL with Promise.all()
           ────────────────────────────────────────────── */

        const groqPromise = generateBlogText(groqApiKey, topicTitle, topicDescription);
        const imagePromise = geminiApiKey
            ? generateFeaturedImage(geminiApiKey, topicTitle, topicDescription)
            : Promise.resolve({ imageData: "", imageMime: "" });

        const [blogResult, imageResult] = await Promise.all([groqPromise, imagePromise]);

        if (!blogResult.success) {
            return NextResponse.json(
                { success: false, message: blogResult.error },
                { status: 502 }
            );
        }

        const blogData = blogResult.data!;
        const htmlBody = markdownToHtml(blogData.body);

        /* ── Save topic ── */
        let topic = await prisma.topic.findFirst({
            where: { title: topicTitle },
        });

        if (!topic) {
            topic = await prisma.topic.create({
                data: {
                    title: topicTitle,
                    description: topicDescription || "",
                },
            });
        }

        /* ── Save generation ── */
        const contentJson = JSON.stringify({
            title: blogData.title,
            metaDescription: blogData.metaDescription,
            readTime: blogData.readTime,
            body: blogData.body,
            htmlBody: htmlBody,
            imageData: imageResult.imageData,
            imageMime: imageResult.imageMime,
        });

        const generation = await prisma.generation.create({
            data: {
                type: "BLOG",
                content: contentJson,
                topicId: topic.id,
                userId: session.user.id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Blog generated and saved successfully",
                data: {
                    generationId: generation.id,
                    title: blogData.title,
                    metaDescription: blogData.metaDescription,
                    readTime: blogData.readTime,
                    body: blogData.body,
                    htmlBody: htmlBody,
                    imageData: imageResult.imageData,
                    imageMime: imageResult.imageMime,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/generate/blog:", error);
        return NextResponse.json(
            { success: false, message: "Server error while generating blog" },
            { status: 500 }
        );
    }
}

/* ════════════════════════════════════════════════════
   GROQ — Blog Text Generation
   ════════════════════════════════════════════════════ */
interface BlogData {
    title: string;
    metaDescription: string;
    readTime: string;
    body: string;
}

async function generateBlogText(
    apiKey: string,
    topicTitle: string,
    topicDescription: string
): Promise<{ success: boolean; data?: BlogData; error?: string }> {
    try {
        const systemMessage = `You are an expert blog writer and content creator. You write detailed, engaging, SEO-friendly blog posts that are easy to read, well structured, and informative. You always write in a warm, conversational yet professional tone.`;

        const userMessage = `Write a complete, detailed blog post about the following trending topic.

Topic: ${topicTitle}
Context: ${topicDescription || "A currently trending topic."}

Return your response as a valid JSON object with these exact fields:
{
  "title": "An engaging, SEO-friendly blog post title",
  "metaDescription": "A 150-160 character meta description for SEO",
  "readTime": "e.g. 5 min read",
  "body": "The full blog post in markdown format"
}

Blog post structure must follow this format:

# {Title}

## Introduction
[2-3 engaging paragraphs that hook the reader and explain why this topic matters right now]

## Background / What You Need to Know
[2-3 paragraphs giving context and background]

## [Main Section 1 — give a relevant title]
[3-4 paragraphs with key details, facts, analysis]

## [Main Section 2 — give a relevant title]
[3-4 paragraphs with deeper insights, implications]

## [Main Section 3 — give a relevant title]
[2-3 paragraphs with current developments or controversy]

## Key Takeaways
[Bullet list of 4-5 most important points from the article]

## Conclusion
[2 paragraphs wrapping up with a forward-looking perspective]

Requirements:
- Minimum 800 words
- Use subheadings generously
- Include relevant statistics or facts where appropriate
- Conversational but professional tone
- No jargon, easy to understand
- Return ONLY the JSON object, no extra text, no markdown code fences around it`;

        const groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: userMessage },
                    ],
                    temperature: 0.7,
                    max_tokens: 8192,
                    response_format: { type: "json_object" },
                }),
            }
        );

        if (!groqResponse.ok) {
            const errorBody = await groqResponse.text();
            console.log("Groq API error:", errorBody);
            return { success: false, error: "Failed to generate blog text via Groq" };
        }

        const groqData = await groqResponse.json();
        const choice = groqData.choices?.[0];
        const finishReason: string = choice?.finish_reason ?? "unknown";

        if (finishReason === "length") {
            console.log("Groq response truncated (finish_reason=length) — increase max_tokens or shorten prompt");
            return { success: false, error: "Blog generation was cut short, please try again" };
        }

        let rawContent: string = choice?.message?.content?.trim() ?? "";

        if (!rawContent) {
            return { success: false, error: "Groq returned empty content" };
        }

        /* Strip code fences if present */
        rawContent = rawContent
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        /* If the model wrapped the JSON in extra prose, extract the JSON object */
        const jsonStart = rawContent.indexOf("{");
        const jsonEnd = rawContent.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            rawContent = rawContent.substring(jsonStart, jsonEnd + 1);
        }

        let blogData: BlogData;
        try {
            blogData = JSON.parse(rawContent);
        } catch {
            console.log("Failed to parse blog JSON:", rawContent.substring(0, 200));
            return {
                success: false,
                error: "Failed to parse blog content, please try again",
            };
        }

        return { success: true, data: blogData };
    } catch (err) {
        console.log("Groq blog text error:", err);
        return { success: false, error: "Blog text generation failed" };
    }
}

/* ════════════════════════════════════════════════════
   GEMINI — Featured Image Generation
   ════════════════════════════════════════════════════ */
async function generateFeaturedImage(
    apiKey: string,
    topicTitle: string,
    topicDescription: string
): Promise<{ imageData: string; imageMime: string }> {
    try {
        const prompt = `Create a professional, eye-catching featured blog post header image for an article about:
Topic: ${topicTitle}
Context: ${topicDescription || "A currently trending topic."}

Style requirements:
- Editorial/magazine style header image
- Professional and clean composition
- Warm tones: oranges, reds, yellows, golden hues
- Photorealistic or high quality illustrated style
- Wide landscape format (banner style)
- Visually represents the topic clearly
- NO text, NO words, NO letters in the image
- High quality, publication ready`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                },
            }),
        });

        if (!geminiResponse.ok) {
            console.log("Gemini blog image error:", await geminiResponse.text());
            return { imageData: "", imageMime: "" };
        }

        const geminiData = await geminiResponse.json();
        const parts = geminiData?.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData) {
                return {
                    imageData: part.inlineData.data,
                    imageMime: part.inlineData.mimeType || "image/png",
                };
            }
        }

        return { imageData: "", imageMime: "" };
    } catch (err) {
        console.log("Gemini blog image error:", err);
        return { imageData: "", imageMime: "" };
    }
}

/* ════════════════════════════════════════════════════
   MARKDOWN → HTML converter (server-side)
   ════════════════════════════════════════════════════ */
function markdownToHtml(markdown: string): string {
    const inline = (text: string) =>
        text
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/__(.+?)__/g, "<strong>$1</strong>")
            .replace(/_(.+?)_/g, "<em>$1</em>");

    const lines = markdown.split("\n");
    const out: string[] = [];
    let inList = false;
    let inBlockquote = false;

    const closeOpen = () => {
        if (inList) { out.push("</ul>"); inList = false; }
        if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; }
    };

    for (const line of lines) {
        const t = line.trim();
        if (t.startsWith("### ")) {
            closeOpen();
            out.push(`<h3>${inline(t.slice(4))}</h3>`);
        } else if (t.startsWith("## ")) {
            closeOpen();
            out.push(`<h2>${inline(t.slice(3))}</h2>`);
        } else if (t.startsWith("# ")) {
            closeOpen();
            out.push(`<h2>${inline(t.slice(2))}</h2>`);
        } else if (t.startsWith("> ")) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (!inBlockquote) { out.push("<blockquote>"); inBlockquote = true; }
            out.push(`<p>${inline(t.slice(2))}</p>`);
        } else if (t.startsWith("- ") || t.startsWith("* ")) {
            if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; }
            if (!inList) { out.push("<ul>"); inList = true; }
            out.push(`<li>${inline(t.slice(2))}</li>`);
        } else if (t === "") {
            closeOpen();
        } else {
            closeOpen();
            out.push(`<p>${inline(t)}</p>`);
        }
    }
    closeOpen();
    return out.join("\n");
}
