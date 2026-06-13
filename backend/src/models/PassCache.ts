import mongoose, { Schema, Document } from 'mongoose';

export interface IPassCache extends Document {
  cacheKey: string;
  passes: any[];
  createdAt: Date;
}

const PassCacheSchema: Schema = new Schema({
  cacheKey: { type: String, required: true, unique: true },
  passes: { type: Schema.Types.Mixed, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 3600 // TTL Index: Document automatically deleted after 1 hour (3600 seconds)
  }
});

export default mongoose.model<IPassCache>('PassCache', PassCacheSchema);
