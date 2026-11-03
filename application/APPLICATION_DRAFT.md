# RefillAhead: MIT Solve 2027 application draft

> **Read this first.**
> 1. Solve's 2027 guide warns that **generic or AI-sounding answers can seriously hurt an application.** Treat everything below as a skeleton. Rewrite each answer in your own words and add your own story, place and people. Judges read thousands of these.
> 2. Everything in `[BRACKETS]` is something only you can supply. **Never invent users, pilots, partners or quotes.** "Prototype, tested with 3 nurses in [town]" beats a made-up pilot.
> 3. Word limits below come from fragments of the 2027 questions PDF (several answers capped at 200 words, innovation and business model at 300). **Check every limit in the live form.** Draft word counts are shown next to each heading.
> 4. **Deadline: 6 Nov 2026, 12:00 pm ET.** Submit on 5 Nov. Late submissions are not accepted for any reason.

---

## Basics

| Field | Draft |
|---|---|
| Solution name (≤30 chars) | **RefillAhead** |
| One-line description | Uses weather warnings and clinic-closure notices to get chronic-care patients their medicine before floods, heatwaves or funding cuts cut them off. |
| Challenge | 2027 Global Health Challenge |
| Dimension | Strengthen continuity of care in the face of outbreaks, climate shocks, conflicts or financing disruptions |
| Stage | **Prototype** |
| People currently served | 0 (prototype). Do not inflate this. |
| Headquarters | [CITY, COUNTRY] |
| Where it will be piloted first | [DISTRICT, COUNTRY]. Pick a flood/cyclone-prone district with high HIV/NCD burden where you have a contact. Examples: Sofala (Mozambique), Southern Region (Malawi), Sindh (Pakistan). |
| Website | [GitHub Pages URL: see README → "Publish the demo"]. Solve marks down sites that don't load, so test it on your phone. |
| Technologies | Software and mobile applications. Do not tick AI/ML unless you build it before submitting. |
| SDGs | 3 (Good health and well-being: 3.3 HIV/TB, 3.4 NCDs, 3.8 UHC) · 13 (Climate action: 13.1 resilience to climate hazards) |

---

## What specific problem are you solving? (≤200 words) · *draft: ~186*

When a cyclone, flood or heatwave hits, or donor funding shuts a clinic, people on lifelong treatment lose access to medicine at exactly the moment they can least afford it. For HIV, TB, insulin-dependent diabetes and epilepsy, a gap of days can mean drug resistance, ketoacidosis or seizures.

This is already happening at scale. Pakistan's 2022 floods damaged or destroyed about 2,000 health facilities, and WHO reported that TB and HIV treatment was disrupted. After Cyclone Idai, advanced HIV cases at one Beira health centre rose about 25%. After floods, medication interruption reaches 23% among evacuees. Following the 2025 aid cuts, more than 1,700 HIV treatment sites closed, and HIV services in Uganda and Zimbabwe fell by half to two-thirds.

Most of these disruptions are announced days in advance: by a forecast, a cyclone warning or a stop-work order. 119 countries now have multi-hazard early-warning systems. Clinics also know who is on treatment and when each person's supply runs out. But nobody joins the two in time, so patients are not given medicine before the road floods or the clinic closes.

[ADD ONE SENTENCE OF YOUR OWN: why this matters to you or your community.]

---

## What is your solution? (≤200 words) · *draft: ~190*

RefillAhead turns a warning into a patient-by-patient action plan before the disruption arrives.

A district health officer or clinic in-charge enters (or receives) the warning: what is coming, when, for how long, and which villages and facilities are affected. RefillAhead compares it with the clinic's existing patient list (last refill date and days supplied) and finds every person whose medicine would run out before they can reach care again.

For each of them it plans the cheapest safe action:
- an early refill at their clinic before the deadline,
- a home delivery by a community health worker for people who are far away or have limited mobility,
- or a bridging supply plus a new clinic when theirs is closing.

Supply lengths follow configurable, WHO-aligned rules, with flags for clinician review. RefillAhead then:
- checks each facility's stock and proposes transfers before roads close,
- sends SMS or voice messages in the patient's language that never reveal their condition,
- after the deadline, gives health workers a tracing list of everyone who was missed.

It works offline on a basic laptop or phone and imports the patient lists clinics already keep.

---

## Who does your solution serve, and in what ways will it impact their lives? (≤200 words) · *draft: ~150 + your addition*

**Primary beneficiaries:** people on long-term treatment for HIV, TB, hypertension, diabetes (including insulin) and epilepsy who live in places exposed to floods, cyclones and extreme heat, or who depend on donor-funded clinics. Many are poor, rural, older or pregnant. They are the least able to travel once roads close, and the most likely to be told "come back next month" when a clinic shuts.

**Direct users:** clinic in-charges, district pharmacists and community health workers. Today they rebuild patient lists by hand after a disaster and search for people who have already gone without treatment for weeks. RefillAhead gives them a ranked task list days before the event, with stock and messages ready.

**Impact on patients:**
- Treatment continues through the disruption.
- Fewer emergency admissions, less drug resistance and fewer deaths.
- Fewer dangerous journeys during floods or heat.
- Privacy is protected: messages never name the disease.

[ADD: how you have involved, or will involve, these users in design. If you have spoken with health workers, say how many, where, and what changed because of it. If you haven't yet, do it before you submit (see the 3-day plan below).]

---

## How are you and your team well-positioned to deliver this solution? (≤200 words) · *draft: guidance only*

This answer carries a lot of weight and must be yours. Cover:
- **Who you are** and your connection to the communities affected (lived experience of floods or heat, working in or near health services, family on chronic treatment, etc.).
- **Skills:** you built a working prototype (planning engine, offline web app, 26 unit tests, 16 browser checks). Link the repo.
- **The gaps you know you have and how you will fill them:** a clinical advisor (nurse, pharmacist, HIV clinician or public-health doctor) and an implementing partner (district health office, NGO running ART/NCD clinics, Red Cross/Red Crescent national society).
- **Any conversations already held.** Name them only with permission, and only if real.

> Prototype-stage teams are selected when the team is credible. One confirmed clinical advisor and one organisation willing to discuss a pilot changes how judges read everything else.

---

## Why are you applying to Solve? (≤200 words) · *draft: ~132*

RefillAhead works as software. To work in the real world it needs three things we cannot get alone.

1. **A pilot partner and clinical validation.** We need a ministry of health district, an HIV/NCD implementing partner or a Red Cross/Red Crescent national society willing to run RefillAhead before the next rainy or cyclone season, and clinicians to validate the dispensing rules against national guidelines. Solve's network of health partners and past Solvers (including Hikma Health's EHR, whose records RefillAhead could plan from) is the fastest route to that.
2. **Technical integration:** connectors for DHIS2 Tracker, OpenMRS and FHIR, and secure SMS/voice delivery.
3. **Financing pathways:** introductions to anticipatory-action and health-resilience funders who already release money on forecast triggers, so that a RefillAhead plan becomes the health action inside those protocols.

Barriers to select: **Technical**, **Market access** (government and NGO relationships), **Financial**.

---

## What makes your solution innovative? (≤300 words) · *draft: ~253*

Two systems already exist side by side and never meet.

- **Early warnings** tell governments a flood or cyclone is coming. Anticipatory-action protocols even release funding automatically when a forecast crosses a threshold. But the health actions in those protocols are mostly kits and supplies, not individual patients.
- **Clinic records** know exactly who is on treatment and when each person's medicine runs out. But they are only consulted after people stop coming.

RefillAhead connects them. It is, as far as we have found, the first tool to turn a hazard forecast or closure notice into a ranked, patient-level plan of early refills, deliveries, reroutes and stock transfers before the disruption, with tracing afterwards. We searched the anticipatory-action literature, including a 2025 review of all 49 published humanitarian anticipatory-action frameworks, and found no tool or evaluated programme that does this in low- and middle-income settings.

**It changes timing, not medicine.** The clinical action already exists: WHO strongly recommends 3–6-month ART refills for people stable on treatment. RefillAhead decides *who* should get a longer supply, *when*, and *whether there is stock*.

**Other design choices that matter:**
- **One engine for every disruption:** cyclone, flood, heat, conflict, outbreak or funding cut.
- **Privacy built in:** condition-neutral messages, data kept on the device.
- **Works offline,** because the places that flood are the places that lose signal.
- **Transparent rules for safety-critical decisions.** Any future machine learning will only rank who to reach first. It will never decide how much medicine a person gets.

---

## Describe in simple terms how and why you expect your solution to have an impact (theory of change) · *draft: ~133*

**Activity:** A warning (forecast, cyclone alert or closure notice) is matched against the clinic's patient list.
→ **Output:** A ranked list of patients who would run out, each with a pickup clinic, deadline and supply length. Plus stock transfers and patient messages.
→ **Short-term outcome:** More at-risk patients collect or receive extra medicine before access is lost. Clinics avoid stock-outs in the safe facilities patients are sent to.
→ **Medium-term outcome:** Fewer treatment interruptions during and after disruptions. Missed patients are traced in days, not weeks.
→ **Long-term impact:** Lower drug resistance, fewer avoidable hospitalisations and deaths, and patients retained in care through climate and funding shocks.

**Key assumptions to test in the pilot:**
- Patients act on the message.
- Stock can be moved in the lead time.
- Clinicians accept the dispensing rules.

---

## What are your impact goals and how will you measure them? · *draft: table*

Goals for the first pilot season [EDIT TO MATCH YOUR PLAN]:

| Goal | Indicator | How measured |
|---|---|---|
| Reach at-risk patients before onset | % of flagged patients who collect or receive medicine before the deadline | RefillAhead status log, checked against the dispensing register |
| Prevent interruptions | % of flagged patients with no supply gap during the disruption window, vs. the previous comparable event | Refill dates in the clinic register before and after |
| Find missed patients fast | Median days from deadline to tracing contact | Tracing list timestamps |
| Avoid stock-outs | Stock-out days at receiving facilities during the event | Facility stock cards |
| Safety | Clinician overrides and adverse events linked to extended supply | Review log |

Longer term: viral suppression, TB treatment completion and blood-pressure control among patients flagged during disruptions, through partner data.

---

## Describe the core technology (≤300 words) · *draft: ~222*

RefillAhead is an offline-first progressive web app. It runs in any modern browser on a low-cost laptop or Android phone, installs to the home screen, and keeps working without signal.

- **Planning engine** (plain JavaScript, no server):
  - Computes each patient's run-out date and compares it with the disruption window plus a safety buffer.
  - Assigns the cheapest safe action using distance to open facilities and patient flags.
  - Caps supply by configurable clinical rules (WHO-aligned defaults, editable per country).
  - Ranks patients with a transparent, additive priority score, and shows the reasons for each score.
  - Covered by 26 automated tests.
- **Stock planner:** reserves routine stock at each facility, adds the plan's extra demand, and proposes transfers from the nearest safe facility with a surplus.
- **Hazard input:** manual entry, map editing, or a live check against Open-Meteo's 16-day rain and temperature forecasts and its GloFAS-based river-discharge forecast. Production will ingest official national warnings via the Common Alerting Protocol.
- **Messaging:** templates in English, Portuguese, Kiswahili and French, kept to the cheap GSM-7 SMS alphabet. CSV export for any SMS gateway (e.g. RapidPro). Voice/IVR and CHW scripts for people without phones.
- **Data:** CSV import of de-identified patient line lists today. FHIR, DHIS2 Tracker and OpenMRS connectors are next.
- **Open source** (MIT licence), so ministries can audit and adapt it.

---

## What is your business model? (≤300 words) · *draft: ~179*

**Customers** (who pays): ministries of health at district or provincial level, NGOs that run HIV, TB and NCD programmes, and humanitarian organisations with anticipatory-action plans.

**Beneficiaries** (who never pays): patients.

**Value proposition:** keeping a patient on treatment through a disruption is far cheaper than treating the consequences: drug-resistant TB, advanced HIV, diabetic emergencies, strokes. Programmes also lose fewer patients from care, which donors and ministries already track and report.

**Model:**
1. **Free, open-source core**, so any ministry can adopt it and audit it.
2. **Paid deployment and support contracts** with implementing partners: configuration for national guidelines and languages, EMR/SMS integration, training, and a season of support.
3. **Funding through budget lines that already exist:**
   - preparedness and resilience components of health programme grants,
   - anticipatory-action and forecast-based financing funds that pre-agree actions before a disaster,
   - climate-and-health adaptation funding.

   RefillAhead gives these funders a concrete, measurable health action to trigger.

**Running costs** are low: no servers in the base version. Messages cost a few US cents each through the gateways health programmes already use.

[ADD: who you will approach first, and any price you have tested. If none yet, say what you will validate during the Solve program.]

---

## What is your plan for becoming financially sustainable? (≤300 words) · *draft: ~80 + your evidence*

Year 1 (with Solve): pilot in one district through one season, funded by the Solve grant and partner in-kind support. Measure the indicators above.

Year 2: use pilot evidence to secure 2–3 paid deployment contracts with implementing partners in neighbouring districts or countries, and to be written into at least one anticipatory-action protocol as the health early action.

Year 3: ministry adoption through an existing digital-health platform (DHIS2/OpenMRS/CHW apps), with support revenue covering the core team.

[ADD any evidence that this works: letters of interest, conversations with programme managers, comparable tools funded this way (e.g. open-source digital public goods with support contracts).]

---

## Prize-specific questions

- **AI for Humanity Prize / Crescent Enterprises AI Prize:** apply **only if** you build a real ML component before submitting. One option: an interruption-risk model on public or synthetic data, clearly labelled. Otherwise skip these, because an inflated AI claim is easy for judges to spot. Describe the ML as roadmap in the core-technology answer instead.
- **Health partner prizes:** check the 2027 Health challenge page for any health-specific prize (in 2025 the J&J Foundation gave a $100K Health Innovation Award) and answer its question directly.

---

## Pitch video script (60–90 seconds, phone camera is fine)

> **[0–10s]** *(Show a news clip still or a photo of a flooded road. Own or licensed images only.)* "When this road floods, people on HIV, TB or insulin treatment can't reach their clinic for weeks."
>
> **[10–25s]** "But we usually know days in advance: a cyclone warning, a flood forecast, a funding stop-work order. And clinics already know who's on treatment and when their medicine runs out. Nobody puts the two together in time."
>
> **[25–60s]** *(Screen-record the demo.)* "RefillAhead does. Pick the warning, and it shows who will run out before access returns: 117 patients here. Each one gets the right action: an early refill, a home delivery, or a new clinic if theirs is closing. It checks stock and moves it before the roads close. It sends messages that never reveal the condition. And afterwards it tells health workers exactly who to trace."
>
> **[60–80s]** "It works offline, uses the patient lists clinics already have, and follows WHO dispensing guidance. We're [WHO YOU ARE], and with Solve we want to pilot it in [DISTRICT] before the next cyclone season."

---

## 3-day plan to submission

**Day 1 (today, 3 Nov)**
- [ ] Confirm the deadline in the Solve portal and create the application.
- [ ] Publish the demo on GitHub Pages (README) and open it on your phone.
- [ ] Message 5–10 people who work in clinics, pharmacies, district health offices or NGOs in a flood-prone area: "15 minutes to look at a prototype?"
- [ ] Ask one clinician to be your clinical advisor.

**Day 2 (4 Nov)**
- [ ] Run 2–3 short user tests by video call. Use the cyclone scenario, ask what is wrong or missing, and write down exact quotes.
- [ ] Rewrite every answer above in your own words, with your real story and test findings.
- [ ] Choose the pilot district and name it consistently.

**Day 3 (5 Nov): submit**
- [ ] Have someone outside the project read the application for clarity.
- [ ] Check every word limit in the form.
- [ ] Record the 60–90 second video if the form asks for one (or keep it for finalists).
- [ ] **Submit before 6 Nov 12:00 pm ET.** Screenshot the confirmation.
