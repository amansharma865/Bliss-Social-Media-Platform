import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const EditProfileModal = ({ authUser }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
    link: "",
    newPassword: "",
    currentPassword: "",
  });

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const queryClient = useQueryClient();

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (formData) => {
      try {
        const res = await fetch(`/api/users/update`, {
          method: "PUT",  // Changed from POST to PUT to match backend
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(["authUser"]);
      queryClient.invalidateQueries(["userProfile"]);
      document.getElementById("edit_profile_modal").close();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex =
       /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateFullName = (value) => {
    // Full name cannot start with a space
    return value.trim().length > 0 && !value.startsWith(" ");
  };

  const validateUsername = (value) => {
    // Username can contain letters, numbers, special characters, but cannot start or end with space
    const usernameRegex = /^[^\s](?!.*\s$)[A-Za-z0-9._-]+$/;
    return usernameRegex.test(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validation checks
    if (name === "email") {
      if (validateEmail(value)) {
        setEmailError("");
      } else {
        setEmailError("Email must start with a letter and be in a valid format.");
      }
    }

    if (name === "fullName") {
      if (validateFullName(value)) {
        setNameError("");
      } else {
        setNameError("Full name cannot start with a space.");
      }
    }

    if (name === "username") {
      if (validateUsername(value)) {
        setUsernameError("");
      } else {
        setUsernameError("Username can contain letters, numbers, and special characters but cannot start or end with a space.");
      }
    }
  };

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName,
        username: authUser.username,
        email: authUser.email,
        bio: authUser.bio,
        link: authUser.link,
        newPassword: "",
        currentPassword: "",
      });
    }
  }, [authUser]);

  const isFormValid = () => {
    return !emailError && !nameError && !usernameError && formData.email !== "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const dataToUpdate = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        link: formData.link
      };
      
      // Only include password fields if they are filled
      if (formData.currentPassword && formData.newPassword) {
        dataToUpdate.currentPassword = formData.currentPassword;
        dataToUpdate.newPassword = formData.newPassword;
      }
      
      updateProfile(dataToUpdate);
    }
  };

  return (
    <>
      <button
        className="btn btn-outline rounded-full btn-sm"
        onClick={() => document.getElementById("edit_profile_modal").showModal()}
      >
        Edit profile
      </button>
      <dialog id="edit_profile_modal" className="modal">
        <div className="modal-box border rounded-md border-gray-700 shadow-md">
          <h3 className="font-bold text-lg my-3">Update Profile</h3>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Full Name"
                className={`flex-1 input border rounded p-2 input-md ${
                  nameError ? "border-red-500" : "border-gray-700"
                }`}
                value={formData.fullName}
                name="fullName"
                onChange={handleInputChange}
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
              <input
                type="text"
                placeholder="Username"
                className={`flex-1 input border rounded p-2 input-md ${
                  usernameError ? "border-red-500" : "border-gray-700"
                }`}
                value={formData.username}
                name="username"
                onChange={handleInputChange}
              />
              {usernameError && <p className="text-red-500 text-sm">{usernameError}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                placeholder="Email"
                className={`flex-1 input border rounded p-2 input-md ${
                  emailError ? "border-red-500" : "border-gray-700"
                }`}
                value={formData.email}
                name="email"
                onChange={handleInputChange}
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
              <textarea
                placeholder="Bio"
                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                value={formData.bio}
                name="bio"
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="password"
                placeholder="Current Password"
                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                value={formData.currentPassword}
                name="currentPassword"
                onChange={handleInputChange}
              />
              <input
                type="password"
                placeholder="New Password"
                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                value={formData.newPassword}
                name="newPassword"
                onChange={handleInputChange}
              />
            </div>
            <input
              type="text"
              placeholder="Link"
              className="flex-1 input border border-gray-700 rounded p-2 input-md"
              value={formData.link}
              name="link"
              onChange={handleInputChange}
            />
            <button
              className={`btn btn-primary rounded-full btn-sm text-white ${
                isFormValid() ? "" : "btn-disabled"
              }`}
            >
              {isUpdatingProfile ? "Updating..." : "Update"}
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="outline-none">close</button>
        </form>
      </dialog>
    </>
  );
};

export default EditProfileModal;
