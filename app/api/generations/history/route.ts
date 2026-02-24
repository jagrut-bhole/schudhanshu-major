import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const generations = await prisma.generation.findMany({
            where: { userId: session.user.id },
            include: {
                topic: {
                    select: {
                        title: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(
            {
                success: true,
                message: "History fetched successfully",
                data: generations,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/generations/history:", error);
        return NextResponse.json(
            { success: false, message: "Server error while fetching history" },
            { status: 500 }
        );
    }
}
