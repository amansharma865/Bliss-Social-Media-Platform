import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const compressImage = async (dataUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 70% quality
            };
            img.src = dataUrl;
        });
    };

    const updateProfile = async ({ coverImg, profileImg, ...rest }) => {
        if (!coverImg && !profileImg) return;

        try {
            setIsUpdatingProfile(true);
            
            // Compress images if they exist
            const compressedProfileImg = profileImg ? await compressImage(profileImg) : null;
            const compressedCoverImg = coverImg ? await compressImage(coverImg) : null;

            const res = await fetch(`/api/users/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...rest,
                    profileImg: compressedProfileImg,
                    coverImg: compressedCoverImg,
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Invalidate and refetch all relevant queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
                // Update the cache immediately
                queryClient.setQueryData(["authUser"], (old) => ({
                    ...old,
                    profileImg: data.profileImg || old.profileImg,
                    coverImg: data.coverImg || old.coverImg,
                }))
            ]);

            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    return { isUpdatingProfile, updateProfile };
};

export default useUpdateUserProfile;