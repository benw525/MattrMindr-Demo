import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { Menu, Search, Plus, Pin, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import {
  apiDeleteCase,
  apiRestoreCase,
  apiGetNotes,
  apiCreateNote,
  apiUpdateNote,
  apiDeleteNote,
  apiGetLinks,
  apiCreateLink,
  apiDeleteLink,
  apiGetActivity,
  apiCreateActivity,
  apiAiSearch,
  apiCaseTriage,
  apiGetDeletedCases,
} from "../api.js";
import {
  fmt,
  Badge,
  getUserById,
  SortTh,
  AiPanel,
  StaffSearchPicker,
  USERS,
  PAGE_SIZE,
} from "../shared.js";
import { NewCaseModal } from "../shared.js";
import { GenerateDocumentModal } from "./DocumentsView.js";
import { CaseDetailOverlay, CasePrintView } from "./CaseDetailView.js";

const CONTACT_CATEGORIES = ["Client", "Prosecutor", "Judge", "Court", "Witness", "Expert", "Family Member", "Social Worker", "Treatment Provider"];
const CONTACT_CAT_STYLE = {
  Client: { bg: "#f1f5f9", color: "#2563eb", border: "#e2e8f0" },
  Prosecutor: { bg: "#fef9c3", color: "#92400e", border: "#fef9c3" },
  Judge: { bg: "#f3e8ff", color: "#7c3aed", border: "#f3e8ff" },
  Court: { bg: "#f3e8ff", color: "#7c3aed", border: "#f3e8ff" },
  Witness: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Expert: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "Family Member": { bg: "#ffe4e6", color: "#dc2626", border: "#fecdd3" },
  "Social Worker": { bg: "#f1f5f9", color: "#2563eb", border: "#e2e8f0" },
  "Treatment Provider": { bg: "#ccfbf1", color: "#0d9488", border: "#ccfbf1" },
  Miscellaneous: { bg: "#f1f5f9", color: "#6B7280", border: "#e2e8f0" },
};
const PI_DEADLINE_TYPES = [
  "Filing", "Discovery", "Motion", "Expert", "Pleading", "Hearing", "Trial", "Deposition", "Mediation",
  "Statute of Limitations", "Demand Letter", "Complaint", "Answer", "Service of Process",
  "Initial Disclosures", "Interrogatories", "Requests for Production", "Requests for Admission",
  "Independent Medical Exam", "Case Management Conference", "Pretrial Conference",
  "Settlement Conference", "Arbitration", "Court Appearance", "Status Conference",
  "Scheduling Order", "Motion to Compel", "Summary Judgment", "Motions in Limine",
  "Jury Selection", "Client Meeting", "Medical Records Request", "Medical Records Follow-Up",
  "Insurance Claim", "PIP/MedPay Deadline", "UM/UIM Claim", "Lien Resolution",
  "Demand Package", "Policy Limits Demand", "Offer Response", "Treatment Completion",
  "Maximum Medical Improvement", "Letter of Protection", "Subpoena",
  "Appeal Deadline", "Post-Trial Motion", "Case Review", "Follow-Up", "Other"
];
function CasesView({ currentUser, allCases, tasks, selectedCase, setSelectedCase: rawSetSelectedCase, pendingTab, clearPendingTab, onAddRecord, onUpdateCase, onCompleteTask, onAddTask, deadlines, caseNotes, setCaseNotes, caseLinks, setCaseLinks, caseActivity, setCaseActivity, deletedCases, setDeletedCases, onDeleteCase, onRestoreCase, onAddDeadline, onUpdateDeadline, onDeleteDeadline, onMenuToggle, pinnedCaseIds: pinnedIds, onTogglePinnedCase: togglePin, onOpenAdvocate, onOpenTrialCenter, confirmDelete, openAppDocViewer, openAppFilingViewer, openBlobInViewer, openTranscriptViewer }) {
  const setSelectedCase = useCallback((c) => { if (clearPendingTab) clearPendingTab(); rawSetSelectedCase(c); }, [clearPendingTab, rawSetSelectedCase]);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [attyFilter, setAttyFilter] = useState(String(currentUser.id));
  const [staffInput, setStaffInput] = useState("");
  const [staffFocused, setStaffFocused] = useState(false);
  const staffSearchRef = useRef(null);
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [sortCol, setSortCol] = useState("accidentDate");
  const [sortDir, setSortDir] = useState("desc");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [triageResults, setTriageResults] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageShow, setTriageShow] = useState(false);
  const [aiError, setAiError] = useState("");
  const [pinnedExpanded, setPinnedExpanded] = useState(true);

  const pinnedCases = useMemo(() => pinnedIds.map(id => allCases.find(c => c.id === id)).filter(Boolean), [pinnedIds, allCases]);

  const runAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiResults(null);
    try {
      const data = await apiAiSearch(aiQuery.trim());
      setAiResults(data.results || []);
    } catch (err) {
      setAiError(err.message || "AI search failed");
    } finally {
      setAiLoading(false);
    }
  };

  // Load notes/links/activity from API when a case is opened
  useEffect(() => {
    if (!selectedCase) return;
    const caseId = selectedCase.id;
    Promise.all([
      apiGetNotes(caseId),
      apiGetLinks(caseId),
      apiGetActivity(caseId),
    ]).then(([notes, links, activity]) => {
      setCaseNotes(prev => ({ ...prev, [caseId]: notes }));
      setCaseLinks(prev => ({ ...prev, [caseId]: links }));
      setCaseActivity(prev => ({ ...prev, [caseId]: activity }));
    }).catch(err => console.error("Failed to load case data:", err));
  }, [selectedCase?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load deleted cases from API when Deleted tab is first opened
  useEffect(() => {
    if (statusFilter !== "Deleted" || deletedCases !== null) return;
    setDeletedLoading(true);
    apiGetDeletedCases()
      .then(rows => setDeletedCases(rows))
      .catch(err => console.error("Failed to load deleted cases:", err))
      .finally(() => setDeletedLoading(false));
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteFromOverlay = async (id) => {
    try {
      const deleted = await apiDeleteCase(id);
      setDeletedCases(p => p !== null ? [deleted, ...p] : [deleted]);
      onDeleteCase(id);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleRestoreDeleted = async (id) => {
    try {
      const restored = await apiRestoreCase(id);
      onRestoreCase(restored);
    } catch (err) {
      alert("Failed to restore: " + err.message);
    }
  };

  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };

  const filtered = useMemo(() => {
    let list = allCases.filter(c => {
      if (statusFilter !== "All" && statusFilter !== "Deleted" && c.status !== statusFilter) return false;
      if (attyFilter !== "All") { const fid = Number(attyFilter); if (![c.assignedAttorney, c.secondAttorney, c.caseManager, c.investigator, c.paralegal].includes(fid)) return false; }
      if (divisionFilter !== "All" && c.stateJurisdiction !== divisionFilter) return false;
      if (stageFilter !== "All" && c.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title?.toLowerCase().includes(q) || (c.caseNum || "").toLowerCase().includes(q) || (c.clientName || "").toLowerCase().includes(q) || (c.county || "").toLowerCase().includes(q) || (c.court || "").toLowerCase().includes(q) || (c.injuryType || "").toLowerCase().includes(q) || (c.stateJurisdiction || "").toLowerCase().includes(q);
      }
      return true;
    });
    list.sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "title") { av = a.clientName || a.title || ""; bv = b.clientName || b.title || ""; }
      else if (sortCol === "caseNum") { av = a.caseNum || ""; bv = b.caseNum || ""; }
      else if (sortCol === "defendant") { av = a.clientName || ""; bv = b.clientName || ""; }
      else if (sortCol === "stage") {
        const STAGE_ORDER = { "Intake": 0, "Investigation": 1, "Treatment": 2, "Pre-Litigation Demand": 3, "Negotiation": 4, "Litigation Filed": 5, "Discovery": 6, "Mediation": 7, "Trial Preparation": 8, "Trial": 9, "Settlement/Verdict": 10, "Closed": 11 };
        const ai = STAGE_ORDER[a.stage] ?? 99, bi = STAGE_ORDER[b.stage] ?? 99;
        return (sortDir === "asc" ? 1 : -1) * (ai - bi);
      }
      else if (sortCol === "trialDate") { av = a.trialDate || "9999"; bv = b.trialDate || "9999"; }
      else if (sortCol === "accidentDate") { av = a.accidentDate || "9999"; bv = b.accidentDate || "9999"; }
      else if (sortCol === "lead") { av = getUserById(a.assignedAttorney)?.name || ""; bv = getUserById(b.assignedAttorney)?.name || ""; }
      return (sortDir === "asc" ? 1 : -1) * av.localeCompare(bv);
    });
    return list;
  }, [allCases, statusFilter, attyFilter, divisionFilter, stageFilter, search, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search, statusFilter, attyFilter, divisionFilter, stageFilter, sortCol]);

  const caseTasks = useMemo(() => selectedCase ? tasks.filter(t => t.caseId === selectedCase.id) : [], [tasks, selectedCase]);
  const caseDeadlines = useMemo(() => selectedCase ? deadlines.filter(d => d.caseId === selectedCase.id) : [], [deadlines, selectedCase]);
  const notes = selectedCase ? (caseNotes[selectedCase.id] || []) : [];
  const [showPrint, setShowPrint] = useState(false);

  const allStaff = useMemo(() => {
    const fields = ["assignedAttorney", "secondAttorney", "caseManager", "investigator", "paralegal"];
    const assignedIds = new Set();
    allCases.forEach(c => fields.forEach(f => { if (c[f] > 0) assignedIds.add(c[f]); }));
    assignedIds.add(currentUser.id);
    return USERS.filter(u => assignedIds.has(u.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCases, currentUser.id]);
  const selectedStaffName = useMemo(() => {
    if (attyFilter === "All") return "";
    const u = USERS.find(u => u.id === Number(attyFilter));
    return u ? u.name : "";
  }, [attyFilter]);
  const staffDisplayValue = staffFocused ? staffInput : selectedStaffName;
  const staffSuggestions = useMemo(() => {
    if (!staffInput.trim()) return allStaff;
    const q = staffInput.toLowerCase();
    return allStaff.filter(u => u.name.toLowerCase().includes(q));
  }, [allStaff, staffInput]);

  return (
    <>
      {showModal && <NewCaseModal onSave={onAddRecord} onClose={() => setShowModal(false)} />}
      {showPrint && selectedCase && (
        <CasePrintView c={selectedCase} notes={notes} tasks={caseTasks} deadlines={caseDeadlines} links={caseLinks[selectedCase.id] || []} onClose={() => setShowPrint(false)} />
      )}
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Cases</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{filtered.length} of {allCases.length} · {allCases.filter(c => c.status === "Active").length} active</p>
          </div>
        </div>
        <div className="topbar-actions">
          <select className="!text-sm !border-slate-200 dark:!border-slate-700 !rounded-lg !bg-white dark:!bg-slate-800 !text-slate-700 dark:!text-slate-300" style={{ width: 160 }} value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}>
            <option value="All">All States</option>
            {[...new Set(allCases.map(c => c.stateJurisdiction).filter(Boolean))].sort().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="!text-sm !border-slate-200 dark:!border-slate-700 !rounded-lg !bg-white dark:!bg-slate-800 !text-slate-700 dark:!text-slate-300" style={{ width: 160 }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option value="All">All Stages</option>
            {["Intake", "Investigation", "Treatment", "Pre-Litigation Demand", "Negotiation", "Litigation Filed", "Discovery", "Mediation", "Trial Preparation", "Trial", "Settlement/Verdict", "Closed"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <StaffSearchPicker
            staffSearchRef={staffSearchRef}
            attyFilter={attyFilter}
            setAttyFilter={setAttyFilter}
            staffInput={staffInput}
            setStaffInput={setStaffInput}
            staffFocused={staffFocused}
            setStaffFocused={setStaffFocused}
            staffDisplayValue={staffDisplayValue}
            staffSuggestions={staffSuggestions}
          />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="!pl-9 !pr-3 !py-2 !text-sm !border !border-slate-200 dark:!border-slate-700 !rounded-lg !bg-white dark:!bg-slate-800 !text-slate-700 dark:!text-slate-300 focus:!ring-2 focus:!ring-amber-500/30 focus:!border-amber-500 !w-[200px]" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="!px-4 !py-2 !text-xs !font-medium !text-white !bg-amber-500 hover:!bg-amber-600 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm" onClick={() => setShowModal(true)}><Plus size={14} className="inline mr-1" />New Case</button>
        </div>
      </div>
      <div className="content">
        {triageShow && (
          <div style={{ marginBottom: 16 }}>
            <AiPanel title="AI Case Triage" loading={triageLoading} onClose={() => { setTriageShow(false); setTriageResults(null); }}
              onRun={() => { setTriageLoading(true); apiCaseTriage().then(r => { setTriageResults(r.cases || []); setTriageLoading(false); }).catch(() => setTriageLoading(false)); }}
            >
              {triageResults && triageResults.map((t, i) => {
                const caseObj = allCases.find(cc => cc.id === t.id);
                return (
                  <div key={t.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < triageResults.length - 1 ? "1px solid #e8e0d0" : "none", cursor: caseObj ? "pointer" : "default" }} onClick={() => caseObj && setSelectedCase(caseObj)}>
                    <div style={{ minWidth: 26, height: 26, borderRadius: "50%", background: t.urgency >= 8 ? "#dc2626" : t.urgency >= 5 ? "#e07a30" : "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{t.urgency}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a" }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{t.reason}</div>
                      <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 font-medium">→ {t.action}</div>
                    </div>
                  </div>
                );
              })}
            </AiPanel>
          </div>
        )}
        <div className="flex gap-2 items-center mb-4">
          <button className="!px-4 !py-2 !text-sm !font-medium !border !border-amber-200 dark:!border-amber-800/50 !text-amber-700 dark:!text-amber-400 !bg-amber-50 dark:!bg-amber-900/30 hover:!bg-amber-100 dark:hover:!bg-amber-900/50 !rounded-md !transition-colors !cursor-pointer !whitespace-nowrap !h-10 !flex !items-center !gap-2" onClick={() => {
            setTriageShow(true); setTriageLoading(true);
            apiCaseTriage().then(r => { setTriageResults(r.cases || []); setTriageLoading(false); }).catch(() => setTriageLoading(false));
          }}><Sparkles size={16} />Triage</button>
          <div className="relative flex-1 flex items-center">
            <Sparkles size={16} className="absolute left-3 text-amber-500 pointer-events-none" />
            <input
              className="!w-full !pl-9 !pr-4 !h-10 !rounded-l-md !rounded-r-none !border !border-slate-200 dark:!border-slate-700 !text-sm !bg-slate-50 dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100 placeholder:!text-slate-400 dark:placeholder:!text-slate-500 focus:!outline-none focus:!ring-2 focus:!ring-amber-500/20 focus:!border-amber-500"
              placeholder='AI Search — ask anything about your cases (e.g. "cases with trial in March" or "slip and fall in Mobile")…'
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") runAiSearch(); }}
            />
            <button className="!px-6 !py-2 !text-sm !font-semibold !text-slate-900 !bg-amber-400 hover:!bg-amber-500 !rounded-r-md !rounded-l-none !transition-colors !cursor-pointer !border !border-l-0 !border-amber-400 hover:!border-amber-500 !h-10 !whitespace-nowrap" onClick={runAiSearch} disabled={aiLoading || !aiQuery.trim()}>
              {aiLoading ? "Searching…" : "AI Search"}
            </button>
          </div>
          {aiResults !== null && (
            <button className="!px-3 !py-2 !text-xs !font-medium !border !border-slate-200 dark:!border-slate-700 !text-slate-600 dark:!text-slate-400 !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-700 !rounded-md !transition-colors !cursor-pointer !h-10" onClick={() => { setAiResults(null); setAiQuery(""); setAiError(""); }}>Clear</button>
          )}
        </div>

        {aiLoading && (
          <div className="card" style={{ marginBottom: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#64748b" }}>Searching across all case data — this may take a few seconds…</div>
          </div>
        )}

        {aiError && (
          <div className="card" style={{ marginBottom: 16, padding: 16, borderLeft: "4px solid #e05252" }}>
            <div style={{ color: "#e05252", fontSize: 13 }}>{aiError}</div>
          </div>
        )}

        {aiResults !== null && !aiLoading && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> AI Search Results
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({aiResults.length} match{aiResults.length !== 1 ? "es" : ""})</span>
              </div>
            </div>
            {aiResults.length === 0 ? (
              <div className="p-5 text-center text-slate-500 dark:text-slate-400 text-sm">No matching cases found. Try rephrasing your search.</div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {aiResults.map((r, i) => {
                  const c = allCases.find(cc => cc.id === r.id);
                  if (!c) return null;
                  return (
                    <div
                      key={r.id}
                      className="flex gap-3.5 items-start px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      style={{ borderBottom: i < aiResults.length - 1 ? "1px solid var(--c-border)" : "none" }}
                      onClick={() => setSelectedCase(c)}
                    >
                      <div className="min-w-[28px] h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.title}</span>
                          {c.inLitigation && <span title="In Litigation" style={{ fontSize: 9, fontWeight: 700, background: "#2563eb", color: "#fff", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>LIT</span>}
                          {c.caseNum && <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{c.caseNum}</span>}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{r.reason}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex gap-3">
                          {c.clientName && <span>Client: {c.clientName}</span>}
                          {c.stage && <span>Stage: {c.stage}</span>}
                          {c.stateJurisdiction && <span>State: {c.stateJurisdiction}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-500 font-medium flex-shrink-0">View →</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {pinnedCases.length > 0 && (
          <div className="card pinned-card-mobile" style={{ marginBottom: 16 }}>
            <div
              onClick={() => setPinnedExpanded(!pinnedExpanded)}
              className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
              style={{ borderBottom: pinnedExpanded ? "1px solid var(--c-border)" : "none" }}
            >
              <div className="flex items-center gap-2">
                {pinnedExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                <Pin size={14} className="text-amber-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pinned Cases</span>
                <Badge label={`${pinnedCases.length}`} />
              </div>
            </div>
            {pinnedExpanded && (
              <div className="table-wrap">
                <table className="mobile-cards">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}></th>
                      <th>File Number</th>
                      <th>Style</th>
                      <th className="hide-mobile">Case Type</th>
                      <th>Stage</th>
                      <th>Trial Date</th>
                      <th className="hide-mobile">Arrest Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pinnedCases.map(c => (
                      <tr key={c.id} className={`clickable-row group ${selectedCase?.id === c.id ? "selected-row" : ""}`} onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}>
                        <td data-label="" style={{ textAlign: "center", padding: "6px 4px" }}>
                          <button onClick={e => { e.stopPropagation(); togglePin(c.id); }} title="Unpin" className="bg-transparent border-none cursor-pointer p-0 leading-none"><Pin size={14} className="text-amber-500" /></button>
                        </td>
                        <td data-label="File #" className="whitespace-nowrap">
                          <div className="font-mono text-xs text-slate-600 dark:text-slate-400">{c.caseNum || "—"}</div>
                        </td>
                        <td data-label="Style">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{c.title}</span>
                            {c.inLitigation && <span title="In Litigation" style={{ fontSize: 9, fontWeight: 700, background: "#2563eb", color: "#fff", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>LIT</span>}
                            {!c.inLitigation && (() => { const solDate = c.statuteOfLimitationsDate ? new Date(c.statuteOfLimitationsDate) : null; const solDays = solDate ? Math.ceil((solDate - new Date()) / (1000*60*60*24)) : null; return solDays !== null && solDays <= 60 ? <span title="SOL approaching" style={{ fontSize: 9, fontWeight: 700, background: solDays <= 0 ? "#dc2626" : "#d97706", color: "#fff", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{solDays <= 0 ? "SOL EXPIRED" : `SOL ${solDays}d`}</span> : null; })()}
                          </div>
                          {c.clientName && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.clientName}</div>}
                        </td>
                        <td className="hide-mobile text-sm text-slate-600 dark:text-slate-400" data-label="Type">{c.caseType || "—"}</td>
                        <td data-label="Stage"><Badge label={c.stage} /></td>
                        <td data-label="Trial" className={`text-sm whitespace-nowrap ${c.trialDate ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}`}>{fmt(c.trialDate)}</td>
                        <td className="hide-mobile text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap" data-label="Accident">{fmt(c.accidentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className="tabs">
          {["All", "Active", "Monitoring", "Closed"].map(s => <div key={s} className={`tab ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s}</div>)}
          <div className={`tab ${statusFilter === "Deleted" ? "active" : ""}`} style={{ color: statusFilter === "Deleted" ? "#e05252" : undefined }} onClick={() => setStatusFilter("Deleted")}>Deleted</div>
        </div>
        <div className="card">
          {statusFilter === "Deleted" ? (
            <div className="table-wrap">
              {deletedLoading ? (
                <div className="empty">Loading deleted records…</div>
              ) : (
                <>
                  <table className="mobile-cards">
                    <thead>
                      <tr>
                        <th>File Number</th>
                        <th>Style</th>
                        <th>Case Type</th>
                        <th>Deleted On</th>
                        <th>Expires In</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deletedCases || []).map(c => {
                        const deletedDate = new Date(c.deletedAt);
                        const expiresDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                        const daysLeft = Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={c.id}>
                            <td data-label="File #" style={{ fontFamily: "monospace", fontSize: 11, color: "#0f172a", whiteSpace: "nowrap" }}>{c.caseNum || "—"}</td>
                            <td data-label="Style"><div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ color: "var(--c-text)", fontWeight: 600, fontSize: 13 }}>{c.title}</span>{c.inLitigation && <span title="In Litigation" style={{ fontSize: 9, fontWeight: 700, background: "#2563eb", color: "#fff", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>LIT</span>}</div>{c.clientName && <div style={{ fontSize: 11, color: "#64748b" }}>Client: {c.clientName}</div>}</td>
                            <td data-label="Type" style={{ fontSize: 11, color: "var(--c-text2)" }}>{c.caseType || "—"}</td>
                            <td data-label="Deleted" style={{ fontSize: 12, color: "#e05252" }}>{deletedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td data-label="Expires" style={{ fontSize: 12, color: daysLeft <= 7 ? "#e05252" : "#64748b" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</td>
                            <td data-label=""><button className="btn btn-outline btn-sm" onClick={() => handleRestoreDeleted(c.id)}>Restore</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {(deletedCases || []).length === 0 && <div className="empty">No deleted records in the last 30 days.</div>}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="mobile-cards">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}></th>
                      <SortTh col="caseNum" label="File Number" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh col="title" label="Style" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <th className="hide-mobile">Case Type</th>
                      <SortTh col="stage" label="Stage" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh col="trialDate" label="Trial Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh col="accidentDate" label="Accident Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hide-mobile" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(c => (
                      <tr key={c.id} className={`clickable-row group ${selectedCase?.id === c.id ? "selected-row" : ""}`} onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}>
                        <td data-label="" style={{ textAlign: "center", padding: "6px 4px" }}>
                          <button onClick={e => { e.stopPropagation(); togglePin(c.id); }} title={pinnedIds.includes(c.id) ? "Unpin" : "Pin"} className={`bg-transparent border-none cursor-pointer p-0 leading-none transition-opacity ${pinnedIds.includes(c.id) ? "opacity-100" : "opacity-30 hover:opacity-100"}`}><Pin size={14} className={pinnedIds.includes(c.id) ? "text-amber-500" : "text-slate-300 dark:text-slate-600"} /></button>
                        </td>
                        <td data-label="File #" className="whitespace-nowrap">
                          <div className="font-mono text-xs text-slate-600 dark:text-slate-400">{c.caseNum || "—"}</div>
                        </td>
                        <td data-label="Style">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{c.title}</span>
                            {c.inLitigation && <span title="In Litigation" style={{ fontSize: 9, fontWeight: 700, background: "#2563eb", color: "#fff", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>LIT</span>}
                            {!c.inLitigation && (() => { const solDate = c.statuteOfLimitationsDate ? new Date(c.statuteOfLimitationsDate) : null; const solDays = solDate ? Math.ceil((solDate - new Date()) / (1000*60*60*24)) : null; return solDays !== null && solDays <= 60 ? <span title="SOL approaching" style={{ fontSize: 9, fontWeight: 700, background: solDays <= 0 ? "#dc2626" : "#d97706", color: "#fff", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{solDays <= 0 ? "SOL EXPIRED" : `SOL ${solDays}d`}</span> : null; })()}
                          </div>
                          {c.clientName && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.clientName}</div>}
                        </td>
                        <td className="hide-mobile text-sm text-slate-600 dark:text-slate-400" data-label="Type">{c.caseType || "—"}</td>
                        <td data-label="Stage"><Badge label={c.stage} /></td>
                        <td data-label="Trial" className={`text-sm whitespace-nowrap ${c.trialDate ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}`}>{fmt(c.trialDate)}</td>
                        <td className="hide-mobile text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap" data-label="Accident">{fmt(c.accidentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {paged.length === 0 && <div className="empty">No cases match your filters.</div>}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <span>{filtered.length} results · Page {page} of {totalPages}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => { const p = page <= 4 ? i + 1 : page + i - 3; if (p < 1 || p > totalPages) return null; return <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>; })}
                    <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedCase && (
        <CaseDetailOverlay
          c={selectedCase}
          currentUser={currentUser}
          tasks={caseTasks}
          deadlines={caseDeadlines}
          notes={notes}
          links={caseLinks[selectedCase.id] || []}
          activity={caseActivity[selectedCase.id] || []}
          onClose={() => { setSelectedCase(null); if (clearPendingTab) clearPendingTab(); }}
          onUpdate={onUpdateCase}
          onDeleteCase={handleDeleteFromOverlay}
          initialTab={pendingTab || undefined}
          onCompleteTask={onCompleteTask}
          onAddTask={onAddTask}
          onAddNote={async (note) => { try { const saved = await apiCreateNote(note); setCaseNotes(prev => ({ ...prev, [selectedCase.id]: [saved, ...(prev[selectedCase.id] || [])] })); } catch (err) { alert("Failed to save note: " + err.message); } }}
          onDeleteNote={async (noteId) => { try { await apiDeleteNote(noteId); setCaseNotes(prev => ({ ...prev, [selectedCase.id]: (prev[selectedCase.id] || []).filter(n => n.id !== noteId) })); } catch (err) { alert("Failed to delete note: " + err.message); } }}
          onUpdateNote={async (noteId, data) => { try { const updated = await apiUpdateNote(noteId, data); setCaseNotes(prev => ({ ...prev, [selectedCase.id]: (prev[selectedCase.id] || []).map(n => n.id === noteId ? updated : n) })); } catch (err) { alert("Failed to update note: " + err.message); throw err; } }}
          onAddLink={async (link) => { try { const saved = await apiCreateLink(link); setCaseLinks(prev => ({ ...prev, [selectedCase.id]: [...(prev[selectedCase.id] || []), saved] })); } catch (err) { alert("Failed to save link: " + err.message); } }}
          onDeleteLink={async (linkId) => { try { await apiDeleteLink(linkId); setCaseLinks(prev => ({ ...prev, [selectedCase.id]: (prev[selectedCase.id] || []).filter(l => l.id !== linkId) })); } catch (err) { alert("Failed to delete link: " + err.message); } }}
          onLogActivity={async (entry) => { try { const saved = await apiCreateActivity(entry); setCaseActivity(prev => ({ ...prev, [selectedCase.id]: [saved, ...(prev[selectedCase.id] || [])] })); } catch (err) { console.error("Failed to log activity:", err); } }}
          onRefreshActivity={(caseId, fresh) => setCaseActivity(prev => ({ ...prev, [caseId]: fresh }))}
          onAddDeadline={onAddDeadline}
          onUpdateDeadline={onUpdateDeadline}
          onDeleteDeadline={onDeleteDeadline}
          allCases={allCases}
          onSelectCase={(target) => { setSelectedCase(target); }}
          onOpenAdvocate={onOpenAdvocate}
          onOpenTrialCenter={onOpenTrialCenter}
          confirmDelete={confirmDelete}
          openAppDocViewer={openAppDocViewer}
          openAppFilingViewer={openAppFilingViewer}
          openBlobInViewer={openBlobInViewer}
          openTranscriptViewer={openTranscriptViewer}
        />
      )}
    </>
  );
}

// ─── Case Detail Overlay ──────────────────────────────────────────────────────
// Field definitions: key = JS property name, label = display name, type = input type
export default CasesView;

