import { v2 as cloudinary } from "cloudinary";

const uploadImage = async (imageDataUrl) => {
    try {
        const result = await cloudinary.uploader.upload(imageDataUrl, {
            folder: "bliss-social",
            resource_type: "auto",
            quality: "auto:low", // Add compression
            fetch_format: "auto",
            width: 1000, // Maximum width
            height: 1000, // Maximum height
            crop: "limit",
            flags: "lossy"
        });
        return result.secure_url;
    } catch (error) {
        console.error("Error uploading to cloudinary:", error);
        throw new Error("Could not upload image");
    }
};

export { uploadImage };
