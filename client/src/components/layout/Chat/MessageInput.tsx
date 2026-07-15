import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, 
  Paperclip, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  X, 
  Image as ImageIcon 
} from 'lucide-react';
import { MessageType } from '../../../store/slices/chatSlice';

interface MessageInputProps {
  onSendMessage: (text: string, attachments: any[]) => void;
  replyToMessage: MessageType | null;
  onClearReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyToMessage,
  onClearReply,
  onTyping
}) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  
  // Voice Recording simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<any>(null);

  // Typing debounce timer
  const typingTimer = useRef<any>(null);
  const isTypingRef = useRef(false);

  const emojis = ['👍', '❤️', '😂', '🎉', '🔥', '🚀', '👀', '🤔', '👏', '💯', '💡', '💻', '🤝', '✅', '⚠️'];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    // Typing indicators mapping
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    onClearReply();
    
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Simulated AI Smart Replies
  const triggerAiSmartReply = () => {
    const smartReplies = [
      "On it! Will update the Kanban board shortly.",
      "Looks excellent, let's schedule a alignment sync.",
      "Can we review this milestone progress today?",
      "Perfect, I've shared the slide deck with the investor.",
      "Understood. Let me look at the runway simulator changes.",
      "Awesome, congratulations on the validation score!"
    ];
    const randomReply = smartReplies[Math.floor(Math.random() * smartReplies.length)];
    setText(randomReply);
  };

  // Simulated File Uploads
  const simulateFileUpload = (type: 'image' | 'pdf' | 'doc') => {
    let mockFile = {};
    if (type === 'image') {
      mockFile = {
        name: `screenshot_glow_${Date.now().toString().slice(-4)}.png`,
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
        fileType: 'image/png'
      };
    } else if (type === 'pdf') {
      mockFile = {
        name: `incorporation_draft_2026.pdf`,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf'
      };
    } else {
      mockFile = {
        name: `swot_audit_deck.docx`,
        url: '#',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
    }

    setAttachments(prev => [...prev, mockFile]);
  };

  // Simulated Voice Notes
  const toggleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      
      const mockVoiceNote = {
        name: `voice_note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.mp3`,
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Dummy mp3 url
        fileType: 'audio/mp3'
      };
      setAttachments(prev => [...prev, mockVoiceNote]);
      setRecordingSeconds(0);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  return (
    <div className="p-4 border-t border-white/5 bg-slate-950/60 backdrop-blur-md flex flex-col gap-2 relative z-30">
      
      {/* Reply Reference Preview Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-indigo-500/10 border-l-4 border-indigo-500 text-xs text-gray-300">
          <div className="truncate">
            <span className="font-bold text-indigo-400">Replying to {typeof replyToMessage.senderId === 'object' ? replyToMessage.senderId.fullName : 'user'}: </span>
            <span className="italic">{replyToMessage.message}</span>
          </div>
          <button 
            onClick={onClearReply}
            className="p-0.5 text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachment Badges Display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {attachments.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-white/10 text-[11px] text-gray-300">
              <span className="truncate max-w-[150px] font-medium">{file.name}</span>
              <button 
                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="text-gray-500 hover:text-red-400 p-0.5 transition cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input controls container */}
      <div className="flex items-center gap-2 bg-white/3 border border-white/8 focus-within:border-indigo-500/50 rounded-xl px-3 py-2 transition-all">
        
        {/* Attachment menu trigger */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => simulateFileUpload('image')}
            title="Attach Image"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded-lg transition cursor-pointer"
          >
            <ImageIcon size={16} />
          </button>
          <button
            onClick={() => simulateFileUpload('pdf')}
            title="Attach Document/PDF"
            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded-lg transition cursor-pointer"
          >
            <Paperclip size={16} />
          </button>
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          disabled={isRecording}
          placeholder={isRecording ? `Recording Voice Note... (${recordingSeconds}s)` : "Type a message..."}
          className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-gray-500"
        />

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(prev => !prev)}
            title="Add Emoji"
            className={`p-1.5 hover:bg-white/5 rounded-lg transition cursor-pointer ${showEmoji ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Smile size={16} />
          </button>
          
          {showEmoji && (
            <div className="absolute bottom-10 right-0 p-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl grid grid-cols-5 gap-1.5 z-40 w-44">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText(prev => prev + emoji);
                    setShowEmoji(false);
                  }}
                  className="p-1 hover:bg-white/5 rounded text-sm transition cursor-pointer text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Note Recording Trigger */}
        <button
          onClick={toggleVoiceRecording}
          title={isRecording ? "Stop Voice Recording" : "Record Voice Note"}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isRecording 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
          }`}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* AI smart reply quick option */}
        <button
          onClick={triggerAiSmartReply}
          title="AI Smart Reply Suggestion"
          className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded-lg transition cursor-pointer border border-white/5"
        >
          <Sparkles size={16} />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && attachments.length === 0}
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition cursor-pointer"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
