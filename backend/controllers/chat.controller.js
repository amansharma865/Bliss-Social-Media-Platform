import Message from "../models/chat.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

export const sendMessage = async (req, res) => {
    try {
        const { recipientId, text } = req.body;
        const senderId = req.user._id;

        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            text
        });

        await newMessage.save();

        // Create notification for new message
        const notification = new Notification({
            type: "message",
            from: senderId,
            to: recipientId,
        });
        await notification.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "username profileImg fullName")
            .populate("recipient", "username profileImg fullName");

        // Add this to help with real-time updates
        populatedMessage._doc.isNewMessage = true;

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        // Mark messages as read when chat is opened
        await Message.updateMany(
            { sender: userId, recipient: myId, read: false },
            { $set: { read: true } }
        );

        // Mark related notifications as read
        await Notification.updateMany(
            { from: userId, to: myId, type: "message", read: false },
            { $set: { read: true } }
        );

        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: userId },
                { sender: userId, recipient: myId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate("sender", "username profileImg fullName")
        .populate("recipient", "username profileImg fullName");

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] },
                            "$recipient",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $project: {
                    _id: "$userInfo._id",
                    username: "$userInfo.username",
                    fullName: "$userInfo.fullName",
                    profileImg: "$userInfo.profileImg",
                    lastMessage: 1
                }
            }
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversations:", error);
        res.status(500).json({ error: error.message });
    }
};
