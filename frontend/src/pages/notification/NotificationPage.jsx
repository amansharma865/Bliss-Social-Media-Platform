import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "../../components/common/LoadingSpinner";

import { IoSettingsOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";

const NotificationPage = () => {
	const queryClient = useQueryClient();
	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/notifications");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
	});

	const { mutate: deleteNotifications } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch("/api/notifications", {
					method: "DELETE",
				});
				const data = await res.json();

				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Notifications deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return (
		<>
			<div className='flex-[4_4_0] border-l border-r border-gray-700 min-h-screen'>
				<div className='flex justify-between items-center p-4 border-b border-gray-700'>
					<p className='font-bold'>Notifications</p>
					<div className='dropdown '>
						<div tabIndex={0} role='button' className='m-1'>
							<IoSettingsOutline className='w-4' />
						</div>
						<ul
							tabIndex={0}
							className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
						>
							<li>
								<a onClick={deleteNotifications}>Delete all notifications</a>
							</li>
						</ul>
					</div>
				</div>
				{isLoading && (
					<div className='flex justify-center h-full items-center'>
						<LoadingSpinner size='lg' />
					</div>
				)}
				{!isLoading && notifications?.length === 0 && <div className='text-center p-4 font-bold'>No notifications 🤔</div>}
				{notifications?.map((notification) => {
					// make `from` safe — backend may return null
					const from = notification.from || { username: "unknown", profileImg: "/avatar-placeholder.png" };
					const username = from.username || "unknown";
					const profileImg = from.profileImg || "/avatar-placeholder.png";
					const isUnreadMessage = notification.type === "message" && !notification.read;

					// fallback link (if username is 'unknown' use '#')
					const to =
						username === "unknown"
							? "#"
							: notification.type === "message"
							? `/chat?user=${username}`
							: `/profile/${username}`;

					return (
						<div
							className={`border-b border-gray-700 ${isUnreadMessage ? "bg-gray-800 bg-opacity-40" : ""}`}
							key={notification._id}
						>
							<div className='flex gap-2 p-4'>
								{notification.type === "follow" && <FaUser className='w-7 h-7 text-primary' />}
								{notification.type === "like" && <FaHeart className='w-7 h-7 text-red-500' />}
								{notification.type === "message" && (
									<IoChatbubbleEllipsesOutline
										className={`w-7 h-7 ${notification.read ? "text-blue-500" : "text-white"}`}
									/>
								)}

								<Link to={to} className={`flex items-center gap-2 ${isUnreadMessage ? "text-white" : ""}`}>
									<div className='avatar'>
										<div className='w-8 rounded-full'>
											<img src={profileImg} alt={username} />
										</div>
									</div>
									<div className='flex gap-1'>
										<span className={`font-bold ${isUnreadMessage ? "text-white" : ""}`}>@{username}</span>{" "}
										<span className={isUnreadMessage ? "text-white" : ""}>
											{notification.type === "follow" && "followed you"}
											{notification.type === "like" && "liked your post"}
											{notification.type === "message" && "sent you a message"}
										</span>
									</div>
								</Link>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
};
export default NotificationPage;