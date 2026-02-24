import axios from "axios";

/* ── Save Topic ── */
export const saveTopic = async (data: {
    title: string;
    description: string;
    imageUrl?: string;
    traffic?: string;
    source?: string;
}) => {
    try {
        const res = await axios.post("/api/topics/save", data);
        return res.data;
    } catch (error) {
        console.log("Error in saveTopic", error);
        return { success: false, message: "Failed to save topic" };
    }
};

/* ── Generate Script (via /api/generate/script) ── */
export const generateScriptNew = async (
    topicTitle: string,
    topicDescription: string
) => {
    try {
        const res = await axios.post("/api/generate/script", {
            topicTitle,
            topicDescription,
        });
        return res.data;
    } catch (error) {
        console.log("Error in generateScriptNew", error);
        return { success: false, message: "Failed to generate script" };
    }
};

/* ── Generate Image (via /api/generate/image) ── */
export const generateImage = async (
    topicTitle: string,
    topicDescription: string
) => {
    try {
        const res = await axios.post("/api/generate/image", {
            topicTitle,
            topicDescription,
        });
        return res.data;
    } catch (error) {
        console.log("Error in generateImage", error);
        return { success: false, message: "Failed to generate image" };
    }
};

/* ── Generate Blog (via /api/generate/blog) ── */
export const generateBlog = async (
    topicTitle: string,
    topicDescription: string
) => {
    try {
        const res = await axios.post("/api/generate/blog", {
            topicTitle,
            topicDescription,
        });
        return res.data;
    } catch (error) {
        console.log("Error in generateBlog", error);
        return { success: false, message: "Failed to generate blog post" };
    }
};

/* ── Save Generation ── */
export const saveGeneration = async (data: {
    type: "SCRIPT" | "IMAGE" | "BLOG";
    content?: string;
    imageData?: string;
    imageMime?: string;
    topicId: string;
}) => {
    try {
        const res = await axios.post("/api/generations/save", data);
        return res.data;
    } catch (error) {
        console.log("Error in saveGeneration", error);
        return { success: false, message: "Failed to save generation" };
    }
};

/* ── Fetch History ── */
export const fetchHistory = async () => {
    try {
        const res = await axios.get("/api/generations/history");
        return res.data;
    } catch (error) {
        console.log("Error in fetchHistory", error);
        return { success: false, message: "Failed to fetch history", data: [] };
    }
};

/* ── Delete Generation ── */
export const deleteGeneration = async (id: string) => {
    try {
        const res = await axios.delete(`/api/generations/${id}`);
        return res.data;
    } catch (error) {
        console.log("Error in deleteGeneration", error);
        return { success: false, message: "Failed to delete generation" };
    }
};
