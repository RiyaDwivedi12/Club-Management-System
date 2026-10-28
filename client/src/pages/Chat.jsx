import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import { Send, Loader, Hash, Search, MoreVertical, MessageSquare } from 'lucide-react';
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
    <div className="w-full h-[calc(100vh-100px)] flex bg-white shadow-lg overflow-hidden font-sans border border-gray-200">
      
      {/* Sidebar (Chats List) */}
      <div className="w-full md:w-[30%] lg:w-[350px] bg-white flex flex-col border-r border-gray-200 shrink-0">
        
        {/* Sidebar Header */}
        <div className="bg-[#f0f2f5] h-16 flex items-center justify-between px-4 shrink-0 border-b border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
             {/* User Avatar Placeholder */}
             {user?.profilePicture && user?.profilePicture !== 'default.jpg'
               ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover"/>
               : <span className="text-white font-black text-sm">{(user?.name || 'U').charAt(0).toUpperCase()}</span>}
          </div>
          <div className="flex gap-4 text-[#54656f]">
            <MoreVertical size={24} className="cursor-pointer" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-2 border-b border-gray-200 shrink-0">
          <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5 gap-3">
            <Search size={18} className="text-[#54656f]" />
            <input 
              type="text" 
              placeholder="Search clubs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder-[#54656f]"
            />
          </div>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredClubs.length === 0 ? (
            <div className="p-4 text-center text-[#54656f] text-sm mt-4">
              {searchQuery ? 'No clubs found.' : 'You have not joined any clubs yet.'}
            </div>
          ) : (
            filteredClubs.map(club => (
              <button
                key={club._id}
                onClick={() => setActiveClubId(club._id)}
                className={`w-full text-left flex items-center px-4 py-3.5 transition-colors cursor-pointer ${
                  activeClubId === club._id ? 'bg-teal-50/80 border-l-4 border-l-teal-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 overflow-hidden mr-3">
                   {club.logo ? (
                     <img src={club.logo} alt={club.name} className="w-full h-full object-cover"/>
                   ) : (
                     <Hash size={20} className="text-teal-700" />
                   )}
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-100 pb-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-black text-gray-900 truncate">{club.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium truncate block">Club discussion channel</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#efeae2] flex flex-col relative">
        
        {/* Chat Header */}
        <div className="bg-[#f0f2f5] h-16 flex items-center px-4 shrink-0 border-b border-gray-200 z-10">
          {activeClub ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0 overflow-hidden mr-3">
                {activeClub.logo ? (
                  <img src={activeClub.logo} alt={activeClub.name} className="w-full h-full object-cover"/>
                ) : (
                  <Hash size={20} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1 cursor-pointer">
                <h2 className="text-[16px] text-[#111b21]">{activeClub.name}</h2>
                <p className="text-[13px] text-[#667781]">
                  This is a {activeClub.name} group
                </p>
              </div>
              <div className="flex gap-4 text-[#54656f]">
                <Search size={24} className="cursor-pointer" />
                <MoreVertical size={24} className="cursor-pointer" />
              </div>
            </>
          ) : (
            <div className="text-[#111b21] font-medium">Select a chat</div>
          )}
        </div>

        {/* Messages */}
        <div 
          className="flex-1 p-4 overflow-y-auto z-10 bg-[#f0f2f5]/60"
        >
          {!activeClubId ? (
             <div className="h-full flex flex-col items-center justify-center text-[#54656f]">
             </div>
          ) : isFetchingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader className="animate-spin text-primary-600" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white/80 backdrop-blur-sm text-[13px] text-gray-500 px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-medium">
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
                    <div className={`max-w-[65%] px-2 py-1 rounded-md shadow-sm relative text-[14px] leading-relaxed ${
                      isSelf ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                    }`}>
                      {showSenderName && (
                        <div className="text-[12.5px] font-medium text-[#1fa855] mb-0.5" style={{ filter: 'brightness(0.8)' }}>
                          {msg.sender?.name || 'Unknown'}
                        </div>
                      )}
                      <div className="text-[#111b21] whitespace-pre-wrap word-break">
                        {msg.text}
                      </div>
                      <div className="text-[11px] text-[#667781] text-right mt-1 ml-4 float-right leading-none">
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
          <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] min-h-[62px] px-4 py-2 flex items-end gap-3 z-10 shrink-0">
            <div className="flex-1 bg-white rounded-lg flex items-center min-h-[42px] px-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                className="w-full bg-transparent border-none outline-none text-[#111b21] text-[15px] py-2"
                autoComplete="off"
              />
            </div>
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all p-2.5 h-[42px] w-[42px] flex items-center justify-center disabled:opacity-40 shadow-sm cursor-pointer"
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
