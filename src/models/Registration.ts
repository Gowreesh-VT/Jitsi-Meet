import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const RegistrationSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mobileNumber: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit mobile number"],
  },
  registrationNumber: { type: String, trim: true },
  schoolCollegeName: { type: String, trim: true },
  institutionType: { type: String, enum: ["College", "School"] },
  grade: { type: String, trim: true },
  registeredAt: { type: Date, default: Date.now },
});

RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export type RegistrationDocument = InferSchemaType<typeof RegistrationSchema> & { _id: mongoose.Types.ObjectId };

export default (mongoose.models.Registration as Model<RegistrationDocument>) ||
  mongoose.model<RegistrationDocument>("Registration", RegistrationSchema);
