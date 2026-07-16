import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { IMessage } from '../types';

interface MessageListProps {
  messages: IMessage[];
  isStreaming: boolean;
  onRegenerateMessage?: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  onRegenerateMessage
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto Scroll to bottom of message list on new messages or streaming
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 w-full overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar scroll-smooth min-h-0 flex flex-col"
    >
      <div className="flex-1" /> {/* Push content to bottom if there are few messages */}
      
      <div className="space-y-6 w-full max-w-3xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            onRegenerate={onRegenerateMessage ? () => onRegenerateMessage(msg.text) : undefined}
          />
        ))}

        {isStreaming && messages[messages.length - 1]?.sender === 'user' && (
          <div className="animate-fade-in">
            <TypingIndicator />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
