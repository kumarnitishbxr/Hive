import BaseRepository from './BaseRepository';
import { Member, IMember } from '../models/User';

export class MemberRepository extends BaseRepository<IMember> {
  constructor() {
    super(Member);
  }

  /**
   * Find member by userId
   */
  async findByUserId(userId: string): Promise<IMember | null> {
    return this.findOne({ userId });
  }

  /**
   * Find member by userId and startupId
   */
  async findByUserIdAndStartupId(userId: string, startupId: string): Promise<IMember | null> {
    return this.findOne({ userId, startupId });
  }
}

export default MemberRepository;
