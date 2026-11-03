# MIT Solve 2027: research brief and recommendation

Prepared 3 November 2026. Note on sources: this environment could not open solve.mit.edu or Solve's application PDF directly. Everything below comes from web search results that quote those pages, plus press and peer-reviewed sources. Anything marked **verify** must be checked in the live portal before submitting.

---

## TL;DR

| | |
|---|---|
| **Deadline** | **Friday 6 November 2026, 12:00 pm ET (noon, not end of day).** Solve's own Climate, Learning and Economic Prosperity challenge pages and the 2027 application-questions PDF say this. Some third-party listings say 2 November. **Verify in the portal today, and aim to submit by 5 November.** |
| **Recommended challenge** | **2027 Global Health Challenge → Dimension 1: "Strengthen continuity of care in the face of outbreaks, climate shocks, conflicts or financing disruptions."** |
| **Recommended solution** | **RefillAhead.** When a cyclone, flood, heatwave or clinic closure is coming, it finds every chronic-care patient who would run out of medicine before they can reach care again. It then plans the cheapest safe action for each one (early refill, home delivery by a community health worker (CHW), or reroute to an open clinic), moves stock to where it is needed, sends SMS that don't reveal the patient's condition, and tracks who was missed. |
| **Why this one** | It is the newest dimension and matches it exactly (the dimension text names "early-warning systems"). The harm is documented with 2025–26 evidence. The clinical action it relies on already exists: WHO recommends 3–6 month ART refills. My searches found **no tool or evaluated program** that turns hazard forecasts into patient-level early refills in low- and middle-income countries (LMICs). And the prototype is real and demo-able now. |
| **Stage to declare** | **Prototype**, honestly. Do not claim users or pilots you don't have. |

---

## 1. What is open: the 2027 Global Challenges

Applications opened 22 Sept 2026. Selected Solver teams get a **US$10,000** grant plus a **nine-month support program**. Solve expects about 25 hours of commitment from teams, plus Solver Orientation in Cambridge, MA (April). Judging runs November 2026 to March 2027, with finalist pitches in February.

| Challenge | Question | Dimensions (as reported) |
|---|---|---|
| **Health** | How can we use technology to make good health and quality care more equitable for all? | 1. **Continuity of care** through outbreaks, climate shocks, conflicts, financing disruptions (e.g. early-warning systems, health-data interoperability, reliable supply chains, local production). 2. Prevention and management of **chronic and later-life conditions** (NCDs, mental health, ageing). 3. **Primary care access**: support frontline health workers; reduce cost, distance and administrative barriers. |
| Climate | Adapt equitably to a warming climate while cutting emissions from how people live and eat | Low-carbon resilient cities · protection from heat, floods, drought, wildfire · climate-resilient agrifood · ocean and coastal systems |
| Learning | Close global education gaps while improving outcomes for every learner | Includes better assessment of what learners can actually do (formative assessment, diagnostics, early screening that flags off-track learners). Solve wants **learning gains, not engagement**. |
| Economic Prosperity | Widen access to decent work, affordable housing and financial stability | Financial resilience · quality jobs (esp. youth) · safe, affordable, climate-resilient housing |
| Indigenous Communities Fellowship | n/a | Accepts concept-stage solutions |

**Eligibility.** Global Challenges take Prototype, Pilot, Growth and Scale stages. Concept-stage ideas go only to the Indigenous Fellowship (official pages; some aggregators disagree, **verify**). Solutions must be tech-based. Responses must be in English. Solve says your stage choice doesn't affect selection chances.

**Judging criteria** (consistent across sources): alignment · potential for impact · feasibility (including technical) · innovation · human-centred design · scalability · partnership potential (how Solve can help you).

**Partner prizes announced for 2027** (beyond the $10K):

| Prize | Amount | Fit for RefillAhead |
|---|---|---|
| AI for Humanity Prize (Patrick J. McGovern Foundation) | up to $150K | Only if AI is genuinely central. Today it is not (see §6). Apply only if you build the planned machine-learning (ML) piece. |
| Crescent Enterprises AI for Social Innovation Prize | up to $100K, max 4 teams | Same caveat |
| E Ink Innovation Prize | $100K | Weak fit |
| Citizens Workforce Innovation Prize | $100K, US teams | No |
| Seeding the Future (food systems) | $150K | No |
| Prince Albert II of Monaco Foundation Ocean Prize | up to $100K | No |

Health-specific partner prizes for 2027 did not show up in my searches. In 2025 the J&J Foundation gave a $100K Health Innovation Award across six teams. **Check the Health challenge page's prize list.**

**Solve's own warnings** (application guide): generic or AI-sounding answers "can seriously hurt" an application. Late submissions are not accepted for any reason. A website that doesn't load counts against you. If your only goal is funding, Solve says it is not the right program.

---

## 2. What wins: patterns in recent Solver classes

| Year | Selected / prize winners (examples) |
|---|---|
| 2023 AI for Humanity | Synnefa, Lucrefy, Climate Health Vulnerability Mapping, GNYPWD Accessible Connect |
| 2024 Health | MediBot, AmarDoctor, NiADA (non-invasive anaemia detection with AI) |
| 2024 Learning | Hunu, MakerDost, NABU Multilingual Literacy, Musa, Tatum T1 |
| 2025 Health | Clínicas del Azúcar AI Predictive Care, Rightfit, IMPALA, Impulso Previne, Smart Scope CX, Visilant |
| 2025 Economic Prosperity | ABALOBI, ELEVATE, Vinco, SwarajAbility, OkHi Digital Addressing |
| 2025 E Ink Prize | Adaptive Reader, BeeLine Reader, Housing NOW, IMPALA |
| 2026 (10th anniversary, $100K each) | Kara Solar, Making Space, Screening Linked to Care, Flint Paper Battery, BlueGea, BioIQ; **Karya** and **Rocket Learning** (AI for Humanity) |

The 2025 class was 31 winners from 2,900+ applications across 130+ countries (about 1%). The 10th-anniversary round picked 10 winners from 1,000+ applications.

**Patterns worth copying:**

1. **A named population with a specific failure point.** Winners don't pitch "better health". They pitch something like "anaemia goes undetected because lab tests are unavailable" (NiADA) or "cervical screening needs a specialist" (Smart Scope CX).
2. **Technology that fits the setting.** Offline-first, SMS/WhatsApp/voice, cheap phones. AI appears where it removes a real bottleneck (screening, language) and not as decoration.
3. **Leverage through frontline workers.** CHWs, nurses, teachers. Tools that make an existing workforce more effective score well on feasibility and scale.
4. **Traction or a credible path to it.** Most selected teams are at pilot or growth stage. A prototype-stage team has to make up for that with a sharp problem, real partners or letters of support, and evidence of user testing.
5. **Proximity.** Teams that come from, or work closely with, the community they serve.
6. **Partner-prize fit.** Most money beyond the $10K comes from partner prizes, so fit with one matters.

---

## 3. Options considered

Each option was scored against the judging criteria plus one practical constraint: a credible prototype in about 3 days.

| Option | Track / dimension | Alignment | Novelty | Evidence of need | Buildable now | Verdict |
|---|---|---|---|---|---|---|
| **RefillAhead**: forecast-triggered continuity of chronic care | Health 1 | ★★★ (names early warning, climate shocks, financing disruptions) | ★★★ (no equivalent found) | ★★★ (2025–26 funding-cut data, flood/cyclone evidence) | ★★★ | **Chosen** |
| AI reading-fluency assessment for Teaching at the Right Level | Learning (assessment) | ★★★ | ★ (Wadhwani AI's Vachan Samiksha, Google Read Along, EIDU, RTI Tangerine already exist) | ★★★ | ★ (needs local-language speech recognition, which can't be built or validated in 3 days) | Crowded; the AI claim would be thin |
| Heat-alert + work-rest guidance for outdoor workers | Climate 2 | ★★★ | ★★ (SEWA / Climate Resilience for All parametric heat insurance is established) | ★★★ | ★★ | Good, but weaker differentiation |
| Hypertension follow-up app | Health 2 | ★★ | ★ (Simple.org by Resolve to Save Lives dominates) | ★★★ | ★★★ | Too close to an incumbent |
| Portable records for displaced patients | Health 1 | ★★ | ★ (Hikma Health and Simprints are **past Solvers**) | ★★ | ★★ | Already funded by Solve |

---

## 4. The problem: evidence

### Climate shocks break chronic care
- **Pakistan 2022 floods:** about **2,000 health facilities (≈10% of the national total) damaged or destroyed**. WHO said the floods disrupted treatment of chronic diseases such as TB and HIV, and that essential medicine stocks were "washed away or critically low". [WHO EMRO appeal]
- **Cyclone Idai, Mozambique 2019:** the first major natural disaster in an African country with high HIV prevalence. Continuity of HIV care broke down, worsening clinical status and raising the risk of drug resistance [Lancet HIV, 2020]. MSF reported many patients without medication for some time. At Munhava health centre in Beira, advanced-stage HIV cases rose about **25%** in the following months [Devex]. Floods destroyed medicines and identity documents [UNAIDS].
- **Medication interruption after floods:** **9% overall, 23% among evacuees** in a post-flood study, highest in older people and those in long-term care [Prehospital and Disaster Medicine].
- A 2025 systematic review of community-based chronic care in disasters found **18 studies naming medication continuity as a key priority**. It explicitly suggests helping with refills **in advance of** disasters [PLOS Global Public Health].
- After floods, diabetes control deteriorates for a year, and cardiovascular events and hypertension worsen [Clin Infect Dis review].

### Funding shocks break it too (and they are announced in advance)
- **More than 1,700 HIV treatment sites closed** after the 2025 US funding cuts (amfAR survey, 166 organisations in 46 countries).
- Terminated USAID awards supported about **2.3 million people on HIV treatment**, roughly 1 in 10 PEPFAR patients [CGD Note 391].
- **77,163 fewer children** received PEPFAR-supported HIV treatment in FY2025 (−14.2%).
- **Lancet Global Health (2026), interrupted time series, Uganda and Zimbabwe:** HIV services fell **by between a half and two-thirds** after the stop-work orders and stayed down through March 2026. Treatment fell significantly despite the ART humanitarian waiver.
- UNAIDS modelling: **6.6M additional infections and 4.2M AIDS deaths by 2029** if the cuts are not replaced.

### The burden is large and concentrated
- NCDs killed **43 million people in 2021 (75% of non-pandemic deaths)**. **82% of premature NCD deaths** occur in LMICs [WHO fact sheet, Sept 2025].

### Warnings increasingly exist; acting on them at the patient level is the gap
- **119 countries (60%)** now report multi-hazard early-warning systems. Disaster mortality is **nearly 6× lower** where those systems are comprehensive [WMO Global Status of MHEWS 2025].
- Red Cross Early Action Protocols release funds automatically when a forecast trigger is hit. Their health actions are mostly kits, WASH and supplies, not individual patients' treatment.
- Tufts' 2025 *Landscape of Anticipatory Action for Health* reviewed all 49 published humanitarian anticipatory-action frameworks. It classifies them as hazard-driven or disease-driven.
- **Gap:** in my searches I found **no tool or evaluated program in LMICs** that uses forecasts or closure notices to trigger patient-level early refills, with tracing afterwards. The closest match is a US example: Florida law permits early prescription refills under a state of emergency. *Phrase this in the application as "we found no…", not "nothing exists".*

### The safe clinical action already exists
- **WHO strongly recommends 3–6 month ART refills** (6 preferred) for people established on ART. This depends on reliable supply and storage. Extended refills are only for children over 2. Adolescents and pregnant or postpartum women may need adapted schedules.
- So what's missing is **targeting and timing**: knowing *which* patients to give longer supplies to, *before* the road floods or the clinic closes, and *whether there is enough stock*.

---

## 5. The solution: RefillAhead

**What it does**
1. **Warning in.** A national met-service warning, a live forecast (prototype uses Open-Meteo rain/heat/river forecasts), or a clinic-closure notice. The user defines the disruption: onset date, how long access is lost, and the affected villages and facilities (by clicking them on the map).
2. **Who runs out.** For each patient on the line list: last refill + days supplied → run-out date. That is compared with "access returns + safety buffer". Anyone whose supply ends before then is flagged.
3. **Act early.** The cheapest safe action per patient:
   - early refill at their clinic before onset,
   - CHW delivery for patients who are mobility-limited or far away,
   - reroute plus bridging supply when a clinic is closing,
   - outreach after onset if there is no lead time.

   The supply length is capped by configurable WHO-aligned rules, with clinician-review flags for cases like not-yet-established ART, TB, children under 2, pregnancy and insulin storage. A transparent priority score ranks the work list, and each score lists its reasons.
4. **Stock.** Each dispensing facility keeps a routine reserve. Extra demand from the plan is added, and shortfalls become transfers from the nearest safe facility (or a district-store request). Stock sitting in flood-zone or closing facilities is flagged for removal.
5. **Messages.** SMS / voice / in-person scripts in the patient's language. They **never name the condition or medicine** (HIV stigma) and carry no names. Accents are dropped so messages stay in the GSM-7 alphabet and are cheap to send. There is a CSV export for any SMS gateway (RapidPro, Africa's Talking, Twilio).
6. **Confirm and trace.** Each patient's status is tracked (pending → notified → collected/delivered). After the pickup deadline, anyone not reached goes onto a tracing list for CHWs, which can be printed as per-village task sheets.

**Design principles judges will care about**
- **Works offline on a cheap phone or laptop** (PWA, no server, no map tiles). Data never leaves the device in the prototype.
- **Plugs into existing systems instead of replacing them:** CSV line-list import today. Roadmap: FHIR / DHIS2 Tracker / OpenMRS / Hikma Health connectors, and Common Alerting Protocol (CAP) feeds from national met services.
- **Rules where safety matters, AI where it helps.** Dispensing caps are explicit, auditable rules. Planned ML (§6) only *ranks* who to reach first and never decides how much medicine someone gets.
- **One engine for every disruption type:** cyclone, flood, heat, conflict, outbreak, funding cut.

**What is built (verifiable in this repo):** working web app; planning engine with 26 unit tests; 16 end-to-end browser checks including mobile layout and offline behaviour; three synthetic scenarios (cyclone, clinic closure, heatwave); live forecast check; CSV import/export; editable clinical rules.

**What is not built yet (say so):** EMR connectors, a real SMS gateway integration, user accounts and roles, encryption at rest, the ML risk model, and native-speaker-reviewed translations.

---

## 6. Competitive landscape

| Who | What they do | Relationship |
|---|---|---|
| Hikma Health (past Solver) | Offline open-source EHR for refugee/migrant clinics | **Data source / partner**: RefillAhead can sit on top of its records |
| Simprints (past Solver) | Biometric ID linking people to one record | Complementary (helps re-link displaced patients) |
| Medic / Community Health Toolkit, Dimagi CommCare, OpenSRP | CHW workflow platforms | **Distribution channel**: RefillAhead's engine can run as a module; CHW tasks go to their apps |
| Simple.org (Resolve to Save Lives) | Hypertension management at scale | Data source for HTN patients |
| Google Flood Hub, GloFAS, national met services | Forecasts and warnings | **Inputs**. They stop at the warning; RefillAhead turns it into patient actions |
| Red Cross Early Action Protocols / Forecast-based Financing | Pre-agreed funding released on forecast triggers | **Funding pathway**: RefillAhead's plan can be the health action inside an Early Action Protocol |
| SMS adherence tools (e.g. two-way texting for ART in Malawi) | Routine reminders | Not disruption-triggered; same delivery rails |

Positioning line: *"Forecasts tell you a flood is coming. Health records tell you who is on treatment. Nobody joins the two in time. RefillAhead does."*

**Where AI would genuinely help (roadmap, not built):**
1. An interruption-risk model trained on pilot data (past missed visits, distance, exposure history, age) to rank outreach when CHW time or stock is short.
2. Voice/IVR in local languages for patients who can't read.
3. Forecast-to-footprint mapping: which villages actually get cut off, learned from past events.

Do **not** claim AI as core unless you build (1) before submitting.

---

## 7. Risks and how to answer them

| Risk judges will spot | Answer |
|---|---|
| "No pilot, no users" | Declare Prototype. Show the working demo. Before submitting, **test it with 2–3 real health workers or pharmacists** (even by video call) and quote their feedback **only if real**. Name a target district/NGO for a pilot in 2027. |
| "Stock isn't there to give 3 months" | The engine checks stock first, prioritises the highest-risk patients, and suggests transfers. WHO also says multi-month *prescribing* can go ahead even when multi-month *dispensing* isn't possible. |
| Clinical safety | Configurable caps, clinician-review flags, defaults aligned with WHO, and an explicit "validate with national guidelines" step. Recruit a clinical advisor. |
| Data protection / stigma | De-identified line list, data stays on device, condition-neutral messages, no names in SMS. Roadmap: encryption, role-based access, data-sharing agreements. |
| Adoption by health systems | Built on exports health systems already produce, SMS gateways they already use, and CHW programmes they already run. The main buyers are ministries and implementing NGOs, funded through resilience and anticipatory-action budgets. |

---

## Sources

- MIT Solve, 2027 Global Health Challenge: https://solve.mit.edu/challenges/2027-global-health-challenge
- MIT Solve, 2027 Global Learning Challenge (deadline Nov 6, 12:00pm EST): https://solve.mit.edu/challenges/2027-global-learning-challenge
- MIT Solve, 2027 Global Climate Challenge: https://solve.mit.edu/challenges/2027-global-climate-challenge
- MIT Solve, 2027 Global Economic Prosperity Challenge: https://solve.mit.edu/challenges/2027-global-economic-prosperity-challenge
- MIT Solve, 2027 Global Challenges application questions (PDF): https://5593819.fs1.hubspotusercontent-na1.net/hubfs/5593819/2027%20Global%20Challenges_%20Application%20Questions.pdf
- MIT Solve, Application clinic Oct 26 (states Nov 2): https://solve.mit.edu/events/2027-global-application-clinic-1-1-3-2-3-1-1
- Opportunities for Youth, 2027 Global Challenges overview: https://opportunitiesforyouth.org/2026/10/04/mit-solve-global-challenges-2027-open-with-over-usd-1-million-in-prize-funding-and-nine-months-of-support/
- MIT Solve, Become a Solver (criteria): https://solve.mit.edu/innovators/become-a-solver
- MIT Solve, 2025 Global Health Challenge: https://solve.mit.edu/challenges/2025-global-health-challenge
- MIT Solve, 2025 Global Economic Prosperity Challenge: https://solve.mit.edu/challenges/2025-global-economic-prosperity-challenge
- MIT Solve, 2024 Global Learning Challenge: https://solve.mit.edu/challenges/2024-global-learning-challenge
- MIT Solve, 2024 Global Health Equity Challenge: https://solve.mit.edu/challenges/2024-global-health-challenge
- MIT Solve awards $1M to 10 innovators (2026): https://finance.yahoo.com/technology/articles/mit-solve-awards-1-million-213000477.html
- MIT Solve awards $1.5M to 31 innovators (2025): https://www.theglobeandmail.com/investing/markets/markets-news/ACCESS%20Newswire/34984392/mit-solve-awards-over-1-5-million-in-funding-to-tech-based-innovators-addressing-global-challenges/
- J&J, 2025 MIT Solve Health Innovation Award: https://www.jnj.com/impact-ventures/meet-the-winners-of-the-2025-mit-solve-health-innovation-award
- E Ink, Innovation Prize at MIT Solve 2025: https://www.eink.com/news/detail/e-ink-award-first-innovation-prize-at-MIT-solve-2025
- Hikma Health on Solve: https://solve.mit.edu/solutions/86418
- WHO EMRO, Pakistan floods appeal (Oct 2022): https://www.emro.who.int/images/stories/pakistan/PAKISTAN_APPEAL-04_Oct_2022.pdf
- Lancet HIV, HIV continuity of care after Cyclone Idai: https://www.thelancet.com/journals/lanhiv/article/PIIS2352-3018(20)30045-X/fulltext
- MSF, Treating HIV in the wake of Cyclone Idai: https://www.doctorswithoutborders.org/latest/mozambique-treating-hiv-wake-cyclone-idai
- Devex, Mozambique's cyclones and its HIV population: https://www.devex.com/news/the-impact-of-mozambique-s-cyclones-on-its-hiv-population-95075
- UNAIDS, Mozambique: getting people back on treatment: https://www.unaids.org/en/resources/presscentre/featurestories/2020/march/20200311_mozambique
- Interruption of medication among outpatients with chronic conditions after a flood: https://www.cambridge.org/core/journals/prehospital-and-disaster-medicine/article/abs/interruption-of-medication-among-outpatients-with-chronic-conditions-after-a-flood/47F3A6AFE1437EF89C1598FD4B8518B8
- Community-based solutions for chronic disease management during natural disasters (systematic review): https://journals.plos.org/globalpublichealth/article?id=10.1371%2Fjournal.pgph.0004997
- Health Risks of Flood Disasters (Clin Infect Dis): https://academic.oup.com/cid/article/67/9/1450/4945455
- UNAIDS, Estimating the impact of HIV response disruptions (Apr 2025): https://www.unaids.org/sites/default/files/2025-04/JC3144_Estimates_Funding_cuts_impact_En.pdf
- CGD Note 391, USAID program disruptions and PEPFAR: https://www.cgdev.org/sites/default/files/analyzing-usaid-program-disruptions-implications-pepfar-programming-and-beneficiaries.pdf
- Lancet Global Health (2026), HIV service delivery after PEPFAR/USAID withdrawal in Uganda and Zimbabwe: https://www.thelancet.com/journals/langlo/article/PIIS2214-109X(26)00223-8/fulltext
- LSE press release on the same study: https://www.lse.ac.uk/new-study-provides-first-real-world-evidence-of-steep-sustained-hiv-service-declines-following-us-foreign-aid-withdrawal-in-uganda-and-zimbabwe
- Al Jazeera, US funding cuts and global HIV treatment (Jul 2026): https://www.aljazeera.com/news/2026/7/21/us-funding-cuts-deal-blow-to-global-hiv-treatment-report
- Tech Times, 77,000 fewer children on HIV treatment: https://www.techtimes.com/articles/321668/20260727/pepfar-cuts-left-77000-fewer-children-hiv-treatment-aids-2026-opens-rio.htm
- WHO, Noncommunicable diseases fact sheet: https://www.who.int/news-room/fact-sheets/detail/noncommunicable-diseases
- WMO, Global Status of Multi-Hazard Early Warning Systems 2025: https://wmo.int/resources/publication-series/global-status-of-multi-hazard-early-warning-systems/global-status-of-multi-hazard-early-warning-systems-2025
- WMO press release on the 2025 report: https://wmo.int/news/media-centre/early-warning-systems-reach-new-heights-critical-gaps-jeopardize-global-progress
- IFRC, Forecast-based financing / Early Action Protocols: https://www.ifrc.org/sites/default/files/2022-08/Anticipatory-Pillar-DREF-brochure-practice-V3.pdf
- Tufts, Landscape of anticipatory action for health in a changing climate: https://now.tufts.edu/2025/10/20/landscape-anticipatory-action-health-changing-climate
- Florida DOH, early prescription refills under a state of emergency: https://www.floridahealth.gov/2024/09/24/potential-tropical-cyclone-nine-early-prescription-refills-permitted-under-state-of-emergency/
- WHO, Guidelines for multi-month dispensing (MMD) for HIV: https://www.who.int/indonesia/news/publications/other-documents/guidelines-for-multi-month-dispensing-(mmd)-for-hiv
- Differentiated Service Delivery, MMD policy: https://www.differentiatedservicedelivery.org/wp-content/uploads/2022/06/PolicyLab_MMD.pdf
- Open-Meteo forecast and flood APIs: https://open-meteo.com/en/docs and https://open-meteo.com/en/docs/flood-api
