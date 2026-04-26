# Aidutech — Product Roadmap
---

## Product Lanes + Access Rules (Locked)

1. Classroom Product (Teacher-led, multi-student)
- Teacher is the only role allowed to prompt and generate content.
- Students are read-only participants for delivered content: view, listen, answer quizzes, and ask questions.
- Multiple students can join the same live lesson session and consume the same teacher-generated presentation/notebook output.
- Students can see completion status signals for assigned peers (as configured by teacher/school policy).

2. Student B2C Product (self-serve)
- This keeps the current OpenMAIC behavior for students who purchase direct B2C access.
- B2C students can prompt, generate, and use full personal workflows.

3. Repository Rule (non-negotiable)
- Existing implementation is treated as core and must remain untouched.
- Teacher and student product surfaces are built by copying/adapting from core, not by editing core files in place.
- Folder model: core, teacher, student at top level.

---

## Architecture Overview

```
STUDENT (CLASSROOM)
├── Join a live shared session with multiple students
├── View assigned slides/notebook output (read-only)
├── Take assigned quiz/activities
├── Ask questions (quota-based, token burn)
└── See own progress + peer completion view (policy-controlled)

TEACHER
├── Prompt and generate slides/notebook content (teacher-only prompt surface)
├── Assign to students
├── Run collaborative classroom sessions
├── Monitor progress
└── AI teaching suggestions per student

STUDENT (B2C)
├── Current OpenMAIC self-serve workflows
├── Prompt and generate personal content
└── Independent usage and quota tracking

PLATFORM
├── Token tracking per student
├── Plan tier enforcement
├── Referral commission
└── Payment gateway
```

---

## Phase 1 — Core MVP (Weeks 1-2)

### 1.1 OpenMAIC Deployment + Ollama Integration

- [x] Clone OpenMAIC from GitHub
- [x] Set up Ollama on local machine
- [x] Connect Ollama as primary LLM (bypass API token costs)
- [x] Configure MiniMax as fallback LLM
- [x] Test basic lesson generation (PDF upload → slides)
- [x] Test multi-agent classroom (teacher + TA + classmates)
- [ ] Set up logging: every request logged with student ID, timestamp, token count

### 1.2 Classroom Student App (Read-Only by Default)

- [ ] Student can sign up with phone number
- [ ] Student can join class by invite/class code
- [ ] Student can join a live collaborative session with many students in one teacher-led room
- [ ] Student can view teacher-assigned notebook/slides/media
- [ ] Student can ask questions in-session (quota-based)
- [ ] Student can see own Q&A and class announcements
- [ ] Student can view teacher-enabled peer completion status (done/pending)
- [ ] Basic session ends after 15 minutes

### 1.3 Teacher Panel Foundation

- [ ] Teacher can sign up (separate role from student)
- [ ] Teacher can create a class (name, subject, batch)
- [ ] Teacher can add students to class (by phone number or CSV import)
- [ ] Teacher can view list of own classes
- [ ] Teacher can see student count per class
- [ ] Teacher is the only role with prompt/generation controls in classroom mode
- [ ] Teacher can publish generated lesson output to a shared live session

### 1.4 Token Counter (MVP)

- [ ] Log every LLM request with actor role (teacher/student_b2c/student_classroom)
- [ ] Dashboard: total tokens used today, this week
- [ ] No limits enforced yet — just tracking
- [ ] Store logs in SQLite for MVP

### 1.5 Repository Split Foundation

- [ ] Create top-level folders: core, teacher, student
- [ ] Move current implementation into core
- [ ] Keep roadmap at top level
- [ ] Teacher and student folders start empty and are populated by copied/adapted modules from core
- [ ] Rule: no direct edits to core when implementing teacher/student product surfaces

---

## Phase 2 — Teacher Panel v1 (Weeks 3-4)

### 2.1 Assignment Engine

- [ ] Teacher uploads PDF → triggers OpenMAIC lesson generation
- [ ] Teacher selects generated slides → assigns to entire class
- [ ] Teacher selects generated quiz → assigns to entire class
- [ ] Teacher can assign to individual students (not whole class)
- [ ] Assignment appears in student's dashboard
- [ ] Student can only access assigned content (not unassigned)

### 2.2 Quiz Builder

- [ ] Auto-generate quiz from assigned slides (extract key concepts → MCQs)
- [ ] Teacher can manually add MCQ question
- [ ] Teacher can manually add short-answer question
- [ ] Teacher can set correct answer per question
- [ ] Teacher can set marks per question
- [ ] Quiz saved to content library

### 2.3 Progress Tracker — Teacher View

- [ ] Per-student: slides viewed (yes/no), quiz completed (yes/no)
- [ ] Per-student: quiz score (%)
- [ ] Per-student: time spent on last session
- [ ] Per-class: overview grid of all students
- [ ] Export to CSV button

### 2.4 Collaborative Classroom Session

- [ ] Teacher can start a live class session from assigned content
- [ ] Multiple students can join one shared session concurrently
- [ ] Shared lesson state: all students follow the same teacher-controlled slide/context
- [ ] Students can ask questions during live session
- [ ] Students cannot prompt/generate content in classroom mode
- [ ] Teacher can view per-student completion in-session and after session

### 2.5 Lesson Scheduler

- [ ] Teacher sets release date/time for assignment
- [ ] Assignment auto-unlocks for students at scheduled time
- [ ] Teacher can edit schedule before release
- [ ] Teacher can delete draft assignment before release

### 2.6 Content Library

- [ ] Teacher's generated slides saved to library
- [ ] Teacher's created quizzes saved to library
- [ ] Teacher can reuse any slide/quiz in new class
- [ ] Content tagged by subject (Math, Physics, Chemistry, etc.)

---

## Phase 3 — Student Quota + Plan Tiers (Month 2)

### 3.1 Plan Tier System

- [ ] Three plans: Basic (₹1,000), Image (₹2,000), Video (₹3,000)
- [ ] Plan comparison page visible on signup
- [ ] Student selects plan during signup
- [ ] Plan stored in student record

### 3.2 Question Quota Per Plan

- [ ] Basic: 20 questions per month
- [ ] Image: 100 questions per month
- [ ] Video: unlimited questions
- [ ] Counter visible in student question UI ("12 questions left")
- [ ] When quota hits 0: show "upgrade to continue" prompt
- [ ] Quota resets on 1st of every month

### 3.5 B2C Student Workspace

- [ ] Preserve current OpenMAIC student prompting/generation capabilities for B2C users
- [ ] Clear mode separation: classroom student (read-only) vs B2C student (self-serve)
- [ ] Separate routing and auth guardrails for classroom and B2C surfaces

### 3.3 Slide/Quiz View Caching (Zero Token Cost)

- [ ] First student views slide → tokens logged, result cached
- [ ] Subsequent students view same slide → served from cache, no tokens
- [ ] Same student revisits slide → served from cache
- [ ] Quiz attempt → first attempt logged, subsequent attempts cached
- [ ] Cache key: content_hash + student_id (for per-student history)

### 3.4 Usage Dashboard — Student

- [ ] Student sees: questions used this month, questions remaining
- [ ] Student sees: quiz scores history
- [ ] Student sees: assigned homework pending/completed
- [ ] Student sees: session history with dates

---

## Phase 4 — Payment + Referral (Month 2-3)

### 4.1 UPI Payment Gateway (Razorpay or PhonePe)

- [ ] Simple payment page: select plan → pay ₹X → redirect to UPI
- [ ] Webhook receives payment success
- [ ] Student account upgraded on payment success
- [ ] Payment receipt sent via email/SMS
- [ ] Failed payment → account stays on current plan

### 4.2 Referral System — Institute Owners

- [ ] Institute owner signs up with own dashboard link
- [ ] Unique referral link per institute: `aidutech.com/r/[code]`
- [ ] Student signs up via referral link → attributed to institute
- [ ] Commission tracker: students referred, commission earned
- [ ] Monthly payout: UPI transfer to institute owner
- [ ] Commission = 10% of what student's plan costs

### 4.3 Teacher Plan Billing

- [ ] Teacher plan: ₹5,000/month
- [ ] Payment via institute owner account or individual teacher
- [ ] Same Razorpay flow as student
- [ ] Renewal reminders: 7 days before, 1 day before, on due date

### 4.4 School Billing (B2B Flat License)

- [ ] School signs up with multiple teachers
- [ ] School admin panel: see all teachers + student count
- [ ] Flat license: school pays ₹X for unlimited teachers/students
- [ ] School tier: ₹10,000/month (basic), ₹30,000/month (image), ₹50,000/month (video)
- [ ] Invoice generation for school

---

## Phase 5 — AI Teaching Coach (Month 3)

### 5.1 Student Personality Profile

- [ ] Teacher field in student profile: free-text notes
- [ ] Examples: "visual learner", "gives up on math easily", "needs concrete examples first"
- [ ] Profile visible to teacher on student card
- [ ] Auto-tag from quiz performance: "struggles with Chapter 3"

### 5.2 AI Teaching Suggestion Engine

- [ ] After every quiz: analyze which questions were wrong
- [ ] Map wrong questions to topics/chapters
- [ ] Generate suggestion: "Student scores 40% on Mechanics — suggest remedial slides"
- [ ] Suggestion displayed to teacher on student's progress page
- [ ] Suggestion stored in student history

### 5.3 Weakness Map

- [ ] Per-student: topics marked as weak (based on quiz scores < 60%)
- [ ] Visual indicator: red highlight on weak topics
- [ ] Teacher can override: mark topic as "needs review" or "mastered"
- [ ] Weakness map shared with student on their dashboard

### 5.4 AI-Generated Remedial Assignment

- [ ] Button on teacher UI: "Generate remedial for weak topics"
- [ ] AI generates a mini quiz (5 questions) on weak topics
- [ ] Auto-assigned to student
- [ ] Teacher can edit or delete before sending

---

## Phase 6 — Parent Dashboard + School Features (Month 3-4)

### 6.1 Parent Dashboard

- [ ] Parent signs up, links to student's account
- [ ] Parent sees: child's quiz scores, completion rate, session time
- [ ] Parent sees: assigned homework status
- [ ] Weekly summary email to parent (optional, toggled by school)
- [ ] Parent can message teacher (basic inbox)

### 6.2 School Admin Panel

- [ ] School admin (non-teacher) can see all teachers in school
- [ ] School admin can add/remove teachers
- [ ] School admin sees aggregate stats: total students, avg scores, engagement
- [ ] School admin sees which teachers are active/inactive
- [ ] School admin can upload school logo (white-label)

### 6.3 Curriculum Mapping

- [ ] Content tagged to board: CBSE, ICSE, JEE, NEET, State Board
- [ ] Content tagged to class: 6, 7, 8, 9, 10, 11, 12
- [ ] Content tagged to subject + chapter + topic
- [ ] Teacher can filter content library by curriculum
- [ ] Auto-suggest relevant content when teacher creates assignment

### 6.4 White-Label

- [ ] School can set custom subdomain: `[schoolname].aidutech.com`
- [ ] School logo + colors replace Aidutech branding
- [ ] School's referral link uses school name
- [ ] Student sees school branding in app

---

## Phase 7 — Advanced AI + NotebookLM Features (Month 4-5)

Note: Items in this phase are B2C-first by default. In classroom mode, these features are teacher-triggered and assigned to students.

### 7.1 NotebookLM-Style Source Grounding

- [ ] Student uploads own sources (PDF, notes)
- [ ] All AI responses cite specific page + line from source
- [ ] Source document stays in context for entire session
- [ ] Citations shown as footnotes in AI response
- [ ] Sources library per student

### 7.2 Audio Overview

- [ ] Student can generate podcast-style summary of any slide deck
- [ ] Two AI hosts discuss the material (NotebookLM style)
- [ ] Deep Dive / Brief / Debate modes
- [ ] Audio plays in-app, downloadable as MP3

### 7.3 Mind Map Generator

- [ ] Student clicks "Generate Mind Map" on any topic
- [ ] AI generates branching diagram from source material
- [ ] Mind map rendered as interactive SVG
- [ ] Student can click nodes to expand
- [ ] Saved to student's notes

### 7.4 Flashcard Generator

- [ ] Student clicks "Generate Flashcards" on any slide set
- [ ] AI extracts key concepts → Q&A pairs
- [ ] Student reviews flashcards in-app
- [ ] Spaced repetition: cards shown based on recall score

### 7.5 Multi-Agent Classroom Upgrade

- [ ] Integrate NotebookLM citations into OpenMAIC responses
- [ ] AI Teacher cites source when explaining
- [ ] AI Classmates debate using only source material (no hallucinations)
- [ ] Source sidebar: student can see which pages AI is referencing

---

## Phase 8 — Platform + Scale (Month 5-6)

### 8.1 Telecaller CRM (Lead Management)

- [ ] Add lead: institute name, contact, status
- [ ] Status: New → Contacted → Demo Scheduled → Signed → Live
- [ ] Notes per lead
- [ ] Reminder: follow-up date
- [ ] CSV import of leads

### 8.2 Commission Payout Automation

- [ ] Auto-calculate commission at end of month
- [ ] Generate payout list: institute, amount, UPI ID
- [ ] Bulk UPI transfer initiation
- [ ] Payout receipt sent to institute

### 8.3 Analytics Dashboard

- [ ] Platform-wide: total students, total teachers, total revenue
- [ ] Daily/weekly/monthly charts
- [ ] Churn rate: students who didn't log in for 30 days
- [ ] Top performing institutes by engagement
- [ ] Token cost per student per month (actual numbers)

### 8.4 Multi-Tenant Architecture

- [ ] Separate database/schema per institute (or row-level isolation)
- [ ] Isolated content library per institute
- [ ] Isolated student data per institute
- [ ] Admin can impersonate any institute (debug mode)

### 8.5 Mobile App (React Native or PWA)

- [ ] Student mobile app: view slides, take quiz, ask questions
- [ ] Teacher mobile app: assign homework, see progress
- [ ] Push notifications: homework assigned, quiz deadline approaching
- [ ] Offline mode: view cached slides when no internet

---

## Phase 9 — Growth + Automation (Month 6-12)

### 9.1 Free Tier for First 10,000 Students

- [ ] Implement free tier flag on student accounts
- [ ] Free tier: Basic plan features only, no payment
- [ ] Count tracked in admin dashboard
- [ ] Once 10,000 reached: auto-enforce payment for new signups
- [ ] Existing free users grandfathered in

### 9.2 Institute Self-Onboarding

- [ ] Institute owner signs up without needing a sales call
- [ ] Adds teachers themselves
- [ ] Adds students via CSV upload
- [ ] Pays via UPI link
- [ ] Gets referral link immediately

### 9.3 Automated Demo

- [ ] Landing page with video demo
- [ ] "Try free for 30 days" button
- [ ] Auto-creates trial institute account
- [ ] Email sequence: Day 1 welcome, Day 3 feature highlight, Day 14 upgrade prompt

### 9.4 Performance Prediction

- [ ] Based on quiz history: predict exam score range
- [ ] Flag students at risk of failing
- [ ] Alert teacher: "Rahul's performance declining over last 3 quizzes"
- [ ] Suggest intervention: remedial assignment

### 9.5 WhatsApp Integration

- [ ] Student receives WhatsApp notification for assigned homework
- [ ] Student can reply to WhatsApp message to ask doubt
- [ ] AI responds via WhatsApp with answer + citation
- [ ] Integration via OpenClaw (built into OpenMAIC)

---

## Phase 10 — Enterprise (Year 2)

### 10.1 Government School Deals

- [ ] Pitch to state education department
- [ ] Bulk pricing: ₹X per student per year (subsidized)
- [ ] Integration with state exam system
- [ ] Hindi-first interface option

### 10.2 State Board Curriculum Library

- [ ] Pre-built content for all state boards
- [ ] Uploaded by content team or sourced
- [ ] Teachers can assign directly without creating content

### 10.3 Scholarship Program

- [ ] Student applies for subsidy (income proof upload)
- [ ] Teacher approves or rejects application
- [ ] Subsidized student gets free Basic plan
- [ ] Aidutech claims CSR grant from partnered companies

### 10.4 API for Publishers

- [ ] Publisher uploads book content (PDF)
- [ ] API returns: auto-generated slides, quiz, summary
- [ ] Publisher embeds in their own app via iframe or API
- [ ] Revenue share: per-generation fee

---

## Priority Order Summary

```
MONTH 1: Phase 1 → Phase 2 → Phase 3 (MVP to start selling)
MONTH 2: Phase 4 → Phase 5 (Payment + AI coach)
MONTH 3: Phase 6 → Phase 7 (Schools + NotebookLM)
MONTH 4-6: Phase 8 (Scale infrastructure)
MONTH 6-12: Phase 9 (Growth automation)
YEAR 2: Phase 10 (Enterprise)
```

---

## Cost Estimates

### Developer Time

| Phase | Estimated Time | Notes |
|---|---|---|
| Phase 1 | 1-2 weeks | OpenMAIC setup + basic views |
| Phase 2 | 2 weeks | Teacher assignment engine |
| Phase 3 | 1 week | Quotas + caching |
| Phase 4 | 1-2 weeks | Payments + referrals |
| Phase 5 | 1-2 weeks | AI teaching coach |
| Phase 6 | 2 weeks | Parents + schools |
| Phase 7 | 2-3 weeks | NotebookLM features |
| Phase 8 | 2-3 weeks | Platform + scale |
| Phase 9 | 2-4 weeks | Automation |
| Phase 10 | Ongoing | Enterprise features |

**Total MVP to selling: 4-6 weeks**
**Full platform: 4-6 months**

---

## Technical Stack

```
Frontend:    Next.js + React + TypeScript (from OpenMAIC)
Backend:     Node.js API (OpenMAIC backend) + SQLite (MVP)
LLM:         Ollama (local) + MiniMax (fallback/orchestration)
Payments:    Razorpay or PhonePe
SMS:         MSG91 or Twilio
Hosting:     AWS EC2 (GPU) or own server
Domain:      aidutech.com
```
