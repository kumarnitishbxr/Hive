import { useState } from 'react';
import { ICitation } from '../types';

export const useStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const streamChat = async (
    prompt: string,
    conversationId: string | null,
    onToken: (token: string) => void,
    onComplete: (data: { conversationId: string; citations: ICitation[]; suggestedFollowups: string[] }) => void
  ) => {
    setIsStreaming(true);
    setStreamError(null);

    try {
      const token = localStorage.getItem('token');
      const startupId = localStorage.getItem('startupId');
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5100/api';

      const response = await fetch(`${baseApiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-startup-id': startupId || ''
        },
        body: JSON.stringify({
          prompt,
          conversationId: conversationId || undefined
        })
      });

      if (!response.body) throw new Error('Streaming response body empty.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let buffer = '';

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const messagesList = buffer.split('\n\n');
          buffer = messagesList.pop() || '';

          for (const message of messagesList) {
            const cleanMessage = message.trim();
            if (!cleanMessage) continue;

            if (cleanMessage.startsWith('data: ')) {
              const content = cleanMessage.replace('data: ', '').trim();
              try {
                const parsed = JSON.parse(content);
                if (parsed.done) {
                  finished = true;
                  onComplete({
                    conversationId: parsed.conversationId,
                    citations: parsed.citations || [],
                    suggestedFollowups: parsed.suggestedFollowups || []
                  });
                  break;
                }
                if (parsed.text) {
                  onToken(parsed.text);
                }
              } catch (e) {
                // Ignore parsing errors on partial chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming connection failed:', err);
      setStreamError(err.message || 'Error executing stream.');
    } finally {
      setIsStreaming(false);
    }
  };

  return { streamChat, isStreaming, streamError };
};
export default useStreaming;
