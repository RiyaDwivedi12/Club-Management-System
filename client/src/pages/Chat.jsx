import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { Send, User, MessageSquare } from 'lucide-react';

const Chat = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Welcome to the student chat!', isSystem: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages([...messages, {
      id: Date.now(),
      sender: user?.name || 'You',
      text: newMessage,
      isSelf: true
    }]);
    setNewMessage('');
    
    // In a real app, you would send this to your backend via socket.io
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6 p-6 rounded-[32px] bg-white text-gray-900 shadow-soft flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
          <MessageSquare size={24} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Campus Chat</h1>
          <p className="text-gray-500 font-medium text-sm">Connect with other students and club members</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] shadow-soft overflow-hidden flex flex-col border border-gray-100">
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] flex gap-3 ${msg.isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                {!msg.isSystem && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-primary-600" />
                  </div>
                )}
                
                <div className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                  {!msg.isSystem && (
                    <span className="text-xs font-bold text-gray-500 mb-1 px-1">
                      {msg.sender}
                    </span>
                  )}
                  <div className={`p-4 rounded-2xl ${
                    msg.isSystem ? 'bg-gray-200 text-gray-600 italic text-center w-full rounded-full px-6 text-sm font-semibold' :
                    msg.isSelf ? 'bg-primary-600 text-white rounded-tr-none' : 
                    'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-4 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border-none rounded-full px-6 py-4 text-gray-800 focus:ring-2 focus:ring-primary-500 font-medium placeholder:text-gray-400 outline-none"
          />
          <button 
            type="submit"
            className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors shrink-0"
            disabled={!newMessage.trim()}
          >
            <Send size={20} className={newMessage.trim() ? "translate-x-0.5" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
