import BaseRepository from './BaseRepository';
import { Task, ITask } from '../models/Task';

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  /**
   * Fetch tasks with query parameters
   */
  async fetchTasks(filter: any = {}, populate: string | string[] = ''): Promise<ITask[]> {
    return this.find(filter, populate);
  }
}

export default TaskRepository;
