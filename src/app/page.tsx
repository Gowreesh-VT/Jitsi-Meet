import Image from "next/image";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SymbolIcon } from "@/components/event-cards";

import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/models/Event";
import { CountdownTimer } from "@/components/CountdownTimer";
import { formatEventWindow, serializeEvent } from "@/lib/events";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Registration from "@/models/Registration";
import { ScheduleClient } from "@/components/ScheduleClient";
import { isVitStudentEmail } from "@/lib/profile";

export const dynamic = "force-dynamic";

// --- To Do --- 
// [1] Add a Proper Certificate Image URL
// const certificateImageUrl = "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEk4jW2taHF5hwn3uCcqPm4ORVQJW8SBvgpL0A";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  
  await connectToDatabase();

  const nextEvent = await Event.findOne({ 
    isPublished: true, 
    startTime: { $gt: new Date() } 
  }).sort({ startTime: 1 });

  const events = await Event.find({ isPublished: true }).sort({ startTime: 1 });
  const scheduledEvents = events.map(serializeEvent);

  let userRegistrations: string[] = [];
  if (session?.user.id) {
    const regs = await Registration.find({ userId: session.user.id });
    userRegistrations = regs.map(r => String(r.eventId));
  }

  const isVitStudent = isVitStudentEmail(session?.user.email);

  return (
    <div className="schedule-retro relative min-h-screen">
      {/* Animated Background Layers */}
      <div className="stars-container" />
      <div className="neon-grid" />
      <div className="synth-sun" />
      
      {/* Floating Retro Icons (Decorative) */}
      <div className="main-shell flex flex-col items-center justify-center pt-20">
        <div className="hero animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="hero-logo">
            <Image 
              src="/mic-logo.png" 
              alt="MIC Logo" 
              width={100} 
              height={80} 

            />
          </div>
          
          <h1 className="mb-4 flex justify-center">
            <span className="sr-only">MICROCRAFT</span>
            <Image 
              src="https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEEBFgnrzHSbAfolN0Uc2Ti7Iud45D3KhyjMga" 
              alt="MICROCRAFT" 
              width={600} 
              height={180} 
              className="object-contain max-w-full h-auto drop-shadow-[0_0_24px_rgba(249,77,180,0.52)]"
              priority
            />
          </h1>
          
          <div className="hero-rule mb-8" />

          <p className="max-w-2xl text-lg leading-relaxed text-arcade-muted">
            Experience the future of tech empowerment. The Microsoft Innovations Club 
            Meet Portal brings together high-impact technical workshops and 
            elite hackathons in one unified retro-futuristic space.
          </p>
          
          <div className="hero-rule mb-24" />
          
          {nextEvent && (() => {
            const eventWindow = formatEventWindow(nextEvent.startTime, nextEvent.endTime);

            return (
              <div className="mb-12 w-full max-w-4xl">
                <div className="relative overflow-hidden border border-[#79f2a1]/30 bg-black/45 p-5 shadow-[0_0_42px_rgba(121,242,161,0.12)] backdrop-blur-xl sm:p-7">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(121,242,161,0.14),transparent_45%)]" />
                  <div className="relative flex flex-col gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
                    <div className="text-center">
                      <p className="mb-4 text-xs font-black uppercase tracking-[0.45em] text-[#79f2a1]">Next Event</p>
                      <h2 className="text-2xl font-black uppercase tracking-normal text-white sm:text-3xl">{nextEvent.title}</h2>
                      <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-arcade-muted">{eventWindow.date} / {eventWindow.time}</p>
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-arcade-muted">{nextEvent.description}</p>
                    </div>
                    <div className="border border-[#79f2a1]/20 bg-black/50 p-4">
                      <p className="mb-4! text-center text-[11px] font-black uppercase tracking-[0.35em] text-[#79f2a1]">Starts In</p>
                      <CountdownTimer target={nextEvent.startTime.toISOString()} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Schedule Section */}
        <div id="schedule" className="event-section w-full mt-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <h2 className="section-title">SCHEDULE</h2>
          </div>
          {scheduledEvents.length === 0 ? (
            <div className="event-card max-w-2xl mx-auto text-center py-12">
              <h3 className="event-card__title mb-4">NO DATA DETECTED</h3>
              <p className="text-arcade-muted">The event stream is currently offline. Check back later.</p>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto">
              <ScheduleClient 
                initialEvents={scheduledEvents} 
                userRegistrations={userRegistrations}
                isVitStudent={isVitStudent}
              />
            </div>
          )}
        </div>

        {/* Sponsors Section */}
        <div id="sponsors" className="event-section w-full mt-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="mx-auto max-w-5xl rounded-4xl border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
            <div className="mb-8 flex flex-col gap-3 text-center">
              <h2 className="section-title">SPONSORS</h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-arcade-muted sm:text-base">
                Partners supporting the event with tools, platforms, and visibility across the hackathon and session tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  name: "HackerRank",
                  url: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEv3e6MOhWmy6tpuiexQX81z0fGaEJbT52MDPl",
                  accent: "from-emerald-400/20 via-emerald-400/5 to-transparent",
                },
                {
                  name: "GSSoc",
                  url: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEESHt6lrzHSbAfolN0Uc2Ti7Iud45D3KhyjMg",
                  accent: "from-cyan-400/20 via-cyan-400/5 to-transparent",
                },
                {
                  name: "Google Gemini",
                  url: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEFoJjaslA09oihcYfavCU8QVN7Oswmu3e6j14",
                  accent: "from-violet-400/20 via-violet-400/5 to-transparent",
                },
                {
                  name: "Unstop",
                  url: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEdI7htgFn631F9x5hwaSXEY2mNqbjRAi8ulfs",
                  accent: "from-sky-400/20 via-sky-400/5 to-transparent",
                },
              ].map((sponsor) => (
                <div key={sponsor.name} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#ffafd5]/30 hover:bg-white/10">
                  <div className={`absolute inset-0 bg-linear-to-br ${sponsor.accent}`} />
                  <div className="relative flex min-h-44 flex-col items-center justify-between gap-4">
                    <div className="flex h-24 w-full items-center justify-center rounded-xl bg-transparent px-0 py-0 transition-transform duration-300 group-hover:scale-[1.02]">
                      <Image
                        src={sponsor.url}
                        alt={`${sponsor.name} logo`}
                        width={320}
                        height={120}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black tracking-[0.3em] text-white/90">{sponsor.name.toUpperCase()}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.28em] text-arcade-muted">Official partner</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Organizers Section */}
        <div id="organizers" className="event-section mt-24! w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="mx-auto max-w-5xl rounded-4xl border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
            <div className="mb-8 flex flex-col gap-3 text-center">
              <h2 className="section-title">ORGANIZERS</h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-arcade-muted sm:text-base">
                The core team at Microsoft Innovations Club ensuring the smooth operation and high-quality content of all meet sessions.
              </p>
            </div>
            
            <div className="relative w-full overflow-hidden py-4">
              {/* Fade gradients on the sides for a professional look */}
              <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

              <div className="flex animate-marquee">
                <div className="flex gap-6 pr-6 shrink-0">
                  {organizers.map((organizer, i) => (
                    <div key={`copy1-${i}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#ffafd5]/30 hover:bg-white/10 w-60 shrink-0">
                      <div className={`absolute inset-0 bg-linear-to-br ${organizer.accent}`} />
                      <div className="relative flex flex-col items-center justify-between gap-6 min-h-60">
                        <div className="flex h-32 w-full items-center justify-center rounded-xl bg-transparent">
                          {organizer.url ? (
                            <Image
                              src={organizer.url}
                              alt={`${organizer.name}`}
                              width={128}
                              height={128}
                              className="h-32 w-32 object-contain bg-transparent transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#ffafd5]/30 bg-white/10 text-3xl font-black tracking-wider text-[#ffafd5] shadow-[0_0_20px_rgba(249,77,180,0.2)] transition-transform duration-300 group-hover:scale-105">
                              {organizer.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black tracking-[0.2em] text-white/90">{organizer.name.toUpperCase()}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-arcade-muted">{organizer.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-6 pr-6 shrink-0" aria-hidden="true">
                  {organizers.map((organizer, i) => (
                    <div key={`copy2-${i}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#ffafd5]/30 hover:bg-white/10 w-60 shrink-0">
                      <div className={`absolute inset-0 bg-linear-to-br ${organizer.accent}`} />
                      <div className="relative flex flex-col items-center justify-between gap-6 min-h-60">
                        <div className="flex h-32 w-full items-center justify-center rounded-xl bg-transparent">
                          {organizer.url ? (
                            <Image
                              src={organizer.url}
                              alt={`${organizer.name}`}
                              width={128}
                              height={128}
                              className="h-32 w-32 object-contain bg-transparent transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#ffafd5]/30 bg-white/10 text-3xl font-black tracking-wider text-[#ffafd5] shadow-[0_0_20px_rgba(249,77,180,0.2)] transition-transform duration-300 group-hover:scale-105">
                              {organizer.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black tracking-[0.2em] text-white/90">{organizer.name.toUpperCase()}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-arcade-muted">{organizer.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates Section */}
        {/* <section id="certificates" className="event-section w-full mt-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="mx-auto max-w-5xl rounded-4xl border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
            <div className="mb-8 flex flex-col gap-3 text-center">
              <h2 className="section-title">CERTIFICATES</h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-arcade-muted sm:text-base">
                Verified certificates are awarded to eligible participants after successful completion of each track.
              </p>
            </div>
            {certificateImageUrl ? (
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
                <Image
                  src={certificateImageUrl}
                  alt="Certificate preview"
                  width={1400}
                  height={980}
                  className="h-auto w-full rounded-2xl object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm font-semibold text-red-200">
                Certificate image unavailable. Update the certificate URL in this section when ready.
              </div>
            )}
          </div>
        </section> */}

        {/* FAQ Section */}
        <section className="event-section faq-section w-full max-w-5xl mt-24" id="faqs">
          <h2 className="section-title text-primary glow-title mb-8 text-center">FAQ</h2>
          <Accordion className="faq-list w-full" collapsible type="single">
            {faqs.map((faq, index) => (
              <AccordionItem className="faq-item" key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className={`faq-question glow-${faq.accent}`}>
                  <span className={`text-${faq.accent}`}>{faq.question}</span>
                  <SymbolIcon className={`faq-icon text-${faq.accent}`} name="expand_more" />
                </AccordionTrigger>
                <AccordionContent className="faq-answer">
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <footer className="mt-32 w-full border-t-2 border-[#ffafd5]/10 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div>
              <h3 className="text-primary font-black tracking-tighter text-xl mb-6">MEET PORTAL</h3>
              <p className="text-arcade-muted text-sm leading-relaxed">
                A specialized platform for the Microsoft Innovations Club to manage and host high-impact technical sessions and hackathons.
              </p>
            </div>
            <div>
              <h3 className="text-[#ffafd5] font-black tracking-tighter text-xl mb-6">QUICK LINKS</h3>
              <ul className="space-y-3 text-sm font-bold text-arcade-muted">
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link href="/#schedule" className="hover:text-primary transition-colors">Schedule</Link></li>
                <li><Link href="https://www.microsoftinnovations.club" className="hover:text-primary transition-colors">Microsoft Innovations Meet</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-400 font-black tracking-tighter text-xl mb-6">CONNECT</h3>
              <div className="flex gap-4">
                <Link href="https://www.linkedin.com/company/microsoft-innovations-club-vitc" target="_blank" className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-pink-400 transition-all">
                    <svg width="800px" height="800px" viewBox="0 0 3364.7 3364.7" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="0" cx="217.76" cy="3290.99" r="4271.92" gradientUnits="userSpaceOnUse"><stop offset=".09" stopColor="#fa8f21"/><stop offset=".78" stopColor="#d82d7e"/></radialGradient><radialGradient id="1" cx="2330.61" cy="3182.95" r="3759.33" gradientUnits="userSpaceOnUse"><stop offset=".64" stopColor="#8c3aaa" stopOpacity="0"/><stop offset="1" stopColor="#8c3aaa"/></radialGradient></defs><path d="M853.2,3352.8c-200.1-9.1-308.8-42.4-381.1-70.6-95.8-37.3-164.1-81.7-236-153.5S119.7,2988.6,82.6,2892.8c-28.2-72.3-61.5-181-70.6-381.1C2,2295.4,0,2230.5,0,1682.5s2.2-612.8,11.9-829.3C21,653.1,54.5,544.6,82.5,472.1,119.8,376.3,164.3,308,236,236c71.8-71.8,140.1-116.4,236-153.5C544.3,54.3,653,21,853.1,11.9,1069.5,2,1134.5,0,1682.3,0c548,0,612.8,2.2,829.3,11.9,200.1,9.1,308.6,42.6,381.1,70.6,95.8,37.1,164.1,81.7,236,153.5s116.2,140.2,153.5,236c28.2,72.3,61.5,181,70.6,381.1,9.9,216.5,11.9,281.3,11.9,829.3,0,547.8-2,612.8-11.9,829.3-9.1,200.1-42.6,308.8-70.6,381.1-37.3,95.8-81.7,164.1-153.5,235.9s-140.2,116.2-236,153.5c-72.3,28.2-181,61.5-381.1,70.6-216.3,9.9-281.3,11.9-829.3,11.9-547.8,0-612.8-1.9-829.1-11.9" fill="url(#0)"/><path d="M853.2,3352.8c-200.1-9.1-308.8-42.4-381.1-70.6-95.8-37.3-164.1-81.7-236-153.5S119.7,2988.6,82.6,2892.8c-28.2-72.3-61.5-181-70.6-381.1C2,2295.4,0,2230.5,0,1682.5s2.2-612.8,11.9-829.3C21,653.1,54.5,544.6,82.5,472.1,119.8,376.3,164.3,308,236,236c71.8-71.8,140.1-116.4,236-153.5C544.3,54.3,653,21,853.1,11.9,1069.5,2,1134.5,0,1682.3,0c548,0,612.8,2.2,829.3,11.9,200.1,9.1,308.6,42.6,381.1,70.6,95.8,37.1,164.1,81.7,236,153.5s116.2,140.2,153.5,236c28.2,72.3,61.5,181,70.6,381.1,9.9,216.5,11.9,281.3,11.9,829.3,0,547.8-2,612.8-11.9,829.3-9.1,200.1-42.6,308.8-70.6,381.1-37.3,95.8-81.7,164.1-153.5,235.9s-140.2,116.2-236,153.5c-72.3,28.2-181,61.5-381.1,70.6-216.3,9.9-281.3,11.9-829.3,11.9-547.8,0-612.8-1.9-829.1-11.9" fill="url(#1)"/><path d="M1269.25,1689.52c0-230.11,186.49-416.7,416.6-416.7s416.7,186.59,416.7,416.7-186.59,416.7-416.7,416.7-416.6-186.59-416.6-416.7m-225.26,0c0,354.5,287.36,641.86,641.86,641.86s641.86-287.36,641.86-641.86-287.36-641.86-641.86-641.86S1044,1335,1044,1689.52m1159.13-667.31a150,150,0,1,0,150.06-149.94h-0.06a150.07,150.07,0,0,0-150,149.94M1180.85,2707c-121.87-5.55-188.11-25.85-232.13-43-58.36-22.72-100-49.78-143.78-93.5s-70.88-85.32-93.5-143.68c-17.16-44-37.46-110.26-43-232.13-6.06-131.76-7.27-171.34-7.27-505.15s1.31-373.28,7.27-505.15c5.55-121.87,26-188,43-232.13,22.72-58.36,49.78-100,93.5-143.78s85.32-70.88,143.78-93.5c44-17.16,110.26-37.46,232.13-43,131.76-6.06,171.34-7.27,505-7.27S2059.13,666,2191,672c121.87,5.55,188,26,232.13,43,58.36,22.62,100,49.78,143.78,93.5s70.78,85.42,93.5,143.78c17.16,44,37.46,110.26,43,232.13,6.06,131.87,7.27,171.34,7.27,505.15s-1.21,373.28-7.27,505.15c-5.55,121.87-25.95,188.11-43,232.13-22.72,58.36-49.78,100-93.5,143.68s-85.42,70.78-143.78,93.5c-44,17.16-110.26,37.46-232.13,43-131.76,6.06-171.34,7.27-505.15,7.27s-373.28-1.21-505-7.27M1170.5,447.09c-133.07,6.06-224,27.16-303.41,58.06-82.19,31.91-151.86,74.72-221.43,144.18S533.39,788.47,501.48,870.76c-30.9,79.46-52,170.34-58.06,303.41-6.16,133.28-7.57,175.89-7.57,515.35s1.41,382.07,7.57,515.35c6.06,133.08,27.16,223.95,58.06,303.41,31.91,82.19,74.62,152,144.18,221.43s139.14,112.18,221.43,144.18c79.56,30.9,170.34,52,303.41,58.06,133.35,6.06,175.89,7.57,515.35,7.57s382.07-1.41,515.35-7.57c133.08-6.06,223.95-27.16,303.41-58.06,82.19-32,151.86-74.72,221.43-144.18s112.18-139.24,144.18-221.43c30.9-79.46,52.1-170.34,58.06-303.41,6.06-133.38,7.47-175.89,7.47-515.35s-1.41-382.07-7.47-515.35c-6.06-133.08-27.16-224-58.06-303.41-32-82.19-74.72-151.86-144.18-221.43S2586.8,537.06,2504.71,505.15c-79.56-30.9-170.44-52.1-303.41-58.06C2068,441,2025.41,439.52,1686,439.52s-382.1,1.41-515.45,7.57" fill="#ffffff"/></svg>
                </Link>
                <Link href="https://linkedin.com/company/mic-vitc" target="_blank" className="h-10 w-10 bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-blue-400 transition-all">
                    <svg width="800px" height="800px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="#0A66C2" d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727zM13.11 2H2.885A.88.88 0 002 2.866v10.268a.88.88 0 00.885.866h10.226a.882.882 0 00.889-.866V2.865a.88.88 0 00-.889-.864z"/></svg>
                </Link>
                <Link href="https://chat.whatsapp.com/G5wLlrN7DMeDIh8pSFOSfu?mode=gi_t" target="_blank" className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-green-400 transition-all">
                  <Image src="/whatsapp.svg" alt="WhatsApp" width={20} height={20} className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-20 text-center text-xs font-bold tracking-widest opacity-40">
            &copy; 2026 MICROSOFT INNOVATIONS CLUB | POWERED BY MIC DEV TEAM
          </div>
        </footer>
      </div>
    </div>
  );
}

const organizers = [
  {
    name: "Srijan",
    role: "President",
    url: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEv3e6MOhWmy6tpuiexQX81z0fGaEJbT52MDPl",
    accent: "from-pink-500/20 via-pink-500/5 to-transparent",
  },
  {
    name: "Sudeep",
    role: "SECRETARY",
    accent: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  {
    name: "Palak",
    role: "VICE-SECRETARY",
    accent: "from-yellow-500/20 via-yellow-500/5 to-transparent",
  },
  {
    name: "Abhinav",
    role: "TECHNICAL HEAD",
    accent: "from-green-500/20 via-green-500/5 to-transparent",
  },
  {
    name: "Rohan",
    role: "DESIGN HEAD",
    accent: "from-purple-500/20 via-purple-500/5 to-transparent",
  },
  {
    name: "Ishita",
    role: "MANAGEMENT HEAD",
    accent: "from-red-500/20 via-red-500/5 to-transparent",
  },
  {
    name: "Aditya",
    role: "WEB DEVELOPER",
    accent: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  },
  {
    name: "Sneha",
    role: "PR HEAD",
    accent: "from-pink-500/20 via-pink-500/5 to-transparent",
  },
  {
    name: "Ananya",
    role: "MARKETING HEAD",
    accent: "from-yellow-500/20 via-yellow-500/5 to-transparent",
  },
  {
    name: "Karan",
    role: "EVENT COORDINATOR",
    accent: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  {
    name: "Meera",
    role: "RESEARCH LEAD",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  {
    name: "Varun",
    role: "EDITORIAL HEAD",
    accent: "from-orange-500/20 via-orange-500/5 to-transparent",
  },
  {
    name: "Tanya",
    role: "OPERATIONS LEAD",
    accent: "from-indigo-500/20 via-indigo-500/5 to-transparent",
  },
  {
    name: "Rishi",
    role: "SPONSORSHIP HEAD",
    accent: "from-teal-500/20 via-teal-500/5 to-transparent",
  },
  {
    name: "Nikhil",
    role: "APP DEVELOPER",
    accent: "from-violet-500/20 via-violet-500/5 to-transparent",
  },
  {
    name: "Divya",
    role: "SOCIAL MEDIA LEAD",
    accent: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
  },
  {
    name: "Rahul",
    role: "FINANCE LEAD",
    accent: "from-amber-500/20 via-amber-500/5 to-transparent",
  },
  {
    name: "Neha",
    role: "COMMUNITY LEAD",
    accent: "from-rose-500/20 via-rose-500/5 to-transparent",
  },
  {
    name: "Vikram",
    role: "CYBERSEC LEAD",
    accent: "from-lime-500/20 via-lime-500/5 to-transparent",
  },
  {
    name: "Kriti",
    role: "CONTENT WRITER",
    accent: "from-sky-500/20 via-sky-500/5 to-transparent",
  },
  {
    name: "Arjun",
    role: "VIDEO EDITOR",
    accent: "from-red-500/20 via-red-500/5 to-transparent",
  },
  {
    name: "Riya",
    role: "GRAPHIC DESIGNER",
    accent: "from-purple-500/20 via-purple-500/5 to-transparent",
  },
  {
    name: "Manish",
    role: "LOGISTICS HEAD",
    accent: "from-teal-500/20 via-teal-500/5 to-transparent",
  },
  {
    name: "Simran",
    role: "OUTREACH LEAD",
    accent: "from-pink-500/20 via-pink-500/5 to-transparent",
  },
  {
    name: "Yash",
    role: "AI/ML RESEARCHER",
    accent: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  },
  {
    name: "Pooja",
    role: "ALUMNI COORDINATOR",
    accent: "from-yellow-500/20 via-yellow-500/5 to-transparent",
  }
];

type FaqItem = {
  question: string;
  answer: string;
  accent: string;
};

const faqs: FaqItem[] = [
  {
    question: "How will the online workshop be conducted?",
    answer:
      "The sessions are hosted live on our platform. A join link is enabled in the website when the session starts.",
    accent: "blue",
  },
  {
    question: "Will the sessions be recorded?",
    answer:
      "Yes. All live sessions are recorded and shared with registered participants within 24 hours so you can review the material at your own pace.",
    accent: "green",
  },
  {
    question: "How long is each session?",
    answer:
      "Each session runs for about two hours, including a dedicated Q&A segment at the end.",
    accent: "red",
  },
  {
    question: "Do I need any prior coding experience?",
    answer:
      "No—this track is beginner-friendly. We start from the fundamentals and build up step by step.",
    accent: "yellow",
  },
  {
    question: "What software or tools do I need to install beforehand?",
    answer:
      "Please use a stable internet connection, a modern web browser, and VS Code. We recommend installing Node.js if you want to code along with the exercises.",
    accent: "blue",
  },
  {
    question: "Do I need a powerful laptop to participate?",
    answer:
      "Not at all. Web development mainly needs a text editor and a browser, so any standard laptop works well.",
    accent: "green",
  },
  {
    question: "What will we be building during the workshop?",
    answer:
      "We take a hands-on approach. By the end of the workshop you will have built and deployed a real project—such as Next.js web app—from scratch or a Crypto-Currency.",
    accent: "red",
  },
  {
    question: "How can I ask questions if I get stuck on a coding error?",
    answer:
      "We run a dedicated WhatsApp group for participants. Mentors monitor the chat during live sessions so you can get unstuck quickly.",
    accent: "yellow",
  },
  {
    question: "Will I receive a certificate of completion?",
    answer:
      "Yes. Participants who complete the final project submission receive a verified certificate from both HackerRank and Gemini ",
    accent: "blue",
  },
  {
    question: "Can I participate in hackathons alone or do I need a team?",
    answer: 
        "You can join with a pre-formed team or register solo. We host team-building sessions before hackathons to help you find teammates.",
    accent: "green",
  },
];

