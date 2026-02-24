import axios from "axios";
import { z } from "zod";

/* User Register API */
import { registerSchema } from "../types/AuthType/authSchema";
type RegisterSchemaType = z.infer<typeof registerSchema>;
export const registerUser = async (userData: RegisterSchemaType) => {
    try {
        const response = await axios.post("/api/auth/register", userData);
        return response.data;
    } catch (error) {
        console.log("Error in registerUser", error);
        return error;
    }
}