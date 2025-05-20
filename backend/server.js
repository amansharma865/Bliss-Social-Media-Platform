import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import chatRoutes from "./routes/chat.route.js";

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT =  8000;
const __dirname = path.resolve();

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Make io available to our controllers
app.io = io;

app.use(express.json({ limit: "50mb" })); // Increased from 5mb
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// Socket.IO connection handling
const onlineUsers = new Map();

io.on("connection", (socket) => {
    socket.on("setup", (userId) => {
        socket.join(userId); // Join a room with userId
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send_message", (message) => {
        const recipientId = message.recipient._id;
        // Emit to specific user's room
        io.to(recipientId).emit("receive_message", message);
        io.to(recipientId).emit("new_notification", {
            type: "message",
            from: message.sender,
            to: recipientId
        });
    });

    socket.on("disconnect", () => {
        let userId;
        for (const [key, value] of onlineUsers.entries()) {
            if (value === socket.id) {
                userId = key;
                break;
            }
        }
        if (userId) onlineUsers.delete(userId);
    });
});

httpServer.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	connectMongoDB();
});