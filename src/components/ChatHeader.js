
import React, { useEffect, useRef, useState } from "react";
import {
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaUserCircle,
  FaArrowLeft,
  FaSearch,
} from "react-icons/fa";

function ChatHeader({
  selectedUser,
  onRemoveFriend,
  onClearChat,
  onBack,
  messageSearch,
  onMessageSearchChange,
  searchResults,
  onSearchResultClick,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showMenu]);

  return (
    <div className="relative flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 transition hover:text-white"
        >
          <FaArrowLeft />
        </button>

        <FaUserCircle size={42} className="text-slate-400" />

        <div>
          <h2 className="text-lg font-semibold">{selectedUser}</h2>
          <p className="text-xs text-slate-400">
            Secure conversation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-gray-400">
        <FaPhone className="cursor-pointer transition hover:text-green-400" />

        <FaVideo className="cursor-pointer transition hover:text-green-400" />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((previous) => !previous)}
            className="transition hover:text-green-400"
          >
            <FaEllipsisV />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
              <div className="border-b border-slate-700 p-3">
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3">
                  <FaSearch className="text-slate-500" />

                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(event) =>
                      onMessageSearchChange(event.target.value)
                    }
                    placeholder="Search messages..."
                    className="w-full bg-transparent py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              {messageSearch.trim() && (
                <div className="max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-400">
                      No matching messages found
                    </p>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        type="button"
                        key={result.id}
                        onClick={() => {
                          onSearchResultClick(result.id);
                          setShowMenu(false);
                        }}
                        className="w-full border-b border-slate-700 px-4 py-3 text-left hover:bg-slate-700"
                      >
                        <p className="truncate text-sm text-white">
                          {result.decryptedText}
                        </p>

                        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {result.sender === "me"
                              ? "You"
                              : selectedUser}
                          </span>

                          <span>
                            {result.createdAt
                              ? new Date(
                                  result.createdAt
                                ).toLocaleString([], {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="p-2">
                {messageSearch && (
                  <button
                    type="button"
                    onClick={() => onMessageSearchChange("")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-yellow-400 hover:bg-slate-700"
                  >
                    Clear Search
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onClearChat();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                >
                  Clear Chat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onRemoveFriend();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
                >
                  Remove Friend
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;

