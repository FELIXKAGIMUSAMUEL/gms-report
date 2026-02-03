"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleOvalLeftIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; email: string };
  recipient: { id: string; name: string; email: string };
}

interface MessagingDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
  onMessageSent?: () => void;
  onMessagesRead?: () => void;
}

export default function MessagingDrawer({
  open,
  onClose,
  currentUserId,
  onMessageSent,
  onMessagesRead,
}: MessagingDrawerProps) {
  const [recipients, setRecipients] = useState<UserSummary[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchRecipients = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) return;
      const data = await response.json();
      setRecipients(data);
      if (!activeRecipientId && data.length > 0) {
        setActiveRecipientId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading users", error);
    }
  }, [activeRecipientId]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchRecipients();
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [open, fetchMessages, fetchRecipients]);

  const markConversationAsRead = useCallback(
    async (recipientId: string) => {
      if (!currentUserId) return;
      const unread = messages.filter(
        (m) => m.recipientId === currentUserId && m.senderId === recipientId && !m.isRead
      );
      if (unread.length === 0) return;

      try {
        await Promise.all(
          unread.map((message) =>
            fetch("/api/messages", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageId: message.id }),
            })
          )
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.recipientId === currentUserId && m.senderId === recipientId
              ? { ...m, isRead: true, readAt: new Date().toISOString() }
              : m
          )
        );
        onMessagesRead?.();
      } catch (error) {
        console.error("Failed to mark messages as read", error);
      }
    },
    [currentUserId, messages, onMessagesRead]
  );

  useEffect(() => {
    if (!open || !activeRecipientId) return;
    markConversationAsRead(activeRecipientId);
  }, [open, activeRecipientId, messages, markConversationAsRead]);

  const sendMessage = async () => {
    if (!draft.trim() || !activeRecipientId) return;
    try {
      setSending(true);
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim(), recipientId: activeRecipientId }),
      });
      setDraft("");
      await fetchMessages();
      onMessageSent?.();
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setSending(false);
    }
  };

  const conversation = useMemo(() => {
    if (!activeRecipientId || !currentUserId) return [] as MessageItem[];
    return messages
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.recipientId === activeRecipientId) ||
          (m.senderId === activeRecipientId && m.recipientId === currentUserId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, activeRecipientId, currentUserId]);

  const unreadForRecipient = useCallback(
    (recipientId: string) =>
      messages.filter(
        (m) => m.recipientId === currentUserId && m.senderId === recipientId && !m.isRead
      ).length,
    [messages, currentUserId]
  );

  const activeRecipient = recipients.find((r) => r.id === activeRecipientId);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <ChatBubbleOvalLeftIcon className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">GM ↔ Trustee chat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </header>

        <div className="flex flex-col sm:flex-row h-[calc(100%-56px)]">
          <aside className="sm:w-60 border-b sm:border-b-0 sm:border-r bg-gray-50">
            <div className="px-4 py-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">People</p>
              {loading && <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />}
            </div>
            <div className="max-h-full overflow-y-auto divide-y">
              {recipients.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-500">No available recipients.</p>
              )}
              {recipients.map((recipient) => {
                const unread = unreadForRecipient(recipient.id);
                const isActive = recipient.id === activeRecipientId;
                return (
                  <button
                    key={recipient.id}
                    onClick={() => setActiveRecipientId(recipient.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors ${
                      isActive ? "bg-white" : "hover:bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{recipient.name}</p>
                      <p className="text-xs text-gray-500">{recipient.role}</p>
                    </div>
                    {unread > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[22px] px-2 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded-full">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto bg-white">
              {activeRecipient ? (
                <div className="p-4 space-y-4">
                  {conversation.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-10">Start the conversation with {activeRecipient.name}.</p>
                  )}
                  {conversation.map((message) => {
                    const isMine = message.senderId === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                            isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p className={`text-[11px] mt-2 ${isMine ? "text-blue-50" : "text-gray-500"}`}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                  Select a person to start chatting.
                </div>
              )}
            </div>

            <div className="border-t bg-white p-3">
              <div className="flex items-center gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={activeRecipient ? "Write a message..." : "Choose someone to message"}
                  className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  rows={2}
                  disabled={!activeRecipient}
                />
                <button
                  onClick={sendMessage}
                  disabled={!activeRecipient || sending || draft.trim().length === 0}
                  className={`p-3 rounded-lg text-white shadow-sm flex items-center justify-center ${
                    !activeRecipient || draft.trim().length === 0
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className={`h-5 w-5 ${sending ? "animate-pulse" : ""}`} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
