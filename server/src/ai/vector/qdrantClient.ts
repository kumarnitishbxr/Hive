import axios from 'axios';
import { AIVectorStore } from '../../models/AI';

const QDRANT_URL = process.env.QDRANT_URL || '';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

const getQdrantHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (QDRANT_API_KEY) {
    headers['api-key'] = QDRANT_API_KEY;
  }
  return headers;
};

// Initialize Qdrant Collection if not exists
export const initQdrantCollection = async (collectionName: string) => {
  if (!QDRANT_URL) return;
  try {
    const url = `${QDRANT_URL}/collections/${collectionName}`;
    await axios.put(
      url,
      {
        vectors: {
          size: 768, // text-embedding-004 dimensions size
          distance: 'Cosine'
        }
      },
      { headers: getQdrantHeaders(), timeout: 3000 }
    );
  } catch (err: any) {
    // Ignore collection already exists errors
  }
};

// Upsert payload vector to Qdrant collection (falls back to MongoDB store)
export const upsertVector = async (
  workspaceId: string,
  collectionName: string,
  refId: string,
  vector: number[],
  text: string,
  metadata: Record<string, any> = {}
) => {
  if (QDRANT_URL) {
    try {
      await initQdrantCollection(collectionName);
      const url = `${QDRANT_URL}/collections/${collectionName}/points?wait=true`;
      await axios.put(
        url,
        {
          points: [
            {
              id: refId.match(/^[0-9a-fA-F]{24}$/) ? undefined : Math.floor(Math.random() * 1000000), // Qdrant expects specific format or int IDs
              vector,
              payload: {
                workspaceId,
                refId,
                text,
                ...metadata
              }
            }
          ]
        },
        { headers: getQdrantHeaders(), timeout: 4000 }
      );
      return;
    } catch (err) {
      console.warn('Failed to upsert to Qdrant, syncing to MongoDB vector store instead:', err);
    }
  }

  // Fallback to local MongoDB Vector Store
  await AIVectorStore.findOneAndUpdate(
    { workspaceId, refId },
    { workspaceId, category: collectionName, refId, text, vector, metadata },
    { upsert: true }
  );
};

// Search top K points from Qdrant collection (with Cosine fallback)
export const searchQdrant = async (
  workspaceId: string,
  collectionName: string,
  vector: number[],
  limit: number = 5
): Promise<{ text: string; refId: string; score: number; metadata: any }[]> => {
  if (QDRANT_URL) {
    try {
      const url = `${QDRANT_URL}/collections/${collectionName}/points/search`;
      const response = await axios.post(
        url,
        {
          vector,
          filter: {
            must: [
              {
                key: 'workspaceId',
                match: {
                  value: workspaceId
                }
              }
            ]
          },
          limit,
          with_payload: true
        },
        { headers: getQdrantHeaders(), timeout: 4000 }
      );
      if (response.data?.result) {
        return response.data.result.map((res: any) => ({
          text: res.payload?.text || '',
          refId: res.payload?.refId || '',
          score: res.score,
          metadata: res.payload || {}
        }));
      }
    } catch (err) {
      console.warn('Qdrant similarity search failed, falling back to local database matches:', err);
    }
  }

  // Fallback Cosine matching on MongoDB store
  const allVectors = await AIVectorStore.find({ workspaceId, category: collectionName });
  const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + (val * (b[i] || 0)), 0);
  const magnitude = (arr: number[]) => Math.sqrt(arr.reduce((sum, val) => sum + (val * val), 0));
  
  const matches = allVectors.map(doc => {
    const magA = magnitude(vector);
    const magB = magnitude(doc.vector);
    const score = (magA === 0 || magB === 0) ? 0 : dotProduct(vector, doc.vector) / (magA * magB);
    return {
      text: doc.text,
      refId: doc.refId.toString(),
      score,
      metadata: doc.metadata
    };
  });

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
