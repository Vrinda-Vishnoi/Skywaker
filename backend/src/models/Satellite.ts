import mongoose, { Schema, Document } from 'mongoose';

export interface ISatellite extends Document {
  noradId: number;
  name: string;
  tleLine1: string;
  tleLine2: string;
  sourceGroup: string;
  tleEpoch: Date;
  updatedAt: Date;
}

const SatelliteSchema: Schema = new Schema({
  noradId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  tleLine1: { type: String, required: true },
  tleLine2: { type: String, required: true },
  sourceGroup: { type: String, required: true, index: true },
  tleEpoch: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model<ISatellite>('Satellite', SatelliteSchema);
