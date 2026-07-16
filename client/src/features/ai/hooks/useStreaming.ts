import { useState, useEffect, useRef } from 'react';
import { ICitation } from '../types';
import { getApiBaseUrl } from '../../../lib/env';

export const useStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup active streams on unmount to prevent leaks
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const streamChat = async (
    prompt: string,
    conversationId: string | null,
    onToken: (token: string) => void,
    onComplete: (data: { conversationId: string; citations: ICitation[]; suggestedFollowups: string[] }) => void
  ) => {
    // If a stream is already active, cancel it first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setStreamError(null);

    try {
      const token = localStorage.getItem('token');
      const startupId = localStorage.getItem('startupId');
      const baseApiUrl = getApiBaseUrl();

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
        }),
        signal: controller.signal
      });

      if (!response.body) throw new Error('Streaming response body empty.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let buffer = '';

      while (!finished) {
        if (controller.signal.aborted) {
          break;
        }

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
      if (err.name === 'AbortError') {
        console.log('Stream request aborted.');
      } else {
        console.error('Streaming connection failed:', err);
        setStreamError(err.message || 'Error executing stream.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  return { streamChat, cancelStream, isStreaming, streamError };
};
export default useStreaming;
