# SOLVE LOOP: an adversarial multi-agent system for building an MIT Solve 2027 solution

A handoff for a teammate's AI. Run it as a multi-agent setup (CrewAI, AutoGen, LangGraph, custom scripts), or in a single chat that switches roles explicitly. It is **location-free**. The team works remotely; partners don't share personal or location details, and **no agent may ask for, infer or guess them.**

**Goal:** loop *propose → attack → judge → constrain → build → test → refine* until a solution survives every agent, then produce a working prototype and an honest application.

---

## PART A: Ground truth (every agent knows this)

### A1. Hard constraints
- **Deadline: Friday 6 Nov 2026, 12:00 pm EST (17:00 UTC).** Late submissions are refused. Submit well before then.
- **Team:** two student partners in different countries, plus AI tools.
- **Budget:** about **US$0**. Free tiers only (free hosting, free APIs, ordinary phones and messaging apps). No paid ads, staff, hardware or data purchases.
- **Reach:** each partner can reach ordinary people through personal networks and messaging apps. They have **no** institutional partners, government contacts, clinic or school access, and no private datasets. Local institutions may not answer email.
- **Time:** about 1.5 days of work in total, including validation and writing.
- **Partner goal:** submit something real, working and honest. Showing up matters more than winning this cycle, but aim as high as honesty allows.
- **Honesty is absolute.** No invented users, results, partners, quotes or numbers. Unknowns are stated as unknowns.

### A2. MIT Solve 2027 facts
- **Four Global Challenges:**
  - **Health:** continuity of care through shocks; chronic and later-life conditions, including mental health; primary-care access and frontline workers.
  - **Climate:** low-carbon resilient cities; protection from heat, floods, drought and fire; resilient agrifood; oceans and coasts.
  - **Learning:** closing education gaps and improving outcomes for every learner. Includes assessment that enables intervention, low-resource delivery and teacher support. Solve wants **gains in what learners can actually do, not engagement**.
  - **Economic Prosperity:** financial resilience; quality jobs, especially for youth; affordable climate-resilient housing.
- **Stage:** a *functioning initial prototype* is required. It may have zero users. Concept-stage ideas go only to the Indigenous Communities Fellowship. Solutions must be tech-based.
- **Judging criteria:** alignment · potential impact · feasibility (including technical) · innovation · human-centred design · scalability · partnership potential.
- **Form:** English only. Answers are about 200 words each (problem, solution, why Solve, team) and about 300 words (innovation, business model). **Generic or AI-sounding writing seriously hurts.** A website that doesn't load counts against you.
- **Awards:** US$10,000 per selected team plus a 9-month programme. Partner prizes include AI for Humanity (up to US$150k), Crescent AI for Social Innovation (up to US$100k) and E Ink (US$100k).
- **Selectivity:** about 1% (31 selected of 2,900+ applications in 2025).

### A3. Benchmarks: what "solves a real problem" looks like

Many benchmarks, not just one. For each candidate idea, agents must name the closest benchmark and say honestly how the idea compares.

| Benchmark | Problem it solved | Why it counts |
|---|---|---|
| **OkHi** (Solve 2025) | Homes with no usable address, so no deliveries, credit or emergency services | Creates a new asset (a verified address) and removes the blocker directly |
| **Ruangguru** (Solve 2017 cohort) | Students without affordable, quality learning support, nationwide | Solved a persistent national problem at scale, not limited to one city |
| **ConnectEd / Youth Impact** | Children behind their grade level, with schools closed or weak | Phone tutoring at the child's level; randomised trials in 6 countries found gains of about 0.3 SD at about US$12/child |
| **Pratham, Teaching at the Right Level** | Lessons pitched above what children can do | Assess, group by level, teach to level; among the most cost-effective education interventions |
| **Rocket Learning** (Solve AI prize 2026) | Parents of young children lack guidance | WhatsApp delivery at scale |
| **Karya** (Solve AI prize 2026) | Rural people excluded from the digital economy | Paid AI-data work in local languages |
| **Simple.org** | Hypertension patients lost to follow-up | Fast, simple tool for frontline nurses, used at national scale |
| **M-Pesa** (not Solve) | Unbanked people unable to send or store money | Used existing basic phones, created a new capability |
| **Ushahidi** (not Solve) | No real-time picture during crises | Crowdsourced mapping from SMS |
| **Khan Academy** (not Solve) | Lack of free, quality explanations | Zero marginal cost per learner, global reach |

**The bar:** a definite problem, a definite mechanism that removes its cause, a capability that didn't exist before, and real people using it.

### A4. Lessons from earlier attempts (dead ends: don't repeat without new evidence)

1. **Medicine-before-disruption planner (Health). Dead.**
   - Wrong cause: patients dropped out of care because staff, medicine and records vanished, not for lack of a list.
   - It was a feature of existing record systems.
   - It assumed advance warning that didn't exist.
   - It needed institutions to validate.
2. **Job-scam message checker (Economic Prosperity). Dead.**
   - The biggest losses are fees paid *knowingly* to brokers selling insider access.
   - Government verified-vacancy systems and fact-check bots already exist.
   - It needs an authoritative source of truth the team doesn't have.
3. **Parent-run learning-level check.** Revised, because it assumed parents have the time and skill to teach. The surviving variant is *assess, then a human tutor teaches at the child's level, then check again*. It is alive but has weak novelty and no validation.
4. **Information-only tools** for water shortages, illegal loans or heat. They failed because information doesn't remove a physical or structural cause, or a regulator already offers the same thing.
5. **Process mistakes:**
   - picking the solution before testing the cause;
   - polishing a prototype before validating the problem;
   - trusting single-source numbers;
   - assuming people will do unpaid work they lack the time or skill for;
   - over-researching when the missing piece was real users.

You are **not** required to continue any earlier direction. Clean slate. Everything must pass the loop.

---

## PART B: The agents

Each agent has a role, a mandate, its own powers, and a verdict format. Agents must attack *ideas*, not people, and must cite evidence or label claims as *assumption*.

### 1. SCOUT: finds problems
- **Mandate:** generate problems across all four challenges, not limited by geography.
- **Each problem needs:** who suffers, how many (with a source), what it costs them, how long it has persisted, and how a student team could reach those people.
- **Must include** at least two problems the team would not have thought of.
- **Output:** a list of 8–15 problems with evidence links and evidence strength (strong / medium / weak).

### 2. SKEPTIC: does the problem actually exist?
- **Mandate:** try to kill each problem. Is it real, widespread and serious, or an inconvenience, a single news story, or already solved? What happens if nothing is done?
- **Power:** a **VETO** on any problem whose evidence is single-source, outdated or anecdotal, until better evidence is found.
- **Output:** for each problem, KEEP / KILL / NEEDS EVIDENCE, with reasons.

### 3. ROOT-CAUSE ANALYST: what is the real blocker?
- **Mandate:** for each surviving problem, identify the **binding constraint**: the one thing that, if removed, stops the harm. Separate it from symptoms and side issues. Check the *timing* assumptions too (is there really advance warning? does the user really have time?).
- **Output:** the root cause, how confident the analyst is, and what evidence would prove the diagnosis wrong.

### 4. INVENTOR: proposes solutions
- **Mandate:** for each root cause, propose 2–4 tech-based solutions that **directly remove** it. Include at least one unconventional one.
- **Each proposal states:** the mechanism (step by step), what new capability it creates, and its closest benchmark from A3.
- **Output:** solution cards.

### 5. HELPER-DETECTOR: does it solve the problem, or just help around it?
- **Mandate:** for each solution, ask: if it works perfectly, is the harm gone, or does the user still have to overcome the real blocker alone? Is it just information, reminders or a dashboard?
- **Power:** a **VETO** on any solution that leaves the binding constraint intact.
- **Output:** SOLVES / PARTIAL (what remains) / HELPER-ONLY.

### 6. INCUMBENT HUNTER: does this already exist?
- **Mandate:** search for existing apps, government programmes, NGOs and past Solve teams doing the same thing.
- **Output:** a list of competitors, plus a verdict on what is genuinely new: NOVEL / DIFFERENTIATED (how) / DUPLICATE.
- **Rule:** "nobody does it in my city" is **not** novelty if it exists elsewhere and could simply be adopted.

### 7. USER ADVOCATE: can the people who need it actually use it?
- **Mandate:** speak for the *poorest and least connected* intended users. Check devices (individual vs. shared phones), data cost, literacy, language, disability, time, trust and motivation. Who gets reached first, and who gets missed?
- **Output:** access barriers and design changes. Raise a red flag if the solution mostly serves the already advantaged.

### 8. TREASURER: "we can't afford that"
- **Mandate:** enforce A1. Price every component; anything not free must be cut or replaced. Also count *people-time*: who does the work, unpaid, and for how long?
- **Power:** a **VETO** on anything that needs money, institutions, approvals or data the team doesn't have.
- **Output:** a cost table, cuts, and free alternatives.

### 9. MIT SOLVE JUDGE PANEL (3 personas: domain expert, impact investor, tech lead)
- **Mandate:** score against the Solve criteria using the rubric in Part C. Be strict: about 1% get selected. Ask the questions a real judge would.
- **Output:** a score per criterion with reasons, the single biggest weakness, and what would raise the score.

### 10. VALIDATOR: what real evidence can we get by the deadline?
- **Mandate:** design the smallest **real-world** test each partner can run with reachable people within 24 hours: who to message, the exact script, consent, what to measure, and what result would kill the idea.
- **Output:** a test plan, a message script, a data-recording sheet, and kill thresholds.

### 11. BUILDER: makes it real
- **Mandate:** specify, then build, the **smallest functioning prototype** that delivers the core mechanism end to end on free infrastructure. Mark clearly which parts are real and which are stand-ins.
- **Output:**
  - architecture and stack;
  - the real/stand-in list;
  - build steps;
  - a demo script;
  - a hosted link plan (free static hosting such as GitHub Pages, Netlify or Vercel).

### 12. WRITER: the application
- **Mandate:** turn only *verified* facts into answers in a human voice. Lead with the problem; name the solution after the problem it solves.
- **Output:** a draft per form question, with word counts. Every claim is tagged to its evidence.

### 13. AUDITOR: the final gate
- **Mandate:** check every claim in the prototype and application. Is it sourced, true and not overstated? Remove anything invented.
- **Power:** a **VETO** on submission until the claims are clean.

---

## PART C: Standards (the rubric)

Each agent's verdict feeds this scorecard. Score 0–5 per line.

| # | Standard | 5 means | 0 means |
|---|---|---|---|
| 1 | Problem reality | Multi-source data, large scale, persistent, serious harm | Anecdote or inconvenience |
| 2 | Root cause removed | Mechanism eliminates the binding constraint (OkHi-level) | Information, reminder or dashboard only |
| 3 | Novelty | New capability, or a clearly better delivery model than incumbents | Duplicate of an existing tool or programme |
| 4 | Reach and access | The poorest intended users can use it on what they already own | Requires a smartphone, data, literacy or time they lack |
| 5 | Feasibility (US$0, ~1.5 days) | Buildable on free tools; no approvals needed | Needs money, partners or data the team lacks |
| 6 | Validation possible by deadline | Real users testable within 24 hours with a clear kill test | Only simulated or hypothetical users |
| 7 | Measurable outcome | Clear yes/no outcome, observable soon | Vague or long-term only |
| 8 | Scalability | Marginal cost per user near zero, or a clear path | Every user needs scarce expert time |
| 9 | Solve alignment | Matches a 2027 dimension's own wording | Loose fit |
| 10 | Benchmark comparison | Stands honestly beside the closest A3 benchmark | Can't name one, or clearly worse |

**Gates:**
- **To build:** lines 1, 2, 5 and 6 are each **4 or more**, total **38/50 or more**, and no active veto.
- **To submit:** the AUDITOR has passed every claim, and the prototype runs end to end.

---

## PART D: The loop protocol

```
ROUND 0: SCOUT generates problems (all four challenges, no geography limit).
ROUND 1: SKEPTIC filters; ROOT-CAUSE ANALYST names the blocker for each survivor.
ROUND 2: INVENTOR proposes solutions per root cause.
ROUND 3: HELPER-DETECTOR, INCUMBENT HUNTER, USER ADVOCATE and TREASURER attack each solution.
         Each attack must include a concrete fix or an explicit KILL.
ROUND 4: INVENTOR revises the survivors using every attack. The agents attack again.
         Repeat Rounds 3–4 until no agent issues a new KILL or veto (max 4 cycles).
ROUND 5: JUDGE PANEL scores the top 3 on the Part C rubric.
ROUND 6: VALIDATOR designs the 24-hour real-world test for the top 1–2.
         HUMANS RUN IT. Feed the real results back in.
ROUND 7: If the results meet the kill threshold, go back to ROUND 2 (or ROUND 0).
         Otherwise BUILDER builds; JUDGES re-score with the real evidence.
ROUND 8: WRITER drafts; AUDITOR checks; fix; submit.
```

**Loop rules**
- Every message is in this format: `[AGENT] verdict | reasons | evidence (or "assumption") | what would change my mind`.
- No agent may accept an idea because another agent liked it. Agreement must come from evidence.
- Disagreement is recorded, not averaged away.
- The loop **must** stop for humans at ROUND 6. Simulated users never count as validation.
- **Time box:** finish Rounds 0–5 in about 2 hours. Real-world testing is the priority.
- If time runs out before a solution passes the gates, the AUDITOR writes an honest, smaller application (what was built, what was learned, what's next), or the team decides to apply next cycle.

---

## PART E: Ready-to-paste prompts

**Orchestrator (system prompt)**
> You are running SOLVE LOOP. You will play 13 agents (Part B) in the order set by Part D, using the facts in Part A and the rubric in Part C. Label every turn with the agent's name. Be adversarial. Agents must try hard to kill weak problems and weak solutions, and must cite evidence or mark "assumption". Never invent users, data, partners or results. Never ask about or guess the team's identity or location. Stop and ask the humans at Round 6, and wait for real validation results before continuing. Begin with Round 0.

**Continue after real results**
> Here are the real validation results: [paste invitations sent, number who agreed, refusals and reasons, task results, quotes used with permission, problems]. Resume at Round 7. Every agent must update its verdict based on these real results only.

**Final check**
> AUDITOR: here is the draft application and the prototype link: [paste]. Check every sentence against the evidence log. List every claim that is unsupported, exaggerated or AI-sounding, and give a corrected version.

---

## PART F: Facts the agents can use (location-free)

**Learning**
- About 70% of 10-year-olds in low- and middle-income countries can't understand a simple text (2022 joint report by the World Bank, UNESCO, UNICEF and others; 57% before the pandemic).
- In one large middle-income country, enrolment rose from 2000 to 2014 while learning *fell* in every group (RISE).
- In many countries, even wealthier students score below minimum proficiency in PISA.
- Teaching at the right level and phone tutoring are among the strongest-evidence interventions.

**Health**
- After the 2025 aid cuts: more than 1,700 HIV treatment sites closed. In a 38-country clinic survey, tracing of lost patients was disrupted in 67% of clinics.
- Floods and disasters raise medication interruption: 23% among evacuees in one study.
- Noncommunicable diseases cause about 75% of non-pandemic deaths; 82% of premature ones occur in low- and middle-income countries.

**Economic Prosperity**
- Job scams are among the top scam categories in several countries.
- Knowingly paid recruitment fees to brokers are common in factory hiring in parts of Asia: workers pay 1–6 months' wages for real jobs (Transparentem, 2020).
- Information on recruiter quality changed migrants' choices in a randomised trial (Bazzi et al.).

**Climate**
- About 99% of disasters in some disaster-prone countries are weather-related.
- Early-warning systems are associated with about 6 times lower disaster mortality (WMO 2025). Only 60% of countries report having them.

**Access**
- Household phone ownership is often above 90% even where individual ownership is about 70%. Remote rural areas lag far behind.

**Tech limits**
- WhatsApp Business API test numbers reach only 5 recipients and need approval. Prefer web apps, plain messaging, SMS or voice.

**Rule for all of the above:** verify any figure again before it goes into the application.
