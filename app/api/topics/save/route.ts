import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { title, description, imageUrl, traffic, source } = body;

        if (!title || !description) {
            return NextResponse.json(
                { success: false, message: "Title and description are required" },
                { status: 400 }
            );
        }

        /* Check if topic with same title already exists */
        const existing = await prisma.topic.findFirst({
            where: { title },
        });

        if (existing) {
            return NextResponse.json(
                {
                    success: true,
                    message: "Topic already exists",
                    data: { topicId: existing.id, ...existing },
                },
                { status: 200 }
            );
        }

        const topic = await prisma.topic.create({
            data: {
                title,
                description,
                imageUrl: imageUrl || null,
                traffic: traffic || null,
                source: source || null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Topic saved successfully",
                data: { topicId: topic.id, ...topic },
            },
            { status: 201 }
        );
    } catch (error) {
        console.log("Error at /api/topics/save:", error);
        return NextResponse.json(
            { success: false, message: "Server error while saving topic" },
            { status: 500 }
        );
    }
}
