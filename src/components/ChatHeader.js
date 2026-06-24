import React, { useState } from "react";
import {
  FaArrowLeft,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUserMinus,
} from "react-icons/fa";

function ChatHeader({
  selectedUser,
  onRemoveFriend,
  onClearChat,
  onBack,
  messageSearch,
  onMessageSearchChange,
  searchResults = [],
  onSearchResultClick,
}) {
  const [showSearch, setShowSearch] =
    useState(false);

  const closeSearch = () => {
    setShowSearch(false);
    onMessageSearchChange("");
  };

  const handleSearchResultClick = (
    messageId
  ) => {
    onSearchResultClick(messageId);
    closeSearch();
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-slate-700 bg-slate-900">
      <div className="flex min-h-[64px] items-center justify-between gap-2 px-2 py-2 sm:px-4">
        {/* Friend information */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Back to friends"
            title="Back to friends"
          >
            <FaArrowLeft />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 font-bold text-white">
            {selectedUser
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white sm:text-lg">
              {selectedUser}
            </h2>

            <p className="text-xs text-green-400">
              Secure conversation
            </p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() =>
              setShowSearch(
                (previousValue) =>
                  !previousValue
              )
            }
            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
              showSearch
                ? "bg-blue-500 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            aria-label="Search messages"
            title="Search messages"
          >
            {showSearch ? (
              <FaTimes />
            ) : (
              <FaSearch />
            )}
          </button>

          <button
            type="button"
            onClick={onClearChat}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-red-400"
            aria-label="Clear chat"
            title="Clear chat"
          >
            <FaTrash />
          </button>

          <button
            type="button"
            onClick={onRemoveFriend}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-red-400"
            aria-label="Remove friend"
            title="Remove friend"
          >
            <FaUserMinus />
          </button>
        </div>
      </div>

      {/* Message search section */}
      {showSearch && (
        <div className="border-t border-slate-800 bg-slate-950 px-3 py-3 sm:px-4">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <input
              type="text"
              value={messageSearch}
              onChange={(event) =>
                onMessageSearchChange(
                  event.target.value
                )
              }
              placeholder="Search messages..."
              autoFocus
              className="w-full rounded-xl bg-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {messageSearch && (
              <button
                type="button"
                onClick={() =>
                  onMessageSearchChange("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                aria-label="Clear message search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {messageSearch.trim() && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
              {searchResults.length ===
              0 ? (
                <p className="px-4 py-4 text-center text-sm text-slate-400">
                  No matching messages
                  found
                </p>
              ) : (
                searchResults.map(
                  (message, index) => (
                    <button
                      type="button"
                      key={
                        message.id ||
                        message.messageId ||
                        index
                      }
                      onClick={() =>
                        handleSearchResultClick(
                          message.id ||
                            message.messageId
                        )
                      }
                      className="block w-full border-b border-slate-800 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-800"
                    >
                      <p className="truncate text-sm text-white">
                        {message.decryptedText ||
                          "Message"}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {message.sender ===
                        "me"
                          ? "You"
                          : selectedUser}

                        {message.createdAt
                          ? ` • ${new Date(
                              message.createdAt
                            ).toLocaleString(
                              [],
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}`
                          : ""}
                      </p>
                    </button>
                  )
                )
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default ChatHeader;