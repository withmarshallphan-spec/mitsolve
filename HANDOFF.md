# HANDOFF: MIT Solve 2027 application (for a teammate and their AI)

Written 4 Nov 2026 by Claude, after a full day of research with the applicant. The applicant asked for everything: what we tried, why each idea failed, what we compared ourselves to, and what's left. Read it all before doing anything.

> **To the AI reading this:**
> - Your job is to help produce a *real, working, honest* solution and application in the time left.
> - Do not repeat the dead ends below unless you have new evidence that changes the verdict.
> - Never invent users, results, partners or quotes. The applicant would rather submit something small and true.

---

## 0. Hard facts first

- **Deadline: Friday 6 Nov 2026, 12:00 pm EST.** That is **00:00 WIB on Saturday 7 Nov**, and noon Moscow time (MSK) on 6 Nov. Confirmed on Solve's official challenge pages on 4 Nov. Some third-party sites say 2 Nov; they're wrong. Submit early: late entries are refused for any reason.
- **Applicant:** a gap-year high-school graduate in **Batam, Riau Islands, Indonesia**.
  - Was solo until now; you are the new teammate.
  - Reaches people through **WhatsApp and personal networks**. Local institutions rarely answer email.
  - Hasn't personally identified a problem from lived experience.
  - Can build software with AI help.
- **The applicant's goal (their words):** "I care about showing up." They want to submit something real and honest, even if it isn't selected.
- **Solve requires a working prototype.** The official stage definition says a functioning initial prototype, not a mock-up. It may have zero users. Concept-stage ideas are reviewed only in the Indigenous Communities Fellowship.
- **Application rules:**
  - Write in English.
  - Main answers are about 200 words; innovation and business model about 300.
  - Solve warns that **generic or AI-sounding text seriously hurts** an application. Write in a human voice.

## 1. Files in this repo

| Path | What it is |
|---|---|
| `mirofish/reality_seed.md` / `.pdf` | **The fact base.** 16 pages, no opinions: Solve 2027 rules, dimensions, prizes, past winners, Batam and Indonesia data across all four challenges, global evidence, existing tools, caveats and sources. **Read this first.** |
| `mirofish/PROMPTS.md` | Neutral research prompts, one per issue (deadline, track, root cause, novelty, validation, access, data, prototype, framing, odds). Usable with any AI. |
| `research/PIVOT_VERDICT.md` | Kill-test results and sources for the first two ideas. |
| `research/RESEARCH.md` | Original research brief (superseded, but has Solve facts and sources). |
| `application/APPLICATION_DRAFT.md` | Draft for the first, dead idea. Reuse only its structure and the Solve form questions. |
| `prototype/` | Working offline web app for the first, dead idea. The engine, map, CSV import, SMS templates, offline support and tests are **reusable parts**. |

## 2. The applicant's tests for a good idea

Every idea was judged by these. Keep using them.

1. **A real, serious problem in society**, not an inconvenience and not a "helper".
2. **The solution removes the actual cause.** The applicant's benchmark is **OkHi**, a 2025 Solve winner: a definite problem (homes with no digital address) and a definite solution (those homes get a valid digital address). Ask: does our thing remove the blocker, or just help people struggle past it?
3. **It creates something new**, not a feature of an existing system or a government programme.
4. **The outcome is visible:** did it work, yes or no?
5. **Real validation is reachable by the deadline.** Real people, reachable on WhatsApp in Batam, with no institutional approval or private data needed.
6. **Not already done** by a past Solve winner or a dominant incumbent.
7. **The people who need it can access it**: phones, literacy, time, motivation. Don't build something only better-off families can use.

## 3. What we tried, and why each failed

### Idea 1: RefillAhead (Health Challenge, continuity of care). Dead.
- **What it was:** weather and flood forecasts plus clinic-closure notices tell a clinic which chronic patients (HIV, TB, insulin, blood pressure) will run out of medicine before access returns. It then plans early refills, health-worker deliveries, stock transfers, and SMS that don't name the condition. A full working prototype was built (`prototype/`).
- **Why it died:**
  - **Wrong blocker.** Evidence from the 2025 aid cuts shows patients fell out of care because *staff, medicine, tracing and records disappeared*. Tracing was disrupted in 67% of clinics in a 38-country survey, with stock-outs in DR Congo, Ethiopia and Kenya. Nobody lacked a list of whom to refill.
  - **It's a feature, not a product.** HIV record systems already produce "due for refill" lists.
  - **False premise.** The funding cuts took effect *overnight* through stop-work orders, so there was no advance warning to act on.
  - **Impossible to validate solo.** It needs clinics, patient data and approvals.
  - **The applicant's own objections:** "it's a helper, not a solution"; "it doesn't know how much medicine is in anyone's system"; "it's not a grave problem without it". The last one was wrong, since treatment interruption kills, but the tool didn't fix the cause.

### Idea 2: Job-offer verification bot for Batam factory jobs (Economic Prosperity). Dead.
- **What it was:** forward a suspicious job WhatsApp message and get a verdict: is it a verified HR channel, is it an illegal fee request, are there phishing links. Plus real openings.
- **Why it died:**
  - **Wrong blocker for the biggest harm.** The largest losses (Rp3–33 million) are payments victims make *knowingly*, to brokers selling insider access ("orang dalam"). Victims know the broker isn't official HR. The bot only catches impersonation and phishing, around Rp1 million per victim.
  - **Incumbents.** Kemnaker (the Ministry of Manpower) requires employers to report all vacancies from 2026, has 81k vacancies on Karirhub, and plans a QR code per vacancy. KP2MI's SISKOP2MI already verifies overseas agencies. Mafindo's CekSumber already checks scams on WhatsApp.
  - **Evidence overstated.** The main Batam case was **one ring, 140 victims, Rp140 million**, not "hundreds".
  - **It only works with real data.** It needs an authoritative source of truth: a real employer or worker organisation confirming its genuine contacts. Without that, it is just guessing.

### Other candidates screened and rejected
- **Batam water crisis information tools:** the blocker is physical water. An app creates none.
- **Trafficking or illegal-migration route:** victims can't be reached safely, and it's police territory.
- **Illegal-loan (pinjol) checker:** OJK (the financial regulator) already runs a WhatsApp legality check on 081-157-157-157.
- **Heat alerts for workers, mangrove reporting, skills certificates:** don't remove the blocker.
- **Mental health in factory dormitories:** not safe for a solo teenager to run.
- **Suku Laut sea-nomad children's schooling; informal-housing evictions:** the real blockers are ID papers and land tenure, and the people can't be reached in time.

### Idea 3: Parent-run reading and maths check on WhatsApp (Learning). Revised.
- **What it was:** parents send a voice note of their child reading, then get the child's level and a practice plan.
- **The applicant's objections:**
  - "Low scores are because education isn't distributed to everyone." **Mostly false:**
    - Indonesian children are *in* school but not learning. Between 2000 and 2014, enrolment rose but learning fell for every group; the average grade 7 student in 2014 had grade 4 maths from 2000 (RISE study).
    - In PISA, the gap between rich and poor students is only 34 points, against 93 across OECD countries. Even richer kids score low.
  - "Poor families don't have phones." **Mostly false:** 93.5% of households have a mobile phone, though only 70.75% of individuals do. **It is true in remote rural districts** (about 41% in Sumba Barat).
  - "Parents don't have time, ability or care." **True enough to kill the parent-run version.** Poorer parents work long shifts and may struggle to read themselves, so this version would reach the families who need it least.

### Current direction: assess, teach at the child's level, check again (Learning). Alive, not validated.
- **What it is:**
  1. Run a short level check (letters, words, sentences, story; numbers, subtraction, division).
  2. A human tutor teaches at exactly that level, by phone or in person.
  3. The child does a different, comparable task without help.
  4. Repeat weekly.

  The parent only hands over the phone.
- **Why it survived:** it is modelled on **ConnectEd (Youth Impact)**:
  - one 20-minute phone tutoring call a week, plus SMS problems;
  - randomised trials in Botswana and six countries in total showed learning gains everywhere, averaging about 0.30–0.35 SD;
  - about US$12 per child;
  - it works on basic phones.

  It also matches **Teaching at the Right Level**, one of the most cost-effective education interventions known.
- **An independent check agreed.** A separate analysis by Codex, using MiroFish output and the fact base, reached the same direction without seeing our conversation. It shares the same seed, so it isn't fully independent.
- **Open weaknesses:**
  1. **Novelty.** It's a known model. Neighbours include ConnectEd, Rocket Learning (India; won Solve's 2026 AI for Humanity Prize), Bookbot (an Indonesian reading app that won the Octava challenge on the Solve platform), Pemantik (an Indonesian toolkit for teachers) and Wadhwani AI.

     What's new has to be the local version: Bahasa Indonesia, WhatsApp, and **young tutors**. In Riau Islands, high-school graduates make up 63.6% of the unemployed. Every claim of what's different has to be backed by evidence.
  2. **Demand is unproven.** Will Batam families say yes, and will children stay on a call? This is exactly what needs testing.
  3. **Tutor capacity and cost** limit how far it can grow.
  4. **Learning gains take weeks.** Only an immediate before/after on a small task is possible before the deadline.
- **Go/no-go gate (agreed):** at least **3 families** who say yes, plus a tutor (the applicant or you), **by the evening of 4 Nov WIB**. If not, submit honestly as a very early project, or wait for the next cycle.

## 4. What we compared ourselves to

- **OkHi:** a clear problem and a clear fix (the applicant's model).
- **ConnectEd / Youth Impact:** proven phone tutoring at the child's level.
- **Rocket Learning:** WhatsApp programme for parents of young children; says it doesn't know each child's level.
- **Bookbot:** Indonesian reading app with speech recognition; reading only; needs an app.
- **Pemantik:** Indonesian reading and maths level toolkit, for teachers.
- **Simple.org, Hikma Health, Simprints, Medic / CommCare:** health tools (relevant to Idea 1).
- **Kemnaker Karirhub, SISKOP2MI, CekSumber, ScamShield (Singapore), Recruitment Advisor, Golden Dreams:** job and scam tools (relevant to Idea 2).
- **Past Solve winners and selection rate:** 31 selected out of 2,900+ applications in 2025, about 1%. Full winner lists are in seed section 3.

## 5. Mistakes we made (don't repeat them)

1. **Picked the solution before testing the blocker.** Always ask "why does the harm *actually* happen?" with evidence, before building.
2. **Built a polished prototype before validating the problem.** It looked impressive and it was the wrong thing.
3. **Overstated numbers from single news reports.** "Hundreds" turned out to be 140. Mark single-source figures as unverified.
4. **Assumed advance warning existed.** Check the timing assumptions the solution depends on.
5. **Ignored who actually does the work.** The parent-run version assumed parents had time and skills they don't.
6. **Ran more research when the missing piece was real users.** Simulations and desk research can't replace talking to 3 families.

## 6. What a working prototype must do (spec agreed with Codex)

1. Open on an ordinary phone or laptop, and work offline or as a printout.
2. **Record:** a pseudonymous learner ID (no name), parental consent, and the parent's guess of the child's level, recorded *before* the result is shown.
3. **Level check:** a short, human-scored reading and maths check in Bahasa Indonesia, using ASER/Pemantik-style levels. Don't call it a validated diagnostic.
4. **A transparent rule** picks a practice activity at that level. Content is human-reviewed. AI is not needed for this step.
5. **Log the teaching session:** what was taught and how much help the child needed.
6. **Post-check:** a different but comparable task done without help. Save the raw answers.
7. **Export** the record, and show the next step.
8. **Privacy:** minimal data, no children's voice recordings stored, and a way to delete records.

**Leave out:** WhatsApp Business API automation. The free test number reaches only 5 people and needs Meta's approval. Ordinary WhatsApp messages and calls, plus the web tool, are enough.

## 7. What to do now, in order

1. **Confirm in the portal** that the Learning challenge accepts you and the deadline still stands. Add the teammate in the team section of the form only if he genuinely contributes.
2. **Recruit 3+ families** with children in grades 1–5 through WhatsApp. Get consent, and ask each parent what level they think their child is at.
3. **Build the prototype in section 6.** Reuse `prototype/` for structure: offline support, CSV export, tests.
4. **Run the sessions:** a level check, one teaching session and a post-check per child. Record everything truthfully: invitations, refusals, completions, problems.
5. **Write the application** in a human voice. Say what was built, what was tested and with how many people, what happened, and what isn't known yet.
6. **Submit by 5 Nov evening WIB,** well before the 7 Nov 00:00 WIB cutoff. Screenshot the confirmation.

## 8. If your AI wants to challenge the direction

You're welcome to. Use the tests in section 2 and the facts in `mirofish/reality_seed.md`. Any new idea must beat the current one on **real validation reachable by tomorrow**, not only on how interesting it sounds. A new problem in another country (e.g. Russia) can't be researched, validated and prototyped in about 1.5 days; save it for next cycle.
