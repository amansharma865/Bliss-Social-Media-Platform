import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import useFollow from "../../hooks/useFollow";

const FollowModal = ({ userId, type, onClose }) => {
  const navigate = useNavigate();
  const { data: users, isLoading } = useQuery({
    queryKey: [`user${type}`, userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/${type.toLowerCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    }
  });

  const { follow, isPending } = useFollow();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const handleUserClick = (username) => {
    document.getElementById("follow_modal").close();
    onClose();
    navigate(`/profile/${username}`);
  };

  return (
    <dialog id="follow_modal" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{type}</h3>
        {isLoading ? (
          <LoadingSpinner />
        ) : users?.length === 0 ? (
          <p className="text-center text-gray-500">No {type.toLowerCase()} yet</p>
        ) : (
          <div className="flex flex-col gap-4">
            {users?.map((user) => (
              <div key={user._id} className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                  onClick={() => handleUserClick(user.username)}
                >
                  <img
                    src={user.profileImg || "/avatar-placeholder.png"}
                    className="w-10 h-10 rounded-full"
                    alt={user.username}
                  />
                  <div>
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-gray-500 text-sm">@{user.username}</p>
                  </div>
                </div>
                {authUser?._id !== user._id && (
                  <button
                    className="btn btn-outline btn-sm rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      follow(user._id);
                    }}
                    disabled={isPending}
                  >
                    {isPending ? "Loading..." : authUser?.following?.includes(user._id) ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};

export default FollowModal;
