import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io.connect('https://premium-store.onrender.com');

export default function AdminSupport() {
  const [activeUsers, setActiveUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const fetchActiveChatsList = async () => {
    try {
     const res = await axios.get('https://premium-store.onrender.com/api/admin/support-chats');
      setActiveUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchActiveChatsList();
  }, []);

  useEffect(() => {
    socket.on('admin_notification', () => fetchActiveChatsList());
    
    socket.on('receive_message', (data) => {
      if (selectedUser && selectedUser.id === data.room) {
        setMessages((prev) => [...prev, data]);
        socket.emit('mark_as_seen', { room: selectedUser.id, readerId: 'ADMIN_SUPER_ID' });
      }
    });

    socket.on('messages_marked_seen', () => {
      setMessages((prev) => prev.map(m => m.senderId === 'ADMIN_SUPER_ID' ? { ...m, isSeen: true } : m));
    });

    return () => {
      socket.off('admin_notification');
      socket.off('receive_message');
      socket.off('messages_marked_seen');
    };
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      socket.emit('join_room', selectedUser.id);
      socket.emit('mark_as_seen', { room: selectedUser.id, readerId: 'ADMIN_SUPER_ID' });
      socket.on('chat_history', (history) => setMessages(history));
      setActiveUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unread: 0 } : u));
    }
    return () => socket.off('chat_history');
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [selectedUser]); // Mapped down directly on initialization click

  const handleAdminSendReply = (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUser) return;

    const replyData = {
      room: selectedUser.id,
      senderId: 'ADMIN_SUPER_ID',
      senderName: 'Admin Hirenbhai',
      message: reply.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSeen: false
    };

    socket.emit('send_message', replyData);
    setMessages((prev) => [...prev, replyData]);
    setReply('');
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 20);
  };

  // 🔥 NEW: CLEAR CHAT SYSTEM METHOD FOR ADMIN ACTION
  const handleClearChatHistory = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Are you sure you want to clear all conversation data logs for ${selectedUser.name}?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/clear-chat/${selectedUser.id}`);
      setMessages([]);
      fetchActiveChatsList();
    } catch (err) {
      alert("System failed purging user database rows.");
    }
  };

  return (
    <div className="h-[84vh] flex bg-white border border-slate-100 rounded-3xl overflow-hidden font-sans text-slate-800 shadow-sm">
      {/* Left Tray Panel */}
      <div className="w-76 border-r border-slate-100 bg-slate-50/40 flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Inbox Channel</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeUsers.map((user) => (
            <div key={user.id} onClick={() => setSelectedUser(user)} className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${selectedUser?.id === user.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-100 hover:bg-slate-50'}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center uppercase border">
                {user.name ? user.name.slice(0, 2) : 'US'}
              </div>
              <div className="flex-1 min-w-0 relative">
                <div className="flex justify-between items-baseline">
                  <p className="text-xs font-black truncate pr-2">{user.name || "Unknown User"}</p>
                  <span className="text-[8px] text-slate-400">{user.lastTime}</span>
                </div>
                <p className="text-[10px] truncate mt-0.5 text-slate-400">{user.lastMessage}</p>
                {user.unread > 0 && selectedUser?.id !== user.id && (
                  <span className="absolute bottom-1 right-0 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{user.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Dashboard Area Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Header with Clear Action Button */}
            <div className="p-4 border-b border-slate-100 text-xs font-bold bg-white flex justify-between items-center shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Chatting with: <span className="text-indigo-600 font-extrabold font-mono">{selectedUser.name}</span>
              </div>

              {/* 🔥 BUTTON INTEGRATION: Clear Chat Trigger */}
              <button onClick={handleClearChatHistory} className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-[10px] uppercase tracking-wide px-3 py-2 rounded-xl border border-slate-800 transition-colors shadow-xs cursor-pointer">
                🗑️ Clear Chat logs
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-[#efeae2]/30" style={{ backgroundImage: 'radial-gradient(#cbd5e1 0.8px, transparent 0.8px)', backgroundSize: '12px 12px' }}>
              {messages.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-2xl max-w-[75%] text-xs font-semibold leading-relaxed shadow-sm ${m.senderId === 'ADMIN_SUPER_ID' ? 'bg-slate-900 text-white ml-auto rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                  <p className="break-words">{m.message}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[8px] block text-slate-400">{m.timestamp}</span>
                    {m.senderId === 'ADMIN_SUPER_ID' && (
                      <span className="text-[10px]">
                        {m.isSeen ? <span className="text-sky-400 font-bold">✓✓</span> : <span className="text-slate-300">✓</span>}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleAdminSendReply} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
              <input type="text" value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-200 text-xs px-4 py-2.5 rounded-full bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none" />
              <button type="submit" className="bg-slate-950 text-white text-xs font-bold px-6 py-2.5 rounded-full uppercase cursor-pointer">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-xs font-bold font-mono text-slate-400 bg-slate-50/10 gap-2">
            <span>📡 Secure Support Terminal Active</span>
          </div>
        )}
      </div>
    </div>
  );
}