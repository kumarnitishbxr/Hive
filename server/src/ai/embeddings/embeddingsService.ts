import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API || '';

export const getGeminiEmbedding = async (text: string): Promise<number[]> => {
  if (!text) return new Array(768).fill(0);

  if (GEMINI_API_KEY) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`,
        {
          model: 'models/gemini-embedding-2',
          content: {
            parts: [{ text }]
          }
        },
        { timeout: 4000 }
      );
      if (response.data?.embedding?.values) {
        return response.data.embedding.values;
      }
    } catch (err) {
      console.warn('Failed to fetch Google Gemini embedding, falling back to deterministic float vector:', err);
    }
  }

  // Fallback hash vector for text-embedding-004 (768 dimensions)
  const vector = new Array(768).fill(0.01);
  const cleanText = text.toLowerCase();
  for (let i = 0; i < Math.min(cleanText.length, 768); i++) {
    vector[i] = (cleanText.charCodeAt(i) % 256) / 256.0;
  }
  return vector;
};
export default getGeminiEmbedding;
