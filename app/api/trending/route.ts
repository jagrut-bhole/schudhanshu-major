import { NextResponse } from "next/server";

interface TrendingTopic {
    title: string;
    traffic: string;
    picture: string;
    pictureSource: string;
    newsTitle: string;
    description: string;
    newsUrl: string;
}

interface TrendingResponseSchema {
    success: boolean;
    message: string;
    data?: TrendingTopic[];
}

/* Decode common XML entities */
function decodeEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
}

export async function GET(): Promise<NextResponse<TrendingResponseSchema>> {
    try {
        /* Step 1 — Fetch trending topics from Google Trends RSS (India) */
        const rssUrl = "https://trends.google.com/trending/rss?geo=IN";

        const rssResponse = await fetch(rssUrl, { next: { revalidate: 600 } });

        if (!rssResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to fetch trending topics from Google Trends",
                },
                { status: 502 }
            );
        }

        const xmlString = await rssResponse.text();

        /* Step 2 — Parse each <item> block from the XML */
        const itemBlocks = xmlString.split("<item>").slice(1);
        const topics: TrendingTopic[] = [];

        for (const block of itemBlocks.slice(0, 8)) {
            const title =
                decodeEntities(
                    block.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() || ""
                );
            const traffic =
                block
                    .match(
                        /<ht:approx_traffic>([^<]*)<\/ht:approx_traffic>/
                    )?.[1]
                    ?.trim() || "";
            const picture =
                block
                    .match(/<ht:picture>([^<]*)<\/ht:picture>/)?.[1]
                    ?.trim() || "";
            const pictureSource =
                decodeEntities(
                    block
                        .match(
                            /<ht:picture_source>([^<]*)<\/ht:picture_source>/
                        )?.[1]
                        ?.trim() || ""
                );
            const newsTitle =
                decodeEntities(
                    block
                        .match(
                            /<ht:news_item_title>([^<]*)<\/ht:news_item_title>/
                        )?.[1]
                        ?.trim() || title
                );
            const newsSnippet =
                decodeEntities(
                    block
                        .match(
                            /<ht:news_item_snippet>([^<]+)<\/ht:news_item_snippet>/
                        )?.[1]
                        ?.trim() || ""
                );
            const newsUrl =
                block
                    .match(
                        /<ht:news_item_url>([^<]*)<\/ht:news_item_url>/
                    )?.[1]
                    ?.trim() || "";

            if (title) {
                topics.push({
                    title,
                    traffic,
                    picture,
                    pictureSource,
                    newsTitle,
                    description: newsSnippet,
                    newsUrl,
                });
            }
        }

        if (topics.length === 0) {
            return NextResponse.json(
                { success: false, message: "No trending topics found" },
                { status: 404 }
            );
        }

        /* Step 3 — Generate descriptions for topics without snippets via Groq */
        const needsDescription = topics.filter((t) => !t.description);

        if (needsDescription.length > 0) {
            const groqApiKey = process.env.GROQ_API_KEY;

            if (groqApiKey) {
                const topicNames = needsDescription.map((t) => t.title);
                const prompt = `For each of these trending topics, write a 2-sentence simple description that a general audience can understand. Avoid jargon.

Topics: ${topicNames.join(", ")}

Return ONLY a JSON array where each object has:
- title: the exact topic name as given
- description: your 2-sentence explanation
Return ONLY the JSON array, no extra text.`;

                try {
                    const groqRes = await fetch(
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
                                    { role: "user", content: prompt },
                                ],
                                temperature: 0.7,
                                max_tokens: 1024,
                            }),
                        }
                    );

                    if (groqRes.ok) {
                        const groqData = await groqRes.json();
                        let raw: string =
                            groqData.choices?.[0]?.message?.content ?? "[]";
                        raw = raw.trim();
                        if (raw.startsWith("```")) {
                            raw = raw
                                .replace(/^```(?:json)?\n?/, "")
                                .replace(/\n?```$/, "");
                        }

                        const descs: {
                            title: string;
                            description: string;
                        }[] = JSON.parse(raw);

                        for (const d of descs) {
                            const topic = topics.find(
                                (t) =>
                                    t.title.toLowerCase() ===
                                    d.title.toLowerCase() &&
                                    !t.description
                            );
                            if (topic) topic.description = d.description;
                        }
                    }
                } catch (groqErr) {
                    console.log("Groq description fallback failed:", groqErr);
                }
            }
        }

        /* Fallback description for any topics still missing one */
        for (const topic of topics) {
            if (!topic.description) {
                topic.description = `${topic.title} is currently trending with ${topic.traffic} searches. Click to learn more and create content about this topic.`;
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: "Trending topics fetched successfully",
                data: topics,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/trending:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error while fetching trending topics",
            },
            { status: 500 }
        );
    }
}
