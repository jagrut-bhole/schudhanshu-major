import axios from "axios";

export interface TrendingTopic {
    title: string;
    traffic: string;
    picture: string;
    pictureSource: string;
    newsTitle: string;
    description: string;
    newsUrl: string;
}

interface TrendingResponse {
    success: boolean;
    message: string;
    data?: TrendingTopic[];
}

/* Fetch trending topics from our API route */
export const fetchTrendingTopics = async (): Promise<TrendingResponse> => {
    try {
        const response = await axios.get<TrendingResponse>("/api/trending");
        return response.data;
    } catch (error) {
        console.log("Error in fetchTrendingTopics", error);
        return {
            success: false,
            message: "Failed to fetch trending topics",
        };
    }
};
