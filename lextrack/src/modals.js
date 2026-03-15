import { useState, useEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Shield, ChevronDown, ChevronUp, Eye, Check, AlertTriangle, Lock, Loader2, HelpCircle } from "lucide-react";
import {
  apiLogin, apiChangePassword, apiForgotPassword, apiResetPassword,
  apiMfaSetup, apiMfaVerifySetup, apiMfaVerify, apiMfaDisable,
  apiUploadProfilePicture, apiDeleteProfilePicture,
  apiGetMsStatus, apiGetMsConfigured, apiGetMsAuthUrl, apiDisconnectMs, apiConfigureMs,
  apiGetScribeStatus, apiConnectScribe, apiDisconnectScribe,
  apiGetVoirdireStatus, apiConnectVoirdire, apiDisconnectVoirdire,
  apiGetOnlyofficeStatus,
  apiSendSupport,
} from "./api.js";
import { Avatar, Toggle, isDarkMode, STAFF_ROLES } from "./shared.js";

// ─── Help Center Modal ──────────────────────────────────────────────────────
function HelpCenterModal({ currentUser, tab, setTab, onClose, onOpenAdvocate }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState(null);
  const [supportBusy, setSupportBusy] = useState(false);

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const Accordion = ({ sectionKey, title, children, icon }) => (
    <div style={{ borderBottom: "1px solid var(--c-border)" }}>
      <div onClick={() => toggleSection(sectionKey)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", cursor: "pointer", userSelect: "none" }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{title}</span>
        <span style={{ fontSize: 12, color: "var(--c-text3)", transform: expandedSections[sectionKey] ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
      </div>
      {expandedSections[sectionKey] && (
        <div style={{ padding: "0 0 14px 22px", fontSize: 13, lineHeight: 1.7, color: "var(--c-text)" }}>
          {children}
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "tutorials", label: "Tutorials" },
    { id: "faq", label: "FAQ" },
    { id: "advocate", label: "Advocate AI" },
    { id: "changelog", label: "Change Log" },
    { id: "contact", label: "Contact" },
  ];

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setSupportBusy(true);
    setSupportStatus(null);
    try {
      await apiSendSupport({ subject: supportSubject, message: supportMessage });
      setSupportStatus("success");
      setSupportSubject("");
      setSupportMessage("");
    } catch (err) {
      setSupportStatus(err.message || "Failed to send. Please try again.");
    } finally {
      setSupportBusy(false);
    }
  };

  return (
    <div className="case-overlay" style={{ left: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
      <div className="login-box" style={{ maxWidth: 640, width: "calc(100vw - 32px)", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative", padding: "28px 32px" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", lineHeight: 1 }}>✕</button>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, color: "var(--c-text-h)", marginBottom: 4 }}>Help Center</div>
        <div style={{ fontSize: 12, color: "var(--c-text3)", marginBottom: 16 }}>Guides, answers, and support for MattrMindr</div>
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--c-border)", marginBottom: 16, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" }}>
          {tabs.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 600 : 400, marginBottom: -2, transition: "all 0.15s", userSelect: "none", whiteSpace: "nowrap", flexShrink: 0 }} className={tab === t.id ? "text-slate-900 dark:text-slate-100 border-b-2 border-b-slate-900 dark:border-b-slate-100" : "text-slate-400 dark:text-slate-500 border-b-2 border-b-transparent"}>{t.label}</div>
          ))}
        </div>
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
          {tab === "tutorials" && <HelpTutorials Accordion={Accordion} />}
          {tab === "faq" && <HelpFAQ Accordion={Accordion} />}
          {tab === "advocate" && (
            <div>
              <div style={{ textAlign: "center", padding: "24px 16px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 8 }}>Advocate AI</div>
                <div style={{ fontSize: 13, color: "var(--c-text)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto", marginBottom: 20 }}>
                  Your AI-powered legal assistant. Advocate AI is context-aware and can help with case strategy, explain MattrMindr features, draft communications, suggest next steps, and answer questions about your cases.
                </div>
                <button onClick={() => onOpenAdvocate && onOpenAdvocate()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}>
                  <span style={{ fontSize: 18 }}>🤖</span> Open Advocate AI
                </button>
              </div>
              <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 10 }}>What can Advocate AI do?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { icon: "⚖️", title: "Case Strategy", desc: "Get strategic recommendations based on charges, evidence, and case details" },
                    { icon: "📋", title: "Task Suggestions", desc: "Receive actionable task suggestions you can add to a case with one click" },
                    { icon: "💬", title: "Draft Messages", desc: "Draft client communications, letters, and court documents" },
                    { icon: "🔍", title: "Feature Help", desc: "Ask how to use any MattrMindr feature and get step-by-step guidance" },
                    { icon: "📅", title: "Deadline Guidance", desc: "Get help with court rules, filing deadlines, and scheduling" },
                    { icon: "🧠", title: "Custom Training", desc: "Trained with your office's local rules, policies, and defense strategies" },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 12, background: "var(--c-bg2)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)", marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "var(--c-text3)", lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: "var(--c-bg2)", borderRadius: 8, border: "1px solid var(--c-border)", fontSize: 12, color: "var(--c-text)", lineHeight: 1.6 }}>
                <strong>Tip:</strong> Advocate AI is also available from the floating button in the bottom-right corner of every screen. When opened from a case, it automatically has access to all case details for context-aware assistance.
              </div>
            </div>
          )}
          {tab === "changelog" && <HelpChangeLog />}
          {tab === "contact" && (
            <div>
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", marginBottom: 4 }}>Name</div>
                  <input type="text" value={currentUser.name} readOnly style={{ width: "100%", background: "var(--c-bg)", opacity: 0.7, cursor: "default" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", marginBottom: 4 }}>Role</div>
                  <input type="text" value={currentUser.role} readOnly style={{ width: "100%", background: "var(--c-bg)", opacity: 0.7, cursor: "default" }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", marginBottom: 4 }}>Email</div>
                <input type="text" value={currentUser.email} readOnly style={{ width: "100%", background: "var(--c-bg)", opacity: 0.7, cursor: "default" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", marginBottom: 4 }}>Subject <span style={{ fontWeight: 400 }}>(optional)</span></div>
                <input type="text" placeholder="Brief summary of your issue" value={supportSubject} onChange={e => { setSupportSubject(e.target.value); setSupportStatus(null); }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", marginBottom: 4 }}>Message</div>
                <textarea placeholder="Describe your issue or suggestion..." rows={5} value={supportMessage} onChange={e => { setSupportMessage(e.target.value); setSupportStatus(null); }} style={{ width: "100%", resize: "vertical" }} />
              </div>
              {supportStatus === "success" && (
                <div style={{ fontSize: 13, color: "#2F7A5F", marginBottom: 12, padding: "8px 12px", background: "var(--c-bg)", border: "1px solid #2F7A5F", borderRadius: 6 }}>Your message has been sent to support@mattrmindr.com. We'll get back to you soon.</div>
              )}
              {supportStatus && supportStatus !== "success" && (
                <div style={{ fontSize: 13, color: "#C94C4C", marginBottom: 12 }}>{supportStatus}</div>
              )}
              <button className="btn" style={{ width: "100%", padding: 10, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }} onClick={handleSendSupport} disabled={supportBusy || !supportMessage.trim()}>
                {supportBusy ? "Sending..." : "Send to Support"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HelpTutorials({ Accordion }) {
  return (
    <div>
      <Accordion sectionKey="tut-getting-started" title="Getting Started" icon="🚀">
        <p><strong>First Login:</strong> Enter the email and temporary password provided by your administrator. You will be prompted to create a new password that meets security requirements (8+ characters, uppercase, lowercase, number, and special character).</p>
        <p><strong>Navigating the Sidebar:</strong> The left sidebar contains all major sections — Dashboard, Cases, Calendar, Tasks, Templates, Time Log, Reports, AI Center, Contacts, and Staff. Click any item to switch views. On mobile, tap the menu icon (top-left) to open the sidebar.</p>
        <p><strong>Understanding the Dashboard:</strong> Your dashboard shows personalized widgets including active case counts, upcoming deadlines, overdue tasks, and recent activity. Click "Customize" in the top-right to add, remove, or reorder widgets. Quick Notes lets you jot down thoughts and assign them to cases later.</p>
      </Accordion>
      <Accordion sectionKey="tut-cases" title="Case Management" icon="⚖️">
        <p><strong>Creating a New Case:</strong> Click "+ New Case" in the Cases view. Enter the client name, case number, case type, and assign team members. A conflict check runs automatically when you enter a client name. Fill in accident date, injury details, and jurisdiction as available.</p>
        <p><strong>Viewing & Editing Case Details:</strong> Click any case row to open the case detail overlay. The Details tab shows case info, injury & incident details, at-fault parties, experts, and parties. Click any field value to edit it inline — changes save automatically.</p>
        <p><strong>Tracking Medical Treatment:</strong> The Medical tab tracks all treatment providers, visit dates, billing totals, and treatment status. Add each provider with their type, visit dates, and billing amounts for a running total of medical specials.</p>
        <p><strong>Insurance Policies:</strong> The Insurance tab manages all insurance policies on the case — liability, UM/UIM, MedPay, PIP, and more. Track carrier details, policy limits, adjuster info, and claim numbers.</p>
        <p><strong>Damages & Negotiations:</strong> The Damages tab tracks all damage categories with documentation status. The Negotiations tab provides a timeline view of all demands, offers, and counteroffers with amounts.</p>
        <p><strong>Linked Cases:</strong> The Linked Cases tab lets you link related cases — companion cases, prior claims, appeals, or external cases from other jurisdictions. Search existing cases by number or enter external case details manually.</p>
      </Accordion>
      <Accordion sectionKey="tut-calendar" title="Calendar & Deadlines" icon="📅">
        <p><strong>Adding Deadlines:</strong> In the Calendar view, click "+ Add Deadline" or use the "Suggest" button in a case detail to let AI generate procedural deadlines. Each deadline includes a title, date, type, and optional case assignment.</p>
        <p><strong>SOL Calculator:</strong> Open the "Rules Calc" tab in Calendar to calculate statute of limitations deadlines based on jurisdiction. Select a state and case type, enter the accident date, and the calculator shows the SOL deadline.</p>
        <p><strong>Importing Calendar Feeds:</strong> In the "Feeds" tab, paste an iCal URL (from court systems, Outlook, Google Calendar, etc.) to import external events. The system auto-detects case numbers and client names in imported events. Feeds refresh each time you log in.</p>
        <p><strong>Calendar Views:</strong> Toggle between calendar grid view and list view. Use the visibility checkboxes to show/hide deadlines, tasks, court dates, and imported events. Click any day in the grid to see a detailed breakdown of that day's events.</p>
      </Accordion>
      <Accordion sectionKey="tut-tasks" title="Tasks" icon="✅">
        <p><strong>Creating Tasks:</strong> Click "+ Add Task" in the Tasks view or in a case detail. Assign a title, priority, due date, case, and team member. Tasks can be created individually or in bulk via AI suggestions.</p>
        <p><strong>AI Task Suggestions:</strong> In a case detail's Tasks section, click "Suggest Tasks" to have AI analyze the case and recommend concrete PI case tasks with priorities, assignments, and due dates. Add individual suggestions or all at once.</p>
        <p><strong>Completing Tasks:</strong> Click the checkbox next to any task to mark it complete. You'll be prompted to log time spent and optionally create a follow-up task. Completed tasks track who completed them and when.</p>
        <p><strong>Recurring Tasks:</strong> When creating a task, set a recurrence pattern (daily, weekly, biweekly, or monthly). When you complete a recurring task, a new instance is automatically created with the next due date.</p>
      </Accordion>
      <Accordion sectionKey="tut-documents" title="Documents & Filings" icon="📄">
        <p><strong>Uploading Documents:</strong> In a case detail's Documents tab, click "Upload" to attach PDF, DOCX, DOC, or TXT files. Documents are stored securely and can be downloaded, summarized, or deleted.</p>
        <p><strong>Document Types:</strong> Categorize each document by type — Medical Records, Police Report, Insurance Correspondence, Demand Letter, Settlement Agreement, Expert Report, Client Correspondence, Court Filing, Discovery, Witness Statement, Photo/Video Evidence, Bills/Invoices, Employment Records, Property Damage, and more. Click the type label inline to change it.</p>
        <p><strong>Folder Organization:</strong> Create folders within the Documents tab to organize files by category. Drag and drop documents between folders to keep everything organized.</p>
        <p><strong>Floating Document Viewer:</strong> Click a document filename or the "View" button to open it in a floating viewer window. The viewer supports PDF, Word documents, images, and text files. Multiple viewers can be open simultaneously — each one is independently draggable and resizable. Minimize viewers to chips at the bottom of the screen to save space.</p>
        <p><strong>Case Info Panel:</strong> While viewing a document, click the briefcase icon in the viewer's title bar to open a side panel showing the full case information — client details, key dates, SOL countdown, financials, liability assessment, and team assignments. This lets you reference case details without leaving the document.</p>
        <p><strong>Editing Documents:</strong> Office documents (Word, Excel, PowerPoint) can be edited directly in the viewer using ONLYOFFICE DocSpace if connected. Click the "Edit" button in the viewer title bar, make your changes, and save them back to the case.</p>
        <p><strong>Presenting Documents:</strong> Click the present button (monitor icon) in the viewer to open the document in a dedicated presentation window. Supports dark/light mode toggling and full-screen viewing.</p>
        <p><strong>Generating Documents from Templates:</strong> Go to the Templates view to create reusable document templates with placeholders (e.g., client name, case number). Generate filled documents for any case with one click. Use "AI Draft" for AI-assisted document creation.</p>
        <p><strong>Court Filings:</strong> The Filings tab in case detail manages court filings separately from general documents. Upload filings and use AI classification to auto-detect the filing type, party, date, and summary.</p>
        <p><strong>AI Document Summary:</strong> Click "Summarize" on any uploaded document or filing. AI analyzes the content and extracts key facts, timeline, people mentioned, inconsistencies, liability issues, and a case-relevant takeaway. Medical records receive specialized analysis.</p>
      </Accordion>
      <Accordion sectionKey="tut-transcripts" title="Transcripts & Scribe" icon="🎙️">
        <p><strong>Creating Transcripts:</strong> In a case detail's Documents tab, switch to the Transcripts sub-tab. Upload audio/video files (MP3, WAV, M4A, OGG, FLAC, AAC, WebM, MP4 up to 100MB) to transcribe client interviews, depositions, witness statements, and other recordings. The system automatically transcribes audio with timestamps and speaker labels.</p>
        <p><strong>Transcript Viewer:</strong> Click a transcript to open it in the floating Transcript Viewer window. The viewer shows the full transcript with speaker chips, editable segments, timestamps, and audio playback controls (play/pause, skip forward/back 5 seconds, speed adjustment). Multiple transcript viewers can be open at the same time.</p>
        <p><strong>Editing Transcripts:</strong> Click any transcript segment to edit the text inline. Click a speaker chip to rename speakers across all their segments. Use the Export button to download a formatted text transcript.</p>
        <p><strong>Folder Organization:</strong> Create folders within the Transcripts sub-tab to organize recordings by category.</p>
        <p><strong>Scribe Integration:</strong> Connect to MattrMindr Scribe from Settings for professional AI-powered transcription. Once connected, send transcripts to Scribe for enhanced processing. Check the status and import results back into your case.</p>
        <p><strong>Scribe Summaries:</strong> For Scribe-linked transcripts, click the "Summaries" button (purple) in the Transcript Viewer to fetch AI-generated summaries. Summaries highlight key topics, decisions, and action items from the recording.</p>
        <p><strong>Presenter Mode:</strong> Click the present button in the Transcript Viewer to open the transcript in a full-screen presentation window with dark/light mode toggle.</p>
      </Accordion>
      <Accordion sectionKey="tut-correspondence" title="Correspondence & SMS" icon="💬">
        <p><strong>Email Correspondence:</strong> The Correspondence tab in case detail shows all emails linked to the case (received via the office's inbound email system). View email threads, attachments, and manage correspondence history.</p>
        <p><strong>Setting Up Auto Text:</strong> In the Texts sub-tab of Correspondence, open "Auto Text Settings" to add recipients for automated SMS reminders. Configure each recipient's phone number, notification types (hearings, court dates, deadlines), and reminder intervals (day of, 1/3/7/14 days before).</p>
        <p><strong>Sending Text Messages:</strong> Click "Send Text" to compose a one-off text message. Select a recipient, type your message, or use "AI Draft" to generate a professional message based on the case context. Messages are logged in the case history.</p>
      </Accordion>
      <Accordion sectionKey="tut-ai" title="AI Tools" icon="✦">
        <p><strong>Using Advocate AI:</strong> Open Advocate AI from the Help Center's "Advocate AI" tab, or click the floating AI button (bottom-right corner) on any screen. It's context-aware — it knows what screen you're on and can reference case details when opened from a case. Ask questions, get strategy suggestions, or request help with any MattrMindr feature. Advocate AI also understands the floating document viewer, transcript viewer, Scribe integration, and other system features.</p>
        <p><strong>AI Center Agents:</strong> The AI Center provides access to all specialized agents: Liability Analysis, Deadline Generator, Case Valuation & Strategy, Document Drafting, Case Triage, Client Communication Summary, Medical Record Summarizer, Task Suggestions, Filing Classifier, Audio Transcription, and Batch Case Manager.</p>
        <p><strong>Training AI Agents:</strong> Use the "Advocate AI Trainer" tab in AI Center to customize AI behavior. Add personal or office-wide training entries with local rules, office policies, settlement strategies, or jurisdiction preferences. Target specific agents or apply to all. Upload documents or type instructions directly.</p>
      </Accordion>
      <Accordion sectionKey="tut-contacts" title="Contacts & Staff" icon="📇">
        <p><strong>Managing Contacts:</strong> The Contacts view stores judges, insurance adjusters, medical providers, defense attorneys, witnesses, experts, and other contacts. Add contact details, notes, and associate contacts with cases. Pin frequently-used contacts for quick access.</p>
        <p><strong>Staff Directory:</strong> The Staff view shows all office personnel with their roles and assignments. Administrators can manage roles, send temporary passwords, and remove staff members. Staff members can have multiple roles.</p>
      </Accordion>
      <Accordion sectionKey="tut-reports" title="Reports & Time Log" icon="📊">
        <p><strong>Running Reports:</strong> The Reports view offers pre-built report types including caseload analysis, deadline compliance, task completion, SOL tracking, settlement reports, and case value pipeline. Filter by attorney, state, or case type. Export results to CSV or print directly.</p>
        <p><strong>Time Log Tracking:</strong> The Time Log view consolidates all time entries from task completions, case notes, and correspondence. Add manual time entries for activities not captured elsewhere. View entries by day, week, or custom date range. Filter by case or attorney.</p>
      </Accordion>
      <Accordion sectionKey="tut-admin" title="Administration" icon="🔧">
        <p><strong>Batch Operations:</strong> Authorized staff (Managing Partner, Senior Partner, Partners, IT, App Admin) can perform bulk operations via the Batch Case Manager in AI Center. Operations include staff reassignment, status changes, stage advancement, court date updates, and jurisdiction changes.</p>
        <p><strong>Staff Management:</strong> Administrators can add new staff members (who receive a temporary password via email), assign or modify roles, and remove staff. Use the "Send Temp Password" button to reset a staff member's credentials.</p>
      </Accordion>
    </div>
  );
}

function HelpFAQ({ Accordion }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 4 }}>General</div>
      <Accordion sectionKey="faq-what" title="What is MattrMindr?">
        <p>MattrMindr is a case management system built for personal injury law firms. It tracks PI cases, manages deadlines and statutes of limitations, assigns tasks, handles documents and court filings, and provides AI-powered tools for liability analysis, case valuation, demand letter drafting, and task management.</p>
      </Accordion>
      <Accordion sectionKey="faq-reset-pw" title="How do I reset my password?">
        <p>Click "Settings" in the sidebar footer, then "Change Password." If you've forgotten your password entirely, click "Forgot password?" on the login screen and enter your email. You'll receive a temporary reset code via email. If you still can't get in, contact your office administrator to send a new temporary password.</p>
      </Accordion>
      <Accordion sectionKey="faq-mobile" title="Can I use this on my phone?">
        <p>Yes. MattrMindr is fully responsive and works on phones and tablets. On mobile devices, the sidebar becomes a slide-out menu accessed via the hamburger icon. All features — case management, calendar, tasks, AI tools, and more — are available on mobile with touch-optimized controls. Note: the case info panel in the document viewer is hidden on mobile to preserve screen space.</p>
      </Accordion>
      <Accordion sectionKey="faq-close-popups" title="How do I close pop-up windows?">
        <p>All pop-up windows and dialogs require you to click the close button (✕) or Cancel to dismiss them. Clicking outside a pop-up will not close it — this prevents accidentally losing unsaved work in forms and dialogs.</p>
      </Accordion>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>Cases</div>
      <Accordion sectionKey="faq-confidential" title="How do I mark a case as confidential?">
        <p>Open the case detail and look for the "Confidential" toggle in the case header (next to the case number). Toggle it on to flag the case. Confidential cases are visually marked but remain accessible to assigned staff. This is an informational flag — it does not restrict access permissions.</p>
      </Accordion>
      <Accordion sectionKey="faq-stages" title="What do the case stages mean?">
        <p>Case stages track the procedural progress: Intake, Investigation, Treatment, Pre-Litigation Demand, Negotiation, Litigation Filed, Discovery, Mediation, Trial Preparation, Trial, Settlement/Verdict, and Closed. Change the stage in case details as the case progresses — the AI agents use this information to provide stage-appropriate suggestions.</p>
      </Accordion>
      <Accordion sectionKey="faq-conflict" title="How does conflict checking work?">
        <p>When you create a new case and enter a client name, the system automatically searches all existing cases and contacts for matching or similar names. If potential conflicts are found, a warning panel appears showing the matches. You can proceed with case creation or investigate the conflicts first.</p>
      </Accordion>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>AI Features</div>
      <Accordion sectionKey="faq-ai-data" title="Is my case data used to train the AI?">
        <p>No. All AI API calls are made with the <code>store: false</code> parameter, which prevents OpenAI from retaining or using your data for model training. Case data is sent to the AI only during your active session to generate responses, and is not stored on OpenAI's servers afterward.</p>
      </Accordion>
      <Accordion sectionKey="faq-ai-customize" title="How do I customize AI behavior?">
        <p>Use the "Advocate AI Trainer" tab in AI Center. You can add personal training entries (only affect your AI interactions) or office-wide entries (affect all staff). Add local rules, office policies, defense strategies, or court preferences. You can target specific AI agents or apply training to all agents.</p>
      </Accordion>
      <Accordion sectionKey="faq-advocate" title="What can Advocate AI help with?">
        <p>Advocate AI is a general-purpose assistant that can help with case strategy questions, explain MattrMindr features, summarize case details, draft communications, suggest next steps, and more. It's context-aware — it knows what screen you're on and can reference specific case data when a case is selected. It can also suggest actionable tasks that you can add to a case with one click.</p>
      </Accordion>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>Documents & Viewers</div>
      <Accordion sectionKey="faq-file-types" title="What file types can I upload?">
        <p>For case documents: PDF, DOCX, DOC, and TXT files. For court filings: PDF files. For transcripts: audio/video files (MP3, WAV, M4A, OGG, FLAC, AAC, WebM, MP4 up to 100MB). For AI training documents: PDF, DOCX, and TXT. Scanned PDFs are processed using OCR to extract text for AI analysis.</p>
      </Accordion>
      <Accordion sectionKey="faq-viewer" title="How does the floating document viewer work?">
        <p>Click any document filename or "View" button to open it in a floating window. The viewer supports all major file types. You can have multiple viewers open at once — drag them around, resize them, and minimize them to chips at the bottom of the screen. Click a minimized chip to restore the viewer. The viewer also has buttons for download, print, and present mode.</p>
      </Accordion>
      <Accordion sectionKey="faq-case-panel" title="How do I see case info while viewing a document?">
        <p>When viewing a document in the floating viewer, click the briefcase icon in the title bar. A side panel slides in showing the full case details — client name, case type, key dates, SOL countdown, financials, liability assessment, and team members. This is available for any document opened from a case.</p>
      </Accordion>
      <Accordion sectionKey="faq-edit-docs" title="Can I edit documents directly in the viewer?">
        <p>Yes, for Office documents (Word, Excel, PowerPoint). If you have ONLYOFFICE DocSpace connected, an "Edit" button appears in the viewer. Click it to open the document for editing. When finished, save changes back to the case. Connect ONLYOFFICE DocSpace in Settings under Integrations.</p>
      </Accordion>
      <Accordion sectionKey="faq-classify" title="How does the AI classify filings?">
        <p>When you upload a court filing, the AI Filing Classifier extracts the document text and analyzes it to determine the filing party (State, Defendant, Court, etc.), document type, filing date, and a brief summary. Classification can also be triggered manually via the "Classify" button on any filing.</p>
      </Accordion>
      <Accordion sectionKey="faq-templates" title="Can I create my own document templates?">
        <p>Yes. Go to the Templates view and click "+ New Template." You can create templates with placeholders like {"{{client_name}}"}, {"{{case_number}}"}, etc., that auto-fill when generating a document for a specific case. Templates support categories like Motions, Letters, and Pleadings (which auto-include court caption and signature blocks).</p>
      </Accordion>
      <Accordion sectionKey="faq-folders" title="How do I organize documents into folders?">
        <p>In the Documents tab, click "New Folder" to create a folder. Drag and drop documents into folders to organize them by category — medical records, correspondence, evidence, and more. In the Transcripts tab, you can also create folders to organize recordings.</p>
      </Accordion>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>Transcripts & Scribe</div>
      <Accordion sectionKey="faq-transcripts" title="How do I transcribe audio recordings?">
        <p>In a case detail, go to the Documents tab and switch to the Transcripts sub-tab. Upload an audio or video file and the system will automatically transcribe it with timestamps and speaker labels. You can edit the transcript text, rename speakers, and export the results.</p>
      </Accordion>
      <Accordion sectionKey="faq-scribe" title="What is Scribe integration?">
        <p>MattrMindr Scribe is an optional professional transcription service. Connect to Scribe from Settings, then send transcripts for enhanced AI-powered transcription. Once processed, import the results back and view AI-generated summaries highlighting key topics and action items from the recording.</p>
      </Accordion>
      <Accordion sectionKey="faq-scribe-summaries" title="How do I get summaries for transcripts?">
        <p>For transcripts connected to Scribe, a purple "Summaries" button appears in the Transcript Viewer. Click it to fetch AI-generated summaries. Summaries are stored with the transcript so you only need to fetch them once — subsequent clicks toggle the summaries panel open and closed.</p>
      </Accordion>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>Communication</div>
      <Accordion sectionKey="faq-autotext" title="How do Auto Text reminders work?">
        <p>Auto Text sends automated SMS reminders to configured recipients before case events. In the Correspondence Texts tab, open "Auto Text Settings" to add recipients and choose which event types trigger reminders (hearings, court dates, deadlines, meetings). Set reminder intervals like day-of, 1 day before, 3 days before, etc. The system automatically generates and sends texts on schedule.</p>
      </Accordion>
      <Accordion sectionKey="faq-sms-schedule" title="How does SMS scheduling work?">
        <p>When deadlines or court dates are created or updated, the system automatically generates scheduled SMS messages based on your Auto Text configurations. The scheduler processes pending messages periodically (every 60 seconds in production). Messages are sent via Twilio and logged in the case correspondence history.</p>
      </Accordion>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>Calendar</div>
      <Accordion sectionKey="faq-ical" title="Can I import my court calendar?">
        <p>Yes. In the Calendar view, go to the "Feeds" tab and add an iCal feed URL. MattrMindr supports feeds from Outlook 365, Google Calendar, court systems, and any standard iCal/ICS source. Events are imported and displayed alongside your case deadlines and tasks. The system auto-detects case numbers and client names in imported events.</p>
      </Accordion>
      <Accordion sectionKey="faq-deadlines-calc" title="How are deadlines calculated?">
        <p>The Deadline Calculator in the Calendar view uses common civil procedure and PI deadlines to calculate important dates. Select a rule (e.g., SOL — Personal Injury, Discovery Response, Expert Disclosure), enter a reference date, and the calculator shows the resulting deadline date. Some rules count forward, others count backward from a target date.</p>
      </Accordion>

      <div style={{ padding: "16px 0 4px", borderTop: "1px solid var(--c-border)", marginTop: 16, fontSize: 13, color: "var(--c-text3)", textAlign: "center" }}>
        Still need help? Try asking <strong style={{ color: "var(--c-text-h)" }}>Advocate AI</strong> — go to the Advocate AI tab above or click the floating button in the bottom-right corner.
      </div>
    </div>
  );
}

function HelpChangeLog() {
  const versions = [
    {
      version: "1.0",
      date: "April 2026",
      title: "MattrMindr — Personal Injury Case Management",
      changes: [
        { text: "Case Management", sub: ["Personal injury case tracking with multi-state jurisdiction support", "Case stages: Intake, Investigation, Treatment, Pre-Litigation Demand, Negotiation, Litigation Filed, Discovery, Mediation, Trial Preparation, Trial, Settlement/Verdict, Closed", "Insurance policies: liability, UM/UIM, MedPay, PIP with carrier details, policy limits, adjuster info, and claim numbers", "Medical treatment tracking with providers, visit dates, billing totals, and treatment status", "Liens, damages, and negotiations tracking with timeline view of demands, offers, and counteroffers", "Multi-role staff assignments: lead attorney, co-counsel, case manager, investigator, paralegal", "Linked cases: companion cases, prior claims, appeals, or external cases from other jurisdictions", "Confidential case flagging and conflict checking on case creation", "Pinned cases across all views and dropdowns"] },
        { text: "Documents & Filings", sub: ["Upload PDF, DOCX, DOC, and TXT case documents with secure storage", "Document type categorization: Medical Records, Police Report, Demand Letter, Settlement Agreement, Expert Report, and more", "Folder organization with drag-and-drop between folders", "AI-powered document summarization with key facts, timeline, people, and liability issues", "OCR for scanned PDFs to extract text for AI analysis", "Court filing management with AI auto-classification of filing type, party, date, and summary", "Template-based document generation with placeholder auto-fill and AI Draft"] },
        { text: "Floating Document Viewer", sub: ["Open documents in draggable, resizable floating windows", "Support for PDF, Word documents, images, and text files", "Multiple viewers open simultaneously with independent controls", "Minimize viewers to compact chips at the bottom of the screen", "Download, print, and present mode buttons in title bar", "Edit Office documents with ONLYOFFICE DocSpace integration", "Case Info Panel: briefcase toggle in title bar reveals client details, key dates, SOL countdown, financials, liability, and team"] },
        { text: "Audio Transcription & Transcript Viewer", sub: ["Upload audio/video files (MP3, WAV, M4A, OGG, FLAC, AAC, WebM, MP4 up to 100MB)", "OpenAI Whisper-powered speech-to-text with timestamped segments and speaker diarization", "Large file support with automatic chunking for files over 24MB", "Floating Transcript Viewer with audio playback controls (play/pause, skip ±5s, speed adjustment)", "Editable segments with inline speaker renaming and Export Text button", "Transcript folders for organizing recordings by category", "Available from Documents tab (Transcripts sub-tab) and AI Center"] },
        { text: "MattrMindr Scribe Integration", sub: ["Connect to Scribe from Settings for professional AI-powered transcription", "Send transcripts to Scribe and check processing status", "Import Scribe results back into case transcripts", "Scribe Summaries button (purple) fetches AI-generated summaries", "Summaries highlight key topics, decisions, and action items from recordings"] },
        { text: "AI-Powered Agents", sub: ["Advocate AI: global assistant with floating button on every screen, screen-aware context, and case-specific mode", "Advocate AI Trainer: personal and office-wide training entries with local rules, office policies, defense strategies, and court preferences", "Liability Analysis, Case Valuation & Strategy, Case Triage", "Deadline Generator with jurisdiction-aware rules", "Document Drafting with AI-assisted content creation", "Client Communication Summary and Medical Record Summarizer", "Task Suggestions with one-click add from AI recommendations", "Filing Classifier with auto-detection of filing type, party, and date", "Audio Transcription with Whisper-powered speech-to-text", "Batch Case Manager for bulk operations: staff reassignment, status changes, stage advancement", "Charge Class Lookup with auto-trigger on charge entry", "All AI calls use store: false — case data is never retained by the AI provider"] },
        { text: "Calendar & Deadlines", sub: ["Calendar with deadline tracking, court rules calculator, and task due dates", "SOL calculator by state and case type with accident date input", "iCal feed imports (Outlook, Google Calendar, court systems) with auto case/defendant detection", "Toggle visibility for deadlines, tasks, court dates, and imported events", "Day detail view with full event breakdown"] },
        { text: "Tasks", sub: ["Task creation with priority, due date, case, and team member assignment", "AI task suggestions from case analysis with bulk or individual add", "Recurring tasks: daily, weekly, biweekly, or monthly with auto-creation on completion", "Time logging on task completion with optional follow-up task creation"] },
        { text: "Correspondence & SMS", sub: ["Email correspondence via SendGrid inbound parse with thread and attachment support", "Twilio-based SMS auto-text reminder system for hearings, court dates, deadlines, and meetings", "Configurable recipients with reminder intervals: day-of, 1, 3, 7, and 14 days before events", "AI-assisted message drafting for one-off text messages", "Chat-style message bubbles for text message history", "Emails and Texts organized in separate sub-tabs"] },
        { text: "Contacts & Staff", sub: ["Contact management for judges, adjusters, providers, attorneys, witnesses, and experts", "Contact-case associations and pinned contacts for quick access", "Conflict checking on case creation with name matching", "Staff directory with multi-role support and admin controls", "Temporary password management via email for new and existing staff"] },
        { text: "Reports & Time Log", sub: ["Pre-built reports: caseload analysis, deadline compliance, task completion, SOL tracking, settlement reports, case value pipeline", "Filter by attorney, state, or case type with CSV export and print", "Time log consolidation from task completions, case notes, and correspondence", "Manual time entries with day, week, or custom date range views"] },
        { text: "Dashboard & Interface", sub: ["Customizable dashboard with drag-and-drop widget system and Quick Notes", "Full Tailwind CSS design with consistent button styling and color schemes", "Dark mode with per-user preference persistence", "Full mobile responsive design with touch-optimized controls", "Case detail toolbar and header badges collapse on small screens", "Movable Advocate AI button: right-click (desktop) or long-press (mobile) to reposition", "All pop-up windows require explicit close button or Cancel to dismiss", "Speech-to-text dictation for case notes"] },
        { text: "Help Center & Settings", sub: ["Help Center with Tutorials, FAQ, Advocate AI, Change Log, and Contact Support", "Settings popup with appearance, password, session controls, and integrations", "Option to hide Advocate AI button via Settings"] },
      ]
    },
  ];

  return (
    <div>
      {versions.map((v, vi) => (
        <div key={v.version} style={{ marginBottom: vi < versions.length - 1 ? 24 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ display: "inline-block", padding: "3px 10px", background: vi === 0 ? "var(--c-accent)" : "var(--c-bg)", color: vi === 0 ? "#fff" : "var(--c-text-h)", borderRadius: 20, fontSize: 12, fontWeight: 700, border: vi === 0 ? "none" : "1px solid var(--c-border)" }}>v{v.version}</span>
            <span style={{ fontSize: 12, color: "var(--c-text3)" }}>{v.date}</span>
            {vi === 0 && <span style={{ fontSize: 10, padding: "2px 8px", background: "#E8F5E9", color: "#2F7A5F", borderRadius: 10, fontWeight: 600 }}>LATEST</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 8 }}>{v.title}</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: "var(--c-text)" }}>
            {v.changes.map((c, ci) => (
              <li key={ci} style={{ marginBottom: c.sub ? 4 : 2 }}>
                {c.text}
                {c.sub && (
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 16, listStyleType: "disc" }}>
                    {c.sub.map((s, si) => <li key={si} style={{ fontSize: 12, color: "var(--c-text3)", marginBottom: 1 }}>{s}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {vi < versions.length - 1 && <div style={{ borderBottom: "1px solid var(--c-border)", marginTop: 16 }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Toggle Helper ────────────────────────────────────────────────────────────


// ─── Settings Modal ──────────────────────────────────────────────────────────
function SettingsModal({ currentUser, darkMode, onToggleDark, onChangePassword, onSignOut, onClose, hideAdvocateAI, onToggleHideAdvocate, onUpdateUser }) {
  const [mfaStep, setMfaStep] = useState(null);
  const [mfaQr, setMfaQr] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaErr, setMfaErr] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [disablePw, setDisablePw] = useState("");
  const [, setPicBusy] = useState(false);
  const picRef = useRef(null);
  const [picKey, setPicKey] = useState(0);

  const startMfaSetup = async () => {
    setMfaBusy(true); setMfaErr("");
    try {
      const { qrCode, secret } = await apiMfaSetup();
      setMfaQr(qrCode); setMfaSecret(secret); setMfaStep("setup"); setMfaCode("");
    } catch (e) { setMfaErr(e.message); }
    setMfaBusy(false);
  };

  const confirmMfaSetup = async () => {
    if (!mfaCode || mfaCode.length !== 6) { setMfaErr("Enter the 6-digit code."); return; }
    setMfaBusy(true); setMfaErr("");
    try {
      await apiMfaVerifySetup(mfaCode);
      if (onUpdateUser) onUpdateUser({ ...currentUser, mfaEnabled: true });
      setMfaStep(null); setMfaQr(""); setMfaSecret("");
    } catch (e) { setMfaErr(e.message); }
    setMfaBusy(false);
  };

  const disableMfa = async () => {
    if (!disablePw) { setMfaErr("Enter your password."); return; }
    setMfaBusy(true); setMfaErr("");
    try {
      await apiMfaDisable(disablePw);
      if (onUpdateUser) onUpdateUser({ ...currentUser, mfaEnabled: false });
      setMfaStep(null); setDisablePw("");
    } catch (e) { setMfaErr(e.message); }
    setMfaBusy(false);
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicBusy(true);
    try {
      await apiUploadProfilePicture(currentUser.id, file);
      if (onUpdateUser) onUpdateUser({ ...currentUser, hasProfilePicture: true });
      setPicKey(k => k + 1);
    } catch (err) { alert("Upload failed: " + err.message); }
    setPicBusy(false);
    if (picRef.current) picRef.current.value = "";
  };

  const handlePicDelete = async () => {
    setPicBusy(true);
    try {
      await apiDeleteProfilePicture(currentUser.id);
      if (onUpdateUser) onUpdateUser({ ...currentUser, hasProfilePicture: false });
      setPicKey(k => k + 1);
    } catch (err) { alert("Delete failed: " + err.message); }
    setPicBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1100]">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer text-lg"><X size={18} /></button>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Settings</h2>
        <div className="flex items-center gap-3 mb-5 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative group cursor-pointer" onClick={() => picRef.current?.click()}>
            {currentUser.hasProfilePicture ? (
              <img key={picKey} src={`/api/users/${currentUser.id}/profile-picture?t=${Date.now()}`} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <Avatar userId={currentUser.id} size={48} />
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={16} className="text-white" />
            </div>
            <input ref={picRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePicUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {(currentUser.roles && currentUser.roles.length > 1) ? currentUser.roles.join(" · ") : currentUser.role}
              {currentUser.hasProfilePicture && <span className="ml-2 text-red-400 hover:text-red-600 cursor-pointer" onClick={e => { e.stopPropagation(); handlePicDelete(); }}>Remove photo</span>}
            </div>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Appearance</div>
        <div className="flex items-center justify-between py-2.5 mb-4">
          <span className="text-sm text-slate-700 dark:text-slate-300">{darkMode ? "Dark Mode" : "Light Mode"}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">☀️</span>
            <Toggle on={darkMode} onChange={onToggleDark} />
            <span className="text-xs text-slate-400">🌙</span>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Advocate AI</div>
        <div className="flex items-center justify-between py-2.5 mb-4">
          <div>
            <span className="text-sm text-slate-700 dark:text-slate-300">Hide Advocate AI</span>
            <div className="text-[11px] text-slate-400 mt-0.5">Hides the floating AI button on all screens</div>
          </div>
          <Toggle on={hideAdvocateAI} onChange={() => onToggleHideAdvocate(!hideAdvocateAI)} />
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Security</div>
        <button className="!w-full !py-2.5 !text-sm !font-medium !text-slate-700 dark:!text-slate-300 !bg-transparent !border !border-slate-200 dark:!border-slate-700 !rounded-lg hover:!bg-slate-50 dark:hover:!bg-slate-700 !transition-colors !cursor-pointer !mb-3" onClick={onChangePassword}>Change Password</button>

        {!mfaStep && !currentUser.mfaEnabled && (
          <button className="!w-full !py-2.5 !text-sm !font-medium !text-emerald-700 dark:!text-emerald-400 !bg-transparent !border !border-emerald-200 dark:!border-emerald-900/50 !rounded-lg hover:!bg-emerald-50 dark:hover:!bg-emerald-900/20 !transition-colors !cursor-pointer !mb-4 flex items-center justify-center gap-2" onClick={startMfaSetup} disabled={mfaBusy}>
            <Shield size={14} /> {mfaBusy ? "Setting up..." : "Enable Two-Factor Authentication"}
          </button>
        )}
        {!mfaStep && currentUser.mfaEnabled && (
          <div className="mb-4">
            <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 mb-2">
              <span className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><Shield size={14} /> 2FA Enabled</span>
              <button className="text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer" onClick={() => { setMfaStep("disable"); setMfaErr(""); setDisablePw(""); }}>Disable</button>
            </div>
          </div>
        )}
        {mfaStep === "setup" && (
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Scan this QR code with your authenticator app</div>
            {mfaQr && <div className="flex justify-center mb-3"><img src={mfaQr} alt="QR Code" style={{ width: 180, height: 180 }} /></div>}
            <div className="text-[10px] text-slate-400 text-center mb-3 break-all">Manual key: {mfaSecret}</div>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" value={mfaCode} onChange={e => { setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setMfaErr(""); }} onKeyDown={e => e.key === "Enter" && confirmMfaSetup()} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center tracking-widest mb-2" />
            {mfaErr && <div className="text-red-500 text-xs mb-2">{mfaErr}</div>}
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg border-none cursor-pointer hover:bg-emerald-700" onClick={confirmMfaSetup} disabled={mfaBusy}>{mfaBusy ? "Verifying..." : "Verify & Enable"}</button>
              <button className="py-2 px-4 text-sm text-slate-500 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer" onClick={() => setMfaStep(null)}>Cancel</button>
            </div>
          </div>
        )}
        {mfaStep === "disable" && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">Enter your password to disable 2FA</div>
            <input type="password" placeholder="Current password" value={disablePw} onChange={e => { setDisablePw(e.target.value); setMfaErr(""); }} onKeyDown={e => e.key === "Enter" && disableMfa()} className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2" />
            {mfaErr && <div className="text-red-500 text-xs mb-2">{mfaErr}</div>}
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg border-none cursor-pointer hover:bg-red-700" onClick={disableMfa} disabled={mfaBusy}>{mfaBusy ? "Disabling..." : "Disable 2FA"}</button>
              <button className="py-2 px-4 text-sm text-slate-500 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer" onClick={() => setMfaStep(null)}>Cancel</button>
            </div>
          </div>
        )}

        <SettingsIntegrations currentUser={currentUser} onUpdateUser={onUpdateUser} />

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Session</div>
        <button className="!w-full !py-2.5 !text-sm !font-medium !text-red-600 dark:!text-red-400 !bg-transparent !border !border-red-200 dark:!border-red-900/50 !rounded-lg hover:!bg-red-50 dark:hover:!bg-red-900/20 !transition-colors !cursor-pointer" onClick={onSignOut}>Sign Out</button>
      </div>
    </div>
  );
}

function SettingsIntegrations({ currentUser, onUpdateUser }) {
  const [msStatus, setMsStatus] = useState(null);
  const [ooStatus, setOoStatus] = useState(null);
  const [scribeStatus, setScribeStatus] = useState(null);
  const [scribeForm, setScribeForm] = useState({ email: "", password: "" });
  const [showScribeForm, setShowScribeForm] = useState(false);
  const [voirdireStatus, setVoirdireStatus] = useState(null);
  const [voirdireForm, setVoirdireForm] = useState({ email: "", password: "" });
  const [showVoirdireForm, setShowVoirdireForm] = useState(false);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    apiGetMsConfigured().then(r => { if (r.configured) apiGetMsStatus().then(setMsStatus).catch(() => {}); else setMsStatus({ connected: false, configured: false }); }).catch(() => setMsStatus({ connected: false, configured: false }));
    apiGetOnlyofficeStatus().then(setOoStatus).catch(() => setOoStatus({ configured: false }));
    apiGetScribeStatus().then(setScribeStatus).catch(() => setScribeStatus({ connected: false }));
    apiGetVoirdireStatus().then(setVoirdireStatus).catch(() => setVoirdireStatus({ connected: false }));
  }, []);

  const [showMsSetup, setShowMsSetup] = useState(false);
  const [msConfigForm, setMsConfigForm] = useState({ clientId: "", clientSecret: "", redirectUri: "" });
  const [msConfigSaving, setMsConfigSaving] = useState(false);

  const connectMs = async () => {
    if (msStatus?.configured === false) { setShowMsSetup(true); return; }
    setBusy("ms");
    try {
      const { url } = await apiGetMsAuthUrl();
      window.open(url, "_blank", "width=600,height=700");
      setTimeout(async () => {
        const s = await apiGetMsStatus();
        setMsStatus(s);
        setBusy("");
      }, 5000);
    } catch (err) { alert(err.message); setBusy(""); }
  };

  const saveMsConfig = async () => {
    if (!msConfigForm.clientId || !msConfigForm.clientSecret) return;
    setMsConfigSaving(true);
    try {
      await apiConfigureMs(msConfigForm);
      setMsStatus({ connected: false, configured: true });
      setShowMsSetup(false);
      setMsConfigForm({ clientId: "", clientSecret: "", redirectUri: "" });
    } catch (err) { alert(err.message); }
    setMsConfigSaving(false);
  };

  const disconnectMs = async () => {
    setBusy("ms");
    try { await apiDisconnectMs(); setMsStatus(prev => ({ ...prev, connected: false, email: null })); } catch {}
    setBusy("");
  };

  const connectScribe = async () => {
    if (!scribeForm.email || !scribeForm.password) return;
    setBusy("scribe");
    try {
      await apiConnectScribe(scribeForm);
      setScribeStatus({ connected: true, url: "https://scribe.mattrmindr.com", email: scribeForm.email });
      setShowScribeForm(false);
      setScribeForm({ email: "", password: "" });
    } catch (err) { alert(err.message); }
    setBusy("");
  };

  const disconnectScribe = async () => {
    setBusy("scribe");
    try { await apiDisconnectScribe(); setScribeStatus({ connected: false }); } catch {}
    setBusy("");
  };

  const connectVoirdire = async () => {
    if (!voirdireForm.email || !voirdireForm.password) return;
    setBusy("voirdire");
    try {
      await apiConnectVoirdire(voirdireForm);
      setVoirdireStatus({ connected: true, url: "https://voirdire.mattrmindr.com", email: voirdireForm.email });
      setShowVoirdireForm(false);
      setVoirdireForm({ email: "", password: "" });
    } catch (err) { alert(err.message); }
    setBusy("");
  };

  const disconnectVoirdire = async () => {
    setBusy("voirdire");
    try { await apiDisconnectVoirdire(); setVoirdireStatus({ connected: false }); } catch {}
    setBusy("");
  };

  const cardStyle = "flex items-center gap-3 p-4 rounded-xl border mb-3";

  return (
    <>
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Connected Accounts</div>

      <div className={`${cardStyle} ${msStatus?.connected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #0078d4, #00bcf2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 21 21" fill="white"><rect x="1" y="1" width="9" height="9" rx="1"/><rect x="11" y="1" width="9" height="9" rx="1"/><rect x="1" y="11" width="9" height="9" rx="1"/><rect x="11" y="11" width="9" height="9" rx="1"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Microsoft Office</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {msStatus?.connected ? `Connected — ${msStatus.email || "Microsoft account"}` : "Connect for Office Online, Outlook Calendar & Contacts"}
          </div>
        </div>
        {msStatus?.connected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setShowMsSetup(true)} style={{ padding: "4px 10px", fontSize: 11, color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer" }}>Reconfigure</button>
            <button onClick={disconnectMs} disabled={busy === "ms"} className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100">Disconnect</button>
          </div>
        ) : msStatus?.configured ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setShowMsSetup(true)} style={{ padding: "4px 10px", fontSize: 11, color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer" }}>Reconfigure</button>
            <button onClick={connectMs} disabled={busy === "ms"} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>{busy === "ms" ? "..." : "Connect"}</button>
          </div>
        ) : (
          <button onClick={connectMs} disabled={busy === "ms"} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>{busy === "ms" ? "..." : "Configure"}</button>
        )}
      </div>

      {showMsSetup && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Configure Microsoft 365</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Enter your Azure AD app credentials from the Microsoft Entra admin center. Required permissions: Files.ReadWrite.All, Calendars.ReadWrite, Contacts.ReadWrite.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Application (Client) ID *</label>
              <input value={msConfigForm.clientId} onChange={e => setMsConfigForm(p => ({ ...p, clientId: e.target.value }))} placeholder="e.g. 12345678-abcd-..." style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Client Secret *</label>
              <input value={msConfigForm.clientSecret} onChange={e => setMsConfigForm(p => ({ ...p, clientSecret: e.target.value }))} type="password" placeholder="Enter client secret value" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Redirect URI (optional)</label>
              <input value={msConfigForm.redirectUri} onChange={e => setMsConfigForm(p => ({ ...p, redirectUri: e.target.value }))} placeholder="Auto-detected if left blank" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveMsConfig} disabled={msConfigSaving || !msConfigForm.clientId || !msConfigForm.clientSecret} style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: msConfigSaving || !msConfigForm.clientId || !msConfigForm.clientSecret ? 0.5 : 1 }}>{msConfigSaving ? "Saving..." : "Save & Continue"}</button>
            <button onClick={() => setShowMsSetup(false)} style={{ padding: "8px 16px", fontSize: 13, color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div className={`${cardStyle} ${ooStatus?.available ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #ff6f3d, #ff4444)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>OO</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">ONLYOFFICE DocSpace</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {ooStatus?.available ? `Connected — ${ooStatus.url || "ONLYOFFICE instance"}` : ooStatus?.configured ? "Server unavailable" : "Not configured"}
          </div>
        </div>
        {ooStatus?.available ? (
          <span style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, background: "#dcfce7", color: "#16a34a", borderRadius: 8 }}>Active</span>
        ) : ooStatus?.configured ? (
          <span style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>Offline</span>
        ) : null}
      </div>

      <div className={`${cardStyle} ${scribeStatus?.connected ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #ef4444, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">MattrMindrScribe</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {scribeStatus?.connected ? `Connected — ${scribeStatus.url || scribeStatus.email || "Scribe instance"}` : "Connect to send files for AI transcription"}
          </div>
        </div>
        {scribeStatus?.connected ? (
          <button onClick={disconnectScribe} disabled={busy === "scribe"} className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100">Disconnect</button>
        ) : (
          <button onClick={() => setShowScribeForm(true)} disabled={busy === "scribe"} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Connect</button>
        )}
      </div>

      {showScribeForm && !scribeStatus?.connected && (
        <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700" style={{ marginTop: -8 }}>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Sign in with your MattrMindrScribe account</div>
          <input type="email" placeholder="Email" value={scribeForm.email} onChange={e => setScribeForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2" />
          <input type="password" placeholder="Password" value={scribeForm.password} onChange={e => setScribeForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2" />
          <div className="flex gap-2">
            <button className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-lg border-none cursor-pointer hover:bg-red-600" onClick={connectScribe} disabled={busy === "scribe"}>{busy === "scribe" ? "Signing in..." : "Sign In"}</button>
            <button className="py-2 px-4 text-sm text-slate-500 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer" onClick={() => setShowScribeForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className={`${cardStyle} ${voirdireStatus?.connected ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Voir Dire Analyst</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {voirdireStatus?.connected ? `Connected — ${voirdireStatus.email || "Voir Dire Analyst"}` : "Connect to import juror data from Voir Dire Analyst"}
          </div>
        </div>
        {voirdireStatus?.connected ? (
          <button onClick={disconnectVoirdire} disabled={busy === "voirdire"} className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100">Disconnect</button>
        ) : (
          <button onClick={() => setShowVoirdireForm(true)} disabled={busy === "voirdire"} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Connect</button>
        )}
      </div>

      {showVoirdireForm && !voirdireStatus?.connected && (
        <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700" style={{ marginTop: -8 }}>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Sign in with your Voir Dire Analyst account</div>
          <input type="email" placeholder="Email" value={voirdireForm.email} onChange={e => setVoirdireForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2" />
          <input type="password" placeholder="Password" value={voirdireForm.password} onChange={e => setVoirdireForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2" />
          <div className="flex gap-2">
            <button className="flex-1 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg border-none cursor-pointer hover:bg-violet-700" onClick={connectVoirdire} disabled={busy === "voirdire"}>{busy === "voirdire" ? "Signing in..." : "Sign In"}</button>
            <button className="py-2 px-4 text-sm text-slate-500 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer" onClick={() => setShowVoirdireForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-4" />
    </>
  );
}


// ─── Change Password Modal ──────────────────────────────────────────────────
function ChangePasswordModal({ forced, currentUser, onDone, onClose }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doChange = async () => {
    if (!forced && !currentPw) { setErr("Enter your current password."); return; }
    if (!newPw || newPw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(newPw)) { setErr("Password must contain at least 1 uppercase letter."); return; }
    if (!/[a-z]/.test(newPw)) { setErr("Password must contain at least 1 lowercase letter."); return; }
    if (!/[0-9]/.test(newPw)) { setErr("Password must contain at least 1 number."); return; }
    if (!/[^A-Za-z0-9]/.test(newPw)) { setErr("Password must contain at least 1 special character."); return; }
    if (newPw !== confirmPw) { setErr("Passwords do not match."); return; }
    setBusy(true); setErr("");
    try {
      await apiChangePassword(forced ? null : currentPw, newPw);
      if (onDone) onDone();
      if (onClose) onClose();
    } catch (e) {
      setErr(e.message || "Failed to change password.");
    } finally { setBusy(false); }
  };

  const content = (
    <>
      <img src="/mattrmindr-logo.png" alt="MattrMindr" style={{ height: 36, marginBottom: 2 }} />
      <div style={{ fontSize: 10, color: "#0f172a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Personal Injury Case Management</div>
      {forced && <div style={{ fontSize: 13, color: "#64748b", margin: "8px 0 16px" }}>You must set a new password before continuing.</div>}
      {!forced && (
        <div className="form-group">
          <label>Current Password</label>
          <input type="password" placeholder="Enter current password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setErr(""); }} />
        </div>
      )}
      <div className="form-group">
        <label>New Password</label>
        <input type="password" placeholder="At least 8 characters" value={newPw} onChange={e => { setNewPw(e.target.value); setErr(""); }} />
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Must include uppercase, lowercase, number, and special character</div>
      </div>
      <div className="form-group">
        <label>Confirm New Password</label>
        <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && doChange()} />
      </div>
      {err && <div style={{ color: "#e05252", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <button className="btn btn-gold" style={{ width: "100%", padding: 10 }} onClick={doChange} disabled={busy}>
        {busy ? "Saving…" : "Set New Password"}
      </button>
    </>
  );

  if (forced) {
    return (
      <div className="login-bg">
        <div className="login-box">{content}</div>
      </div>
    );
  }

  return (
    <div className="case-overlay" style={{ left: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
      <div className="login-box" style={{ maxWidth: 420, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", lineHeight: 1 }}>✕</button>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, color: "var(--c-text-h)", marginBottom: 16 }}>Change Password</div>
        {content}
        <button className="btn btn-outline" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}


// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [view,     setView]     = useState("login");
  const [resetCode, setResetCode] = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg,      setMsg]      = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");

  const doLogin = async () => {
    if (!email.trim()) { setErr("Enter your email address."); return; }
    if (!password)     { setErr("Enter your password."); return; }
    setBusy(true);
    setErr("");
    try {
      const result = await apiLogin(email.trim(), password, rememberMe);
      if (result.requireMfa) {
        setMfaRequired(true);
        setMfaToken("");
      } else {
        onLogin(result);
      }
    } catch (e) {
      setErr(e.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const doMfaVerify = async () => {
    if (!mfaToken || mfaToken.length !== 6) { setErr("Enter the 6-digit code from your authenticator app."); return; }
    setBusy(true); setErr("");
    try {
      const user = await apiMfaVerify(mfaToken);
      onLogin(user);
    } catch (e) {
      setErr(e.message || "Invalid code. Please try again.");
    } finally { setBusy(false); }
  };

  const doForgot = async () => {
    if (!email.trim()) { setErr("Enter your email address first."); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const result = await apiForgotPassword(email.trim());
      setMsg(result.message || "If an account exists, a reset code has been sent.");
      setView("reset");
    } catch (e) {
      setErr(e.message || "Failed to send reset email.");
    } finally { setBusy(false); }
  };

  const doReset = async () => {
    if (!resetCode.trim()) { setErr("Enter the reset code from your email."); return; }
    if (!newPw || newPw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(newPw)) { setErr("Must contain at least 1 uppercase letter."); return; }
    if (!/[a-z]/.test(newPw)) { setErr("Must contain at least 1 lowercase letter."); return; }
    if (!/[0-9]/.test(newPw)) { setErr("Must contain at least 1 number."); return; }
    if (!/[^A-Za-z0-9]/.test(newPw)) { setErr("Must contain at least 1 special character."); return; }
    if (newPw !== confirmPw) { setErr("Passwords do not match."); return; }
    setBusy(true); setErr("");
    try {
      await apiResetPassword(email.trim(), resetCode.trim(), newPw);
      setMsg("Password reset successful. You can now log in.");
      setView("login"); setPassword(""); setResetCode(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      setErr(e.message || "Reset failed.");
    } finally { setBusy(false); }
  };

  const inputClass = "!w-full !px-4 !py-3 !bg-slate-50 dark:!bg-slate-900 !border !border-slate-200 dark:!border-slate-700 !rounded-lg !text-sm !text-slate-900 dark:!text-slate-100 !placeholder:text-slate-400 dark:!placeholder:text-slate-500 focus:!outline-none focus:!ring-2 focus:!ring-amber-500/30 focus:!border-amber-500 !transition-all !font-['Inter']";
  const labelClass = "!block !text-[11px] !font-semibold !text-slate-400 dark:!text-slate-500 !uppercase !tracking-wider !mb-1.5 !font-['Inter']";
  const btnClass = "!w-full !py-3 !bg-slate-900 dark:!bg-slate-700 !text-white !rounded-lg !text-sm !font-semibold hover:!bg-slate-800 dark:hover:!bg-slate-600 !transition-colors !shadow-sm !border-none !cursor-pointer !font-['Inter']";
  const linkClass = "!text-xs !text-slate-500 hover:!text-slate-700 dark:!text-slate-400 dark:hover:!text-slate-300 !cursor-pointer !transition-colors !bg-transparent !border-none !font-['Inter']";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-10">
        <div className="flex flex-col items-center mb-8">
          <img src="/mattrmindr-logo.png" alt="MattrMindr" className="h-12 object-contain mb-3 mix-blend-multiply dark:mix-blend-lighten dark:invert" />
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-1">Personal Injury Law Firm</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Case Management System</div>
        </div>

        {view === "login" && !mfaRequired && (<form onSubmit={e => { e.preventDefault(); doLogin(); }}>
          <div className="mb-5">
            <label className={labelClass}>Email</label>
            <input type="email" placeholder="your.email@firm.com" value={email} onChange={e => { setEmail(e.target.value); setErr(""); setMsg(""); }} className={inputClass} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setErr(""); }} className={inputClass} />
          </div>
          <div className="flex items-center gap-2 mb-6">
            <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
            <label htmlFor="rememberMe" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">Remember me for 30 days</label>
          </div>
          {err && <div className="text-red-500 text-sm mb-3">{err}</div>}
          {msg && <div className="text-slate-700 dark:text-slate-300 text-sm mb-3">{msg}</div>}
          <button type="submit" className={btnClass + " mb-4"} disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
          <button type="button" className={linkClass + " block w-full text-center"} onClick={() => { setErr(""); setMsg(""); setView("forgot"); }}>Forgot password?</button>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <a href="/portal" className="block w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors">Click here if you are a client</a>
          </div>
        </form>)}

        {view === "login" && mfaRequired && (<>
          <div className="text-center mb-6">
            <Shield size={32} className="mx-auto mb-3 text-amber-500" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Two-Factor Authentication</div>
            <div className="text-xs text-slate-500">Enter the 6-digit code from your authenticator app</div>
          </div>
          <div className="mb-6">
            <label className={labelClass}>Verification Code</label>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={mfaToken} onChange={e => { setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(""); }} onKeyDown={e => e.key === "Enter" && doMfaVerify()} className={inputClass} style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: 20 }} autoFocus />
          </div>
          {err && <div className="text-red-500 text-sm mb-3">{err}</div>}
          <button className={btnClass + " mb-4"} onClick={doMfaVerify} disabled={busy}>
            {busy ? "Verifying…" : "Verify Code"}
          </button>
          <button type="button" className={linkClass + " block w-full text-center"} onClick={() => { setMfaRequired(false); setMfaToken(""); setErr(""); setPassword(""); }}>Back to login</button>
        </>)}

        {view === "forgot" && (<>
          <div className="text-sm text-slate-500 mb-4">Enter your email and we'll send a reset code.</div>
          <div className="mb-5">
            <label className={labelClass}>Email</label>
            <input type="email" placeholder="your.email@firm.com" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && doForgot()} className={inputClass} />
          </div>
          {err && <div className="text-red-500 text-sm mb-3">{err}</div>}
          <button className={btnClass + " mb-4"} onClick={doForgot} disabled={busy}>
            {busy ? "Sending…" : "Send Reset Code"}
          </button>
          <button type="button" className={linkClass + " block w-full text-center"} onClick={() => { setErr(""); setView("login"); }}>Back to login</button>
        </>)}

        {view === "reset" && (<>
          <div className="text-sm text-slate-500 mb-4">Enter the reset code from your email and choose a new password.</div>
          <div className="mb-5">
            <label className={labelClass}>Reset Code</label>
            <input type="text" placeholder="Enter code from email" value={resetCode} onChange={e => { setResetCode(e.target.value); setErr(""); }} className={inputClass} />
          </div>
          <div className="mb-5">
            <label className={labelClass}>New Password</label>
            <input type="password" placeholder="At least 8 characters" value={newPw} onChange={e => { setNewPw(e.target.value); setErr(""); }} className={inputClass} />
          </div>
          <div className="mb-6">
            <label className={labelClass}>Confirm Password</label>
            <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && doReset()} className={inputClass} />
          </div>
          {err && <div className="text-red-500 text-sm mb-3">{err}</div>}
          <button className={btnClass + " mb-4"} onClick={doReset} disabled={busy}>
            {busy ? "Resetting…" : "Reset Password"}
          </button>
          <button type="button" className={linkClass + " block w-full text-center"} onClick={() => { setErr(""); setView("login"); }}>Back to login</button>
        </>)}
      </div>
    </div>
  );
}


export { LoginScreen, ChangePasswordModal, SettingsModal, SettingsIntegrations, HelpCenterModal };
