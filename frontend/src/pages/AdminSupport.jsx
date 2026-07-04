import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io.connect('http://localhost:5000');

export default function AdminSupport() {
  const [activeUsers, setActiveUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState([]);
  
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeletedAccordion, setShowDeletedAccordion] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchActiveChatsList = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/support-chats');
      setActiveUsers(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSelectedUserChatHistory = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/chat-history/${userId}`);
      setMessages(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    fetchActiveChatsList();
  }, []);

  useEffect(() => {
    socket.on('receive_message_global', (data) => {
      const isCurrentRoom = selectedUser && selectedUser.id === data.room;
      
      if (isCurrentRoom) {
        setMessages((prev) => prev.some(m => m._id === data._id) ? prev : [...prev, data]);
        socket.emit('mark_as_seen', { room: selectedUser.id, readerId: 'ADMIN_SUPER_ID' });
      }

      if (data.senderId !== 'ADMIN_SUPER_ID' && !isCurrentRoom && Notification.permission === "granted") {
        const notif = new Notification(`💬 Message from ${data.senderName}`, {
          body: data.message,
          icon: '/favicon.ico'
        });
        notif.onclick = () => {
          window.focus();
          const targetUser = activeUsers.find(u => u.id === data.room) || { id: data.room, name: data.senderName };
          setSelectedUser(targetUser);
        };
      }
      fetchActiveChatsList();
    });

    socket.on('chat_cleared_sync_global', (data) => {
      if (selectedUser && selectedUser.id === data.room) {
        fetchSelectedUserChatHistory(selectedUser.id);
      }
      fetchActiveChatsList();
    });

    return () => {
      socket.off('receive_message_global');
      socket.off('chat_cleared_sync_global');
    };
  }, [selectedUser, activeUsers]);

  useEffect(() => {
    if (selectedUser) {
      fetchSelectedUserChatHistory(selectedUser.id);
      socket.emit('mark_as_seen', { room: selectedUser.id, readerId: 'ADMIN_SUPER_ID' });
      setShowDeletedAccordion(false);
      setActiveUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unread: 0 } : u));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  const handleAdminSend = (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUser) return;

    socket.emit('send_message', {
      room: selectedUser.id, senderId: 'ADMIN_SUPER_ID', senderName: 'Admin Hirenbhai',
      message: reply.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isClosed: false
    });
    setReply('');
  };

  const handlePurgeSoftAction = async () => {
    if (!selectedUser) return;
    if (!window.confirm("Are you sure you want to delete this chat workspace log?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/clear-chat/${selectedUser.id}`);
    } catch (err) { console.error(err); }
  };

  const liveMessages = messages.filter(m => !m.isClosed);
  const deletedHistoryLogs = messages.filter(m => m.isClosed);

  return (
    <div className="h-[85vh] flex bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden font-sans text-slate-800 shadow-2xl relative">
      
      {/* Info Modal with glassmorphism */}
      {showInfoModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 w-85 shadow-2xl border border-white/30 flex flex-col gap-4 transform transition-all scale-100">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Customer Metadata</h4>
              <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-900 text-sm font-bold cursor-pointer transition-colors">✕</button>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              <div><span className="text-slate-400 block font-normal text-[10px] mb-0.5">ACCOUNT NAME</span> <p className="text-slate-800 text-sm font-bold">{selectedUser.name}</p></div>
              <div><span className="text-slate-400 block font-normal text-[10px] mb-0.5">ROOM USER ID</span> <p className="text-indigo-600 font-mono text-xs break-all bg-slate-50 p-2.5 rounded-xl border border-slate-100">{selectedUser.id}</p></div>
              <div><span className="text-slate-400 block font-normal text-[10px] mb-0.5">ROUTING</span> <p className="text-emerald-600 font-medium">● Secure Live P2P Channel</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar — Inbox Channels */}
      <div className="w-80 border-r border-slate-200/60 bg-white/70 backdrop-blur-sm flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200/50 bg-white/50">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Inbox Channels
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/30">
          {activeUsers.map((u) => {
            const isSelected = selectedUser?.id === u.id;
            return (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)} 
                className={`p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                    : 'bg-white/80 hover:bg-white border border-slate-200/60 hover:border-indigo-200/60 hover:shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center uppercase shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                  {u.name?.slice(0,2)}
                </div>
                <div className="flex-1 min-w-0 relative">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold truncate pr-1">{u.name}</p>
                    <span className={`text-[8px] font-medium shrink-0 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{u.lastTime}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-[11px] truncate max-w-[150px] ${isSelected ? 'text-indigo-100/80' : 'text-slate-500'}`}>{u.lastMessage}</p>
                    {u.unread > 0 && !isSelected && (
                      <span className="bg-gradient-to-br from-rose-500 to-rose-600 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-rose-500/20 animate-pulse">
                        {u.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Workspace — Chat Viewport */}
      <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-sm">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-slate-200/60 bg-white/50 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-sm animate-pulse"></div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  Chatting with: <span className="text-indigo-600 font-extrabold">{selectedUser.name}</span>
                  <button 
                    onClick={() => setShowInfoModal(true)} 
                    className="text-slate-400 hover:text-indigo-600 text-sm cursor-pointer transition-colors p-0.5 hover:bg-indigo-50 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ℹ️
                  </button>
                </div>
              </div>
              <button 
                onClick={handlePurgeSoftAction} 
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 font-bold text-[10px] uppercase tracking-wide px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-rose-200/40"
              >
                🗑️ Delete logs
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/50 to-slate-100/30" style={{ backgroundImage: 'radial-gradient(#cbd5e1 0.6px, transparent 0.6px)', backgroundSize: '14px 14px' }}>
              
              {/* Deleted History Accordion */}
              {deletedHistoryLogs.length > 0 && (
                <div className="w-full py-1.5 flex flex-col items-center gap-3 select-none">
                  <button 
                    onClick={() => setShowDeletedAccordion(!showDeletedAccordion)} 
                    className="bg-white/80 backdrop-blur-sm border border-slate-200/70 text-slate-500 hover:text-slate-800 font-medium text-[10px] px-5 py-2 rounded-full shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {showDeletedAccordion ? 'Hide Archived' : '👁️ View Archived Logs'}
                  </button>
                  
                  {showDeletedAccordion && (
                    <div className="w-full space-y-3.5 mt-2 border-l-2 border-dashed border-rose-200/70 pl-3 animate-fade-slide">
                      {deletedHistoryLogs.map((dm, dIdx) => {
                        const isAdminLog = dm.senderId === 'ADMIN_SUPER_ID';
                        return (
                          <div key={`old-${dIdx}`} className={`flex w-full ${isAdminLog ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3.5 rounded-2xl max-w-[70%] text-xs font-medium opacity-60 border border-slate-200/40 shadow-sm break-words ${
                              isAdminLog ? 'bg-slate-100 text-slate-600 rounded-tr-none' : 'bg-white text-slate-600 rounded-tl-none'
                            }`}>
                              <span className="block text-[8px] font-bold text-rose-400/80 mb-0.5 tracking-wider uppercase">[Archived]</span>
                              <p className="whitespace-pre-wrap">{dm.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Live Messages */}
              {liveMessages.map((m, idx) => {
                const isAdminMsg = m.senderId === 'ADMIN_SUPER_ID';
                return (
                  <div key={idx} className={`flex w-full ${isAdminMsg ? 'justify-end' : 'justify-start'} animate-fade-slide`}>
                    <div className={`p-3.5 rounded-2xl max-w-[70%] text-sm font-medium shadow-sm break-words leading-relaxed transition-all hover:scale-[1.01] ${
                      isAdminMsg 
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-none shadow-slate-800/20' 
                        : 'bg-white/90 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-tl-none shadow-slate-200/30'
                    }`}>
                      <p className="select-text whitespace-pre-wrap">{m.message}</p>
                      <div className="text-[8px] mt-1 text-right text-slate-400/80 select-none">{m.timestamp}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleAdminSend} className="p-3.5 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm flex gap-2 z-10 shadow-inner">
              <input 
                type="text" 
                value={reply} 
                onChange={e => setReply(e.target.value)} 
                placeholder="Type a response..." 
                className="flex-1 border border-slate-200/70 text-sm px-5 py-3.5 rounded-full bg-slate-50/70 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium shadow-inner"
              />
              <button 
                type="submit" 
                className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white text-xs font-bold px-6 py-3.5 rounded-full uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-slate-800/30 active:scale-95"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-xs font-bold font-mono text-slate-400 bg-slate-50/30">
            <span className="text-4xl mb-3 opacity-30">📡</span>
            Terminal Connected.<br/>Select a channel from the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}