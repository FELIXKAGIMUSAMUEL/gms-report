"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleOvalLeftIcon,
  ArrowPathIcon,
  PaperClipIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  TrashIcon,
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
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!draft.trim() && !selectedFile) || !activeRecipientId) return;
    
    try {
      setSending(true);
      
      let attachmentData = null;
      
      // Upload file first if one is selected
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResponse = await fetch('/api/messages/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'File upload failed');
        }
        
        attachmentData = await uploadResponse.json();
        setUploading(false);
      }
      
      // Send message with or without attachment
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: draft.trim(), 
          recipientId: activeRecipientId,
          attachmentUrl: attachmentData?.url,
          attachmentName: attachmentData?.filename,
          attachmentType: attachmentData?.type,
        }),
      });
      
      setDraft("");
      setSelectedFile(null);
      setFilePreview(null);
      await fetchMessages();
      onMessageSent?.();
    } catch (error) {
      console.error("Error sending message", error);
      alert(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
      
      // Remove message from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete message');
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
                    const hasAttachment = !!message.attachmentUrl;
                    
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                        <div className="relative">
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                              isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {/* File attachment preview */}
                            {hasAttachment && (
                              <div className={`mb-2 rounded-lg overflow-hidden ${
                                isMine ? 'bg-blue-700' : 'bg-gray-200'
                              }`}>
                                {message.attachmentType?.startsWith('image/') ? (
                                  <a 
                                    href={message.attachmentUrl!} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img 
                                      src={message.attachmentUrl!} 
                                      alt={message.attachmentName || 'Attachment'} 
                                      className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={message.attachmentUrl!}
                                    download={message.attachmentName}
                                    className={`flex items-center gap-3 p-3 hover:opacity-80 transition-opacity ${
                                      isMine ? 'text-white' : 'text-gray-900'
                                    }`}
                                  >
                                    <DocumentIcon className="w-8 h-8 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {message.attachmentName || 'File'}
                                      </p>
                                      <p className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {getFileIcon(message.attachmentType || '')} {message.attachmentType?.split('/')[1]?.toUpperCase()}
                                      </p>
                                    </div>
                                    <ArrowDownTrayIcon className="w-5 h-5 flex-shrink-0" />
                                  </a>
                                )}
                              </div>
                            )}
                            
                            {/* Message text */}
                            {message.content && (
                              <p className="text-sm whitespace-pre-line">{message.content}</p>
                            )}
                            
                            {/* Timestamp */}
                            <p className={`text-[11px] mt-2 ${isMine ? "text-blue-50" : "text-gray-500"}`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                          
                          {/* Delete button - shows on hover */}
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className={`absolute top-1 ${isMine ? 'left-[-32px]' : 'right-[-32px]'} p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md`}
                            title="Delete message"
                            aria-label="Delete message"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
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
              {/* File preview */}
              {selectedFile && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <DocumentIcon className="w-12 h-12 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      title="Remove file"
                    >
                      <XCircleIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={activeRecipient ? "Write a message..." : "Choose someone to message"}
                  className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  disabled={!activeRecipient}
                />
                
                {/* File upload button */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!activeRecipient || uploading}
                    className="p-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Attach file"
                    title="Attach file (Max 10MB)"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Send button */}
                  <button
                    onClick={sendMessage}
                    disabled={!activeRecipient || (sending || uploading) || (!draft.trim() && !selectedFile)}
                    className={`p-3 rounded-lg text-white shadow-sm flex items-center justify-center ${
                      !activeRecipient || (!draft.trim() && !selectedFile)
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    aria-label="Send message"
                  >
                    {uploading ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className={`h-5 w-5 ${sending ? "animate-pulse" : ""}`} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
