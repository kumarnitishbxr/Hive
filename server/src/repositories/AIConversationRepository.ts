import BaseRepository from './BaseRepository';
import { AIConversation, IAIConversation } from '../models/AI';

export class AIConversationRepository extends BaseRepository<IAIConversation> {
  constructor() {
    super(AIConversation);
  }
}

export default AIConversationRepository;
