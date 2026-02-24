import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* Upload a base64 image to Cloudinary and return the secure URL */
export async function uploadToCloudinary(
    base64Data: string,
    mimeType: string
): Promise<string> {
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: "trendforge",
        resource_type: "image",
    });

    return result.secure_url;
}

export default cloudinary;
