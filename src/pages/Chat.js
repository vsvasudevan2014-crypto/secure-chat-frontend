import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperclip, FaReply, FaShare, FaTimes } from "react-icons/fa";

import {
  decryptMessage,
  encryptMessage,
  generateChatKey,
} from "../utils/crypto";

import socket from "../services/socket";
import API from "../services/api";
import { uploadAttachment } from "../services/attachmentService";

import UserCard from "../components/UserCard";
import ChatHeader from "../components/ChatHeader";
import AttachmentMessage from "../services/AttachmentMessage";

function Chat() {
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const typingTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const loggedInUsername = sessionStorage.getItem("username");

  const loggedInEmail = sessionStorage.getItem("email");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [replyingTo, setReplyingTo] = useState(null);

  const [messageSearch, setMessageSearch] = useState("");

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const [typingUser, setTypingUser] = useState(null);

  const [searchUsername, setSearchUsername] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const [friendRequests, setFriendRequests] = useState([]);

  const [friendSearch, setFriendSearch] = useState("");

  const [unreadCounts, setUnreadCounts] = useState({});

  const [lastMessageTimes, setLastMessageTimes] = useState({});

  const [lastMessagePreviews, setLastMessagePreviews] = useState({});

  const [selectionMode, setSelectionMode] = useState(false);

  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  const [showForwardModal, setShowForwardModal] = useState(false);

  const [forwardRecipientIds, setForwardRecipientIds] = useState([]);

  const [forwardSearch, setForwardSearch] = useState("");

  const [isForwarding, setIsForwarding] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForwardSelection = () => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
    setShowForwardModal(false);
    setForwardRecipientIds([]);
    setForwardSearch("");
  };

  const getSidebarMessagePreview = (message, friendId) => {
    if (!message) {
      return "";
    }

    const currentUserId = sessionStorage.getItem("userId");

    const sentByCurrentUser = message.senderId?.toString() === currentUserId;

    const prefix = sentByCurrentUser ? "You: " : "";

    if (message.messageType === "image") {
      return `${prefix}📷 Photo`;
    }

    if (message.messageType === "file") {
      return `${prefix}📎 ${message.attachmentOriginalName || "File"}`;
    }

    if (typeof message.text !== "string" || !message.text) {
      return `${prefix}Message`;
    }

    try {
      const chatKey = generateChatKey(currentUserId, friendId);

      const decryptedText = decryptMessage(message.text, chatKey);

      if (typeof decryptedText === "string" && decryptedText.trim()) {
        return `${prefix}${decryptedText.trim()}`;
      }

      return `${prefix}Message`;
    } catch (error) {
      console.error("Sidebar message decryption failed:", error);

      return `${prefix}Message`;
    }
  };

  const updateFriendActivity = (friendId, message) => {
    if (!friendId || !message) {
      return;
    }

    const createdAt = message.createdAt || new Date().toISOString();

    const preview = getSidebarMessagePreview(message, friendId);

    setLastMessageTimes((previousTimes) => ({
      ...previousTimes,
      [friendId]: createdAt,
    }));

    setLastMessagePreviews((previousPreviews) => ({
      ...previousPreviews,
      [friendId]: preview,
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const fetchFriends = async () => {
    try {
      const currentUserId = sessionStorage.getItem("userId");

      const response = await API.get(`/auth/friends/${currentUserId}`);

      setUsers(response.data || []);
    } catch (error) {
      console.log("Failed to fetch friends:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const currentUserId = sessionStorage.getItem("userId");

      const response = await API.get(`/auth/friend-requests/${currentUserId}`);

      setFriendRequests(response.data || []);
    } catch (error) {
      console.log("Failed to fetch friend requests:", error);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const currentUserId = sessionStorage.getItem("userId");

      const response = await API.get(`/messages/unread/${currentUserId}`);

      setUnreadCounts(response.data || {});
    } catch (error) {
      console.log("Failed to fetch unread counts:", error);
    }
  };

  const fetchRecentMessageTimes = async () => {
    try {
      const currentUserId = sessionStorage.getItem("userId");

      const response = await API.get(`/messages/recent/${currentUserId}`);

      const recentChats = response.data || {};

      const messageTimes = {};
      const messagePreviews = {};

      Object.entries(recentChats).forEach(([friendId, message]) => {
        if (!message || typeof message !== "object") {
          return;
        }

        messageTimes[friendId] = message.createdAt || null;

        messagePreviews[friendId] = getSidebarMessagePreview(message, friendId);
      });

      setLastMessageTimes(messageTimes);

      setLastMessagePreviews(messagePreviews);
    } catch (error) {
      console.log("Failed to fetch recent messages:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      const currentUserId = sessionStorage.getItem("userId");

      const response = await API.get(
        `/messages/${currentUserId}/${selectedUser._id}`,
      );

      const formattedMessages = (response.data || []).map((message) => ({
        id: message.messageId,
        messageId: message.messageId,
        text: message.text || "",

        sender: message.senderId.toString() === currentUserId ? "me" : "other",

        senderId: message.senderId.toString(),

        receiverId: message.receiverId.toString(),

        createdAt: message.createdAt,

        status: message.status || "sent",

        messageType: message.messageType || "text",

        attachmentStoredName: message.attachmentStoredName || null,

        attachmentOriginalName: message.attachmentOriginalName || null,

        attachmentMimeType: message.attachmentMimeType || null,

        attachmentSize: message.attachmentSize || null,

        replyToMessageId: message.replyToMessageId || null,

        replyToText: message.replyToText || null,

        replyToSenderId: message.replyToSenderId
          ? message.replyToSenderId.toString()
          : null,

        isForwarded: Boolean(message.isForwarded),

        forwardBatchId: message.forwardBatchId || null,

        originalMessageId: message.originalMessageId || null,
      }));

      setMessages(formattedMessages);
      setSelectedMessageId(null);
      setReplyingTo(null);

      resetForwardSelection();

      messageRefs.current = {};

      setUnreadCounts((previousCounts) => ({
        ...previousCounts,
        [selectedUser._id]: 0,
      }));
    } catch (error) {
      console.log("Failed to fetch messages:", error);
    }
  };

  const handleBackToWelcome = () => {
    if (selectedUser) {
      socket.emit("stop_typing", {
        receiverId: selectedUser._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = null;
    }

    setSelectedUser(null);
    setMessages([]);
    setInput("");
    setSelectedMessageId(null);
    setReplyingTo(null);
    setTypingUser(null);
    setMessageSearch("");
    setHighlightedMessageId(null);
    setIsUploading(false);
    setUploadProgress(0);

    resetForwardSelection();

    messageRefs.current = {};
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchUnreadCounts();
    fetchRecentMessageTimes();
  }, []);

  useEffect(() => {
    socket.auth = {
      token: sessionStorage.getItem("token"),
    };

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      setSelectedMessageId(null);
      setReplyingTo(null);
      setTypingUser(null);
      setMessageSearch("");
      setHighlightedMessageId(null);

      resetForwardSelection();

      messageRefs.current = {};

      return;
    }

    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      const currentUserId = sessionStorage.getItem("userId");

      if (data.receiverId !== currentUserId) {
        return;
      }

      const receivedAt = data.createdAt || new Date().toISOString();

      const receivedMessage = {
        id: data.id || data.messageId || Date.now().toString(),

        messageId: data.id || data.messageId,

        text: data.text || "",
        sender: "other",
        senderId: data.senderId,
        receiverId: data.receiverId,
        createdAt: receivedAt,
        status: data.status || "sent",

        messageType: data.messageType || "text",

        attachmentStoredName: data.attachmentStoredName || null,

        attachmentOriginalName: data.attachmentOriginalName || null,

        attachmentMimeType: data.attachmentMimeType || null,

        attachmentSize: data.attachmentSize || null,

        replyToMessageId: data.replyToMessageId || null,

        replyToText: data.replyToText || null,

        replyToSenderId: data.replyToSenderId || null,

        isForwarded: Boolean(data.isForwarded),

        forwardBatchId: data.forwardBatchId || null,

        originalMessageId: data.originalMessageId || null,
      };

      updateFriendActivity(data.senderId, receivedMessage);

      if (selectedUser && selectedUser._id === data.senderId) {
        setMessages((previousMessages) => [
          ...previousMessages,
          receivedMessage,
        ]);

        setTypingUser(null);

        socket.emit("message_seen", {
          messageId: receivedMessage.id,
        });
      } else {
        setUnreadCounts((previousCounts) => ({
          ...previousCounts,

          [data.senderId]: (previousCounts[data.senderId] || 0) + 1,
        }));
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [selectedUser]);

  useEffect(() => {
    const handleUserTyping = (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setTypingUser(data.username);
      }
    };

    const handleUserStopTyping = (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setTypingUser(null);
      }
    };

    socket.on("user_typing", handleUserTyping);

    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);

      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [selectedUser]);

  useEffect(() => {
    const handleMessageSent = (data) => {
      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                status: "sent",
                createdAt: data.createdAt || message.createdAt,
              }
            : message,
        ),
      );
    };

    const handleMessageFailed = (data) => {
      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                status: "failed",
              }
            : message,
        ),
      );
    };

    const handleMessageSeen = (data) => {
      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                status: "seen",
              }
            : message,
        ),
      );
    };

    socket.on("message_sent", handleMessageSent);

    socket.on("message_failed", handleMessageFailed);

    socket.on("message_seen_update", handleMessageSeen);

    return () => {
      socket.off("message_sent", handleMessageSent);

      socket.off("message_failed", handleMessageFailed);

      socket.off("message_seen_update", handleMessageSeen);
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    messages.forEach((message) => {
      if (
        message.sender === "other" &&
        message.senderId === selectedUser._id &&
        message.status !== "seen"
      ) {
        socket.emit("message_seen", {
          messageId: message.id,
        });
      }
    });
  }, [selectedUser, messages]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (showForwardModal) {
        setShowForwardModal(false);
        setForwardRecipientIds([]);
        setForwardSearch("");
        return;
      }

      if (selectionMode) {
        resetForwardSelection();
        return;
      }

      if (replyingTo) {
        setReplyingTo(null);
        return;
      }

      handleBackToWelcome();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showForwardModal, selectionMode, replyingTo, selectedUser]);

  useEffect(() => {
    if (!messageSearch.trim()) {
      scrollToBottom();
    }
  }, [messages, typingUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (event) => {
    const value = event.target.value;

    setInput(value);

    if (!selectedUser) {
      return;
    }

    if (value.trim()) {
      socket.emit("typing", {
        receiverId: selectedUser._id,
      });
    } else {
      socket.emit("stop_typing", {
        receiverId: selectedUser._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  const getChatKey = (userId) => {
    const currentUserId = sessionStorage.getItem("userId");

    return generateChatKey(currentUserId, userId);
  };

  const createMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const createEncryptedReplyText = (chatEncryptionKey) => {
    if (!replyingTo) {
      return null;
    }

    return encryptMessage(replyingTo.decryptedText, chatEncryptionKey);
  };

  const sendMessage = () => {
    if (!input.trim() || !selectedUser) {
      return;
    }

    const currentUserId = sessionStorage.getItem("userId");

    const chatEncryptionKey = getChatKey(selectedUser._id);

    const encryptedText = encryptMessage(input.trim(), chatEncryptionKey);

    const newMessageId = createMessageId();

    const messageData = {
      id: newMessageId,
      messageId: newMessageId,
      text: encryptedText,
      sender: "me",
      senderId: currentUserId,
      receiverId: selectedUser._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      messageType: "text",
      attachmentStoredName: null,
      attachmentOriginalName: null,
      attachmentMimeType: null,
      attachmentSize: null,

      replyToMessageId: replyingTo?.id || null,

      replyToText: createEncryptedReplyText(chatEncryptionKey),

      replyToSenderId: replyingTo?.senderId || null,

      isForwarded: false,
      forwardBatchId: null,
      originalMessageId: null,
    };

    updateFriendActivity(selectedUser._id, messageData);

    setMessages((previousMessages) => [...previousMessages, messageData]);

    socket.emit("stop_typing", {
      receiverId: selectedUser._id,
    });

    socket.emit("send_message", messageData);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = null;
    }

    setInput("");
    setReplyingTo(null);
    setSelectedMessageId(null);
  };

  const handleAttachmentSelect = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !selectedUser || selectionMode || isUploading) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10 MB");

      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const attachment = await uploadAttachment(file, setUploadProgress);

      const currentUserId = sessionStorage.getItem("userId");

      const chatEncryptionKey = getChatKey(selectedUser._id);

      const newMessageId = createMessageId();

      const messageData = {
        id: newMessageId,
        messageId: newMessageId,
        text: "",
        sender: "me",
        senderId: currentUserId,
        receiverId: selectedUser._id,

        createdAt: new Date().toISOString(),

        status: "sending",

        messageType: attachment.isImage ? "image" : "file",

        attachmentStoredName: attachment.storedName,

        attachmentOriginalName: attachment.originalName,

        attachmentMimeType: attachment.mimeType,

        attachmentSize: attachment.size,

        uploadToken: attachment.uploadToken,

        replyToMessageId: replyingTo?.id || null,

        replyToText: createEncryptedReplyText(chatEncryptionKey),

        replyToSenderId: replyingTo?.senderId || null,

        isForwarded: false,
        forwardBatchId: null,
        originalMessageId: null,
      };

      updateFriendActivity(selectedUser._id, messageData);

      setMessages((previousMessages) => [...previousMessages, messageData]);

      socket.emit("send_message", messageData);

      setReplyingTo(null);
      setSelectedMessageId(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    socket.disconnect();
    sessionStorage.clear();
    navigate("/");
  };

  const handleSearchUsers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await API.get(
        `/auth/search/${encodeURIComponent(searchUsername.trim())}`,
      );

      const nonFriendUsers = (response.data || []).filter(
        (searchedUser) =>
          !users.some((friend) => friend._id === searchedUser._id),
      );

      setSearchResults(nonFriendUsers);
    } catch (error) {
      console.log("Search failed:", error);
    }
  };

  const handleSendRequest = async (toUserId) => {
    try {
      const response = await API.post("/auth/friend-request", {
        toUserId,
      });

      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (requestFromId) => {
    try {
      const response = await API.post("/auth/friend-request/accept", {
        requestFromId,
      });

      alert(response.data.message);

      await fetchFriendRequests();
      await fetchFriends();
      await fetchUnreadCounts();
      await fetchRecentMessageTimes();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestFromId) => {
    try {
      const response = await API.post("/auth/friend-request/reject", {
        requestFromId,
      });

      alert(response.data.message);

      await fetchFriendRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject friend request");
    }
  };

  const handleRemoveFriend = async () => {
    if (!selectedUser) {
      return;
    }

    const confirmRemove = window.confirm(
      `Remove ${selectedUser.username} from your friends?`,
    );

    if (!confirmRemove) {
      return;
    }

    try {
      const friendId = selectedUser._id;

      const response = await API.post("/auth/friend/remove", {
        friendId,
      });

      alert(response.data.message);

      setUsers((previousUsers) =>
        previousUsers.filter((user) => user._id !== friendId),
      );

      setUnreadCounts((previousCounts) => {
        const updatedCounts = {
          ...previousCounts,
        };

        delete updatedCounts[friendId];

        return updatedCounts;
      });

      setLastMessageTimes((previousTimes) => {
        const updatedTimes = {
          ...previousTimes,
        };

        delete updatedTimes[friendId];

        return updatedTimes;
      });

      setLastMessagePreviews((previousPreviews) => {
        const updatedPreviews = {
          ...previousPreviews,
        };

        delete updatedPreviews[friendId];

        return updatedPreviews;
      });

      handleBackToWelcome();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove friend");
    }
  };

  const handleClearChat = async () => {
    if (!selectedUser) {
      return;
    }

    const confirmClear = window.confirm(
      `Clear chat with ${selectedUser.username}?`,
    );

    if (!confirmClear) {
      return;
    }

    try {
      const currentUserId = sessionStorage.getItem("userId");

      const friendId = selectedUser._id;

      await API.delete(`/messages/clear/${currentUserId}/${friendId}`);

      setMessages([]);
      setSelectedMessageId(null);
      setReplyingTo(null);
      setMessageSearch("");
      setHighlightedMessageId(null);

      resetForwardSelection();

      messageRefs.current = {};

      setUnreadCounts((previousCounts) => ({
        ...previousCounts,
        [friendId]: 0,
      }));

      setLastMessageTimes((previousTimes) => {
        const updatedTimes = {
          ...previousTimes,
        };

        delete updatedTimes[friendId];

        return updatedTimes;
      });

      setLastMessagePreviews((previousPreviews) => {
        const updatedPreviews = {
          ...previousPreviews,
        };

        delete updatedPreviews[friendId];

        return updatedPreviews;
      });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to clear chat");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) {
      return;
    }

    const confirmDelete = window.confirm("Delete this message for you?");

    if (!confirmDelete) {
      return;
    }

    try {
      const currentUserId = sessionStorage.getItem("userId");

      await API.delete(`/messages/${messageId}/${currentUserId}`);

      setMessages((previousMessages) =>
        previousMessages.filter((message) => message.id !== messageId),
      );

      delete messageRefs.current[messageId];

      if (replyingTo?.id === messageId) {
        setReplyingTo(null);
      }

      setSelectedMessageId(null);
      setHighlightedMessageId(null);

      await fetchRecentMessageTimes();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete message");
    }
  };

  const handleSelectFriend = (friend) => {
    setSelectedUser(friend);
    setInput("");
    setMessageSearch("");
    setReplyingTo(null);
    setHighlightedMessageId(null);
    setSelectedMessageId(null);
    setTypingUser(null);
    setIsUploading(false);
    setUploadProgress(0);

    resetForwardSelection();

    messageRefs.current = {};

    setUnreadCounts((previousCounts) => ({
      ...previousCounts,
      [friend._id]: 0,
    }));
  };

  const getStatusText = (status) => {
    if (status === "sending") {
      return "Sending...";
    }

    if (status === "seen") {
      return "Seen";
    }

    if (status === "failed") {
      return "Failed";
    }

    return "Sent";
  };

  const getDecryptedText = (encryptedText) => {
    if (!encryptedText) {
      return "";
    }

    if (!selectedUser) {
      return encryptedText;
    }

    return decryptMessage(encryptedText, getChatKey(selectedUser._id));
  };

  const getMessagePreview = (message) => {
    if (message.messageType === "image") {
      return `Image: ${message.attachmentOriginalName || "Shared image"}`;
    }

    if (message.messageType === "file") {
      return `File: ${message.attachmentOriginalName || "Attachment"}`;
    }

    return getDecryptedText(message.text);
  };

  const getReplySenderName = (message) => {
    const currentUserId = sessionStorage.getItem("userId");

    if (message.replyToSenderId === currentUserId) {
      return "You";
    }

    return selectedUser?.username || "User";
  };

  const handleReplyMessage = (message) => {
    setReplyingTo({
      id: message.id,
      senderId: message.senderId,
      sender: message.sender,

      decryptedText: getMessagePreview(message),
    });

    setSelectedMessageId(null);
  };

  const startForwardSelection = (messageId) => {
    setReplyingTo(null);
    setSelectedMessageId(null);
    setSelectionMode(true);

    setSelectedMessageIds([messageId]);
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessageIds((previousIds) => {
      if (previousIds.includes(messageId)) {
        return previousIds.filter((id) => id !== messageId);
      }

      return [...previousIds, messageId];
    });
  };

  const openForwardModal = () => {
    if (selectedMessageIds.length === 0) {
      return;
    }

    setForwardRecipientIds([]);
    setForwardSearch("");
    setShowForwardModal(true);
  };

  const toggleForwardRecipient = (userId) => {
    setForwardRecipientIds((previousIds) => {
      if (previousIds.includes(userId)) {
        return previousIds.filter((id) => id !== userId);
      }

      return [...previousIds, userId];
    });
  };

  const handleForwardMessages = async () => {
    if (selectedMessageIds.length === 0 || forwardRecipientIds.length === 0) {
      return;
    }

    const currentUserId = sessionStorage.getItem("userId");

    const selectedMessages = messages.filter((message) =>
      selectedMessageIds.includes(message.id),
    );

    const selectedRecipients = users.filter((user) =>
      forwardRecipientIds.includes(user._id),
    );

    if (selectedMessages.length === 0 || selectedRecipients.length === 0) {
      return;
    }

    setIsForwarding(true);

    try {
      const baseTime = Date.now();

      const batchRoot = `forward-${baseTime}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      selectedRecipients.forEach((recipient, recipientIndex) => {
        const destinationKey = generateChatKey(currentUserId, recipient._id);

        selectedMessages.forEach((sourceMessage, messageIndex) => {
          const plainText = sourceMessage.text
            ? getDecryptedText(sourceMessage.text)
            : "";

          const encryptedText = plainText
            ? encryptMessage(plainText, destinationKey)
            : "";

          const newMessageId = `${Date.now()}-${recipientIndex}-${messageIndex}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

          const createdAt = new Date(
            baseTime + recipientIndex * selectedMessages.length + messageIndex,
          ).toISOString();

          const forwardedMessage = {
            id: newMessageId,
            messageId: newMessageId,
            text: encryptedText,
            sender: "me",
            senderId: currentUserId,
            receiverId: recipient._id,
            createdAt,
            status: "sending",

            messageType: sourceMessage.messageType || "text",

            attachmentStoredName: sourceMessage.attachmentStoredName || null,

            attachmentOriginalName:
              sourceMessage.attachmentOriginalName || null,

            attachmentMimeType: sourceMessage.attachmentMimeType || null,

            attachmentSize: sourceMessage.attachmentSize || null,

            replyToMessageId: null,

            replyToText: null,
            replyToSenderId: null,
            isForwarded: true,

            forwardBatchId: `${batchRoot}-${recipient._id}`,

            originalMessageId: sourceMessage.id,
          };

          updateFriendActivity(recipient._id, forwardedMessage);

          if (selectedUser?._id === recipient._id) {
            setMessages((previousMessages) => [
              ...previousMessages,
              forwardedMessage,
            ]);
          }

          socket.emit("send_message", forwardedMessage);
        });
      });

      resetForwardSelection();
    } catch (error) {
      console.error("Forwarding failed:", error);

      alert("Failed to forward messages");
    } finally {
      setIsForwarding(false);
    }
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];

    if (!messageElement) {
      return;
    }

    messageElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setSelectedMessageId(null);
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId((currentId) =>
        currentId === messageId ? null : currentId,
      );
    }, 2000);
  };

  const handleSearchResultClick = (messageId) => {
    resetForwardSelection();
    scrollToMessage(messageId);
  };

  const sortedFriends = [...users].sort((firstFriend, secondFriend) => {
    const firstTime = Date.parse(lastMessageTimes[firstFriend._id] || "") || 0;

    const secondTime =
      Date.parse(lastMessageTimes[secondFriend._id] || "") || 0;

    return secondTime - firstTime;
  });

  const filteredFriends = sortedFriends.filter((user) =>
    user.username.toLowerCase().includes(friendSearch.trim().toLowerCase()),
  );

  const filteredForwardFriends = users.filter((user) =>
    user.username.toLowerCase().includes(forwardSearch.trim().toLowerCase()),
  );

  const messageSearchResults = messageSearch.trim()
    ? messages
        .map((message) => ({
          ...message,

          decryptedText: getMessagePreview(message),
        }))
        .filter((message) =>
          message.decryptedText
            .toLowerCase()
            .includes(messageSearch.trim().toLowerCase()),
        )
    : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      <div className="shrink-0 border-b border-slate-700 bg-slate-900 p-4 text-xl font-bold shadow-md">
        Secure Chat
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-700 bg-slate-900">
          <div className="shrink-0 border-b border-slate-800 bg-slate-950 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 text-lg font-bold">
                {loggedInUsername?.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 overflow-hidden">
                <p className="truncate font-semibold text-white">
                  {loggedInUsername}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {loggedInEmail}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg bg-red-500 py-2 text-sm text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <h2 className="p-4 text-lg font-semibold">Friends</h2>

            <div className="border-b border-slate-800 px-4 pb-4">
              <input
                type="text"
                value={searchUsername}
                onChange={(event) => setSearchUsername(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchUsers();
                  }
                }}
                placeholder="Search username..."
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="button"
                onClick={handleSearchUsers}
                className="mt-2 w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white transition hover:bg-green-600"
              >
                Search
              </button>

              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-800 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.username}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {user.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendRequest(user._id)}
                        className="shrink-0 rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-b border-slate-800 px-4 py-4">
              <h3 className="mb-3 text-sm font-semibold">Friend Requests</h3>

              {friendRequests.length === 0 ? (
                <p className="text-xs text-slate-400">No pending requests</p>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request._id}
                    className="mb-2 rounded-lg bg-slate-800 p-3"
                  >
                    <p className="text-sm font-medium">
                      {request.from.username}
                    </p>

                    <p className="mb-2 text-xs text-slate-400">
                      {request.from.email}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(request.from._id)}
                        className="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600"
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectRequest(request.from._id)}
                        className="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">My Friends</h3>
              </div>

              {users.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">No friends found</p>
              ) : filteredFriends.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">
                  No matching friend found
                </p>
              ) : (
                filteredFriends.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    selectedUser={selectedUser}
                    setSelectedUser={handleSelectFriend}
                    unreadCount={unreadCounts[user._id] || 0}
                    lastMessageTime={lastMessageTimes[user._id] || null}
                    lastMessagePreview={lastMessagePreviews[user._id] || ""}
                  />
                ))
              )}

              <div className="border-t border-slate-800 p-4">
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(event) => setFriendSearch(event.target.value)}
                  placeholder="Search friends..."
                  className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {!selectedUser ? (
            <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
              <div className="px-6 text-center">
                <div className="mb-4 text-6xl">Secure</div>

                <h2 className="mb-2 text-3xl font-bold">
                  Welcome to Secure Chat
                </h2>

                <p className="mb-4 text-slate-400">
                  Select a friend from the sidebar to start a private
                  conversation.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ChatHeader
                selectedUser={selectedUser.username}
                onRemoveFriend={handleRemoveFriend}
                onClearChat={handleClearChat}
                onBack={handleBackToWelcome}
                messageSearch={messageSearch}
                onMessageSearchChange={setMessageSearch}
                searchResults={messageSearchResults}
                onSearchResultClick={handleSearchResultClick}
              />

              {selectionMode && (
                <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetForwardSelection}
                      className="rounded-full p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <FaTimes />
                    </button>

                    <p className="font-medium">
                      {selectedMessageIds.length} selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openForwardModal}
                    disabled={selectedMessageIds.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaShare />
                    Forward
                  </button>
                </div>
              )}

              <div
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900 p-6"
                onClick={() => {
                  if (!selectionMode) {
                    setSelectedMessageId(null);
                  }
                }}
              >
                {messages.length === 0 ? (
                  <div className="mt-10 text-center text-slate-500">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isSelected = selectedMessageIds.includes(message.id);

                    return (
                      <div
                        key={message.id || message.messageId || index}
                        ref={(element) => {
                          if (element && message.id) {
                            messageRefs.current[message.id] = element;
                          }
                        }}
                        className={`flex rounded-xl transition-all duration-300 ${
                          message.sender === "me"
                            ? "justify-end"
                            : "justify-start"
                        } ${
                          isSelected
                            ? "bg-blue-500/20 p-2 ring-1 ring-blue-400"
                            : ""
                        } ${
                          highlightedMessageId === message.id
                            ? "bg-yellow-400/20 p-2 ring-1 ring-yellow-400/40"
                            : ""
                        }`}
                      >
                        {selectionMode && (
                          <div className="mr-3 flex items-center">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                isSelected
                                  ? "border-blue-400 bg-blue-500"
                                  : "border-slate-500"
                              }`}
                            >
                              {isSelected && "✓"}
                            </div>
                          </div>
                        )}

                        <div
                          onClick={(event) => {
                            event.stopPropagation();

                            if (selectionMode) {
                              toggleMessageSelection(message.id);

                              return;
                            }

                            setSelectedMessageId((currentId) =>
                              currentId === message.id ? null : message.id,
                            );
                          }}
                          className="group relative cursor-pointer"
                        >
                          <div
                            className={`max-w-xs break-words rounded-2xl px-4 py-3 shadow-lg sm:max-w-md ${
                              message.sender === "me"
                                ? "rounded-br-none bg-green-500"
                                : "rounded-bl-none bg-slate-700"
                            } ${
                              selectedMessageId === message.id
                                ? "ring-2 ring-yellow-400"
                                : ""
                            }`}
                          >
                            {message.isForwarded && (
                              <p className="mb-1 flex items-center gap-1 text-[11px] italic text-slate-200">
                                <FaShare />
                                Forwarded
                              </p>
                            )}

                            {message.replyToMessageId && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  scrollToMessage(message.replyToMessageId);
                                }}
                                className={`mb-2 block w-full rounded-lg border-l-4 p-2 text-left ${
                                  message.sender === "me"
                                    ? "border-green-200 bg-green-700/40"
                                    : "border-slate-400 bg-slate-900/40"
                                }`}
                              >
                                <p className="text-xs font-semibold text-yellow-200">
                                  {getReplySenderName(message)}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-100">
                                  {message.replyToText
                                    ? getDecryptedText(message.replyToText)
                                    : "Original message"}
                                </p>
                              </button>
                            )}

                            {message.messageType !== "text" &&
                              message.status === "sending" && (
                                <div className="mb-2 rounded-lg bg-black/20 p-4 text-sm text-slate-100">
                                  Sending attachment...
                                </div>
                              )}

                            {message.messageType !== "text" &&
                              message.status === "failed" && (
                                <div className="mb-2 rounded-lg bg-black/20 p-4 text-sm text-red-200">
                                  Attachment failed to send
                                </div>
                              )}

                            {message.messageType !== "text" &&
                              message.status !== "sending" &&
                              message.status !== "failed" && (
                                <AttachmentMessage message={message} />
                              )}

                            {message.text && (
                              <p className="whitespace-pre-wrap">
                                {getDecryptedText(message.text)}
                              </p>
                            )}

                            <p
                              className={`mt-1 text-[10px] ${
                                message.sender === "me"
                                  ? "text-green-100"
                                  : "text-slate-300"
                              }`}
                            >
                              {message.createdAt
                                ? new Date(message.createdAt).toLocaleString(
                                    [],
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : ""}
                            </p>
                          </div>

                          {message.sender === "me" && (
                            <div
                              className={`absolute -bottom-6 right-0 hidden whitespace-nowrap text-[11px] group-hover:block ${
                                message.status === "failed"
                                  ? "text-red-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {getStatusText(message.status)}
                            </div>
                          )}

                          {!selectionMode &&
                            selectedMessageId === message.id && (
                              <div
                                className={`absolute top-0 z-20 flex gap-1 ${
                                  message.sender === "me"
                                    ? "-left-56"
                                    : "-right-56"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    handleReplyMessage(message);
                                  }}
                                  className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                                >
                                  <FaReply />
                                  Reply
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    startForwardSelection(message.id);
                                  }}
                                  className="flex items-center gap-1 rounded bg-purple-500 px-2 py-1 text-xs text-white hover:bg-purple-600"
                                >
                                  <FaShare />
                                  Forward
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    handleDeleteMessage(message.id);
                                  }}
                                  className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {typingUser && (
                <div className="shrink-0 border-t border-slate-800 bg-slate-900 px-6 py-2 text-sm text-green-400">
                  {typingUser} is typing...
                </div>
              )}

              {replyingTo && (
                <div className="flex shrink-0 items-center justify-between border-t border-slate-700 bg-slate-800 px-4 py-3">
                  <div className="min-w-0 border-l-4 border-blue-500 pl-3">
                    <p className="text-xs font-semibold text-blue-400">
                      Replying to{" "}
                      {replyingTo.sender === "me"
                        ? "yourself"
                        : selectedUser.username}
                    </p>

                    <p className="max-w-xl truncate text-sm text-slate-300">
                      {replyingTo.decryptedText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="ml-4 shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              {isUploading && (
                <div className="shrink-0 border-t border-slate-800 bg-slate-900 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                    <span>Uploading attachment</span>

                    <span>{uploadProgress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex shrink-0 gap-3 border-t border-slate-800 bg-slate-900 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.docx,.xlsx,.pptx"
                  onChange={handleAttachmentSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectionMode || isUploading}
                  className="rounded-xl bg-slate-800 px-4 py-3 text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  title="Attach image or file"
                >
                  <FaPaperclip />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={handleTyping}
                  disabled={selectionMode}
                  onFocus={() => setSelectedMessageId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    selectionMode
                      ? "Finish forwarding selection first"
                      : `Message ${selectedUser.username}...`
                  }
                  className="min-w-0 flex-1 rounded-xl bg-slate-800 px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || selectionMode}
                  className="rounded-xl bg-green-500 px-6 py-3 font-medium transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {showForwardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowForwardModal(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <div>
                <h2 className="text-lg font-semibold">Forward messages</h2>

                <p className="text-xs text-slate-400">
                  {selectedMessageIds.length} message(s) selected
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForwardModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="border-b border-slate-700 p-4">
              <input
                type="text"
                value={forwardSearch}
                onChange={(event) => setForwardSearch(event.target.value)}
                placeholder="Search friends..."
                className="w-full rounded-lg bg-slate-800 px-4 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {filteredForwardFriends.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">
                  No friends found
                </p>
              ) : (
                filteredForwardFriends.map((friend) => {
                  const isRecipientSelected = forwardRecipientIds.includes(
                    friend._id,
                  );

                  return (
                    <button
                      type="button"
                      key={friend._id}
                      onClick={() => toggleForwardRecipient(friend._id)}
                      className={`mb-2 flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                        isRecipientSelected
                          ? "bg-blue-500/20 ring-1 ring-blue-400"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 font-bold">
                          {friend.username?.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium">{friend.username}</p>

                          <p className="text-xs text-slate-400">
                            {friend.email}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          isRecipientSelected
                            ? "border-blue-400 bg-blue-500"
                            : "border-slate-500"
                        }`}
                      >
                        {isRecipientSelected && "✓"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 p-4">
              <p className="text-sm text-slate-400">
                {forwardRecipientIds.length} recipient(s)
              </p>

              <button
                type="button"
                onClick={handleForwardMessages}
                disabled={forwardRecipientIds.length === 0 || isForwarding}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2 font-medium hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaShare />

                {isForwarding ? "Forwarding..." : "Forward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
