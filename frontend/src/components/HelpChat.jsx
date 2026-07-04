import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:5000');

export default function HelpChat() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || !user._id || location.pathname !== '/') return null;

  const [isOpen, setIsOpen] = useState(() => localStorage.getItem('chat_window_persistent_state') === 'true');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chat_window_persistent_state', isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    socket.emit('get_chat_history', user._id);

    socket.on('receive_message_global', (data) => {
      if (data.room === user._id) {
        setChatHistory((prev) => prev.some(m => m._id === data._id) ? prev : [...prev, data]);
        
        const isFromAdmin = data.senderId === 'ADMIN_SUPER_ID';
        if (!isOpen && isFromAdmin) {
          setUnreadCount(p => p + 1);
          if (Notification.permission === "granted") {
            const userNotif = new Notification("💬 New Reply from Support", {
              body: data.message,
              icon: '/favicon.ico'
            });
            userNotif.onclick = () => {
              window.focus();
              setIsOpen(true);
            };
          }
        }
      }
    });

    socket.on('chat_history', (history) => {
      setChatHistory(history);
      const unread = history.filter(m => m.senderId === 'ADMIN_SUPER_ID' && !m.isSeen && !m.isClosed).length;
      if (!isOpen) setUnreadCount(unread);
    });

    socket.on('chat_cleared_sync_global', (data) => {
      if (data.room === user._id) {
        socket.emit('get_chat_history', user._id);
      }
    });

    return () => {
      socket.off('receive_message_global');
      socket.off('chat_history');
      socket.off('chat_cleared_sync_global');
    };
  }, [user._id, isOpen]);

  useEffect(() => {
    if (isOpen && chatHistory.length > 0) {
      setUnreadCount(0);
      socket.emit('mark_as_seen', { room: user._id, readerId: user._id });
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isOpen, chatHistory]);

  useEffect(() => {
    function clickOutside(e) {
      if (chatBoxRef.current && !chatBoxRef.current.contains(e.target)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('send_message', {
      room: user._id, senderId: user._id, senderName: user.name,
      message: message.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isClosed: false
    });
    setMessage('');
  };

  const activeUserMessages = chatHistory.filter(m => !m.isClosed);

  return (
    <div ref={chatBoxRef} className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end justify-end select-none">
      {isOpen && (
        <div className="bg-white/90 backdrop-blur-xl border border-white/30 w-85 sm:w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 max-h-[80vh] transition-all duration-300 ease-in-out animate-fade-up">
          
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-4 flex items-center justify-between shadow-lg shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                <div className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-sm animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-black tracking-wide text-sm">✨ CUSTOMER SUPPORT</h3>
                <p className="text-[10px] text-emerald-300 font-extrabold tracking-widest">ONLINE · ACTIVE</p>
              </div>
            </div>
          </div>
          
          {/* Chat body with subtle pattern */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/80 to-slate-100/80 backdrop-blur-sm">
            {activeUserMessages.map((msg, index) => {
              const isMe = msg.senderId === user._id;
              return (
                <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-slide`}>
                  <div className={`p-3.5 rounded-2xl max-w-[80%] text-sm font-semibold leading-relaxed shadow-md border break-words transition-all hover:scale-[1.01] ${
                    isMe 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-400/30 rounded-tr-none shadow-indigo-500/20' 
                      : 'bg-white/90 backdrop-blur-sm border-white/60 text-slate-800 rounded-tl-none shadow-slate-200/50'
                  }`}>
                    <p className="select-text whitespace-pre-wrap tracking-wide">{msg.message}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-80 text-[10px] select-none font-bold">
                      <span className={isMe ? 'text-indigo-200' : 'text-slate-500'}>{msg.timestamp}</span>
                      {isMe && (
                        <span>{msg.isSeen ? <span className="text-sky-300 font-black text-xs">✓✓</span> : <span className="text-slate-300 text-xs">✓</span>}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input footer with glass effect */}
          <form onSubmit={handleSend} className="border-t border-white/30 bg-white/70 backdrop-blur-md p-3 flex gap-2 items-center shrink-0">
            <input 
              type="text" 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Type your message here..." 
              className="flex-1 border border-slate-200/80 px-4 py-3 rounded-full text-sm outline-none bg-white/60 focus:bg-white focus:border-indigo-500 font-medium text-slate-700 placeholder-slate-400 transition-all shadow-inner"
            />
            <button 
              type="submit" 
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white w-11 h-11 rounded-full flex items-center justify-center cursor-pointer shadow-lg active:scale-95 text-lg font-black border border-white/20 transition-all hover:shadow-indigo-500/30"
            >
              ➔
            </button>
          </form>
        </div>
      )}
      
      {/* Floating Action Button with pulse ring */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 transition-all active:scale-95 cursor-pointer hover:shadow-indigo-500/40 group"
      >
        <span className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md group-hover:blur-xl transition-all"></span>
        {isOpen ? (
          <span className="text-xl font-black relative z-10">✕</span>
        ) : (
          <span className="text-2xl relative z-10">💬</span>
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-br from-rose-500 to-rose-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xl animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}