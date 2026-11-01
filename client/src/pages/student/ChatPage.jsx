/**
 * @file ChatPage.jsx
 * @description Real-time Community & Direct Messaging Hub for Students, Wardens, and Admins.
 * Features:
 *   - Real-time Socket.IO communication with optimistic UI
 *   - Public Channels & Direct Messages (Warden, Admin, Resident Peers)
 *   - Live Online/Offline presence indicators & Role Badges
 *   - Typing indicator, emoji reactions, quick prompts
 *   - Responsive mobile split-view with back navigation
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Users, User, Search, Plus,
  Shield, CheckCheck, Clock, X, Hash, Smile, Sparkles,
  ArrowLeft, RefreshCw, ShieldCheck, Check, AlertCircle,
  ThumbsUp, Heart, Flame, HelpCircle, UserCheck, Trash2
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../services/socket";

// ─── Role Badge Component ─────────────────────────────────────────────────────
const RoleBadge = ({ role, className = "" }) => {
  const norm = (role || "").toLowerCase();
  if (norm === "warden") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <ShieldCheck size={11} /> Warden
      </span>
    );
  }
  if (norm === "admin") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
        <Shield size={11} /> Admin
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-500/15 text-blue-400 border border-blue-500/25 ${className}`}>
      Student
    </span>
  );
};

// ─── Main Chat Component ──────────────────────────────────────────────────────
const ChatPage = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "channels" | "dms"
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userFilterRole, setUserFilterRole] = useState("all");
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [showMobileList, setShowMobileList] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ── 1. Fetch Rooms ──────────────────────────────────────────────────────────
  const { data: rooms = [], isLoading: isLoadingRooms, refetch: refetchRooms } = useQuery({
    queryKey: ["chat-rooms", currentUserId],
    queryFn: async () => {
      const res = await api.get("/chat/rooms");
      return res.data?.data || [];
    },
    refetchInterval: 10000,
  });

  // Select first room if none selected
  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) {
      setActiveRoomId(rooms[0]._id);
    }
  }, [rooms, activeRoomId]);

  // ── 2. Fetch Messages ───────────────────────────────────────────────────────
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["chat-messages", activeRoomId],
    queryFn: async () => {
      if (!activeRoomId) return [];
      const res = await api.get(`/chat/rooms/${activeRoomId}/messages`);
      return res.data?.data || [];
    },
    enabled: !!activeRoomId,
    refetchInterval: 8000,
  });

  // ── 3. Fetch Users for New DM ───────────────────────────────────────────────
  const { data: availableUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["chat-available-users"],
    queryFn: async () => {
      const res = await api.get("/chat/users");
      return res.data?.data || [];
    },
    enabled: isNewChatModalOpen,
  });

  // ── 4. Socket.IO Listeners for Real-Time Delivery ───────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join rooms
    socket.emit("join_chat_rooms");

    // Live incoming message
    const handleNewMessage = (newMsg) => {
      if (newMsg.chatRoom === activeRoomId || newMsg.chatRoom?._id === activeRoomId) {
        queryClient.setQueryData(["chat-messages", activeRoomId], (old = []) => {
          if (old.some((m) => m._id === newMsg._id)) return old;
          return [...old, newMsg];
        });
      }
      // Invalidate room list to show updated lastMessage
      queryClient.invalidateQueries(["chat-rooms", currentUserId]);
    };

    // Online users broadcast
    const handleOnlineUsers = (users) => {
      setOnlineUserIds(new Set(users || []));
    };

    // Typing indicators
    const handleTyping = ({ userId, userName, chatRoomId }) => {
      if (chatRoomId === activeRoomId && userId !== currentUserId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName || "Someone" }));
      }
    };

    const handleStoppedTyping = ({ userId, chatRoomId }) => {
      if (chatRoomId === activeRoomId) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    };

    // Real-time message deletion
    const handleMessageDeleted = ({ messageId, chatRoomId }) => {
      queryClient.setQueryData(["chat-messages", chatRoomId], (old = []) =>
        old.filter((m) => m._id !== messageId)
      );
      queryClient.invalidateQueries(["chat-rooms", currentUserId]);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("online_users", handleOnlineUsers);
    socket.on("typing", handleTyping);
    socket.on("stopped_typing", handleStoppedTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("online_users", handleOnlineUsers);
      socket.off("typing", handleTyping);
      socket.off("stopped_typing", handleStoppedTyping);
    };
  }, [activeRoomId, currentUserId, queryClient]);

  // ── 5. Auto Scroll to Bottom on Messages Change ─────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ── 6. Send Message Mutation ────────────────────────────────────────────────
  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, content }) => {
      const res = await api.post(`/chat/rooms/${roomId}/messages`, { content });
      return res.data;
    },
    onMutate: async ({ roomId, content }) => {
      await queryClient.cancelQueries(["chat-messages", roomId]);
      const prevMessages = queryClient.getQueryData(["chat-messages", roomId]) || [];

      // Optimistic message
      const optimisticMsg = {
        _id: `temp-${Date.now()}`,
        chatRoom: roomId,
        sender: {
          _id: currentUserId,
          name: user?.name || "Me",
          role: user?.role || "student",
          profileUrl: user?.profileUrl,
        },
        content,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData(["chat-messages", roomId], [...prevMessages, optimisticMsg]);
      return { prevMessages };
    },
    onError: (err, variables, context) => {
      if (context?.prevMessages) {
        queryClient.setQueryData(["chat-messages", variables.roomId], context.prevMessages);
      }
    },
    onSuccess: (data) => {
      // Replace optimistic message with server version
      queryClient.setQueryData(["chat-messages", activeRoomId], (old = []) => {
        const filtered = old.filter((m) => !m.isOptimistic);
        if (data?.data && !filtered.some((m) => m._id === data.data._id)) {
          return [...filtered, data.data];
        }
        return filtered;
      });
      queryClient.invalidateQueries(["chat-rooms", currentUserId]);
    },
  });

  // ── 7. Delete Message Mutation ──────────────────────────────────────────────
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const res = await api.delete(`/chat/messages/${messageId}`);
      return res.data;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries(["chat-messages", activeRoomId]);
      const prevMessages = queryClient.getQueryData(["chat-messages", activeRoomId]) || [];
      queryClient.setQueryData(
        ["chat-messages", activeRoomId],
        prevMessages.filter((m) => m._id !== messageId)
      );
      return { prevMessages };
    },
    onError: (err, messageId, context) => {
      if (context?.prevMessages) {
        queryClient.setQueryData(["chat-messages", activeRoomId], context.prevMessages);
      }
      toast.error(err.response?.data?.message || "Failed to delete message");
    },
    onSuccess: () => {
      toast.success("Message deleted");
      queryClient.invalidateQueries(["chat-rooms", currentUserId]);
    },
  });

  // ── 8. Create Direct Message Mutation ───────────────────────────────────────
  const createDmMutation = useMutation({
    mutationFn: async (recipientId) => {
      const res = await api.post("/chat/rooms", { recipientId, type: "dm" });
      return res.data;
    },
    onSuccess: (data) => {
      setIsNewChatModalOpen(false);
      queryClient.invalidateQueries(["chat-rooms", currentUserId]);
      if (data?.data?._id) {
        setActiveRoomId(data.data._id);
        setShowMobileList(false);
      }
    },
  });

  // Handle Input Typing & Socket broadcast
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    const socket = getSocket();
    if (socket && activeRoomId) {
      socket.emit("typing_start", { chatRoomId: activeRoomId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", { chatRoomId: activeRoomId });
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !activeRoomId) return;

    setMessageInput("");
    const socket = getSocket();
    if (socket) {
      socket.emit("typing_stop", { chatRoomId: activeRoomId });
    }
    sendMessageMutation.mutate({ roomId: activeRoomId, content: trimmed });
  };

  // Helper to determine other user in DM
  const getDmOtherUser = (room) => {
    if (room.type === "group" || room.type === "room_group") return null;
    const myId = (user?._id || user?.id)?.toString();
    const otherPart = room.participants?.find((p) => {
      const pId = (p.user?._id || p.user)?.toString();
      return pId && pId !== myId;
    });
    return otherPart?.user && typeof otherPart.user === "object" ? otherPart.user : null;
  };

  const getRoomTitle = (room) => {
    if (room.type === "group" || room.type === "room_group") {
      return room.name || "Community Channel";
    }
    const other = getDmOtherUser(room);
    return other?.name || "Direct Message";
  };

  const activeRoom = useMemo(() => {
    return rooms.find((r) => r._id === activeRoomId) || null;
  }, [rooms, activeRoomId]);

  const activeOtherUser = activeRoom ? getDmOtherUser(activeRoom) : null;
  const isOtherUserOnline = activeOtherUser && onlineUserIds.has(activeOtherUser._id);

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const isGroup = room.type === "group" || room.type === "room_group";
      if (activeTab === "channels" && !isGroup) return false;
      if (activeTab === "dms" && isGroup) return false;

      const title = getRoomTitle(room).toLowerCase();
      const lastText = (room.lastMessage?.content || "").toLowerCase();
      const q = searchQuery.toLowerCase();
      return title.includes(q) || lastText.includes(q);
    });
  }, [rooms, activeTab, searchQuery, currentUserId]);

  // Filtered users for New Chat Modal
  const filteredAvailableUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (userFilterRole !== "all" && u.role !== userFilterRole) return false;
      // For student directory, only display accounts that have actually logged in
      if (u.role === "student" && !(u.loginCount > 0 || u.lastLoginAt)) {
        return false;
      }
      const q = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [availableUsers, userFilterRole, userSearch]);

  const quickPrompts = [
    "👋 Hello! Quick question regarding hostel timings.",
    "🔧 I need an update on my maintenance request.",
    "🍽️ Is the mess menu active for today?",
  ];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-190px)] min-h-[520px] flex flex-col pb-1">
      {/* ── Outer Shell ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden rounded-3xl border border-light-border dark:border-dark-border bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-xl shadow-2xl relative">

        {/* ════════════════════════════════════════════════════════════════════
            LEFT SIDEBAR: Conversation Channels & DMs
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-light-border dark:border-dark-border flex flex-col bg-light-card/50 dark:bg-dark-card/50 ${
            !showMobileList ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-light-border dark:border-dark-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <MessageSquare size={17} />
                </div>
                <h2 className="font-black font-display text-lg text-light-text dark:text-dark-text tracking-tight">
                  BIT Messaging
                </h2>
              </div>
              <p className="text-[11px] text-light-muted dark:text-dark-muted font-medium mt-0.5">
                Official Hostel Channels & Resident DMs
              </p>
            </div>

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
              title="Start New Chat"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-light-border/60 dark:border-dark-border/60">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels, wardens, students..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border/80 focus:border-blue-500 text-light-text dark:text-dark-text placeholder:text-light-muted/70 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-light-muted hover:text-light-text dark:hover:text-dark-text p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex px-4 py-2 gap-1.5 border-b border-light-border/60 dark:border-dark-border/60 bg-light-surface/40 dark:bg-dark-surface/40 text-xs font-bold">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === "all"
                  ? "bg-light-surface dark:bg-dark-surface text-blue-500 shadow-sm border border-light-border dark:border-dark-border"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === "channels"
                  ? "bg-light-surface dark:bg-dark-surface text-blue-500 shadow-sm border border-light-border dark:border-dark-border"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text"
              }`}
            >
              <Hash size={12} /> Channels
            </button>
            <button
              onClick={() => setActiveTab("dms")}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === "dms"
                  ? "bg-light-surface dark:bg-dark-surface text-blue-500 shadow-sm border border-light-border dark:border-dark-border"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text"
              }`}
            >
              <User size={12} /> Direct
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-light-border/30 dark:divide-dark-border/30 p-2 space-y-1">
            {isLoadingRooms ? (
              <div className="p-8 text-center text-xs text-light-muted dark:text-dark-muted flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-blue-500" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-light-muted dark:text-dark-muted">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-30 text-blue-500" />
                <p className="text-xs font-bold">No chats found</p>
                <p className="text-[11px] mt-1">Start a conversation using the "New Chat" button above.</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = room._id === activeRoomId;
                const isGroup = room.type === "group" || room.type === "room_group";
                const title = getRoomTitle(room);
                const dmUser = getDmOtherUser(room);
                const isOnline = dmUser && onlineUserIds.has(dmUser._id);

                return (
                  <button
                    key={room._id}
                    onClick={() => {
                      setActiveRoomId(room._id);
                      setShowMobileList(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/30 shadow-sm"
                        : "hover:bg-light-elevated/70 dark:hover:bg-dark-elevated/70 border border-transparent"
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div className="relative shrink-0">
                      {isGroup ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-blue-500 flex items-center justify-center font-black border border-blue-500/30">
                          <Hash size={20} />
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={
                              dmUser?.profileUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=2563eb&color=fff`
                            }
                            alt={title}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-light-border dark:ring-dark-border"
                          />
                          {isOnline && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-light-card dark:border-dark-card"
                              title="Online"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-light-text dark:text-dark-text truncate">
                          {title}
                        </h4>
                        {room.lastMessageAt && (
                          <span className="text-[10px] text-light-muted dark:text-dark-muted shrink-0">
                            {new Date(room.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                          {room.lastMessage?.content || room.description || "No messages yet"}
                        </p>
                        {dmUser && <RoleBadge role={dmUser.role} className="shrink-0" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT MAIN CHAT WINDOW
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className={`flex-1 flex flex-col bg-light-surface/30 dark:bg-dark-surface/30 ${
            showMobileList ? "hidden md:flex" : "flex"
          }`}
        >
          {activeRoom ? (
            <>
              {/* Chat Top Header */}
              <div className="p-4 sm:p-5 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-light-card/70 dark:bg-dark-card/70 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="p-2 -ml-1 rounded-xl md:hidden text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated"
                    title="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {/* Header Avatar */}
                  <div className="relative shrink-0">
                    {activeRoom.type === "group" || activeRoom.type === "room_group" ? (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
                        <Hash size={18} />
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={
                            activeOtherUser?.profileUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(getRoomTitle(activeRoom))}&background=2563eb&color=fff`
                          }
                          alt={getRoomTitle(activeRoom)}
                          className="w-10 h-10 rounded-2xl object-cover ring-2 ring-blue-500/30"
                        />
                        {isOtherUserOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-light-card dark:border-dark-card" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-light-text dark:text-dark-text truncate">
                        {getRoomTitle(activeRoom)}
                      </h3>
                      {activeOtherUser && <RoleBadge role={activeOtherUser.role} />}
                    </div>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted font-medium flex items-center gap-1.5 mt-0.5">
                      {activeRoom.type === "group" ? (
                        <>
                          <Users size={12} className="text-blue-500" />
                          <span>{activeRoom.participants?.length || 1} Community Members</span>
                        </>
                      ) : isOtherUserOnline ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </span>
                      ) : (
                        <span>Offline • Last active recently</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetchMessages()}
                    className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60 transition-colors"
                    title="Refresh Messages"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              {/* Message Feed Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {isLoadingMessages ? (
                  <div className="py-24 text-center text-xs text-light-muted dark:text-dark-muted flex flex-col items-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-blue-500" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center max-w-sm mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto shadow-inner">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
                        Welcome to {getRoomTitle(activeRoom)}!
                      </h4>
                      <p className="text-xs text-light-muted dark:text-dark-muted mt-1 leading-relaxed">
                        Start the conversation below or pick a quick suggestion to reach out right away.
                      </p>
                    </div>

                    <div className="space-y-2 text-left pt-2">
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setMessageInput(prompt);
                          }}
                          className="w-full text-left p-2.5 rounded-xl text-xs bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-blue-500/10 hover:border-blue-500/30 border border-light-border dark:border-dark-border transition-colors text-light-muted dark:text-dark-muted hover:text-blue-500"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const senderId = (msg.sender?._id || msg.sender)?.toString();
                    const myId = (user?._id || user?.id)?.toString();
                    const isMe = Boolean(myId && senderId && senderId === myId);
                    const senderName = isMe ? "You" : (msg.sender?.name || "Resident");
                    const senderRole = msg.sender?.role;
                    const canDelete = !msg.isOptimistic;

                    return (
                      <motion.div
                        key={msg._id || i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative flex gap-3 ${isMe ? "justify-end" : "justify-start"} items-start`}
                      >
                        {/* Avatar for incoming messages */}
                        {!isMe && (
                          <img
                            src={
                              msg.sender?.profileUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=2563eb&color=fff`
                            }
                            alt={senderName}
                            className="w-8 h-8 rounded-xl object-cover shrink-0 mt-1 ring-1 ring-light-border dark:ring-dark-border"
                          />
                        )}

                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
                          {/* Sender name for group chats */}
                          {!isMe && activeRoom.type === "group" && (
                            <div className="flex items-center gap-1.5 mb-1 ml-1">
                              <span className="text-[11px] font-bold text-light-text dark:text-dark-text">
                                {senderName}
                              </span>
                              {senderRole && <RoleBadge role={senderRole} />}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 group/bubble">
                            {/* Delete button on left for current user's messages */}
                            {isMe && canDelete && (
                              <div className="opacity-60 hover:opacity-100 group-hover/bubble:opacity-100 transition-opacity shrink-0">
                                {confirmDeleteId === msg._id ? (
                                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-xl text-[11px] text-red-400 shadow-sm">
                                    <span>Delete?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteMessageMutation.mutate(msg._id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="font-bold underline hover:text-red-300 transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-light-muted hover:text-light-text ml-0.5 transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(msg._id)}
                                    className="p-1.5 rounded-xl text-light-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                                isMe
                                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-tr-xs shadow-blue-500/15"
                                  : "bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border/80 rounded-tl-xs"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <div
                                className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 ${
                                  isMe ? "text-white/70" : "text-light-muted dark:text-dark-muted"
                                }`}
                              >
                                <span>
                                  {msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Just now"}
                                </span>
                                {isMe && (
                                  <CheckCheck
                                    size={13}
                                    className={msg.isOptimistic ? "opacity-40" : "text-blue-200"}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Delete button on right for incoming messages (accessible to all accounts) */}
                            {!isMe && canDelete && (
                              <div className="opacity-60 hover:opacity-100 group-hover/bubble:opacity-100 transition-opacity shrink-0">
                                {confirmDeleteId === msg._id ? (
                                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-xl text-[11px] text-red-400 shadow-sm">
                                    <span>Delete?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteMessageMutation.mutate(msg._id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="font-bold underline hover:text-red-300 transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-light-muted hover:text-light-text ml-0.5 transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(msg._id)}
                                    className="p-1.5 rounded-xl text-light-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted italic ml-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>
                      {Object.values(typingUsers).join(", ")} {Object.keys(typingUsers).length > 1 ? "are" : "is"} typing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Area */}
              <div className="p-4 sm:p-5 border-t border-light-border dark:border-dark-border bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-xl">
                {/* Emoji Reaction Bar & Key Shortcut Hint */}
                <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["👍", "❤️", "👏", "🔥", "😊", "💡"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessageInput((prev) => prev + emoji)}
                        className="px-2 py-1 rounded-xl bg-light-surface/80 dark:bg-dark-surface/80 border border-light-border/60 dark:border-dark-border/60 hover:bg-blue-500/10 hover:border-blue-500/30 text-xs sm:text-sm transition-transform active:scale-95 hover:scale-110"
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-light-muted dark:text-dark-muted hidden sm:inline-flex items-center gap-1 font-medium">
                    <kbd className="px-1.5 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-[10px] font-mono">Shift+Enter</kbd> for new line
                  </span>
                </div>

                {/* Spacious Textarea & Large Send Button */}
                <form onSubmit={handleSend} className="flex items-end gap-3">
                  <div className="flex-1 relative rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      placeholder={`Message ${getRoomTitle(activeRoom)}...`}
                      rows={2}
                      className="w-full px-4 sm:px-5 py-3.5 text-xs sm:text-sm bg-transparent text-light-text dark:text-dark-text placeholder:text-light-muted/60 resize-none outline-none leading-relaxed min-h-[58px] max-h-[140px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !messageInput.trim()}
                    className="h-[58px] px-5 sm:px-7 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-500/35 active:scale-95 transition-all shrink-0"
                    title="Send Message (Enter)"
                  >
                    <Send size={18} className="translate-x-0.5" />
                    <span className="text-sm font-bold tracking-wide hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-light-muted dark:text-dark-muted">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-bold text-base text-light-text dark:text-dark-text mb-1">
                Select a Chat or Start a New One
              </h3>
              <p className="text-xs max-w-sm leading-relaxed">
                Choose a community channel from the left sidebar or start a direct conversation with your warden, administrator, or hostel roommates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          NEW CHAT MODAL (DIRECT MESSAGING)
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-light-border dark:border-dark-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold font-display text-light-text dark:text-dark-text">
                    Start a New Conversation
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    Select a warden, admin, or fellow resident
                  </p>
                </div>
                <button
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search & Role Filter Tabs */}
              <div className="p-4 border-b border-light-border dark:border-dark-border space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted/70 outline-none"
                  />
                </div>

                <div className="flex gap-1.5 text-xs font-bold">
                  {["all", "warden", "admin", "student"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserFilterRole(r)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                        userFilterRole === r
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted hover:text-light-text"
                      }`}
                    >
                      {r === "all" ? "All Contacts" : `${r}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Directory List */}
              <div className="flex-1 overflow-y-auto divide-y divide-light-border/40 dark:divide-dark-border/40 p-3 space-y-1">
                {isLoadingUsers ? (
                  <div className="p-8 text-center text-xs text-light-muted dark:text-dark-muted flex flex-col items-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-blue-500" />
                    <span>Loading directory...</span>
                  </div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-light-muted dark:text-dark-muted">
                    No contacts matching the criteria.
                  </div>
                ) : (
                  filteredAvailableUsers.map((u) => {
                    const isOnline = onlineUserIds.has(u._id);
                    return (
                      <button
                        key={u._id}
                        onClick={() => createDmMutation.mutate(u._id)}
                        disabled={createDmMutation.isPending}
                        className="w-full p-3 flex items-center justify-between hover:bg-light-elevated/70 dark:hover:bg-dark-elevated/70 rounded-2xl transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={
                                u.profileUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2563eb&color=fff`
                              }
                              alt={u.name}
                              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-light-border dark:ring-dark-border"
                            />
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-light-card dark:border-dark-card" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-blue-500 transition-colors truncate">
                              {u.name}
                            </h4>
                            <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <RoleBadge role={u.role} />
                          <span className="text-xs font-bold text-blue-500 group-hover:translate-x-0.5 transition-transform">
                            Chat &rarr;
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
