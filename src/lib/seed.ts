import Event from "@/models/Event";

const seedEvents = [
  { title: "AI/ML Session 1", domain: "AI/ML", type: "session", startTime: "2026-05-23T10:00:00+05:30", endTime: "2026-05-23T13:00:00+05:30", roomName: "aiml-session-1", isPublished: true },
  { title: "AI/ML Session 2", domain: "AI/ML", type: "session", startTime: "2026-05-26T10:00:00+05:30", endTime: "2026-05-26T13:00:00+05:30", roomName: "aiml-session-2", isPublished: true },
  { title: "Hackathon 1", domain: "Hackathon", type: "hackathon", startTime: "2026-05-29T12:00:00+05:30", endTime: "2026-05-30T12:00:00+05:30", roomName: "hackathon-1", isPublished: true },
  { title: "CP Session 1", domain: "CP", type: "session", startTime: "2026-06-02T10:00:00+05:30", endTime: "2026-06-02T13:00:00+05:30", roomName: "cp-session-1", isPublished: true },
  { title: "CP Session 2", domain: "CP", type: "session", startTime: "2026-06-04T10:00:00+05:30", endTime: "2026-06-04T13:00:00+05:30", roomName: "cp-session-2", isPublished: true },
  { title: "UI/UX Session 1", domain: "UI/UX", type: "session", startTime: "2026-06-09T10:00:00+05:30", endTime: "2026-06-09T13:00:00+05:30", roomName: "uiux-session-1", isPublished: true },
  { title: "UI/UX Session 2", domain: "UI/UX", type: "session", startTime: "2026-06-11T10:00:00+05:30", endTime: "2026-06-11T13:00:00+05:30", roomName: "uiux-session-2", isPublished: true },
  { title: "CyberSec Session 1", domain: "CyberSec", type: "session", startTime: "2026-06-16T10:00:00+05:30", endTime: "2026-06-16T13:00:00+05:30", roomName: "cybersec-session-1", isPublished: true },
  { title: "CyberSec Session 2", domain: "CyberSec", type: "session", startTime: "2026-06-18T10:00:00+05:30", endTime: "2026-06-18T13:00:00+05:30", roomName: "cybersec-session-2", isPublished: true },
  { title: "Dev Session 1", domain: "Dev", type: "session", startTime: "2026-06-23T10:00:00+05:30", endTime: "2026-06-23T13:00:00+05:30", roomName: "dev-session-1", isPublished: true },
  { title: "Dev Session 2", domain: "Dev", type: "session", startTime: "2026-06-25T10:00:00+05:30", endTime: "2026-06-25T13:00:00+05:30", roomName: "dev-session-2", isPublished: true },
  { title: "Hackathon 2", domain: "Hackathon", type: "hackathon", startTime: "2026-06-29T12:00:00+05:30", endTime: "2026-06-30T12:00:00+05:30", roomName: "hackathon-2", isPublished: true },
];

let seeded = false;

export async function ensureSeedEvents() {
  if (seeded) return;

  const count = await Event.estimatedDocumentCount();
  if (count === 0) {
    await Event.insertMany(seedEvents);
  }

  seeded = true;
}
