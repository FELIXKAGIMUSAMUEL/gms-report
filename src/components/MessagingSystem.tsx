import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MessagingSystemProps {
  isOpen: boolean;
  onClose: () => void;
  otherUsers?: User[];
}

export default function MessagingSystem({ isOpen, onClose, otherUsers }: MessagingSystemProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [users, setUsers] = useState<User[]>(otherUsers || []);
  const [loading, setLoading] = useState(false);

  // Fetch all users
  useEffect(() => {
    if (!otherUsers) {
      fetchUsers();
    }
  }, [otherUsers]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/schools');
      if (response.ok) {
        const schoolData = await response.json();
        // Extract users from schools data if needed
        // For now, we'll fetch from the session
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !messageContent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          recipientId: selectedUserId,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [newMessage, ...prev]);
        setMessageContent('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, isRead: true } : m)
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (!isOpen) return null;

  // Filter messages for selected user
  const conversationMessages = selectedUserId
    ? messages.filter(
        m =>
          (m.senderId === session?.user?.id && m.recipientId === selectedUserId) ||
          (m.senderId === selectedUserId && m.recipientId === session?.user?.id)
      )
    : [];

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-96 flex">
        {/* User List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Messages</h3>
          </div>
          <div className="divide-y">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedUserId === user.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedUser?.name}</h4>
                  <p className="text-xs text-gray-500">{selectedUser?.email}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversationMessages.map(message => {
                  const isOwn = message.senderId === session?.user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      onClick={() => !isOwn && !message.isRead && markMessageAsRead(message.id)}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : message.isRead
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-100 text-gray-900 font-medium'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form
                onSubmit={sendMessage}
                className="border-t border-gray-200 p-4 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !messageContent.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a user to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
