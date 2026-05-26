import type { Step } from "react-joyride";

export const tourSteps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome! Need a quick tour?",
    content: "Let us show you how to register for events on this platform.",
    skipBeacon: true,
    locale: {
      next: "Yes, show me!",
      skip: "Skip Tour",
    },
  },
  {
    target: "#events-section",
    placement: "top",
    title: "Browse Events",
    content:
      "Here you can see all the available events. Click on any event and hit Register to sign up for it.",
  },
  {
    target: "#signin-trigger",
    placement: "bottom",
    title: "Sign In Required",
    content:
      "You need to sign in before registering for any event. Click here to sign in or create an account.",
  },
  {
    target: "#dashboard-section",
    placement: "right",
    title: "Your Dashboard",
    content:
      "After registering, all your enrolled events will appear here in your dashboard. You can track and manage them easily.",
  },
  {
    target: "#faqs",
    placement: "top",
    title: "Got Questions?",
    content:
      "Check out our FAQ section for answers to common questions about events and registration.",
  },
  {
    target: "#contact-footer",
    placement: "top",
    title: "Contact Our Coordinators",
    content:
      "Still need help? Reach out to our coordinators through whatsapp.",
  },
];
