import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const generation = await prisma.generation.findUnique({
            where: { id },
            include: {
                topic: true,
            },
        });

        if (!generation) {
            return NextResponse.json(
                { success: false, message: "Generation not found" },
                { status: 404 }
            );
        }

        if (generation.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Generation fetched successfully",
                data: generation,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at GET /api/generations/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const generation = await prisma.generation.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!generation) {
            return NextResponse.json(
                { success: false, message: "Generation not found" },
                { status: 404 }
            );
        }

        if (generation.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        await prisma.generation.delete({ where: { id } });

        return NextResponse.json(
            { success: true, message: "Generation deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at DELETE /api/generations/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
