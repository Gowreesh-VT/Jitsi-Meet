import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const EventSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  domain: { type: String, enum: ["AI/ML", "CP", "UI/UX", "CyberSec", "Dev", "Hackathon"], required: true },
  type: { type: String, enum: ["session", "hackathon"], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  roomName: { type: String, required: true, trim: true },
  posterUrl: { type: String, trim: true },
  statusOverride: { type: String, enum: ["auto", "live", "ended"], default: "auto" },
  isLive: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

EventSchema.index({ startTime: 1 });
EventSchema.index({ roomName: 1 }, { unique: true });

export type EventDocument = InferSchemaType<typeof EventSchema>;

export default (mongoose.models.Event as Model<EventDocument>) ||
  mongoose.model<EventDocument>("Event", EventSchema);
