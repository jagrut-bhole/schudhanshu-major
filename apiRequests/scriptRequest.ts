import axios from "axios";

interface ScriptResponse {
    success: boolean;
    message: string;
    data?: {
        script: string;
        wordCount: number;
        speakingMinutes: number;
    };
}

/* Generate a video script for a trending topic */
export const generateScript = async (
    title: string,
    description: string
): Promise<ScriptResponse> => {
    try {
        const response = await axios.post<ScriptResponse>(
            "/api/generate-script",
            { title, description }
        );
        return response.data;
    } catch (error) {
        console.log("Error in generateScript", error);
        return {
            success: false,
            message: "Failed to generate script",
        };
    }
};
