import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import { 
  Send, Loader, Hash, Search, MoreVertical, MessageSquare, Image, 
  Reply, Heart, X, Lock, ShieldCheck, Crown, Award, CheckCircle2, 
  Sparkles, Camera, Eye
} from 'lucide-react';
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
  const [isSending, setIsSending] = useState(false);

  // Instagram Reply State
  const [replyingTo, setReplyingTo] = useState(null); // { messageId, senderName, text, image }

  // Instagram Image Sharing State
  const [selectedImage, setSelectedImage] = useState(null); // base64 string
  const [imagePreview, setImagePreview] = useState(null);
  const [viewingImage, setViewingImage] = useState(null); // full screen lightbox
  const imageInputRef = useRef(null);

  // Chat Permission State (from active club)
  const [allowAllToChat, setAllowAllToChat] = useState(true);
  const [isTogglingPermission, setIsTogglingPermission] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    fetchClubs();
  }, [user, navigate, fetchClubs]);

  // Filter clubs the user belongs to, has paid dues for, or leads
  const myClubs = clubs.filter(club => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const userIdStr = user._id?.toString();
    const isMember = (club.members || []).some(m => (m?._id || m)?.toString() === userIdStr);
    const presId = (club.presidentId?._id || club.presidentId)?.toString();
    const vpId = (club.vicePresidentId?._id || club.vicePresidentId)?.toString();
    const facId = (club.facultyId?._id || club.facultyId)?.toString();
    return isMember || presId === userIdStr || vpId === userIdStr || facId === userIdStr;
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

  const activeClub = clubs.find(c => c._id === activeClubId);

  // Update permission state from activeClub
  useEffect(() => {
    if (activeClub) {
      setAllowAllToChat(activeClub.allowAllToChat !== false);
    }
  }, [activeClub]);

  // Is current user a leader of this club (President, VP, Faculty, Admin)?
  const isLeader = Boolean(
    user && activeClub && (
      user.role === 'admin' ||
      (activeClub.presidentId?._id || activeClub.presidentId)?.toString() === user._id?.toString() ||
      (activeClub.vicePresidentId?._id || activeClub.vicePresidentId)?.toString() === user._id?.toString() ||
      (activeClub.facultyId?._id || activeClub.facultyId)?.toString() === user._id?.toString() ||
      ['president', 'vice_president', 'faculty'].includes(user.role)
    )
  );

  // Can the current user send messages right now?
  const canSend = isLeader || allowAllToChat;

  useEffect(() => {
    if (!activeClubId) return;

    const fetchMessages = async () => {
      setIsFetchingMessages(true);
      try {
        const response = await axios.get(`/api/messages/${activeClubId}`, { withCredentials: true });
        setMessages(Array.isArray(response.data) ? response.data : []);
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

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    const handlePermission = ({ clubId, allowAllToChat }) => {
      if (clubId === activeClubId) {
        setAllowAllToChat(allowAllToChat);
        toast(allowAllToChat ? '💬 Chat is now open for all members!' : '📢 Announcement Mode enabled by Leadership', {
          icon: allowAllToChat ? '🔓' : '🔒'
        });
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageReaction', handleReaction);
    socket.on('chatPermissionChanged', handlePermission);

    return () => {
      socket.emit('leaveChat', activeClubId);
      socket.off('newMessage', handleNewMessage);
      socket.off('messageReaction', handleReaction);
      socket.off('chatPermissionChanged', handlePermission);
    };
  }, [activeClubId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Image File selection & convert to base64
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Toggle Chat Permission (President / VP control)
  const handleTogglePermission = async () => {
    if (!isLeader || !activeClubId) return;
    setIsTogglingPermission(true);
    try {
      const nextState = !allowAllToChat;
      const res = await axios.put(`/api/messages/${activeClubId}/permission`, { allowAllToChat: nextState }, { withCredentials: true });
      setAllowAllToChat(nextState);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update chat permission');
    } finally {
      setIsTogglingPermission(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !activeClubId || isSending) return;

    if (!canSend) {
      toast.error('Only President & Vice President can post right now.');
      return;
    }

    setIsSending(true);
    const textToSend = newMessage.trim();
    const imageToSend = selectedImage;
    const replyToSend = replyingTo;

    // Reset input fields instantly
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setReplyingTo(null);
    if (imageInputRef.current) imageInputRef.current.value = '';

    try {
      await axios.post(`/api/messages/${activeClubId}`, {
        text: textToSend,
        image: imageToSend,
        replyTo: replyToSend
      }, { withCredentials: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Instagram Double-Tap / Heart Reaction
  const handleReact = async (messageId) => {
    try {
      await axios.post(`/api/messages/${messageId}/react`, { emoji: '❤️' }, { withCredentials: true });
    } catch (err) {
      // quiet fail
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-50 border-t border-slate-100 overflow-hidden font-sans">
      {/* ── LEFT SIDEBAR: CLUBS ───────────────────────────────────── */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="text-teal-600" size={20} /> Club Group Chats
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search your clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
          {filteredClubs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">No club chats found</p>
              <p className="text-[11px] mt-1">Join a club to unlock its live group chat!</p>
            </div>
          ) : (
            filteredClubs.map((club) => {
              const isSelected = club._id === activeClubId;
              const isClubPres = (club.presidentId?._id || club.presidentId)?.toString() === user?._id?.toString();
              const isClubVP = (club.vicePresidentId?._id || club.vicePresidentId)?.toString() === user?._id?.toString();

              return (
                <button
                  key={club._id}
                  onClick={() => setActiveClubId(club._id)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 shadow-xs border border-teal-200/60'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs overflow-hidden">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                      club.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black truncate">{club.name}</h4>
                      {isClubPres ? (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Crown size={10} /> Pres
                        </span>
                      ) : isClubVP ? (
                        <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Award size={10} /> VP
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                      {club.category} • {club.members?.length || 0} members
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT MAIN CHAT AREA (INSTAGRAM STYLE) ────────────────── */}
      {activeClub ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Top Chat Bar */}
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-xs overflow-hidden">
                {activeClub.logo ? (
                  <img src={activeClub.logo} alt={activeClub.name} className="w-full h-full object-cover" />
                ) : (
                  activeClub.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  {activeClub.name}
                  {allowAllToChat ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Open Chat
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Lock size={10} /> Announcements Only
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {activeClub.members?.length || 0} members • Official Club Channel
                </p>
              </div>
            </div>

            {/* Leadership Controls: Allow all to chat toggle */}
            <div className="flex items-center gap-2">
              {isLeader && (
                <button
                  onClick={handleTogglePermission}
                  disabled={isTogglingPermission}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    allowAllToChat
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  title={allowAllToChat ? "Switch to Leaders-Only Announcements" : "Allow All Members to Chat"}
                >
                  {allowAllToChat ? (
                    <>
                      <Lock size={13} /> Restrict to Leaders Only
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Allow All Members to Chat
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {isFetchingMessages ? (
              <div className="h-full flex items-center justify-center">
                <Loader className="animate-spin text-teal-600" size={24} />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <MessageSquare size={32} />
                </div>
                <h4 className="font-black text-slate-900 text-sm">No messages yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Start the conversation! Share event updates, images, and chat with members.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?._id?.toString() === user?._id?.toString();
                const isMsgLeader = ['president', 'vice_president', 'faculty', 'admin'].includes(msg.sender?.role);
                const hasReacted = (msg.reactions || []).some(r => r.userId?.toString() === user?._id?.toString());

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender name for other users */}
                    {!isMe && (
                      <span className="text-[11px] font-bold text-slate-500 mb-1 ml-1 flex items-center gap-1">
                        {msg.sender?.name || 'Member'}
                        {isMsgLeader && (
                          <span className="text-[9px] font-black uppercase bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded">
                            {msg.sender?.role === 'president' ? 'President' : msg.sender?.role === 'vice_president' ? 'VP' : 'Leader'}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Main Bubble Container with Instagram Hover Actions */}
                    <div className="relative max-w-md">
                      {/* Quoted Reply Header (Instagram Style) */}
                      {msg.replyTo && (msg.replyTo.text || msg.replyTo.image || msg.replyTo.senderName) && (
                        <div className={`text-[11px] p-2 rounded-t-2xl border-l-4 mb-0.5 ${
                          isMe 
                            ? 'bg-teal-700/30 text-teal-100 border-white' 
                            : 'bg-slate-200/80 text-slate-700 border-teal-600'
                        }`}>
                          <span className="font-black block text-[10px]">
                            ↳ Replying to {msg.replyTo.senderName || 'Member'}
                          </span>
                          <p className="truncate font-medium">{msg.replyTo.text || '📷 Photo'}</p>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        onDoubleClick={() => handleReact(msg._id)}
                        className={`rounded-3xl p-3.5 shadow-xs transition-all relative overflow-hidden select-text ${
                          isMe
                            ? 'bg-gradient-to-tr from-teal-600 to-emerald-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200/70 rounded-bl-xs'
                        }`}
                      >
                        {/* Attached Image (Instagram Style) */}
                        {msg.image && (
                          <div className="mb-2 rounded-2xl overflow-hidden cursor-pointer">
                            <img
                              src={msg.image}
                              alt="Shared photo"
                              onClick={() => setViewingImage(msg.image)}
                              className="max-h-72 w-full object-cover hover:scale-[1.02] transition"
                            />
                          </div>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        )}

                        {/* Timestamp */}
                        <span className={`text-[9px] block text-right mt-1 font-semibold ${
                          isMe ? 'text-teal-200' : 'text-slate-400'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Heart Reactions Badge (Instagram Style) */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <button
                          onClick={() => handleReact(msg._id)}
                          className="absolute -bottom-2 right-2 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm flex items-center gap-1 cursor-pointer hover:scale-110 transition"
                        >
                          <span>❤️</span>
                          {msg.reactions.length > 1 && (
                            <span className="font-bold text-slate-700 text-[9px]">{msg.reactions.length}</span>
                          )}
                        </button>
                      )}

                      {/* Hover Action: Reply & React (Instagram Style) */}
                      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 ${
                        isMe ? '-left-16' : '-right-16'
                      }`}>
                        <button
                          onClick={() => setReplyingTo({
                            messageId: msg._id,
                            senderName: msg.sender?.name || 'Member',
                            text: msg.text || '',
                            image: msg.image || ''
                          })}
                          className="p-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-600 shadow-sm border border-slate-200 transition cursor-pointer"
                          title="Reply"
                        >
                          <Reply size={13} />
                        </button>
                        <button
                          onClick={() => handleReact(msg._id)}
                          className={`p-1.5 rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200 transition cursor-pointer ${
                            hasReacted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                          }`}
                          title="Heart"
                        >
                          <Heart size={13} fill={hasReacted ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT AREA ─────────────────────────────────────────── */}
          <div className="p-4 bg-white border-t border-slate-100">
            {/* Instagram Replying-To Banner */}
            {replyingTo && (
              <div className="mb-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 truncate">
                  <Reply size={14} className="text-teal-600 shrink-0" />
                  <span className="font-bold">Replying to {replyingTo.senderName}:</span>
                  <span className="text-slate-600 truncate">{replyingTo.text || '📷 Photo'}</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Image Preview Banner before sending */}
            {imagePreview && (
              <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
                  <span className="text-xs font-bold text-slate-700">Photo attached (ready to send)</span>
                </div>
                <button
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Hidden File Picker */}
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {canSend ? (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Photo attachment button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Share Image"
                >
                  <Camera size={18} />
                </button>

                <input
                  type="text"
                  placeholder={replyingTo ? "Write your reply..." : "Send message or photo..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedImage) || isSending}
                  className="p-2.5 bg-gradient-to-tr from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 text-white rounded-2xl transition shadow-xs cursor-pointer"
                >
                  {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
                <Lock size={15} />
                Only Club President & Vice-President can send messages right now. Announcements only.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
          <MessageSquare size={48} className="text-slate-300 mb-3" />
          <h3 className="font-black text-slate-700 text-sm">Select a club chat</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Choose a club from the left to read messages, share photos, and interact with fellow members.
          </p>
        </div>
      )}

      {/* ── FULL SCREEN IMAGE LIGHTBOX ─────────────────────────────── */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
          >
            <X size={24} />
          </button>
          <img
            src={viewingImage}
            alt="Full view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
