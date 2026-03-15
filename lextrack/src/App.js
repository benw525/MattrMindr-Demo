import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { USERS } from "./firmData.js";
import { VIEWS } from "./navigation.js";
import { FONTS, CSS } from "./styles.js";
import { LoginScreen, ChangePasswordModal, SettingsModal, HelpCenterModal } from "./modals.js";
import PortalApp from "./portal/PortalApp.js";
import DocViewerWindow from "./DocViewerWindow.js";
import TranscriptViewerWindow from "./TranscriptViewerWindow.js";
import { LayoutDashboard, Briefcase, Calendar, CheckSquare, FileText, Clock, BarChart3, Brain, MessageSquare, Users, UserCog, Settings, HelpCircle, X, Bot, Search, Scale, ChevronLeft, ChevronRight, Sparkles, User, FileAudio, Trash2, SlidersHorizontal, Inbox } from "lucide-react";
import {
  apiLogout,
  apiMe,
  apiSavePreferences,
  apiGetCases,
  apiCreateCase,
  apiUpdateCase,
  apiGetTasks,
  apiGetCaseTasks,
  apiCreateTask,
  apiCreateTasks,
  apiUpdateTask,
  apiCompleteTask,
  apiReassignTasksByRole,
  apiGetDeadlines,
  apiCreateDeadline,
  apiUpdateDeadline,
  apiDeleteDeadline,
  apiGetUsers,
  apiGetDeletedUsers,
  apiCreateNote,
  apiCreateActivity,
  apiGetContacts,
  apiAdvocateChat,
  apiDownloadDocument,
  apiGetAllCorrespondence,
  apiGetTemplates,
  apiGetTimeEntries,
  apiGetPinnedCases,
  apiSetPinnedCases,
  apiCheckPermissions,
  apiGetCollabUnreadCount,
  apiGetTranscriptDetail,
  apiUpdateTranscript,
  apiDownloadTranscriptAudio,
  apiExportTranscript,
  apiGetTranscriptHistory,
  apiSaveTranscriptHistory,
  apiRevertTranscript,
  apiDownloadFiling,
  apiGetUnreadClientComm,
  apiGetDocHtml,
  apiGetXlsxData,
  apiGetPptxSlides,
  apiGetAnnotations,
  apiGetOfficeViewUrl,
  apiGetMsStatus,
  apiGetMsConfigured,
  apiGetOnlyofficeStatus,
  apiGetScribeSummaries,
  apiSummarizeTranscript,
} from "./api.js";
import CollaborateView from "./CollaborateView.js";
import TrialCenterView from "./TrialCenterView.js";

import {
  isAppAdmin,
  today,
  newId,
  addDays,
  daysUntil,
  recordType,
  TASK_CHAINS,
  MULTI_CHAINS,
  DUAL_CHAINS,
  generateDefaultTasks,
  isDarkMode,
  getUserById,
  Avatar,
  ScribeTranscriptButtons,
  COURT_RULES,
  isAttyPara,
  isSupportStaff,
  Toggle,
  CaseSearchField,
  StaffSearchField,
} from "./shared.js";

import Dashboard from "./views/DashboardView.js";
import CasesView from "./views/CasesView.js";
import DeadlinesView from "./views/DeadlinesView.js";
import TasksView from "./views/TasksView.js";
import CustomizationView from "./views/CustomizationView.js";
import ReportsView from "./views/ReportsView.js";
import AiCenterView from "./views/AiCenterView.js";
import TimeLogView from "./views/TimeLogView.js";
import ContactsView from "./views/ContactsView.js";
import UnmatchedView from "./views/UnmatchedView.js";
import DocumentsView from "./views/DocumentsView.js";
import DeletedDataView from "./views/DeletedDataView.js";
import StaffView from "./views/StaffView.js";


function TimePromptModal({ pending, onSubmit }) {
  const [time, setTime]           = useState("");
  const [claimIt, setClaimIt]     = useState(false);  // true | false (defaults no-claim)
  const [assignId, setAssignId]   = useState(0);

  if (!pending) return null;

  const { task, completingUser, caseForTask } = pending;

  const showClaimPrompt  = isAttyPara(completingUser)  && task?.assigned > 0 && task.assigned !== completingUser?.id;
  const showAssignPrompt = isSupportStaff(completingUser);

  const caseTeamIds   = caseForTask ? [caseForTask.assignedAttorney, caseForTask.secondAttorney, caseForTask.caseManager, caseForTask.investigator, caseForTask.paralegal].filter(id => id > 0) : [];
  const caseTeamUsers = USERS.filter(u => caseTeamIds.includes(u.id) && isAttyPara(u));
  const otherAttyPara = USERS.filter(u => !caseTeamIds.includes(u.id) && isAttyPara(u));
  const assignedUser  = task ? getUserById(task.assigned) : null;

  const handleSave = () => {
    const t          = time.trim() || null;
    const completedBy = (showClaimPrompt  && claimIt === true && completingUser) ? completingUser.id : null;
    const timeLogUser = (showAssignPrompt && assignId > 0)                       ? assignId          : null;
    onSubmit(pending.taskId, t, completedBy, timeLogUser);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 430 }}>
        <div className="modal-title" style={{ marginBottom: 6 }}>Log Time</div>
        <p style={{ fontSize: 13, color: "var(--c-text2)", marginBottom: 14 }}>
          How much time did this task take?
        </p>
        <input
          type="text"
          placeholder="e.g. 1.5 hours, 30 min, 2 hrs"
          value={time}
          onChange={e => setTime(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          autoFocus
        />

        {/* Attorney / Trial Coordinator: claim for own time log? */}
        {showClaimPrompt && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--c-border)" }}>
            <p style={{ fontSize: 13, color: "var(--c-text)", marginBottom: 10 }}>
              This task is assigned to <strong>{assignedUser?.name || "another user"}</strong>.
              Add it to <strong>your</strong> time log instead?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`btn ${claimIt === true  ? "btn-gold" : "btn-outline"}`}
                style={{ flex: 1, fontSize: 13 }}
                onClick={() => setClaimIt(true)}
              >Yes, add to mine</button>
              <button
                className={`btn ${claimIt === false ? "btn-gold" : "btn-outline"}`}
                style={{ flex: 1, fontSize: 13 }}
                onClick={() => setClaimIt(false)}
              >No, keep in theirs</button>
            </div>
          </div>
        )}

        {/* Support staff: assign credit to attorney/trial coordinator? */}
        {showAssignPrompt && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--c-border)" }}>
            <p style={{ fontSize: 13, color: "var(--c-text)", marginBottom: 10 }}>
              Assign time credit to an attorney or trial coordinator?
            </p>
            <StaffSearchField value={assignId} onChange={val => setAssignId(val)} placeholder="Search attorneys…" userList={[...caseTeamUsers, ...otherAttyPara]} />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            className="btn btn-gold"
            style={{ flex: 1 }}
            onClick={handleSave}
          >Save</button>
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={() => onSubmit(
              pending.taskId,
              time.trim() || null,
              null,
              task?.assigned > 0 ? task.assigned : null
            )}
          >Skip</button>
        </div>
      </div>
    </div>
  );
}

// ─── FollowUpPromptModal ──────────────────────────────────────────────────────
function FollowUpPromptModal({ prompt, onDecide }) {
  const [step, setStep]       = useState("question");
  const [days, setDays]       = useState(7);
  const [escalate, setEscalate] = useState(false);

  if (!prompt) return null;

  const { target } = prompt;

  const handleYes = () => {
    if (days < 1) return;
    onDecide(true, days, escalate);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 460, maxWidth: "calc(100vw - 24px)" }}>
        <div className="modal-title" style={{ marginBottom: 6 }}>Follow-up Task Completed</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          "{target.title}" has been marked complete.
        </div>

        {step === "question" ? (
          <>
            <p style={{ fontSize: 14, color: "var(--c-text)", marginBottom: 24, lineHeight: 1.6 }}>
              Would you like to schedule another follow-up task?
            </p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => onDecide(false, null, null)}>
                No, Continue Workflow
              </button>
              <button className="btn btn-primary" onClick={() => setStep("form")}>
                Yes, Schedule Follow-up
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>
                Days Until Due
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={e => setDays(Math.max(1, Number(e.target.value)))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--c-border)", borderRadius: 6, fontSize: 13, color: "var(--c-text)", background: "var(--c-card)" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 14px", background: "var(--c-hover)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
              <Toggle on={escalate} onChange={() => setEscalate(p => !p)} />
              <div>
                <div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>Auto-Escalate Priority</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Priority rises automatically as due date approaches</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Priority: <strong style={{ color: "var(--c-text)" }}>{target.priority}</strong>
              {" · "}Assigned to: <strong style={{ color: "var(--c-text)" }}>{target.assignedRole || "same staff"}</strong>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setStep("question")}>Back</button>
              <button className="btn btn-primary" onClick={handleYes}>
                Create Follow-up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/portal/*" element={<PortalApp />} />
        <Route path="/*" element={<FirmApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function FirmApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname.split("/")[1] || VIEWS.DASHBOARD;
  const setView = useCallback((v) => { localStorage.setItem("lextrack-last-view", v); navigate("/" + v); }, [navigate]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPerms, setUserPerms] = useState({});
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [pendingTab, setPendingTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  const [allCases,     setAllCases]     = useState([]);
  const [allDeadlines, setAllDeadlines] = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [caseNotes,    setCaseNotes]    = useState({});
  const [caseLinks,    setCaseLinks]    = useState({});
  const [caseActivity, setCaseActivity] = useState({});
  const [allCorrespondence, setAllCorrespondence] = useState([]);
  const [unreadClientComm, setUnreadClientComm] = useState([]);
  const [deletedCases, setDeletedCases] = useState(null);
  const [allUsers,     setAllUsers]     = useState(USERS);
  const [pinnedCaseIds, setPinnedCaseIds] = useState([]);

  const [calcInputs, setCalcInputs] = useState({ ruleId: 1, fromDate: today });
  const [calcResult, setCalcResult] = useState(null);
  const [followUpPrompt,   setFollowUpPrompt]   = useState(null);
  const [pendingTimePrompt, setPendingTimePrompt] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const deleteResolveRef = useRef(null);
  const confirmDelete = useCallback(() => {
    return new Promise((resolve) => {
      deleteResolveRef.current = resolve;
      setDeleteConfirm(true);
    });
  }, []);
  const handleDeleteConfirmYes = useCallback(() => { setDeleteConfirm(null); if (deleteResolveRef.current) deleteResolveRef.current(true); deleteResolveRef.current = null; }, []);
  const handleDeleteConfirmNo = useCallback(() => { setDeleteConfirm(null); if (deleteResolveRef.current) deleteResolveRef.current(false); deleteResolveRef.current = null; }, []);

  const [showAdvocateGlobal, setShowAdvocateGlobal] = useState(false);
  const [advocateMessages, setAdvocateMessages] = useState([]);
  const [advocateLoading, setAdvocateLoading] = useState(false);
  const [advocateInput, setAdvocateInput] = useState("");
  const [advocateStats, setAdvocateStats] = useState(null);
  const [advocateTasksAdded, setAdvocateTasksAdded] = useState({});
  const [advocateCaseId, setAdvocateCaseId] = useState(null);
  const advocateEndRef = useRef(null);
  const advocatePrevViewRef = useRef(view);
  const advocateLastOpenViewRef = useRef(null);
  const advocatePrevOpenRef = useRef(false);
  const [advocateScreenChips, setAdvocateScreenChips] = useState(null);
  const [advocateFromHelpCenter, setAdvocateFromHelpCenter] = useState(false);
  const [hideAdvocateAI, setHideAdvocateAI] = useState(() => currentUser?.preferences?.hideAdvocateAI || false);
  const [fabPosition, setFabPosition] = useState(() => currentUser?.preferences?.fabPosition || null);
  const [fabDragging, setFabDragging] = useState(false);
  const [fabContextMenu, setFabContextMenu] = useState(null);
  const fabRef = useRef(null);
  const fabDragState = useRef({ active: false, offsetX: 0, offsetY: 0, longPressTimer: null, moved: false, startX: 0, startY: 0 });

  const fabPositionRef = useRef(fabPosition);
  useEffect(() => { fabPositionRef.current = fabPosition; }, [fabPosition]);

  const fabStartDrag = useCallback((clientX, clientY) => {
    const el = fabRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    fabDragState.current.active = true;
    fabDragState.current.offsetX = clientX - rect.left;
    fabDragState.current.offsetY = clientY - rect.top;
    fabDragState.current.moved = false;
    fabDragState.current.startX = clientX;
    fabDragState.current.startY = clientY;
    setFabDragging(true);
  }, []);

  const fabClampAndSet = useCallback((clientX, clientY) => {
    const x = Math.max(0, Math.min(window.innerWidth - 52, clientX - fabDragState.current.offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - 52, clientY - fabDragState.current.offsetY));
    const pos = { x, y };
    setFabPosition(pos);
    fabPositionRef.current = pos;
  }, []);

  const fabOnMouseMove = useCallback((e) => {
    if (!fabDragState.current.active) return;
    e.preventDefault();
    const dx = Math.abs(e.clientX - fabDragState.current.startX);
    const dy = Math.abs(e.clientY - fabDragState.current.startY);
    if (dx > 3 || dy > 3) fabDragState.current.moved = true;
    fabClampAndSet(e.clientX, e.clientY);
  }, [fabClampAndSet]);

  const fabOnMouseUp = useCallback(() => {
    if (!fabDragState.current.active) return;
    fabDragState.current.active = false;
    setFabDragging(false);
    setFabMoveMode(false);
    if (fabDragState.current.moved && fabPositionRef.current) {
      apiSavePreferences({ fabPosition: fabPositionRef.current }).catch(() => {});
    }
    setTimeout(() => { fabDragState.current.moved = false; }, 50);
  }, []);

  const fabOnTouchMove = useCallback((e) => {
    if (!fabDragState.current.active) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - fabDragState.current.startX);
    const dy = Math.abs(t.clientY - fabDragState.current.startY);
    if (dx > 3 || dy > 3) fabDragState.current.moved = true;
    fabClampAndSet(t.clientX, t.clientY);
  }, [fabClampAndSet]);

  const fabOnTouchEnd = useCallback(() => {
    if (fabDragState.current.longPressTimer) {
      clearTimeout(fabDragState.current.longPressTimer);
      fabDragState.current.longPressTimer = null;
    }
    if (!fabDragState.current.active) return;
    fabDragState.current.active = false;
    setFabDragging(false);
    if (fabDragState.current.moved && fabPositionRef.current) {
      apiSavePreferences({ fabPosition: fabPositionRef.current }).catch(() => {});
    }
    setTimeout(() => { fabDragState.current.moved = false; }, 50);
  }, []);

  const fabOnTouchCancel = useCallback(() => {
    if (fabDragState.current.longPressTimer) {
      clearTimeout(fabDragState.current.longPressTimer);
      fabDragState.current.longPressTimer = null;
    }
    fabDragState.current.active = false;
    fabDragState.current.moved = false;
    setFabDragging(false);
  }, []);

  const [fabMoveMode, setFabMoveMode] = useState(false);

  useEffect(() => {
    if (!fabMoveMode) return;
    const handleEsc = (e) => { if (e.key === "Escape") setFabMoveMode(false); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fabMoveMode]);

  useEffect(() => {
    if (fabDragging) {
      window.addEventListener("mousemove", fabOnMouseMove);
      window.addEventListener("mouseup", fabOnMouseUp);
      window.addEventListener("touchmove", fabOnTouchMove, { passive: false });
      window.addEventListener("touchend", fabOnTouchEnd);
      window.addEventListener("touchcancel", fabOnTouchCancel);
      return () => {
        window.removeEventListener("mousemove", fabOnMouseMove);
        window.removeEventListener("mouseup", fabOnMouseUp);
        window.removeEventListener("touchmove", fabOnTouchMove);
        window.removeEventListener("touchend", fabOnTouchEnd);
        window.removeEventListener("touchcancel", fabOnTouchCancel);
      };
    }
  }, [fabDragging, fabOnMouseMove, fabOnMouseUp, fabOnTouchMove, fabOnTouchEnd, fabOnTouchCancel]);

  useEffect(() => { if (advocateEndRef.current) advocateEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [advocateMessages, advocateLoading, advocateScreenChips]);
  const [contextContactsCache, setContextContactsCache] = useState(null);
  const [pinnedContactsList, setPinnedContactsList] = useState([]);
  useEffect(() => {
    const ids = currentUser?.preferences?.pinnedContacts || [];
    if (ids.length > 0) {
      apiGetContacts().then(all => {
        setPinnedContactsList(all.filter(c => ids.includes(c.id)));
      }).catch(() => setPinnedContactsList([]));
    } else {
      setPinnedContactsList([]);
    }
  }, [currentUser?.preferences?.pinnedContacts]); // eslint-disable-line react-hooks/exhaustive-deps
  const [contextTemplatesCache, setContextTemplatesCache] = useState(null);
  const [contextTimeManualCache, setContextTimeManualCache] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("lextrack-dark") === "1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [helpCenterTab, setHelpCenterTab] = useState("tutorials");

  const [openDocViewers, setOpenDocViewers] = useState([]);
  const [openTranscriptViewers, setOpenTranscriptViewers] = useState([]);
  const [appMsStatus, setAppMsStatus] = useState(null);
  const [appOoStatus, setAppOoStatus] = useState(null);
  const topZIndexRef = useRef(10010);
  const nextViewerIdRef = useRef(0);
  const [minChipScrollIdx, setMinChipScrollIdx] = useState(0);

  useEffect(() => {
    if (appMsStatus === null) {
      apiGetMsConfigured().then(r => { if (r.configured) apiGetMsStatus().then(setAppMsStatus).catch(() => {}); else setAppMsStatus({ connected: false, configured: false }); }).catch(() => setAppMsStatus({ connected: false, configured: false }));
    }
    if (openDocViewers.length > 0 && appOoStatus === null) {
      apiGetOnlyofficeStatus().then(setAppOoStatus).catch(() => setAppOoStatus({ configured: false, available: false }));
    }
  }, [openDocViewers.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAppDocViewer = async (docId, filename, contentType, caseId) => {
    try {
      const ct = contentType || "application/pdf";
      const ext = (filename || "").split(".").pop().toLowerCase();
      const isDocx = ct.includes("wordprocessingml") || ext === "docx" || ext === "doc";
      const isXlsx = ct.includes("spreadsheetml") || ext === "xlsx" || ext === "xls";
      const isPptx = ct.includes("presentationml") || ext === "pptx" || ext === "ppt";
      let docxHtml = null, xlsxData = null, pptxSlides = null, blobUrl = null, annotations = [], officeViewUrl = null;
      if (isDocx) {
        try { const r = await apiGetDocHtml(docId); docxHtml = r.html; } catch { docxHtml = "<p>Could not convert document.</p>"; }
      } else if (isXlsx) {
        try { const r = await apiGetXlsxData(docId); xlsxData = r.sheets; } catch { xlsxData = []; }
      } else if (isPptx) {
        try { const r = await apiGetPptxSlides(docId); pptxSlides = r.slides; } catch { pptxSlides = []; }
      } else {
        const blob = await apiDownloadDocument(docId);
        blobUrl = URL.createObjectURL(blob);
      }
      try { const aRes = await apiGetAnnotations(docId); annotations = aRes.annotations || []; } catch {}
      if (isDocx || isXlsx || isPptx) {
        try { const r = await apiGetOfficeViewUrl(docId); if (r.url) officeViewUrl = r.url; } catch {}
      }
      const id = ++nextViewerIdRef.current;
      const offset = (openDocViewers.filter(v => !v.minimized).length % 8) * 30;
      topZIndexRef.current += 1;
      setOpenDocViewers(prev => [...prev, { id, filename, type: ct, docId, caseId: caseId || null, docxHtml, xlsxData, pptxSlides, blobUrl, annotations, officeViewUrl, minimized: false, zIndex: topZIndexRef.current, position: { x: 80 + offset, y: 40 + offset }, size: { width: Math.min(1000, window.innerWidth * 0.75), height: Math.min(700, window.innerHeight * 0.8) } }]);
    } catch (err) { alert("Failed to open document: " + err.message); }
  };

  const openAppFilingViewer = async (filingId, filename) => {
    try {
      const ext = (filename || "").split(".").pop().toLowerCase();
      const blob = await apiDownloadFiling(filingId);
      const ct = blob.type || (ext === "pdf" ? "application/pdf" : ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : ext === "xlsx" || ext === "xls" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : ext === "pptx" || ext === "ppt" ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "webp" ? `image/${ext === "jpg" ? "jpeg" : ext}` : "application/octet-stream");
      const blobUrl = URL.createObjectURL(blob);
      const id = ++nextViewerIdRef.current;
      const offset = (openDocViewers.filter(v => !v.minimized).length % 8) * 30;
      topZIndexRef.current += 1;
      setOpenDocViewers(prev => [...prev, { id, filename, type: ct, docId: null, docxHtml: null, xlsxData: null, pptxSlides: null, blobUrl, annotations: [], officeViewUrl: null, minimized: false, zIndex: topZIndexRef.current, position: { x: 80 + offset, y: 40 + offset }, size: { width: Math.min(1000, window.innerWidth * 0.75), height: Math.min(700, window.innerHeight * 0.8) } }]);
    } catch (err) { alert("Failed to open filing: " + err.message); }
  };

  const closeDocViewer = (viewerId) => {
    setOpenDocViewers(prev => {
      const v = prev.find(w => w.id === viewerId);
      if (v && v.blobUrl) URL.revokeObjectURL(v.blobUrl);
      return prev.filter(w => w.id !== viewerId);
    });
    setMinChipScrollIdx(i => Math.max(0, i - 1));
  };

  const minimizeDocViewer = (viewerId) => {
    setOpenDocViewers(prev => prev.map(v => v.id === viewerId ? { ...v, minimized: true } : v));
  };

  const restoreDocViewer = (viewerId) => {
    topZIndexRef.current += 1;
    setOpenDocViewers(prev => prev.map(v => v.id === viewerId ? { ...v, minimized: false, zIndex: topZIndexRef.current } : v));
  };

  const bringDocViewerToFront = (viewerId) => {
    topZIndexRef.current += 1;
    setOpenDocViewers(prev => prev.map(v => v.id === viewerId ? { ...v, zIndex: topZIndexRef.current } : v));
  };

  const openBlobInViewer = (blob, filename, contentType) => {
    const ct = contentType || "application/octet-stream";
    const blobUrl = URL.createObjectURL(blob);
    const id = ++nextViewerIdRef.current;
    const offset = (openDocViewers.filter(v => !v.minimized).length % 8) * 30;
    topZIndexRef.current += 1;
    setOpenDocViewers(prev => [...prev, { id, filename, type: ct, docId: null, docxHtml: null, xlsxData: null, pptxSlides: null, blobUrl, annotations: [], officeViewUrl: null, minimized: false, zIndex: topZIndexRef.current, position: { x: 80 + offset, y: 40 + offset }, size: { width: Math.min(1000, window.innerWidth * 0.75), height: Math.min(700, window.innerHeight * 0.8) } }]);
  };

  const openTranscriptViewer = async (transcript) => {
    const existing = openTranscriptViewers.find(v => v.transcriptId === transcript.id);
    if (existing) {
      topZIndexRef.current += 1;
      setOpenTranscriptViewers(prev => prev.map(v => v.transcriptId === transcript.id ? { ...v, minimized: false, zIndex: topZIndexRef.current } : v));
      return;
    }
    try {
      const detail = await apiGetTranscriptDetail(transcript.id);
      const id = ++nextViewerIdRef.current;
      const offset = (openTranscriptViewers.filter(v => !v.minimized).length % 6) * 30;
      topZIndexRef.current += 1;
      setOpenTranscriptViewers(prev => [...prev, {
        id, transcriptId: transcript.id, filename: transcript.filename,
        isVideo: transcript.isVideo || false, durationSeconds: detail.durationSeconds || transcript.durationSeconds || 0,
        scribeTranscriptId: transcript.scribeTranscriptId || null, scribeStatus: transcript.scribeStatus || null,
        transcriptDetail: detail, transcriptEdits: JSON.parse(JSON.stringify(detail.transcript || [])),
        minimized: false, zIndex: topZIndexRef.current,
        position: { x: 100 + offset, y: 50 + offset },
        size: { width: Math.min(900, window.innerWidth * 0.7), height: Math.min(650, window.innerHeight * 0.8) },
      }]);
    } catch (err) { alert("Failed to open transcript: " + err.message); }
  };

  const closeTranscriptViewer = (viewerId) => {
    setOpenTranscriptViewers(prev => prev.filter(v => v.id !== viewerId));
    setMinChipScrollIdx(i => Math.max(0, i - 1));
  };

  const minimizeTranscriptViewer = (viewerId) => {
    setOpenTranscriptViewers(prev => prev.map(v => v.id === viewerId ? { ...v, minimized: true } : v));
  };

  const restoreTranscriptViewer = (viewerId) => {
    topZIndexRef.current += 1;
    setOpenTranscriptViewers(prev => prev.map(v => v.id === viewerId ? { ...v, minimized: false, zIndex: topZIndexRef.current } : v));
  };

  const bringTranscriptViewerToFront = (viewerId) => {
    topZIndexRef.current += 1;
    setOpenTranscriptViewers(prev => prev.map(v => v.id === viewerId ? { ...v, zIndex: topZIndexRef.current } : v));
  };

  useEffect(() => {
    apiMe().then(user => {
      setCurrentUser(user);
      const prefs = user.preferences || {};
      if (prefs.darkMode !== undefined) {
        setDarkMode(prefs.darkMode);
      }
      apiCheckPermissions().then(data => {
        if (data.isAdmin) {
          setUserPerms({ _isAdmin: true });
        } else {
          setUserPerms(data.permissions || {});
        }
      }).catch(() => setUserPerms({}));
    }).catch(() => {}).finally(() => setSessionChecked(true));
  }, []);

  const savePreference = useCallback((key, value) => {
    apiSavePreferences({ [key]: value }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("lextrack-dark", darkMode ? "1" : "0");
    if (darkMode) {
      document.body.classList.add("dark-body");
    } else {
      document.body.classList.remove("dark-body");
    }
  }, [darkMode]);
  useEffect(() => {
    if (view === VIEWS.CONTACTS && !contextContactsCache) {
      apiGetContacts().then(setContextContactsCache).catch(() => {});
    }
    if (view === VIEWS.DOCUMENTS && !contextTemplatesCache) {
      apiGetTemplates().then(setContextTemplatesCache).catch(() => {});
    }
    if (view === VIEWS.TIMELOG && currentUser) {
      const now = new Date();
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
      const from = mon.toISOString().split("T")[0];
      const to = now.toISOString().split("T")[0];
      apiGetTimeEntries(currentUser.id, from, to).then(setContextTimeManualCache).catch(() => {});
    }
  }, [view, currentUser, contextContactsCache, contextTemplatesCache]);

  const buildScreenContext = useCallback(() => {
    const v = view;
    const lines = [];
    const caseMap = {};
    allCases.forEach(cs => { caseMap[cs.id] = cs.case_num || cs.title; });

    const nowDate = new Date();
    const thisWeekStart = new Date(nowDate); thisWeekStart.setDate(nowDate.getDate() - ((nowDate.getDay() + 6) % 7));
    const nextWeekEnd = new Date(thisWeekStart); nextWeekEnd.setDate(thisWeekStart.getDate() + 13);
    const inRange = (dateStr, from, to) => { if (!dateStr) return false; const d = new Date(dateStr); return d >= from && d <= to; };

    if (v === "dashboard") {
      lines.push(`Screen: Dashboard`);
      const myTasks = tasks.filter(t => t.assigned === currentUser?.id && t.status !== "Completed");
      const overdue = myTasks.filter(t => t.due && new Date(t.due) < nowDate);
      const activeCases = allCases.filter(c => c.status === "Active");
      lines.push(`Active cases: ${activeCases.length}`);
      lines.push(`My open tasks: ${myTasks.length} (${overdue.length} overdue)`);
      const upcoming = allDeadlines.filter(d => { const dd = new Date(d.date); return dd >= nowDate && dd <= new Date(Date.now() + 7 * 86400000); });
      lines.push(`Upcoming deadlines (7 days): ${upcoming.length}`);
      if (upcoming.length > 0) lines.push(`Next deadlines: ${upcoming.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 8).map(d => `${d.title} (${d.date}, case: ${caseMap[d.caseId] || d.caseId})`).join("; ")}`);
      if (pinnedCaseIds.length > 0) {
        const pinned = allCases.filter(c => pinnedCaseIds.includes(c.id));
        lines.push(`Pinned cases: ${pinned.map(c => `${c.case_num || ""} ${c.client_name || c.title}`).join("; ")}`);
      }
      if (unreadClientComm.length > 0) {
        lines.push(`\nUnread client communication: ${unreadClientComm.length} case(s) with unread items`);
        unreadClientComm.forEach(item => {
          const parts = [];
          if (item.messageCount > 0) parts.push(`${item.messageCount} unread message(s)`);
          if (item.documentCount > 0) parts.push(`${item.documentCount} unviewed document upload(s)`);
          lines.push(`  Case "${item.caseTitle}" (${item.clientName}): ${parts.join(", ")}`);
          if (item.messages && item.messages.length > 0) {
            item.messages.slice(0, 3).forEach(m => {
              lines.push(`    Message from ${m.senderName} (${new Date(m.createdAt).toLocaleString()}): "${(m.body || "").substring(0, 100)}"`);
            });
          }
          if (item.documents && item.documents.length > 0) {
            item.documents.slice(0, 3).forEach(d => {
              lines.push(`    Document uploaded: "${d.filename}" (${new Date(d.createdAt).toLocaleString()})`);
            });
          }
        });
      }
    } else if (v === "cases") {
      lines.push(`Screen: Cases`);
      lines.push(`Total cases: ${allCases.length}`);
      const byStatus = {};
      allCases.forEach(c => { byStatus[c.status || "Unknown"] = (byStatus[c.status || "Unknown"] || 0) + 1; });
      lines.push(`By status: ${Object.entries(byStatus).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      const byStage = {};
      allCases.forEach(c => { byStage[c.stage || "Unknown"] = (byStage[c.stage || "Unknown"] || 0) + 1; });
      lines.push(`By stage: ${Object.entries(byStage).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      if (selectedCase) {
        const sc = selectedCase;
        lines.push(`\nViewing case: ${sc.case_num || ""} — ${sc.title}`);
        lines.push(`Client: ${sc.client_name || "Unknown"}, Type: ${sc.case_type || "Unknown"}, Stage: ${sc.stage || "Unknown"}, Status: ${sc.status || "Unknown"}`);
      }
    } else if (v === "deadlines") {
      lines.push(`Screen: Calendar`);
      lines.push(`Total deadlines: ${allDeadlines.length}`);
      const overdueDl = allDeadlines.filter(d => new Date(d.date) < nowDate && !d.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (overdueDl.length > 0) lines.push(`OVERDUE deadlines (${overdueDl.length}): ${overdueDl.slice(0, 8).map(d => `${d.title} (${d.date}, case: ${caseMap[d.caseId] || d.caseId})`).join("; ")}`);
      const thisWeekDl = allDeadlines.filter(d => inRange(d.date, thisWeekStart, new Date(thisWeekStart.getTime() + 6 * 86400000)));
      if (thisWeekDl.length > 0) lines.push(`This week (${thisWeekDl.length}): ${thisWeekDl.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 10).map(d => `${d.title} (${d.date}, case: ${caseMap[d.caseId] || d.caseId})`).join("; ")}`);
      const nextWeekDl = allDeadlines.filter(d => { const dd = new Date(d.date); return dd > new Date(thisWeekStart.getTime() + 6 * 86400000) && dd <= nextWeekEnd; });
      if (nextWeekDl.length > 0) lines.push(`Next week (${nextWeekDl.length}): ${nextWeekDl.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 10).map(d => `${d.title} (${d.date}, case: ${caseMap[d.caseId] || d.caseId})`).join("; ")}`);
      const courtDates = allDeadlines.filter(d => /court|hearing|trial|arraign/i.test(d.title) && new Date(d.date) >= nowDate);
      if (courtDates.length > 0) lines.push(`Upcoming court dates (${courtDates.length}): ${courtDates.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 8).map(d => `${d.title} (${d.date}, case: ${caseMap[d.caseId] || d.caseId})`).join("; ")}`);
      const tasksDue = tasks.filter(t => t.due && t.status !== "Completed" && new Date(t.due) >= nowDate).sort((a, b) => new Date(a.due) - new Date(b.due));
      lines.push(`Tasks with upcoming due dates: ${tasksDue.length}`);
      if (tasksDue.length > 0) lines.push(`Next task deadlines: ${tasksDue.slice(0, 8).map(t => `"${t.title}" (due ${t.due}, case: ${caseMap[t.caseId] || ""})`).join("; ")}`);
    } else if (v === "tasks") {
      lines.push(`Screen: Tasks`);
      const open = tasks.filter(t => t.status !== "Completed");
      const overdue = open.filter(t => t.due && new Date(t.due) < nowDate);
      lines.push(`Total tasks: ${tasks.length}, Open: ${open.length}, Overdue: ${overdue.length}`);
      const byPriority = {};
      open.forEach(t => { byPriority[t.priority || "Medium"] = (byPriority[t.priority || "Medium"] || 0) + 1; });
      lines.push(`Open by priority: ${Object.entries(byPriority).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      const myTasks = open.filter(t => t.assigned === currentUser?.id);
      lines.push(`My open tasks: ${myTasks.length}`);
      if (overdue.length > 0) lines.push(`Overdue: ${overdue.slice(0, 10).map(t => `"${t.title}" (due ${t.due}, case: ${caseMap[t.caseId] || ""})`).join("; ")}`);
    } else if (v === "documents") {
      lines.push(`Screen: Templates`);
      lines.push(`This screen shows document templates (.docx) that can be used to generate documents for cases.`);
      if (contextTemplatesCache && contextTemplatesCache.length > 0) {
        lines.push(`Total templates: ${contextTemplatesCache.length}`);
        const byCat = {};
        contextTemplatesCache.forEach(t => { byCat[t.category || "General"] = (byCat[t.category || "General"] || 0) + 1; });
        lines.push(`By category: ${Object.entries(byCat).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
        const catGroups = {};
        contextTemplatesCache.forEach(t => { const cat = t.category || "General"; if (!catGroups[cat]) catGroups[cat] = []; catGroups[cat].push(t.name); });
        Object.entries(catGroups).forEach(([cat, names]) => { lines.push(`  ${cat}: ${names.join(", ")}`); });
        const allPlaceholders = new Set();
        contextTemplatesCache.forEach(t => { (t.placeholders || []).forEach(p => allPlaceholders.add(p)); });
        if (allPlaceholders.size > 0) lines.push(`Available placeholders: ${[...allPlaceholders].slice(0, 30).join(", ")}`);
      } else {
        lines.push(`Templates support placeholders like {{client_name}}, {{case_number}} that auto-fill with case data.`);
      }
    } else if (v === "timelog") {
      lines.push(`Screen: Time Log`);
      const timeRows = [];
      const from = new Date(thisWeekStart); from.setHours(0,0,0,0);
      const to = new Date(); to.setHours(23,59,59,999);
      const findCase = (id) => allCases.find(c => c.id === id);
      const inTR = (dateStr) => { if (!dateStr) return false; const d = new Date(dateStr); return d >= from && d <= to; };

      tasks.forEach(t => {
        const creditId = t.timeLogUser || t.completedBy || t.assigned;
        if (creditId !== currentUser?.id) return;
        if (t.status !== "Completed" || !t.completedAt) return;
        if (!inTR(t.completedAt)) return;
        const cs = findCase(t.caseId);
        timeRows.push({ source: "task", date: t.completedAt, caseTitle: cs?.title || `Case #${t.caseId}`, detail: t.title, time: t.timeLogged || "" });
      });

      Object.entries(caseNotes).forEach(([caseId, notes]) => {
        (notes || []).forEach(note => {
          const creditId = note.timeLogUser || note.authorId;
          if (creditId !== currentUser?.id) return;
          if (!inTR(note.createdAt)) return;
          const cs = findCase(Number(caseId));
          timeRows.push({ source: "note", date: note.createdAt, caseTitle: cs?.title || `Case #${caseId}`, detail: (note.body || "").slice(0, 60), time: note.timeLogged || "" });
        });
      });

      const myCaseIds = new Set(allCases.filter(c => [c.assignedAttorney, c.secondAttorney, c.caseManager, c.investigator, c.paralegal].includes(currentUser?.id)).map(c => c.id));
      allCorrespondence.forEach(email => {
        if (!myCaseIds.has(email.caseId)) return;
        if (!inTR(email.receivedAt)) return;
        const cs = findCase(email.caseId);
        timeRows.push({ source: "email", date: email.receivedAt, caseTitle: cs?.title || `Case #${email.caseId}`, detail: email.subject || "(no subject)", time: "" });
      });

      if (contextTimeManualCache) {
        contextTimeManualCache.forEach(me => {
          timeRows.push({ source: "manual", date: me.date, caseTitle: me.caseTitle || `Case #${me.caseId || "?"}`, detail: me.detail, time: me.time || "" });
        });
      }

      timeRows.sort((a, b) => new Date(b.date) - new Date(a.date));
      const totalHours = timeRows.reduce((s, r) => s + (parseFloat(r.time) || 0), 0);
      const bySrc = {};
      timeRows.forEach(r => { bySrc[r.source] = (bySrc[r.source] || 0) + 1; });
      const byCase = {};
      timeRows.forEach(r => { byCase[r.caseTitle] = (byCase[r.caseTitle] || 0) + (parseFloat(r.time) || 0); });
      const topCases = Object.entries(byCase).sort((a, b) => b[1] - a[1]).slice(0, 8);

      lines.push(`Date range: ${from.toISOString().split("T")[0]} to ${to.toISOString().split("T")[0]} (this week)`);
      lines.push(`Total entries: ${timeRows.length}, Total hours: ${totalHours.toFixed(1)}`);
      lines.push(`By source: ${Object.entries(bySrc).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      if (topCases.length > 0) lines.push(`Hours by case: ${topCases.map(([c, h]) => `${c}: ${h.toFixed(1)}h`).join(", ")}`);
      if (timeRows.length > 0) lines.push(`Recent entries:\n${timeRows.slice(0, 15).map(r => `  ${r.date?.split("T")[0] || "?"} | ${r.source} | ${r.caseTitle} | ${r.detail?.slice(0, 50) || ""} | ${r.time || "—"}`).join("\n")}`);
    } else if (v === "reports") {
      lines.push(`Screen: Reports`);
      lines.push(`Available report types: Overdue Tasks, Upcoming Hearings, Workload Report, Cases by Status, Cases by Stage, Cases by Custody Status, Pending Custody Actions, Caseload Summary`);
      const overdueTasks = tasks.filter(t => t.status !== "Completed" && t.due && new Date(t.due) < nowDate);
      lines.push(`Overdue tasks: ${overdueTasks.length}`);
      if (overdueTasks.length > 0) lines.push(`Top overdue: ${overdueTasks.sort((a,b) => new Date(a.due) - new Date(b.due)).slice(0, 5).map(t => `"${t.title}" (due ${t.due}, case: ${caseMap[t.caseId] || ""})`).join("; ")}`);
      const upcomingHearings = allDeadlines.filter(d => /hearing|court|trial|arraign/i.test(d.title) && new Date(d.date) >= nowDate).sort((a,b) => new Date(a.date) - new Date(b.date));
      lines.push(`Upcoming hearings: ${upcomingHearings.length}`);
      if (upcomingHearings.length > 0) lines.push(`Next hearings: ${upcomingHearings.slice(0, 5).map(d => `${d.title} (${d.date}, case: ${caseMap[d.caseId] || d.caseId})`).join("; ")}`);
      const byStatus = {};
      allCases.forEach(c => { byStatus[c.status || "Unknown"] = (byStatus[c.status || "Unknown"] || 0) + 1; });
      lines.push(`Cases by status: ${Object.entries(byStatus).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      const byStage = {};
      allCases.forEach(c => { byStage[c.stage || "Unknown"] = (byStage[c.stage || "Unknown"] || 0) + 1; });
      lines.push(`Cases by stage: ${Object.entries(byStage).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      const byType = {};
      allCases.forEach(c => { byType[c.caseType || "Unknown"] = (byType[c.caseType || "Unknown"] || 0) + 1; });
      lines.push(`Cases by type: ${Object.entries(byType).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
    } else if (v === "aicenter") {
      lines.push(`Screen: AI Center`);
      lines.push(`Available AI agents: Liability Analysis, Deadline Generator, Case Valuation & Strategy, Document Drafting, Case Triage, Client Communication Summary, Medical Record Summarizer, Task Suggestions, Filing Classifier, Advocate AI, Batch Case Manager`);
      lines.push(`The "Advocate AI Trainer" tab allows creating training entries to customize AI behavior.`);
    } else if (v === "contacts") {
      lines.push(`Screen: Contacts`);
      if (contextContactsCache && contextContactsCache.length > 0) {
        lines.push(`Total contacts: ${contextContactsCache.length}`);
        const byCat = {};
        contextContactsCache.forEach(c => { byCat[c.category || "Other"] = (byCat[c.category || "Other"] || 0) + 1; });
        lines.push(`By category: ${Object.entries(byCat).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
        const pinnedContactIds = currentUser?.preferences?.pinnedContacts || [];
        if (pinnedContactIds.length > 0) {
          const pinned = contextContactsCache.filter(c => pinnedContactIds.includes(c.id));
          if (pinned.length > 0) lines.push(`Pinned contacts: ${pinned.map(c => `${c.name} (${c.category || "Other"})`).join(", ")}`);
        }
        const recent = contextContactsCache.slice(0, 10);
        lines.push(`Sample contacts: ${recent.map(c => `${c.name} (${c.category || "Other"})`).join(", ")}`);
      } else {
        lines.push(`Contact directory for insurance adjusters, medical providers, defense attorneys, judges, courts, witnesses, experts, clients, and more.`);
      }
    } else if (v === "trialcenter") {
      lines.push(`Screen: Trial Center`);
      lines.push(`The Trial Center is used to prepare and manage active trials. It includes tabs for Witnesses, Exhibits, Jury, Motions, Outlines (Opening/Closing/Cross), Jury Instructions, Timeline, Pinned Docs, Trial Log, and AI Agents.`);
      const tcCaseId = currentUser?.preferences?.trialCenterCaseId;
      if (tcCaseId) {
        const tcCase = allCases.find(c => c.id === tcCaseId);
        if (tcCase) {
          lines.push(`\nCurrently loaded case: ${tcCase.case_num || ""} — ${tcCase.title || ""}`);
          lines.push(`Client: ${tcCase.client_name || "Unknown"}`);
          lines.push(`Case Type: ${tcCase.case_type || "Unknown"} | State: ${tcCase.state_jurisdiction || "Unknown"}`);
          lines.push(`Stage: ${tcCase.stage || "Unknown"} | Status: ${tcCase.status || "Unknown"}`);
          lines.push(`Court: ${tcCase.court || "Not specified"} | Judge: ${tcCase.judge || "Not assigned"}`);
          lines.push(`Injury Type: ${tcCase.injury_type || "Unknown"}`);
          lines.push(`Trial Date: ${tcCase.trial_date || "Not set"}`);
          lines.push(`Incident: ${tcCase.incident_description || "Not provided"}`);
          lines.push(`Liability: ${tcCase.liability_assessment || "Not assessed"}`);
          lines.push(`Comparative Fault: ${tcCase.comparative_fault_pct ? tcCase.comparative_fault_pct + "%" : "Unknown"}`);
        } else {
          lines.push(`A case was previously loaded but may no longer be available.`);
        }
      } else {
        lines.push(`No case is currently loaded in the Trial Center. The user needs to search and select a case first.`);
      }
      lines.push(`\nAvailable AI Trial Agents: Witness Prep, Jury Selection (Voir Dire analysis), Objection Coach, Opening Statement Builder, Closing Argument Builder, Jury Instructions, Case Law Research.`);
    } else if (v === "customization") {
      lines.push(`Screen: Customization`);
      lines.push(`This is the admin-only Customization hub with 4 sub-tabs:`);
      lines.push(`1. Custom Agents — Create custom AI agents with configurable system prompts, models, and temperature. Agents can be run against any case.`);
      lines.push(`2. Custom Reports — Build custom reports from any data source (cases, tasks, deadlines, contacts, correspondence, filings, documents, transcripts, time entries, medical treatments, expenses, negotiations) with filters, column selection, and sorting.`);
      lines.push(`3. Dashboard Widgets — Create custom dashboard widgets (metric, list, or chart type) from data sources like cases, tasks, deadlines, contacts, correspondence, and expenses. Widgets appear in the dashboard's Customize modal.`);
      lines.push(`4. Task Flows — Condition-based automation: when a case field matches a condition (e.g. status changes to "Settled", client bankruptcy is true), automatically create a sequence of tasks with role assignments, due dates, priorities, dependencies, recurrence, and auto-escalation.`);
      lines.push(`Only App Admin users can access the Customization section.`);
    } else if (v === "staff") {
      lines.push(`Screen: Staff`);
      const active = allUsers.filter(u => !u.deleted);
      lines.push(`Active staff members: ${active.length}`);
      const byRole = {};
      active.forEach(u => { byRole[u.role || "Unknown"] = (byRole[u.role || "Unknown"] || 0) + 1; });
      lines.push(`By role: ${Object.entries(byRole).map(([k, v2]) => `${k}: ${v2}`).join(", ")}`);
      const workload = {};
      allCases.filter(c => c.status === "Active").forEach(c => {
        if (c.assignedAttorney) workload[c.assignedAttorney] = (workload[c.assignedAttorney] || 0) + 1;
      });
      const staffWithLoad = active.filter(u => workload[u.id]).map(u => ({ name: u.name, cases: workload[u.id] })).sort((a, b) => b.cases - a.cases);
      if (staffWithLoad.length > 0) lines.push(`Active caseloads: ${staffWithLoad.slice(0, 10).map(s => `${s.name}: ${s.cases}`).join(", ")}`);
    }

    if (advocateFromHelpCenter) {
      lines.push(`User opened Advocate AI from the Help Center. They may need help learning how to use MattrMindr, understanding features, or getting started. Be welcoming and helpful — explain features clearly, offer to walk them through workflows, and suggest relevant tutorials. Available features include: Case Management, Calendar & Deadlines, Tasks, Documents & Templates, Correspondence (Email & SMS), AI Center, Contacts, Reports, Time Log, and Staff Management.`);
    }

    return lines.join("\n").substring(0, 4000);
  }, [view, allCases, tasks, allDeadlines, allUsers, currentUser, pinnedCaseIds, selectedCase, allCorrespondence, caseNotes, contextContactsCache, contextTemplatesCache, contextTimeManualCache, advocateFromHelpCenter, unreadClientComm]);

  const openAdvocateFromCase = useCallback((caseId) => {
    if (advocateCaseId !== caseId) {
      setAdvocateMessages([]);
      setAdvocateStats(null);
      setAdvocateTasksAdded({});
      setAdvocateInput("");
      setAdvocateLoading(false);
    }
    setAdvocateCaseId(caseId);
    setShowAdvocateGlobal(true);
  }, [advocateCaseId]);

  const openTrialCenterFromCase = useCallback((caseId) => {
    apiSavePreferences({ trialCenterCaseId: caseId }).catch(() => {});
    setCurrentUser(prev => prev ? { ...prev, preferences: { ...(prev.preferences || {}), trialCenterCaseId: caseId } } : prev);
    setSelectedCase(null);
    setView(VIEWS.TRIAL_CENTER);
  }, []);

  const advocateSend = useCallback((text) => {
    if (!text.trim() || advocateLoading) return;
    const newMsgs = [...advocateMessages, { role: "user", content: text.trim() }];
    setAdvocateMessages(newMsgs);
    setAdvocateLoading(true);
    setAdvocateInput("");
    setAdvocateScreenChips(null);
    const sc = buildScreenContext();
    apiAdvocateChat({ caseId: advocateCaseId || null, messages: newMsgs, screenContext: sc }).then(r => {
      setAdvocateMessages(p => [...p, { role: "assistant", content: r.reply, suggestedTasks: r.suggestedTasks || null }]);
      if (r.contextStats) setAdvocateStats(r.contextStats);
    }).catch(() => {
      setAdvocateMessages(p => [...p, { role: "assistant", content: "I encountered an error. Please try again." }]);
    }).finally(() => setAdvocateLoading(false));
  }, [advocateMessages, advocateLoading, advocateCaseId, buildScreenContext]);

  const advocateClearConversation = useCallback(() => {
    setAdvocateMessages([]);
    setAdvocateStats(null);
    setAdvocateTasksAdded({});
    setAdvocateInput("");
    setAdvocateLoading(false);
    setAdvocateScreenChips(null);
    setAdvocateFromHelpCenter(false);
  }, []);

  useEffect(() => {
    const justOpened = showAdvocateGlobal && !advocatePrevOpenRef.current;
    const viewChanged = view !== advocatePrevViewRef.current;

    if (viewChanged) {
      advocatePrevViewRef.current = view;
      if (advocateFromHelpCenter) setAdvocateFromHelpCenter(false);
    }

    if (showAdvocateGlobal) {
      if (justOpened && advocateLastOpenViewRef.current && view !== advocateLastOpenViewRef.current && !advocateCaseId) {
        setAdvocateScreenChips(view);
      } else if (!justOpened && viewChanged && !advocateCaseId) {
        setAdvocateScreenChips(view);
      }
      advocateLastOpenViewRef.current = view;
    }

    advocatePrevOpenRef.current = showAdvocateGlobal;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, showAdvocateGlobal, advocateCaseId]);

  const ADVOCATE_SCREEN_CHIPS = {
    dashboard: ["What needs my attention today?", "Summarize my upcoming deadlines", "Which cases are most urgent?"],
    cases: ["Help me analyze this case", "What motions should I consider?", "Summarize the defense strategy"],
    deadlines: ["What deadlines are coming up?", "How do I use the rules calculator?", "What court dates do I have this week?"],
    tasks: ["What tasks are overdue?", "Suggest tasks for my active cases", "Help me prioritize my work"],
    documents: ["How do I create a template?", "What placeholders are available?", "Help me generate a document"],
    timelog: ["Summarize my time this week", "Which cases have the most time logged?", "How do I add a time entry?"],
    reports: ["What reports are available?", "How do I run a workload report?", "How do I export report data?"],
    aicenter: ["What AI tools are available?", "How do I train the AI agents?", "How do I run a batch operation?"],
    contacts: ["How do I add a new contact?", "How do I merge duplicate contacts?", "How do I pin a contact?"],
    staff: ["Show me the team workload", "How do I manage staff roles?", "Who has the most cases?"],
    collaborate: ["How do I start a group chat?", "How do I message someone privately?", "How do I use case discussions?"],
    trialcenter: ["Help me prepare voir dire questions", "Analyze jury composition for bias", "Draft an opening statement outline"],
    customization: ["How do I create a task flow?", "How do I build a custom dashboard widget?", "How do I create a custom report?"],
    helpcenter: ["How do I get started with MattrMindr?", "What features are available?", "How do I manage my cases?"],
  };

  const SCREEN_LABELS = {
    [VIEWS.DASHBOARD]: { icon: "⬛", label: "Dashboard" },
    [VIEWS.CASES]: { icon: "⚖️", label: "Cases" },
    [VIEWS.DEADLINES]: { icon: "📅", label: "Calendar" },
    [VIEWS.TASKS]: { icon: "✅", label: "Tasks" },
    [VIEWS.DOCUMENTS]: { icon: "📄", label: "Templates" },
    [VIEWS.TIMELOG]: { icon: "🕐", label: "Time Log" },
    [VIEWS.REPORTS]: { icon: "📊", label: "Reports" },
    [VIEWS.AI_CENTER]: { icon: "✦", label: "AI Center" },
    [VIEWS.COLLABORATE]: { icon: "💬", label: "Collaborate" },
    [VIEWS.CONTACTS]: { icon: "📇", label: "Contacts" },
    [VIEWS.STAFF]: { icon: "👥", label: "Staff" },
    [VIEWS.TRIAL_CENTER]: { icon: "⚖️", label: "Trial Center" },
    [VIEWS.CUSTOMIZATION]: { icon: "⚙️", label: "Customization" },
    helpcenter: { icon: "❓", label: "Help Center" },
  };

  // shape: { target, caseForTask, updatedTasksAfterComplete, pendingChainSpawns, completedDate }

  useEffect(() => {
    if (!currentUser) return;
    const prefs = currentUser.preferences || {};
    const migrated = {};
    try {
      const localDark = localStorage.getItem("lextrack-dark");
      if (localDark !== null && prefs.darkMode === undefined) {
        migrated.darkMode = localDark === "1";
        setDarkMode(migrated.darkMode);
      }
      const localLayout = localStorage.getItem(`dashboard_layout_${currentUser.id}`);
      if (localLayout && !prefs.dashboardLayout) {
        try { migrated.dashboardLayout = JSON.parse(localLayout); } catch {}
      }
      const calKeys = { cal_showDeadlines: "deadlines", cal_showTasks: "tasks", cal_showCourtDates: "courtDates", cal_showExternal: "external" };
      if (!prefs.calendarToggles) {
        const ct = {};
        let found = false;
        for (const [lk, pk] of Object.entries(calKeys)) {
          const v = localStorage.getItem(lk);
          if (v !== null) { ct[pk] = v === "true"; found = true; }
        }
        if (found) migrated.calendarToggles = ct;
      }
      const localStaffPins = localStorage.getItem("lextrack-pinned-staff");
      if (localStaffPins && !prefs.pinnedStaff) {
        try { migrated.pinnedStaff = JSON.parse(localStaffPins); } catch {}
      }
      if (Object.keys(migrated).length > 0) {
        apiSavePreferences(migrated).then(() => {
          localStorage.removeItem("lextrack-dark");
          localStorage.removeItem(`dashboard_layout_${currentUser.id}`);
          Object.keys(calKeys).forEach(k => localStorage.removeItem(k));
          localStorage.removeItem("lextrack-pinned-staff");
          setCurrentUser(prev => ({ ...prev, preferences: { ...prefs, ...migrated } }));
        }).catch(() => {});
      }
    } catch {}
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setDataError(null);
    const isAdmin = (currentUser.roles || [currentUser.role]).includes("App Admin");
    const fetches = [
      apiGetCases(),
      apiGetTasks(),
      apiGetDeadlines(),
      apiGetUsers(),
      apiGetAllCorrespondence(),
      apiGetPinnedCases(),
    ];
    apiGetUnreadClientComm().then(d => setUnreadClientComm(d || [])).catch(() => {});
    if (isAdmin) fetches.push(apiGetDeletedUsers());
    Promise.all(fetches)
      .then(([cases, fetchedTasks, deadlines, users, corr, pinned, deletedUsersResult]) => {
        setAllCases(cases);
        setTasks(fetchedTasks);
        setAllDeadlines(deadlines);
        setAllCorrespondence(corr || []);
        const serverPins = pinned || [];
        if (serverPins.length === 0) {
          try {
            const localPins = JSON.parse(localStorage.getItem(`pinned_cases_${currentUser.id}`) || "[]");
            if (localPins.length > 0) {
              apiSetPinnedCases(localPins).then(() => localStorage.removeItem(`pinned_cases_${currentUser.id}`)).catch(() => {});
              setPinnedCaseIds(localPins);
            } else { setPinnedCaseIds([]); }
          } catch { setPinnedCaseIds([]); }
        } else {
          setPinnedCaseIds(serverPins);
          localStorage.removeItem(`pinned_cases_${currentUser.id}`);
        }
        const allU = [...users, ...(deletedUsersResult || []).map(u => ({ ...u, deletedAt: u.deletedAt || u.deleted_at }))];
        USERS.splice(0, USERS.length, ...users);
        setAllUsers(allU);

        const lastCaseId = localStorage.getItem("lextrack-last-case-id");
        const lastView = localStorage.getItem("lextrack-last-view");
        if (lastCaseId && lastView === VIEWS.CASES) {
          const found = cases.find(c => c.id === Number(lastCaseId));
          if (found) {
            setSelectedCase(found);
            navigate("/" + VIEWS.CASES);
            apiGetCaseTasks(found.id).then(caseTasks => {
              setTasks(prev => {
                const ids = new Set(prev.map(t => t.id));
                const extra = caseTasks.filter(t => !ids.has(t.id));
                return extra.length > 0 ? [...prev, ...extra] : prev;
              });
            }).catch(() => {});
          }
        }
      })
      .catch(err => setDataError(err.message))
      .finally(() => setLoading(false));
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleTogglePinnedCase = useCallback(async (caseId) => {
    setPinnedCaseIds(prev => {
      const next = prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId];
      apiSetPinnedCases(next).catch(err => console.error("Failed to save pinned cases:", err));
      return next;
    });
  }, []);

  const handleSelectCase = useCallback(async (c) => {
    setSelectedCase(c);
    if (c) {
      localStorage.setItem("lextrack-last-case-id", c.id.toString());
      try {
        const caseTasks = await apiGetCaseTasks(c.id);
        setTasks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const incoming = caseTasks.filter(t => !existingIds.has(t.id));
          return incoming.length > 0 ? [...prev, ...incoming] : prev;
        });
      } catch (err) {
        console.error("Failed to load case tasks:", err);
      }
    } else {
      localStorage.removeItem("lextrack-last-case-id");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [collabUnread, setCollabUnread] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = () => apiGetCollabUnreadCount().then(r => setCollabUnread(r.unread || 0)).catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  if (!sessionChecked) return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src="/mattrmindr-logo.png" alt="MattrMindr" style={{ height: 40 }} />
      <div style={{ fontSize: 10, color: "#0f172a", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Personal Injury Case Management</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>Restoring session…</div>
    </div>
  );

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  if (currentUser.mustChangePassword) return (
    <ChangePasswordModal forced currentUser={currentUser} onDone={() => setCurrentUser(prev => ({ ...prev, mustChangePassword: false }))} />
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src="/mattrmindr-logo.png" alt="MattrMindr" style={{ height: 40 }} />
      <div style={{ fontSize: 10, color: "#0f172a", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Personal Injury Case Management</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>Loading case data…</div>
    </div>
  );

  if (dataError) return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src="/mattrmindr-logo.png" alt="MattrMindr" style={{ height: 40 }} />
      <div style={{ fontSize: 10, color: "#0f172a", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Personal Injury Case Management</div>
      <div style={{ fontSize: 13, color: "#e05252" }}>Failed to load data: {dataError}</div>
      <button className="btn btn-outline" onClick={() => setCurrentUser(null)}>Return to Login</button>
    </div>
  );

  const overdueBadge = tasks.filter(t => t.assigned === currentUser?.id && t.status !== "Completed" && daysUntil(t.due) < 0).length;

  const handleAddRecord = async (record) => {
    try {
      const payload = {
        accidentDate: "", nextCourtDate: "",
        trialDate: "", judge: "",
        ...record,
        status: "Active",
      };
      const created = await apiCreateCase(payload);
      setAllCases(p => [...p, created]);

      if (record.autoTasks) {
        const defaultTasks = generateDefaultTasks(created, currentUser.id);
        const savedTasks = await apiCreateTasks(defaultTasks);
        setTasks(p => [...p, ...savedTasks]);
      }

      const activityEntry = {
        caseId: created.id,
        ts: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "Case Created",
        detail: `${recordType(created)} opened by ${currentUser.name}`,
      };
      await apiCreateActivity(activityEntry);
      setCaseActivity(prev => ({
        ...prev,
        [created.id]: [{ ...activityEntry, id: Date.now() }],
      }));

      setSelectedCase(created);
      setView(VIEWS.CASES);
    } catch (err) {
      alert("Failed to create case: " + err.message);
    }
  };

  const refreshCaseData = async () => {
    try {
      const fetches = [apiGetTasks(), apiGetDeadlines(), apiGetCases()];
      if (selectedCase) fetches.push(apiGetCaseTasks(selectedCase.id));
      const [freshTasks, freshDeadlines, freshCases, caseTasks] = await Promise.all(fetches);
      if (caseTasks && caseTasks.length > 0) {
        const userTaskIds = new Set(freshTasks.map(t => t.id));
        const extra = caseTasks.filter(t => !userTaskIds.has(t.id));
        setTasks(extra.length > 0 ? [...freshTasks, ...extra] : freshTasks);
      } else {
        setTasks(freshTasks);
      }
      setAllDeadlines(freshDeadlines);
      setAllCases(prev => {
        const merged = freshCases.map(fc => {
          const existing = prev.find(p => p.id === fc.id);
          return existing ? { ...existing, ...fc } : fc;
        });
        return merged;
      });
    } catch (e) {}
  };

  const TEAM_ROLES = ["assignedAttorney", "secondAttorney", "caseManager", "investigator", "paralegal"];

  const handleUpdateCase = async (updated) => {
    try {
      const prev = allCases.find(c => c.id === updated.id);
      const saved = await apiUpdateCase(updated.id, updated);
      setAllCases(p => p.map(c => c.id === saved.id ? saved : c));
      setSelectedCase(saved);

      refreshCaseData();

      const roleChanges = prev ? TEAM_ROLES.filter(role => saved[role] !== prev[role]) : [];
      if (roleChanges.length > 0) {
        const results = await Promise.all(
          roleChanges.map(role => apiReassignTasksByRole(saved.id, role, saved[role] || 0))
        );
        const allReassigned = results.flat();
        if (allReassigned.length > 0) {
          setTasks(prev => prev.map(t => allReassigned.find(r => r.id === t.id) || t));
        }
      }

      // When status changes to "Disposed", spawn closing task + complete all other open tasks
      if (saved.status === "Disposed" && prev && prev.status !== "Disposed") {
        const alreadyExists = tasks.some(t =>
          t.caseId === saved.id && t.title === "Notify client of case disposition"
        );
        if (!alreadyExists) {
          const triggerTask = {
            caseId: saved.id,
            title: "Notify client of case disposition",
            assigned: saved.assignedAttorney || 0,
            assignedRole: "assignedAttorney",
            due: addDays(today, 7),
            priority: "High",
            autoEscalate: false,
            status: "Not Started",
            notes: "Auto-generated when case status was set to Disposed.",
            recurring: false,
            recurringDays: null,
            isGenerated: true,
            isChained: true,
          };
          const savedTask = await apiCreateTask(triggerTask);
          setTasks(prev => [...prev, savedTask]);
        }
        const openOthers = tasks.filter(t =>
          t.caseId === saved.id &&
          t.status !== "Completed" &&
          t.title !== "Notify client of case disposition"
        );
        if (openOthers.length > 0) {
          const completed = await Promise.all(
            openOthers.map(t => apiUpdateTask(t.id, { status: "Completed" }))
          );
          setTasks(prev => prev.map(t => completed.find(c => c.id === t.id) || t));
        }
      }

      // When status changes to "Closed", mark all open tasks as Completed
      if (saved.status === "Closed" && prev && prev.status !== "Closed") {
        const openTasks = tasks.filter(t =>
          t.caseId === saved.id && t.status !== "Completed"
        );
        if (openTasks.length > 0) {
          const completed = await Promise.all(
            openTasks.map(t => apiUpdateTask(t.id, { status: "Completed" }))
          );
          setTasks(prev => prev.map(t => completed.find(c => c.id === t.id) || t));
        }
      }
    } catch (err) {
      alert("Failed to save case: " + err.message);
    }
  };

  const handleDeleteCase = (id) => {
    setAllCases(p => p.filter(c => c.id !== id));
    setSelectedCase(null);
  };

  const handleRestoreCase = (restoredCase) => {
    setDeletedCases(p => p ? p.filter(c => c.id !== restoredCase.id) : null);
    setAllCases(p => [...p, restoredCase].sort((a, b) => (a.title || "").localeCompare(b.title || "")));
  };

  const handleUpdateTask = async (taskId, changes) => {
    try {
      const saved = await apiUpdateTask(taskId, changes);
      setTasks(prev => prev.map(t => t.id === taskId ? saved : t));
      refreshCaseData();
    } catch (err) {
      alert("Failed to update task: " + err.message);
    }
  };

  const handleCompleteTask = (taskId) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    if (target.status === "Completed") {
      finishCompleteTask(taskId, null, null, null, true);
    } else {
      const caseForTask = allCases.find(c => c.id === target.caseId);
      setPendingTimePrompt({ taskId, task: target, completingUser: currentUser, caseForTask });
    }
  };

  const logTaskActivity = (target, action, detail) => {
    const entry = {
      id: newId(),
      caseId: target.caseId,
      ts: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      detail,
    };
    apiCreateActivity(entry)
      .then(saved => setCaseActivity(prev => ({ ...prev, [target.caseId]: [saved, ...(prev[target.caseId] || [])] })))
      .catch(e => console.error("Failed to log activity:", e));
  };

  const finishCompleteTask = async (taskId, timeLogged, completedBy, timeLogUser, isUncomplete = false) => {
    setPendingTimePrompt(null);
    try {
      const target = tasks.find(t => t.id === taskId);
      if (!target) return;

      const toggled = await apiCompleteTask(
        taskId,
        isUncomplete ? null : timeLogged,
        isUncomplete ? null : completedBy,
        isUncomplete ? null : timeLogUser
      );
      const completing = toggled.status === "Completed";
      const completedDate = today;

      let updatedTasks = tasks.map(t => t.id === taskId ? toggled : t);

      if (!completing) {
        setTasks(updatedTasks);
        logTaskActivity(target, "Task Reopened", `"${target.title}" marked incomplete`);
        return;
      }

      const caseForTask = allCases.find(c => c.id === target.caseId);
      const resolveRole = (role) => role ? (caseForTask?.[role] || 0) : 0;

      const recurringSpawns = [];
      const chainSpawns = [];

      // Recurring spawn
      if (target.recurring && target.recurringDays) {
        recurringSpawns.push({
          caseId: target.caseId,
          title: target.title,
          assigned: target.assignedRole ? resolveRole(target.assignedRole) : target.assigned,
          assignedRole: target.assignedRole || null,
          due: addDays(target.due || completedDate, target.recurringDays),
          priority: target.priority,
          autoEscalate: target.autoEscalate,
          escalateMediumDays: target.escalateMediumDays,
          escalateHighDays: target.escalateHighDays,
          escalateUrgentDays: target.escalateUrgentDays,
          status: "Not Started",
          notes: target.notes || "",
          recurring: target.recurring,
          recurringDays: target.recurringDays,
          isGenerated: true,
          isChained: false,
        });
      }

      // Chain spawn — look up by exact title match
      const chainDef = TASK_CHAINS[target.title.trim()];
      if (chainDef) {
        const due = chainDef.dueDaysFromCompletion === 0
          ? completedDate
          : addDays(completedDate, chainDef.dueDaysFromCompletion);
        chainSpawns.push({
          caseId: target.caseId,
          title: chainDef.title,
          assigned: resolveRole(chainDef.assignedRole),
          assignedRole: chainDef.assignedRole || null,
          due,
          priority: chainDef.priority,
          autoEscalate: chainDef.autoEscalate,
          status: "Not Started",
          notes: chainDef.notes || "",
          recurring: false,
          recurringDays: null,
          isGenerated: true,
          isChained: true,
        });
      }

      // Multi-chain spawn — one completion spawns multiple tasks
      const multiChainDefs = MULTI_CHAINS[target.title.trim()];
      if (multiChainDefs) {
        multiChainDefs.forEach(def => {
          const alreadyExists = updatedTasks.some(t =>
            t.caseId === target.caseId && t.title.trim() === def.title
          );
          if (alreadyExists) return;
          chainSpawns.push({
            caseId: target.caseId,
            title: def.title,
            assigned: resolveRole(def.assignedRole),
            assignedRole: def.assignedRole || null,
            due: addDays(completedDate, def.dueDaysFromCompletion),
            priority: def.priority,
            autoEscalate: def.autoEscalate,
            status: "Not Started",
            notes: def.notes || "",
            recurring: false,
            recurringDays: null,
            isGenerated: true,
            isChained: true,
          });
        });
      }

      // Dual-condition chain spawn
      DUAL_CHAINS.forEach(rule => {
        const { requires, spawn: s } = rule;
        if (!requires.includes(target.title.trim())) return;
        const allDone = requires.every(reqTitle =>
          updatedTasks.some(t =>
            t.caseId === target.caseId &&
            t.title.trim() === reqTitle &&
            t.status === "Completed"
          )
        );
        if (!allDone) return;
        const alreadyExists = updatedTasks.some(t =>
          t.caseId === target.caseId && t.title.trim() === s.title
        );
        if (alreadyExists) return;
        const due = addDays(completedDate, s.dueDaysFromCompletion);
        chainSpawns.push({
          caseId: target.caseId,
          title: s.title,
          assigned: resolveRole(s.assignedRole),
          assignedRole: s.assignedRole || null,
          due,
          priority: s.priority,
          autoEscalate: s.autoEscalate,
          status: "Not Started",
          notes: s.notes || "",
          recurring: false,
          recurringDays: null,
          isGenerated: true,
          isChained: true,
        });
      });


      const assignedToOther = target.assigned > 0 && target.assigned !== currentUser.id;
      const completionDetail = assignedToOther
        ? `"${target.title}" completed by ${currentUser.name} (assigned to ${getUserById(target.assigned)?.name || "unknown"})`
        : `"${target.title}" marked complete`;

      // Follow-up tasks: always spawn recurring immediately, but hold chain spawns
      // until user decides whether they want another follow-up
      if (target.title.trim().startsWith("Follow-up")) {
        if (recurringSpawns.length > 0) {
          const savedR = await apiCreateTasks(recurringSpawns);
          updatedTasks = [...updatedTasks, ...savedR];
        }
        setTasks(updatedTasks);
        logTaskActivity(target, "Task Completed", completionDetail);
        setFollowUpPrompt({
          target,
          caseForTask,
          updatedTasksAfterComplete: updatedTasks,
          pendingChainSpawns: chainSpawns,
          completedDate,
        });
        return;
      }

      // Normal tasks: spawn everything
      const allSpawns = [...recurringSpawns, ...chainSpawns];
      if (allSpawns.length > 0) {
        const savedSpawned = await apiCreateTasks(allSpawns);
        updatedTasks = [...updatedTasks, ...savedSpawned];
      }

      setTasks(updatedTasks);
      logTaskActivity(target, "Task Completed", completionDetail);
      refreshCaseData();
    } catch (err) {
      alert("Failed to complete task: " + err.message);
    }
  };

  const handleFollowUpDecision = async (wantsFollowUp, days, escalate) => {
    const { target, caseForTask, updatedTasksAfterComplete, pendingChainSpawns } = followUpPrompt;
    const resolveRole = (role) => role ? (caseForTask?.[role] || 0) : 0;
    let updatedTasks = updatedTasksAfterComplete;
    try {
      if (wantsFollowUp) {
        const newTask = {
          caseId: target.caseId,
          title: target.title,
          assigned: target.assignedRole ? resolveRole(target.assignedRole) : target.assigned,
          assignedRole: target.assignedRole || null,
          due: addDays(today, days),
          priority: target.priority,
          autoEscalate: escalate,
          status: "Not Started",
          notes: `Follow-up rescheduled by user after completing previous "${target.title}".`,
          recurring: false,
          recurringDays: null,
          isGenerated: true,
          isChained: true,
        };
        const saved = await apiCreateTask(newTask);
        updatedTasks = [...updatedTasks, saved];
        // Pending chain spawns are NOT created — they will fire when this new follow-up is eventually completed
      } else {
        // User is done with follow-ups — release the pending chain tasks
        if (pendingChainSpawns.length > 0) {
          const savedChain = await apiCreateTasks(pendingChainSpawns);
          updatedTasks = [...updatedTasks, ...savedChain];
        }
      }
      setTasks(updatedTasks);
      refreshCaseData();
    } catch (err) {
      alert("Failed to process follow-up decision: " + err.message);
    }
    setFollowUpPrompt(null);
  };

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? " open" : ""} !bg-slate-900 dark:!bg-slate-950 !border-r-slate-800`}>
        <div className="sidebar-logo !border-b-slate-800 flex items-center gap-2.5">
          <img src="/mattrmindr-icon.png" alt="MattrMindr" className="w-8 h-8 rounded object-cover mix-blend-lighten" />
          <div>
            <div className="text-sm font-bold text-white tracking-wide">MattrMindr</div>
            <div className="text-[8px] text-slate-500 uppercase tracking-widest">Case Management</div>
          </div>
        </div>
        <div className="sidebar-user !border-b-slate-800">
          <Avatar userId={currentUser.id} size={34} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-200 truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500">{(currentUser.roles && currentUser.roles.length > 1) ? currentUser.roles.join(" · ") : currentUser.role}</div>
          </div>
        </div>
        <nav className="sidebar-nav !scrollbar-thin !scrollbar-thumb-slate-700">
          {[
            { id: VIEWS.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
            { id: VIEWS.CASES, icon: Briefcase, label: "Cases" },
            { id: VIEWS.DEADLINES, icon: Calendar, label: "Calendar" },
            { id: VIEWS.TASKS, icon: CheckSquare, label: "Tasks", badge: overdueBadge || null },
            { id: VIEWS.DOCUMENTS, icon: FileText, label: "Templates" },
            { id: VIEWS.TIMELOG, icon: Clock, label: "Time Log" },
            { id: VIEWS.REPORTS, icon: BarChart3, label: "Reports" },
            { id: VIEWS.AI_CENTER, icon: Brain, label: "AI Center" },
            { id: VIEWS.TRIAL_CENTER, icon: Scale, label: "Trial Center" },
            { id: VIEWS.COLLABORATE, icon: MessageSquare, label: "Collaborate", badge: collabUnread > 0 ? collabUnread : null },
            { id: VIEWS.CONTACTS, icon: Users, label: "Contacts" },
            { id: VIEWS.UNMATCHED, icon: Inbox, label: "Unmatched" },
            { id: VIEWS.STAFF, icon: UserCog, label: "Staff" },
            ...((isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.access_customization) ? [{ id: VIEWS.CUSTOMIZATION, icon: SlidersHorizontal, label: "Customization" }] : []),
            ...((isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.view_deleted_data) ? [{ id: VIEWS.DELETED, icon: Trash2, label: "Deleted Data" }] : []),
          ].map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <div key={item.id} className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer text-[13px] transition-all border-l-[3px] ${isActive ? "text-white bg-slate-800 border-l-amber-500 font-medium" : "text-slate-400 border-l-transparent hover:text-slate-200 hover:bg-slate-800/50"}`} onClick={() => { setView(item.id); setSelectedCase(null); localStorage.removeItem("lextrack-last-case-id"); setSidebarOpen(false); }}>
                <Icon size={17} className={isActive ? "text-amber-500" : ""} />
                {item.label}
                {item.badge && <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer !border-t-slate-800">
          <button className="flex items-center gap-2.5 w-full px-1 py-2 text-[12px] text-slate-400 hover:text-slate-200 transition-colors" onClick={() => setShowSettings(true)}>
            <Settings size={15} /> Settings
          </button>
          <button className="flex items-center gap-2.5 w-full px-1 py-2 text-[12px] text-slate-400 hover:text-slate-200 transition-colors" onClick={() => { setShowHelpCenter(true); setHelpCenterTab("tutorials"); }}>
            <HelpCircle size={15} /> Help Center
          </button>
        </div>
      </aside>
      {showChangePw && (
        <ChangePasswordModal currentUser={currentUser} onClose={() => setShowChangePw(false)} />
      )}
      {showSettings && (
        <SettingsModal currentUser={currentUser} darkMode={darkMode} onToggleDark={() => setDarkMode(d => { const next = !d; savePreference("darkMode", next); return next; })} onChangePassword={() => { setShowSettings(false); setShowChangePw(true); }} onSignOut={() => { apiLogout().catch(() => {}); setCurrentUser(null); setAllCases([]); setAllDeadlines([]); setTasks([]); setCaseNotes({}); setCaseLinks({}); setCaseActivity({}); setSelectedCase(null); setDeletedCases(null); localStorage.removeItem("lextrack-last-case-id"); localStorage.removeItem("lextrack-last-view"); }} onClose={() => setShowSettings(false)} hideAdvocateAI={hideAdvocateAI} onToggleHideAdvocate={(val) => { setHideAdvocateAI(val); apiSavePreferences({ hideAdvocateAI: val }).catch(() => {}); if (val) setShowAdvocateGlobal(false); }} onUpdateUser={setCurrentUser} />
      )}
      {showHelpCenter && (
        <HelpCenterModal currentUser={currentUser} tab={helpCenterTab} setTab={setHelpCenterTab} onClose={() => setShowHelpCenter(false)} onOpenAdvocate={() => { setShowHelpCenter(false); setAdvocateFromHelpCenter(true); setAdvocateScreenChips("helpcenter"); setShowAdvocateGlobal(true); }} />
      )}
      <div className="main">
        <Routes>
          <Route path={"/" + VIEWS.DASHBOARD} element={<Dashboard currentUser={currentUser} allCases={allCases} deadlines={allDeadlines} tasks={tasks} onSelectCase={(c, tab) => { setPendingTab(tab || null); handleSelectCase(c); setView(VIEWS.CASES); }} onAddRecord={handleAddRecord} onCompleteTask={handleCompleteTask} onUpdateTask={handleUpdateTask} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onNavigate={(viewId) => setView(viewId)} pinnedContacts={pinnedContactsList} onSelectContact={() => setView(VIEWS.CONTACTS)} confirmDelete={confirmDelete} />} />
          <Route path={"/" + VIEWS.CASES} element={<CasesView currentUser={currentUser} allCases={allCases} tasks={tasks} selectedCase={selectedCase} setSelectedCase={handleSelectCase} pendingTab={pendingTab} clearPendingTab={() => setPendingTab(null)} onAddRecord={handleAddRecord} onUpdateCase={handleUpdateCase} onCompleteTask={handleCompleteTask} onAddTask={(saved) => { setTasks(p => [...p, saved]); refreshCaseData(); }} deadlines={allDeadlines} caseNotes={caseNotes} setCaseNotes={setCaseNotes} caseLinks={caseLinks} setCaseLinks={setCaseLinks} caseActivity={caseActivity} setCaseActivity={setCaseActivity} deletedCases={deletedCases} setDeletedCases={setDeletedCases} onDeleteCase={handleDeleteCase} onRestoreCase={handleRestoreCase} onAddDeadline={async (dl) => { try { const saved = await apiCreateDeadline(dl); setAllDeadlines(p => [...p, saved]); refreshCaseData(); } catch (err) { console.error("Failed to add deadline:", err); } }} onUpdateDeadline={async (id, data) => { try { const updated = await apiUpdateDeadline(id, data); setAllDeadlines(p => p.map(d => d.id === id ? updated : d)); refreshCaseData(); } catch (err) { console.error("Failed to update deadline:", err); } }} onDeleteDeadline={async (id) => { try { await apiDeleteDeadline(id); setAllDeadlines(p => p.filter(d => d.id !== id)); refreshCaseData(); } catch (err) { console.error("Failed to delete deadline:", err); } }} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onTogglePinnedCase={handleTogglePinnedCase} onOpenAdvocate={openAdvocateFromCase} onOpenTrialCenter={openTrialCenterFromCase} confirmDelete={confirmDelete} openAppDocViewer={openAppDocViewer} openAppFilingViewer={openAppFilingViewer} openBlobInViewer={openBlobInViewer} openTranscriptViewer={openTranscriptViewer} />} />
          <Route path={"/" + VIEWS.DEADLINES} element={<DeadlinesView deadlines={allDeadlines} tasks={tasks} onAddDeadline={async (dl) => { try { const saved = await apiCreateDeadline(dl); setAllDeadlines(p => [...p, saved]); refreshCaseData(); } catch (err) { alert("Failed to add deadline: " + err.message); } }} onUpdateDeadline={async (id, data) => { try { const updated = await apiUpdateDeadline(id, data); setAllDeadlines(p => p.map(d => d.id === id ? updated : d)); refreshCaseData(); } catch (err) { console.error("Failed to update deadline:", err); } }} onDeleteDeadline={async (id) => { try { await apiDeleteDeadline(id); setAllDeadlines(p => p.filter(d => d.id !== id)); refreshCaseData(); } catch (err) { alert("Failed to remove deadline: " + err.message); } }} allCases={allCases} calcInputs={calcInputs} setCalcInputs={setCalcInputs} calcResult={calcResult} runCalc={() => { const rule = COURT_RULES.find(r => r.id === Number(calcInputs.ruleId)); if (rule && calcInputs.fromDate) setCalcResult({ rule, from: calcInputs.fromDate, result: addDays(calcInputs.fromDate, rule.days) }); }} currentUser={currentUser} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onSelectCase={(c) => { handleSelectCase(c); setView(VIEWS.CASES); }} confirmDelete={confirmDelete} msStatus={appMsStatus} />} />
          <Route path={"/" + VIEWS.DOCUMENTS} element={<DocumentsView currentUser={currentUser} allCases={allCases} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} />} />
          <Route path={"/" + VIEWS.TASKS} element={<TasksView tasks={tasks} onAddTask={async (task) => { try { const saved = await apiCreateTask(task); setTasks(p => [...p, saved]); refreshCaseData(); } catch (err) { alert("Failed to add task: " + err.message); } }} allCases={allCases} currentUser={currentUser} onCompleteTask={handleCompleteTask} onUpdateTask={handleUpdateTask} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} />} />
          <Route path={"/" + VIEWS.REPORTS} element={<ReportsView allCases={allCases} tasks={tasks} deadlines={allDeadlines} currentUser={currentUser} onUpdateCase={handleUpdateCase} onCompleteTask={handleCompleteTask} onAddTask={(saved) => { setTasks(p => [...p, saved]); refreshCaseData(); }} onDeleteCase={handleDeleteCase} caseNotes={caseNotes} setCaseNotes={setCaseNotes} caseLinks={caseLinks} setCaseLinks={setCaseLinks} caseActivity={caseActivity} setCaseActivity={setCaseActivity} onAddDeadline={async (dl) => { try { const saved = await apiCreateDeadline(dl); setAllDeadlines(p => [...p, saved]); refreshCaseData(); } catch (err) { console.error("Failed to add deadline:", err); } }} onUpdateDeadline={async (id, data) => { try { const updated = await apiUpdateDeadline(id, data); setAllDeadlines(p => p.map(d => d.id === id ? updated : d)); refreshCaseData(); } catch (err) { console.error("Failed to update deadline:", err); } }} onMenuToggle={() => setSidebarOpen(true)} onOpenAdvocate={openAdvocateFromCase} onOpenTrialCenter={openTrialCenterFromCase} confirmDelete={confirmDelete} openAppDocViewer={openAppDocViewer} openAppFilingViewer={openAppFilingViewer} openBlobInViewer={openBlobInViewer} openTranscriptViewer={openTranscriptViewer} />} />
          <Route path={"/" + VIEWS.AI_CENTER} element={<AiCenterView allCases={allCases} currentUser={currentUser} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} confirmDelete={confirmDelete} />} />
          <Route path={"/" + VIEWS.TRIAL_CENTER} element={<TrialCenterView currentUser={currentUser} users={allUsers} cases={allCases} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onTrialCenterCaseChange={(caseId) => setCurrentUser(prev => prev ? { ...prev, preferences: { ...(prev.preferences || {}), trialCenterCaseId: caseId } } : prev)} />} />
          <Route path={"/" + VIEWS.COLLABORATE} element={<CollaborateView currentUser={currentUser} allUsers={allUsers} allCases={allCases} pinnedCaseIds={pinnedCaseIds} onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path={"/" + VIEWS.TIMELOG} element={<TimeLogView currentUser={currentUser} allCases={allCases} tasks={tasks} caseNotes={caseNotes} correspondence={allCorrespondence} allUsers={allUsers} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} />} />
          <Route path={"/" + VIEWS.CONTACTS} element={<ContactsView currentUser={currentUser} allCases={allCases} onOpenCase={c => { handleSelectCase(c); setView(VIEWS.CASES); }} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} msStatus={appMsStatus} />} />
          <Route path={"/" + VIEWS.UNMATCHED} element={<UnmatchedView allCases={allCases} onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path={"/" + VIEWS.STAFF} element={<StaffView allCases={allCases} currentUser={currentUser} setCurrentUser={setCurrentUser} allUsers={allUsers} setAllUsers={setAllUsers} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} />} />
          <Route path={"/" + VIEWS.CUSTOMIZATION} element={(isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.access_customization) ? <CustomizationView currentUser={currentUser} allCases={allCases} allUsers={allUsers} pinnedCaseIds={pinnedCaseIds} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} /> : <Navigate to={"/" + VIEWS.DASHBOARD} replace />} />
          <Route path={"/" + VIEWS.DELETED} element={(isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.view_deleted_data) ? <DeletedDataView onMenuToggle={() => setSidebarOpen(true)} /> : <Navigate to={"/" + VIEWS.DASHBOARD} replace />} />
          <Route path="/" element={<Navigate to={"/" + (localStorage.getItem("lextrack-last-view") || VIEWS.DASHBOARD)} replace />} />
          <Route path="*" element={<Navigate to={"/" + VIEWS.DASHBOARD} replace />} />
        </Routes>
      </div>
      <FollowUpPromptModal
        key={followUpPrompt ? `${followUpPrompt.target.id}-${followUpPrompt.completedDate}` : "none"}
        prompt={followUpPrompt}
        onDecide={handleFollowUpDecision}
      />
      <TimePromptModal
        key={pendingTimePrompt?.taskId}
        pending={pendingTimePrompt}
        onSubmit={(taskId, timeLogged, completedBy, timeLogUser) => finishCompleteTask(taskId, timeLogged, completedBy, timeLogUser)}
      />
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={handleDeleteConfirmNo}>
          <div style={{ background: "var(--c-surface, #fff)", borderRadius: 12, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={20} style={{ color: "#dc2626" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--c-text-h, #1e293b)" }}>Confirm Deletion</h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--c-text2, #64748b)", lineHeight: 1.6, margin: "0 0 24px 0" }}>Are you sure you want to delete this data? An App Admin can restore the data within 30 days.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={handleDeleteConfirmNo} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--c-border, #e2e8f0)", background: "var(--c-surface, #fff)", color: "var(--c-text-h, #1e293b)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDeleteConfirmYes} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {!showAdvocateGlobal && !hideAdvocateAI && (
        <button
          ref={fabRef}
          className="advocate-fab"
          onClick={() => { if (!fabDragState.current.moved && !fabMoveMode) setShowAdvocateGlobal(true); }}
          title={fabMoveMode ? "Click and drag to move" : "Advocate AI"}
          style={fabPosition ? { left: fabPosition.x, top: fabPosition.y, right: "auto", bottom: "auto", ...(fabDragging || fabMoveMode ? { animation: "none", cursor: fabDragging ? "grabbing" : "grab", transition: "none" } : {}) } : (view === VIEWS.COLLABORATE ? { bottom: "auto", top: 62 } : (fabMoveMode ? { animation: "none", cursor: "grab" } : undefined))}
          onMouseDown={(e) => {
            if (fabMoveMode && e.button === 0) {
              e.preventDefault();
              fabStartDrag(e.clientX, e.clientY);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!fabMoveMode) setFabContextMenu({ x: e.clientX, y: e.clientY });
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            fabDragState.current.startX = t.clientX;
            fabDragState.current.startY = t.clientY;
            fabDragState.current.longPressTimer = setTimeout(() => {
              const el = fabRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                fabDragState.current.active = true;
                fabDragState.current.offsetX = fabDragState.current.startX - rect.left;
                fabDragState.current.offsetY = fabDragState.current.startY - rect.top;
                fabDragState.current.moved = false;
                setFabDragging(true);
              }
            }, 500);
          }}
          onTouchMove={(e) => {
            if (fabDragState.current.longPressTimer) {
              const t = e.touches[0];
              const dx = Math.abs(t.clientX - fabDragState.current.startX);
              const dy = Math.abs(t.clientY - fabDragState.current.startY);
              if (dx > 10 || dy > 10) {
                clearTimeout(fabDragState.current.longPressTimer);
                fabDragState.current.longPressTimer = null;
              }
            }
          }}
          onTouchEnd={() => {
            if (fabDragState.current.longPressTimer) {
              clearTimeout(fabDragState.current.longPressTimer);
              fabDragState.current.longPressTimer = null;
            }
          }}
        >
          <Bot size={22} className="text-white" />
        </button>
      )}
      {fabContextMenu && (
        <div className="fixed inset-0 z-[10000]" onClick={() => setFabContextMenu(null)} onContextMenu={e => { e.preventDefault(); setFabContextMenu(null); }}>
          <div className="absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[140px]" style={{ left: fabContextMenu.x, top: fabContextMenu.y }}>
            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors bg-transparent border-none cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              setFabContextMenu(null);
              setFabMoveMode(true);
            }}>Move</button>
            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors bg-transparent border-none cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              setFabContextMenu(null);
              setFabPosition(null);
              apiSavePreferences({ fabPosition: null }).catch(() => {});
            }}>Reset Position</button>
          </div>
        </div>
      )}
      {showAdvocateGlobal && (
        <div className="advocate-panel" style={view === VIEWS.COLLABORATE ? { bottom: "auto", top: 62 } : undefined}>
          <div className="advocate-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <Bot size={18} className="text-indigo-500" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="!text-[15px] !font-semibold !text-slate-900 dark:!text-slate-100">Advocate AI</div>
                <div style={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {advocateFromHelpCenter ? <span>{SCREEN_LABELS.helpcenter.icon} {SCREEN_LABELS.helpcenter.label}</span> : SCREEN_LABELS[view] && <span>{SCREEN_LABELS[view].icon} {SCREEN_LABELS[view].label}</span>}
                  {advocateCaseId && (() => { const ac = allCases.find(cs => cs.id === advocateCaseId); return ac ? <span style={{ fontWeight: 600 }}>· {ac.case_num || ac.title}</span> : null; })()}
                </div>
              </div>
            </div>
            <div className="advocate-header-actions" style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
              {advocateMessages.length > 0 && advocateCaseId && (
                <button className="btn btn-outline btn-sm" style={{ fontSize: 9, padding: "2px 6px" }} onClick={() => {
                  const thread = advocateMessages.map(m => m.role === "user" ? `**You:** ${m.content}` : `**Advocate AI:** ${m.content}`).join("\n\n---\n\n");
                  apiCreateNote({ caseId: advocateCaseId, body: thread, type: "AI Consultation" }).then(() => alert("Saved as case note.")).catch(e => alert("Failed: " + e.message));
                }}>Save as Note</button>
              )}
              {advocateMessages.length > 0 && (
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", padding: "2px 4px" }} title="New conversation" onClick={advocateClearConversation}>🗑</button>
              )}
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b", padding: "2px 4px" }} onClick={() => setShowAdvocateGlobal(false)}>✕</button>
            </div>
          </div>
          <div className="advocate-case-search" style={{ padding: "6px 14px", borderBottom: "1px solid var(--c-border)", flexShrink: 0 }}>
            <CaseSearchField
              allCases={allCases}
              value={advocateCaseId ? String(advocateCaseId) : ""}
              onChange={val => {
                const newId = val ? Number(val) : null;
                if (newId !== advocateCaseId) {
                  advocateClearConversation();
                  setAdvocateCaseId(newId);
                }
              }}
              placeholder="Search cases or type for general help…"
              pinnedCaseIds={pinnedCaseIds}
            />
          </div>
          {advocateStats && (
            <div className="advocate-stats-bar" style={{ padding: "4px 14px", fontSize: 10, color: "#64748b", borderBottom: "1px solid var(--c-border)", flexShrink: 0, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {advocateStats.notes > 0 && <span>📋 {advocateStats.notes}</span>}
              {advocateStats.tasks > 0 && <span>✓ {advocateStats.tasks}</span>}
              {advocateStats.deadlines > 0 && <span>📅 {advocateStats.deadlines}</span>}
              {advocateStats.documents > 0 && <span>📄 {advocateStats.documents}</span>}
              {advocateStats.filings > 0 && <span>⚖ {advocateStats.filings}</span>}
              {advocateStats.emails > 0 && <span>✉ {advocateStats.emails}</span>}
              {advocateStats.parties > 0 && <span>👥 {advocateStats.parties}</span>}
            </div>
          )}
          <div className="advocate-msg-area" style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {advocateMessages.length === 0 && !advocateLoading && !advocateScreenChips && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <div style={{ fontSize: 36, opacity: 0.3 }}>🤖</div>
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", maxWidth: 320, lineHeight: 1.5 }}>
                  {advocateCaseId ? "Ask me anything about this case. I have access to all case data." : "Ask me anything — Alabama law, office procedures, or how to use MattrMindr."}
                </div>
                <div className="advocate-starter-chips" style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 360 }}>
                  {(advocateCaseId ? ["Analyze defense strategies", "Summarize key evidence", "What motions should I consider?"] : (ADVOCATE_SCREEN_CHIPS[view] || ADVOCATE_SCREEN_CHIPS.dashboard)).map(prompt => (
                    <button key={prompt} style={{ padding: "5px 10px", fontSize: 11, borderRadius: 14, border: "1px solid #a5b4fc", background: "rgba(99,102,241,0.08)", color: "#818cf8", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.target.style.background = "rgba(99,102,241,0.18)"; }}
                      onMouseLeave={e => { e.target.style.background = "rgba(99,102,241,0.08)"; }}
                      onClick={() => advocateSend(prompt)}>{prompt}</button>
                  ))}
                </div>
              </div>
            )}
            {advocateMessages.map((msg, i) => {
              const displayText = msg.content;
              const parsedTasks = msg.suggestedTasks && Array.isArray(msg.suggestedTasks) && msg.suggestedTasks.length > 0 ? msg.suggestedTasks : null;
              const msgAdded = advocateTasksAdded[i] || {};
              const priorityColors = { Urgent: "#e05252", High: "#e88c30", Medium: "#d97706", Low: "#2F7A5F" };
              const priorityDarkBg = { Urgent: "#fca5a5", High: "#fdba74", Medium: "#93c5fd", Low: "#cbd5e1" };
              const dk = isDarkMode();
              return (
              <div key={i}>
              <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "88%", padding: "8px 12px", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: msg.role === "user" ? "#0f172a" : "var(--c-card-alt, #1a2332)",
                  color: msg.role === "user" ? "#fff" : "#E6EDF3",
                  fontSize: 12, lineHeight: 1.6, position: "relative",
                  border: msg.role === "user" ? "none" : "1px solid var(--c-border)"
                }}>
                  {msg.role === "assistant" && (
                    <button style={{ position: "absolute", top: 3, right: 3, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#64748b", opacity: 0.5, padding: "2px" }}
                      title="Copy" onClick={() => { navigator.clipboard.writeText(displayText); }}>📋</button>
                  )}
                  {msg.role === "user" ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                  ) : (
                    <div>
                      {displayText.split("\n").map((line, li) => {
                        if (line.startsWith("## ")) return <div key={li} style={{ fontWeight: 700, fontSize: 13, marginTop: 8, marginBottom: 3 }}>{line.replace(/^## /, "")}</div>;
                        if (line.startsWith("### ")) return <div key={li} style={{ fontWeight: 600, fontSize: 12, marginTop: 6, marginBottom: 2 }}>{line.replace(/^### /, "")}</div>;
                        if (line.startsWith("**") && line.endsWith("**")) return <div key={li} style={{ fontWeight: 700, marginTop: 5, marginBottom: 2 }}>{line.replace(/\*\*/g, "")}</div>;
                        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={li} style={{ paddingLeft: 10, position: "relative" }}><span style={{ position: "absolute", left: 0 }}>•</span>{line.replace(/^[-*] /, "").replace(/\*\*(.+?)\*\*/g, "$1")}</div>;
                        if (line.match(/^\d+\.\s/)) return <div key={li} style={{ paddingLeft: 4 }}>{line.replace(/\*\*(.+?)\*\*/g, "$1")}</div>;
                        if (line.trim() === "") return <div key={li} style={{ height: 3 }} />;
                        return <div key={li}>{line.replace(/\*\*(.+?)\*\*/g, "$1")}</div>;
                      })}
                    </div>
                  )}
                </div>
              </div>
              {parsedTasks && parsedTasks.length > 0 && advocateCaseId && (
                <div style={{ maxWidth: "88%", marginTop: 4, padding: "8px 10px", borderRadius: 8, background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1"><Sparkles size={11} className="text-amber-500" /> Suggested Tasks</span>
                    {Object.keys(msgAdded).length < parsedTasks.length && (
                      <button className="btn btn-sm" style={{ fontSize: 9, padding: "1px 8px", background: "#6366f1", color: "#fff", border: "none" }} onClick={async () => {
                        for (let ti = 0; ti < parsedTasks.length; ti++) {
                          if (msgAdded[ti]) continue;
                          const t = parsedTasks[ti];
                          const dueDate = t.dueInDays ? new Date(Date.now() + t.dueInDays * 86400000).toISOString().split("T")[0] : null;
                          try {
                            const saved = await apiCreateTask({ caseId: advocateCaseId, title: t.title, priority: t.priority || "Medium", assignedRole: t.assignedRole || "", due: dueDate, notes: t.rationale || "", isGenerated: true });
                            setTasks(p => [...p, saved]);
                            setAdvocateTasksAdded(p => ({ ...p, [i]: { ...(p[i] || {}), [ti]: true } }));
                          } catch (err) { alert("Failed: " + err.message); break; }
                        }
                      }}>+ Add All</button>
                    )}
                  </div>
                  {parsedTasks.map((t, ti) => {
                    const added = msgAdded[ti];
                    return (
                      <div key={ti} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderTop: ti > 0 ? "1px solid var(--c-border)" : "none", opacity: added ? 0.45 : 1 }}>
                        <span style={{ fontSize: 11, marginTop: 1 }}>{added ? "✓" : ""}{!added && <Sparkles size={11} className="text-amber-500" />}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: "var(--c-text-h)", fontWeight: 500 }}>{t.title}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: dk ? (priorityDarkBg[t.priority] || "#cbd5e1") : (priorityColors[t.priority] || "#d97706") + "18", color: dk ? "#1a1a1a" : (priorityColors[t.priority] || "#d97706") }}>{t.priority}</span>
                            {t.assignedRole && <span style={{ fontSize: 9, color: "#64748b" }}>{t.assignedRole}</span>}
                            {t.dueInDays && <span style={{ fontSize: 9, color: "#64748b" }}>{t.dueInDays}d</span>}
                          </div>
                        </div>
                        {!added && (
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 9, padding: "1px 6px", flexShrink: 0 }} onClick={async () => {
                            const dueDate = t.dueInDays ? new Date(Date.now() + t.dueInDays * 86400000).toISOString().split("T")[0] : null;
                            try {
                              const saved = await apiCreateTask({ caseId: advocateCaseId, title: t.title, priority: t.priority || "Medium", assignedRole: t.assignedRole || "", due: dueDate, notes: t.rationale || "", isGenerated: true });
                              setTasks(p => [...p, saved]);
                              setAdvocateTasksAdded(p => ({ ...p, [i]: { ...(p[i] || {}), [ti]: true } }));
                            } catch (err) { alert("Failed: " + err.message); }
                          }}>+ Add</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            )})}
            {advocateScreenChips && !advocateLoading && ADVOCATE_SCREEN_CHIPS[advocateScreenChips] && (
              <div style={{ padding: "6px 0" }}>
                {advocateMessages.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
                    <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                      {SCREEN_LABELS[advocateScreenChips]?.icon} Navigated to {SCREEN_LABELS[advocateScreenChips]?.label || advocateScreenChips}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
                  </div>
                )}
                <div className="advocate-nav-chips" style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
                  {ADVOCATE_SCREEN_CHIPS[advocateScreenChips].map(prompt => (
                    <button key={prompt} style={{ padding: "4px 9px", fontSize: 11, borderRadius: 14, border: "1px solid #a5b4fc", background: "rgba(99,102,241,0.08)", color: "#818cf8", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.target.style.background = "rgba(99,102,241,0.18)"; }}
                      onMouseLeave={e => { e.target.style.background = "rgba(99,102,241,0.08)"; }}
                      onClick={() => { setAdvocateScreenChips(null); advocateSend(prompt); }}>{prompt}</button>
                  ))}
                </div>
              </div>
            )}
            {advocateLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: "12px 12px 12px 4px", background: "var(--c-card-alt, #1a2332)", border: "1px solid var(--c-border)", display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", animation: "pulse 1s ease-in-out infinite" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", animation: "pulse 1s ease-in-out 0.2s infinite" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", animation: "pulse 1s ease-in-out 0.4s infinite" }} />
                </div>
              </div>
            )}
            <div ref={advocateEndRef} />
          </div>
          <div className="advocate-input-bar" style={{ padding: "10px 14px", borderTop: "1px solid var(--c-border)", flexShrink: 0, display: "flex", gap: 6 }}>
            <input
              style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, outline: "none" }}
              placeholder={advocateCaseId ? "Ask about this case..." : "Ask anything..."}
              value={advocateInput}
              onChange={e => setAdvocateInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && advocateInput.trim() && !advocateLoading) {
                  e.preventDefault();
                  advocateSend(advocateInput);
                }
              }}
              disabled={advocateLoading}
            />
            <button
              className="btn btn-sm"
              style={{ background: advocateInput.trim() && !advocateLoading ? "#4f46e5" : "#64748b", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, cursor: advocateInput.trim() && !advocateLoading ? "pointer" : "not-allowed", fontSize: 12 }}
              disabled={!advocateInput.trim() || advocateLoading}
              onClick={() => advocateSend(advocateInput)}
            >Send</button>
          </div>
        </div>
      )}

      {openDocViewers.filter(v => !v.minimized).map(viewer => (
        <DocViewerWindow
          key={viewer.id}
          viewer={viewer}
          zIndex={viewer.zIndex}
          msStatus={appMsStatus}
          ooStatus={appOoStatus}
          allCases={allCases}
          onClose={() => closeDocViewer(viewer.id)}
          onMinimize={() => minimizeDocViewer(viewer.id)}
          onBringToFront={() => bringDocViewerToFront(viewer.id)}
          onPositionChange={(pos) => setOpenDocViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, position: pos } : v))}
          onSizeChange={(sz) => setOpenDocViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, size: sz } : v))}
          onViewerUpdate={async (docId) => {
            try {
              const ct = viewer.type || "";
              const ext = (viewer.filename || "").split(".").pop().toLowerCase();
              const isDocx = ct.includes("wordprocessingml") || ext === "docx" || ext === "doc";
              const isXlsx = ct.includes("spreadsheetml") || ext === "xlsx" || ext === "xls";
              const isPptx = ct.includes("presentationml") || ext === "pptx" || ext === "ppt";
              let docxHtml = viewer.docxHtml, xlsxData = viewer.xlsxData, pptxSlides = viewer.pptxSlides, blobUrl = viewer.blobUrl;
              if (isDocx) { try { const r = await apiGetDocHtml(docId); docxHtml = r.html; } catch {} }
              else if (isXlsx) { try { const r = await apiGetXlsxData(docId); xlsxData = r.sheets; } catch {} }
              else if (isPptx) { try { const r = await apiGetPptxSlides(docId); pptxSlides = r.slides; } catch {} }
              else { try { const blob = await apiDownloadDocument(docId); blobUrl = URL.createObjectURL(blob); } catch {} }
              setOpenDocViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, docxHtml, xlsxData, pptxSlides, blobUrl } : v));
            } catch {}
          }}
        />
      ))}

      {openTranscriptViewers.filter(v => !v.minimized).map(viewer => (
        <TranscriptViewerWindow
          key={viewer.id}
          viewer={viewer}
          zIndex={viewer.zIndex}
          onClose={() => closeTranscriptViewer(viewer.id)}
          onMinimize={() => minimizeTranscriptViewer(viewer.id)}
          onBringToFront={() => bringTranscriptViewerToFront(viewer.id)}
          onPositionChange={(pos) => setOpenTranscriptViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, position: pos } : v))}
          onSizeChange={(sz) => setOpenTranscriptViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, size: sz } : v))}
          onTranscriptEditsChange={(edits) => {
            setOpenTranscriptViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, transcriptEdits: edits, transcriptDetail: { ...v.transcriptDetail, transcript: edits } } : v));
          }}
          onViewerDetailUpdate={(detail) => {
            setOpenTranscriptViewers(prev => prev.map(v => v.id === viewer.id ? { ...v, transcriptDetail: detail } : v));
          }}
          apiDownloadTranscriptAudio={apiDownloadTranscriptAudio}
          apiExportTranscript={apiExportTranscript}
          apiGetTranscriptHistory={apiGetTranscriptHistory}
          apiSaveTranscriptHistory={apiSaveTranscriptHistory}
          apiUpdateTranscript={apiUpdateTranscript}
          apiRevertTranscript={apiRevertTranscript}
          apiGetTranscriptDetail={apiGetTranscriptDetail}
          apiGetScribeSummaries={apiGetScribeSummaries}
          apiSummarizeTranscript={apiSummarizeTranscript}
          ScribeTranscriptButtons={ScribeTranscriptButtons}
        />
      ))}

      {(() => {
        const allMin = [...openDocViewers.filter(v => v.minimized), ...openTranscriptViewers.filter(v => v.minimized)];
        if (!allMin.length) return null;
        const CHIP_W = 222;
        const GAP = 8;
        const ARROW_W = 32;
        const SIDEBAR_W = window.innerWidth > 768 ? 240 : 0;
        const maxVisible = Math.max(1, Math.floor((window.innerWidth - SIDEBAR_W - 24 - ARROW_W * 2) / (CHIP_W + GAP)));
        const needsScroll = allMin.length > maxVisible;
        const scrollIdx = Math.min(minChipScrollIdx, Math.max(0, allMin.length - maxVisible));
        const visible = needsScroll ? allMin.slice(scrollIdx, scrollIdx + maxVisible) : allMin;
        const canLeft = scrollIdx > 0;
        const canRight = scrollIdx + maxVisible < allMin.length;
        const arrowBtn = (dir, enabled, onClick) => (
          <button onClick={onClick} disabled={!enabled} style={{ position: "fixed", bottom: 12, zIndex: 10001, [dir === "left" ? "left" : "right"]: dir === "left" ? SIDEBAR_W + 4 : 4, width: ARROW_W, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: enabled ? "var(--c-bg, #fff)" : "transparent", border: enabled ? "1px solid var(--c-border, #e2e8f0)" : "none", borderRadius: 8, cursor: enabled ? "pointer" : "default", boxShadow: enabled ? "0 2px 8px rgba(0,0,0,0.10)" : "none", opacity: enabled ? 1 : 0, pointerEvents: enabled ? "auto" : "none", transition: "opacity 0.15s" }}>
            {dir === "left" ? <ChevronLeft size={16} style={{ color: "#64748b" }} /> : <ChevronRight size={16} style={{ color: "#64748b" }} />}
          </button>
        );
        const chipLeft = SIDEBAR_W + (needsScroll && canLeft ? ARROW_W + 8 : 0) + 12;
        return (
          <>
            {needsScroll && arrowBtn("left", canLeft, () => setMinChipScrollIdx(i => Math.max(0, i - 1)))}
            {visible.map((viewer, idx) => {
              const isTranscript = 'transcriptId' in viewer;
              return (
                <div key={`min-${viewer.id}`} style={{ position: "fixed", bottom: 12, left: chipLeft + idx * (CHIP_W + GAP), zIndex: 10000, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--c-bg, #fff)", border: "1px solid var(--c-border, #e2e8f0)", borderRadius: 10, width: CHIP_W, cursor: "default", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
                  {isTranscript
                    ? <FileAudio size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
                    : <FileText size={13} style={{ color: "#64748b", flexShrink: 0 }} />}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text-h, #0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{viewer.filename || (isTranscript ? "Transcript" : "Document")}</span>
                  <button onClick={() => isTranscript ? restoreTranscriptViewer(viewer.id) : restoreDocViewer(viewer.id)} title="Restore" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#64748b", display: "inline-flex", flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); isTranscript ? closeTranscriptViewer(viewer.id) : closeDocViewer(viewer.id); }} title="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94a3b8", display: "inline-flex", flexShrink: 0 }}><X size={13} /></button>
                </div>
              );
            })}
            {needsScroll && arrowBtn("right", canRight, () => setMinChipScrollIdx(i => Math.min(allMin.length - maxVisible, i + 1)))}
          </>
        );
      })()}

    </div>
  );
}

