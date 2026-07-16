import BaseRepository from './BaseRepository';
import { AIMemory, IAIMemory } from '../models/AI';

export class AIMemoryRepository extends BaseRepository<IAIMemory> {
  constructor() {
    super(AIMemory);
  }
}

export default AIMemoryRepository;
