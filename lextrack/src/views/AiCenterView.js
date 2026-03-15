import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Brain, Search, Plus, X, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Loader2, Download, Eye, Trash2, Pencil, Check, RefreshCw, Copy, Briefcase, Calendar, Clock, CheckSquare, Upload, Filter, Menu, Scale, CalendarClock, PenLine, MessageSquare, FileSearch, ListChecks, FolderOpen, Mic, Layers, Bot } from "lucide-react";
import {
  apiGetUsers, apiGetFilings, apiGetTraining, apiCreateTraining, apiUploadTrainingDoc, apiUpdateTraining, apiDeleteTraining,
  apiUploadTranscriptChunked, apiUploadTranscript, apiCreateTask, apiClassifyFiling,
  apiChargeAnalysis, apiDeadlineGenerator, apiCaseStrategy, apiDraftDocument, apiCaseTriage, apiClientSummary, apiDocSummary, apiTaskSuggestions,
  apiGetCustomAgents, apiRunCustomAgent, apiChatCustomAgent,
  apiBatchPreview, apiBatchApply,
} from "../api.js";
import {
  fmt, daysUntil, urgencyColor, Badge, getUserById, Avatar, isDarkMode,
  hasRole, isAppAdmin, today,
  AiPanel, CaseSearchField, Toggle, BatchStaffPicker, StaffSearchField, SortTh, USERS,
  PinnedSectionHeader, DragDropZone,
} from "../shared.js";
import { CustomAgentsTab } from "./CustomizationView.js";

const TRAINING_CATEGORIES = ["General", "Local Rules", "Office Policy", "Settlement Strategy", "Medical Terminology", "Insurance Practices", "Procedures"];
const OFFICE_ROLES = ["Managing Partner","Senior Partner","Partner","Associate Attorney","App Admin"];
function AiCenterView({ allCases, currentUser, onMenuToggle, pinnedCaseIds, confirmDelete }) {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [activeAgent, setActiveAgent] = useState(null);
  const [aiState, setAiState] = useState({ loading: false, result: null, error: null });
  const [aiCenterTab, setAiCenterTab] = useState("agents");
  const [trainingEntries, setTrainingEntries] = useState([]);
  const [trainingLoaded, setTrainingLoaded] = useState(false);
  const [trainingTab, setTrainingTab] = useState("personal");
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [addMode, setAddMode] = useState("text");
  const [addForm, setAddForm] = useState({ title: "", content: "", category: "General", scope: "personal", target_agents: ["all"] });
  const [addFile, setAddFile] = useState(null);
  const [addSaving, setAddSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const canOffice = (currentUser?.roles || []).some(r => OFFICE_ROLES.includes(r));
  const [docType, setDocType] = useState("Demand Letter");
  const [docTypeCustom, setDocTypeCustom] = useState("");
  const [docInstructions, setDocInstructions] = useState("");
  const [aiCenterTasks, setAiCenterTasks] = useState({ tasks: [], added: {} });
  const [docSummaryText, setDocSummaryText] = useState("");
  const [docSummaryType, setDocSummaryType] = useState("Medical Records");
  const [aiCenterFilings, setAiCenterFilings] = useState([]);
  const [aiCenterSelectedFiling, setAiCenterSelectedFiling] = useState("");
  const [aiCenterFilingResult, setAiCenterFilingResult] = useState(null);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseDropOpen, setCaseDropOpen] = useState(false);

  const activeCases = allCases.filter(c => c.status !== "Closed");
  const selectedCase = allCases.find(c => String(c.id) === String(selectedCaseId));

  const agents = [
    { id: "triage", Icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", title: "Case Triage", desc: "Rank active cases by urgency — SOL proximity, case value, treatment status, pending deadlines.", needsCase: false },
    { id: "charge", Icon: Scale, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", title: "Liability Analysis", desc: "Assess fault, comparative negligence, and applicable state law for your case — jurisdiction-aware.", needsCase: true },
    { id: "strategy", Icon: Brain, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20", title: "Case Valuation & Strategy", desc: "Estimate case value, settlement range, litigation strategy, and damages analysis.", needsCase: true },
    { id: "deadlines", Icon: CalendarClock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", title: "Deadline Generator", desc: "Generate SOL deadlines, discovery deadlines, mediation dates, and IME scheduling — jurisdiction-aware.", needsCase: true },
    { id: "draft", Icon: PenLine, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", title: "Document & Demand Letter Drafting", desc: "Generate demand letters, motions, and correspondence tailored to your PI case.", needsCase: true },
    { id: "summary", Icon: MessageSquare, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", title: "Client Communication", desc: "Plain-language case status update — treatment progress, claim status, next steps.", needsCase: true },
    { id: "docsummary", Icon: FileSearch, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20", title: "Medical Record Summarizer", desc: "Summarize medical records, accident reports, expert reports, and other case documents.", needsCase: true },
    { id: "tasksuggestions", Icon: ListChecks, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", title: "Task Suggestions", desc: "Suggest PI-specific tasks — order records, preservation letters, IME scheduling, demand drafting.", needsCase: true },
    { id: "filingclassifier", Icon: FolderOpen, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700/50", title: "Filing Classifier", desc: "Classify filings — auto-name, identify filing party (Plaintiff, Defendant, Court), and summarize significance.", needsCase: true },
    { id: "transcription", Icon: Mic, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", title: "Audio Transcription", desc: "Transcribe depositions, client interviews, and other audio — editable speaker labels, timestamps, and export.", needsCase: true },
  ];

  const TRAINING_AGENT_OPTIONS = [
    { id: "all", label: "All Agents" },
    { id: "advocate", label: "Advocate AI" },
    ...agents.map(a => ({ id: a.id, label: a.title })),
  ];

  const BATCH_ALLOWED_ROLES = ["Managing Partner", "Senior Partner", "Partner", "Associate Attorney", "IT Specialist", "App Admin"];
  const canBatch = (currentUser?.roles || []).some(r => BATCH_ALLOWED_ROLES.includes(r));
  if (canBatch) {
    agents.push({ id: "batch", Icon: Layers, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700/50", title: "Batch Case Manager", desc: "Perform bulk operations — reassign staff, change statuses, advance stages, update court dates, manage referrals.", needsCase: false });
  }

  const [batchOp, setBatchOp] = useState("reassign-staff");
  const [batchParams, setBatchParams] = useState({});
  const [batchPreview, setBatchPreview] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchApplied, setBatchApplied] = useState(null);
  const [batchStaffList, setBatchStaffList] = useState([]);
  const [batchCaseSearch, setBatchCaseSearch] = useState("");
  const [batchSelectedCases, setBatchSelectedCases] = useState([]);
  const [batchFromStaffInput, setBatchFromStaffInput] = useState("");
  const [batchFromStaffFocused, setBatchFromStaffFocused] = useState(false);
  const [batchToStaffInput, setBatchToStaffInput] = useState("");
  const [batchToStaffFocused, setBatchToStaffFocused] = useState(false);
  const batchFromRef = useRef(null);
  const batchToRef = useRef(null);

  const runAgent = async (agentId) => {
    setAiState({ loading: true, result: null, error: null });
    try {
      let r;
      if (agentId === "triage") {
        r = await apiCaseTriage();
      } else if (agentId === "charge") {
        r = await apiChargeAnalysis({ caseId: Number(selectedCaseId) }); // liability analysis
      } else if (agentId === "strategy") {
        r = await apiCaseStrategy({ caseId: Number(selectedCaseId) });
      } else if (agentId === "deadlines") {
        const dlRes = await apiDeadlineGenerator({ caseId: Number(selectedCaseId) });
        const dls = dlRes.deadlines || [];
        r = { result: dls.length ? dls.map((d, i) => `**${i + 1}. ${d.title}**\nDate: ${d.date}\nRule: ${d.rule || "—"}\nType: ${d.type || "—"}\n`).join("\n") : "No deadlines generated." };
      } else if (agentId === "draft") {
        const effectiveDocType = docType === "Other" ? (docTypeCustom.trim() || "Other Document") : docType;
        r = await apiDraftDocument({ caseId: Number(selectedCaseId), documentType: effectiveDocType, customInstructions: docInstructions });
      } else if (agentId === "summary") {
        r = await apiClientSummary({ caseId: Number(selectedCaseId) });
      } else if (agentId === "docsummary") {
        if (!docSummaryText.trim()) throw new Error("Please paste document text to summarize.");
        r = await apiDocSummary({ text: docSummaryText, docType: docSummaryType, caseTitle: selectedCase?.title || "", clientName: selectedCase?.clientName || "" });
      } else if (agentId === "tasksuggestions") {
        const tsRes = await apiTaskSuggestions({ caseId: Number(selectedCaseId) });
        const tks = tsRes.tasks || [];
        setAiCenterTasks({ tasks: tks, added: {} });
        r = { result: tks.length ? "__TASK_SUGGESTIONS__" : "No tasks suggested for this case." };
      } else if (agentId === "filingclassifier") {
        if (!aiCenterSelectedFiling) throw new Error("Please select a filing to classify.");
        const clRes = await apiClassifyFiling(Number(aiCenterSelectedFiling));
        setAiCenterFilingResult(clRes.classification);
        setAiCenterFilings(prev => prev.map(f => f.id === Number(aiCenterSelectedFiling) ? { ...f, filename: clRes.classification.suggestedName || f.filename, filedBy: clRes.classification.filedBy || f.filedBy, docType: clRes.classification.docType || f.docType, summary: clRes.classification.summary || f.summary } : f));
        r = { result: "__FILING_CLASSIFIER__" };
      }
      setAiState({ loading: false, result: r.result, error: null });
    } catch (e) {
      setAiState({ loading: false, result: null, error: e.message });
    }
  };

  const selectAgent = (agentId) => {
    setActiveAgent(agentId);
    setAiState({ loading: false, result: null, error: null });
    setDocType("Demand Letter");
    setDocTypeCustom("");
    setDocInstructions("");
    setDocSummaryText("");
    setDocSummaryType("Medical Records");
    setAiCenterFilings([]);
    setAiCenterSelectedFiling("");
    setBatchOp("reassign-staff");
    setBatchParams({});
    setBatchPreview(null);
    setBatchLoading(false);
    setBatchApplied(null);
    setBatchCaseSearch("");
    setBatchSelectedCases([]);
    setBatchFromStaffInput("");
    setBatchFromStaffFocused(false);
    setBatchToStaffInput("");
    setBatchToStaffFocused(false);
    if (agentId === "batch" && batchStaffList.length === 0) {
      apiGetUsers().then(users => setBatchStaffList(users.filter(u => u.active !== false))).catch(() => {});
    }
    setAiCenterFilingResult(null);
    setCaseSearch("");
    setCaseDropOpen(false);
  };

  useEffect(() => {
    if (activeAgent === "filingclassifier" && selectedCaseId) {
      apiGetFilings(Number(selectedCaseId)).then(setAiCenterFilings).catch(() => setAiCenterFilings([]));
    }
  }, [activeAgent, selectedCaseId]);

  useEffect(() => {
    if (aiCenterTab === "trainer" && !trainingLoaded) {
      apiGetTraining().then(entries => { setTrainingEntries(entries); setTrainingLoaded(true); }).catch(() => setTrainingLoaded(true));
    }
  }, [aiCenterTab, trainingLoaded]);

  const loadTraining = () => apiGetTraining().then(setTrainingEntries).catch(err => console.error("Load training error:", err));

  const handleAddTraining = async () => {
    if (!addForm.title.trim()) return alert("Title is required");
    if (addMode === "text" && !addForm.content.trim()) return alert("Content is required");
    if (addMode !== "text" && !addFile) return alert("Please select a file");
    setAddSaving(true);
    try {
      let newEntry;
      if (addMode === "text") {
        newEntry = await apiCreateTraining({ ...addForm, target_agents: addForm.target_agents });
      } else {
        const fd = new FormData();
        fd.append("file", addFile);
        fd.append("title", addForm.title);
        fd.append("category", addForm.category);
        fd.append("scope", addForm.scope);
        fd.append("target_agents", JSON.stringify(addForm.target_agents || ["all"]));
        newEntry = await apiUploadTrainingDoc(fd);
      }
      if (newEntry && newEntry.id) {
        setTrainingEntries(prev => [{ ...newEntry, created_by_name: currentUser?.name || "" }, ...prev]);
      }
      setShowAddTraining(false);
      setAddForm({ title: "", content: "", category: "General", scope: "personal", target_agents: ["all"] });
      setAddFile(null);
      setAddMode("text");
      loadTraining();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setAddSaving(false);
    }
  };

  const handleToggleActive = async (entry) => {
    try {
      await apiUpdateTraining(entry.id, { active: !entry.active });
      setTrainingEntries(p => p.map(e => e.id === entry.id ? { ...e, active: !e.active } : e));
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleDeleteTraining = async (id) => {
    if (!await confirmDelete()) return;
    try {
      await apiDeleteTraining(id);
      setTrainingEntries(p => p.filter(e => e.id !== id));
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleSaveEdit = async (id) => {
    try {
      await apiUpdateTraining(id, editForm);
      setTrainingEntries(p => p.map(e => e.id === id ? { ...e, ...editForm } : e));
      setEditingId(null);
    } catch (e) { alert("Error: " + e.message); }
  };

  const needsCase = activeAgent && agents.find(a => a.id === activeAgent)?.needsCase;
  const canRun = activeAgent && (!needsCase || selectedCaseId);

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">AI Center</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">Centralized AI-powered analysis tools</p>
          </div>
        </div>
      </div>
      <div className="content" style={{}}>
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid var(--c-border)" }}>
          <button onClick={() => setAiCenterTab("agents")} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors bg-transparent border-0 cursor-pointer -mb-[2px] flex items-center gap-1.5 ${aiCenterTab === "agents" ? "border-b-amber-500 text-amber-700 dark:text-amber-400" : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}><Sparkles size={15} /> AI Agents</button>
          <button onClick={() => setAiCenterTab("custom-agents")} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors bg-transparent border-0 cursor-pointer -mb-[2px] flex items-center gap-1.5 ${aiCenterTab === "custom-agents" ? "border-b-amber-500 text-amber-700 dark:text-amber-400" : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}><Bot size={16} /> Custom Agents</button>
          <button onClick={() => setAiCenterTab("trainer")} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors bg-transparent border-0 cursor-pointer -mb-[2px] flex items-center gap-1.5 ${aiCenterTab === "trainer" ? "border-b-amber-500 text-amber-700 dark:text-amber-400" : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}><Brain size={16} /> Advocate AI Trainer</button>
        </div>

        {aiCenterTab === "agents" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px,100%), 1fr))", gap: 14, marginBottom: 24 }}>
          {agents.map(a => (
            <div key={a.id} onClick={() => selectAgent(a.id)} className={`!rounded-xl !p-5 !cursor-pointer !transition-all !flex !flex-col !h-full ${activeAgent === a.id ? "!bg-indigo-50/50 dark:!bg-indigo-900/10 !border-2 !border-indigo-500 dark:!border-indigo-400 !shadow-sm" : "!bg-white dark:!bg-slate-800/50 !border !border-slate-200 dark:!border-slate-700 hover:!border-amber-300 dark:hover:!border-amber-500/50 hover:!shadow-sm"}`} style={{ boxShadow: activeAgent === a.id ? "0 1px 3px rgba(0,0,0,0.06)" : undefined }}>
              <div className={`w-9 h-9 rounded-lg ${a.bg} flex items-center justify-center mb-3`}><a.Icon className={`w-5 h-5 ${a.color}`} /></div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">{a.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">{a.desc}</div>
              {a.needsCase && <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-auto font-medium flex items-center gap-1"><Sparkles size={10} />Requires case selection</div>}
            </div>
          ))}
        </div>

        {activeAgent && (
          <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="font-['Inter'] text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3" style={{ paddingBottom: 12, borderBottom: "1px solid var(--c-border)" }}>
              {(() => { const ag = agents.find(a => a.id === activeAgent); return ag ? <div className={`w-8 h-8 rounded-lg ${ag.bg} flex items-center justify-center`}><ag.Icon className={`w-[18px] h-[18px] ${ag.color}`} /></div> : null; })()}
              <div>
                <div>{agents.find(a => a.id === activeAgent)?.title}</div>
                <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">{agents.find(a => a.id === activeAgent)?.desc}</div>
              </div>
            </div>

            {needsCase && (
              <div style={{ marginBottom: 16, position: "relative" }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Search Case</label>
                {selectedCase ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
                    <div style={{ flex: 1, fontSize: 13, color: "var(--c-text)" }}>
                      <strong>{selectedCase.clientName || selectedCase.title}</strong>
                      <span style={{ color: "var(--c-text2)", marginLeft: 6, fontSize: 11 }}>{selectedCase.stage} · {selectedCase.caseType}</span>
                    </div>
                    <button onClick={() => { setSelectedCaseId(""); setCaseSearch(""); setAiState({ loading: false, result: null, error: null }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#64748b", padding: "0 2px" }}>✕</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={caseSearch}
                      onChange={e => { setCaseSearch(e.target.value); setCaseDropOpen(true); }}
                      onFocus={() => setCaseDropOpen(true)}
                      placeholder="Type client name to search..."
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                    />
                    {caseDropOpen && (() => {
                      const q = caseSearch.toLowerCase().trim();
                      const filtered = (q ? activeCases.filter(c => (c.clientName || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q) || (c.caseNumber || "").toLowerCase().includes(q)) : activeCases).sort((a, b) => (a.clientName || a.title || "").localeCompare(b.clientName || b.title || ""));
                      const aiPIds = new Set(pinnedCaseIds);
                      const aiPinned = filtered.filter(c => aiPIds.has(c.id));
                      const aiOthers = filtered.filter(c => !aiPIds.has(c.id));
                      const selectCase = (c) => { setSelectedCaseId(String(c.id)); setCaseSearch(""); setCaseDropOpen(false); setAiState({ loading: false, result: null, error: null }); };
                      const aiItem = (c) => (
                        <div key={c.id} onClick={() => selectCase(c)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "var(--c-text)", borderBottom: "1px solid var(--c-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <div style={{ fontWeight: 500 }}>{c.clientName || c.title}</div>
                          <div style={{ fontSize: 11, color: "var(--c-text2)" }}>{c.caseNumber || "—"} · {c.stage} · {c.caseType}</div>
                        </div>
                      );
                      return (aiPinned.length > 0 || aiOthers.length > 0) ? (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: "0 0 6px 6px", maxHeight: 260, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          {aiPinned.length > 0 && <PinnedSectionHeader />}
                          {aiPinned.map(aiItem)}
                          {aiPinned.length > 0 && aiOthers.length > 0 && <div style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--c-bg)", borderBottom: "1px solid var(--c-border2)" }}>All Cases</div>}
                          {aiOthers.slice(0, 20).map(aiItem)}
                        </div>
                      ) : q ? (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: "0 0 6px 6px", padding: "12px", fontSize: 12, color: "var(--c-text2)", textAlign: "center" }}>No matching cases</div>
                      ) : null;
                    })()}
                  </>
                )}
              </div>
            )}

            {activeAgent === "draft" && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Document Type</label>
                  <select value={docType} onChange={e => { setDocType(e.target.value); if (e.target.value !== "Other") setDocTypeCustom(""); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" }}>
                    {["Demand Letter", "Settlement Demand", "Motion to Compel", "Motion for Summary Judgment", "Complaint/Petition", "Discovery Request", "Interrogatories", "Request for Production", "Deposition Notice", "Motion to Dismiss", "Continuance Request", "Daubert Motion", "Mediation Brief", "Trial Brief", "Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {docType === "Other" && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Specify Document Type</label>
                    <input type="text" value={docTypeCustom} onChange={e => setDocTypeCustom(e.target.value)} placeholder="e.g. Letter of Protection, Spoliation Letter, Subpoena Duces Tecum..." style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" }} />
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Additional Instructions (optional)</label>
                  <textarea value={docInstructions} onChange={e => setDocInstructions(e.target.value)} style={{ width: "100%", minHeight: 60, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 12, resize: "vertical", fontFamily: "inherit", background: "var(--c-bg)", color: "var(--c-text)" }} placeholder="e.g. Emphasize liability and causation, include medical treatment timeline, reference policy limits..." />
                </div>
              </>
            )}

            {activeAgent === "docsummary" && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Document Type</label>
                  <select value={docSummaryType} onChange={e => setDocSummaryType(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" }}>
                    {["Medical Records", "Police/Accident Report", "Insurance Correspondence", "Demand Letter", "Settlement Agreement", "Expert Report", "Witness Statement", "Discovery Material", "Billing Records", "Deposition Transcript", "Court Order", "Photograph/Video", "Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Paste Document Text</label>
                  <textarea value={docSummaryText} onChange={e => setDocSummaryText(e.target.value)} style={{ width: "100%", minHeight: 120, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 12, resize: "vertical", fontFamily: "inherit", background: "var(--c-bg)", color: "var(--c-text)" }} placeholder="Paste the text of the document you want summarized (police report, witness statement, lab report, etc.)..." />
                </div>
              </>
            )}

            {activeAgent === "filingclassifier" && selectedCaseId && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Select Filing to Classify</label>
                {aiCenterFilings.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--c-text2)", padding: "10px 0" }}>No filings found for this case. Upload filings in the case's Filings tab first.</div>
                ) : (
                  <select value={aiCenterSelectedFiling} onChange={e => { setAiCenterSelectedFiling(e.target.value); setAiCenterFilingResult(null); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" }}>
                    <option value="">— Select a filing —</option>
                    {aiCenterFilings.map(f => <option key={f.id} value={f.id}>{f.filename}{f.filedBy ? ` [${f.filedBy}]` : ""}{f.docType ? ` — ${f.docType}` : ""}</option>)}
                  </select>
                )}
              </div>
            )}

            {activeAgent === "batch" && (() => {
              const BATCH_OPS = [
                { id: "reassign-staff", label: "Staff Reassignment", desc: "Reassign cases from one staff member to another by role" },
                { id: "change-status", label: "Bulk Status Change", desc: "Change the status of multiple cases at once" },
                { id: "advance-stage", label: "Bulk Stage Advancement", desc: "Move cases from one stage to another" },
                { id: "update-court-date", label: "Bulk Court Date Update", desc: "Update the next court date for multiple cases" },
                { id: "transfer-division", label: "Division Transfer", desc: "Move cases to a different court division" },
              ];
              const ROLE_FIELDS = [
                { id: "assignedAttorney", label: "Assigned Attorney" },
                { id: "secondAttorney", label: "Second Attorney" },
                { id: "caseManager", label: "Case Manager" },
                { id: "investigator", label: "Investigator" },
                { id: "paralegal", label: "Paralegal" },
              ];
              const STATUSES = ["Active", "Pre-Litigation", "In Litigation", "Settled", "Closed", "Referred Out"];
              const STAGES = ["Intake", "Investigation", "Treatment", "Pre-Litigation Demand", "Negotiation", "Litigation Filed", "Discovery", "Mediation", "Trial Preparation", "Trial", "Settlement/Verdict", "Closed"];
              const DIVISIONS = ["Circuit", "District", "Juvenile"];
              const needsCaseSelect = ["change-status", "update-court-date", "transfer-division"].includes(batchOp);
              const bq = batchCaseSearch.toLowerCase().trim();
              const batchFilteredCases = bq ? allCases.filter(c => c.status !== "Closed" && c.deletedAt == null && ((c.clientName || "").toLowerCase().includes(bq) || (c.title || "").toLowerCase().includes(bq) || (c.caseNum || "").toLowerCase().includes(bq))) : [];
              const toggleCase = (c) => {
                setBatchSelectedCases(prev => prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]);
                setBatchPreview(null);
                setBatchApplied(null);
              };
              const canPreview = (() => {
                if (batchOp === "reassign-staff") return batchParams.fromUserId && batchParams.toUserId && batchParams.roleField && batchParams.fromUserId !== batchParams.toUserId;
                if (batchOp === "change-status") return batchSelectedCases.length > 0 && batchParams.newStatus;
                if (batchOp === "advance-stage") return batchParams.fromStage && batchParams.toStage && batchParams.fromStage !== batchParams.toStage;
                if (batchOp === "update-court-date") return batchSelectedCases.length > 0 && batchParams.newDate;
                if (batchOp === "transfer-division") return batchSelectedCases.length > 0 && batchParams.newDivision;
                return false;
              })();
              const handlePreview = async () => {
                setBatchLoading(true); setBatchPreview(null); setBatchApplied(null);
                try {
                  const payload = { operation: batchOp, ...batchParams };
                  if (needsCaseSelect) payload.caseIds = batchSelectedCases.map(c => c.id);
                  const res = await apiBatchPreview(payload);
                  setBatchPreview(res);
                } catch (e) { alert("Preview failed: " + e.message); }
                setBatchLoading(false);
              };
              const handleApply = async () => {
                if (!window.confirm(`Apply this batch operation to ${batchPreview.count} case${batchPreview.count === 1 ? "" : "s"}? This cannot be undone.`)) return;
                setBatchLoading(true);
                try {
                  const payload = { operation: batchOp, ...batchParams };
                  if (needsCaseSelect) payload.caseIds = batchSelectedCases.map(c => c.id);
                  const res = await apiBatchApply(payload);
                  setBatchApplied(res);
                  setBatchPreview(null);
                } catch (e) { alert("Batch operation failed: " + e.message); }
                setBatchLoading(false);
              };
              const labelStyle = { fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" };
              const selectStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" };
              return (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Operation</label>
                    <select value={batchOp} onChange={e => { setBatchOp(e.target.value); setBatchParams({}); setBatchPreview(null); setBatchApplied(null); setBatchSelectedCases([]); setBatchCaseSearch(""); setBatchFromStaffInput(""); setBatchFromStaffFocused(false); setBatchToStaffInput(""); setBatchToStaffFocused(false); }} style={selectStyle}>
                      {BATCH_OPS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <div style={{ fontSize: 11, color: "var(--c-text2)", marginTop: 4 }}>{BATCH_OPS.find(o => o.id === batchOp)?.desc}</div>
                  </div>

                  {batchOp === "reassign-staff" && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>Role to Reassign</label>
                        <select value={batchParams.roleField || ""} onChange={e => setBatchParams(p => ({ ...p, roleField: e.target.value }))} style={selectStyle}>
                          <option value="">Select role...</option>
                          {ROLE_FIELDS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>From Staff Member</label>
                        <BatchStaffPicker
                          staffList={batchStaffList}
                          value={batchParams.fromUserId || ""}
                          onChange={val => { setBatchParams(p => ({ ...p, fromUserId: val })); setBatchFromStaffInput(""); setBatchFromStaffFocused(false); }}
                          inputValue={batchFromStaffInput}
                          onInputChange={setBatchFromStaffInput}
                          focused={batchFromStaffFocused}
                          onFocusChange={setBatchFromStaffFocused}
                          inputRef={batchFromRef}
                          placeholder="Search staff..."
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>To Staff Member</label>
                        <BatchStaffPicker
                          staffList={batchStaffList.filter(u => String(u.id) !== String(batchParams.fromUserId))}
                          value={batchParams.toUserId || ""}
                          onChange={val => { setBatchParams(p => ({ ...p, toUserId: val })); setBatchToStaffInput(""); setBatchToStaffFocused(false); }}
                          inputValue={batchToStaffInput}
                          onInputChange={setBatchToStaffInput}
                          focused={batchToStaffFocused}
                          onFocusChange={setBatchToStaffFocused}
                          inputRef={batchToRef}
                          placeholder="Search staff..."
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>Status Filter (optional)</label>
                        <select value={batchParams.statusFilter || "All"} onChange={e => setBatchParams(p => ({ ...p, statusFilter: e.target.value }))} style={selectStyle}>
                          <option value="All">All Statuses</option>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {batchOp === "change-status" && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>New Status</label>
                        <select value={batchParams.newStatus || ""} onChange={e => setBatchParams(p => ({ ...p, newStatus: e.target.value }))} style={selectStyle}>
                          <option value="">Select status...</option>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {batchOp === "advance-stage" && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>From Stage</label>
                        <select value={batchParams.fromStage || ""} onChange={e => setBatchParams(p => ({ ...p, fromStage: e.target.value }))} style={selectStyle}>
                          <option value="">Select stage...</option>
                          {STAGES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>To Stage</label>
                        <select value={batchParams.toStage || ""} onChange={e => setBatchParams(p => ({ ...p, toStage: e.target.value }))} style={selectStyle}>
                          <option value="">Select stage...</option>
                          {STAGES.filter(s => s !== batchParams.fromStage).map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>Status Filter (optional)</label>
                        <select value={batchParams.statusFilter || "All"} onChange={e => setBatchParams(p => ({ ...p, statusFilter: e.target.value }))} style={selectStyle}>
                          <option value="All">All Statuses</option>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {batchOp === "update-court-date" && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>New Court Date</label>
                      <input type="date" value={batchParams.newDate || ""} onChange={e => setBatchParams(p => ({ ...p, newDate: e.target.value }))} style={selectStyle} />
                    </div>
                  )}

                  {batchOp === "transfer-division" && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>New Division</label>
                      <select value={batchParams.newDivision || ""} onChange={e => setBatchParams(p => ({ ...p, newDivision: e.target.value }))} style={selectStyle}>
                        <option value="">Select division...</option>
                        {DIVISIONS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  )}

                  {needsCaseSelect && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Select Cases ({batchSelectedCases.length} selected)</label>
                      <div style={{ position: "relative" }}>
                        <input type="text" value={batchCaseSearch} onChange={e => setBatchCaseSearch(e.target.value)} placeholder="Search cases by client, title, or case number..." style={{ ...selectStyle, marginBottom: 4 }} />
                        {bq && batchFilteredCases.length > 0 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: "0 0 6px 6px", maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                            {batchFilteredCases.slice(0, 20).map(c => {
                              const sel = batchSelectedCases.find(x => x.id === c.id);
                              return (
                                <div key={c.id} onClick={() => { toggleCase(c); setBatchCaseSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "var(--c-text)", borderBottom: "1px solid var(--c-border)", background: sel ? "var(--c-bg)" : "transparent", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--c-bg)"; }} onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                                  <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{sel ? "✓" : ""}</span>
                                  <div>
                                    <div style={{ fontWeight: 500 }}>{c.clientName || c.title}</div>
                                    <div style={{ fontSize: 11, color: "var(--c-text2)" }}>{c.caseNum || "—"} · {c.status} · {c.stage}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {batchSelectedCases.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          {batchSelectedCases.map(c => (
                            <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, background: "var(--c-bg)", border: "1px solid var(--c-border)", fontSize: 11, color: "var(--c-text)" }}>
                              {c.clientName || c.title}
                              <button onClick={() => toggleCase(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#e05252", padding: 0, lineHeight: 1 }}>✕</button>
                            </span>
                          ))}
                          <button onClick={() => { setBatchSelectedCases([]); setBatchPreview(null); }} style={{ fontSize: 11, color: "#e05252", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear all</button>
                        </div>
                      )}
                    </div>
                  )}

                  {!batchPreview && !batchApplied && (
                    <button className="btn btn-gold" style={{ width: "100%", opacity: canPreview ? 1 : 0.5 }} disabled={!canPreview || batchLoading} onClick={handlePreview}>
                      {batchLoading ? "Loading..." : "Preview Changes"}
                    </button>
                  )}

                  {batchPreview && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--c-text-h)", marginBottom: 8 }}>
                        Preview: {batchPreview.count} case{batchPreview.count === 1 ? "" : "s"} will be affected
                      </div>
                      {batchPreview.count === 0 ? (
                        <div style={{ padding: 16, textAlign: "center", color: "var(--c-text2)", fontSize: 13 }}>No cases match the selected criteria</div>
                      ) : (
                        <>
                          <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--c-border)", borderRadius: 6, marginBottom: 12 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                              <thead>
                                <tr style={{ background: "var(--c-bg)", position: "sticky", top: 0 }}>
                                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--c-text2)", borderBottom: "1px solid var(--c-border)" }}>Case</th>
                                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--c-text2)", borderBottom: "1px solid var(--c-border)" }}>Client</th>
                                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--c-text2)", borderBottom: "1px solid var(--c-border)" }}>Current</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batchPreview.cases.slice(0, 50).map(c => (
                                  <tr key={c.id} style={{ borderBottom: "1px solid var(--c-border)" }}>
                                    <td style={{ padding: "6px 10px", color: "var(--c-text)" }}>{c.caseNum || c.title}</td>
                                    <td style={{ padding: "6px 10px", color: "var(--c-text)" }}>{c.clientName || "—"}</td>
                                    <td style={{ padding: "6px 10px", color: "var(--c-text2)", fontSize: 11 }}>
                                      {batchOp === "reassign-staff" && (c.currentStaffName || "—")}
                                      {batchOp === "change-status" && c.status}
                                      {batchOp === "advance-stage" && c.stage}
                                      {batchOp === "update-court-date" && (c.nextCourtDate ? new Date(c.nextCourtDate).toLocaleDateString() : "Not set")}
                                      {batchOp === "change-jurisdiction" && (c.stateJurisdiction || "—")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {batchPreview.cases.length > 50 && (
                              <div style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, color: "var(--c-text2)" }}>...and {batchPreview.cases.length - 50} more</div>
                            )}
                          </div>
                          {batchOp === "reassign-staff" && batchPreview.fromUserName && batchPreview.toUserName && (
                            <div style={{ fontSize: 12, color: "var(--c-text)", marginBottom: 12, padding: "8px 12px", background: "var(--c-bg)", borderRadius: 6 }}>
                              <strong>{batchPreview.fromUserName}</strong> → <strong>{batchPreview.toUserName}</strong>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setBatchPreview(null)}>Cancel</button>
                            <button className="btn" style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none" }} disabled={batchLoading} onClick={handleApply}>
                              {batchLoading ? "Applying..." : `Apply to ${batchPreview.count} Case${batchPreview.count === 1 ? "" : "s"}`}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {batchApplied && (
                    <div style={{ marginTop: 16, padding: 16, background: "#dcfce7", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#166534", marginBottom: 4 }}>Batch Operation Complete</div>
                      <div style={{ fontSize: 13, color: "#15803d" }}>{batchApplied.message}</div>
                      <button className="btn btn-outline btn-sm" style={{ marginTop: 12, fontSize: 11 }} onClick={() => { setBatchApplied(null); setBatchPreview(null); setBatchParams({}); setBatchSelectedCases([]); setBatchCaseSearch(""); setBatchFromStaffInput(""); setBatchFromStaffFocused(false); setBatchToStaffInput(""); setBatchToStaffFocused(false); }}>Start New Operation</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {activeAgent === "transcription" && selectedCaseId && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Upload Audio for Transcription</label>
                <p style={{ fontSize: 11, color: "var(--c-text2)", marginBottom: 8 }}>Upload an audio or video file for transcription. Supports MP3, WAV, M4A, OGG, FLAC, AAC, WebM, MP4, MOV, and AVI (up to 100MB). You can also drag & drop files.</p>
                <DragDropZone accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.aac,.flac,.mov,.avi,audio/*,video/*" onFileSelect={(files) => {
                  const fileInput = document.getElementById("ai-transcript-upload-input");
                  if (fileInput && files[0]) {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    fileInput.files = dt.files;
                  }
                }}>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fileInput = e.target.querySelector('input[type="file"]');
                  const file = fileInput.files[0];
                  if (!file) return;
                  setAiState({ loading: true, result: null, error: null });
                  try {
                    let saved;
                    if (file.size > 20 * 1024 * 1024) {
                      saved = await apiUploadTranscriptChunked(file, Number(selectedCaseId), (pct) => {
                        setAiState(prev => ({ ...prev, result: `Uploading... ${pct}%` }));
                      });
                    } else {
                      const formData = new FormData();
                      formData.append("audio", file);
                      formData.append("caseId", selectedCaseId);
                      saved = await apiUploadTranscript(formData);
                    }
                    fileInput.value = "";
                    setAiState({ loading: false, result: `Transcription started for "${saved.filename}". The file is now being processed — you can view the progress and results under Documents > Transcripts in the case detail overlay.`, error: null });
                  } catch (err) {
                    setAiState({ loading: false, result: null, error: err.message });
                  }
                }} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <input id="ai-transcript-upload-input" type="file" accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.aac,.flac,.mov,.avi,audio/*,video/*" style={{ fontSize: 12, width: "100%" }} />
                  </div>
                  <button type="submit" disabled={aiState.loading} className="!py-2 !px-4 !text-sm !font-semibold !text-slate-900 !bg-amber-400 hover:!bg-amber-500 !rounded-lg !transition-colors !cursor-pointer !border-none !flex !items-center !gap-2 !shadow-sm" style={{ opacity: aiState.loading ? 0.5 : 1 }}>
                    {aiState.loading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload & Transcribe</>}
                  </button>
                </form>
                </DragDropZone>
              </div>
            )}

            {activeAgent !== "batch" && activeAgent !== "transcription" && !aiState.result && !aiState.loading && (
              <button className="!w-full !py-2.5 !text-sm !font-medium !text-white !bg-slate-500 dark:!bg-slate-600 hover:!bg-slate-600 dark:hover:!bg-slate-500 !rounded-md !transition-colors !cursor-pointer !border-none !flex !items-center !justify-center !gap-2" style={{ opacity: (activeAgent === "docsummary" ? (canRun && docSummaryText.trim()) : (activeAgent === "filingclassifier" ? (canRun && aiCenterSelectedFiling) : canRun)) ? 1 : 0.5 }} disabled={activeAgent === "docsummary" ? !(canRun && docSummaryText.trim()) : (activeAgent === "filingclassifier" ? !(canRun && aiCenterSelectedFiling) : !canRun)} onClick={() => runAgent(activeAgent)}>
                <Sparkles size={14} /> Run {agents.find(a => a.id === activeAgent)?.title}
              </button>
            )}

            {(aiState.loading || aiState.result || aiState.error) && aiState.result !== "__TASK_SUGGESTIONS__" && aiState.result !== "__FILING_CLASSIFIER__" && !(aiState.loading && activeAgent === "tasksuggestions") && !(aiState.loading && activeAgent === "filingclassifier") && (
              <AiPanel title={agents.find(a => a.id === activeAgent)?.title} result={aiState.result} loading={aiState.loading} error={aiState.error}
                onRun={() => runAgent(activeAgent)}
                actions={aiState.result ? (
                  <button className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors" style={{ fontSize: 11, padding: "3px 10px", fontWeight: 500 }} onClick={() => { navigator.clipboard.writeText(aiState.result); }}>Copy</button>
                ) : null}
              />
            )}
            {aiState.result === "__TASK_SUGGESTIONS__" && aiCenterTasks.tasks.length > 0 && (
              <div className="card" style={{ marginTop: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div className="font-['Inter'] text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"><Sparkles size={14} className="text-amber-500" /> Suggested Tasks ({aiCenterTasks.tasks.length})</div>
                  {aiCenterTasks.tasks.some((_, i) => !aiCenterTasks.added[i]) && (
                    <button className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer" onClick={async () => {
                      const newAdded = { ...aiCenterTasks.added };
                      for (let i = 0; i < aiCenterTasks.tasks.length; i++) {
                        if (!aiCenterTasks.added[i]) {
                          const s = aiCenterTasks.tasks[i];
                          const dueDate = s.dueInDays ? new Date(Date.now() + s.dueInDays * 86400000).toISOString().split("T")[0] : null;
                          try {
                            await apiCreateTask({ caseId: Number(selectedCaseId), title: s.title, priority: s.priority || "Medium", assignedRole: s.assignedRole || "", due: dueDate, notes: s.rationale || "", isGenerated: true });
                            newAdded[i] = true;
                          } catch (err) { console.error(err); }
                        }
                      }
                      setAiCenterTasks(p => ({ ...p, added: newAdded }));
                    }}>+ Add All to Case</button>
                  )}
                </div>
                {aiCenterTasks.tasks.map((s, i) => {
                  const isAdded = aiCenterTasks.added[i];
                  const priorityColors = { Urgent: "#e05252", High: "#e88c30", Medium: "#d97706", Low: "#2F7A5F" };
                  const priorityDarkBg = { Urgent: "#fca5a5", High: "#fdba74", Medium: "#93c5fd", Low: "#cbd5e1" };
                  const dk = isDarkMode();
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--c-border)", opacity: isAdded ? 0.45 : 1 }}>
                      <span style={{ fontSize: 12, marginTop: 1 }}>{isAdded ? "✓" : ""}{!isAdded && <Sparkles size={12} className="text-amber-500" />}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--c-text-h)", fontWeight: 500 }}>{s.title}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: dk ? (priorityDarkBg[s.priority] || "#cbd5e1") : (priorityColors[s.priority] || "#d97706") + "18", color: dk ? "#1a1a1a" : (priorityColors[s.priority] || "#d97706") }}>{s.priority}</span>
                          {s.assignedRole && <span style={{ fontSize: 10, color: "#64748b" }}>{s.assignedRole}</span>}
                          {s.dueInDays && <span style={{ fontSize: 10, color: "#64748b" }}>· Due in {s.dueInDays} days</span>}
                        </div>
                        {s.rationale && <div style={{ fontSize: 11, color: "var(--c-text2)", marginTop: 4, lineHeight: 1.4 }}>{s.rationale}</div>}
                      </div>
                      {!isAdded && (
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "2px 8px", flexShrink: 0 }} onClick={async () => {
                          const dueDate = s.dueInDays ? new Date(Date.now() + s.dueInDays * 86400000).toISOString().split("T")[0] : null;
                          try {
                            await apiCreateTask({ caseId: Number(selectedCaseId), title: s.title, priority: s.priority || "Medium", assignedRole: s.assignedRole || "", due: dueDate, notes: s.rationale || "", isGenerated: true });
                            setAiCenterTasks(p => ({ ...p, added: { ...p.added, [i]: true } }));
                          } catch (err) { alert("Failed: " + err.message); }
                        }}>+ Add</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {aiState.loading && activeAgent === "tasksuggestions" && (
              <AiPanel title="Task Suggestions" result={null} loading={true} error={null} />
            )}
            {aiState.result === "__FILING_CLASSIFIER__" && aiCenterFilingResult && (
              <div className="card" style={{ marginTop: 16, padding: 20 }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 12 }}>📁 Classification Result</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Suggested Name:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{aiCenterFilingResult.suggestedName || "—"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {aiCenterFilingResult.filedBy && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Filed By:</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: { Plaintiff: "#DC2626", Defendant: "#2563EB", Court: "#059669", Other: "#6B7280" }[aiCenterFilingResult.filedBy] || "#6B7280", borderRadius: 4, padding: "2px 7px", textTransform: "uppercase" }}>{aiCenterFilingResult.filedBy}</span>
                      </div>
                    )}
                    {aiCenterFilingResult.docType && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Type:</span>
                        <span style={{ fontSize: 11, color: "var(--c-text)" }}>{aiCenterFilingResult.docType}</span>
                      </div>
                    )}
                    {aiCenterFilingResult.filingDate && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Filing Date:</span>
                        <span style={{ fontSize: 11, color: "var(--c-text)" }}>{aiCenterFilingResult.filingDate}</span>
                      </div>
                    )}
                  </div>
                  {aiCenterFilingResult.summary && (
                    <div style={{ fontSize: 12, color: "var(--c-text)", lineHeight: 1.6, marginTop: 4, padding: 12, background: "var(--c-bg)", borderRadius: 8, border: "1px solid var(--c-border)" }}>{aiCenterFilingResult.summary}</div>
                  )}
                </div>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 12, fontSize: 11 }} onClick={() => { setAiState({ loading: false, result: null, error: null }); setAiCenterFilingResult(null); }}>Classify Another</button>
              </div>
            )}
            {aiState.loading && activeAgent === "filingclassifier" && (
              <AiPanel title="Filing Classifier" result={null} loading={true} error={null} />
            )}
          </div>
        )}

        {!activeAgent && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--c-text2)", fontSize: 13 }}>
            Select an AI agent above to get started
          </div>
        )}
        </>}

        {aiCenterTab === "custom-agents" && <CustomAgentsTab currentUser={currentUser} allCases={allCases} pinnedCaseIds={pinnedCaseIds} />}

        {aiCenterTab === "trainer" && (
          <>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--c-text2)", lineHeight: 1.6 }}>
              Add instructions or upload documents to customize how AI agents work. You can target training to specific agents, or apply it to all. <strong style={{ color: "var(--c-text)" }}>Advocate AI always receives all training</strong> since it is a general-purpose assistant.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--c-border)" }}>
                <button onClick={() => setTrainingTab("personal")} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "none", color: trainingTab === "personal" ? "#2563eb" : "var(--c-text2)", borderBottom: trainingTab === "personal" ? "2px solid #2563eb" : "2px solid transparent", marginBottom: -1 }}>My Training</button>
                <button onClick={() => setTrainingTab("office")} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "none", color: trainingTab === "office" ? "#059669" : "var(--c-text2)", borderBottom: trainingTab === "office" ? "2px solid #059669" : "2px solid transparent", marginBottom: -1 }}>Office Training</button>
              </div>
              {(trainingTab === "personal" || canOffice) && (
                <button className="btn btn-sm" style={{ background: "#6366f1", color: "#fff", border: "none", fontSize: 12 }} onClick={() => { setShowAddTraining(true); setAddForm(f => ({ ...f, scope: trainingTab })); }}>+ Add Training</button>
              )}
            </div>

            {(() => {
              const userId = currentUser?.id;
              const filtered = trainingEntries.filter(e => trainingTab === "personal" ? (e.scope === "personal" && e.user_id === userId) : e.scope === "office");
              if (filtered.length === 0) return (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--c-text2)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🧠</div>
                  <div style={{ fontSize: 13 }}>{trainingTab === "personal" ? "No personal training entries yet. Add instructions to customize AI for your workflow." : "No office-wide training entries yet." + (canOffice ? " Add guidelines that apply to all staff." : "")}</div>
                </div>
              );
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.map(entry => {
                    const isEditing = editingId === entry.id;
                    const isOwner = entry.user_id === userId;
                    const canEdit = entry.scope === "personal" ? isOwner : canOffice;
                    return (
                      <div key={entry.id} style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "14px 16px", opacity: entry.active ? 1 : 0.5, transition: "opacity 0.15s" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={{ fontSize: 13, fontWeight: 600, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }} />
                            <select value={editForm.category || "General"} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}>
                              {TRAINING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            {entry.source_type === "text" && (
                              <textarea value={editForm.content || ""} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} style={{ fontSize: 12, minHeight: 100, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical", fontFamily: "inherit" }} />
                            )}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 500, color: "var(--c-text2)", marginBottom: 4, display: "block" }}>Target Agents</label>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {TRAINING_AGENT_OPTIONS.map(opt => {
                                  const eTa = editForm.target_agents || ["all"];
                                  const isAll = eTa.includes("all");
                                  const isSel = isAll || eTa.includes(opt.id);
                                  return (
                                    <button key={opt.id} type="button" onClick={() => {
                                      setEditForm(f => {
                                        const cur = f.target_agents || ["all"];
                                        if (opt.id === "all") return { ...f, target_agents: ["all"] };
                                        let next = cur.filter(a => a !== "all");
                                        if (next.includes(opt.id)) { next = next.filter(a => a !== opt.id); if (next.length === 0) next = ["all"]; } else { next = [...next, opt.id]; }
                                        return { ...f, target_agents: next };
                                      });
                                    }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, border: `1px solid ${isSel ? "#6366f1" : "var(--c-border)"}`, background: isSel ? "#6366f118" : "transparent", color: isSel ? "#6366f1" : "var(--c-text2)", cursor: "pointer", fontWeight: isSel ? 600 : 400 }}>
                                      {isSel ? "✓ " : ""}{opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => setEditingId(null)}>Cancel</button>
                              <button className="btn btn-sm" style={{ fontSize: 11, background: "#6366f1", color: "#fff", border: "none" }} onClick={() => handleSaveEdit(entry.id)}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)" }}>{entry.title}</span>
                                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: entry.scope === "office" ? "#05966918" : "#2563eb18", color: entry.scope === "office" ? "#059669" : "#2563eb" }}>{entry.scope === "office" ? "Office" : "Personal"}</span>
                                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--c-bg)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}>{entry.category}</span>
                                  <span style={{ fontSize: 10, color: "#64748b" }}>{entry.source_type === "document" ? "📄" : "📝"}</span>
                                  {(() => {
                                    const ta = entry.target_agents || ["all"];
                                    if (ta.includes("all")) return <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#6366f118", color: "#6366f1", fontWeight: 500 }}>All Agents</span>;
                                    return ta.map(a => {
                                      const opt = TRAINING_AGENT_OPTIONS.find(o => o.id === a);
                                      return <span key={a} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#6366f118", color: "#6366f1", fontWeight: 500 }}>{opt ? opt.label : a}</span>;
                                    });
                                  })()}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--c-text2)", lineHeight: 1.5, maxHeight: 60, overflow: "hidden" }}>
                                  {entry.source_type === "document" && entry.filename && <span style={{ fontSize: 11, color: "#64748b", marginRight: 6 }}>[{entry.filename}]</span>}
                                  {(entry.content || "").substring(0, 150)}{(entry.content || "").length > 150 ? "..." : ""}
                                </div>
                                {entry.created_by_name && <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Added by {entry.created_by_name}</div>}
                              </div>
                              {canEdit && (
                                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
                                  <button onClick={() => handleToggleActive(entry)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px", color: entry.active ? "#059669" : "#64748b" }} title={entry.active ? "Active — click to disable" : "Inactive — click to enable"}>{entry.active ? "✓" : "○"}</button>
                                  <button onClick={() => { setEditingId(entry.id); setEditForm(entry.source_type === "document" ? { title: entry.title, category: entry.category, target_agents: entry.target_agents || ["all"] } : { title: entry.title, category: entry.category, content: entry.content, target_agents: entry.target_agents || ["all"] }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px 4px", color: "#64748b" }}>✎</button>
                                  <button onClick={() => handleDeleteTraining(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px 4px", color: "#e05252" }}>✕</button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {showAddTraining && (
              <div className="modal-overlay">
                <div className="modal" style={{ maxWidth: 540 }}>
                  <div className="modal-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Add Agent Training</span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setShowAddTraining(false)}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--c-border)" }}>
                    <button onClick={() => setAddMode("text")} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "none", color: addMode === "text" ? "#6366f1" : "var(--c-text2)", borderBottom: addMode === "text" ? "2px solid #6366f1" : "2px solid transparent", marginBottom: -1 }}>📝 Write Instructions</button>
                    <button onClick={() => setAddMode("document")} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "none", color: addMode === "document" ? "#6366f1" : "var(--c-text2)", borderBottom: addMode === "document" ? "2px solid #6366f1" : "2px solid transparent", marginBottom: -1 }}>📄 Upload Document</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Title</label>
                      <input value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} placeholder={addMode === "text" ? "e.g., Judge Thompson prefers brief motions" : "e.g., Local Court Rules Reference"} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Category</label>
                        <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" }}>
                          {TRAINING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Scope</label>
                        <select value={addForm.scope} onChange={e => setAddForm(f => ({ ...f, scope: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg)", color: "var(--c-text)" }}>
                          <option value="personal">Personal (just me)</option>
                          {canOffice && <option value="office">Office-wide (everyone)</option>}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 6, display: "block" }}>Target Agents</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {TRAINING_AGENT_OPTIONS.map(opt => {
                          const isAll = addForm.target_agents.includes("all");
                          const isSelected = isAll || addForm.target_agents.includes(opt.id);
                          return (
                            <button key={opt.id} type="button" onClick={() => {
                              setAddForm(f => {
                                if (opt.id === "all") return { ...f, target_agents: ["all"] };
                                let next = f.target_agents.filter(a => a !== "all");
                                if (next.includes(opt.id)) {
                                  next = next.filter(a => a !== opt.id);
                                  if (next.length === 0) next = ["all"];
                                } else {
                                  next = [...next, opt.id];
                                }
                                return { ...f, target_agents: next };
                              });
                            }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1px solid ${isSelected ? "#6366f1" : "var(--c-border)"}`, background: isSelected ? "#6366f118" : "transparent", color: isSelected ? "#6366f1" : "var(--c-text2)", cursor: "pointer", fontWeight: isSelected ? 600 : 400, transition: "all 0.15s" }}>
                              {isSelected ? "✓ " : ""}{opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Advocate AI always receives all training regardless of selection</div>
                    </div>
                    {addMode === "text" ? (
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Instructions</label>
                        <textarea value={addForm.content} onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))} placeholder="Write specific instructions, guidelines, or knowledge that should inform AI agents. For example: local court rules, office procedures, defense strategies, or judge preferences." style={{ width: "100%", minHeight: 150, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 12, resize: "vertical", fontFamily: "inherit", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }} />
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text)", marginBottom: 4, display: "block" }}>Upload File (PDF, TXT, DOCX)</label>
                        <input type="file" accept=".pdf,.txt,.docx" onChange={e => setAddFile(e.target.files[0])} style={{ fontSize: 12, color: "var(--c-text)" }} />
                        {addFile && <div style={{ fontSize: 11, color: "var(--c-text2)", marginTop: 4 }}>Selected: {addFile.name}</div>}
                      </div>
                    )}
                    <button className="btn" style={{ width: "100%", background: "#6366f1", color: "#fff", border: "none" }} disabled={addSaving} onClick={handleAddTraining}>{addSaving ? "Saving..." : "Add Training"}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Staff View ───────────────────────────────────────────────────────────────
// ─── Time Log View ────────────────────────────────────────────────────────────

export default AiCenterView;
