import type {
  ApiEndpoint,
  Coverage,
  CoverageDimension,
  DataEntity,
  FlowEdge,
  FlowNode,
  InterviewAnswer,
  InterviewQuestion,
  Journey,
  Milestone,
  NFR,
  Persona,
  PRDContent,
  Priority,
  ProductFlow,
  Requirement,
  Risk,
  Task,
  Wireframe,
  WireframeBlock,
  WireframeBlockType,
} from "./types";
import { ALL_COVERAGE_KEYS, emptyCoverage, getInterviewQuestion } from "./constants";
import { resolveTechStack, type ResolvedTechStack } from "./tech-presets";
import { slugify, uid } from "./utils";

type ProjectBrief = {
  name: string;
  productType: string;
  summary: string;
  techPreset?: string;
  customStack?: string;
};

type FeatureSpec = {
  title: string;
  description: string;
};

const FEATURE_CATALOG: Record<string, FeatureSpec[]> = {
  CRM: [
    { title: "Lead and contact management", description: "Capture, deduplicate, search, and maintain leads and contacts with ownership and lifecycle status." },
    { title: "Company and account records", description: "Group contacts under companies with account owner, industry, size, and relationship history." },
    { title: "Visual deal pipeline", description: "Move deals through configurable stages with value, probability, close date, and owner." },
    { title: "Activity timeline and notes", description: "Record calls, emails, meetings, and notes in a chronological timeline per record." },
    { title: "Tasks and reminders", description: "Create follow-up tasks with due dates, assignees, and reminders tied to records." },
    { title: "Pipeline reporting dashboard", description: "Show pipeline value, stage conversion, activity volume, and rep performance." },
    { title: "Roles and permissions", description: "Scope access by role, team, record ownership, and administrative capabilities." },
    { title: "CSV import and export", description: "Import contacts and companies with validation, deduplication, and error reporting." },
    { title: "Email integration", description: "Connect an email account to log messages and create follow-up tasks." },
    { title: "Audit log", description: "Track security-relevant and record-changing events with actor, timestamp, and before/after state." },
  ],
  Marketplace: [
    { title: "Buyer onboarding", description: "Let buyers create an account, set preferences, and reach a first successful purchase." },
    { title: "Seller onboarding and verification", description: "Collect seller identity, business details, payout information, and verification status." },
    { title: "Catalog and search", description: "Publish listings with categories, attributes, media, pricing, and searchable filters." },
    { title: "Cart and checkout", description: "Support cart management, shipping selection, fees, and a resilient checkout flow." },
    { title: "Payment processing", description: "Authorize, capture, refund, and reconcile payments through a payment provider." },
    { title: "Order management", description: "Give buyers and sellers a shared order state machine with cancellation and dispute paths." },
    { title: "Reviews and ratings", description: "Collect verified reviews, moderation flags, and aggregate seller ratings." },
    { title: "Admin moderation", description: "Review listings, users, disputes, and policy violations with an audit trail." },
    { title: "Seller payouts", description: "Calculate fees and payouts, then expose payout status and statements to sellers." },
    { title: "Transactional notifications", description: "Send order, payment, and account notifications through email or in-app channels." },
  ],
  "SaaS Platform": [
    { title: "Authentication and workspaces", description: "Support sign-up, sign-in, workspace creation, invitations, and session management." },
    { title: "Onboarding checklist", description: "Guide new workspaces to first value with a measurable setup checklist." },
    { title: "Core workspace", description: "Provide the primary create, view, update, and archive workflow for the product's core object." },
    { title: "Collaboration and comments", description: "Let team members discuss records with mentions, notifications, and resolution state." },
    { title: "Notification center", description: "Deliver in-app and email notifications with user-level preferences." },
    { title: "Billing and plans", description: "Manage plans, seats, trials, invoices, and subscription state through a billing provider." },
    { title: "Admin console", description: "Manage members, roles, workspace settings, and security controls." },
    { title: "Usage analytics", description: "Expose activation, engagement, and feature adoption to workspace administrators." },
    { title: "API keys and webhooks", description: "Allow workspace admins to create scoped keys and subscribe to domain events." },
    { title: "Audit log", description: "Record administrative and security events with filtering and export." },
  ],
  "Internal Tool": [
    { title: "Request intake", description: "Capture structured requests with required fields, attachments, and requester context." },
    { title: "Assignment and routing", description: "Route requests to the right queue or owner using deterministic rules." },
    { title: "Approval workflow", description: "Support multi-step approvals with thresholds, rejection reasons, and delegation." },
    { title: "Status tracking", description: "Expose a clear state machine for every request, including blocked and reopened states." },
    { title: "Notifications", description: "Notify requesters and approvers about assignments, decisions, and overdue items." },
    { title: "Audit trail", description: "Record every state transition and approval decision with actor and timestamp." },
    { title: "Operations dashboard", description: "Show queue volume, aging, SLA risk, and throughput by team." },
    { title: "Role management", description: "Define roles, queues, approval limits, and least-privilege access." },
    { title: "Export and reporting", description: "Export filtered operational data and schedule recurring summaries." },
  ],
  "Mobile App": [
    { title: "Onboarding and authentication", description: "Provide a low-friction first-run experience with secure sign-in and account recovery." },
    { title: "Home feed", description: "Surface relevant content and actions on the first screen with empty and error states." },
    { title: "Core action flow", description: "Let users complete the product's primary job in a small number of steps." },
    { title: "Search and filters", description: "Help users find content quickly with recent searches and saved filters." },
    { title: "Push notifications", description: "Deliver opt-in notifications with deep links and preference controls." },
    { title: "Profile and settings", description: "Manage identity, preferences, privacy, and account deletion." },
    { title: "Offline support", description: "Preserve core reads and queued writes when connectivity is unreliable." },
    { title: "Sharing and deep links", description: "Share content through native sheets and resolve links into the correct screen." },
    { title: "Product analytics events", description: "Emit a stable, documented event taxonomy for activation and engagement." },
  ],
  Fintech: [
    { title: "Identity verification", description: "Verify customer identity with document checks, liveness, and sanctions screening." },
    { title: "Account onboarding", description: "Create accounts with terms acceptance, risk rating, and funding instructions." },
    { title: "Wallet and balance", description: "Show available, pending, and reserved balances with a clear transaction ledger." },
    { title: "Transactions", description: "List, filter, and inspect transactions with immutable references and receipts." },
    { title: "Transfers", description: "Initiate internal and external transfers with limits, review, and idempotency." },
    { title: "Statements", description: "Generate downloadable statements for a selected period with reconciliation totals." },
    { title: "Fraud checks", description: "Score risky actions, hold suspicious transfers, and route cases to reviewers." },
    { title: "Compliance reporting", description: "Produce audit-ready reports for regulated reviews and retention requirements." },
    { title: "Security notifications", description: "Notify customers about sign-ins, transfers, and sensitive profile changes." },
  ],
  Healthcare: [
    { title: "Patient records", description: "Maintain demographics, care team, encounters, and consented clinical information." },
    { title: "Appointment scheduling", description: "Book, reschedule, and cancel appointments with availability and reminders." },
    { title: "Clinical notes", description: "Capture structured and free-text notes with author, timestamp, and amendment history." },
    { title: "Consent management", description: "Record patient consent, scope, expiry, and revocation with an audit trail." },
    { title: "Prescriptions", description: "Create, review, and transmit prescriptions with interaction warnings." },
    { title: "Billing", description: "Generate claims or invoices from encounters and track payment status." },
    { title: "Audit log", description: "Record every access to patient data with actor, purpose, and timestamp." },
    { title: "Role-based access", description: "Apply least-privilege access by care role, patient relationship, and break-glass policy." },
    { title: "Clinical reporting", description: "Report operational and quality metrics without exposing unnecessary patient data." },
  ],
  Education: [
    { title: "Course catalog", description: "Publish courses with outcomes, modules, prerequisites, pricing, and availability." },
    { title: "Enrollment", description: "Let learners enroll, waitlist, and manage access to purchased or assigned courses." },
    { title: "Lessons", description: "Deliver structured lessons with media, progress tracking, and completion rules." },
    { title: "Assignments", description: "Create assignments, collect submissions, and show due dates and feedback." },
    { title: "Grading", description: "Support rubrics, scores, feedback drafts, and grade release controls." },
    { title: "Progress tracking", description: "Show learner progress, streaks, completion, and next recommended action." },
    { title: "Notifications", description: "Notify learners and instructors about deadlines, feedback, and enrollment events." },
    { title: "Instructor dashboard", description: "Give instructors a view of cohort progress, at-risk learners, and grading queues." },
    { title: "Payments", description: "Sell courses and manage refunds, coupons, and access revocation." },
  ],
  Logistics: [
    { title: "Shipment creation", description: "Create shipments with addresses, packages, service level, and declared value." },
    { title: "Tracking", description: "Expose a normalized tracking timeline across carriers and status sources." },
    { title: "Route planning", description: "Assign stops to routes with capacity, time windows, and distance constraints." },
    { title: "Driver assignment", description: "Assign drivers and vehicles while preventing conflicts and overload." },
    { title: "Proof of delivery", description: "Capture signature, photo, timestamp, and exception reason at delivery." },
    { title: "Notifications", description: "Notify customers and dispatchers about pickup, delay, delivery, and exceptions." },
    { title: "Billing", description: "Calculate billable charges from shipments, accessorials, and rate rules." },
    { title: "Operations analytics", description: "Report on-time delivery, route efficiency, and exception trends." },
    { title: "Partner integrations", description: "Exchange shipment and tracking data with carrier and warehouse systems." },
  ],
  Generic: [
    { title: "Authentication and profiles", description: "Support secure sign-in, account recovery, profile management, and session controls." },
    { title: "Dashboard", description: "Provide a role-aware overview of the most important records, actions, and alerts." },
    { title: "Core record management", description: "Create, view, edit, archive, and restore the product's primary business object." },
    { title: "Search and filtering", description: "Find records quickly with text search, filters, sorting, and saved views." },
    { title: "Notifications", description: "Deliver relevant in-app and email notifications with user preferences." },
    { title: "Settings", description: "Manage profile, workspace, notification, and security preferences." },
    { title: "Roles and permissions", description: "Apply least-privilege access through roles, ownership, and administrative controls." },
    { title: "Reporting", description: "Summarize activity, outcomes, and exceptions for decision makers." },
    { title: "Export", description: "Export filtered data in a documented format with permission checks." },
  ],
};

const PERSONA_CATALOG: Record<string, Persona[]> = {
  CRM: [
    { id: "persona-sales-rep", name: "Sales Representative", role: "Owns leads and deals", goals: ["Qualify leads quickly", "Never miss a follow-up", "Close deals with less admin work"], painPoints: ["Data scattered across inbox and spreadsheets", "No clear next action"] },
    { id: "persona-sales-manager", name: "Sales Manager", role: "Manages pipeline and team", goals: ["Forecast accurately", "Spot stalled deals", "Coach the team with evidence"], painPoints: ["Pipeline reports are stale", "Stage definitions are inconsistent"] },
    { id: "persona-crm-admin", name: "CRM Administrator", role: "Owns configuration and access", goals: ["Keep data clean", "Control access", "Audit changes"], painPoints: ["Duplicate records", "Hard-to-trace permission changes"] },
  ],
  Marketplace: [
    { id: "persona-buyer", name: "Buyer", role: "Purchases from sellers", goals: ["Find trustworthy supply", "Check out quickly", "Resolve order issues"], painPoints: ["Unclear seller quality", "Slow checkout"] },
    { id: "persona-seller", name: "Seller", role: "Lists and fulfills supply", goals: ["Reach demand", "Manage orders", "Get paid on time"], painPoints: ["Manual listing work", "Unclear payout status"] },
    { id: "persona-operator", name: "Marketplace Operator", role: "Runs trust and operations", goals: ["Moderate supply", "Resolve disputes", "Protect marketplace quality"], painPoints: ["Fragmented moderation tools", "No audit trail"] },
  ],
  "SaaS Platform": [
    { id: "persona-admin", name: "Workspace Administrator", role: "Owns workspace setup and access", goals: ["Onboard the team", "Control permissions", "See adoption"], painPoints: ["Setup takes too long", "Unclear usage"] },
    { id: "persona-member", name: "Team Member", role: "Completes daily work", goals: ["Reach the core workflow quickly", "Collaborate clearly"], painPoints: ["Too many tools", "Unclear ownership"] },
    { id: "persona-billing", name: "Billing Owner", role: "Manages plan and invoices", goals: ["Avoid surprise charges", "Manage seats"], painPoints: ["No clear plan usage"] },
  ],
  "Internal Tool": [
    { id: "persona-requester", name: "Requester", role: "Submits a request", goals: ["Submit complete information", "Know the status"], painPoints: ["Unclear requirements", "No visibility after submission"] },
    { id: "persona-approver", name: "Approver", role: "Reviews and decides", goals: ["Decide quickly with context", "Avoid duplicate reviews"], painPoints: ["Missing context", "Manual reminders"] },
    { id: "persona-ops", name: "Operations Administrator", role: "Owns queues and policy", goals: ["Meet SLAs", "Audit decisions", "Balance workload"], painPoints: ["No reliable reporting", "Inconsistent routing"] },
  ],
  "Mobile App": [
    { id: "persona-user", name: "Everyday User", role: "Uses the app frequently", goals: ["Reach value in seconds", "Stay in control of notifications"], painPoints: ["Slow onboarding", "Unreliable connectivity"] },
    { id: "persona-power", name: "Power User", role: "Uses advanced workflows", goals: ["Save time with shortcuts", "Share content"], painPoints: ["Repeated manual steps"] },
    { id: "persona-support", name: "Support Agent", role: "Helps users recover", goals: ["Diagnose quickly", "Resolve account issues"], painPoints: ["Limited account context"] },
  ],
  "E-commerce": [
    { id: "persona-shopper", name: "Shopper", role: "Finds and buys products", goals: ["Find the right product", "Check out without friction", "Track the order"], painPoints: ["Poor search", "Unclear delivery time"] },
    { id: "persona-store-operator", name: "Store Operator", role: "Manages catalog and orders", goals: ["Keep inventory accurate", "Fulfill orders on time"], painPoints: ["Manual stock updates", "Order exceptions"] },
    { id: "persona-support", name: "Support Agent", role: "Resolves customer issues", goals: ["See order context", "Resolve refunds quickly"], painPoints: ["Fragmented tools"] },
  ],
  "Developer Tool": [
    { id: "persona-developer", name: "Developer", role: "Integrates and operates the API", goals: ["Reach first successful call", "Debug failures quickly"], painPoints: ["Unclear errors", "Slow setup"] },
    { id: "persona-lead", name: "Engineering Lead", role: "Owns team usage and reliability", goals: ["See usage and errors", "Control access"], painPoints: ["No usage visibility"] },
    { id: "persona-platform", name: "Platform Administrator", role: "Manages security and billing", goals: ["Rotate keys", "Control spend"], painPoints: ["Manual key management"] },
  ],
  Fintech: [
    { id: "persona-customer", name: "Customer", role: "Moves and manages money", goals: ["See a clear balance", "Complete transfers safely"], painPoints: ["Unclear fees", "Slow verification"] },
    { id: "persona-compliance", name: "Compliance Analyst", role: "Reviews risk and cases", goals: ["Resolve alerts", "Keep an audit trail"], painPoints: ["Too many false positives"] },
    { id: "persona-ops", name: "Operations Administrator", role: "Runs account operations", goals: ["Resolve exceptions", "Meet service levels"], painPoints: ["Manual reconciliation"] },
  ],
  Healthcare: [
    { id: "persona-clinician", name: "Clinician", role: "Provides patient care", goals: ["See the full patient context", "Document efficiently"], painPoints: ["Fragmented records", "Repetitive data entry"] },
    { id: "persona-patient", name: "Patient", role: "Receives care", goals: ["Book appointments", "Understand next steps"], painPoints: ["Unclear scheduling", "Hard-to-find records"] },
    { id: "persona-admin", name: "Practice Administrator", role: "Owns access and compliance", goals: ["Control access", "Audit record views"], painPoints: ["Manual access reviews"] },
  ],
  Education: [
    { id: "persona-learner", name: "Learner", role: "Completes courses", goals: ["Know the next lesson", "Track progress"], painPoints: ["Unclear deadlines", "Slow feedback"] },
    { id: "persona-instructor", name: "Instructor", role: "Teaches and grades", goals: ["See cohort progress", "Give timely feedback"], painPoints: ["Manual grading", "At-risk learners go unnoticed"] },
    { id: "persona-admin", name: "Program Administrator", role: "Runs the program", goals: ["Manage enrollment", "Report completion"], painPoints: ["Fragmented reporting"] },
  ],
  Logistics: [
    { id: "persona-dispatcher", name: "Dispatcher", role: "Plans routes and exceptions", goals: ["Meet delivery windows", "Resolve exceptions quickly"], painPoints: ["Manual route changes", "No live visibility"] },
    { id: "persona-driver", name: "Driver", role: "Completes deliveries", goals: ["See the next stop", "Capture proof of delivery"], painPoints: ["Unclear instructions", "Poor connectivity"] },
    { id: "persona-customer", name: "Customer", role: "Receives a shipment", goals: ["Know when it arrives", "Resolve a failed delivery"], painPoints: ["Stale tracking", "No exception reason"] },
  ],
};

const DEFAULT_PERSONAS: Persona[] = [
  { id: "persona-primary", name: "Primary User", role: "Completes the core workflow", goals: ["Finish the main job quickly", "Understand what to do next"], painPoints: ["Manual coordination", "Unclear status"] },
  { id: "persona-admin", name: "Administrator", role: "Owns access and configuration", goals: ["Control access", "Keep data reliable", "Audit changes"], painPoints: ["Fragmented controls", "No audit trail"] },
  { id: "persona-stakeholder", name: "Business Stakeholder", role: "Measures outcomes", goals: ["See adoption", "Measure quality", "Prioritize investment"], painPoints: ["Stale reporting", "No single source of truth"] },
];

const ENTITY_CATALOG: Record<string, { name: string; description: string; fields: [string, string, string][] }[]> = {
  "Mobile App": [
    { name: "UserProfile", description: "The signed-in person and their preferences.", fields: [["displayName", "string", "Public display name"], ["email", "string", "Account email"], ["preferences", "jsonb", "Notification and privacy settings"]] },
    { name: "ContentItem", description: "The primary item shown and acted on in the app.", fields: [["title", "string", "Item title"], ["ownerId", "uuid", "Creator or owner"], ["status", "enum", "draft, published, archived"]] },
    { name: "Notification", description: "An opt-in message delivered to a user.", fields: [["userId", "uuid", "Recipient"], ["channel", "enum", "push, in_app, email"], ["status", "enum", "queued, sent, read"]] },
    { name: "DeviceSession", description: "A signed-in device with push capability.", fields: [["userId", "uuid", "Owner"], ["platform", "enum", "ios, android"], ["lastSeenAt", "timestamp", "Last activity"]] },
  ],
  Fintech: [
    { name: "Account", description: "A customer account and its risk state.", fields: [["customerId", "uuid", "Verified customer"], ["status", "enum", "pending, active, frozen"], ["currency", "string", "ISO currency code"]] },
    { name: "Transaction", description: "An immutable ledger entry.", fields: [["accountId", "uuid", "Owning account"], ["amount", "decimal", "Signed amount"], ["reference", "string", "Idempotency reference"], ["status", "enum", "pending, posted, reversed"]] },
    { name: "Transfer", description: "A requested movement of funds with review state.", fields: [["sourceAccountId", "uuid", "Debit account"], ["destination", "string", "Recipient reference"], ["amount", "decimal", "Transfer amount"], ["status", "enum", "draft, review, sent, failed"]] },
    { name: "ComplianceCase", description: "A case created by fraud or sanctions screening.", fields: [["subjectId", "uuid", "Customer or transfer"], ["reason", "string", "Trigger"], ["status", "enum", "open, resolved, escalated"]] },
  ],
  Healthcare: [
    { name: "Patient", description: "A person receiving care.", fields: [["name", "string", "Legal name"], ["dateOfBirth", "date", "Date of birth"], ["careTeamId", "uuid", "Assigned care team"]] },
    { name: "Appointment", description: "A scheduled encounter with a clinician.", fields: [["patientId", "uuid", "Patient"], ["clinicianId", "uuid", "Clinician"], ["startsAt", "timestamp", "Start time"], ["status", "enum", "scheduled, completed, cancelled"]] },
    { name: "ClinicalNote", description: "A timestamped clinical record with amendments.", fields: [["patientId", "uuid", "Patient"], ["authorId", "uuid", "Clinician"], ["body", "text", "Note body"], ["amendedFromId", "uuid", "Prior version"]] },
    { name: "Consent", description: "A patient's scoped consent decision.", fields: [["patientId", "uuid", "Patient"], ["scope", "string", "Consent scope"], ["status", "enum", "granted, revoked"], ["expiresAt", "timestamp", "Expiry"]] },
  ],
  Education: [
    { name: "Course", description: "A structured learning offering.", fields: [["title", "string", "Course title"], ["instructorId", "uuid", "Owner"], ["status", "enum", "draft, published, archived"]] },
    { name: "Enrollment", description: "A learner's access to a course.", fields: [["courseId", "uuid", "Course"], ["learnerId", "uuid", "Learner"], ["status", "enum", "active, completed, revoked"]] },
    { name: "Assignment", description: "A graded task within a course.", fields: [["courseId", "uuid", "Course"], ["dueAt", "timestamp", "Due date"], ["rubric", "jsonb", "Grading rubric"]] },
    { name: "Submission", description: "A learner's response to an assignment.", fields: [["assignmentId", "uuid", "Assignment"], ["learnerId", "uuid", "Learner"], ["score", "decimal", "Released score"], ["status", "enum", "draft, submitted, graded"]] },
  ],
  Logistics: [
    { name: "Shipment", description: "A package moving through the network.", fields: [["trackingNumber", "string", "Public reference"], ["serviceLevel", "string", "Service level"], ["status", "enum", "created, in_transit, delivered, exception"]] },
    { name: "Route", description: "An ordered set of stops assigned to a vehicle.", fields: [["date", "date", "Service date"], ["driverId", "uuid", "Assigned driver"], ["status", "enum", "planned, active, complete"]] },
    { name: "Driver", description: "A person and vehicle available for routes.", fields: [["name", "string", "Driver name"], ["vehicle", "string", "Vehicle identifier"], ["status", "enum", "available, on_route, off_duty"]] },
    { name: "TrackingEvent", description: "An immutable scan or status change.", fields: [["shipmentId", "uuid", "Shipment"], ["type", "string", "Event type"], ["occurredAt", "timestamp", "Event time"], ["location", "string", "Scan location"]] },
  ],
  CRM: [
    { name: "Contact", description: "A person tracked by the sales team.", fields: [["firstName", "string", "Given name"], ["lastName", "string", "Family name"], ["email", "string", "Unique business email"], ["ownerId", "uuid", "Assigned sales rep"], ["lifecycleStage", "enum", "lead, qualified, customer"]] },
    { name: "Company", description: "An organization associated with contacts and deals.", fields: [["name", "string", "Legal or trading name"], ["industry", "string", "Optional industry"], ["ownerId", "uuid", "Account owner"], ["size", "string", "Employee band"]] },
    { name: "Deal", description: "A revenue opportunity moving through a pipeline.", fields: [["title", "string", "Opportunity name"], ["value", "decimal", "Expected contract value"], ["stageId", "uuid", "Current pipeline stage"], ["closeDate", "date", "Expected close date"]] },
    { name: "Activity", description: "A call, email, meeting, or note linked to a record.", fields: [["type", "enum", "call, email, meeting, note"], ["subject", "string", "Short summary"], ["occurredAt", "timestamp", "When it happened"], ["actorId", "uuid", "Who recorded it"]] },
    { name: "Task", description: "A follow-up that must be completed.", fields: [["title", "string", "Task title"], ["dueAt", "timestamp", "Due date"], ["assigneeId", "uuid", "Owner"], ["status", "enum", "open, done, cancelled"]] },
  ],
  Marketplace: [
    { name: "User", description: "A buyer, seller, or operator account.", fields: [["email", "string", "Unique sign-in email"], ["role", "enum", "buyer, seller, admin"], ["status", "enum", "active, suspended"]] },
    { name: "Listing", description: "A sellable item published by a seller.", fields: [["title", "string", "Listing title"], ["price", "decimal", "Display price"], ["sellerId", "uuid", "Owning seller"], ["status", "enum", "draft, active, paused"]] },
    { name: "Order", description: "A purchase and its fulfillment state.", fields: [["buyerId", "uuid", "Purchasing user"], ["total", "decimal", "Order total"], ["status", "enum", "pending, paid, shipped, complete"], ["placedAt", "timestamp", "Creation time"]] },
    { name: "Payment", description: "A payment attempt and reconciliation record.", fields: [["orderId", "uuid", "Related order"], ["providerRef", "string", "Payment provider reference"], ["amount", "decimal", "Captured amount"], ["status", "enum", "authorized, captured, refunded"]] },
    { name: "Review", description: "Verified feedback after a completed order.", fields: [["orderId", "uuid", "Verified order"], ["rating", "integer", "1 to 5"], ["body", "text", "Review text"], ["status", "enum", "published, flagged"]] },
  ],
  "SaaS Platform": [
    { name: "Workspace", description: "The tenant boundary for members and data.", fields: [["name", "string", "Workspace name"], ["plan", "string", "Subscription plan"], ["ownerId", "uuid", "Workspace owner"]] },
    { name: "Member", description: "A user's membership in a workspace.", fields: [["userId", "uuid", "Authenticated user"], ["role", "enum", "owner, admin, member"], ["status", "enum", "invited, active, removed"]] },
    { name: "Record", description: "The primary object managed in the workspace.", fields: [["title", "string", "Record title"], ["status", "enum", "draft, active, archived"], ["ownerId", "uuid", "Responsible member"]] },
    { name: "Comment", description: "A discussion entry attached to a record.", fields: [["recordId", "uuid", "Related record"], ["authorId", "uuid", "Member"], ["body", "text", "Comment text"]] },
    { name: "AuditEvent", description: "An immutable security or administrative event.", fields: [["actorId", "uuid", "Who acted"], ["action", "string", "Event type"], ["target", "string", "Affected resource"], ["createdAt", "timestamp", "Event time"]] },
  ],
  "Internal Tool": [
    { name: "Request", description: "A structured ask submitted by a requester.", fields: [["title", "string", "Request summary"], ["requesterId", "uuid", "Requester"], ["status", "enum", "submitted, in_review, approved, rejected"], ["priority", "enum", "low, normal, high"]] },
    { name: "Approval", description: "A decision step attached to a request.", fields: [["requestId", "uuid", "Related request"], ["approverId", "uuid", "Assigned approver"], ["decision", "enum", "pending, approved, rejected"], ["reason", "text", "Optional rationale"]] },
    { name: "Queue", description: "A routing destination with ownership and SLA.", fields: [["name", "string", "Queue name"], ["ownerId", "uuid", "Queue owner"], ["slaHours", "integer", "Target response hours"]] },
    { name: "AuditEvent", description: "A state transition or administrative action.", fields: [["actorId", "uuid", "Actor"], ["action", "string", "Event type"], ["requestId", "uuid", "Affected request"]] },
  ],
  Generic: [
    { name: "User", description: "An authenticated person using the product.", fields: [["email", "string", "Unique email"], ["name", "string", "Display name"], ["role", "enum", "admin, member"], ["status", "enum", "active, disabled"]] },
    { name: "Record", description: "The primary object managed by the product.", fields: [["title", "string", "Record title"], ["status", "enum", "draft, active, archived"], ["ownerId", "uuid", "Responsible user"]] },
    { name: "Activity", description: "An event or action related to a record.", fields: [["recordId", "uuid", "Related record"], ["actorId", "uuid", "Actor"], ["action", "string", "Event type"], ["createdAt", "timestamp", "Event time"]] },
    { name: "Notification", description: "A user-facing message about a relevant event.", fields: [["userId", "uuid", "Recipient"], ["channel", "enum", "in_app, email"], ["status", "enum", "queued, sent, read"]] },
    { name: "AuditEvent", description: "An immutable security or administrative event.", fields: [["actorId", "uuid", "Actor"], ["action", "string", "Event type"], ["target", "string", "Affected resource"]] },
  ],
};

function catalogFor(productType: string): FeatureSpec[] {
  const direct = FEATURE_CATALOG[productType];
  if (direct) return direct;
  if (productType === "E-commerce") return FEATURE_CATALOG.Marketplace;
  if (productType === "Developer Tool") return FEATURE_CATALOG["SaaS Platform"];
  if (productType === "Fintech") return FEATURE_CATALOG.Fintech;
  if (productType === "Healthcare") return FEATURE_CATALOG.Healthcare;
  if (productType === "Education") return FEATURE_CATALOG.Education;
  if (productType === "Logistics") return FEATURE_CATALOG.Logistics;
  if (productType === "Mobile App") return FEATURE_CATALOG["Mobile App"];
  return FEATURE_CATALOG.Generic;
}

function personasFor(productType: string): Persona[] {
  return PERSONA_CATALOG[productType] ?? DEFAULT_PERSONAS;
}

function entitiesFor(productType: string): DataEntity[] {
  const catalog =
    ENTITY_CATALOG[productType] ??
    (productType === "E-commerce"
      ? ENTITY_CATALOG.Marketplace
      : productType === "Developer Tool"
        ? ENTITY_CATALOG["SaaS Platform"]
        : ENTITY_CATALOG.Generic);
  return catalog.map((entity) => ({
    name: entity.name,
    description: entity.description,
    fields: entity.fields.map(([name, type, notes]) => ({
      name,
      type,
      required: true,
      notes,
    })),
    relationships: [],
  }));
}

function answerMap(answers: InterviewAnswer[]): Partial<Record<CoverageDimension, InterviewAnswer>> {
  const map: Partial<Record<CoverageDimension, InterviewAnswer>> = {};
  for (const answer of answers) {
    if (answer.answer.trim() || answer.assumed) {
      map[answer.dimension] = answer;
    }
  }
  return map;
}

function answerText(
  answers: Partial<Record<CoverageDimension, InterviewAnswer>>,
  dimension: CoverageDimension,
): string {
  return answers[dimension]?.answer?.trim() ?? "";
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function splitList(value: string, fallback: string[]): string[] {
  if (!value.trim()) return fallback;
  return value
    .split(/\n|;|,(?=\s)/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

function priorityFor(index: number): Priority {
  if (index < 6) return "must";
  if (index < 8) return "should";
  return "could";
}

function requirementId(index: number): string {
  return `FR-${String(index + 1).padStart(3, "0")}`;
}

function buildRequirements(features: FeatureSpec[], databaseLabel: string): Requirement[] {
  return features.map((feature, index) => ({
    id: requirementId(index),
    title: feature.title,
    description: feature.description,
    priority: priorityFor(index),
    acceptanceCriteria: [
      `A permitted user can complete the "${feature.title}" workflow and receives a clear success confirmation.`,
      `Invalid input is rejected with field-level errors and no partial record is persisted.`,
      `Saved changes use ${databaseLabel} as the source of truth and remain correct after reload.`,
      `A user without the required role receives a 403 response and sees no restricted data.`,
    ],
    edgeCases: [
      "Duplicate submission is prevented by an idempotency key or unique constraint.",
      "The empty, loading, error, and permission-denied states are represented in the UI.",
    ],
    source: "interview" as const,
    flowNodeIds: [],
    status: "draft" as const,
  }));
}

function buildNFRs(): NFR[] {
  return [
    {
      id: "NFR-001",
      category: "security",
      title: "Role-based access control",
      requirement:
        "Every server action and API route must enforce authorization using the authenticated user's role and resource ownership.",
      target: "No unauthorized read or write path; deny-by-default policy.",
      priority: "must",
    },
    {
      id: "NFR-002",
      category: "performance",
      title: "Core interaction latency",
      requirement:
        "Core list and detail reads should remain responsive under normal local load, with visible loading states for slower operations.",
      target: "p95 server response under 300 ms for indexed reads; LCP under 2.5 s on a mid-range laptop.",
      priority: "must",
    },
    {
      id: "NFR-003",
      category: "reliability",
      title: "Failure handling and recovery",
      requirement:
        "The application must fail gracefully, preserve user input where safe, and expose actionable errors without leaking internals.",
      target: "No silent data loss; failed writes are retryable and observable.",
      priority: "must",
    },
    {
      id: "NFR-004",
      category: "accessibility",
      title: "Accessible interface",
      requirement:
        "The primary workflows must be keyboard operable, use semantic controls, and expose accessible names and error associations.",
      target: "WCAG 2.1 AA for the core workflow.",
      priority: "should",
    },
    {
      id: "NFR-005",
      category: "privacy",
      title: "Data lifecycle controls",
      requirement:
        "Users must be able to export their data and request deletion according to the documented retention policy.",
      target: "Export available in a common format; deletion verified within the documented window.",
      priority: "should",
    },
    {
      id: "NFR-006",
      category: "observability",
      title: "Operational visibility",
      requirement:
        "Emit structured logs for authentication, authorization, failed writes, and background work, with correlation identifiers.",
      target: "Every failed request can be traced end to end without logging secrets.",
      priority: "must",
    },
    {
      id: "NFR-007",
      category: "scalability",
      title: "Predictable data growth",
      requirement:
        "List endpoints must paginate, filter on indexed fields, and avoid unbounded queries.",
      target: "Stable response time with 100k primary records per workspace.",
      priority: "should",
    },
  ];
}

function buildApiEndpoints(primary: string, secondary: string): ApiEndpoint[] {
  const resource = slugify(primary);
  const second = slugify(secondary);
  return [
    { method: "GET", path: `/api/v1/${resource}`, purpose: `List and filter ${primary} records.`, auth: "Required; scoped by role and ownership.", request: "Query: page, pageSize, search, status, sort.", response: "Paginated records plus total count." },
    { method: "POST", path: `/api/v1/${resource}`, purpose: `Create a ${primary} record.`, auth: "Required; write permission.", request: "Validated JSON payload.", response: "201 with the created record and audit reference." },
    { method: "GET", path: `/api/v1/${resource}/:id`, purpose: `Read a single ${primary} record.`, auth: "Required; read permission.", request: "Path parameter id.", response: "Record detail or 404." },
    { method: "PATCH", path: `/api/v1/${resource}/:id`, purpose: `Update a ${primary} record with optimistic concurrency.`, auth: "Required; write permission.", request: "Partial payload plus version or updatedAt.", response: "Updated record or 409 on conflict." },
    { method: "POST", path: `/api/v1/${second}`, purpose: `Create or act on a ${secondary}.`, auth: "Required; scoped permission.", request: "Validated domain payload.", response: "201 with the resulting state." },
    { method: "GET", path: "/api/v1/reports/summary", purpose: "Return dashboard metrics for the current workspace.", auth: "Required; manager or admin role.", request: "Query: date range and grouping.", response: "Aggregated metrics with definition metadata." },
    { method: "GET", path: "/api/v1/audit-events", purpose: "List security and administrative events.", auth: "Required; admin role.", request: "Query: actor, action, date range, cursor.", response: "Paginated immutable events." },
    { method: "POST", path: "/api/v1/import", purpose: "Validate and import a supported file.", auth: "Required; import permission.", request: "Multipart file plus mapping options.", response: "Job reference, accepted rows, and row-level errors." },
  ];
}

function wireframeBlock(
  type: WireframeBlockType,
  title: string,
  items: string[],
): WireframeBlock {
  return { id: `block-${type}-${Math.random().toString(36).slice(2, 7)}`, type, title, items };
}

function buildWireframes(features: FeatureSpec[], entities: DataEntity[]): {
  dashboard: Wireframe;
  list: Wireframe;
  form: Wireframe;
  detail: Wireframe;
  settings: Wireframe;
} {
  const primary = features[0]?.title ?? "Records";
  const entity = entities[0]?.name ?? "Record";
  return {
    dashboard: {
      layout: "dashboard",
      title: "Operations dashboard",
      description: `Role-aware overview of ${primary.toLowerCase()} with the most important actions and alerts.`,
      blocks: [
        wireframeBlock("sidebar", "Navigation", ["Overview", primary, "Reports", "Settings"]),
        wireframeBlock("header", "Workspace header", ["Search", "Notifications", "New record"]),
        wireframeBlock("stats", "Key metrics", ["Active records", "Open tasks", "Completion rate", "Errors"]),
        wireframeBlock("chart", "Activity trend", ["Last 14 days", "Created", "Completed"]),
        wireframeBlock("table", "Recent items", ["Name", "Owner", "Status", "Updated"]),
      ],
    },
    list: {
      layout: "table",
      title: primary,
      description: `Searchable, filterable list of ${entity.toLowerCase()} records with saved views.`,
      blocks: [
        wireframeBlock("sidebar", "Navigation", ["Overview", primary, "Reports", "Settings"]),
        wireframeBlock("header", "List toolbar", ["Search", "Status filter", "Owner filter"]),
        wireframeBlock("actions", "Primary actions", ["New", "Import", "Export"]),
        wireframeBlock("table", entity, ["Name", "Owner", "Status", "Priority", "Updated"]),
      ],
    },
    form: {
      layout: "form",
      title: `Create ${entity}`,
      description: `Validated creation form for ${primary.toLowerCase()} with inline errors and a safe cancel path.`,
      blocks: [
        wireframeBlock("header", "Form header", ["Back", `Create ${entity}`]),
        wireframeBlock("form", "Required fields", entities[0]?.fields.slice(0, 5).map((field) => field.name) ?? ["Name", "Owner", "Status"]),
        wireframeBlock("form", "Optional details", ["Notes", "Tags", "Attachments"]),
        wireframeBlock("actions", "Form actions", ["Cancel", "Save draft", "Create"]),
      ],
    },
    detail: {
      layout: "detail",
      title: `${entity} detail`,
      description: `Single-record view with status, ownership, activity, and next actions.`,
      blocks: [
        wireframeBlock("sidebar", "Record navigation", ["Overview", "Activity", "Tasks", "Files"]),
        wireframeBlock("header", "Record header", ["Breadcrumb", "Status", "Owner"]),
        wireframeBlock("detail", "Summary", ["Description", "Priority", "Due date", "Last updated"]),
        wireframeBlock("list", "Activity", ["Created", "Status changed", "Comment added"]),
        wireframeBlock("actions", "Actions", ["Edit", "Assign", "Archive"]),
      ],
    },
    settings: {
      layout: "settings",
      title: "Workspace settings",
      description: "Administrative settings for profile, notifications, roles, and integrations.",
      blocks: [
        wireframeBlock("sidebar", "Settings navigation", ["Profile", "Notifications", "Roles", "Integrations"]),
        wireframeBlock("header", "Settings header", ["Workspace settings"]),
        wireframeBlock("form", "Settings form", ["Display name", "Timezone", "Notification preference"]),
        wireframeBlock("actions", "Save actions", ["Cancel", "Save changes"]),
      ],
    },
  };
}

function buildFlow(
  features: FeatureSpec[],
  personas: Persona[],
  wireframes: ReturnType<typeof buildWireframes>,
  primaryEntity?: string,
  databaseLabel = "PostgreSQL",
): ProductFlow {
  const primary = personas[0]?.name ?? "Primary User";
  const admin = personas[1]?.name ?? "Administrator";
  const requirement = (index: number) => [requirementId(index)];
  const entityLabel = primaryEntity ?? features[0]?.title ?? "record";

  const nodes: FlowNode[] = [
    { id: "node-actor", kind: "actor", label: primary, description: "Starts the core workflow and owns the outcome.", x: 0, y: 180, requirementIds: [] },
    { id: "node-dashboard", kind: "screen", label: "Dashboard", description: "Landing screen with metrics, recent records, and primary actions.", x: 260, y: 40, requirementIds: requirement(0), wireframe: wireframes.dashboard },
    { id: "node-list", kind: "screen", label: features[0]?.title ?? "Records", description: "Searchable list with filters and saved views.", x: 260, y: 340, requirementIds: requirement(0), wireframe: wireframes.list },
    { id: "node-form", kind: "screen", label: `Create ${entityLabel}`, description: "Validated creation form with inline error handling.", x: 560, y: 340, requirementIds: requirement(0), wireframe: wireframes.form },
    { id: "node-decision", kind: "decision", label: "Input valid?", description: "Validate required fields, permissions, and duplicate constraints.", x: 560, y: 40, requirementIds: requirement(0) },
    { id: "node-api", kind: "system", label: "Application API", description: "Authorizes the request, applies validation, and persists changes.", x: 860, y: 40, requirementIds: requirement(0) },
    { id: "node-db", kind: "data", label: databaseLabel, description: `${databaseLabel} system of record with migrations, constraints, and audit history.`, x: 1160, y: 40, requirementIds: [] },
    { id: "node-detail", kind: "screen", label: "Record detail", description: "Read-only and editable detail view with activity and next actions.", x: 860, y: 340, requirementIds: requirement(1), wireframe: wireframes.detail },
    { id: "node-admin", kind: "actor", label: admin, description: "Configures roles, integrations, and workspace settings.", x: 0, y: 620, requirementIds: [] },
    { id: "node-settings", kind: "screen", label: "Workspace settings", description: "Administrative settings for access, notifications, and integrations.", x: 260, y: 620, requirementIds: requirement(6), wireframe: wireframes.settings },
    { id: "node-integration", kind: "integration", label: "Notification provider", description: "Sends transactional email or in-app notifications.", x: 860, y: 620, requirementIds: requirement(4) },
  ];

  const edges: FlowEdge[] = [
    { id: "edge-1", source: "node-actor", target: "node-dashboard", label: "signs in", kind: "default" },
    { id: "edge-2", source: "node-dashboard", target: "node-list", label: "opens list", kind: "default" },
    { id: "edge-3", source: "node-list", target: "node-form", label: "creates record", kind: "default" },
    { id: "edge-4", source: "node-form", target: "node-decision", label: "submits", kind: "default" },
    { id: "edge-5", source: "node-decision", target: "node-api", label: "valid", kind: "success" },
    { id: "edge-6", source: "node-decision", target: "node-form", label: "invalid", kind: "failure" },
    { id: "edge-7", source: "node-api", target: "node-db", label: "persists", kind: "default" },
    { id: "edge-8", source: "node-api", target: "node-detail", label: "returns record", kind: "success" },
    { id: "edge-9", source: "node-detail", target: "node-dashboard", label: "returns", kind: "default" },
    { id: "edge-10", source: "node-admin", target: "node-settings", label: "configures", kind: "default" },
    { id: "edge-11", source: "node-settings", target: "node-integration", label: "enables", kind: "default" },
    { id: "edge-12", source: "node-api", target: "node-integration", label: "emits event", kind: "default" },
  ];

  return { nodes, edges };
}

function agentPrompt(task: Task, prdTitle: string, tech: ResolvedTechStack): string {
  return [
    `You are implementing ${task.id}: ${task.title} for "${prdTitle}".`,
    "",
    "Before writing code, read PRD.md, ARCHITECTURE.md, TASKS.md, and AGENTS.md in the project bundle.",
    `Selected stack: ${tech.name}. Database: ${tech.database}. Follow the architecture and stack constraints in the bundle.`,
    `Requirement links: ${task.requirementIds.join(", ") || "foundation work"}.`,
    "",
    "Scope:",
    task.description,
    "",
    "Implementation steps:",
    ...task.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Acceptance criteria:",
    ...task.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "Verification:",
    ...task.testPlan.map((item) => `- ${item}`),
    "",
    "Constraints:",
    "- Follow the existing repository conventions and do not introduce unrelated dependencies.",
    "- Do not expand scope beyond this task and its linked requirements.",
    "- Keep secrets out of source code and logs.",
    "- Run the repository's documented test, lint, and typecheck commands before reporting completion.",
    "- Report files changed, commands run, results, and any remaining risk.",
  ].join("\n");
}

function buildTasks(
  features: FeatureSpec[],
  requirements: Requirement[],
  project: ProjectBrief,
  tech: ResolvedTechStack,
): Task[] {
  const title = project.name;
  const foundation: Task[] = [
    {
      id: "TASK-001",
      epicId: "EPIC-00",
      epicTitle: "Foundation",
      title: "Set up repository, environment, and delivery pipeline",
      type: "infra",
      priority: "must",
      description: "Create the application skeleton, environment configuration, database connection, formatting, linting, and CI checks.",
      context: "This task establishes a repeatable local and CI baseline before feature work begins.",
      requirementIds: [],
      steps: [
        "Create or confirm the application structure and package scripts.",
        "Add environment validation without committing secrets.",
        "Configure formatting, linting, type checking, and tests.",
        "Add a CI workflow that runs the documented checks.",
      ],
      acceptanceCriteria: [
        "A new developer can start the app from the README.",
        "CI runs lint, typecheck, unit tests, and build.",
        "No secret is committed or logged.",
      ],
      testPlan: ["Run the documented install and start commands.", "Run CI checks locally."],
      dependencies: [],
      definitionOfDone: ["Checks pass locally and in CI.", "Setup instructions are documented."],
      agentPrompt: "",
      estimate: "M",
      milestoneId: "M1",
      status: "todo",
    },
    {
      id: "TASK-002",
      epicId: "EPIC-00",
      epicTitle: "Foundation",
      title: "Define database schema, migrations, and seed data",
      type: "migration",
      priority: "must",
      description: "Implement the core entities, constraints, indexes, and a minimal development seed.",
      context: "The schema must support the requirements while preserving clear ownership and auditability.",
      requirementIds: [],
      steps: [
        "Translate the data model into versioned migrations.",
        "Add unique constraints, foreign keys, and indexes for documented query paths.",
        "Create a repeatable seed for local development.",
        "Document rollback and reset procedures.",
      ],
      acceptanceCriteria: [
        "Migrations run from an empty database.",
        "Constraints prevent duplicate and orphaned records.",
        "Seed data is deterministic and safe for development.",
      ],
      testPlan: ["Run migrations on an empty database.", "Run schema-focused integration tests."],
      dependencies: ["TASK-001"],
      definitionOfDone: ["Migration and rollback paths are documented.", "Schema tests pass."],
      agentPrompt: "",
      estimate: "M",
      milestoneId: "M1",
      status: "todo",
    },
    {
      id: "TASK-003",
      epicId: "EPIC-00",
      epicTitle: "Foundation",
      title: "Implement authentication, authorization, and workspace access",
      type: "feature",
      priority: "must",
      description: "Add secure sign-in, session handling, role checks, and a deny-by-default authorization layer.",
      context: "Every protected route and server action must rely on the same authorization policy.",
      requirementIds: [],
      steps: [
        "Choose the authentication approach and configure required secrets.",
        "Implement session handling and protected route boundaries.",
        "Add role and ownership checks to server operations.",
        "Add tests for allowed and denied access paths.",
      ],
      acceptanceCriteria: [
        "Unauthenticated users cannot access protected data.",
        "Role checks are enforced server-side.",
        "Authorization failures return clear, non-leaky errors.",
      ],
      testPlan: ["Test allowed and denied access for each role.", "Verify sessions expire and can be revoked."],
      dependencies: ["TASK-002"],
      definitionOfDone: ["Authorization policy is documented.", "Security checks pass."],
      agentPrompt: "",
      estimate: "M",
      milestoneId: "M1",
      status: "todo",
    },
    {
      id: "TASK-004",
      epicId: "EPIC-00",
      epicTitle: "Foundation",
      title: "Build application shell, design tokens, and state patterns",
      type: "design",
      priority: "must",
      description: "Create the navigation shell, responsive layout, design tokens, and shared state patterns used by all features.",
      context: "A consistent shell reduces duplicated UI work and makes accessibility and error handling systemic.",
      requirementIds: [],
      steps: [
        "Define color, spacing, typography, and focus tokens.",
        "Build the responsive application shell and navigation.",
        "Create shared loading, empty, error, and permission-denied components.",
        "Document usage patterns for feature teams.",
      ],
      acceptanceCriteria: [
        "The shell is keyboard navigable and responsive.",
        "Shared states are reused by feature screens.",
        "Design tokens are documented and consistent.",
      ],
      testPlan: ["Keyboard navigation smoke test.", "Responsive layout check at mobile and desktop widths."],
      dependencies: ["TASK-001"],
      definitionOfDone: ["Shared components are documented.", "Accessibility smoke test passes."],
      agentPrompt: "",
      estimate: "M",
      milestoneId: "M1",
      status: "todo",
    },
  ];

  const featureTasks: Task[] = features.map((feature, index) => {
    const id = `TASK-${String(10 + index).padStart(3, "0")}`;
    const requirement = requirements[index];
    const milestone = index < 4 ? "M2" : index < 8 ? "M3" : "M3";
    const dependencies = ["TASK-003", "TASK-004"];
    if (index > 0) dependencies.push(`TASK-${String(10 + index - 1).padStart(3, "0")}`);
    return {
      id,
      epicId: `EPIC-${String(index + 1).padStart(2, "0")}`,
      epicTitle: feature.title,
      title: `Implement ${feature.title}`,
      type: "feature",
      priority: requirement.priority,
      description: feature.description,
      context: `This task delivers ${requirement.id} and must preserve the product's role, validation, and audit rules.`,
      requirementIds: [requirement.id],
      steps: [
        "Review the linked requirement, wireframe, and flow nodes.",
        "Implement the data access and API behavior with validation and authorization.",
        "Implement the UI states and connect them to the API.",
        "Add unit, integration, and end-to-end coverage for the core path.",
        "Update inline documentation and any API reference.",
      ],
      acceptanceCriteria: [...requirement.acceptanceCriteria],
      testPlan: [
        "Unit test validation and domain rules.",
        "Integration test authorization and persistence.",
        "End-to-end test the happy path and one failure path.",
      ],
      dependencies,
      definitionOfDone: [
        "Acceptance criteria are demonstrated.",
        "Tests pass and cover the failure path.",
        "No new accessibility or security regression.",
        "PRD and task status are updated.",
      ],
      agentPrompt: "",
      estimate: index < 4 ? "L" : "M",
      milestoneId: milestone,
      status: "todo",
    } satisfies Task;
  });

  const hardening: Task[] = [
    {
      id: "TASK-901",
      epicId: "EPIC-90",
      epicTitle: "Quality",
      title: "Complete end-to-end and regression test coverage",
      type: "test",
      priority: "must",
      description: "Cover the primary journeys, authorization boundaries, and critical error paths with deterministic tests.",
      context: "This task closes traceability gaps before release.",
      requirementIds: requirements.filter((item) => item.priority === "must").map((item) => item.id),
      steps: [
        "Map every must-have requirement to at least one automated test.",
        "Add end-to-end tests for the core journey and a role-denied path.",
        "Record known gaps and manual checks.",
      ],
      acceptanceCriteria: [
        "Every must-have requirement has an automated or documented manual check.",
        "The core journey passes in CI.",
        "Test data is deterministic and cleaned up.",
      ],
      testPlan: ["Run the full suite twice to detect order dependence.", "Review coverage against the traceability matrix."],
      dependencies: featureTasks.map((task) => task.id),
      definitionOfDone: ["Test report is attached to the release.", "No flaky tests remain."],
      agentPrompt: "",
      estimate: "M",
      milestoneId: "M4",
      status: "todo",
    },
    {
      id: "TASK-902",
      epicId: "EPIC-90",
      epicTitle: "Quality",
      title: "Run accessibility and performance verification",
      type: "test",
      priority: "should",
      description: "Verify keyboard access, semantic structure, responsive behavior, and core interaction latency.",
      context: "Accessibility and performance are product requirements, not post-launch polish.",
      requirementIds: ["NFR-002", "NFR-004"],
      steps: [
        "Run automated accessibility checks on primary screens.",
        "Complete a keyboard-only walkthrough.",
        "Measure core list and detail response times.",
        "Record issues and remediate blockers.",
      ],
      acceptanceCriteria: [
        "No critical accessibility violations on core screens.",
        "Core workflows are keyboard operable.",
        "Measured performance is within the documented target or has an approved exception.",
      ],
      testPlan: ["Accessibility scan.", "Keyboard walkthrough.", "Performance smoke test with seeded data."],
      dependencies: ["TASK-901"],
      definitionOfDone: ["Verification report is attached.", "Blocking issues are resolved."],
      agentPrompt: "",
      estimate: "S",
      milestoneId: "M4",
      status: "todo",
    },
    {
      id: "TASK-903",
      epicId: "EPIC-90",
      epicTitle: "Quality",
      title: "Prepare release, operations, and rollback documentation",
      type: "docs",
      priority: "must",
      description: "Document deployment, environment variables, backup and restore, monitoring, and rollback.",
      context: "Release readiness requires an operator to run and recover the system without tribal knowledge.",
      requirementIds: ["NFR-003", "NFR-006"],
      steps: [
        "Document required environment variables and secret rotation.",
        "Document backup, restore, and rollback steps.",
        "Define alerts and the first-response runbook.",
        "Record the release checklist and known limitations.",
      ],
      acceptanceCriteria: [
        "A new operator can deploy from the documentation.",
        "Backup and restore are tested.",
        "Alerts cover failed writes, authentication errors, and background job failures.",
      ],
      testPlan: ["Run the backup and restore procedure in a clean environment.", "Execute the release checklist."],
      dependencies: ["TASK-901"],
      definitionOfDone: ["Runbook is reviewed.", "Rollback path is verified."],
      agentPrompt: "",
      estimate: "S",
      milestoneId: "M4",
      status: "todo",
    },
  ];

  const tasks = [...foundation, ...featureTasks, ...hardening];
  return tasks.map((task) => ({
    ...task,
    agentPrompt: agentPrompt(task, title, tech),
  }));
}

function buildJourneys(personas: Persona[], features: FeatureSpec[]): Journey[] {
  const primary = personas[0];
  const admin = personas[1] ?? personas[0];
  return [
    {
      id: "journey-primary",
      name: `Complete ${features[0]?.title.toLowerCase() ?? "the core workflow"}`,
      persona: primary?.name ?? "Primary User",
      steps: [
        { actor: primary?.name ?? "Primary User", action: "Signs in and lands on the dashboard.", outcome: "Relevant work and next actions are visible." },
        { actor: primary?.name ?? "Primary User", action: `Opens ${features[0]?.title.toLowerCase() ?? "the core workflow"}.`, outcome: "The current state is clear and searchable." },
        { actor: primary?.name ?? "Primary User", action: "Creates or updates a record.", outcome: "Validation gives immediate, specific feedback." },
        { actor: primary?.name ?? "Primary User", action: "Completes the action and reviews the confirmation.", outcome: "The change is persisted and traceable." },
      ],
    },
    {
      id: "journey-admin",
      name: "Configure access and operational settings",
      persona: admin.name,
      steps: [
        { actor: admin.name, action: "Opens workspace settings.", outcome: "Current roles and integrations are visible." },
        { actor: admin.name, action: "Updates a role or integration.", outcome: "The change is validated before it is saved." },
        { actor: admin.name, action: "Confirms the change.", outcome: "Access and notifications behave as configured." },
        { actor: admin.name, action: "Reviews the audit log.", outcome: "The change has an actor, timestamp, and reason." },
      ],
    },
  ];
}

function buildRisks(productType: string): Risk[] {
  const domainRisk =
    productType === "Fintech" || productType === "Healthcare"
      ? "Regulatory or privacy requirements are discovered late."
      : "The first release expands beyond the validated core workflow.";
  return [
    { id: "RISK-001", title: domainRisk, likelihood: "medium", impact: "high", mitigation: "Freeze must-have scope, maintain an explicit out-of-scope list, and run a release readiness review.", owner: "Product" },
    { id: "RISK-002", title: "Core data model changes after implementation starts.", likelihood: "medium", impact: "high", mitigation: "Validate entities and constraints with a migration spike before feature work.", owner: "Engineering" },
    { id: "RISK-003", title: "Authorization gaps create cross-tenant or cross-role exposure.", likelihood: "low", impact: "high", mitigation: "Use a shared authorization layer and test allowed and denied paths.", owner: "Engineering" },
    { id: "RISK-004", title: "Adoption stalls because onboarding is unclear.", likelihood: "medium", impact: "medium", mitigation: "Instrument activation, test the first-value journey, and keep onboarding in scope.", owner: "Product" },
  ];
}

function buildMetrics(
  answers: Partial<Record<CoverageDimension, InterviewAnswer>>,
): { id: string; statement: string; metric: string; target: string }[] {
  const source = answerText(answers, "metrics");
  if (source) {
    return splitList(source, []).slice(0, 4).map((item, index) => ({
      id: `goal-metric-${index + 1}`,
      statement: ensureSentence(item),
      metric: "Defined measure",
      target: "Confirm baseline in milestone 1",
    }));
  }
  return [
    { id: "goal-metric-1", statement: "Users can complete the core workflow without assistance.", metric: "Task completion rate", target: "≥ 80% in usability testing" },
    { id: "goal-metric-2", statement: "The product removes manual coordination from the core workflow.", metric: "Median completion time", target: "40% faster than the current process" },
    { id: "goal-metric-3", statement: "The released workflow is reliable.", metric: "Failed core actions per 1,000 attempts", target: "< 5" },
  ];
}

function buildBlueprintContent(
  project: ProjectBrief,
  answersInput: InterviewAnswer[],
  features: FeatureSpec[],
  requirements: Requirement[],
  tasks: Task[],
  flow: ProductFlow,
  personas: Persona[],
  entities: DataEntity[],
  tech: ResolvedTechStack,
): PRDContent {
  const answers = answerMap(answersInput);
  const metrics = buildMetrics(answers);
  const milestones: Milestone[] = [
    { id: "M1", name: "Foundation", outcome: "A secure, testable application skeleton with the core schema and shell.", taskIds: tasks.filter((task) => task.milestoneId === "M1").map((task) => task.id) },
    { id: "M2", name: "Core workflows", outcome: "The primary journeys work end to end for the must-have requirements.", taskIds: tasks.filter((task) => task.milestoneId === "M2").map((task) => task.id) },
    { id: "M3", name: "Extended workflows", outcome: "Secondary workflows and administrative controls are usable.", taskIds: tasks.filter((task) => task.milestoneId === "M3").map((task) => task.id) },
    { id: "M4", name: "Hardening and launch", outcome: "Test coverage, accessibility, performance, and operations are release-ready.", taskIds: tasks.filter((task) => task.milestoneId === "M4").map((task) => task.id) },
  ];

  const assumptions = answersInput
    .filter((answer) => answer.assumed)
    .map((answer) => `Assumption for ${answer.dimension}: ${answer.answer || "AI proposed a default that must be confirmed."}`);

  const openQuestions = [
    ...(assumptions.length
      ? [{ id: "OQ-001", question: "Confirm the AI assumptions recorded during discovery.", owner: "Product", blocking: false, resolution: "Review before milestone M2." }]
      : []),
    { id: "OQ-002", question: "What is the baseline for the primary success metric?", owner: "Product", blocking: false, resolution: "Capture in M1 before the first usability test." },
  ];

  return {
    metadata: {
      title: `${project.name} — Product Requirements Document`,
      version: "1.0",
      status: "draft",
      date: new Date().toISOString().slice(0, 10),
      owner: "Product",
      changelog: [{ version: "1.0", date: new Date().toISOString().slice(0, 10), note: "Initial blueprint generated from discovery interview." }],
    },
    executiveSummary: `${project.name} is a ${project.productType} product designed to address a concrete operational problem: ${ensureSentence(answers.problem?.answer || project.summary)} The first release focuses on a small, testable core loop: ${features.slice(0, 3).map((feature) => feature.title).join(", ")}. The blueprint includes product requirements, a technical baseline, an execution flow, wireframes, and an ordered task plan that an AI coding agent can follow.`,
    problem: {
      statement: ensureSentence(answers.problem?.answer || project.summary),
      evidence: splitList(answers.problem?.answer || project.summary, [project.summary]),
      currentState: "The current workflow relies on manual coordination, inconsistent data entry, and limited visibility into status. This creates avoidable rework and makes it difficult to measure whether the process is improving.",
    },
    goals: {
      objectives: [
        { id: "goal-1", statement: "Deliver a complete, usable core workflow.", metric: "Task completion", target: "≥ 80% unaided completion" },
        { id: "goal-2", statement: "Reduce manual effort and handoffs.", metric: "Median completion time", target: "40% reduction from baseline" },
        { id: "goal-3", statement: "Make the workflow measurable and auditable.", metric: "Coverage of critical events", target: "100% of must-have state transitions" },
      ],
      successMetrics: metrics,
      nonGoals: splitList(answerText(answers, "scope"), [
        "Native mobile application in the first release.",
        "Advanced AI recommendations beyond the documented workflow.",
        "Marketplace or partner ecosystem features.",
      ]),
    },
    personas,
    journeys: buildJourneys(personas, features),
    scope: {
      inScope: features.slice(0, 8).map((feature) => feature.title),
      outOfScope: splitList(answerText(answers, "scope"), [
        "Native mobile application.",
        "Advanced analytics and forecasting.",
        "Third-party marketplace or partner portal.",
      ]),
      assumptions: assumptions.length ? assumptions : [`The first release follows the selected stack: ${tech.name}.`, "English is the only required interface language for the generated blueprint.", "The team can use managed infrastructure for email and payments if needed."],
      constraints: splitList(answerText(answers, "constraints"), ["Small delivery team.", "First release must ship within one quarter.", `Use ${tech.name} and the documented environment constraints.`]),
      dependencies: splitList(answerText(answers, "integrations"), [`${tech.database} for persistence.`, "An email provider for transactional notifications.", "A payment provider if paid plans are enabled."]),
    },
    functionalRequirements: requirements,
    nonFunctionalRequirements: buildNFRs(),
    ux: {
      principles: [
        "Make the next action obvious on every screen.",
        "Show system state, ownership, and recency at a glance.",
        "Prefer inline validation over delayed error summaries.",
        "Keep destructive actions reversible or explicitly confirmed.",
      ],
      states: [
        "Loading: stable layout with a clear progress indicator.",
        "Empty: explain what belongs here and offer the primary action.",
        "Error: explain what failed, preserve input, and offer a retry.",
        "Permission denied: explain the missing role without exposing data.",
        "Success: confirm the outcome and show the next action.",
      ],
      accessibility: [
        "All interactive controls are keyboard reachable and have visible focus.",
        "Form errors are associated with their fields and announced to assistive technology.",
        "Color is never the only indicator of status.",
        "Core flows meet WCAG 2.1 AA contrast and target-size guidance.",
      ],
      flows: [
        { name: "Primary workflow", steps: ["Sign in", "Open dashboard", "Start core action", "Validate", "Persist", "Confirm outcome"] },
        { name: "Administrative workflow", steps: ["Open settings", "Update access", "Validate", "Save", "Review audit event"] },
      ],
    },
    technical: {
      overview: `${tech.summary} The system uses ${tech.database} as the system of record and prioritizes a small operational surface, strong authorization boundaries, and observability.`,
      stack: [
        ...tech.stack,
        { layer: "Observability", choice: "Structured logs, metrics, and error tracking", rationale: "Trace failed writes, authorization decisions, and operational regressions." },
      ],
      dataModel: entities,
      apiEndpoints: buildApiEndpoints(features[0]?.title ?? "records", features[1]?.title ?? "activities"),
      integrations: splitList(answerText(answers, "integrations"), [
        "Transactional email provider for notifications.",
        "Identity provider if the organization requires SSO.",
        "Object storage for uploaded files.",
      ]),
      security: [
        "Deny-by-default authorization on every server operation.",
        "Secrets stored in environment variables or a secret manager, never in source.",
        "Parameterized database access and schema validation at the boundary.",
        "Rate limiting on authentication and write-heavy endpoints.",
        "Immutable audit events for administrative and security-sensitive changes.",
      ],
      deployment: `${tech.deployment} Include a documented migration step, health check, backup schedule, and rollback procedure. Secrets are injected at runtime.`,
    },
    risks: buildRisks(project.productType),
    openQuestions,
    releasePlan: milestones,
    qa: {
      strategy: "Test from the requirement outward: every must-have requirement maps to an acceptance criterion and at least one automated or documented manual check. Prioritize authorization, persistence, and failure paths over cosmetic coverage.",
      testLevels: ["Unit tests for validation and domain rules", "Integration tests for API, authorization, and persistence", "End-to-end tests for primary and denied journeys", "Accessibility smoke tests", "Performance smoke tests with seeded data"],
      exitCriteria: [
        "All must-have acceptance criteria are demonstrated.",
        "No open blocker or critical accessibility issue.",
        "Core journey passes in CI on a clean database.",
        "Backup, restore, and rollback procedures are verified.",
        "No known high-severity security issue.",
      ],
    },
    glossary: [
      { term: "Requirement", definition: "A testable product capability with a unique FR identifier." },
      { term: "Task", definition: "An execution unit with dependencies, acceptance criteria, and a Definition of Done." },
      { term: "Readiness score", definition: "A weighted measure of completeness, testability, traceability, and dependency integrity." },
      { term: "Wireframe", definition: "A low-fidelity screen structure linked to a flow node and requirement." },
    ],
  };
}

export type LocalBlueprint = {
  prd: PRDContent;
  tasks: Task[];
  flow: ProductFlow;
  tech: ResolvedTechStack;
};

export function buildLocalBlueprint(project: ProjectBrief, answers: InterviewAnswer[]): LocalBlueprint {
  const tech = resolveTechStack(project, project.productType);
  const features = catalogFor(project.productType);
  const personas = personasFor(project.productType);
  const entities = entitiesFor(project.productType);
  const requirements = buildRequirements(features, tech.database);
  const tasks = buildTasks(features, requirements, project, tech);
  const wireframes = buildWireframes(features, entities);
  const flow = buildFlow(features, personas, wireframes, entities[0]?.name, tech.database);

  for (const node of flow.nodes) {
    for (const requirement of requirements) {
      if (node.requirementIds.includes(requirement.id)) {
        requirement.flowNodeIds.push(node.id);
      }
    }
  }

  const prd = buildBlueprintContent(project, answers, features, requirements, tasks, flow, personas, entities, tech);
  return { prd, tasks, flow, tech };
}

export function updateCoverage(
  coverage: Coverage,
  answers: InterviewAnswer[],
): Coverage {
  const next = { ...coverage };
  for (const answer of answers) {
    if (answer.answer.trim() || answer.assumed) {
      next[answer.dimension] = true;
    }
  }
  return next;
}

export function coveragePercent(coverage: Coverage): number {
  const answered = ALL_COVERAGE_KEYS.filter((key) => coverage[key]).length;
  return Math.round((answered / ALL_COVERAGE_KEYS.length) * 100);
}

export function nextLocalQuestions(
  project: ProjectBrief,
  coverage: Coverage,
  round: number,
): InterviewQuestion[] {
  const remaining = ALL_COVERAGE_KEYS.filter((key) => !coverage[key]);
  if (!remaining.length) return [];
  const batchSize = 4;
  return remaining.slice(0, batchSize).map((dimension, index) =>
    getInterviewQuestion(project.productType, dimension, round * 10 + index),
  );
}

export function nextRoundAfter(
  coverage: Coverage,
  currentRound: number,
): number {
  const answered = ALL_COVERAGE_KEYS.filter((key) => coverage[key]).length;
  if (answered === 0) return currentRound;
  return Math.max(currentRound, Math.floor(answered / 4) + 1);
}

export function createEmptyCoverage(): Coverage {
  return emptyCoverage();
}

export function defaultAnswersFromBrief(project: ProjectBrief): InterviewAnswer[] {
  return [
    {
      questionId: uid("seed"),
      dimension: "problem",
      question: "What problem are we solving?",
      answer: project.summary,
      assumed: false,
    },
    {
      questionId: uid("seed"),
      dimension: "features",
      question: "What should the product do?",
      answer: catalogFor(project.productType)
        .slice(0, 6)
        .map((feature) => feature.title)
        .join(", "),
      assumed: false,
    },
    {
      questionId: uid("seed"),
      dimension: "personas",
      question: "Who is it for?",
      answer: personasFor(project.productType)
        .map((persona) => `${persona.name} (${persona.role})`)
        .join(", "),
      assumed: false,
    },
  ];
}

export function flowScreenNodeIds(flow: ProductFlow): string[] {
  return flow.nodes.filter((node) => node.kind === "screen").map((node) => node.id);
}
