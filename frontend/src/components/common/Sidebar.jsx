import XSvg from "../svgs/X";
import sign from "../../assets/bg_sign.png";

import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5"; // Add this import
import { Link, useLocation } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000");

const Sidebar = () => {
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const currentChatUser = queryParams.get('user');
	
	const queryClient = useQueryClient();
	const { mutate: logout } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch("/api/auth/logout", {
					method: "POST",
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: () => {
			toast.error("Logout failed");
		},
	});
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: notifications } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			return data;
		}
	});

	const unreadMessages = notifications?.filter(n => {
		// Check if we're in the chat page
		const isInChat = location.pathname === '/chat';
		const currentChatUsername = new URLSearchParams(location.search).get('user');
		
		return n.type === "message" && 
			   !n.read && 
			   (!isInChat || n.from.username !== currentChatUsername);
	}).length || 0;

	const unreadNotifications = notifications?.filter(n => !n.read && n.type !== "message").length || 0;

	useEffect(() => {
		if (authUser) {
			socket.emit("setup", authUser._id);

			socket.on("new_notification", () => {
				queryClient.invalidateQueries(["notifications"]);
			});

			socket.on("new_message", () => {
				queryClient.invalidateQueries(["notifications"]);
			});

			return () => {
				socket.off("new_notification");
				socket.off("new_message");
			};
		}
	}, [authUser, queryClient]);

	return (
		<div className='md:flex-[2_2_0] w-18 max-w-52'>
			<div className='sticky top-0 left-0 h-screen flex flex-col border-r border-gray-700 w-20 md:w-full'>
				<Link to='/' className='flex justify-center md:justify-start'>
					<img src={sign} className="w-20 h-20"/>
				</Link>
				<ul className='flex flex-col gap-3 mt-4'>
					<li className='flex justify-center md:justify-start'>
						<Link
							to='/'
							className='flex gap-3 items-center hover:bg-purple-950 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'
						>
							<MdHomeFilled className='w-8 h-8' />
							<span className='text-lg hidden md:block'>Home</span>
						</Link>
					</li>
					<li className='flex justify-center md:justify-start'>
						<Link
							to='/notifications'
							className='flex gap-3 items-center hover:bg-purple-950 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer relative'
						>
							<IoNotifications className='w-6 h-6' />
							<span className='text-lg hidden md:block'>Notifications</span>
							{unreadNotifications > 0 && (
								<div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
									{unreadNotifications}
								</div>
							)}
						</Link>
					</li>

					{/* Messages item moved before profile */}
					<li className='flex justify-center md:justify-start'>
						<Link
							to='/chat'
							className='flex gap-3 items-center hover:bg-purple-950 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer relative'
						>
							<IoChatbubbleEllipsesOutline className='w-6 h-6' />
							<span className='text-lg hidden md:block'>Messages</span>
							{unreadMessages > 0 && (
								<div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
									{unreadMessages}
								</div>
							)}
						</Link>
					</li>

					{/* Profile item moved after messages */}
					<li className='flex justify-center md:justify-start'>
						<Link
							to={`/profile/${authUser?.username}`}
							className='flex gap-3 items-center hover:bg-purple-950 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'
						>
							<FaUser className='w-6 h-6' />
							<span className='text-lg hidden md:block'>Profile</span>
						</Link>
					</li>
				</ul>
				{authUser && (
					<Link
						to={`/profile/${authUser.username}`}
						className='mt-auto mb-10 flex gap-2 items-start transition-all duration-300 hover:bg-[#181818] py-2 px-4 rounded-full'
					>
						<div className='avatar hidden md:inline-flex'>
							<div className='w-8 rounded-full'>
								<img src={authUser?.profileImg || "/avatar-placeholder.png"} />
							</div>
						</div>
						<div className='flex justify-between flex-1'>
							<div className='hidden md:block'>
								<p className='text-white font-bold text-sm w-20 truncate'>{authUser?.fullName}</p>
								<p className='text-slate-500 text-sm'>@{authUser?.username}</p>
							</div>
							<BiLogOut
								className='w-5 h-5 cursor-pointer'
								onClick={(e) => {
									e.preventDefault();
									logout();
								}}
							/>
						</div>
					</Link>
				)}
			</div>
		</div>
	);
};
export default Sidebar;