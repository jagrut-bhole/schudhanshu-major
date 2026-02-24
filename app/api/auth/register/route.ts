import prisma from "@/lib/prisma";
import { registerSchema, RegisterResponseSchema } from "./registerSchema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) : Promise<NextResponse<RegisterResponseSchema>> {

    try {

        const body = await req.json();

        const validationResult = registerSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid request payload"
                },
                {
                    status: 400
                }
            )
        }

        const {name, email, password} = validationResult.data;

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            },
            select : {
                id: true,
                email: true,
                name: true
            }
        })
        
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User already exists"
                },
                {
                    status: 400
                }
            )
        }

        const hasedPasword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hasedPasword
            }
        });

        const user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }

        return NextResponse.json(
            {
                success: true,
                message: "User registered successfully",
                data: user
            },
            {
                status: 201
            }
        )

    } catch (error) {
        console.log("Error at /api/auth/register: ",error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error while registering user"
            },
            {
                status: 500
            }
        )
    }
}