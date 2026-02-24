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
        const { type, content, imageData, imageMime, topicId } = body;

        if (!type || !topicId) {
            return NextResponse.json(
                { success: false, message: "Type and topicId are required" },
                { status: 400 }
            );
        }

        const generation = await prisma.generation.create({
            data: {
                type,
                content: content || null,
                imageData: imageData || null,
                imageMime: imageMime || null,
                topicId,
                userId: session.user.id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Generation saved successfully",
                data: { generationId: generation.id, ...generation },
            },
            { status: 201 }
        );
    } catch (error) {
        console.log("Error at /api/generations/save:", error);
        return NextResponse.json(
            { success: false, message: "Server error while saving generation" },
            { status: 500 }
        );
    }
}
