import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;

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

        const systemMessage = `You are an expert YouTube and short-form video scriptwriter. You write engaging, conversational scripts that hook viewers immediately and keep them watching till the end.`;

        const userMessage = `Write a complete video script for the following trending topic.

Topic: ${topicTitle}
Context: ${topicDescription || "A currently trending topic."}

Structure the script EXACTLY like this:

🎬 HOOK (0–15 seconds)
[Attention-grabbing opening line. Make it shocking, curious or bold.]

📖 INTRO (15–30 seconds)
[Briefly tell viewers what this video is about and why it matters to them.]

🔍 SECTION 1 — [Give it a relevant title]
[Explain the first key point clearly. Use simple language.]

🔍 SECTION 2 — [Give it a relevant title]
[Explain the second key point. Add interesting facts or context.]

🔍 SECTION 3 — [Give it a relevant title]
[Explain the third key point. Include any controversy or drama if relevant.]

💡 KEY TAKEAWAY
[Summarize what the viewer should remember in 1–2 sentences.]

📢 OUTRO & CTA (last 20 seconds)
[Wrap up warmly. Ask viewers to like, comment their opinion, and subscribe. Suggest what video to watch next.]

Keep the tone: conversational, engaging, easy to understand. Avoid jargon. Write as if speaking directly to a viewer.`;

        const groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${groqApiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: userMessage },
                    ],
                    temperature: 0.8,
                    max_tokens: 2048,
                }),
            }
        );

        if (!groqResponse.ok) {
            const errorBody = await groqResponse.text();
            console.log("Groq API error:", errorBody);
            return NextResponse.json(
                { success: false, message: "Failed to generate script via Groq" },
                { status: 502 }
            );
        }

        const groqData = await groqResponse.json();
        const script: string =
            groqData.choices?.[0]?.message?.content?.trim() ?? "";

        if (!script) {
            return NextResponse.json(
                { success: false, message: "Groq returned an empty script" },
                { status: 502 }
            );
        }

        const wordCount = script.split(/\s+/).length;
        const speakingMinutes = Math.ceil(wordCount / 140);

        return NextResponse.json(
            {
                success: true,
                message: "Script generated successfully",
                data: { script, wordCount, speakingMinutes },
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/generate/script:", error);
        return NextResponse.json(
            { success: false, message: "Server error while generating script" },
            { status: 500 }
        );
    }
}
