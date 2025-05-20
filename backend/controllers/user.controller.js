import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { uploadImage } from "../utils/cloudinary.js";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUser profile", error.message);
        res.status(500).json({ error: error.message });
    }
}


export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: "you cant follow yourself" });
        }
        if (!userToModify || !currentUser) {
            return res.status(404).json({ message: "user not found" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            //unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            
            // Emit unfollow event
            req.app.io.emit("unfollowUser", {
                unfollowerId: req.user._id,
                unfollowedId: id
            });
            
            res.status(200).json({ message: "unfollowed" });
        }
        else {
            //follow the user

            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

            // Emit follow event
            req.app.io.emit("followUser", {
                followerId: req.user._id,
                followedId: id
            });

            //send notification to the user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });

            await newNotification.save();

            res.status(200).json({ message: "followed" });

        }

    } catch (error) {
        console.log("Error in followUnfollowUser profile", error.message);
        res.status(500).json({ error: error.message });
    }
}


export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId },
                },
            },
            { $sample: { size: 10 } },
        ]);

        // 1,2,3,4,5,6,
        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).json({ error: error.message });
    }
};
//so what this suggested is doing that it gets the 4 users randomly that are not followed by me jake aur users banao follow matt kro toh chaljega yeh ajenge users


export const updateUser = async (req, res) => {
    try {
        const { fullName, email, username, bio, link, currentPassword, newPassword } = req.body;
        let { profileImg, coverImg } = req.body;

        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if username is already taken by another user
        if (username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: "Username is already taken" });
            }
        }

        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ error: "Email is already taken" });
            }
        }

        // Handle password update if provided
        if (currentPassword && newPassword) {
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters long" });
            }
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Update user fields
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;

        // Handle image uploads if provided
        if (profileImg && profileImg.startsWith("data:")) {
            if (user.profileImg) {
                const publicId = user.profileImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`bliss-social/${publicId}`);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg, {
                folder: "bliss-social",
            });
            user.profileImg = uploadedResponse.secure_url;
        }

        if (coverImg && coverImg.startsWith("data:")) {
            if (user.coverImg) {
                const publicId = user.coverImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`bliss-social/${publicId}`);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg, {
                folder: "bliss-social",
            });
            user.coverImg = uploadedResponse.secure_url;
        }

        await user.save();

        // Return updated user without password
        const updatedUser = await User.findById(userId).select("-password");
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Error in updateUser:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followers = await User.find(
      { _id: { $in: user.followers } },
      "-password"
    );
    res.status(200).json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = await User.find(
      { _id: { $in: user.following } },
      "-password"
    );
    res.status(200).json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};