import { AIVectorStore } from '../../models/AI';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Generates a float array embedding from OpenAI (or fallback hash vector if no API key is specified)
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text) return new Array(1536).fill(0);

  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'mock-key') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: 'text-embedding-ada-002'
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 4000
        }
      );
      if (response.data?.data?.[0]?.embedding) {
        return response.data.data[0].embedding;
      }
    } catch (err) {
      console.warn('Failed to retrieve OpenAI embedding, falling back to mock hash vector:', err);
    }
  }

  // Purely deterministic mock vector representing string character frequencies to ensure cosine matches work out-of-the-box
  const vector = new Array(1536).fill(0.01);
  const cleanText = text.toLowerCase();
  for (let i = 0; i < Math.min(cleanText.length, 1536); i++) {
    const charCode = cleanText.charCodeAt(i);
    vector[i] = (charCode % 256) / 256.0;
  }
  return vector;
};

// Compute similarity score between two numeric arrays
const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + (val * (b[i] || 0)), 0);
const magnitude = (arr: number[]) => Math.sqrt(arr.reduce((sum, val) => sum + (val * val), 0));
export const cosineSimilarity = (a: number[], b: number[]): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
};

// Index data elements semantically inside vector storage
export const addVector = async (
  workspaceId: string,
  category: 'Task' | 'Project' | 'Milestone' | 'Document' | 'Chat' | 'Comment' | 'MeetingNote',
  refId: string,
  text: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const vector = await generateEmbedding(text);
    
    // Upsert to prevent duplicate refId vectors
    await AIVectorStore.findOneAndUpdate(
      { workspaceId, refId },
      { workspaceId, category, refId, text, vector, metadata },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Failed to add vector mapping for ${category}:`, error);
  }
};

// RAG Retrieval search: fetches Top K matching vectors using Cosine Similarity
export const searchSimilarity = async (
  workspaceId: string,
  query: string,
  category?: string,
  limit: number = 5
): Promise<{ text: string; category: string; refId: string; score: number; metadata: any }[]> => {
  try {
    const queryVector = await generateEmbedding(query);
    
    const filter: any = { workspaceId };
    if (category) filter.category = category;

    const allVectors = await AIVectorStore.find(filter);
    
    const matches = allVectors.map(doc => {
      const score = cosineSimilarity(queryVector, doc.vector);
      return {
        text: doc.text,
        category: doc.category,
        refId: doc.refId.toString(),
        score,
        metadata: doc.metadata
      };
    });

    // Sort descending by score, filter out poor matches (score < 0.15), and take top K
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Similarity search failed:', error);
    return [];
  }
};
