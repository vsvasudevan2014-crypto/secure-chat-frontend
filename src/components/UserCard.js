import React from "react";

function UserCard({
  user,
  selectedUser,
  setSelectedUser,
  unreadCount = 0,
  lastMessageTime = null,
  lastMessagePreview = "",
}) {
  const isSelected =
    selectedUser?._id === user._id;

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    const messageDate = new Date(timestamp);

    if (Number.isNaN(messageDate.getTime())) {
      return "";
    }

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );

    const dayDifference = Math.round(
      (today.getTime() - messageDay.getTime()) /
        (24 * 60 * 60 * 1000)
    );

    if (dayDifference === 0) {
      return messageDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    if (dayDifference === 1) {
      return "Yesterday";
    }

    if (
      messageDate.getFullYear() ===
      now.getFullYear()
    ) {
      return messageDate.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
      });
    }

    return messageDate.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <button
      type="button"
      onClick={() => setSelectedUser(user)}
      className={`flex w-full items-center gap-3 border-b border-slate-800 p-4 text-left transition ${
        isSelected
          ? "bg-slate-700"
          : "hover:bg-slate-800"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
        {user.username
          ?.charAt(0)
          .toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate ${
            unreadCount > 0
              ? "font-semibold text-white"
              : "font-medium text-white"
          }`}
        >
          {user.username}
        </p>

        <p
          className={`truncate text-xs ${
            unreadCount > 0
              ? "font-medium text-slate-200"
              : "text-slate-400"
          }`}
        >
          {lastMessagePreview || "No messages yet"}
        </p>
      </div>

      <div className="flex min-w-[58px] shrink-0 flex-col items-end gap-1">
        {lastMessageTime && (
          <span
            className={`whitespace-nowrap text-[11px] ${
              unreadCount > 0
                ? "font-medium text-green-400"
                : "text-slate-400"
            }`}
          >
            {formatLastMessageTime(
              lastMessageTime
            )}
          </span>
        )}

        {unreadCount > 0 && (
          <span className="flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-green-500 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

export default UserCard;