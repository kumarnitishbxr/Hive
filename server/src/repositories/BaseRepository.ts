import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Generic Base Repository Pattern implementation for Mongoose Database Layer
 */
export class BaseRepository<T extends Document> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Fetch matching records list
   */
  async find(
    filter: FilterQuery<T> = {},
    populate: string | string[] = '',
    select: string = ''
  ): Promise<T[]> {
    const query = this.model.find(filter);
    if (populate) query.populate(populate as any);
    if (select) query.select(select);
    return query.exec();
  }

  /**
   * Find single record by ID
   */
  async findById(
    id: string,
    populate: string | string[] = '',
    select: string = ''
  ): Promise<T | null> {
    const query = this.model.findById(id);
    if (populate) query.populate(populate as any);
    if (select) query.select(select);
    return query.exec();
  }

  /**
   * Find one matching record
   */
  async findOne(
    filter: FilterQuery<T>,
    populate: string | string[] = '',
    select: string = ''
  ): Promise<T | null> {
    const query = this.model.findOne(filter);
    if (populate) query.populate(populate as any);
    if (select) query.select(select);
    return query.exec();
  }

  /**
   * Insert new record document
   */
  async create(doc: Partial<T>): Promise<T> {
    const newDoc = new this.model(doc);
    return newDoc.save();
  }

  /**
   * Update matching record by ID
   */
  async update(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }

  /**
   * Delete matching record by ID
   */
  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /**
   * Count documents matching filter query
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /**
   * Check if a document matching filter exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const existsObj = await this.model.exists(filter);
    return existsObj !== null;
  }
}

export default BaseRepository;
