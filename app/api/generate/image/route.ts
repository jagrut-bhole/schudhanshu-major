import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json(
                { success: false, message: "Gemini API key is not configured" },
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

        const masterPrompt = `Create a bold, eye-catching YouTube thumbnail image for a video about:
Topic: ${topicTitle}
Context: ${topicDescription || "A currently trending topic."}
Style: High contrast, vibrant, news/media thumbnail style, photorealistic, landscape composition, warm energetic tones (oranges reds yellows), NO text overlays in the image.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: masterPrompt }],
                    },
                ],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                },
            }),
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.log("Gemini API error:", errorText);
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to generate image via Gemini",
                },
                { status: 502 }
            );
        }

        const geminiData = await geminiResponse.json();

        /* Find the image part in the response */
        const parts = geminiData?.candidates?.[0]?.content?.parts || [];
        let imageBase64 = "";
        let imageMime = "";

        for (const part of parts) {
            if (part.inlineData) {
                imageBase64 = part.inlineData.data;
                imageMime = part.inlineData.mimeType || "image/png";
                break;
            }
        }

        if (!imageBase64) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Gemini did not return an image",
                },
                { status: 502 }
            );
        }

        /* Upload to Cloudinary */
        let cloudinaryUrl = "";
        try {
            cloudinaryUrl = await uploadToCloudinary(imageBase64, imageMime);
        } catch (uploadErr) {
            console.log("Cloudinary upload error:", uploadErr);
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to upload image to Cloudinary",
                },
                { status: 502 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Image generated and uploaded successfully",
                data: {
                    imageUrl: cloudinaryUrl,
                    imageMime,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/generate/image:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server error while generating image",
            },
            { status: 500 }
        );
    }
}
