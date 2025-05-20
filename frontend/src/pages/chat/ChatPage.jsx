import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const socket = io("http://localhost:8000");

const ChatPage = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("user");
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

    const { data: conversations, isLoading } = useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const res = await fetch("/api/chat/conversations");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    });

    const { data: chatMessages, isLoading: isLoadingMessages } = useQuery({
        queryKey: ["messages", selectedUser?._id],
        queryFn: async () => {
            if (!selectedUser?._id) return [];
            const res = await fetch(`/api/chat/messages/${selectedUser._id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        enabled: !!selectedUser?._id
    });

    const { data: selectedUserInfo } = useQuery({
        queryKey: ["selectedUserInfo", userId],
        queryFn: async () => {
            if (!userId) return null;
            const res = await fetch(`/api/users/profile/${userId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        enabled: !!userId
    });

    const { data: userToMessage } = useQuery({
        queryKey: ["userToMessage", userId],
        queryFn: async () => {
            if (!userId) return null;
            const res = await fetch(`/api/users/profile/${userId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        enabled: !!userId
    });

    const { data: notifications } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    });

    const { mutate: markAsRead } = useMutation({
        mutationFn: async (notificationIds) => {
            const res = await fetch("/api/notifications/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds })
            });
            if (!res.ok) throw new Error("Failed to mark as read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
        }
    });

    useEffect(() => {
        if (userId && conversations) {
            const existingConversation = conversations.find(conv => conv._id.toString() === userId);
            if (existingConversation) {
                setSelectedUser(existingConversation);
            } else if (selectedUserInfo) {
                setSelectedUser({
                    _id: selectedUserInfo._id,
                    username: selectedUserInfo.username,
                    fullName: selectedUserInfo.fullName,
                    profileImg: selectedUserInfo.profileImg,
                });
            }
        }
    }, [userId, conversations, selectedUserInfo]);

    useEffect(() => {
        if (userId && userToMessage && !selectedUser) {
            setSelectedUser({
                _id: userToMessage._id,
                username: userToMessage.username,
                fullName: userToMessage.fullName,
                profileImg: userToMessage.profileImg,
            });
        }
    }, [userId, userToMessage, selectedUser]);

    useEffect(() => {
        if (chatMessages) {
            setMessages(chatMessages);
        }
    }, [chatMessages]);

    useEffect(() => {
        if (authUser) {
            socket.emit("setup", authUser._id);
        }

        socket.on("receive_message", (newMessage) => {
            setMessages(prev => {
                const exists = prev.some(msg => 
                    msg._id === newMessage._id || 
                    (msg.text === newMessage.text && 
                     msg.sender._id === newMessage.sender._id &&
                     Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 1000)
                );
                
                if (!exists) {
                    return [...prev, newMessage];
                }
                return prev;
            });

            queryClient.invalidateQueries(["conversations"]);
            queryClient.invalidateQueries(["notifications"]);
        });

        return () => socket.off("receive_message");
    }, [authUser, queryClient]);

    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Add this effect to mark messages as read when chat is selected
    useEffect(() => {
        if (selectedUser && notifications) {
            const unreadNotifications = notifications
                .filter(n => n.type === "message" && 
                           n.from._id === selectedUser._id && 
                           !n.read)
                .map(n => n._id);
            
            if (unreadNotifications.length > 0) {
                markAsRead(unreadNotifications);
                // Force refresh notifications
                queryClient.invalidateQueries(["notifications"]);
            }
        }
    }, [selectedUser?._id, notifications]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientId: selectedUser._id,
                    text: message
                })
            });

            const newMessage = await res.json();
            socket.emit("send_message", newMessage);
            setMessages(prev => [...prev, newMessage]);
            setMessage("");

            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const renderConversation = (conversation) => {
        const hasUnreadMessages = notifications?.some(
            n => n.type === "message" && 
                n.from._id === conversation._id && 
                !n.read &&
                selectedUser?._id !== conversation._id
        );

        return (
            <div
                key={conversation._id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                    selectedUser?._id === conversation._id ? "bg-gray-800" : ""
                }`}
                onClick={() => {
                    setSelectedUser(conversation);
                }}
            >
                <img
                    src={conversation.profileImg || "/avatar-placeholder.png"}
                    className="w-12 h-12 rounded-full"
                    alt={conversation.username}
                />
                <div className="flex-1">
                    <h3 className={`font-semibold ${hasUnreadMessages ? "text-white" : "text-gray-300"}`}>
                        {conversation.fullName}
                    </h3>
                    <p className={`text-sm ${
                        hasUnreadMessages ? "text-white font-medium" : "text-gray-400"
                    }`}>
                        {conversation.lastMessage?.text || "No messages yet"}
                    </p>
                </div>
                {hasUnreadMessages && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
            <div className="flex h-screen">
                <div className="w-1/3 border-r border-gray-700 p-4">
                    <h2 className="text-xl font-bold mb-4">Messages</h2>
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="space-y-4">
                            {userToMessage && !conversations?.find(c => c._id === userToMessage._id) && (
                                <div
                                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                                        selectedUser?._id === userToMessage._id ? "bg-gray-800" : ""
                                    }`}
                                    onClick={() => setSelectedUser({
                                        _id: userToMessage._id,
                                        username: userToMessage.username,
                                        fullName: userToMessage.fullName,
                                        profileImg: userToMessage.profileImg,
                                    })}
                                >
                                    <img
                                        src={userToMessage.profileImg || "/avatar-placeholder.png"}
                                        className="w-12 h-12 rounded-full"
                                        alt={userToMessage.username}
                                    />
                                    <div>
                                        <h3 className="font-semibold">{userToMessage.fullName}</h3>
                                        <p className="text-sm text-gray-400">New conversation</p>
                                    </div>
                                </div>
                            )}
                            {conversations?.map((conversation) => renderConversation(conversation))}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    {selectedUser ? (
                        <>
                            <div className="p-4 border-b border-gray-700">
                                <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {isLoadingMessages ? (
                                    <div className="flex justify-center">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${
                                                msg.sender._id === authUser._id ? "justify-end" : "justify-start"
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg p-3 ${
                                                    msg.sender._id === authUser._id
                                                        ? "bg-primary text-white"
                                                        : "bg-gray-800"
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="flex-1 bg-gray-800 rounded-full px-4 py-2 focus:outline-none"
                                        placeholder="Type a message..."
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-full"
                                        disabled={!message.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
