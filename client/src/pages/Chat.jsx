import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import { Send, Loader, Hash, Search, MessageSquare, ArrowLeft } from 'lucide-react';
import UserAvatar from '../components/ui/UserAvatar';
import socket from '../utils/socket';
import axios from 'axios';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { clubs, fetchClubs } = useClubStore();
  const [searchParams] = useSearchParams();
  const queryClubId = searchParams.get('clubId');
  
  const [activeClubId, setActiveClubId] = useState(queryClubId || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Layout-only: on small screens show either the club list or the open conversation.
  const [showListOnMobile, setShowListOnMobile] = useState(!queryClubId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    fetchClubs();
  }, [user, navigate, fetchClubs]);

  // Filter clubs the user is a part of, or all clubs if admin
  const myClubs = clubs.filter(club => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const userIdStr = user._id?.toString();
    const isMember = (club.members || []).some(m => (m?._id || m)?.toString() === userIdStr);
    const presId = (club.presidentId?._id || club.presidentId)?.toString();
    const facId = (club.facultyId?._id || club.facultyId)?.toString();
    return isMember || presId === userIdStr || facId === userIdStr;
  });

  const filteredClubs = myClubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (queryClubId && myClubs.some(c => c._id === queryClubId)) {
      setActiveClubId(queryClubId);
    } else if (myClubs.length > 0 && !activeClubId) {
      setActiveClubId(myClubs[0]._id);
    }
  }, [myClubs, activeClubId, queryClubId]);

  useEffect(() => {
    if (!activeClubId) return;

    const fetchMessages = async () => {
      setIsFetchingMessages(true);
      try {
        const response = await axios.get(`/api/messages/${activeClubId}`, { withCredentials: true });
        setMessages(response.data);
      } catch (error) {
        toast.error('Failed to load messages');
      } finally {
        setIsFetchingMessages(false);
      }
    };

    fetchMessages();

    socket.emit('joinChat', activeClubId);

    const handleNewMessage = (newMsg) => {
      if (newMsg.clubId === activeClubId) {
        setMessages((prev) => [...prev, newMsg]);
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.emit('leaveChat', activeClubId);
      socket.off('newMessage', handleNewMessage);
    };
  }, [activeClubId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeClubId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      await axios.post(`/api/messages/${activeClubId}`, { text: messageText }, { withCredentials: true });
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(messageText);
    }
  };

  const activeClub = myClubs.find(c => c._id === activeClubId);

  return (
    <div className="max-w-7xl mx-auto w-full h-[calc(100dvh-184px)] lg:h-[calc(100dvh-128px)] min-h-[420px] flex card overflow-hidden">

      {/* Sidebar (Chats List) */}
      <div className={`${showListOnMobile ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-[340px] bg-white flex-col md:border-r border-slate-200 shrink-0 min-w-0`}>

        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-3 px-4 shrink-0 border-b border-slate-100">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-dark-900 leading-tight">Club Chats</p>
            <p className="text-xs text-slate-500 truncate">{user?.name}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-icon py-2"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredClubs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm mt-4">
              {searchQuery ? 'No clubs found.' : 'You have not joined any clubs yet.'}
            </div>
          ) : (
            filteredClubs.map(club => (
              <button
                key={club._id}
                type="button"
                onClick={() => { setActiveClubId(club._id); setShowListOnMobile(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeClubId === club._id ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                   {club.logo ? (
                     <img src={club.logo} alt={club.name} className="w-full h-full object-cover"/>
                   ) : (
                     <Hash size={20} className="text-blue-600" />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold truncate block ${activeClubId === club._id ? 'text-blue-700' : 'text-dark-900'}`}>{club.name}</span>
                  <span className="text-xs text-slate-500 truncate block">Club discussion channel</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${showListOnMobile ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 bg-slate-50 flex-col relative`}>

        {/* Chat Header */}
        <div className="bg-white h-16 flex items-center gap-3 px-3 sm:px-4 shrink-0 border-b border-slate-100 z-10">
          <button
            type="button"
            onClick={() => setShowListOnMobile(true)}
            className="btn-icon md:hidden -ml-1"
            aria-label="Back to chats"
          >
            <ArrowLeft size={20} />
          </button>
          {activeClub ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                {activeClub.logo ? (
                  <img src={activeClub.logo} alt={activeClub.name} className="w-full h-full object-cover"/>
                ) : (
                  <Hash size={20} className="text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-dark-900 truncate">{activeClub.name}</h2>
                <p className="text-xs text-slate-500 truncate">
                  This is a {activeClub.name} group
                </p>
              </div>
            </>
          ) : (
            <div className="text-sm font-semibold text-slate-600">Select a chat</div>
          )}
        </div>

        {/* Messages */}
        <div
          className="flex-1 p-3 sm:p-4 overflow-y-auto z-10"
        >
          {!activeClubId ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <MessageSquare size={36} strokeWidth={1.5} />
             </div>
          ) : isFetchingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white text-sm text-slate-500 px-4 py-2.5 rounded-xl shadow-sm border border-slate-200">
                No messages yet. Send a message to start the conversation!
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {messages.map((msg, index) => {
                const isSelf = msg.sender?._id === user?._id;
                const showSenderName = !isSelf && (index === 0 || messages[index - 1].sender?._id !== msg.sender?._id);

                return (
                  <div key={msg._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm relative text-sm leading-relaxed ${
                      isSelf ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-dark-900 rounded-bl-md'
                    }`}>
                      {showSenderName && (
                        <div className="text-xs font-semibold text-indigo-600 mb-0.5">
                          {msg.sender?.name || 'Unknown'}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                      <div className={`text-[11px] text-right mt-1 leading-none ${isSelf ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
        </div>

        {/* Message Input */}
        {activeClubId && (
          <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-100 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 z-10 shrink-0">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="input flex-1 min-w-0"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-primary w-11 h-11 p-0 shrink-0 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
