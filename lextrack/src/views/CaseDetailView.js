import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { FileText, Users, Settings, Search, Download, Scale, ChevronDown, ChevronUp, ChevronRight, Sparkles, FolderOpen, AlertCircle, Upload, FileAudio, Pencil, Trash2, Loader2, Merge, Check, RotateCcw, FolderPlus, Eye, Video, Filter } from "lucide-react";
import {
  apiCreateTask,
  apiGetActivity,
  apiGetContacts,
  apiCreateContact,
  apiUpdateContact,
  apiChargeAnalysis,
  apiDeadlineGenerator,
  apiCaseStrategy,
  apiClientSummary,
  apiTaskSuggestions,
  apiGetCaseDocuments,
  apiUploadCaseDocument,
  apiSummarizeDocument,
  apiGetDocOcrStatus,
  apiDownloadDocument,
  apiDeleteCaseDocument,
  apiUpdateCaseDocument,
  apiGetFilings,
  apiUploadFiling,
  apiDeleteFiling,
  apiSummarizeFiling,
  apiUpdateFiling,
  apiClassifyFiling,
  apiGetCorrespondence,
  apiDeleteCorrespondence,
  apiGetVoicemails,
  apiCreateVoicemail,
  apiUpdateVoicemail,
  apiDeleteVoicemail,
  apiTranscribeVoicemail,
  apiGetParties,
  apiCreateParty,
  apiUpdateParty,
  apiDeleteParty,
  apiGetExperts,
  apiCreateExpert,
  apiUpdateExpert,
  apiDeleteExpert,
  apiGetMiscContacts,
  apiCreateMiscContact,
  apiUpdateMiscContact,
  apiDeleteMiscContact,
  apiGetInsurancePolicies,
  apiCreateInsurancePolicy,
  apiUpdateInsurancePolicy,
  apiDeleteInsurancePolicy,
  apiGetMedicalTreatments,
  apiCreateMedicalTreatment,
  apiUpdateMedicalTreatment,
  apiDeleteMedicalTreatment,
  apiUploadMedicalRecord,
  apiGetMedicalRecords,
  apiDeleteMedicalRecord,
  apiUpdateMedicalRecord,
  apiMedicalRecordFromDocument,
  apiCommitMedicalRecords,
  apiGetLiens,
  apiCreateLien,
  apiUpdateLien,
  apiDeleteLien,
  apiGetDamages,
  apiCreateDamage,
  apiUpdateDamage,
  apiDeleteDamage,
  apiDamageFromDocument,
  apiUploadDamageBill,
  apiGetExpenses,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
  apiGetNegotiations,
  apiCreateNegotiation,
  apiUpdateNegotiation,
  apiDeleteNegotiation,
  apiGetLinkedCases,
  apiCreateLinkedCase,
  apiDeleteLinkedCase,
  apiGetTranscripts,
  apiUploadTranscript,
  apiUploadTranscriptChunked,
  apiGetTranscriptDetail,
  apiUpdateTranscript,
  apiDeleteTranscript,
  apiDownloadTranscriptAudio,
  apiExportTranscript,
  apiSuggestTranscriptName,
  apiGetTranscriptHistory,
  apiSaveTranscriptHistory,
  apiRevertTranscript,
  apiGetDocFolders,
  apiCreateDocFolder,
  apiUpdateDocFolder,
  apiDeleteDocFolder,
  apiMoveDocument,
  apiBatchMoveDocuments,
  apiGetTranscriptFolders,
  apiCreateTranscriptFolder,
  apiBatchDeleteDocuments,
  apiBatchDeleteTranscripts,
  apiBatchDeleteCorrespondence,
  apiBatchDeleteSmsMessages,
  apiBatchDeleteFilings,
  apiUploadCaseDocumentChunked,
  apiUploadFilingChunked,
  apiGetScribeStatus,
  apiGetScribeSummaries,
  apiSummarizeTranscript,
  apiListScribeTranscripts,
  apiImportNewFromScribe,
  apiGetPortalSettings,
  apiUpdatePortalSettings,
  apiGetPortalClients,
  apiCreatePortalClient,
  apiDeletePortalClient,
  apiGetPortalMessages,
  apiSendPortalMessage,
  apiMarkPortalMsgRead,
  apiGetSmsConfigs,
  apiCreateSmsConfig,
  apiUpdateSmsConfig,
  apiDeleteSmsConfig,
  apiGetSmsScheduled,
  apiGetSmsMessages,
  apiSendSms,
  apiDraftSmsMessage,
  apiGetSmsWatch,
  apiAddSmsWatch,
  apiDeleteSmsWatch,
  apiGetMsStatus,
  apiResolveOneDriveLink,
  apiImportOneDriveFile,
} from "../api.js";
import {
  hasRole,
  isAppAdmin,
  newId,
  fmt,
  fmtFileSize,
  daysUntil,
  urgencyColor,
  recordType,
  getEffectivePriority,
  isDarkMode,
  Badge,
  getUserById,
  Avatar,
  ScribeTranscriptButtons,
  DragDropZone,
  AiPanel,
  StaffSearchField,
  isAttorney,
  USERS,
  isAttyPara,
  isSupportStaff,
} from "../shared.js";

import { GenerateDocumentModal } from "./DocumentsView.js";

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


const CORE_FIELDS = [
  { key: "title",            label: "Case Title",           type: "text",   section: "details" },
  { key: "caseNum",          label: "File Number",           type: "text",   section: "details" },
  { key: "clientName",       label: "Client Name",          type: "text",   section: "details" },
  { key: "caseType",         label: "Case Type",            type: "select", section: "details", options: ["Auto Accident", "Truck Accident", "Motorcycle Accident", "Slip & Fall", "Medical Malpractice", "Product Liability", "Wrongful Death", "Workers Compensation", "Dog Bite", "Premises Liability", "Nursing Home Abuse", "Other"] },
  { key: "stateJurisdiction",label: "State",                type: "select", section: "details", options: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"] },
  { key: "courtCaseNumber",  label: "Case Number",          type: "text",   section: "details" },
  { key: "judge",            label: "Judge",                type: "text",   section: "details" },
  { key: "status",           label: "Status",               type: "select", section: "details", options: ["Active", "Pre-Litigation", "In Litigation", "Settled", "Closed", "Referred Out"] },
  { key: "stage",            label: "Stage",                type: "select", section: "details", options: ["Intake", "Investigation", "Treatment", "Pre-Litigation Demand", "Negotiation", "Suit Filed", "Discovery", "Mediation", "Trial Preparation", "Trial", "Settlement/Verdict", "Closed"] },
  { key: "accidentDate",     label: "Accident Date",        type: "date",   section: "info" },
  { key: "incidentLocation", label: "Incident Location",    type: "text",   section: "info" },
  { key: "injuryType",       label: "Injury Type",          type: "text",   section: "info" },
  { key: "injuryDescription",label: "Injury Description",   type: "text",   section: "info" },
  { key: "liabilityAssessment",label: "Liability Assessment",type: "text",  section: "info" },
  { key: "comparativeFaultPct",label: "Comparative Fault %", type: "text",  section: "info" },
  { key: "policeReportNumber",label: "Police Report #",     type: "text",   section: "info" },
  { key: "weatherConditions",label: "Weather Conditions",   type: "text",   section: "info" },
  { key: "county",           label: "County",               type: "text",   section: "info" },
  { key: "court",            label: "Court",                type: "text",   section: "info" },
  { key: "referringAttorney",label: "Referring Attorney",   type: "text",   section: "info" },
  { key: "referralSource",   label: "Referral Source",      type: "text",   section: "info" },
  { key: "dispositionType",  label: "Disposition",          type: "select", section: "info", options: ["", "Settlement", "Verdict - Plaintiff", "Verdict - Defense", "Dismissed", "Withdrawn", "Arbitration Award", "Mediated Settlement", "Other"] },
  { key: "statuteOfLimitationsDate", label: "Statute of Limitations", type: "date", section: "dates" },
  { key: "nextCourtDate",    label: "Next Court Date",      type: "date",   section: "dates" },
  { key: "trialDate",        label: "Trial Date",           type: "date",   section: "dates" },
  { key: "mediationDate",    label: "Mediation Date",       type: "date",   section: "dates" },
  { key: "demandDate",       label: "Demand Date",          type: "date",   section: "dates" },
  { key: "demandResponseDue",label: "Demand Response Due",  type: "date",   section: "dates" },
  { key: "settlementDate",   label: "Settlement Date",      type: "date",   section: "dates" },
  { key: "assignedAttorney", label: "Lead Attorney",        type: "user",   section: "team" },
  { key: "secondAttorney",   label: "2nd Attorney",         type: "user",   section: "team" },
  { key: "caseManager",      label: "Case Manager",         type: "user",   section: "team" },
  { key: "investigator",     label: "Investigator",         type: "user",   section: "team" },
  { key: "paralegal",        label: "Paralegal",            type: "user",   section: "team" },
];


function EditField({ fieldKey, label, type, options, value, onChange, onBlur, onRemove, canRemove, isCustom, userList, readOnly, onContactClick }) {
  const displayVal = type === "date" ? (value || "") : (value ?? "");
  const userVal = type === "user" ? (value || "") : undefined;
  const availableUsers = userList || USERS;

  if (readOnly) {
    let display = "—";
    if (type === "user") display = getUserById(Number(value))?.name || "—";
    else if (type === "date") display = value ? fmt(value) : "—";
    else display = value || "—";
    const isClickable = onContactClick && display !== "—";
    return (
      <div className="edit-field">
        <div className="edit-field-key">{label}</div>
        <div className="edit-field-val" style={{ padding: "3px 0" }}>
          {isClickable ? (
            <span
              onClick={() => onContactClick(display)}
              style={{ color: "#0f172a", cursor: "pointer", fontSize: 13, fontWeight: 400, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
              title="View contact card"
            >{display}</span>
          ) : (
            <span style={{ color: "var(--c-text)", fontSize: 13, fontWeight: 400 }}>{display}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="edit-field">
      <div className="edit-field-key">{label}</div>
      <div className="edit-field-val">
        {type === "select" && (
          <select value={displayVal} onChange={e => onChange(e.target.value)}>
            <option value="">—</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {type === "user" && (
          <StaffSearchField value={userVal} onChange={val => onChange(Number(val))} placeholder="Search staff…" userList={availableUsers} />
        )}
        {type === "date" && (
          <input type="date" value={displayVal} onChange={e => onChange(e.target.value)} onBlur={onBlur} />
        )}
        {type === "text" && (
          <input type="text" value={displayVal} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder="—" />
        )}
        {type === "custom" && (
          <input type="text" value={displayVal} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder="Enter value…" />
        )}
      </div>
      {canRemove && (
        <div className="edit-field-actions">
          <button
            onClick={onRemove}
            title="Remove field"
            style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", padding: "2px 6px", borderRadius: 3, fontSize: 13, lineHeight: 1 }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

const CONTACT_LINKABLE_KEYS = new Set(["clientName", "judge", "referringAttorney"]);

const KEY_DATE_FIELDS = ["accidentDate", "statuteOfLimitationsDate", "nextCourtDate", "trialDate", "mediationDate", "dispositionDate", "demandDate", "settlementDate"];
const KEY_DATE_TYPES = { accidentDate: "Other", statuteOfLimitationsDate: "SOL", nextCourtDate: "Hearing", trialDate: "Hearing", mediationDate: "Mediation", dispositionDate: "Other", demandDate: "Filing", settlementDate: "Other" };


function CaseDetailOverlay({ c, currentUser, tasks, deadlines, notes, links, activity, onClose, onUpdate, onDeleteCase, onCompleteTask, onAddTask, onAddNote, onDeleteNote, onUpdateNote, onAddLink, onDeleteLink, onLogActivity, onRefreshActivity, onAddDeadline, onUpdateDeadline, onDeleteDeadline, initialTab, allCases, onSelectCase, onOpenAdvocate, onOpenTrialCenter, confirmDelete, openAppDocViewer, openAppFilingViewer, openBlobInViewer, openTranscriptViewer }) {
  const [draft, setDraft] = useState({ ...c });
  const [customFields, setCustomFields] = useState(c._customFields || []);
  const DEFAULT_HIDDEN_DATES = [];
  const [hiddenFields, setHiddenFields] = useState(c._hiddenFields != null ? c._hiddenFields : DEFAULT_HIDDEN_DATES);
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldIsName, setNewFieldIsName] = useState(false);
  const [customDates, setCustomDates] = useState(c._customDates || []);
  const [addingDate, setAddingDate] = useState(false);
  const [newDateLabel, setNewDateLabel] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "overview");
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const initialTabConsumed = useRef(false);
  useEffect(() => {
    if (initialTab && !initialTabConsumed.current) {
      setActiveTab(initialTab);
      initialTabConsumed.current = true;
    }
  }, [initialTab]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [contactPopup, setContactPopup] = useState(null);
  const [contactEditMode, setContactEditMode] = useState(false);
  const [contactEditDraft, setContactEditDraft] = useState(null);
  const [showCompletedOverlay, setShowCompletedOverlay] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState({ deadlines: false, tasks: false, notes: false });
  const toggleCol = (col) => setCollapsedCols(p => ({ ...p, [col]: !p[col] }));
  useEffect(() => { setCollapsedCols({ deadlines: false, tasks: false, notes: false }); }, [c.id]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => { if (e.matches) setCollapsedCols({ deadlines: false, tasks: false, notes: false }); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const [customTeam, setCustomTeam] = useState(c._customTeam || []);
  const [addingTeamSlot, setAddingTeamSlot] = useState(false);
  const [newTeamRole, setNewTeamRole] = useState("");
  const [newTeamUserId, setNewTeamUserId] = useState(0);
  const [correspondence, setCorrespondence] = useState([]);
  const [corrLoading, setCorrLoading] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [corrCopied, setCorrCopied] = useState(false);
  const [corrSubTab, setCorrSubTab] = useState("emails");
  const [voicemails, setVoicemails] = useState([]);
  const [voicemailsLoading, setVoicemailsLoading] = useState(false);
  const [transcribingVmId, setTranscribingVmId] = useState(null);
  const [showAddVoicemail, setShowAddVoicemail] = useState(false);
  const [vmCallerName, setVmCallerName] = useState("");
  const [vmCallerNumber, setVmCallerNumber] = useState("");
  const [vmDuration, setVmDuration] = useState("");
  const [vmTranscript, setVmTranscript] = useState("");
  const [vmNotes, setVmNotes] = useState("");
  const [vmReceivedAt, setVmReceivedAt] = useState("");
  const [editingVmId, setEditingVmId] = useState(null);
  const [smsConfigs, setSmsConfigs] = useState([]);
  const [smsMessages, setSmsMessages] = useState([]);
  const [smsScheduled, setSmsScheduled] = useState([]);
  const [smsSelectMode, setSmsSelectMode] = useState(false);
  const [selectedSmsIds, setSelectedSmsIds] = useState(new Set());
  const [showAutoText, setShowAutoText] = useState(false);
  const [smsAddingRecipient, setSmsAddingRecipient] = useState(false);
  const [smsNewName, setSmsNewName] = useState("");
  const [smsNewPhones, setSmsNewPhones] = useState([]);
  const [smsNewType, setSmsNewType] = useState("client");
  const [smsNewNotifyHearings, setSmsNewNotifyHearings] = useState(true);
  const [smsNewNotifyCourtDates, setSmsNewNotifyCourtDates] = useState(true);
  const [smsNewNotifyDeadlines, setSmsNewNotifyDeadlines] = useState(false);
  const [smsNewNotifyMeetings, setSmsNewNotifyMeetings] = useState(false);
  const [smsNewReminderDays, setSmsNewReminderDays] = useState([1, 7]);
  const [smsNewCustomDay, setSmsNewCustomDay] = useState("");
  const [smsContactSearch, setSmsContactSearch] = useState("");
  const [smsContactResults, setSmsContactResults] = useState([]);
  const [smsContactSelected, setSmsContactSelected] = useState(null);
  const [smsContactDropdownOpen, setSmsContactDropdownOpen] = useState(false);
  const [smsOtherChecked, setSmsOtherChecked] = useState(false);
  const [smsAddPhone, setSmsAddPhone] = useState("");
  const [smsNewMessage, setSmsNewMessage] = useState("");
  const [smsWatchNumbers, setSmsWatchNumbers] = useState([]);
  const [smsWatchExpanded, setSmsWatchExpanded] = useState(false);
  const [smsWatchAdding, setSmsWatchAdding] = useState(false);
  const [smsWatchPhone, setSmsWatchPhone] = useState("");
  const [smsWatchName, setSmsWatchName] = useState("");
  const [smsCompose, setSmsCompose] = useState(false);
  const [smsComposePhone, setSmsComposePhone] = useState("");
  const [smsComposeBody, setSmsComposeBody] = useState("");
  const [smsComposeName, setSmsComposeName] = useState("");
  const [smsComposeSearch, setSmsComposeSearch] = useState("");
  const [smsComposeResults, setSmsComposeResults] = useState([]);
  const [smsComposeSelected, setSmsComposeSelected] = useState(null);
  const [smsComposeDropdown, setSmsComposeDropdown] = useState(false);
  const [smsDrafting, setSmsDrafting] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [parties, setParties] = useState([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [expandedParty, setExpandedParty] = useState(null);
  const [addingParty, setAddingParty] = useState(false);
  const [newCoDefFirst, setNewCoDefFirst] = useState("");
  const [newCoDefMiddle, setNewCoDefMiddle] = useState("");
  const [newCoDefLast, setNewCoDefLast] = useState("");
  const partyTimers = useRef({});
  const partyPendingData = useRef({});
  const [experts, setExperts] = useState([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [expandedExpert, setExpandedExpert] = useState(null);
  const [addingExpert, setAddingExpert] = useState(false);
  const [newExpertType, setNewExpertType] = useState("Treating Physician");
  const expertTimers = useRef({});
  const expertPendingData = useRef({});
  const [miscContacts, setMiscContacts] = useState([]);
  const [miscContactsLoading, setMiscContactsLoading] = useState(false);
  const [expandedMiscContact, setExpandedMiscContact] = useState(null);
  const [addingMiscContact, setAddingMiscContact] = useState(false);
  const [newMiscContactType, setNewMiscContactType] = useState("Other");
  const miscContactTimers = useRef({});
  const miscContactPendingData = useRef({});
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);
  const [medicalTreatments, setMedicalTreatments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState({});
  const [collapsedProviders, setCollapsedProviders] = useState({});
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState({});
  const [medicalUploadingFor, setMedicalUploadingFor] = useState(null);
  const [docPickerForTreatment, setDocPickerForTreatment] = useState(null);
  const [docPickerLoading, setDocPickerLoading] = useState(null);
  const [medicalSortBy, setMedicalSortBy] = useState("providerName");
  const [medicalFilterType, setMedicalFilterType] = useState("All");
  const medRecFileRef = useRef(null);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [stagedMedRecords, setStagedMedRecords] = useState(null);
  const stagedMedFileRef = useRef(null);
  const [medRecFilters, setMedRecFilters] = useState({});
  const [liens, setLiens] = useState([]);
  const [damages, setDamages] = useState([]);
  const [expandedDamageId, setExpandedDamageId] = useState(null);
  const [damageDocPicker, setDamageDocPicker] = useState(false);
  const [damageDocLoading, setDamageDocLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [negotiations, setNegotiations] = useState([]);
  const [expandedPolicyNeg, setExpandedPolicyNeg] = useState({});
  const [piDataLoading, setPiDataLoading] = useState(false);
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [showDocGen, setShowDocGen] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [aiStrategy, setAiStrategy] = useState({ loading: false, result: null, error: null, show: false });
  const [aiDeadlines, setAiDeadlines] = useState({ loading: false, deadlines: null, error: null, show: false });
  const [aiTasks, setAiTasks] = useState({ loading: false, tasks: null, error: null, show: false, added: {} });
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [dlForm, setDlForm] = useState({ title: "", date: "", type: "Filing" });
  const [editingCaseDlId, setEditingCaseDlId] = useState(null);
  const [editingCaseDlTitle, setEditingCaseDlTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [tkForm, setTkForm] = useState({ title: "", priority: "Medium", due: "" });
  const [aiClientSummary, setAiClientSummary] = useState({ loading: false, result: null, error: null, show: false });
  const [aiChargeAnalysis, setAiChargeAnalysis] = useState({ loading: false, result: null, error: null, show: false });
  const [caseDocuments, setCaseDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docUploadType, setDocUploadType] = useState("Medical Records");
  const [showOneDriveImport, setShowOneDriveImport] = useState(false);
  const [oneDriveLink, setOneDriveLink] = useState("");
  const [oneDriveItems, setOneDriveItems] = useState([]);
  const [oneDriveSelected, setOneDriveSelected] = useState(new Set());
  const [oneDriveLoading, setOneDriveLoading] = useState(false);
  const [oneDriveImporting, setOneDriveImporting] = useState(false);
  const [oneDriveProgress, setOneDriveProgress] = useState({ done: 0, total: 0 });
  const [oneDriveError, setOneDriveError] = useState("");
  const [caseMsConnected, setCaseMsConnected] = useState(false);
  useEffect(() => { apiGetMsStatus().then(s => setCaseMsConnected(s?.connected || false)).catch(() => {}); }, []);
  const [docsSubTab, setDocsSubTab] = useState("documents");
  const [docFilterType, setDocFilterType] = useState("All");
  const [docSummarizing, setDocSummarizing] = useState(null);
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [filings, setFilings] = useState([]);
  const [filingsLoading, setFilingsLoading] = useState(false);
  const [filingUploadFiledBy, setFilingUploadFiledBy] = useState("");
  const [filingUploadDate, setFilingUploadDate] = useState("");
  const [filingUploadDocType, setFilingUploadDocType] = useState("");
  const [filingFilterBy, setFilingFilterBy] = useState("All");
  const [filingSummarizing, setFilingSummarizing] = useState(null);
  const [filingClassifying, setFilingClassifying] = useState(null);
  const [expandedFilingId, setExpandedFilingId] = useState(null);
  const [editingFilingId, setEditingFilingId] = useState(null);
  const [editingFilingData, setEditingFilingData] = useState({});
  const [filingSelectMode, setFilingSelectMode] = useState(false);
  const [selectedFilingIds, setSelectedFilingIds] = useState(new Set());
  const [reassigningFilingId, setReassigningFilingId] = useState(null);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editingDocData, setEditingDocData] = useState({});
  const [editingTranscriptId, setEditingTranscriptId] = useState(null);
  const [editingTranscriptData, setEditingTranscriptData] = useState({});
  const [suggestingTranscriptNameId, setSuggestingTranscriptNameId] = useState(null);
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [transcriptHistoryLoading, setTranscriptHistoryLoading] = useState(false);
  const [showTranscriptHistory, setShowTranscriptHistory] = useState(false);
  const [revertingHistoryId, setRevertingHistoryId] = useState(null);
  const [docFolders, setDocFolders] = useState([]);
  const [, setTranscriptFolders] = useState([]);
  const [docSelectMode, setDocSelectMode] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [transcriptSelectMode, setTranscriptSelectMode] = useState(false);
  const [selectedTranscriptIds, setSelectedTranscriptIds] = useState(new Set());
  const [corrSelectMode, setCorrSelectMode] = useState(false);
  const [selectedCorrIds, setSelectedCorrIds] = useState(new Set());
  const [docUploadProgress] = useState(null);
  const [filingUploadProgress] = useState(null);
  const [backgroundUploads, setBackgroundUploads] = useState([]);
  const bgUploadIdRef = useRef(0);
  const startBackgroundUpload = useCallback((filename) => {
    const id = ++bgUploadIdRef.current;
    setBackgroundUploads(prev => [...prev, { id, filename, progress: 0, status: "uploading", error: null, startedAt: Date.now() }]);
    const updateProgress = (pct) => setBackgroundUploads(prev => prev.map(u => u.id === id ? { ...u, progress: pct } : u));
    const markDone = () => {
      setBackgroundUploads(prev => prev.map(u => u.id === id ? { ...u, status: "done", progress: 100 } : u));
      setTimeout(() => setBackgroundUploads(prev => prev.filter(u => u.id !== id)), 8000);
    };
    const markError = (err) => {
      setBackgroundUploads(prev => prev.map(u => u.id === id ? { ...u, status: "error", error: err } : u));
      setTimeout(() => setBackgroundUploads(prev => prev.filter(u => u.id !== id)), 15000);
    };
    return { id, updateProgress, markDone, markError };
  }, []);
  const removeBackgroundUpload = useCallback((id) => {
    setBackgroundUploads(prev => prev.filter(u => u.id !== id));
  }, []);
  const isAttorneyPlus = isAttorney(currentUser) || hasRole(currentUser, "App Admin");

  const [linkedCases, setLinkedCases] = useState([]);
  const [linkedCasesLoading, setLinkedCasesLoading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkIsPd, setLinkIsPd] = useState(null);
  const [linkCaseSearch, setLinkCaseSearch] = useState("");
  const [linkExternalForm, setLinkExternalForm] = useState({ externalCaseNumber: "", externalCaseStyle: "", externalCourt: "", externalCounty: "Mobile", externalCharges: "", externalAttorney: "", externalStatus: "Active", externalNotes: "", relationship: "" });
  const [expandedLinkedId, setExpandedLinkedId] = useState(null);
  const [linkRelationship, setLinkRelationship] = useState("");
  const [portalSettings, setPortalSettings] = useState(null);
  const [portalClients, setPortalClients] = useState([]);
  const [portalMessages, setPortalMessages] = useState([]);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalInviteOpen, setPortalInviteOpen] = useState(false);
  const [portalInviteForm, setPortalInviteForm] = useState({ name: "", email: "", phone: "", sendWelcomeEmail: true });
  const [portalInviteResult, setPortalInviteResult] = useState(null);
  const [portalMsgBody, setPortalMsgBody] = useState("");
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalSaveMsg, setPortalSaveMsg] = useState("");
  const portalLoadedForCase = useRef(null);

  useEffect(() => {
    if (activeTab === "portal" && c && portalLoadedForCase.current !== c.id) {
      portalLoadedForCase.current = c.id;
      setPortalLoading(true);
      Promise.all([
        apiGetPortalSettings(c.id),
        apiGetPortalClients(c.id),
        apiGetPortalMessages(c.id),
      ]).then(([s, cl, msgs]) => {
        setPortalSettings(s);
        setPortalClients(cl);
        setPortalMessages(msgs);
      }).catch(err => console.error("Portal load error:", err))
        .finally(() => setPortalLoading(false));
    }
  }, [activeTab, c]);

  useEffect(() => {
    if (activeTab === "portal" && portalMessages.length > 0) {
      const unread = portalMessages.filter(m => m.sender_type === "client" && !m.read_at);
      unread.forEach(msg => {
        apiMarkPortalMsgRead(c.id, msg.id).catch(() => {});
      });
      if (unread.length > 0) {
        setPortalMessages(prev => prev.map(m => m.sender_type === "client" && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, portalMessages.length]);

  const [transcripts, setTranscripts] = useState([]);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);
  const [transcriptUploading, setTranscriptUploading] = useState(false);
  const [uploadProgress] = useState(null); // eslint-disable-line no-unused-vars
  const [expandedTranscriptId, setExpandedTranscriptId] = useState(null);
  const [transcriptDetail, setTranscriptDetail] = useState(null);
  const [transcriptDetailLoading, setTranscriptDetailLoading] = useState(false);
  const [transcriptEdits, setTranscriptEdits] = useState(null);
  const [transcriptSaving, setTranscriptSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);
  const [exportDropdownId, setExportDropdownId] = useState(null);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [editingSegmentIdx, setEditingSegmentIdx] = useState(null);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [mergeUndoStack, setMergeUndoStack] = useState([]);
  const [transcriptReadingView, setTranscriptReadingView] = useState(false);
  const [showScribeImportModal, setShowScribeImportModal] = useState(false);
  const [scribeImportList, setScribeImportList] = useState([]);
  const [scribeImportLoading, setScribeImportLoading] = useState(false);
  const [scribeImporting, setScribeImporting] = useState(null);
  const [scribeConnected, setScribeConnected] = useState(false);
  const [showSummaries, setShowSummaries] = useState(false);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const autoSaveStatusTimerRef = useRef(null);
  const transcriptPollRef = useRef(null);
  const canRemove = isAttorney(currentUser) || isAppAdmin(currentUser);
  const canDelete = isAppAdmin(currentUser);

  useEffect(() => {
    apiGetContacts().then(setAllContacts).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!transcriptEdits || !transcriptDetail || !expandedTranscriptId) return;
    if (JSON.stringify(transcriptEdits) === JSON.stringify(transcriptDetail.transcript)) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (autoSaveStatusTimerRef.current) clearTimeout(autoSaveStatusTimerRef.current);
    const savedId = expandedTranscriptId;
    const savedEdits = transcriptEdits;
    autoSaveTimerRef.current = setTimeout(async () => {
      if (transcriptSaving) return;
      setAutoSaveStatus("saving");
      try {
        const prevState = transcriptDetail.transcript;
        await apiUpdateTranscript(savedId, { transcript: savedEdits });
        setTranscriptDetail(prev => prev && prev.id === savedId ? { ...prev, transcript: savedEdits } : prev);
        setAutoSaveStatus("saved");
        autoSaveStatusTimerRef.current = setTimeout(() => setAutoSaveStatus(null), 2000);
        apiSaveTranscriptHistory(savedId, { changeType: "edit", changeDescription: "Auto-saved changes", previousState: prevState }).catch(() => {});
      } catch {
        setAutoSaveStatus(null);
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (autoSaveStatusTimerRef.current) clearTimeout(autoSaveStatusTimerRef.current);
    };
  }, [transcriptEdits, expandedTranscriptId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCorrLoading(true);
    apiGetCorrespondence(c.id).then(data => {
      setCorrespondence(data);
      const regularEmails = (data || []).filter(e => !e.isVoicemail);
      const vmEmails = (data || []).filter(e => e.isVoicemail);
      if (regularEmails.length === 0 && vmEmails.length > 0) {
        setCorrSubTab("voicemails");
      }
    }).catch(() => {}).finally(() => setCorrLoading(false));
    setVoicemailsLoading(true);
    apiGetVoicemails(c.id).then(setVoicemails).catch(() => {}).finally(() => setVoicemailsLoading(false));
    setDocsLoading(true);
    apiGetCaseDocuments(c.id).then(docs => { setCaseDocuments(docs); }).catch(() => {}).finally(() => setDocsLoading(false));
    apiGetDocFolders(c.id).then(folders => setDocFolders(folders.map(f => ({ ...f, collapsed: true })))).catch(() => setDocFolders([]));
    setTranscriptsLoading(true);
    apiGetTranscripts(c.id).then(setTranscripts).catch(() => {}).finally(() => setTranscriptsLoading(false));
    apiGetTranscriptFolders(c.id).then(setTranscriptFolders).catch(() => setTranscriptFolders([]));
    setDocSelectMode(false); setSelectedDocIds(new Set());
    setTranscriptSelectMode(false); setSelectedTranscriptIds(new Set());
    setCorrSelectMode(false); setSelectedCorrIds(new Set());
    setFilingsLoading(true);
    apiGetFilings(c.id).then(setFilings).catch(() => {}).finally(() => setFilingsLoading(false));
    apiGetActivity(c.id).then(fresh => onRefreshActivity(c.id, fresh)).catch(() => {});
    setPartiesLoading(true);
    apiGetParties(c.id).then(setParties).catch(() => {}).finally(() => setPartiesLoading(false));
    setExpertsLoading(true);
    apiGetExperts(c.id).then(setExperts).catch(() => {}).finally(() => setExpertsLoading(false));
    setMiscContactsLoading(true);
    apiGetMiscContacts(c.id).then(setMiscContacts).catch(() => {}).finally(() => setMiscContactsLoading(false));
    setLinkedCasesLoading(true);
    apiGetLinkedCases(c.id).then(setLinkedCases).catch(() => {}).finally(() => setLinkedCasesLoading(false));
    apiGetSmsConfigs(c.id).then(setSmsConfigs).catch(() => {});
    apiGetSmsMessages(c.id).then(setSmsMessages).catch(() => {});
    apiGetSmsScheduled(c.id).then(setSmsScheduled).catch(() => {});
    setPiDataLoading(true);
    Promise.all([
      apiGetInsurancePolicies(c.id).catch(() => []),
      apiGetMedicalTreatments(c.id).catch(() => []),
      apiGetLiens(c.id).catch(() => []),
      apiGetDamages(c.id).catch(() => []),
      apiGetNegotiations(c.id).catch(() => []),
      apiGetExpenses(c.id).catch(() => []),
    ]).then(([ins, med, li, dam, neg, exp]) => {
      setInsurancePolicies(ins); setMedicalTreatments(med); setLiens(li); setDamages(dam); setNegotiations(neg); setExpenses(exp || []);
      setMedicalRecords({}); setCollapsedProviders({}); setMedicalRecordsLoading({});
      if (med && med.length > 0) {
        const recMap = {};
        Promise.all(med.map(t => apiGetMedicalRecords(c.id, t.id).then(r => { recMap[t.id] = r; }).catch(() => { recMap[t.id] = []; }))).then(() => setMedicalRecords(recMap));
      }
    }).finally(() => setPiDataLoading(false));
    apiGetSmsWatch(c.id).then(setSmsWatchNumbers).catch(() => {});
    const timersRef = partyTimers.current;
    const pendingRef = partyPendingData.current;

    const expTimersRef = expertTimers.current;
    const expPendingRef = expertPendingData.current;
    const miscTimersRef = miscContactTimers.current;
    const miscPendingRef = miscContactPendingData.current;
    return () => {
      Object.entries(timersRef).forEach(([key, timer]) => {
        clearTimeout(timer);
        const pendingData = pendingRef[key];
        if (pendingData) {
          apiUpdateParty(parseInt(key), { data: pendingData }).catch(() => {});
          delete pendingRef[key];
        }
      });
      partyTimers.current = {};

      Object.entries(expTimersRef).forEach(([key, timer]) => {
        clearTimeout(timer);
        const pendingData = expPendingRef[key];
        if (pendingData) {
          apiUpdateExpert(parseInt(key), { data: pendingData }).catch(() => {});
          delete expPendingRef[key];
        }
      });
      expertTimers.current = {};
      Object.entries(miscTimersRef).forEach(([key, timer]) => {
        clearTimeout(timer);
        const pendingData = miscPendingRef[key];
        if (pendingData) {
          apiUpdateMiscContact(parseInt(key), { data: pendingData }).catch(() => {});
          delete miscPendingRef[key];
        }
      });
      miscContactTimers.current = {};
    };
  }, [c.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasProcessing = transcripts.some(t => t.status === "processing");
    if (hasProcessing && activeTab === "files" && docsSubTab === "transcripts") {
      transcriptPollRef.current = setInterval(() => {
        apiGetTranscripts(c.id).then(setTranscripts).catch(() => {});
      }, 5000);
    }
    return () => { if (transcriptPollRef.current) clearInterval(transcriptPollRef.current); };
  }, [transcripts, activeTab, docsSubTab, c.id]);

  useEffect(() => {
    const processingDocs = caseDocuments.filter(d => d.ocrStatus === "processing");
    if (processingDocs.length === 0) return;
    let polling = true;
    let inFlight = false;
    let attempts = 0;
    const maxAttempts = 90;
    const interval = setInterval(async () => {
      if (!polling || inFlight) return;
      attempts++;
      if (attempts > maxAttempts) {
        setCaseDocuments(prev => prev.map(d => d.ocrStatus === "processing" ? { ...d, ocrStatus: "failed", hasText: false } : d));
        return;
      }
      inFlight = true;
      try {
        for (const doc of processingDocs) {
          if (!polling) break;
          const status = await apiGetDocOcrStatus(doc.id);
          if (status.ocrStatus !== "processing") {
            setCaseDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, ocrStatus: status.ocrStatus, hasText: status.hasText } : d));
          }
        }
      } catch {}
      inFlight = false;
    }, 4000);
    return () => { polling = false; clearInterval(interval); };
  }, [caseDocuments]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === "files" && docsSubTab === "transcripts") {
      apiGetScribeStatus().then(r => setScribeConnected(!!r?.connected)).catch(() => setScribeConnected(false));
    }
  }, [activeTab, docsSubTab]);

  const openScribeImportModal = async () => {
    setShowScribeImportModal(true);
    setScribeImportLoading(true);
    try {
      const res = await apiListScribeTranscripts();
      const alreadyImported = new Set(transcripts.filter(t => t.scribeTranscriptId).map(t => String(t.scribeTranscriptId)));
      const filtered = (res.transcripts || []).filter(t => !alreadyImported.has(String(t.id)) && t.status === "completed");
      setScribeImportList(filtered);
    } catch (err) {
      alert("Failed to load Scribe transcripts: " + err.message);
      setShowScribeImportModal(false);
    }
    setScribeImportLoading(false);
  };

  const handleScribeImport = async (scribeTranscriptId) => {
    setScribeImporting(scribeTranscriptId);
    try {
      await apiImportNewFromScribe(scribeTranscriptId, c.id);
      setScribeImportList(prev => prev.filter(t => t.id !== scribeTranscriptId));
      const refreshed = await apiGetTranscripts(c.id);
      setTranscripts(refreshed);
    } catch (err) {
      alert("Import failed: " + err.message);
    }
    setScribeImporting(null);
  };

  const handleContactClick = async (name) => {
    if (!name || !name.trim()) return;
    const n = name.trim().toLowerCase();
    const found = allContacts.find(ct => ct.name.trim().toLowerCase() === n);
    if (found) {
      setContactPopup(found);
    } else {
      try {
        const created = await apiCreateContact({ name: name.trim(), category: "Miscellaneous", phone: "", email: "", fax: "", address: "" });
        setAllContacts(p => [...p, created]);
        setContactPopup(created);
      } catch { /* silently ignore if creation fails */ }
    }
  };

  // Track "committed" values for blur-based change detection
  const committed = useState({ ...c })[0]; // ref-like: we mutate it directly

  const log = (action, detail) => {
    onLogActivity({
      id: newId(),
      caseId: c.id,
      ts: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      detail,
    });
  };

  // Auto-save on draft/customFields/customDates/billing/expenses change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      onUpdate({ ...draft, _customFields: customFields, _customDates: customDates, _hiddenFields: hiddenFields, _customTeam: customTeam });
    }, 400);
    return () => clearTimeout(t);
  }, [draft, customFields, customDates, customTeam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Field label lookup for human-readable log entries
  const fieldLabel = (key) => {
    const f = CORE_FIELDS.find(f => f.key === key);
    return f ? f.label : key;
  };

  const formatVal = (key, val) => {
    if (!val && val !== 0) return "—";
    const f = CORE_FIELDS.find(f => f.key === key);
    if (f?.type === "date") return fmt(val);
    if (f?.type === "user") return getUserById(Number(val))?.name || val;
    return String(val);
  };

  // On blur: compare current draft value against what was committed, log if changed
  const handleBlur = (key) => {
    const oldVal = committed[key];
    const newVal = draft[key];
    if (String(oldVal ?? "") !== String(newVal ?? "")) {
      log(
        "Field Updated",
        `${fieldLabel(key)} changed from "${formatVal(key, oldVal)}" to "${formatVal(key, newVal)}"`
      );
      committed[key] = newVal;
      if (KEY_DATE_FIELDS.includes(key)) {
        const label = fieldLabel(key);
        const existing = deadlines.find(d => d.caseId === c.id && d.title === label);
        if (newVal) {
          if (existing) {
            if (onUpdateDeadline) onUpdateDeadline(existing.id, { date: newVal });
          } else {
            handleAddDeadline({ caseId: c.id, title: label, date: newVal, type: KEY_DATE_TYPES[key] || "Filing", rule: "", assigned: currentUser.id });
          }
        }
      }
    }
  };

  const set = (key, val) => setDraft(p => ({ ...p, [key]: val }));

  // For selects/dropdowns: log immediately on change (no blur needed)
  const setAndLog = (key, val) => {
    const oldVal = draft[key];
    setDraft(p => ({ ...p, [key]: val }));
    if (String(oldVal ?? "") !== String(val ?? "")) {
      log(
        "Field Updated",
        `${fieldLabel(key)} changed from "${formatVal(key, oldVal)}" to "${formatVal(key, val)}"`
      );
      committed[key] = val;
    }
  };

  const detailFields = CORE_FIELDS.filter(f => f.section === "details" && f.key !== "status" && f.key !== "stage");
  const infoFields   = CORE_FIELDS.filter(f => f.section === "info");
  const dateFields   = CORE_FIELDS.filter(f => f.section === "dates");
  const teamFields   = CORE_FIELDS.filter(f => f.section === "team");

  const filteredUsersForTeam = USERS;

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const label = newFieldLabel.trim();
    setCustomFields(p => [...p, { id: newId(), label, value: "", isNameField: newFieldIsName }]);
    setNewFieldLabel("");
    setNewFieldIsName(false);
    setAddingField(false);
    log("Field Added", `Custom field "${label}" added${newFieldIsName ? " (name/contact field)" : ""}`);
  };

  const removeCustomField = (id) => {
    const field = customFields.find(f => f.id === id);
    setCustomFields(p => p.filter(f => f.id !== id));
    if (field) log("Field Removed", `Custom field "${field.label}" removed`);
  };

  const updateCustomField = (id, val) => {
    setCustomFields(p => p.map(f => f.id === id ? { ...f, value: val } : f));
  };

  const handleCustomBlur = (id) => {
    const field = customFields.find(f => f.id === id);
    if (!field) return;
    const prev = (c._customFields || []).find(f => f.id === id);
    const oldVal = prev?.value ?? "";
    if (oldVal !== field.value) {
      log("Field Updated", `"${field.label}" changed from "${oldVal || "—"}" to "${field.value || "—"}"`);
    }
  };

  const addCustomDate = () => {
    if (!newDateLabel.trim()) return;
    const label = newDateLabel.trim();
    setCustomDates(p => [...p, { id: newId(), label, value: "" }]);
    setNewDateLabel("");
    setAddingDate(false);
    log("Field Added", `Custom date "${label}" added`);
  };

  const removeCustomDate = (id) => {
    const d = customDates.find(d => d.id === id);
    setCustomDates(p => p.filter(d => d.id !== id));
    if (d) log("Field Removed", `Custom date "${d.label}" removed`);
  };

  const updateCustomDate = (id, val) => {
    const prev = customDates.find(d => d.id === id);
    setCustomDates(p => p.map(d => d.id === id ? { ...d, value: val } : d));
    if (val && prev) {
      const alreadyExists = deadlines.some(d => d.title === prev.label);
      if (!alreadyExists) {
        handleAddDeadline({ caseId: c.id, title: prev.label, date: val, type: "Filing", rule: "", assigned: currentUser.id });
      }
    }
  };

  const handleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    onCompleteTask(taskId);
    if (task) log("Task Completed", `"${task.title}" marked complete`);
  };

  const handleAddNote = (note) => {
    onAddNote(note);
    const typeLabel = note.type || "General";
    const preview = (note.body || "").substring(0, 60);
    log("Note Added", `${typeLabel} note: "${preview}${note.body && note.body.length > 60 ? "..." : ""}"`);
  };

  const handleDeleteNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    onDeleteNote(noteId);
    if (note) {
      const preview = (note.body || "").substring(0, 60);
      log("Note Removed", `Note deleted: "${preview}${note.body && note.body.length > 60 ? "..." : ""}"`);
    }
  };

  const handleUpdateNote = async (noteId, data) => {
    await onUpdateNote(noteId, data);
    log("Note Edited", `Note updated`);
  };

  const handleAddDeadline = (dl) => {
    if (onAddDeadline) onAddDeadline(dl);
    log("Deadline Added", `"${dl.title}" due ${dl.date}${dl.type ? ` (${dl.type})` : ""}`);
  };

  // Wrap link handlers to log
  const handleAddLink = (link) => {
    onAddLink(link);
    log("File Link Added", `"${link.label}" linked (${link.category})`);
  };
  const handleDeleteLink = (linkId) => {
    const link = links.find(l => l.id === linkId);
    onDeleteLink(linkId);
    if (link) log("File Link Removed", `"${link.label}" removed`);
  };

  // Timestamp formatter for activity tab
  const fmtTs = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const actionColor = (action) => {
    if (action.includes("Completed")) return "#4CAE72";
    if (action.includes("Removed") || action.includes("Reopened") || action.includes("Deleted")) return "#e05252";
    if (action.includes("Added") || action.includes("Created")) return "#f59e0b";
    if (action.includes("Note") || action.includes("Deadline")) return "#5E81AC";
    if (action.includes("Billing") || action.includes("Expense")) return "#D08770";
    if (action.includes("Correspondence")) return "#88C0D0";
    return "#5599cc";
  };

  return (
    <>
      {showPrint && (
        <CasePrintView c={draft} notes={notes} tasks={tasks} deadlines={deadlines} links={links} onClose={() => setShowPrint(false)} />
      )}
      {showDocGen && (
        <GenerateDocumentModal caseData={draft} currentUser={currentUser} onClose={() => setShowDocGen(false)} parties={parties} experts={experts} caseId={c.id} onAddNote={onAddNote} onLogActivity={onLogActivity} />
      )}
      {aiStrategy.show && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 700, maxHeight: "85vh", overflow: "auto" }}>
            <div className="modal-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="flex items-center gap-1.5"><Sparkles size={16} className="text-amber-500" /> Case Valuation & Strategy</span>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setAiStrategy({ loading: false, result: null, error: null, show: false })}>✕</button>
            </div>
            <div className="modal-sub">{draft.title} — {draft.clientName || "Client"}</div>
            <AiPanel title="Strategy Analysis" result={aiStrategy.result} loading={aiStrategy.loading} error={aiStrategy.error}
              onRun={() => {
                setAiStrategy(p => ({ ...p, loading: true, result: null, error: null }));
                apiCaseStrategy({ caseId: c.id }).then(r => setAiStrategy(p => ({ ...p, loading: false, result: r.result }))).catch(e => setAiStrategy(p => ({ ...p, loading: false, error: e.message })));
              }}
              actions={aiStrategy.result ? (
                <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => {
                  onAddNote({ caseId: c.id, body: aiStrategy.result, type: "Strategy" });
                  onLogActivity("AI Strategy Saved", "Case valuation & strategy analysis saved as note");
                  alert("Strategy saved as case note.");
                }}>Save as Note</button>
              ) : null}
            />
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, color: "var(--c-text-h)", marginBottom: 10 }}>Delete {recordType(draft)}?</div>
            <div style={{ fontSize: 13, color: "var(--c-text2)", marginBottom: 6, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--c-text)" }}>{draft.title}</strong> will be moved to the Deleted tab and permanently removed after 30 days.
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 24 }}>This action can be undone within the 30-day window by restoring the record.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn" style={{ background: "#fca5a5", color: "#e05252", border: "1px solid #8a3a3a" }} onClick={() => { setShowDeleteConfirm(false); onDeleteCase(c.id); }}>Delete {recordType(draft)}</button>
            </div>
          </div>
        </div>
      )}
      {showTeamPopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowTeamPopup(false)}>
          <div className="mobile-full" style={{ background: "var(--c-card)", borderRadius: 12, padding: "24px 28px", minWidth: 380, maxWidth: 500, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", margin: "0 8px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 600, color: "var(--c-text-h)" }}>Team</div>
              <button onClick={() => setShowTeamPopup(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b", lineHeight: 1, padding: "2px 4px" }}>✕</button>
            </div>
            {teamFields.map(f => (
              <EditField
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                type={f.type}
                value={draft[f.key]}
                onChange={val => setAndLog(f.key, val)}
                canRemove={false}
                userList={filteredUsersForTeam}
                readOnly={false}
              />
            ))}
            {customTeam.map(m => (
              <div key={m.id} className="edit-field">
                <div className="edit-field-key" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{m.role}</span>
                  <button onClick={() => setCustomTeam(p => p.filter(t => t.id !== m.id))} style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px" }}>✕</button>
                </div>
                <StaffSearchField value={m.userId || 0} onChange={val => setCustomTeam(p => p.map(t => t.id === m.id ? { ...t, userId: val } : t))} placeholder="Search staff…" userList={filteredUsersForTeam} />
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              {addingTeamSlot && (
                  <div style={{ marginBottom: 8 }}>
                    <input
                      placeholder="Role (e.g. Co-Counsel, Investigator)"
                      value={newTeamRole}
                      onChange={e => setNewTeamRole(e.target.value)}
                      style={{ width: "100%", fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", marginBottom: 6, boxSizing: "border-box" }}
                      autoFocus
                    />
                    <StaffSearchField value={newTeamUserId} onChange={val => setNewTeamUserId(val)} placeholder="Search staff…" userList={filteredUsersForTeam} />
                    <button
                      className="btn btn-gold"
                      style={{ fontSize: 12, width: "100%" }}
                      disabled={!newTeamRole.trim() || !newTeamUserId}
                      onClick={() => {
                        setCustomTeam(p => [...p, { id: Date.now(), role: newTeamRole.trim(), userId: newTeamUserId }]);
                        setNewTeamRole("");
                        setNewTeamUserId(0);
                        setAddingTeamSlot(false);
                      }}
                    >Add to Team</button>
                  </div>
                )}
                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, width: "100%" }} onClick={() => setAddingTeamSlot(s => !s)}>
                  {addingTeamSlot ? "Cancel" : "+ Add Team Slot"}
                </button>
            </div>
          </div>
        </div>
      )}
      {contactPopup && (
        <div className="case-overlay" style={{ left: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <div className="login-box" style={{ maxWidth: 420, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setContactPopup(null); setContactEditMode(false); }} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", lineHeight: 1 }}>✕</button>
            {contactEditMode && contactEditDraft ? (
              <>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, color: "var(--c-text-h)", marginBottom: 16 }}>Edit Contact</div>
                {[["Name", "name"], ["Phone", "phone"], ["Email", "email"], ["Fax", "fax"], ["Address", "address"]].map(([lbl, key]) => (
                  <div className="form-group" key={key}>
                    <label>{lbl}</label>
                    <input value={contactEditDraft[key] || ""} onChange={e => setContactEditDraft(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%" }} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Category</label>
                  <select value={contactEditDraft.category || "Client"} onChange={e => setContactEditDraft(p => ({ ...p, category: e.target.value }))} style={{ width: "100%" }}>
                    {CONTACT_CATEGORIES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <button className="btn btn-gold" style={{ width: "100%", padding: 10 }} onClick={async () => {
                  try {
                    const saved = await apiUpdateContact(contactEditDraft.id, contactEditDraft);
                    setAllContacts(p => p.map(ct => ct.id === saved.id ? saved : ct));
                    setContactPopup(saved);
                    setContactEditMode(false);
                  } catch { alert("Failed to save contact."); }
                }}>Save</button>
                <button className="btn btn-outline" style={{ width: "100%", marginTop: 10 }} onClick={() => setContactEditMode(false)}>Cancel</button>
              </>
            ) : (() => {
              const cs = CONTACT_CAT_STYLE[contactPopup.category] || CONTACT_CAT_STYLE.Miscellaneous;
              const row = (icon, val) => val ? (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: "#64748b", width: 18, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "var(--c-text)" }}>{val}</span>
                </div>
              ) : null;
              return (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 6 }}>{contactPopup.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: cs.bg, color: "#1e293b", borderRadius: 4, padding: "2px 8px" }}>{contactPopup.category}</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 14 }}>
                    {row("📞", contactPopup.phone)}
                    {row("✉️", contactPopup.email)}
                    {row("📠", contactPopup.fax)}
                    {row("📍", contactPopup.address)}
                    {!contactPopup.phone && !contactPopup.email && !contactPopup.fax && !contactPopup.address && (
                      <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>No contact details on file.</div>
                    )}
                  </div>
                  <button className="btn btn-gold" style={{ width: "100%", padding: 10, marginTop: 16 }} onClick={() => { setContactEditDraft({ ...contactPopup }); setContactEditMode(true); }}>Edit Contact</button>
                </>
              );
            })()}
          </div>
        </div>
      )}
      <div className="case-overlay">

        {/* Header */}
        <div className="case-overlay-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: headerExpanded ? 6 : 0, flexWrap: "wrap" }}>
              <Badge label="Case" />
              {draft.caseNum && <span style={{ fontSize: 11, color: "#0f172a", fontFamily: "monospace" }}>{draft.caseNum}</span>}
              <button
                onClick={() => setHeaderExpanded(p => !p)}
                style={{ background: "none", border: "1px solid var(--c-border)", borderRadius: 4, padding: "1px 4px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "var(--c-text3)" }}
                title={headerExpanded ? "Collapse header" : "Expand header"}
              >
                <ChevronDown size={12} style={{ transition: "transform 0.15s", transform: headerExpanded ? "rotate(0deg)" : "rotate(-90deg)" }} />
              </button>
              {!headerExpanded && (
                <>
                  <span style={{ fontSize: 11, color: "var(--c-text3)" }}>{draft.status || "Active"}</span>
                  <span style={{ fontSize: 11, color: "var(--c-text3)" }}>{draft.stage || "Intake"}</span>
                  {draft.confidential && <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 700 }}>CONF</span>}
                  {draft.inLitigation && <span style={{ fontSize: 9, color: "#2563eb", fontWeight: 700 }}>LIT</span>}
                </>
              )}
            </div>
            {headerExpanded && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                {editMode
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.03em" }}>EDIT MODE</span>
                  : <span style={{ fontSize: 11, color: "#64748b" }}>Auto-saving</span>
                }
                <select
                  value={draft.status || "Active"}
                  onChange={e => setAndLog("status", e.target.value)}
                  style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {["Active", "Closed", "Pending", "Disposed", "Transferred"].map(o => <option key={o}>{o}</option>)}
                </select>
                <select
                  value={draft.stage || "Intake"}
                  onChange={e => setAndLog("stage", e.target.value)}
                  style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {["Intake", "Investigation", "Treatment", "Pre-Litigation Demand", "Negotiation", "Suit Filed", "Discovery", "Mediation", "Trial Preparation", "Trial", "Settlement/Verdict", "Closed"].map(o => <option key={o}>{o}</option>)}
                </select>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: draft.confidential ? "#dc2626" : "#64748b", cursor: "pointer", userSelect: "none", marginLeft: 4 }} title="Confidential cases are excluded from AI Search">
                  <input type="checkbox" checked={!!draft.confidential} onChange={e => setAndLog("confidential", e.target.checked)} style={{ margin: 0, cursor: "pointer" }} />
                  {draft.confidential ? "CONFIDENTIAL" : "Confidential"}
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: draft.inLitigation ? "#2563eb" : "#64748b", cursor: "pointer", userSelect: "none", marginLeft: 4 }} title="Mark case as in litigation">
                  <input type="checkbox" checked={!!draft.inLitigation} onChange={e => { setAndLog("inLitigation", e.target.checked); if (!e.target.checked && activeTab === "filings") setActiveTab("overview"); }} style={{ margin: 0, cursor: "pointer" }} />
                  {draft.inLitigation ? "IN LITIGATION" : "Litigation"}
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: draft.clientBankruptcy ? "#dc2626" : "#64748b", cursor: "pointer", userSelect: "none", marginLeft: 4 }} title="Client bankruptcy status">
                  <input type="checkbox" checked={!!draft.clientBankruptcy} onChange={e => setAndLog("clientBankruptcy", e.target.checked)} style={{ margin: 0, cursor: "pointer" }} />
                  {draft.clientBankruptcy ? "BANKRUPTCY" : "Bankruptcy"}
                </label>
              </div>
            )}
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, color: "var(--c-text-h)", fontWeight: 600, lineHeight: 1.2 }}>
              {draft.title || "Untitled"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <button
                className={`btn btn-sm ${editMode ? "" : "btn-outline"}`}
                style={editMode ? { background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", lineHeight: "20px" } : { lineHeight: "20px" }}
                onClick={() => setEditMode(e => !e)}
              >{editMode ? "✓ Done" : "✎ Edit"}</button>
              <button className="btn btn-outline btn-sm" style={{ lineHeight: "20px", fontSize: 13, padding: "4px 10px" }} onClick={() => setActionsExpanded(e => !e)} title={actionsExpanded ? "Collapse actions" : "More actions"}>
                {actionsExpanded ? "▲" : "▼"}
              </button>
              <button className="btn btn-outline btn-sm" style={{ fontSize: 16, lineHeight: 1, padding: "4px 10px" }} onClick={onClose}>✕</button>
          </div>
          {actionsExpanded && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8, width: "100%" }}>
              <button className="btn btn-outline btn-sm" style={{ lineHeight: "20px" }} onClick={() => setShowTeamPopup(true)}>👥 Team</button>
              <button className="px-3 py-1.5 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5 cursor-pointer" onClick={() => {
                setAiStrategy(p => ({ ...p, show: true, loading: true, result: null, error: null }));
                apiCaseStrategy({ caseId: c.id }).then(r => setAiStrategy(p => ({ ...p, loading: false, result: r.result }))).catch(e => setAiStrategy(p => ({ ...p, loading: false, error: e.message })));
              }}><Sparkles size={12} className="text-amber-500" /> Strategy</button>
              <button className="btn btn-outline btn-sm" style={{ lineHeight: "20px" }} onClick={() => setShowPrint(true)}>🖨 Print</button>
              <button className="btn btn-outline btn-sm" style={{ lineHeight: "20px" }} onClick={() => { if (parties.length === 0) apiGetParties(c.id).then(setParties).catch(() => {}); setShowDocGen(true); }}>📄 Generate</button>
              {onOpenTrialCenter && <button className="btn btn-outline btn-sm" style={{ lineHeight: "20px" }} onClick={() => onOpenTrialCenter(c.id)}><Scale size={12} className="inline mr-1" /> Trial Center</button>}
              {canDelete && (
                <button className="btn btn-outline btn-sm" style={{ color: "#e05252", borderColor: "#fca5a5", lineHeight: "20px" }} onClick={() => setShowDeleteConfirm(true)}>Delete</button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="case-overlay-tabs">
          <div className={`case-overlay-tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Overview</div>
          <div className={`case-overlay-tab ${activeTab === "details" ? "active" : ""}`} onClick={() => setActiveTab("details")}>Details</div>
          <div className={`case-overlay-tab ${activeTab === "insurance" ? "active" : ""}`} onClick={() => setActiveTab("insurance")}>Insurance</div>
          <div className={`case-overlay-tab ${activeTab === "medical" ? "active" : ""}`} onClick={() => setActiveTab("medical")}>Medical</div>
          <div className={`case-overlay-tab ${activeTab === "damages" ? "active" : ""}`} onClick={() => setActiveTab("damages")}>Damages</div>
          <div className={`case-overlay-tab ${activeTab === "expenses" ? "active" : ""}`} onClick={() => setActiveTab("expenses")}>Expenses</div>
          <div className={`case-overlay-tab ${activeTab === "files" ? "active" : ""}`} onClick={() => setActiveTab("files")}>Documents</div>
          <div className={`case-overlay-tab ${activeTab === "correspondence" ? "active" : ""}`} onClick={() => setActiveTab("correspondence")}>
            Correspondence {(correspondence.length + smsMessages.length + voicemails.length) > 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({correspondence.length + smsMessages.length + voicemails.length})</span>}
          </div>
          {draft.inLitigation && <div className={`case-overlay-tab ${activeTab === "filings" ? "active" : ""}`} onClick={() => setActiveTab("filings")}>
            Filings {filings.length > 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({filings.length})</span>}
          </div>}
          <div className={`case-overlay-tab ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>
            Activity {activity.length > 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({activity.length})</span>}
          </div>
          <div className={`case-overlay-tab ${activeTab === "linked" ? "active" : ""}`} onClick={() => setActiveTab("linked")}>
            Linked Cases {linkedCases.length > 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({linkedCases.length})</span>}
          </div>
          <div className={`case-overlay-tab ${activeTab === "portal" ? "active" : ""}`} onClick={() => setActiveTab("portal")}>
            Client Portal
          </div>
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="case-overlay-body">

            {/* AI Quick Actions Bar */}
            <div className="flex gap-3 mb-8 flex-wrap">
              <button className="px-4 py-2 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2 cursor-pointer" onClick={() => {
                setAiClientSummary({ loading: true, result: null, error: null, show: true });
                apiClientSummary({ caseId: c.id }).then(r => setAiClientSummary(p => ({ ...p, loading: false, result: r.result }))).catch(e => setAiClientSummary(p => ({ ...p, loading: false, error: e.message })));
              }}><Sparkles size={16} className="text-amber-500" /> Client Summary</button>
              <button className="px-4 py-2 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2 cursor-pointer" onClick={() => {
                setAiChargeAnalysis({ loading: true, result: null, error: null, show: true });
                apiChargeAnalysis({ caseId: c.id })
                  .then(r => setAiChargeAnalysis(p => ({ ...p, loading: false, result: r.result }))).catch(e => setAiChargeAnalysis(p => ({ ...p, loading: false, error: e.message })));
              }}><Sparkles size={16} className="text-amber-500" /> Liability Analysis</button>
            </div>

            {aiClientSummary.show && (
              <div style={{ marginBottom: 16 }}>
                <AiPanel title="Client Communication Summary" result={aiClientSummary.result} loading={aiClientSummary.loading} error={aiClientSummary.error}
                  onClose={() => setAiClientSummary({ loading: false, result: null, error: null, show: false })}
                  onRun={() => {
                    setAiClientSummary({ loading: true, result: null, error: null, show: true });
                    apiClientSummary({ caseId: c.id }).then(r => setAiClientSummary(p => ({ ...p, loading: false, result: r.result }))).catch(e => setAiClientSummary(p => ({ ...p, loading: false, error: e.message })));
                  }}
                  actions={aiClientSummary.result ? <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => navigator.clipboard.writeText(aiClientSummary.result)}>Copy</button> : null}
                />
              </div>
            )}

            {aiChargeAnalysis.show && (
              <div style={{ marginBottom: 16 }}>
                <AiPanel title="Liability Analysis" result={aiChargeAnalysis.result} loading={aiChargeAnalysis.loading} error={aiChargeAnalysis.error}
                  onClose={() => setAiChargeAnalysis({ loading: false, result: null, error: null, show: false })}
                  onRun={() => {
                    setAiChargeAnalysis({ loading: true, result: null, error: null, show: true });
                    apiChargeAnalysis({ caseId: c.id })
                      .then(r => setAiChargeAnalysis(p => ({ ...p, loading: false, result: r.result }))).catch(e => setAiChargeAnalysis(p => ({ ...p, loading: false, error: e.message })));
                  }}
                />
              </div>
            )}

            {/* Three-column: Case Details | Client Details | Key Dates */}
            <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 32px", marginBottom: 32 }}>

              <div className="case-overlay-section" style={{ display: "flex", flexDirection: "column" }}>
                <div className="case-overlay-section-title">Case Details</div>
                {detailFields.filter(f => !hiddenFields.includes(f.key)).map(f => (
                  <EditField
                    key={f.key}
                    fieldKey={f.key}
                    label={f.label}
                    type={f.type}
                    options={f.options}
                    value={draft[f.key]}
                    onChange={val => f.type === "select" || f.type === "user" ? setAndLog(f.key, val) : set(f.key, val)}
                    onBlur={() => (f.type === "text") && handleBlur(f.key)}
                    canRemove={editMode && canRemove}
                    onRemove={() => setHiddenFields(p => [...p, f.key])}
                    readOnly={!editMode}
                    onContactClick={!editMode && CONTACT_LINKABLE_KEYS.has(f.key) ? handleContactClick : undefined}
                  />
                ))}
                {customFields.map(f => (
                  <EditField
                    key={f.id}
                    fieldKey={f.id}
                    label={f.label}
                    type="custom"
                    value={f.value}
                    onChange={val => updateCustomField(f.id, val)}
                    onBlur={() => handleCustomBlur(f.id)}
                    onRemove={() => canRemove ? removeCustomField(f.id) : alert("Only attorneys can remove fields.")}
                    canRemove={editMode && canRemove}
                    isCustom
                    readOnly={!editMode}
                    onContactClick={!editMode && f.isNameField ? handleContactClick : undefined}
                  />
                ))}
                {editMode && (
                  <div style={{ marginTop: 6 }}>
                    {addingField && (
                      <div style={{ marginBottom: 8 }}>
                        <div className="add-field-row" style={{ marginBottom: 6 }}>
                          <input
                            placeholder="Field name (e.g. Policy Limit)"
                            value={newFieldLabel}
                            onChange={e => setNewFieldLabel(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addCustomField()}
                            style={{ flex: 1 }}
                            autoFocus
                          />
                          <button className="btn btn-gold" style={{ fontSize: 12, whiteSpace: "nowrap" }} onClick={addCustomField}>Add</button>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--c-text2)", cursor: "pointer", paddingLeft: 2 }}>
                          <input type="checkbox" checked={newFieldIsName} onChange={e => setNewFieldIsName(e.target.checked)} />
                          Name field (contact-linkable)
                        </label>
                      </div>
                    )}
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11, width: "100%" }} onClick={() => setAddingField(s => !s)}>
                      {addingField ? "Cancel" : "+ Add Field"}
                    </button>
                  </div>
                )}
              </div>

              <div className="case-overlay-section" style={{ display: "flex", flexDirection: "column" }}>
                <div className="case-overlay-section-title">Client Details</div>
                <div className="edit-field">
                  <div className="edit-field-key">Date of Birth</div>
                  <div className="edit-field-val">
                    <input type="date" value={draft.clientDob || ""} onChange={e => set("clientDob", e.target.value)} onBlur={() => handleBlur("clientDob")} style={{ width: "100%", fontSize: 13 }} />
                  </div>
                </div>
                <div className="edit-field">
                  <div className="edit-field-key">SSN</div>
                  <div className="edit-field-val">
                    <input type="text" value={draft.clientSsn || ""} onChange={e => set("clientSsn", e.target.value)} onBlur={() => handleBlur("clientSsn")} placeholder="XXX-XX-XXXX" style={{ width: "100%", fontSize: 13, fontFamily: "monospace" }} />
                  </div>
                </div>
                <div className="edit-field">
                  <div className="edit-field-key">Address</div>
                  <div className="edit-field-val">
                    <input type="text" value={draft.clientAddress || ""} onChange={e => set("clientAddress", e.target.value)} onBlur={() => handleBlur("clientAddress")} placeholder="Street, City, State ZIP" style={{ width: "100%", fontSize: 13 }} />
                  </div>
                </div>
                <div className="edit-field">
                  <div className="edit-field-key" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Phone Numbers</span>
                    <button onClick={() => { const phones = [...(draft.clientPhones || []), { label: "Cell", number: "" }]; set("clientPhones", phones); setAndLog("clientPhones", phones); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 11, padding: 0 }}>+ Add</button>
                  </div>
                  <div className="edit-field-val" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(draft.clientPhones || []).map((ph, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <select value={ph.label || "Cell"} onChange={e => { const phones = [...(draft.clientPhones || [])]; phones[idx] = { ...phones[idx], label: e.target.value }; set("clientPhones", phones); setAndLog("clientPhones", phones); }} style={{ fontSize: 11, padding: "2px 4px", width: 60 }}>
                          {["Cell", "Home", "Work", "Fax", "Other"].map(l => <option key={l}>{l}</option>)}
                        </select>
                        <input type="text" value={ph.number || ""} onChange={e => { const phones = [...(draft.clientPhones || [])]; phones[idx] = { ...phones[idx], number: e.target.value }; set("clientPhones", phones); }} onBlur={() => handleBlur("clientPhones")} placeholder="(555) 555-5555" style={{ flex: 1, fontSize: 13 }} />
                        <button onClick={() => { const phones = (draft.clientPhones || []).filter((_, i) => i !== idx); set("clientPhones", phones); setAndLog("clientPhones", phones); }} style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 13, padding: "0 2px" }}>✕</button>
                      </div>
                    ))}
                    {(!draft.clientPhones || draft.clientPhones.length === 0) && <span style={{ fontSize: 12, color: "#94a3b8" }}>No phone numbers</span>}
                  </div>
                </div>
                <div className="edit-field">
                  <div className="edit-field-key">Email</div>
                  <div className="edit-field-val">
                    <input type="email" value={draft.clientEmail || ""} onChange={e => set("clientEmail", e.target.value)} onBlur={() => handleBlur("clientEmail")} placeholder="client@email.com" style={{ width: "100%", fontSize: 13 }} />
                  </div>
                </div>
                <div className="edit-field">
                  <div className="edit-field-key">Emergency Contact</div>
                  <div className="edit-field-val">
                    <input type="text" value={draft.clientEmergencyContact || ""} onChange={e => set("clientEmergencyContact", e.target.value)} onBlur={() => handleBlur("clientEmergencyContact")} placeholder="Name — Phone" style={{ width: "100%", fontSize: 13 }} />
                  </div>
                </div>
              </div>

              <div className="case-overlay-section" style={{ display: "flex", flexDirection: "column" }}>
                <div className="case-overlay-section-title">Key Dates</div>
                {(() => {
                  const LITIGATION_STAGES = ["Suit Filed", "Discovery", "Mediation", "Trial Preparation", "Trial", "Settlement/Verdict"];
                  const isLitigationStage = LITIGATION_STAGES.includes(draft.stage);
                  const LITIGATION_DATE_KEYS = ["trialDate", "nextCourtDate", "mediationDate"];
                  return dateFields.filter(f => !hiddenFields.includes(f.key)).filter(f => {
                    if (LITIGATION_DATE_KEYS.includes(f.key) && !isLitigationStage) return false;
                    return true;
                  }).map(f => {
                    const days = draft[f.key] ? daysUntil(draft[f.key]) : null;
                    const displayLabel = f.key === "demandDate" && draft.demandDate ? "Demand Sent" : f.label;
                    return (
                      <div key={f.key} className="edit-field">
                        <div className="edit-field-key" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>{displayLabel}</span>
                          {editMode && canRemove && (
                            <button onClick={() => setHiddenFields(p => [...p, f.key])} style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px" }}>✕</button>
                          )}
                        </div>
                        <div className="edit-field-val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {editMode ? (
                            <input type="date" value={draft[f.key] || ""} onChange={e => set(f.key, e.target.value)} onBlur={() => handleBlur(f.key)} style={{ flex: 1 }} />
                          ) : (
                            <span style={{ fontSize: 13, color: "var(--c-text)", padding: "3px 0" }}>{draft[f.key] ? fmt(draft[f.key]) : "—"}</span>
                          )}
                          {draft[f.key] && days !== null && (
                            <span style={{ fontSize: 11, color: urgencyColor(days), whiteSpace: "nowrap", fontWeight: 600 }}>
                              {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `${days}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
                {customDates.map(d => (
                  <div key={d.id} className="edit-field">
                    <div className="edit-field-key" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{d.label}</span>
                      {editMode && (
                        <button onClick={() => removeCustomDate(d.id)} style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px" }}>✕</button>
                      )}
                    </div>
                    <div className="edit-field-val">
                      {editMode ? (
                        <input type="date" value={d.value || ""} onChange={e => updateCustomDate(d.id, e.target.value)} style={{ width: "100%" }} />
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--c-text)", padding: "3px 0" }}>{d.value ? fmt(d.value) : "—"}</span>
                      )}
                    </div>
                  </div>
                ))}
                {editMode && (
                  <div style={{ marginTop: 6 }}>
                    {addingDate && (
                      <div className="add-field-row" style={{ marginBottom: 8 }}>
                        <input
                          placeholder="Date label (e.g. Statute of Limitations)"
                          value={newDateLabel}
                          onChange={e => setNewDateLabel(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addCustomDate()}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <button className="btn btn-gold" style={{ fontSize: 12, whiteSpace: "nowrap" }} onClick={addCustomDate}>Add</button>
                      </div>
                    )}
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11, width: "100%" }} onClick={() => setAddingDate(s => !s)}>
                      {addingDate ? "Cancel" : "+ Add Date"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--c-border)", margin: "8px 0 32px" }} />

            {/* Three-column: Deadlines | Tasks | Notes */}
            <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: `${collapsedCols.deadlines ? "48px" : "1fr"} ${collapsedCols.tasks ? "48px" : "1fr"} ${collapsedCols.notes ? "48px" : "1.4fr"}`, gap: "0 0", transition: "grid-template-columns 0.3s ease" }}>
              <div className="case-overlay-section" style={{ overflow: "hidden", borderRight: "1px solid var(--c-border2)", paddingRight: collapsedCols.deadlines ? 0 : 16, transition: "padding 0.3s ease" }}>
                {collapsedCols.deadlines ? (
                  <div className="collapse-strip" onClick={() => toggleCol("deadlines")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 4 }}>
                    <ChevronRight size={14} style={{ color: "var(--c-text3)" }} />
                    <span style={{ writingMode: "vertical-lr", fontSize: 12, fontWeight: 600, color: "var(--c-text2)", letterSpacing: "0.5px" }}>Deadlines ({deadlines.length})</span>
                  </div>
                ) : (
                <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button className="col-collapse-btn" onClick={() => toggleCol("deadlines")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}><ChevronDown size={14} style={{ color: "var(--c-text3)" }} /></button>
                    <div className="case-overlay-section-title">Deadlines ({deadlines.length})</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { setShowAddDeadline(s => !s); if (showAddDeadline) setDlForm({ title: "", date: "", type: "Filing" }); }}>
                      {showAddDeadline ? "Cancel" : "+ Add Deadline"}
                    </button>
                    <button className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer" onClick={() => {
                      setAiDeadlines({ loading: true, deadlines: null, error: null, show: true });
                      apiDeadlineGenerator({ caseId: c.id, stage: draft.stage, caseType: draft.caseType, stateJurisdiction: draft.stateJurisdiction, accidentDate: draft.accidentDate, statuteOfLimitationsDate: draft.statuteOfLimitationsDate, trialDate: draft.trialDate, nextCourtDate: draft.nextCourtDate, mediationDate: draft.mediationDate, existingDeadlines: deadlines.map(d => ({ title: d.title, date: d.date })) })
                        .then(r => setAiDeadlines(p => ({ ...p, loading: false, deadlines: r.deadlines })))
                        .catch(e => setAiDeadlines(p => ({ ...p, loading: false, error: e.message })));
                    }}><Sparkles size={10} className="inline mr-0.5" /> Suggest</button>
                  </div>
                </div>
                {showAddDeadline && (
                  <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-border3)", borderRadius: 7, padding: 14, marginBottom: 8, marginTop: 8 }}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>Title</label>
                      <input value={dlForm.title} onChange={e => setDlForm(p => ({ ...p, title: e.target.value }))} placeholder="Deadline title" />
                    </div>
                    <div className="form-row" style={{ marginBottom: 10 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Date</label>
                        <input type="date" value={dlForm.date} onChange={e => setDlForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Type</label>
                        <select value={dlForm.type} onChange={e => setDlForm(p => ({ ...p, type: e.target.value }))}>
                          {PI_DEADLINE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { setShowAddDeadline(false); setDlForm({ title: "", date: "", type: "Filing" }); }}>Cancel</button>
                      <button className="btn btn-gold btn-sm" style={{ fontSize: 11 }} disabled={!dlForm.title.trim() || !dlForm.date} onClick={() => {
                        onAddDeadline({ caseId: c.id, title: dlForm.title.trim(), date: dlForm.date, type: dlForm.type });
                        setDlForm({ title: "", date: "", type: "Filing" });
                        setShowAddDeadline(false);
                      }}>Add Deadline</button>
                    </div>
                  </div>
                )}
                {deadlines.length === 0 && !aiDeadlines.show && !showAddDeadline && <div style={{ fontSize: 12, color: "#64748b" }}>None on record.</div>}
                {[...deadlines].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(d => {
                  const days = daysUntil(d.date); const col = urgencyColor(days);
                  const canDel = ["Case Manager", "Paralegal", "Attorney", "App Admin"].some(r => (currentUser.roles || [currentUser.role]).includes(r));
                  const isEditingTitle = editingCaseDlId === d.id;
                  return (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--c-border2)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditingTitle ? (
                          <input autoFocus value={editingCaseDlTitle} onChange={e => setEditingCaseDlTitle(e.target.value)}
                            onBlur={() => { if (editingCaseDlTitle.trim() && editingCaseDlTitle !== d.title) onUpdateDeadline(d.id, { title: editingCaseDlTitle.trim() }); setEditingCaseDlId(null); }}
                            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditingCaseDlId(null); }}
                            style={{ fontSize: 13, padding: "1px 4px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", width: "100%", boxSizing: "border-box" }} />
                        ) : (
                          <div style={{ fontSize: 13, color: "var(--c-text)", cursor: "pointer" }} onClick={() => { setEditingCaseDlId(d.id); setEditingCaseDlTitle(d.title); }} title="Click to edit title">{d.title}</div>
                        )}
                        <select value={d.type || "Filing"} onChange={e => onUpdateDeadline(d.id, { type: e.target.value })}
                          style={{ fontSize: 10, padding: "0 2px", borderRadius: 3, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "#64748b", cursor: "pointer", marginTop: 2, maxWidth: 150 }}>
                          {[...new Set([...PI_DEADLINE_TYPES, d.type].filter(Boolean))].sort().map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ fontSize: 12, color: col, whiteSpace: "nowrap", textAlign: "right" }}>
                        <div>{fmt(d.date)}</div>
                        {days !== null && <div style={{ fontSize: 10 }}>{days < 0 ? `${Math.abs(days)}d over` : `${days}d`}</div>}
                      </div>
                      {canDel && <button onClick={async () => { if (!(await confirmDelete())) return; onDeleteDeadline(d.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#e05252", fontSize: 12, padding: "2px 4px", flexShrink: 0 }} title="Remove deadline">✕</button>}
                    </div>
                  );
                })}
                {aiDeadlines.show && (
                  <div style={{ marginTop: 8 }}>
                    {aiDeadlines.loading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: "#64748b", fontSize: 11 }}>
                        <div style={{ width: 14, height: 14, border: "2px solid #d4c9a8", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Generating deadlines...
                      </div>
                    )}
                    {aiDeadlines.error && <div style={{ fontSize: 11, color: "#dc2626", padding: "4px 0" }}>{aiDeadlines.error}</div>}
                    {aiDeadlines.deadlines && aiDeadlines.deadlines.map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px dashed #d4c9a8", fontSize: 11 }}>
                        <Sparkles size={10} className="text-amber-600" />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#0f172a", fontWeight: 500 }}>{d.title}</div>
                          <div style={{ color: "#64748b", fontSize: 10 }}>{d.date} · {d.rule || d.type || ""}</div>
                        </div>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 9, padding: "1px 6px" }} onClick={() => {
                          onAddDeadline({ caseId: c.id, title: d.title, date: d.date, type: d.type || "Filing", rule: d.rule || "" });
                          setAiDeadlines(p => ({ ...p, deadlines: p.deadlines.filter((_, j) => j !== i) }));
                        }}>+ Add</button>
                      </div>
                    ))}
                    {aiDeadlines.deadlines && aiDeadlines.deadlines.length === 0 && <div style={{ fontSize: 11, color: "#64748b", padding: "4px 0" }}>No additional deadlines suggested.</div>}
                    {(aiDeadlines.deadlines || aiDeadlines.error) && (
                      <button style={{ fontSize: 10, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 4 }} onClick={() => setAiDeadlines({ loading: false, deadlines: null, error: null, show: false })}>Dismiss</button>
                    )}
                  </div>
                )}
                </>
                )}
              </div>

              <div className="case-overlay-section" style={{ overflow: "hidden", borderRight: "1px solid var(--c-border2)", paddingLeft: 16, paddingRight: collapsedCols.tasks ? 0 : 16, transition: "padding 0.3s ease" }}>
                {collapsedCols.tasks ? (
                  <div className="collapse-strip" onClick={() => toggleCol("tasks")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 4 }}>
                    <ChevronRight size={14} style={{ color: "var(--c-text3)" }} />
                    <span style={{ writingMode: "vertical-lr", fontSize: 12, fontWeight: 600, color: "var(--c-text2)", letterSpacing: "0.5px" }}>Tasks ({tasks.filter(t => t.status !== "Completed").length} open)</span>
                  </div>
                ) : (
                <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button className="col-collapse-btn" onClick={() => toggleCol("tasks")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}><ChevronDown size={14} style={{ color: "var(--c-text3)" }} /></button>
                    <div className="case-overlay-section-title">Tasks ({tasks.filter(t => t.status !== "Completed").length} open)</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { setShowAddTask(s => !s); if (showAddTask) setTkForm({ title: "", priority: "Medium", due: "" }); }}>
                      {showAddTask ? "Cancel" : "+ Add Task"}
                    </button>
                    <button className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer" disabled={aiTasks.loading} onClick={() => {
                      setAiTasks({ loading: true, tasks: null, error: null, show: true, added: {} });
                      apiTaskSuggestions({ caseId: c.id })
                        .then(r => setAiTasks(p => ({ ...p, loading: false, tasks: r.tasks })))
                        .catch(e => setAiTasks(p => ({ ...p, loading: false, error: e.message })));
                    }}><Sparkles size={10} className="inline mr-0.5" /> Suggest Tasks</button>
                  </div>
                </div>
                {showAddTask && (
                  <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-border3)", borderRadius: 7, padding: 14, marginBottom: 8, marginTop: 8 }}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>Title</label>
                      <input value={tkForm.title} onChange={e => setTkForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
                    </div>
                    <div className="form-row" style={{ marginBottom: 10 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Priority</label>
                        <select value={tkForm.priority} onChange={e => setTkForm(p => ({ ...p, priority: e.target.value }))}>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Due Date</label>
                        <input type="date" value={tkForm.due} onChange={e => setTkForm(p => ({ ...p, due: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { setShowAddTask(false); setTkForm({ title: "", priority: "Medium", due: "" }); }}>Cancel</button>
                      <button className="btn btn-gold btn-sm" style={{ fontSize: 11 }} disabled={!tkForm.title.trim()} onClick={async () => {
                        try {
                          const saved = await apiCreateTask({ caseId: c.id, title: tkForm.title.trim(), priority: tkForm.priority, due: tkForm.due || null, assigned: currentUser.id, status: "Not Started" });
                          if (onAddTask) onAddTask(saved);
                          setTkForm({ title: "", priority: "Medium", due: "" });
                          setShowAddTask(false);
                        } catch (err) { alert("Failed to add task: " + err.message); }
                      }}>Add Task</button>
                    </div>
                  </div>
                )}
                {tasks.length === 0 && !aiTasks.show && !showAddTask && <div style={{ fontSize: 12, color: "#64748b" }}>No tasks yet.</div>}
                {tasks.filter(t => t.status !== "Completed").sort((a, b) => {
                  const da = a.due ? new Date(a.due) : new Date("9999-12-31");
                  const db = b.due ? new Date(b.due) : new Date("9999-12-31");
                  return da - db;
                }).map(t => {
                  const days = daysUntil(t.due);
                  const assignee = getUserById(t.assigned);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--c-border2)" }}>
                      <div className="checkbox" style={{ marginTop: 2 }} onClick={() => handleComplete(t.id)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--c-text)", lineHeight: 1.3 }}>
                          {t.title}
                          {t.recurring && <span className="rec-badge">🔁</span>}
                          {t.isChained && <span className="chain-badge">⛓</span>}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                          <Badge label={getEffectivePriority(t)} />
                          <span style={{ fontSize: 10, color: days < 0 ? "#e05252" : "#64748b" }}>
                            {fmt(t.due)}{days < 0 ? ` (${Math.abs(days)}d over)` : ""}
                          </span>
                          {assignee && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Avatar userId={assignee.id} size={16} />
                              <span style={{ fontSize: 10, color: "#64748b" }}>{assignee.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tasks.filter(t => t.status === "Completed").length > 0 && (
                  <>
                    <div
                      onClick={() => setShowCompletedOverlay(!showCompletedOverlay)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", cursor: "pointer", borderBottom: "1px solid var(--c-border2)" }}
                    >
                      <span style={{ fontSize: 12, color: "#64748b" }}>{showCompletedOverlay ? "▼" : "▶"}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text2)" }}>Completed</span>
                      <Badge label={`${tasks.filter(t => t.status === "Completed").length}`} />
                    </div>
                    {showCompletedOverlay && tasks.filter(t => t.status === "Completed").sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)).map(t => {
                      const assignee = getUserById(t.assigned);
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--c-border2)", opacity: 0.45 }}>
                          <div className="checkbox done" style={{ marginTop: 2 }} onClick={() => handleComplete(t.id)}>✓</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: "var(--c-text)", textDecoration: "line-through", lineHeight: 1.3 }}>
                              {t.title}
                              {t.recurring && <span className="rec-badge">🔁</span>}
                              {t.isChained && <span className="chain-badge">⛓</span>}
                            </div>
                            <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                              <Badge label={getEffectivePriority(t)} />
                              <span style={{ fontSize: 10, color: "#64748b" }}>
                                {fmt(t.due)}
                              </span>
                              {assignee && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <Avatar userId={assignee.id} size={16} />
                                  <span style={{ fontSize: 10, color: "#64748b" }}>{assignee.name}</span>
                                </span>
                              )}
                              {t.completedAt && <span style={{ fontSize: 10, color: "#2F7A5F" }}>completed {fmt(t.completedAt)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {aiTasks.show && (
                  <div style={{ marginTop: 8, borderTop: "1px dashed #d4c9a8", paddingTop: 8 }}>
                    {aiTasks.loading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: "#64748b", fontSize: 11 }}>
                        <div style={{ width: 14, height: 14, border: "2px solid #d4c9a8", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Analyzing case for task suggestions...
                      </div>
                    )}
                    {aiTasks.error && <div style={{ fontSize: 11, color: "#dc2626", padding: "4px 0" }}>{aiTasks.error}</div>}
                    {aiTasks.tasks && aiTasks.tasks.length > 0 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Sparkles size={11} className="text-amber-500" /> Suggested Tasks ({aiTasks.tasks.length})</div>
                          {aiTasks.tasks.some((_, i) => !aiTasks.added[i]) && (
                            <button className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[9px] font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer" onClick={async () => {
                              const toAdd = aiTasks.tasks.filter((_, i) => !aiTasks.added[i]);
                              const newAdded = { ...aiTasks.added };
                              for (let i = 0; i < aiTasks.tasks.length; i++) {
                                if (!aiTasks.added[i]) {
                                  const s = aiTasks.tasks[i];
                                  const dueDate = s.dueInDays ? new Date(Date.now() + s.dueInDays * 86400000).toISOString().split("T")[0] : null;
                                  try {
                                    const saved = await apiCreateTask({ caseId: c.id, title: s.title, priority: s.priority || "Medium", assignedRole: s.assignedRole || "", due: dueDate, notes: s.rationale || "", isGenerated: true });
                                    if (onAddTask) onAddTask(saved);
                                    newAdded[i] = true;
                                  } catch (err) { console.error(err); }
                                }
                              }
                              setAiTasks(p => ({ ...p, added: newAdded }));
                              log("AI Tasks Added", `${toAdd.length} suggested tasks added`);
                            }}>+ Add All</button>
                          )}
                        </div>
                        {aiTasks.tasks.map((s, i) => {
                          const isAdded = aiTasks.added[i];
                          const priorityColors = { Urgent: "#e05252", High: "#e88c30", Medium: "#d97706", Low: "#2F7A5F" };
                          const priorityDarkBg = { Urgent: "#fca5a5", High: "#fdba74", Medium: "#93c5fd", Low: "#cbd5e1" };
                          const dk = isDarkMode();
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "1px dashed #d4c9a8", opacity: isAdded ? 0.45 : 1 }}>
                              <span className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{isAdded ? "✓" : ""}{!isAdded && <Sparkles size={10} className="text-amber-500" />}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, color: dk ? "var(--c-text)" : "#0f172a", fontWeight: 500 }}>{s.title}</div>
                                <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                                  <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: dk ? (priorityDarkBg[s.priority] || "#cbd5e1") : (priorityColors[s.priority] || "#d97706") + "18", color: dk ? "#1a1a1a" : (priorityColors[s.priority] || "#d97706") }}>{s.priority}</span>
                                  {s.assignedRole && <span style={{ fontSize: 9, color: "#64748b" }}>{s.assignedRole}</span>}
                                  {s.dueInDays && <span style={{ fontSize: 9, color: "#64748b" }}>· {s.dueInDays}d</span>}
                                </div>
                                {s.rationale && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, lineHeight: 1.3 }}>{s.rationale}</div>}
                              </div>
                              {!isAdded && (
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 9, padding: "1px 6px", flexShrink: 0 }} onClick={async () => {
                                  const dueDate = s.dueInDays ? new Date(Date.now() + s.dueInDays * 86400000).toISOString().split("T")[0] : null;
                                  try {
                                    const saved = await apiCreateTask({ caseId: c.id, title: s.title, priority: s.priority || "Medium", assignedRole: s.assignedRole || "", due: dueDate, notes: s.rationale || "", isGenerated: true });
                                    if (onAddTask) onAddTask(saved);
                                    setAiTasks(p => ({ ...p, added: { ...p.added, [i]: true } }));
                                    log("AI Task Added", s.title);
                                  } catch (err) { alert("Failed to add task: " + err.message); }
                                }}>+ Add</button>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                    {aiTasks.tasks && aiTasks.tasks.length === 0 && <div style={{ fontSize: 11, color: "#64748b", padding: "4px 0" }}>No additional tasks suggested.</div>}
                    {(aiTasks.tasks || aiTasks.error) && (
                      <button style={{ fontSize: 10, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 4 }} onClick={() => setAiTasks({ loading: false, tasks: null, error: null, show: false, added: {} })}>Dismiss</button>
                    )}
                  </div>
                )}
                </>
                )}
              </div>

              <div className="case-overlay-section" style={{ overflow: "hidden", paddingLeft: 16, transition: "padding 0.3s ease" }}>
                {collapsedCols.notes ? (
                  <div className="collapse-strip" onClick={() => toggleCol("notes")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 4 }}>
                    <ChevronRight size={14} style={{ color: "var(--c-text3)" }} />
                    <span style={{ writingMode: "vertical-lr", fontSize: 12, fontWeight: 600, color: "var(--c-text2)", letterSpacing: "0.5px" }}>Notes ({notes.length})</span>
                  </div>
                ) : (
                <>
                  <CaseNotes caseId={c.id} notes={notes} currentUser={currentUser} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onUpdateNote={handleUpdateNote} caseRecord={c} confirmDelete={confirmDelete} collapseToggle={<button className="col-collapse-btn" onClick={() => toggleCol("notes")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}><ChevronDown size={14} style={{ color: "var(--c-text3)" }} /></button>} />
                </>
                )}
              </div>
            </div>

            {/* File Links */}
            <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 8, paddingTop: 28 }}>
              <CaseFileLinks
                caseId={c.id}
                links={links}
                currentUser={currentUser}
                onAddLink={handleAddLink}
                confirmDelete={confirmDelete}
                onDeleteLink={handleDeleteLink}
              />
            </div>
          </div>
        )}

        {/* ── Details Tab ── */}
        {activeTab === "details" && (
          <div className="case-overlay-body">

            {/* Two-column: Charges + Case Info */}
            <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 32 }}>

              {/* Left column: Injury & Incident Details */}
              <div className="case-overlay-section" style={{ display: "flex", flexDirection: "column" }}>
                <div className="case-overlay-section-title">Injury & Incident Details</div>
                {(() => {
                  const solDate = draft.statuteOfLimitationsDate ? new Date(draft.statuteOfLimitationsDate) : null;
                  const solDays = solDate ? Math.ceil((solDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  const solColor = solDays !== null ? (solDays <= 60 ? "#dc2626" : solDays <= 180 ? "#d97706" : "#16a34a") : "#64748b";
                  return (
                    <>
                      {!draft.inLitigation && solDays !== null && solDays <= 180 && (
                        <div style={{ background: solDays <= 60 ? "#fef2f2" : "#fffbeb", border: `1px solid ${solDays <= 60 ? "#fca5a5" : "#fcd34d"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{solDays <= 60 ? "⚠️" : "⏳"}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: solColor }}>SOL {solDays <= 0 ? "EXPIRED" : `in ${solDays} days`}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>Statute of Limitations: {solDate.toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                        <EditField fieldKey="accidentDate" label="Accident Date" type="date" value={draft.accidentDate} onChange={val => set("accidentDate", val)} onBlur={() => handleBlur("accidentDate")} readOnly={!editMode} />
                        <EditField fieldKey="injuryType" label="Injury Type" type="select" options={["Soft Tissue", "Fracture", "TBI", "Spinal Cord", "Burns", "Internal Injuries", "Amputation", "Scarring/Disfigurement", "Dental", "Multiple Injuries", "Wrongful Death", "Other"]} value={draft.injuryType} onChange={val => setAndLog("injuryType", val)} readOnly={!editMode} />
                        <EditField fieldKey="stateJurisdiction" label="State Jurisdiction" type="select" options={["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]} value={draft.stateJurisdiction} onChange={val => setAndLog("stateJurisdiction", val)} readOnly={!editMode} />
                        <EditField fieldKey="statuteOfLimitationsDate" label="SOL Date" type="date" value={draft.statuteOfLimitationsDate} onChange={val => set("statuteOfLimitationsDate", val)} onBlur={() => handleBlur("statuteOfLimitationsDate")} readOnly={!editMode} />
                        <EditField fieldKey="policeReportNumber" label="Police Report #" type="text" value={draft.policeReportNumber} onChange={val => set("policeReportNumber", val)} onBlur={() => handleBlur("policeReportNumber")} readOnly={!editMode} />
                        <EditField fieldKey="liabilityAssessment" label="Liability Assessment" type="select" options={["Clear Liability", "Comparative Fault", "Disputed Liability", "Shared Fault", "Pending Investigation", "Undetermined"]} value={draft.liabilityAssessment} onChange={val => setAndLog("liabilityAssessment", val)} readOnly={!editMode} />
                        <EditField fieldKey="comparativeFaultPct" label="Comparative Fault %" type="text" value={draft.comparativeFaultPct} onChange={val => set("comparativeFaultPct", val)} onBlur={() => handleBlur("comparativeFaultPct")} readOnly={!editMode} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginTop: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", marginBottom: 2 }}>Contingency Fee</label>
                          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                            <input type="number" step="any" placeholder={draft.feeIsFlat ? "0.00" : "33.33"} style={{ flex: 1, fontSize: 13, padding: "6px 10px", borderRadius: "6px 0 0 6px", border: "1px solid var(--c-border)", borderRight: "none", background: editMode ? "var(--c-bg)" : "transparent", color: "var(--c-text)", boxSizing: "border-box", minWidth: 60 }}
                              value={draft.contingencyFeePct || ""} onChange={e => set("contingencyFeePct", e.target.value)} onBlur={() => handleBlur("contingencyFeePct")} readOnly={!editMode} />
                            <select style={{ fontSize: 12, padding: "6px 6px", borderRadius: "0 6px 6px 0", border: "1px solid var(--c-border)", background: editMode ? "var(--c-surface, var(--c-bg))" : "transparent", color: "var(--c-text)", cursor: editMode ? "pointer" : "default", fontWeight: 600, width: 42, flexShrink: 0 }}
                              value={draft.feeIsFlat ? "$" : "%"} onChange={e => { set("feeIsFlat", e.target.value === "$"); setAndLog("feeIsFlat", e.target.value === "$"); }} disabled={!editMode}>
                              <option value="%">%</option>
                              <option value="$">$</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <EditField fieldKey="injuryDescription" label="Injury Description" type="text" value={draft.injuryDescription} onChange={val => set("injuryDescription", val)} onBlur={() => handleBlur("injuryDescription")} readOnly={!editMode} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", marginTop: 12 }}>
                        <EditField fieldKey="demandAmount" label="Demand Amount" type="text" value={draft.demandAmount} onChange={val => set("demandAmount", val)} onBlur={() => handleBlur("demandAmount")} readOnly={!editMode} />
                        <EditField fieldKey="settlementAmount" label="Settlement Amount" type="text" value={draft.settlementAmount} onChange={val => set("settlementAmount", val)} onBlur={() => handleBlur("settlementAmount")} readOnly={!editMode} />
                        <EditField fieldKey="caseValueEstimate" label="Case Value Estimate" type="text" value={draft.caseValueEstimate} onChange={val => set("caseValueEstimate", val)} onBlur={() => handleBlur("caseValueEstimate")} readOnly={!editMode} />
                      </div>
                    </>
                  );
                })()}
              </div>


              {/* Right column: Case Info + Offices */}
              <div className="case-overlay-section" style={{ display: "flex", flexDirection: "column" }}>
                <div className="case-overlay-section-title">Case Info</div>
                {infoFields.filter(f => !hiddenFields.includes(f.key)).map(f => (
                  <EditField
                    key={f.key}
                    fieldKey={f.key}
                    label={f.label}
                    type={f.type}
                    options={f.options}
                    value={draft[f.key]}
                    onChange={val => f.type === "select" || f.type === "user" ? setAndLog(f.key, val) : set(f.key, val)}
                    onBlur={() => (f.type === "text") && handleBlur(f.key)}
                    canRemove={editMode && canRemove}
                    onRemove={() => setHiddenFields(p => [...p, f.key])}
                    readOnly={!editMode}
                    onContactClick={!editMode && CONTACT_LINKABLE_KEYS.has(f.key) ? handleContactClick : undefined}
                  />
                ))}

              </div>

            </div>


            <div style={{ borderTop: "1px solid var(--c-border)", margin: "8px 0 32px" }} />

            <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 32 }}>

              {/* Experts */}
              <div className="case-overlay-section" style={{ display: "flex", flexDirection: "column" }}>
              <div className="case-overlay-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Experts ({experts.length})</span>
                <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={() => setAddingExpert(true)}>+ Add Expert</button>
              </div>

              {addingExpert && (
                <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 12 }}>New Expert</div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Expert Type</label>
                    <select value={newExpertType} onChange={e => setNewExpertType(e.target.value)} style={{ width: "100%", fontSize: 13, padding: "6px 8px" }}>
                      {["Treating Physician", "Retained", "Rebuttal"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setAddingExpert(false); setNewExpertType("Treating Physician"); }}>Cancel</button>
                    <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A" }} onClick={async () => {
                      try {
                        const saved = await apiCreateExpert({ caseId: c.id, expertType: newExpertType, data: {} });
                        setExperts(p => [...p, saved]);
                        setAddingExpert(false);
                        setExpandedExpert(saved.id);
                        log("Expert Added", `Added ${newExpertType} expert`);
                        setNewExpertType("Treating Physician");
                      } catch (err) { alert("Failed to add expert: " + err.message); }
                    }}>Add</button>
                  </div>
                </div>
              )}

              {expertsLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "12px 0" }}>Loading experts...</div>}

              {!expertsLoading && experts.length === 0 && !addingExpert && (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "12px 0" }}>No experts added yet.</div>
              )}

              {!expertsLoading && experts.map(exp => {
                const isExp = expandedExpert === exp.id;
                const d = exp.data || {};
                const displayName = d.fullName || "Unnamed Expert";
                const EXPERT_TYPE_COLORS = {
                  "Treating Physician": { bg: "#E6F5ED", text: "#2F6A3A" },
                  "Retained": { bg: "#E8F0FD", text: "#1A5FA0" },
                  "Rebuttal": { bg: "#FDF0E6", text: "#8A5A1E" },
                };
                const typeColor = EXPERT_TYPE_COLORS[exp.expertType] || { bg: "#EDEFF2", text: "#5D6268" };

                const updateField = (field, value) => {
                  const newData = { ...(expertPendingData.current[exp.id] || d), [field]: value };
                  expertPendingData.current[exp.id] = newData;
                  setExperts(p => p.map(x => x.id === exp.id ? { ...x, data: newData } : x));
                  const timerKey = `${exp.id}`;
                  if (expertTimers.current[timerKey]) clearTimeout(expertTimers.current[timerKey]);
                  expertTimers.current[timerKey] = setTimeout(async () => {
                    const dataToSave = expertPendingData.current[exp.id];
                    delete expertPendingData.current[exp.id];
                    try { await apiUpdateExpert(exp.id, { data: dataToSave }); } catch (err) { console.error(err); }
                  }, 600);
                };

                const handleNameBlur = async () => {
                  const name = (d.fullName || "").trim();
                  if (!name || d.contactId) return;
                  const match = allContacts.find(ct => ct.category === "Expert" && ct.name.toLowerCase() === name.toLowerCase() && !ct.deletedAt);
                  if (match) {
                    updateField("contactId", match.id);
                    updateField("phone", match.phone || d.phone || "");
                    updateField("email", match.email || d.email || "");
                    updateField("fax", match.fax || d.fax || "");
                    updateField("address", match.address || d.address || "");
                    updateField("company", match.company || d.company || "");
                  } else if (name) {
                    try {
                      const created = await apiCreateContact({ name, category: "Expert", phone: d.phone || "", email: d.email || "", fax: d.fax || "", address: d.address || "", company: d.company || "" });
                      updateField("contactId", created.id);
                      setAllContacts(prev => [...prev, created]);
                    } catch (err) { console.error("Failed to create expert contact:", err); }
                  }
                };

                const syncContactFromExpert = async (field, value) => {
                  updateField(field, value);
                  if (d.contactId) {
                    const contactField = field;
                    try {
                      await apiUpdateContact(d.contactId, { [contactField]: value });
                      setAllContacts(prev => prev.map(ct => ct.id === d.contactId ? { ...ct, [contactField]: value } : ct));
                    } catch (err) { console.error(err); }
                  }
                };

                const inputStyle = { width: "100%", fontSize: 13, padding: "5px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" };
                const labelStyle = { fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 };
                const fieldGroup = { marginBottom: 10 };

                const clientName = draft.clientName || "Client";
                const partyOptions = [
                  { value: `Client: ${clientName}`, label: `Client: ${clientName}` },
                  ...parties.map(p => {
                    const pd = p.data || {};
                    const pName = p.entityKind === "corporation" ? (pd.entityName || "Unnamed Entity") : [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Unnamed Party";
                    const pType = (p.partyType === "At-Fault Party") ? "Defendant" : p.partyType;
                    return { value: `${pType}: ${pName}`, label: `${pType}: ${pName}` };
                  })
                ];

                return (
                  <div key={exp.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                    <div
                      onClick={() => setExpandedExpert(isExp ? null : exp.id)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: isExp ? "var(--c-bg2)" : "transparent" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14 }}>🩺</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{displayName}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: typeColor.bg, color: "#1e293b", letterSpacing: "0.02em" }}>{exp.expertType}</span>
                            {d.company && <span style={{ fontSize: 11, color: "#64748b" }}>· {d.company}</span>}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{isExp ? "▲" : "▼"}</span>
                    </div>

                    {isExp && (
                      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--c-border)" }}>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Full Name</label>
                          <input
                            style={{ ...inputStyle, fontWeight: 600 }}
                            value={d.fullName || ""}
                            placeholder="Enter expert's full name"
                            onChange={e => { updateField("fullName", e.target.value); if (d.contactId) updateField("contactId", null); }}
                            onBlur={handleNameBlur}
                          />
                          {d.contactId && <div style={{ fontSize: 10, color: "#2F7A5F", marginTop: 2 }}>Linked to contact card</div>}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Company / Practice</label>
                            <input style={inputStyle} value={d.company || ""} placeholder="Company or practice name" onChange={e => syncContactFromExpert("company", e.target.value)} />
                          </div>
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Specialty / Area of Expertise</label>
                            <input style={inputStyle} value={d.specialty || ""} placeholder="e.g., Orthopedic Surgery" onChange={e => updateField("specialty", e.target.value)} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={d.phone || ""} onChange={e => syncContactFromExpert("phone", e.target.value)} /></div>
                          <div><label style={labelStyle}>Fax</label><input style={inputStyle} value={d.fax || ""} onChange={e => syncContactFromExpert("fax", e.target.value)} /></div>
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Email</label>
                          <input style={inputStyle} value={d.email || ""} onChange={e => syncContactFromExpert("email", e.target.value)} />
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Address</label>
                          <input style={inputStyle} value={d.address || ""} onChange={e => syncContactFromExpert("address", e.target.value)} />
                        </div>

                        <div style={{ borderTop: "1px solid var(--c-border)", margin: "10px 0", paddingTop: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}>
                              <label style={labelStyle}>Assigned Party</label>
                              <select style={inputStyle} value={d.assignedParty || ""} onChange={e => updateField("assignedParty", e.target.value)}>
                                <option value="">— None —</option>
                                {partyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>
                            <div style={fieldGroup}>
                              <label style={labelStyle}>Testimony</label>
                              <select style={inputStyle} value={d.testimony || ""} onChange={e => updateField("testimony", e.target.value)}>
                                <option value="">— Select —</option>
                                <option value="Deposition">Deposition</option>
                                <option value="Live Testimony">Live Testimony</option>
                                <option value="Both">Both</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>Rate</label><input style={inputStyle} value={d.rate || ""} placeholder="Hourly/deposition/trial rates" onChange={e => updateField("rate", e.target.value)} /></div>
                            <div style={fieldGroup}>
                              <label style={labelStyle}>CV / Resume Link</label>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <input style={{ ...inputStyle, flex: 1 }} value={d.cvLink || ""} placeholder="https://..." onChange={e => updateField("cvLink", e.target.value)} />
                                {d.cvLink && <a href={d.cvLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--c-accent)", whiteSpace: "nowrap" }}>Open</a>}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>Retained Date</label><input type="date" style={inputStyle} value={d.retainedDate || ""} onChange={e => updateField("retainedDate", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Report Date</label><input type="date" style={inputStyle} value={d.reportDate || ""} onChange={e => updateField("reportDate", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Deposition Date</label><input type="date" style={inputStyle} value={d.depositionDate || ""} onChange={e => updateField("depositionDate", e.target.value)} /></div>
                          </div>
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Notes</label>
                            <textarea
                              style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                              value={d.notes || ""}
                              placeholder="Notes about this expert..."
                              onChange={e => updateField("notes", e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 11, color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                            if (!await confirmDelete()) return;
                            try {
                              await apiDeleteExpert(exp.id);
                              setExperts(p => p.filter(x => x.id !== exp.id));
                              setExpandedExpert(null);
                              log("Expert Removed", `Removed ${exp.expertType}: ${displayName}`);
                            } catch (err) { alert("Failed: " + err.message); }
                          }}>Remove Expert</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>


              {/* Defendants Section */}
              <div style={{ marginTop: 32, borderTop: "2px solid var(--c-border)", paddingTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  {(() => { const defs = parties.filter(p => (p.party_type || p.partyType) === "At-Fault Party" || (p.party_type || p.partyType) === "Defendant"); return <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>Defendants ({defs.length})</div>; })()}
                  <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={() => { setAddingParty(true); setNewCoDefFirst(""); setNewCoDefMiddle(""); setNewCoDefLast(""); }}>+ Add Defendant</button>
                </div>

                {addingParty && (
                  <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 12 }}>New Defendant</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>First Name</label>
                        <input type="text" placeholder="First name" value={newCoDefFirst} onChange={e => setNewCoDefFirst(e.target.value)} style={{ width: "100%", fontSize: 13, padding: "6px 8px" }} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Middle Name</label>
                        <input type="text" placeholder="Middle" value={newCoDefMiddle} onChange={e => setNewCoDefMiddle(e.target.value)} style={{ width: "100%", fontSize: 13, padding: "6px 8px" }} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Last Name</label>
                        <input type="text" placeholder="Last name" value={newCoDefLast} onChange={e => setNewCoDefLast(e.target.value)} style={{ width: "100%", fontSize: 13, padding: "6px 8px" }} /></div>
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setAddingParty(false); setNewCoDefFirst(""); setNewCoDefMiddle(""); setNewCoDefLast(""); }}>Cancel</button>
                      <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A" }} onClick={async () => {
                        const fullName = [newCoDefFirst, newCoDefMiddle, newCoDefLast].filter(Boolean).join(" ") || "Unnamed";
                        try {
                          const saved = await apiCreateParty({ caseId: c.id, partyType: "Defendant", entityKind: "individual", data: { firstName: newCoDefFirst, middleName: newCoDefMiddle, lastName: newCoDefLast } });
                          setParties(p => [...p, saved]);
                          setAddingParty(false);
                          setNewCoDefFirst(""); setNewCoDefMiddle(""); setNewCoDefLast("");
                          setExpandedParty(saved.id);
                          log("Defendant Added", fullName);
                        } catch (err) { alert("Failed to add co-defendant: " + err.message); }
                      }}>Add</button>
                    </div>
                  </div>
                )}

                {partiesLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "12px 0" }}>Loading defendants...</div>}
                {!partiesLoading && parties.filter(p => ["At-Fault Party", "Defendant"].includes(p.party_type || p.partyType)).length === 0 && !addingParty && (
                  <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "12px 0" }}>No defendants added yet.</div>
                )}

                {!partiesLoading && parties.filter(p => ["At-Fault Party", "Defendant"].includes(p.party_type || p.partyType)).map(party => {
                  const isExp = expandedParty === party.id;
                  const d = party.data || {};
                  const displayName = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ") || "Unnamed Defendant";

                  const STATUS_COLORS = {
                    "Active": { bg: "#FDF0E6", text: "#8A5A1E" },
                    "Settled": { bg: "#EAF5EA", text: "#2F6A3A" },
                    "Dismissed": { bg: "#E8F4FD", text: "#1A6FA0" },
                    "Default Judgment": { bg: "#FDECEA", text: "#9A3030" },
                    "Bankrupt": { bg: "#FFF3CD", text: "#856404" },
                  };
                  const statusColor = STATUS_COLORS[d.status] || { bg: "#EDEFF2", text: "#5D6268" };

                  const updateField = (field, value) => {
                    const newData = { ...(partyPendingData.current[party.id] || d), [field]: value };
                    partyPendingData.current[party.id] = newData;
                    setParties(p => p.map(x => x.id === party.id ? { ...x, data: newData } : x));
                    const timerKey = `${party.id}`;
                    if (partyTimers.current[timerKey]) clearTimeout(partyTimers.current[timerKey]);
                    partyTimers.current[timerKey] = setTimeout(async () => {
                      const dataToSave = partyPendingData.current[party.id];
                      delete partyPendingData.current[party.id];
                      try { await apiUpdateParty(party.id, { data: dataToSave }); } catch (err) { console.error(err); }
                    }, 600);
                  };

                  const inputStyle = { width: "100%", fontSize: 13, padding: "5px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" };
                  const labelStyle = { fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 };
                  const fieldGroup = { marginBottom: 10 };

                  return (
                    <div key={party.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                      <div
                        onClick={() => setExpandedParty(isExp ? null : party.id)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: isExp ? "var(--c-bg2)" : "transparent" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14 }}>👤</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{displayName}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              {d.status && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: statusColor.bg, color: "#1e293b", letterSpacing: "0.02em" }}>{d.status}</span>}
                              {d.liabilityPct && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: "#f1f5f9", color: "#475569" }}>{d.liabilityPct}% liable</span>}
                              {d.attorney && <span style={{ fontSize: 11, color: "#64748b" }}>· Atty: {d.attorney}</span>}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{isExp ? "▲" : "▼"}</span>
                      </div>

                      {isExp && (
                        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--c-border)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>First Name</label><input style={inputStyle} value={d.firstName || ""} onChange={e => updateField("firstName", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Middle Name</label><input style={inputStyle} value={d.middleName || ""} onChange={e => updateField("middleName", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Last Name</label><input style={inputStyle} value={d.lastName || ""} onChange={e => updateField("lastName", e.target.value)} /></div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>Attorney / Represented By</label><input style={inputStyle} value={d.attorney || ""} placeholder="Defense attorney name" onChange={e => updateField("attorney", e.target.value)} /></div>
                            <div style={fieldGroup}>
                              <label style={labelStyle}>Status</label>
                              <select style={inputStyle} value={d.status || ""} onChange={e => updateField("status", e.target.value)}>
                                <option value="">— Select —</option>
                                {["Active", "Settled", "Dismissed", "Default Judgment", "Bankrupt"].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>Insurance Carrier</label><input style={inputStyle} value={d.insuranceCarrier || ""} placeholder="Defendant's insurer" onChange={e => updateField("insuranceCarrier", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Policy Limits</label><input style={inputStyle} value={d.policyLimits || ""} placeholder="e.g. $100,000 / $300,000" onChange={e => updateField("policyLimits", e.target.value)} /></div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>Liability %</label><input type="number" min="0" max="100" style={inputStyle} value={d.liabilityPct || ""} placeholder="Estimated %" onChange={e => updateField("liabilityPct", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Relationship to Plaintiff</label><input style={inputStyle} value={d.relationship || ""} placeholder="e.g. Other driver, Property owner" onChange={e => updateField("relationship", e.target.value)} /></div>
                          </div>
                          <div style={fieldGroup}><label style={labelStyle}>Address</label><input style={inputStyle} value={d.address || ""} placeholder="Defendant's address" onChange={e => updateField("address", e.target.value)} /></div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={fieldGroup}><label style={labelStyle}>Phone</label><input style={inputStyle} value={d.phone || ""} placeholder="Phone number" onChange={e => updateField("phone", e.target.value)} /></div>
                            <div style={fieldGroup}><label style={labelStyle}>Email</label><input style={inputStyle} value={d.email || ""} placeholder="Email address" onChange={e => updateField("email", e.target.value)} /></div>
                          </div>
                          <div style={fieldGroup}><label style={labelStyle}>Notes</label>
                            <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical", fontFamily: "inherit" }} value={d.notes || ""} placeholder="General notes about this defendant..." onChange={e => updateField("notes", e.target.value)} />
                          </div>
                          <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                            <button className="btn btn-outline btn-sm" style={{ fontSize: 11, color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                              if (!await confirmDelete()) return;
                              try {
                                await apiDeleteParty(party.id);
                                setParties(p => p.filter(x => x.id !== party.id));
                                setExpandedParty(null);
                                log("Defendant Removed", displayName);
                              } catch (err) { alert("Failed: " + err.message); }
                            }}>Remove Defendant</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 600, color: "var(--c-text-h)" }}>Miscellaneous Contacts</div>
                  <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => setAddingMiscContact(true)}>+ Add</button>
                </div>

              {addingMiscContact && (
                <div style={{ border: "1px solid var(--c-border)", borderRadius: 8, padding: 12, marginBottom: 10, background: "var(--c-bg2)" }}>
                  <label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Contact Type</label>
                  <select style={{ width: "100%", fontSize: 13, padding: "5px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box", marginBottom: 10 }} value={newMiscContactType} onChange={e => setNewMiscContactType(e.target.value)}>
                    {["Police Officer","Witness","Consultant","Investigator","Process Server","Court Reporter","Guardian ad Litem","Mediator","Other"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setAddingMiscContact(false); setNewMiscContactType("Other"); }}>Cancel</button>
                    <button className="btn btn-gold btn-sm" onClick={async () => {
                      try {
                        const created = await apiCreateMiscContact({ caseId: c.id, contactType: newMiscContactType, data: {} });
                        setMiscContacts(p => [...p, created]);
                        setExpandedMiscContact(created.id);
                        setAddingMiscContact(false);
                        log("Misc Contact Added", `Added ${newMiscContactType} contact`);
                        setNewMiscContactType("Other");
                      } catch (err) { alert("Failed to add contact: " + err.message); }
                    }}>Add</button>
                  </div>
                </div>
              )}

              {miscContactsLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "12px 0" }}>Loading contacts...</div>}

              {!miscContactsLoading && miscContacts.length === 0 && !addingMiscContact && (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "12px 0" }}>No miscellaneous contacts added yet.</div>
              )}

              {!miscContactsLoading && miscContacts.map(mc => {
                const isExp = expandedMiscContact === mc.id;
                const d = mc.data || {};
                const displayName = d.name || "Unnamed Contact";
                const MISC_TYPE_COLORS = {
                  "Police Officer": { bg: "#E0ECFF", text: "#1A4D8F" },
                  "Witness": { bg: "#FFF3E0", text: "#8A5A1E" },
                  "Consultant": { bg: "#E6F5ED", text: "#2F6A3A" },
                  "Investigator": { bg: "#F3E8FF", text: "#6B21A8" },
                  "Process Server": { bg: "#E8F0FD", text: "#1A5FA0" },
                  "Court Reporter": { bg: "#FDE8E8", text: "#9B2C2C" },
                  "Guardian ad Litem": { bg: "#E0F7FA", text: "#00695C" },
                  "Mediator": { bg: "#FFF8E1", text: "#F57F17" },
                };
                const typeColor = MISC_TYPE_COLORS[mc.contactType] || { bg: "#EDEFF2", text: "#5D6268" };

                const updateField = (field, value) => {
                  const newData = { ...(miscContactPendingData.current[mc.id] || d), [field]: value };
                  miscContactPendingData.current[mc.id] = newData;
                  setMiscContacts(p => p.map(x => x.id === mc.id ? { ...x, data: newData } : x));
                  const timerKey = `${mc.id}`;
                  if (miscContactTimers.current[timerKey]) clearTimeout(miscContactTimers.current[timerKey]);
                  miscContactTimers.current[timerKey] = setTimeout(async () => {
                    const dataToSave = miscContactPendingData.current[mc.id];
                    delete miscContactPendingData.current[mc.id];
                    try { await apiUpdateMiscContact(mc.id, { data: dataToSave }); } catch (err) { console.error(err); }
                  }, 600);
                };

                const handleMiscNameBlur = async () => {
                  const name = (miscContactPendingData.current[mc.id]?.name || d.name || "").trim();
                  if (!name) return;
                  const existing = allContacts.find(c => c.category === "Miscellaneous" && c.name.toLowerCase() === name.toLowerCase());
                  if (existing) {
                    updateField("contactId", existing.id);
                  } else {
                    try {
                      const created = await apiCreateContact({ name, category: "Miscellaneous", phone: d.phone || "", email: d.email || "", address: d.address || "", company: d.company || "" });
                      setAllContacts(p => [...p, created]);
                      updateField("contactId", created.id);
                    } catch (err) { console.error("Failed to create misc contact card:", err); }
                  }
                };

                const syncMiscContactCard = async (field, value) => {
                  updateField(field, value);
                  const cId = miscContactPendingData.current[mc.id]?.contactId || d.contactId;
                  if (cId) {
                    const contact = allContacts.find(c => c.id === cId);
                    if (contact) {
                      const updated = { ...contact, [field]: value };
                      setAllContacts(p => p.map(c => c.id === cId ? updated : c));
                      try { await apiUpdateContact(cId, updated); } catch {}
                    }
                  }
                };

                const inputStyle = { width: "100%", fontSize: 13, padding: "5px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" };
                const labelStyle = { fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 };
                const fieldGroup = { marginBottom: 10 };

                const assocOptions = [];
                parties.forEach(p => {
                  const pd = p.data || {};
                  const pName = p.entityKind === "corporation" ? (pd.entityName || "Unnamed Entity") : [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Unnamed Party";
                  assocOptions.push({ type: "party", id: p.id, label: `Party: ${pName} (${p.partyType})`, name: pName });
                });
                experts.forEach(ex => {
                  const eName = ex.data?.fullName || "Unnamed Expert";
                  assocOptions.push({ type: "expert", id: ex.id, label: `Expert: ${eName} (${ex.expertType})`, name: eName });
                });
                miscContacts.filter(x => x.id !== mc.id).forEach(x => {
                  const xName = x.data?.name || "Unnamed Contact";
                  assocOptions.push({ type: "misc", id: x.id, label: `Contact: ${xName} (${x.contactType})`, name: xName });
                });

                const assocValue = d.associatedWith ? `${d.associatedWith.type}:${d.associatedWith.id}` : "";
                const assocMatch = d.associatedWith ? assocOptions.find(o => o.type === d.associatedWith.type && o.id === d.associatedWith.id) : null;
                const assocDisplay = assocMatch ? assocMatch.label : (d.associatedWith ? `${d.associatedWith.type}: ${d.associatedWith.name}` : "");

                return (
                  <div key={mc.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                    <div
                      onClick={() => setExpandedMiscContact(isExp ? null : mc.id)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: isExp ? "var(--c-bg2)" : "transparent" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14 }}>📋</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{displayName}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: typeColor.bg, color: "#1e293b", letterSpacing: "0.02em" }}>{mc.contactType}</span>
                            {d.company && <span style={{ fontSize: 11, color: "#64748b" }}>· {d.company}</span>}
                            {assocDisplay && <span style={{ fontSize: 11, color: "#4F7393" }}>· {assocDisplay}</span>}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{isExp ? "▲" : "▼"}</span>
                    </div>

                    {isExp && (
                      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--c-border)" }}>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Name</label>
                          <input style={{ ...inputStyle, fontWeight: 600 }} value={d.name || ""} placeholder="Full name" onChange={e => updateField("name", e.target.value)} onBlur={handleMiscNameBlur} />
                          {d.contactId && <div style={{ fontSize: 10, color: "#2F7A5F", marginTop: 2 }}>Linked to contact card</div>}
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>{mc.contactType === "Police Officer" ? "Department" : "Company / Agency"}</label>
                          <input style={inputStyle} value={d.company || ""} placeholder={mc.contactType === "Police Officer" ? "Police department" : "Company or agency"} onChange={e => syncMiscContactCard("company", e.target.value)} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={d.phone || ""} onChange={e => syncMiscContactCard("phone", e.target.value)} /></div>
                          <div><label style={labelStyle}>Email</label><input style={inputStyle} value={d.email || ""} onChange={e => syncMiscContactCard("email", e.target.value)} /></div>
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Address</label>
                          <input style={inputStyle} value={d.address || ""} onChange={e => syncMiscContactCard("address", e.target.value)} />
                        </div>

                        {mc.contactType === "Police Officer" && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div><label style={labelStyle}>Badge / ID #</label><input style={inputStyle} value={d.badgeNumber || ""} onChange={e => updateField("badgeNumber", e.target.value)} /></div>
                            <div><label style={labelStyle}>Report #</label><input style={inputStyle} value={d.reportNumber || ""} onChange={e => updateField("reportNumber", e.target.value)} /></div>
                          </div>
                        )}
                        {mc.contactType === "Witness" && (
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Relationship to Case</label>
                            <input style={inputStyle} value={d.relationship || ""} placeholder="e.g., Eyewitness, Bystander, Co-worker" onChange={e => updateField("relationship", e.target.value)} />
                          </div>
                        )}
                        {(mc.contactType === "Consultant" || mc.contactType === "Investigator") && (
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Specialty / Area</label>
                            <input style={inputStyle} value={d.specialty || ""} placeholder="Area of expertise" onChange={e => updateField("specialty", e.target.value)} />
                          </div>
                        )}
                        {mc.contactType === "Investigator" && (
                          <div style={fieldGroup}>
                            <label style={labelStyle}>License #</label>
                            <input style={inputStyle} value={d.licenseNumber || ""} onChange={e => updateField("licenseNumber", e.target.value)} />
                          </div>
                        )}

                        <div style={{ borderTop: "1px solid var(--c-border)", margin: "10px 0", paddingTop: 10 }}>
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Associated With</label>
                            <select style={inputStyle} value={assocValue} onChange={e => {
                              if (!e.target.value) { updateField("associatedWith", null); return; }
                              const [aType, aId] = e.target.value.split(":");
                              const opt = assocOptions.find(o => o.type === aType && String(o.id) === aId);
                              updateField("associatedWith", opt ? { type: opt.type, id: opt.id, name: opt.name } : null);
                            }}>
                              <option value="">— None —</option>
                              {assocOptions.map(o => <option key={`${o.type}-${o.id}`} value={`${o.type}:${o.id}`}>{o.label}</option>)}
                            </select>
                          </div>
                          <div style={fieldGroup}>
                            <label style={labelStyle}>Notes</label>
                            <textarea
                              style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                              value={d.notes || ""}
                              placeholder="Notes about this contact..."
                              onChange={e => updateField("notes", e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 11, color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                            if (!await confirmDelete()) return;
                            try {
                              await apiDeleteMiscContact(mc.id);
                              setMiscContacts(p => p.filter(x => x.id !== mc.id));
                              setExpandedMiscContact(null);
                              log("Misc Contact Removed", `Removed ${mc.contactType}: ${displayName}`);
                            } catch (err) { alert("Failed: " + err.message); }
                          }}>Remove Contact</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>

            </div>


          </div>
        )}

        {/* ── Insurance Tab (with Negotiations under each policy) ── */}
        {activeTab === "insurance" && (
          <div className="case-overlay-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>Insurance Policies ({insurancePolicies.length})</div>
              <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={async () => {
                try {
                  const saved = await apiCreateInsurancePolicy(c.id, { policyType: "Liability", carrierName: "", policyNumber: "", policyLimits: "", adjusterName: "", adjusterPhone: "", adjusterEmail: "", claimNumber: "", insuredName: "", notes: "" });
                  setExpandedPolicyId(saved.id);
                  setInsurancePolicies(p => [...p, saved]);
                } catch (err) { alert("Failed: " + err.message); }
              }}>+ Add Policy</button>
            </div>
            {piDataLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading...</div>}
            {!piDataLoading && insurancePolicies.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No insurance policies recorded yet.</div>}
            {insurancePolicies.map(p => {
              const policyNegs = negotiations.filter(n => n.policyId === p.id);
              const isNegOpen = expandedPolicyNeg[p.id];
              const feePct = Number(draft.contingencyFeePct) || 0;
              const isFeeFlat = !!draft.feeIsFlat;
              const totalOwedDamages = damages.reduce((s, d) => {
                const b = Number(d.billed) || 0;
                const rv = Number(d.reductionValue) || 0;
                const red = d.reductionIsPercent ? b * rv / 100 : rv;
                return s + Math.max(0, b - red - (Number(d.insurancePaid) || 0) - (Number(d.writeOff) || 0));
              }, 0);
              const totalOwedLiens = liens.reduce((s, l) => s + (Number(l.negotiatedAmount || l.negotiated_amount) || Number(l.amount) || 0), 0);
              const totalExpenses = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const isPolExpanded = expandedPolicyId === p.id;
              const updatePolLocal = (field, val) => setInsurancePolicies(prev => prev.map(x => x.id === p.id ? { ...x, [field]: val } : x));
              const savePol = (updates) => apiUpdateInsurancePolicy(c.id, p.id, updates).then(u => setInsurancePolicies(prev => prev.map(x => x.id === p.id ? u : x))).catch(err => console.error("Policy save failed:", err));
              const polType = p.policyType || p.policy_type || "Liability";
              const polCarrier = p.carrierName || p.carrier_name || "";
              const polLimits = p.policyLimits || p.policy_limits || "";
              const polClaim = p.claimNumber || p.claim_number || "";
              return (
              <div key={p.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", cursor: "pointer", gap: 12, background: isPolExpanded ? "var(--c-bg2)" : "var(--c-bg)" }}
                  onClick={() => setExpandedPolicyId(isPolExpanded ? null : p.id)}>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{polType}</span>
                    {polCarrier && <span style={{ fontSize: 12, color: "var(--c-text3)" }}>{polCarrier}</span>}
                    {polLimits && <span style={{ fontSize: 12, color: "var(--c-text3)" }}>Limits: <span style={{ fontWeight: 600 }}>{polLimits}</span></span>}
                    {polClaim && <span style={{ fontSize: 12, color: "var(--c-text3)" }}>Claim: {polClaim}</span>}
                    {policyNegs.length > 0 && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#dbeafe", color: "#1e40af" }}>{policyNegs.length} neg{policyNegs.length !== 1 ? "s" : ""}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 12, padding: 2 }}
                      onClick={async (e) => { e.stopPropagation(); if (!await confirmDelete()) return; apiDeleteInsurancePolicy(c.id, p.id).then(() => { setInsurancePolicies(prev => prev.filter(x => x.id !== p.id)); if (expandedPolicyId === p.id) setExpandedPolicyId(null); }).catch(e2 => alert(e2.message)); }}>✕</button>
                    {isPolExpanded ? <ChevronUp size={14} style={{ color: "var(--c-text3)" }} /> : <ChevronDown size={14} style={{ color: "var(--c-text3)" }} />}
                  </div>
                </div>
                {isPolExpanded && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--c-border2)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", marginTop: 10 }}>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Policy Type</label>
                        <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                          value={polType} onChange={e => { updatePolLocal("policyType", e.target.value); savePol({ policyType: e.target.value }); }}>
                          {["Liability", "UM", "UIM", "MedPay", "PIP", "Homeowner", "Commercial", "Umbrella", "Health Insurance"].map(o => <option key={o}>{o}</option>)}
                        </select></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Carrier</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={polCarrier} onChange={e => updatePolLocal("carrierName", e.target.value)} onBlur={e => savePol({ carrierName: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Policy #</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={p.policyNumber || p.policy_number || ""} onChange={e => updatePolLocal("policyNumber", e.target.value)} onBlur={e => savePol({ policyNumber: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Policy Limits</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={polLimits} onChange={e => updatePolLocal("policyLimits", e.target.value)} onBlur={e => savePol({ policyLimits: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Claim #</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={polClaim} onChange={e => updatePolLocal("claimNumber", e.target.value)} onBlur={e => savePol({ claimNumber: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Adjuster</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={p.adjusterName || p.adjuster_name || ""} onChange={e => updatePolLocal("adjusterName", e.target.value)} onBlur={e => savePol({ adjusterName: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Adjuster Phone</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={p.adjusterPhone || p.adjuster_phone || ""} onChange={e => updatePolLocal("adjusterPhone", e.target.value)} onBlur={e => savePol({ adjusterPhone: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Adjuster Email</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={p.adjusterEmail || p.adjuster_email || ""} onChange={e => updatePolLocal("adjusterEmail", e.target.value)} onBlur={e => savePol({ adjusterEmail: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Insured Name</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={p.insuredName || p.insured_name || ""} onChange={e => updatePolLocal("insuredName", e.target.value)} onBlur={e => savePol({ insuredName: e.target.value })} /></div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 12, paddingTop: 8 }}>
                      <div onClick={() => setExpandedPolicyNeg(prev => ({ ...prev, [p.id]: !prev[p.id] }))} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none", padding: "4px 0" }}>
                        {isNegOpen ? <ChevronDown size={14} style={{ color: "#64748b" }} /> : <ChevronRight size={14} style={{ color: "#64748b" }} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text-h)" }}>Negotiations ({policyNegs.length})</span>
                        {!isNegOpen && <button onClick={e => { e.stopPropagation(); (async () => { try { const saved = await apiCreateNegotiation(c.id, { date: new Date().toISOString().slice(0, 10), direction: "Demand", amount: "", fromParty: "", notes: "", policyId: p.id }); setNegotiations(prev => [...prev, saved]); setExpandedPolicyNeg(prev => ({ ...prev, [p.id]: true })); } catch (err) { alert("Failed: " + err.message); } })(); }} style={{ marginLeft: "auto", fontSize: 10, padding: "1px 8px", background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ Add</button>}
                      </div>
                      {isNegOpen && (
                        <div style={{ paddingTop: 8 }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                            <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 10, padding: "1px 8px" }} onClick={async () => {
                              try { const saved = await apiCreateNegotiation(c.id, { date: new Date().toISOString().slice(0, 10), direction: "Demand", amount: "", fromParty: "", notes: "", policyId: p.id }); setNegotiations(prev => [...prev, saved]); } catch (err) { alert("Failed: " + err.message); }
                            }}>+ Add Entry</button>
                          </div>
                          {policyNegs.length === 0 && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>No negotiations for this policy yet.</div>}
                          {policyNegs.sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(n => {
                            const dirColors = { Demand: "#1d4ed8", Offer: "#16a34a", "Counter-Demand": "#7c3aed", "Counter-Offer": "#d97706" };
                            const updateNegLocal = (field, val) => setNegotiations(prev => prev.map(x => x.id === n.id ? { ...x, [field]: val } : x));
                            const saveNeg = (updates) => apiUpdateNegotiation(c.id, n.id, updates).then(u => setNegotiations(prev => prev.map(x => x.id === n.id ? u : x))).catch(err => console.error("Negotiation save failed:", err));
                            const gross = Number(n.amount) || 0;
                            const feeAmt = isFeeFlat ? feePct : gross * feePct / 100;
                            const net = gross - feeAmt - totalOwedDamages - totalOwedLiens - totalExpenses;
                            return (
                              <div key={n.id} style={{ border: "1px solid var(--c-border)", borderRadius: 6, marginBottom: 6, padding: "8px 10px", background: "var(--c-bg)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px 12px", flex: 1 }}>
                                    <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>Date</label>
                                      <input type="date" style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                        value={n.date || ""} onChange={e => updateNegLocal("date", e.target.value)} onBlur={e => saveNeg({ date: e.target.value })} /></div>
                                    <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>Direction</label>
                                      <select style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: `1px solid ${dirColors[n.direction] || "var(--c-border)"}`, background: "var(--c-bg)", color: dirColors[n.direction] || "var(--c-text)", fontWeight: 600 }}
                                        value={n.direction || "Demand"} onChange={e => { updateNegLocal("direction", e.target.value); saveNeg({ direction: e.target.value }); }}>
                                        {["Demand", "Offer", "Counter-Demand", "Counter-Offer"].map(o => <option key={o}>{o}</option>)}
                                      </select></div>
                                    <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>Amount</label>
                                      <input type="number" style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                        value={n.amount || ""} onChange={e => updateNegLocal("amount", e.target.value)} onBlur={e => saveNeg({ amount: e.target.value })} /></div>
                                    <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>From Party</label>
                                      <input style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                        value={n.fromParty || n.from_party || ""} onChange={e => updateNegLocal("fromParty", e.target.value)} onBlur={e => saveNeg({ fromParty: e.target.value })} /></div>
                                  </div>
                                  <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 13, marginLeft: 6 }}
                                    onClick={async () => { if (!await confirmDelete()) return; apiDeleteNegotiation(c.id, n.id).then(() => setNegotiations(prev => prev.filter(x => x.id !== n.id))).catch(e => alert(e.message)); }}>✕</button>
                                </div>
                                {gross > 0 && (
                                  <div style={{ display: "flex", gap: 16, marginTop: 6, paddingTop: 6, borderTop: "1px dashed var(--c-border)", flexWrap: "wrap" }}>
                                    <div><span style={{ fontSize: 10, color: "#64748b" }}>Gross:</span> <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>${gross.toLocaleString()}</span></div>
                                    <div><span style={{ fontSize: 10, color: "#64748b" }}>Fee ({isFeeFlat ? "$" + feePct.toLocaleString() : feePct + "%"}):</span> <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>−${feeAmt.toLocaleString()}</span></div>
                                    {totalOwedDamages > 0 && <div><span style={{ fontSize: 10, color: "#64748b" }}>Damages:</span> <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>−${totalOwedDamages.toLocaleString()}</span></div>}
                                    {totalExpenses > 0 && <div><span style={{ fontSize: 10, color: "#64748b" }}>Expenses:</span> <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>−${totalExpenses.toLocaleString()}</span></div>}
                                    <div><span style={{ fontSize: 10, color: "#64748b" }}>Net:</span> <span style={{ fontSize: 12, fontWeight: 700, color: net >= 0 ? "#16a34a" : "#dc2626" }}>${net.toLocaleString()}</span></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ); })}

            {(() => {
              const generalNegs = negotiations.filter(n => !n.policyId);
              const isGenOpen = expandedPolicyNeg["general"];
              const feePct = Number(draft.contingencyFeePct) || 0;
              const isFeeFlat = !!draft.feeIsFlat;
              const totalOwedDamages = damages.reduce((s, d) => {
                const b = Number(d.billed) || 0;
                const rv = Number(d.reductionValue) || 0;
                const red = d.reductionIsPercent ? b * rv / 100 : rv;
                return s + Math.max(0, b - red - (Number(d.insurancePaid) || 0) - (Number(d.writeOff) || 0));
              }, 0);
              const totalOwedLiens = liens.reduce((s, l) => s + (Number(l.negotiatedAmount || l.negotiated_amount) || Number(l.amount) || 0), 0);
              const totalExpenses = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
              return (
                <div style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginTop: 16, padding: "12px 14px" }}>
                  <div onClick={() => setExpandedPolicyNeg(prev => ({ ...prev, general: !prev.general }))} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none", padding: "4px 0" }}>
                    {isGenOpen ? <ChevronDown size={14} style={{ color: "#64748b" }} /> : <ChevronRight size={14} style={{ color: "#64748b" }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>General Negotiations ({generalNegs.length})</span>
                    {!isGenOpen && <button onClick={e => { e.stopPropagation(); (async () => { try { const saved = await apiCreateNegotiation(c.id, { date: new Date().toISOString().slice(0, 10), direction: "Demand", amount: "", fromParty: "", notes: "", policyId: null }); setNegotiations(prev => [...prev, saved]); setExpandedPolicyNeg(prev => ({ ...prev, general: true })); } catch (err) { alert("Failed: " + err.message); } })(); }} style={{ marginLeft: "auto", fontSize: 10, padding: "1px 8px", background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ Add</button>}
                  </div>
                  {isGenOpen && (
                    <div style={{ paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                        <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 10, padding: "1px 8px" }} onClick={async () => {
                          try { const saved = await apiCreateNegotiation(c.id, { date: new Date().toISOString().slice(0, 10), direction: "Demand", amount: "", fromParty: "", notes: "", policyId: null }); setNegotiations(prev => [...prev, saved]); } catch (err) { alert("Failed: " + err.message); }
                        }}>+ Add Entry</button>
                      </div>
                      {generalNegs.length === 0 && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>No general negotiations yet.</div>}
                      {generalNegs.sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(n => {
                        const dirColors = { Demand: "#1d4ed8", Offer: "#16a34a", "Counter-Demand": "#7c3aed", "Counter-Offer": "#d97706" };
                        const updateNegLocal = (field, val) => setNegotiations(prev => prev.map(x => x.id === n.id ? { ...x, [field]: val } : x));
                        const saveNeg = (updates) => apiUpdateNegotiation(c.id, n.id, updates).then(u => setNegotiations(prev => prev.map(x => x.id === n.id ? u : x))).catch(err => console.error("Negotiation save failed:", err));
                        const gross = Number(n.amount) || 0;
                        const feeAmt = isFeeFlat ? feePct : gross * feePct / 100;
                        const net = gross - feeAmt - totalOwedDamages - totalOwedLiens - totalExpenses;
                        return (
                          <div key={n.id} style={{ border: "1px solid var(--c-border)", borderRadius: 6, marginBottom: 6, padding: "8px 10px", background: "var(--c-bg)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px 12px", flex: 1 }}>
                                <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>Date</label>
                                  <input type="date" style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                    value={n.date || ""} onChange={e => updateNegLocal("date", e.target.value)} onBlur={e => saveNeg({ date: e.target.value })} /></div>
                                <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>Direction</label>
                                  <select style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: `1px solid ${dirColors[n.direction] || "var(--c-border)"}`, background: "var(--c-bg)", color: dirColors[n.direction] || "var(--c-text)", fontWeight: 600 }}
                                    value={n.direction || "Demand"} onChange={e => { updateNegLocal("direction", e.target.value); saveNeg({ direction: e.target.value }); }}>
                                    {["Demand", "Offer", "Counter-Demand", "Counter-Offer"].map(o => <option key={o}>{o}</option>)}
                                  </select></div>
                                <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>Amount</label>
                                  <input type="number" style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                    value={n.amount || ""} onChange={e => updateNegLocal("amount", e.target.value)} onBlur={e => saveNeg({ amount: e.target.value })} /></div>
                                <div><label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 1 }}>From Party</label>
                                  <input style={{ width: "100%", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                    value={n.fromParty || n.from_party || ""} onChange={e => updateNegLocal("fromParty", e.target.value)} onBlur={e => saveNeg({ fromParty: e.target.value })} /></div>
                              </div>
                              <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 13, marginLeft: 6 }}
                                onClick={async () => { if (!await confirmDelete()) return; apiDeleteNegotiation(c.id, n.id).then(() => setNegotiations(prev => prev.filter(x => x.id !== n.id))).catch(e => alert(e.message)); }}>✕</button>
                            </div>
                            {gross > 0 && (
                              <div style={{ display: "flex", gap: 16, marginTop: 6, paddingTop: 6, borderTop: "1px dashed var(--c-border)", flexWrap: "wrap" }}>
                                <div><span style={{ fontSize: 10, color: "#64748b" }}>Gross:</span> <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>${gross.toLocaleString()}</span></div>
                                <div><span style={{ fontSize: 10, color: "#64748b" }}>Fee ({isFeeFlat ? "$" + feePct.toLocaleString() : feePct + "%"}):</span> <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>−${feeAmt.toLocaleString()}</span></div>
                                {totalOwedDamages > 0 && <div><span style={{ fontSize: 10, color: "#64748b" }}>Damages:</span> <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>−${totalOwedDamages.toLocaleString()}</span></div>}
                                {totalExpenses > 0 && <div><span style={{ fontSize: 10, color: "#64748b" }}>Expenses:</span> <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>−${totalExpenses.toLocaleString()}</span></div>}
                                <div><span style={{ fontSize: 10, color: "#64748b" }}>Net:</span> <span style={{ fontSize: 12, fontWeight: 700, color: net >= 0 ? "#16a34a" : "#dc2626" }}>${net.toLocaleString()}</span></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}


        {/* ── Medical Treatment Tab ── */}
        {activeTab === "medical" && (
          <div className="case-overlay-body">
            <input type="file" ref={medRecFileRef} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !medicalUploadingFor) return;
              const tid = medicalUploadingFor;
              setMedicalUploadingFor(null);
              setMedicalRecordsLoading(p => ({ ...p, [tid]: true }));
              stagedMedFileRef.current = file;
              try {
                const result = await apiUploadMedicalRecord(c.id, tid, file);
                if (result.staged) {
                  setStagedMedRecords({ treatmentId: tid, entries: result.staged, filename: result.filename, mimeType: result.mimeType, source: "upload" });
                } else {
                  const recs = result.records || (Array.isArray(result) ? result : [result]);
                  setMedicalRecords(p => ({ ...p, [tid]: [...(p[tid] || []), ...recs] }));
                  if (result.treatmentUpdates) {
                    const u = result.treatmentUpdates;
                    setMedicalTreatments(p => p.map(x => {
                      if (x.id !== tid) return x;
                      const updated = { ...x };
                      if (u.provider_name) updated.providerName = u.provider_name;
                      if (u.first_visit_date) updated.firstVisitDate = u.first_visit_date;
                      if (u.last_visit_date) updated.lastVisitDate = u.last_visit_date;
                      return updated;
                    }));
                  }
                }
              } catch (err) { alert("Upload failed: " + err.message); }
              setMedicalRecordsLoading(p => ({ ...p, [tid]: false }));
              e.target.value = "";
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>Medical Treatment ({medicalTreatments.length})</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                  value={medicalFilterType} onChange={e => setMedicalFilterType(e.target.value)}>
                  <option value="All">All Types</option>
                  {["ER", "Hospital", "Orthopedic", "Chiropractor", "PT", "Neurologist", "Pain Mgmt", "PCP", "Surgeon", "Dentist", "Psychologist", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                  value={medicalSortBy} onChange={e => setMedicalSortBy(e.target.value)}>
                  <option value="providerName">Sort: Name</option>
                  <option value="providerType">Sort: Type</option>
                  <option value="firstVisitDate">Sort: First Visit</option>
                  <option value="totalBilled">Sort: Billed</option>
                </select>
                <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={async () => {
                  try {
                    const saved = await apiCreateMedicalTreatment(c.id, { providerName: "", providerType: "Other", firstVisitDate: "", lastVisitDate: "", stillTreating: false, totalBilled: "", totalPaid: "", description: "", notes: "" });
                    setMedicalTreatments(p => [...p, saved]);
                  } catch (err) { alert("Failed: " + err.message); }
                }}>+ Add Provider</button>
              </div>
            </div>
            {piDataLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading...</div>}
            {stagedMedRecords && (
              <div style={{ border: "2px solid #f59e0b", borderRadius: 8, marginBottom: 16, background: "#fffbeb", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fef3c7", borderBottom: "1px solid #fde68a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Parsed {stagedMedRecords.entries.length} Record{stagedMedRecords.entries.length !== 1 ? "s" : ""}</span>
                    <span style={{ fontSize: 11, color: "#a16207" }}>from {stagedMedRecords.filename}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: "#16a34a", color: "#fff", border: "none", fontSize: 11, padding: "4px 14px", fontWeight: 600 }}
                      onClick={async () => {
                        const s = stagedMedRecords;
                        setMedicalRecordsLoading(p => ({ ...p, [s.treatmentId]: true }));
                        try {
                          const result = await apiCommitMedicalRecords(
                            c.id, s.treatmentId, s.entries,
                            s.source === "upload" ? stagedMedFileRef.current : null,
                            s.documentId || null,
                            s.filename, s.mimeType
                          );
                          const recs = result.records || [];
                          setMedicalRecords(p => ({ ...p, [s.treatmentId]: [...(p[s.treatmentId] || []), ...recs] }));
                          if (result.treatmentUpdates) {
                            const u = result.treatmentUpdates;
                            setMedicalTreatments(p => p.map(x => {
                              if (x.id !== s.treatmentId) return x;
                              const updated = { ...x };
                              if (u.provider_name) updated.providerName = u.provider_name;
                              if (u.first_visit_date) updated.firstVisitDate = u.first_visit_date;
                              if (u.last_visit_date) updated.lastVisitDate = u.last_visit_date;
                              return updated;
                            }));
                          }
                          setStagedMedRecords(null);
                          stagedMedFileRef.current = null;
                        } catch (err) { alert("Failed to save: " + err.message); }
                        setMedicalRecordsLoading(p => ({ ...p, [s.treatmentId]: false }));
                      }}>Add All</button>
                    <button className="btn btn-sm" style={{ background: "#dc2626", color: "#fff", border: "none", fontSize: 11, padding: "4px 14px", fontWeight: 600 }}
                      onClick={() => { setStagedMedRecords(null); stagedMedFileRef.current = null; }}>Discard</button>
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {stagedMedRecords.entries.map((entry, idx) => (
                    <div key={entry._stagingId || idx} style={{ padding: "8px 14px", borderBottom: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{entry.provider_name || "(No Provider)"}</span>
                          {entry.date_of_service && <span style={{ fontSize: 11, color: "#64748b" }}>{entry.date_of_service}</span>}
                          {entry.body_part && <span style={{ fontSize: 10, color: "#1e40af", background: "#dbeafe", padding: "1px 6px", borderRadius: 3 }}>{entry.body_part}</span>}
                          {entry.source_pages && <span style={{ fontSize: 10, color: "#a16207", background: "#fef3c7", padding: "1px 6px", borderRadius: 3 }}>p. {entry.source_pages}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>{(entry.description || entry.summary || "").substring(0, 200)}{(entry.description || entry.summary || "").length > 200 ? "..." : ""}</div>
                      </div>
                      <button style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: "0 4px", flexShrink: 0, lineHeight: 1 }}
                        title="Remove this entry"
                        onClick={() => {
                          setStagedMedRecords(prev => {
                            if (!prev) return null;
                            const remaining = prev.entries.filter((_, i) => i !== idx);
                            if (remaining.length === 0) { stagedMedFileRef.current = null; return null; }
                            return { ...prev, entries: remaining };
                          });
                        }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!piDataLoading && medicalTreatments.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No medical treatments recorded yet.</div>}
            {(() => {
              const totalBilled = medicalTreatments.reduce((s, t) => s + (Number(t.totalBilled || t.total_billed) || 0), 0);
              const totalPaid = medicalTreatments.reduce((s, t) => s + (Number(t.totalPaid || t.total_paid) || 0), 0);
              return medicalTreatments.length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 24 }}>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Total Billed:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>${totalBilled.toLocaleString()}</span></div>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Total Paid:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#0f766e" }}>${totalPaid.toLocaleString()}</span></div>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Providers:</span> <span style={{ fontSize: 14, fontWeight: 700 }}>{medicalTreatments.length}</span></div>
                </div>
              );
            })()}
            {[...medicalTreatments]
              .filter(t => medicalFilterType === "All" || (t.providerType || t.provider_type || "Other") === medicalFilterType)
              .sort((a, b) => {
                if (medicalSortBy === "providerName") return (a.providerName || a.provider_name || "").localeCompare(b.providerName || b.provider_name || "");
                if (medicalSortBy === "providerType") return (a.providerType || a.provider_type || "").localeCompare(b.providerType || b.provider_type || "");
                if (medicalSortBy === "firstVisitDate") return (a.firstVisitDate || a.first_visit_date || "").localeCompare(b.firstVisitDate || b.first_visit_date || "");
                if (medicalSortBy === "totalBilled") return (Number(b.totalBilled || b.total_billed) || 0) - (Number(a.totalBilled || a.total_billed) || 0);
                return 0;
              })
              .map(t => {
              const isCollapsed = collapsedProviders[t.id] !== false;
              const updateTxLocal = (field, val) => setMedicalTreatments(prev => prev.map(x => x.id === t.id ? { ...x, [field]: val } : x));
              const saveTx = (updates) => apiUpdateMedicalTreatment(c.id, t.id, updates).then(u => setMedicalTreatments(prev => prev.map(x => x.id === t.id ? u : x))).catch(err => console.error("Treatment save failed:", err));
              const provName = t.providerName || t.provider_name || "(No Name)";
              const provType = t.providerType || t.provider_type || "Other";
              const firstDate = t.firstVisitDate || t.first_visit_date || "";
              const lastDate = t.lastVisitDate || t.last_visit_date || "";
              const recs = medicalRecords[t.id] || [];
              const recsLoading = medicalRecordsLoading[t.id];
              return (
              <div key={t.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--c-bg2)", cursor: "pointer", userSelect: "none" }}
                  onClick={() => {
                    const wasCollapsed = p => p[t.id] !== false;
                    setCollapsedProviders(p => ({ ...p, [t.id]: wasCollapsed(p) ? false : true }));
                    if (collapsedProviders[t.id] !== false && !medicalRecords[t.id] && !medicalRecordsLoading[t.id]) {
                      setMedicalRecordsLoading(p => ({ ...p, [t.id]: true }));
                      apiGetMedicalRecords(c.id, t.id).then(r => {
                        setMedicalRecords(p => ({ ...p, [t.id]: r }));
                        setMedicalRecordsLoading(p => ({ ...p, [t.id]: false }));
                      }).catch(() => setMedicalRecordsLoading(p => ({ ...p, [t.id]: false })));
                    }
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    {isCollapsed ? <ChevronRight size={16} style={{ color: "var(--c-text3)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--c-text3)", flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)" }}>{provName}</span>
                    <Badge label={provType} />
                    {firstDate && <span style={{ fontSize: 11, color: "var(--c-text3)" }}>{fmt(firstDate)}{lastDate ? ` — ${fmt(lastDate)}` : ""}</span>}
                    {!!(t.stillTreating || t.still_treating) && <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>● Active</span>}
                  </div>
                  <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 14, marginLeft: 8 }}
                    onClick={async (e) => { e.stopPropagation(); if (!await confirmDelete()) return; apiDeleteMedicalTreatment(c.id, t.id).then(() => setMedicalTreatments(p => p.filter(x => x.id !== t.id))).catch(err => alert(err.message)); }}>✕</button>
                </div>
                {!isCollapsed && (
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Provider Name</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={t.providerName || t.provider_name || ""} onChange={e => updateTxLocal("providerName", e.target.value)} onBlur={e => saveTx({ providerName: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Type</label>
                        <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                          value={t.providerType || t.provider_type || "Other"} onChange={e => { updateTxLocal("providerType", e.target.value); saveTx({ providerType: e.target.value }); }}>
                          {["ER", "Hospital", "Orthopedic", "Chiropractor", "PT", "Neurologist", "Pain Mgmt", "PCP", "Surgeon", "Dentist", "Psychologist", "Other"].map(o => <option key={o}>{o}</option>)}
                        </select></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>First Visit</label>
                        <input type="date" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={t.firstVisitDate || t.first_visit_date || ""} onChange={e => updateTxLocal("firstVisitDate", e.target.value)} onBlur={e => saveTx({ firstVisitDate: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Last Visit</label>
                        <input type="date" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={t.lastVisitDate || t.last_visit_date || ""} onChange={e => updateTxLocal("lastVisitDate", e.target.value)} onBlur={e => saveTx({ lastVisitDate: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Total Billed</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={t.totalBilled || t.total_billed || ""} onChange={e => updateTxLocal("totalBilled", e.target.value)} onBlur={e => saveTx({ totalBilled: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Total Paid</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={t.totalPaid || t.total_paid || ""} onChange={e => updateTxLocal("totalPaid", e.target.value)} onBlur={e => saveTx({ totalPaid: e.target.value })} /></div>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--c-text2)", cursor: "pointer", gridColumn: "1 / -1" }}>
                        <input type="checkbox" checked={!!(t.stillTreating || t.still_treating)} onChange={e => { updateTxLocal("stillTreating", e.target.checked); saveTx({ stillTreating: e.target.checked }); }} /> Still Treating
                      </label>
                    </div>
                    <div style={{ marginTop: 16, borderTop: "1px solid var(--c-border)", paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Medical Records ({recs.length})</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button className="btn btn-sm btn-outline" style={{ fontSize: 11, padding: "2px 10px", display: "flex", alignItems: "center", gap: 4 }}
                            disabled={!!recsLoading}
                            onClick={() => { setMedicalUploadingFor(t.id); setTimeout(() => medRecFileRef.current?.click(), 50); }}>
                            <Upload size={12} /> Upload Records
                          </button>
                          <button className="btn btn-sm btn-outline" style={{ fontSize: 11, padding: "2px 10px", display: "flex", alignItems: "center", gap: 4 }}
                            disabled={!!recsLoading || docPickerLoading === t.id}
                            onClick={() => setDocPickerForTreatment(docPickerForTreatment === t.id ? null : t.id)}>
                            <FileText size={12} /> Select from Documents
                          </button>
                        </div>
                      </div>
                      {docPickerForTreatment === t.id && (() => {
                        const medicalKeywords = /medical|health|hospital|clinic|doctor|physician|treatment|diagnosis|radiology|imaging|lab|pathology|surgical|operative|discharge|ER|emergency|orthopedic|chiro|therapy|nursing|pharmacy|prescription/i;
                        const isMedDoc = (doc) => {
                          const folder = docFolders.find(f => f.id === (doc.folderId || doc.folder_id));
                          return medicalKeywords.test(doc.filename || "") || medicalKeywords.test(doc.description || "") || (doc.docType === "Medical Records") || (folder && medicalKeywords.test(folder.name));
                        };
                        const medDocs = caseDocuments.filter(d => isMedDoc(d)).sort((a, b) => (a.filename || "").localeCompare(b.filename || ""));
                        const otherDocs = caseDocuments.filter(d => !isMedDoc(d)).sort((a, b) => (a.filename || "").localeCompare(b.filename || ""));
                        const sortedDocs = [...medDocs, ...otherDocs];
                        return (
                          <div style={{ border: "1px solid var(--c-border)", borderRadius: 6, marginBottom: 8, background: "var(--c-bg)", maxHeight: 240, overflowY: "auto" }}>
                            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--c-bg)", zIndex: 1 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Select a document to import as medical record</span>
                              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-text3)", fontSize: 14 }} onClick={() => setDocPickerForTreatment(null)}>✕</button>
                            </div>
                            {sortedDocs.length === 0 && <div style={{ padding: "12px 10px", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No documents in this case.</div>}
                            {sortedDocs.map(doc => {
                              const folder = docFolders.find(f => f.id === (doc.folderId || doc.folder_id));
                              const isMedical = isMedDoc(doc);
                              return (
                                <div key={doc.id} style={{ padding: "6px 10px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: docPickerLoading === t.id ? "wait" : "pointer", opacity: docPickerLoading === t.id ? 0.5 : 1, background: isMedical ? "var(--c-bg2)" : "transparent", pointerEvents: docPickerLoading === t.id ? "none" : "auto" }}
                                  onClick={async () => {
                                    if (docPickerLoading) return;
                                    setDocPickerLoading(t.id);
                                    try {
                                      const result = await apiMedicalRecordFromDocument(c.id, t.id, doc.id);
                                      if (result.staged) {
                                        setStagedMedRecords({ treatmentId: t.id, entries: result.staged, filename: result.filename, documentId: result.documentId, mimeType: result.mimeType, source: "document" });
                                      } else {
                                        const recs = result.records || (Array.isArray(result) ? result : [result]);
                                        setMedicalRecords(p => ({ ...p, [t.id]: [...(p[t.id] || []), ...recs] }));
                                        if (result.treatmentUpdates) {
                                          const u = result.treatmentUpdates;
                                          setMedicalTreatments(p => p.map(x => {
                                            if (x.id !== t.id) return x;
                                            const updated = { ...x };
                                            if (u.provider_name) updated.providerName = u.provider_name;
                                            if (u.first_visit_date) updated.firstVisitDate = u.first_visit_date;
                                            if (u.last_visit_date) updated.lastVisitDate = u.last_visit_date;
                                            return updated;
                                          }));
                                        }
                                      }
                                      setDocPickerForTreatment(null);
                                    } catch (err) { alert("Failed to import: " + err.message); }
                                    setDocPickerLoading(null);
                                  }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text-h)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {isMedical && <span style={{ color: "#16a34a", marginRight: 4 }}>●</span>}
                                      {doc.filename}
                                    </div>
                                    <div style={{ fontSize: 10, color: "var(--c-text3)" }}>
                                      {folder && <span style={{ marginRight: 8 }}>📁 {folder.name}</span>}
                                      {doc.docType && <span>{doc.docType}</span>}
                                    </div>
                                  </div>
                                  {docPickerLoading === t.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "#64748b", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "var(--c-text3)", flexShrink: 0 }} />}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {recsLoading && <div style={{ fontSize: 12, color: "#64748b" }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite", display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />Analyzing records...</div>}
                      {!recsLoading && recs.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No records uploaded yet.</div>}
                      {recs.length > 0 && (() => {
                        const tf = medRecFilters[t.id] || {};
                        const tProvFilter = tf.provider || "All Providers";
                        const tDateFrom = tf.dateFrom || "";
                        const tDateTo = tf.dateTo || "";
                        const setTf = (updates) => setMedRecFilters(p => ({ ...p, [t.id]: { ...tf, ...updates } }));
                        const uniqueProviders = [...new Set(recs.map(r => r.providerName).filter(Boolean))];
                        const filteredRecs = recs.filter(rec => {
                          if (tProvFilter !== "All Providers" && rec.providerName !== tProvFilter) return false;
                          if (tDateFrom && rec.dateOfService && rec.dateOfService < tDateFrom) return false;
                          if (tDateTo && rec.dateOfService && rec.dateOfService > tDateTo) return false;
                          return true;
                        }).sort((a, b) => (a.dateOfService || "").localeCompare(b.dateOfService || ""));
                        return (
                          <>
                            {recs.length > 1 && (
                              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 8, flexWrap: "wrap" }}>
                                <div>
                                  <div style={{ fontSize: 10, color: "var(--c-text3)", marginBottom: 2 }}>Provider</div>
                                  <select style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", minWidth: 140 }}
                                    value={tProvFilter} onChange={e => setTf({ provider: e.target.value })}>
                                    <option>All Providers</option>
                                    {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, color: "var(--c-text3)", marginBottom: 2 }}>From</div>
                                  <input type="date" style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                                    value={tDateFrom} onChange={e => setTf({ dateFrom: e.target.value })} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, color: "var(--c-text3)", marginBottom: 2 }}>To</div>
                                  <input type="date" style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                                    value={tDateTo} onChange={e => setTf({ dateTo: e.target.value })} />
                                </div>
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: "var(--c-text3)", marginBottom: 6 }}>{filteredRecs.length} {filteredRecs.length === 1 ? "entry" : "entries"} found</div>
                            {filteredRecs.map(rec => {
                              const isExpanded = expandedRecordId === rec.id;
                              const updateRecLocal = (field, val) => setMedicalRecords(p => ({ ...p, [t.id]: (p[t.id] || []).map(r => r.id === rec.id ? { ...r, [field]: val } : r) }));
                              const saveRec = (updates) => apiUpdateMedicalRecord(c.id, t.id, rec.id, updates).then(u => setMedicalRecords(p => ({ ...p, [t.id]: (p[t.id] || []).map(r => r.id === rec.id ? u : r) }))).catch(err => console.error("Record save failed:", err));
                              return (
                                <div key={rec.id} style={{ border: "1px solid var(--c-border2)", borderRadius: 6, marginBottom: 4, background: isExpanded ? "var(--c-bg2)" : "var(--c-bg)", overflow: "hidden" }}>
                                  <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", cursor: "pointer", gap: 12 }}
                                    onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}>
                                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{rec.providerName || "(No Provider)"}</span>
                                      <span style={{ fontSize: 12, color: "var(--c-text3)", flexShrink: 0 }}>{rec.dateOfService ? new Date(rec.dateOfService + "T00:00:00").toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : ""}</span>
                                      {rec.bodyPart && <span style={{ fontSize: 10, color: "#1e40af", background: "#dbeafe", padding: "1px 6px", borderRadius: 3, flexShrink: 0 }}>{rec.bodyPart}</span>}
                                      {rec.sourcePages && <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>p. {rec.sourcePages}</span>}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                      <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 12, padding: 2 }}
                                        onClick={async (e) => { e.stopPropagation(); if (!await confirmDelete()) return; try { await apiDeleteMedicalRecord(c.id, t.id, rec.id); setMedicalRecords(p => ({ ...p, [t.id]: (p[t.id] || []).filter(r => r.id !== rec.id) })); } catch (err) { alert(err.message); } }}>
                                        ✕
                                      </button>
                                      {isExpanded ? <ChevronUp size={14} style={{ color: "var(--c-text3)" }} /> : <ChevronDown size={14} style={{ color: "var(--c-text3)" }} />}
                                    </div>
                                  </div>
                                  {!isExpanded && rec.description && (
                                    <div style={{ padding: "0 10px 6px", fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {rec.description}
                                    </div>
                                  )}
                                  {isExpanded && (
                                    <div style={{ padding: "0 10px 12px", borderTop: "1px solid var(--c-border2)" }}>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px 16px", marginTop: 10, marginBottom: 10 }}>
                                        <div>
                                          <label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Provider</label>
                                          <input style={{ width: "100%", fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                            value={rec.providerName || ""} onChange={e => updateRecLocal("providerName", e.target.value)} onBlur={e => saveRec({ providerName: e.target.value })} />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Date of Service</label>
                                          <input type="date" style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                                            value={rec.dateOfService || ""} onChange={e => updateRecLocal("dateOfService", e.target.value)} onBlur={e => saveRec({ dateOfService: e.target.value })} />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Body Part</label>
                                          <input style={{ width: "100%", fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                            placeholder="e.g. Cervical Spine" value={rec.bodyPart || ""} onChange={e => updateRecLocal("bodyPart", e.target.value)} onBlur={e => saveRec({ bodyPart: e.target.value })} />
                                        </div>
                                      </div>
                                      <div style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Description</label>
                                        <input style={{ width: "100%", fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                                          placeholder="Brief description" value={rec.description || ""} onChange={e => updateRecLocal("description", e.target.value)} onBlur={e => saveRec({ description: e.target.value })} />
                                      </div>
                                      {rec.sourcePages && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Source Page: {rec.sourcePages}</div>}
                                      <div>
                                        <label style={{ fontSize: 10, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Summary</label>
                                        <textarea style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", minHeight: 80, resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }}
                                          value={rec.summary || ""} onChange={e => updateRecLocal("summary", e.target.value)} onBlur={e => saveRec({ summary: e.target.value })} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* ── Damages Tab (includes Liens) ── */}
        {activeTab === "damages" && (
          <div className="case-overlay-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>Damages ({damages.length})</div>
              <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={async () => {
                try {
                  const saved = await apiCreateDamage(c.id, { name: "", category: "Medical Bill", description: "", amount: "", documentationStatus: "Pending", notes: "" });
                  setExpandedDamageId(saved.id);
                  setDamages(p => [...p, saved]);
                } catch (err) { alert("Failed: " + err.message); }
              }}>+ Add Damage</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 4, border: "1px solid var(--c-border)", color: "var(--c-text2)", cursor: damageDocLoading ? "wait" : "pointer", background: "var(--c-bg)", opacity: damageDocLoading ? 0.5 : 1 }}>
                <Upload size={12} /> Upload Bill
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.doc,.docx" style={{ display: "none" }} disabled={damageDocLoading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    e.target.value = "";
                    setDamageDocLoading(true);
                    try {
                      const result = await apiUploadDamageBill(c.id, file);
                      if (result.entries?.length) {
                        setDamages(p => [...p, ...result.entries]);
                        setExpandedDamageId(result.entries[0].id);
                      } else {
                        alert(result.message || "No billing items found in this file.");
                      }
                    } catch (err) { alert("Failed: " + err.message); }
                    setDamageDocLoading(false);
                  }} />
              </label>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 4, border: "1px solid var(--c-border)", color: "var(--c-text2)", cursor: damageDocLoading ? "wait" : "pointer", background: damageDocPicker ? "var(--c-bg2)" : "var(--c-bg)", opacity: damageDocLoading ? 0.5 : 1 }}
                disabled={damageDocLoading}
                onClick={() => setDamageDocPicker(!damageDocPicker)}>
                <FileText size={12} /> Select from Documents
              </button>
              {damageDocLoading && <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />Analyzing billing...</span>}
            </div>
            {damageDocPicker && (() => {
              const billingKeywords = /billing|bill|invoice|statement|itemized|charges|account|balance|payment|receipt|EOB|explanation.*benefit/i;
              const isBillingDoc = (doc) => {
                const folder = docFolders.find(f => f.id === (doc.folderId || doc.folder_id));
                return (doc.docType === "Billing Records") || billingKeywords.test(doc.filename || "") || billingKeywords.test(doc.description || "") || (folder && billingKeywords.test(folder.name));
              };
              const billingDocs = caseDocuments.filter(d => isBillingDoc(d)).sort((a, b) => (a.filename || "").localeCompare(b.filename || ""));
              const otherDocs = caseDocuments.filter(d => !isBillingDoc(d)).sort((a, b) => (a.filename || "").localeCompare(b.filename || ""));
              const sortedDocs = [...billingDocs, ...otherDocs];
              return (
                <div style={{ border: "1px solid var(--c-border)", borderRadius: 6, marginBottom: 12, background: "var(--c-bg)", maxHeight: 240, overflowY: "auto" }}>
                  <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--c-bg)", zIndex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Select a document to analyze for billing</span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-text3)", fontSize: 14 }} onClick={() => setDamageDocPicker(false)}>✕</button>
                  </div>
                  {sortedDocs.length === 0 && <div style={{ padding: "12px 10px", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No documents in this case.</div>}
                  {sortedDocs.map(doc => {
                    const folder = docFolders.find(f => f.id === (doc.folderId || doc.folder_id));
                    const isBilling = isBillingDoc(doc);
                    return (
                      <div key={doc.id} style={{ padding: "6px 10px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: damageDocLoading ? "wait" : "pointer", opacity: damageDocLoading ? 0.5 : 1, background: isBilling ? "var(--c-bg2)" : "transparent", pointerEvents: damageDocLoading ? "none" : "auto" }}
                        onClick={async () => {
                          if (damageDocLoading) return;
                          setDamageDocLoading(true);
                          try {
                            const result = await apiDamageFromDocument(c.id, doc.id);
                            if (result.entries?.length) {
                              setDamages(p => [...p, ...result.entries]);
                              setExpandedDamageId(result.entries[0].id);
                            } else {
                              alert(result.message || "No billing items found in this document.");
                            }
                            setDamageDocPicker(false);
                          } catch (err) { alert("Failed: " + err.message); }
                          setDamageDocLoading(false);
                        }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text-h)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isBilling && <span style={{ color: "#0369a1", marginRight: 4 }}>●</span>}
                            {doc.filename}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--c-text3)" }}>
                            {folder && <span style={{ marginRight: 8 }}>📁 {folder.name}</span>}
                            {doc.docType && <span>{doc.docType}</span>}
                          </div>
                        </div>
                        {damageDocLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "#64748b", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "var(--c-text3)", flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {piDataLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading...</div>}
            {(() => {
              const totalBilled = damages.reduce((s, d) => s + (Number(d.billed) || 0), 0);
              const totalReduction = damages.reduce((s, d) => {
                const rv = Number(d.reductionValue) || 0;
                if (!rv) return s;
                const b = Number(d.billed) || 0;
                return s + (d.reductionIsPercent ? b * rv / 100 : rv);
              }, 0);
              const totalInsPaid = damages.reduce((s, d) => s + (Number(d.insurancePaid) || 0), 0);
              const totalWriteOff = damages.reduce((s, d) => s + (Number(d.writeOff) || 0), 0);
              const totalCalcOwed = Math.max(0, totalBilled - totalReduction - totalInsPaid - totalWriteOff);
              const totalClientPaid = damages.reduce((s, d) => s + (Number(d.clientPaid) || 0), 0);
              const totalFirmPaid = damages.reduce((s, d) => s + (Number(d.firmPaid) || 0), 0);
              return damages.length > 0 && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Billed:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#0369a1" }}>${totalBilled.toLocaleString()}</span></div>
                  {totalReduction > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Reduction:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>−${totalReduction.toLocaleString()}</span></div>}
                  {totalInsPaid > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Ins. Paid:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#0369a1" }}>−${totalInsPaid.toLocaleString()}</span></div>}
                  {totalWriteOff > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Write-off:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>−${totalWriteOff.toLocaleString()}</span></div>}
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Owed:</span> <span style={{ fontSize: 14, fontWeight: 700, color: totalCalcOwed > 0 ? "#dc2626" : "#16a34a" }}>${totalCalcOwed.toLocaleString()}</span></div>
                  {totalClientPaid > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Client Paid:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>${totalClientPaid.toLocaleString()}</span></div>}
                  {totalFirmPaid > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Firm Paid:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>${totalFirmPaid.toLocaleString()}</span></div>}
                </div>
              );
            })()}
            {!piDataLoading && damages.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No damages recorded yet.</div>}
            {damages.map(d => {
              const billed = Number(d.billed) || 0;
              const rv = Number(d.reductionValue) || 0;
              const reductionAmt = d.reductionIsPercent ? billed * rv / 100 : rv;
              const insPaid = Number(d.insurancePaid) || 0;
              const wo = Number(d.writeOff) || 0;
              const calcOwed = Math.max(0, billed - reductionAmt - insPaid - wo);
              const saveDmg = (updates) => apiUpdateDamage(c.id, d.id, updates).then(u => setDamages(p => p.map(x => x.id === d.id ? u : x))).catch(err => console.error("Damage save failed:", err));
              const updateLocal = (field, val) => setDamages(p => p.map(x => x.id === d.id ? { ...x, [field]: val } : x));
              const isDmgExpanded = expandedDamageId === d.id;
              const dmgCategory = d.category === "Medical Bills" ? "Medical Bill" : d.category;
              return (
              <div key={`${d.id}-${d.reductionIsPercent}`} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", cursor: "pointer", gap: 12, background: isDmgExpanded ? "var(--c-bg2)" : "var(--c-bg)" }}
                  onClick={() => setExpandedDamageId(isDmgExpanded ? null : d.id)}>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{d.name || "Untitled"}</span>
                    <span style={{ fontSize: 12, color: "var(--c-text3)" }}>{dmgCategory || "Other"}</span>
                    <span style={{ fontSize: 12, color: "var(--c-text3)" }}>Billed: <span style={{ fontWeight: 600 }}>${billed.toLocaleString()}</span></span>
                    <span style={{ fontSize: 12, color: "var(--c-text3)" }}>Owed: <span style={{ fontWeight: 600, color: calcOwed > 0 ? "#dc2626" : "#16a34a" }}>${calcOwed.toLocaleString()}</span></span>
                    {reductionAmt > 0 && <span style={{ fontSize: 12, color: "#7c3aed" }}>Reduction: −${reductionAmt.toLocaleString()}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 12, padding: 2 }}
                      onClick={async (e) => { e.stopPropagation(); if (!await confirmDelete()) return; apiDeleteDamage(c.id, d.id).then(() => setDamages(p => p.filter(x => x.id !== d.id))).catch(e2 => alert(e2.message)); }}>✕</button>
                    {isDmgExpanded ? <ChevronUp size={14} style={{ color: "var(--c-text3)" }} /> : <ChevronDown size={14} style={{ color: "var(--c-text3)" }} />}
                  </div>
                </div>
                {isDmgExpanded && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--c-border2)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", marginTop: 10 }}>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Name</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          placeholder="e.g. ER Visit, Lost Wages" value={d.name || ""} onChange={e => updateLocal("name", e.target.value)} onBlur={e => saveDmg({ name: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Category</label>
                        <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                          value={dmgCategory || "Other"} onChange={e => { updateLocal("category", e.target.value); saveDmg({ category: e.target.value }); }}>
                          {["Medical Bill", "Lost Wages", "Future Medical", "Future Lost Earnings", "Property Damage", "Pain & Suffering", "Loss of Consortium", "Punitive", "Other"].map(o => <option key={o}>{o}</option>)}
                        </select></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Status</label>
                        <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                          value={d.documentationStatus || d.documentation_status || "Pending"} onChange={e => { updateLocal("documentationStatus", e.target.value); saveDmg({ documentationStatus: e.target.value }); }}>
                          {["Documented", "Pending", "Estimated"].map(o => <option key={o}>{o}</option>)}
                        </select></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Amount</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.amount ?? ""} onChange={e => updateLocal("amount", e.target.value)} onBlur={e => saveDmg({ amount: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Billed</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.billed ?? ""} onChange={e => updateLocal("billed", e.target.value)} onBlur={e => saveDmg({ billed: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Reduction {d.reductionIsPercent ? "(%)" : "($)"}</label>
                        <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                          <input type="number" placeholder={d.reductionIsPercent ? "e.g. 25" : "0.00"} style={{ flex: 1, fontSize: 13, padding: "4px 8px", borderRadius: "4px 0 0 4px", border: "1px solid var(--c-border)", borderRight: "none", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box", minWidth: 60, width: "100%" }}
                            value={d.reductionValue ?? ""} onChange={e => updateLocal("reductionValue", e.target.value)} onBlur={e => saveDmg({ reductionValue: e.target.value })} />
                          <select style={{ fontSize: 12, padding: "4px 6px", borderRadius: "0 4px 4px 0", border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                            value={d.reductionIsPercent ? "%" : "$"} onChange={e => saveDmg({ reductionIsPercent: e.target.value === "%" })}>
                            <option value="$">$</option><option value="%">%</option>
                          </select>
                        </div>
                        {d.reductionIsPercent && rv > 0 && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>= ${reductionAmt.toLocaleString()}</div>}
                      </div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Insurance Paid</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.insurancePaid ?? ""} onChange={e => updateLocal("insurancePaid", e.target.value)} onBlur={e => saveDmg({ insurancePaid: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Write-off</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.writeOff ?? ""} onChange={e => updateLocal("writeOff", e.target.value)} onBlur={e => saveDmg({ writeOff: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Client Paid</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.clientPaid ?? ""} onChange={e => updateLocal("clientPaid", e.target.value)} onBlur={e => saveDmg({ clientPaid: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Firm Paid</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.firmPaid ?? ""} onChange={e => updateLocal("firmPaid", e.target.value)} onBlur={e => saveDmg({ firmPaid: e.target.value })} /></div>
                      <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Description</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={d.description || ""} onChange={e => updateLocal("description", e.target.value)} onBlur={e => saveDmg({ description: e.target.value })} /></div>
                    </div>
                  </div>
                )}
              </div>
            ); })}

            <div style={{ borderTop: "1px solid var(--c-border)", margin: "24px 0 24px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>Liens ({liens.length})</div>
              <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={async () => {
                try {
                  const saved = await apiCreateLien(c.id, { lienType: "Medical", lienholderName: "", amount: "", negotiatedAmount: "", status: "Pending", notes: "" });
                  setLiens(p => [...p, saved]);
                } catch (err) { alert("Failed: " + err.message); }
              }}>+ Add Lien</button>
            </div>
            {(() => {
              const totalOwed = liens.reduce((s, l) => s + (Number(l.amount) || 0), 0);
              const totalNeg = liens.reduce((s, l) => s + (Number(l.negotiatedAmount || l.negotiated_amount) || 0), 0);
              const totalReduction = liens.reduce((s, l) => {
                const rv = Number(l.reductionValue) || 0;
                if (!rv) return s;
                return s + (l.reductionIsPercent ? (Number(l.amount) || 0) * rv / 100 : rv);
              }, 0);
              return liens.length > 0 && (
                <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Total Liens:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>${totalOwed.toLocaleString()}</span></div>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Negotiated:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>${totalNeg.toLocaleString()}</span></div>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Savings:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>${(totalOwed - totalNeg).toLocaleString()}</span></div>
                  {totalReduction > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Reduction:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>${totalReduction.toLocaleString()}</span></div>}
                </div>
              );
            })()}
            {liens.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No liens recorded yet.</div>}
            {liens.map(l => {
              const updateLienLocal = (field, val) => setLiens(prev => prev.map(x => x.id === l.id ? { ...x, [field]: val } : x));
              const saveLien = (updates) => apiUpdateLien(c.id, l.id, updates).then(u => setLiens(prev => prev.map(x => x.id === l.id ? u : x))).catch(err => console.error("Lien save failed:", err));
              return (
              <div key={`${l.id}-${l.reductionIsPercent}`} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", flex: 1 }}>
                    <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Lien Type</label>
                      <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                        value={l.lienType || l.lien_type || "Medical"} onChange={e => { updateLienLocal("lienType", e.target.value); saveLien({ lienType: e.target.value }); }}>
                        {["Medical", "Medicare", "Medicaid", "Health Insurance", "ERISA", "VA", "Child Support", "Workers Comp", "Attorney", "Other"].map(o => <option key={o}>{o}</option>)}
                      </select></div>
                    <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Lienholder</label>
                      <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                        value={l.lienholderName || l.lienholder_name || ""} onChange={e => updateLienLocal("lienholderName", e.target.value)} onBlur={e => saveLien({ lienholderName: e.target.value })} /></div>
                    <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Amount</label>
                      <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                        value={l.amount || ""} onChange={e => updateLienLocal("amount", e.target.value)} onBlur={e => saveLien({ amount: e.target.value })} /></div>
                    <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Negotiated Amount</label>
                      <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                        value={l.negotiatedAmount || l.negotiated_amount || ""} onChange={e => updateLienLocal("negotiatedAmount", e.target.value)} onBlur={e => saveLien({ negotiatedAmount: e.target.value })} /></div>
                    <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Status</label>
                      <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                        value={l.status || "Pending"} onChange={e => { updateLienLocal("status", e.target.value); saveLien({ status: e.target.value }); }}>
                        {["Pending", "Confirmed", "Negotiated", "Satisfied", "Disputed"].map(o => <option key={o}>{o}</option>)}
                      </select></div>
                    <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Reduction {l.reductionIsPercent ? "(%)" : "($)"}</label>
                      <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                        <input type="number" placeholder={l.reductionIsPercent ? "e.g. 25" : "0.00"} style={{ flex: 1, fontSize: 13, padding: "4px 8px", borderRadius: "4px 0 0 4px", border: "1px solid var(--c-border)", borderRight: "none", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box", minWidth: 60, width: "100%" }}
                          value={l.reductionValue || ""} onChange={e => updateLienLocal("reductionValue", e.target.value)} onBlur={e => saveLien({ reductionValue: e.target.value })} />
                        <select style={{ fontSize: 12, padding: "4px 6px", borderRadius: "0 4px 4px 0", border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                          value={l.reductionIsPercent ? "%" : "$"} onChange={e => { updateLienLocal("reductionIsPercent", e.target.value === "%"); saveLien({ reductionIsPercent: e.target.value === "%" }); }}>
                          <option value="$">$</option><option value="%">%</option>
                        </select>
                      </div>
                      {l.reductionIsPercent && (Number(l.reductionValue) || 0) > 0 && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>= ${((Number(l.amount) || 0) * (Number(l.reductionValue) || 0) / 100).toLocaleString()}</div>}
                    </div>
                  </div>
                  <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 14, marginLeft: 8 }}
                    onClick={async () => { if (!await confirmDelete()) return; apiDeleteLien(c.id, l.id).then(() => setLiens(p => p.filter(x => x.id !== l.id))).catch(e => alert(e.message)); }}>✕</button>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* ── Expenses Tab ── */}
        {activeTab === "expenses" && (
          <div className="case-overlay-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>Case Expenses ({(expenses || []).length})</div>
              <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "1px solid #1E2A3A", fontSize: 11, padding: "2px 10px" }} onClick={async () => {
                try {
                  const saved = await apiCreateExpense(c.id, { category: "Filing Fees", description: "", amount: "", date: new Date().toISOString().slice(0, 10), vendor: "", status: "Pending", notes: "" });
                  setExpandedExpenseId(saved.id);
                  setExpenses(p => [...(p || []), saved]);
                } catch (err) { alert("Failed: " + err.message); }
              }}>+ Add Expense</button>
            </div>
            {(() => {
              const total = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
              return (expenses || []).length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 24 }}>
                  <div><span style={{ fontSize: 11, color: "#64748b" }}>Total Expenses:</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>${total.toLocaleString()}</span></div>
                </div>
              );
            })()}
            {(expenses || []).length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No expenses recorded yet.</div>}
            {(expenses || []).map(exp => {
              const isExpExpanded = expandedExpenseId === exp.id;
              const expAmt = Number(exp.amount) || 0;
              const updateExpLocal = (field, val) => setExpenses(prev => prev.map(x => x.id === exp.id ? { ...x, [field]: val } : x));
              const saveExp = (updates) => apiUpdateExpense(c.id, exp.id, updates).then(u => setExpenses(p => p.map(x => x.id === exp.id ? u : x))).catch(err => console.error("Expense save failed:", err));
              return (
              <div key={exp.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", cursor: "pointer", gap: 12, background: isExpExpanded ? "var(--c-bg2)" : "var(--c-bg)" }}
                  onClick={() => setExpandedExpenseId(isExpExpanded ? null : exp.id)}>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{exp.category || "Other"}</span>
                    {exp.vendor && <span style={{ fontSize: 12, color: "var(--c-text3)" }}>{exp.vendor}</span>}
                    <span style={{ fontSize: 12, color: "var(--c-text3)" }}>${expAmt.toLocaleString()}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: exp.status === "Paid" ? "#dcfce7" : exp.status === "Reimbursed" ? "#dbeafe" : exp.status === "Waived" ? "#f1f5f9" : "#fef3c7", color: exp.status === "Paid" ? "#16a34a" : exp.status === "Reimbursed" ? "#1e40af" : exp.status === "Waived" ? "#64748b" : "#a16207" }}>{exp.status || "Pending"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 12, padding: 2 }}
                      onClick={async (e) => { e.stopPropagation(); if (!await confirmDelete()) return; apiDeleteExpense(c.id, exp.id).then(() => setExpenses(p => p.filter(x => x.id !== exp.id))).catch(e2 => alert(e2.message)); }}>✕</button>
                    {isExpExpanded ? <ChevronUp size={14} style={{ color: "var(--c-text3)" }} /> : <ChevronDown size={14} style={{ color: "var(--c-text3)" }} />}
                  </div>
                </div>
                {isExpExpanded && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--c-border2)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", marginTop: 10 }}>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Category</label>
                        <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                          value={exp.category || "Other"} onChange={e => { updateExpLocal("category", e.target.value); saveExp({ category: e.target.value }); }}>
                          {["Filing Fees", "Expert Fees", "Court Reporter", "Medical Records", "Process Server", "Travel", "Postage", "Copies", "Investigation", "Deposition", "Other"].map(o => <option key={o}>{o}</option>)}
                        </select></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Amount</label>
                        <input type="number" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={exp.amount || ""} onChange={e => updateExpLocal("amount", e.target.value)} onBlur={e => saveExp({ amount: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Date</label>
                        <input type="date" style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={exp.date || ""} onChange={e => updateExpLocal("date", e.target.value)} onBlur={e => saveExp({ date: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Vendor</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={exp.vendor || ""} onChange={e => updateExpLocal("vendor", e.target.value)} onBlur={e => saveExp({ vendor: e.target.value })} /></div>
                      <div><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Status</label>
                        <select style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}
                          value={exp.status || "Pending"} onChange={e => { updateExpLocal("status", e.target.value); saveExp({ status: e.target.value }); }}>
                          {["Pending", "Paid", "Reimbursed", "Waived"].map(o => <option key={o}>{o}</option>)}
                        </select></div>
                      <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 11, color: "var(--c-text3)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Description</label>
                        <input style={{ width: "100%", fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }}
                          value={exp.description || ""} onChange={e => updateExpLocal("description", e.target.value)} onBlur={e => saveExp({ description: e.target.value })} /></div>
                    </div>
                  </div>
                )}
              </div>
            ); })}
          </div>
        )}


        {/* ── Files Tab ── */}
        {activeTab === "files" && (
          <div className="case-overlay-body">
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 12, borderBottom: "1px solid var(--c-border2)" }}>
              <button onClick={() => setDocsSubTab("documents")} style={{ padding: "8px 16px", fontSize: 13, fontWeight: docsSubTab === "documents" ? 600 : 400, color: docsSubTab === "documents" ? "#1e3a5f" : "#64748b", background: "transparent", border: "none", borderBottom: docsSubTab === "documents" ? "2px solid #1e3a5f" : "2px solid transparent", cursor: "pointer" }}>
                Documents {caseDocuments.length > 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({caseDocuments.length})</span>}
              </button>
              <button onClick={() => setDocsSubTab("transcripts")} style={{ padding: "8px 16px", fontSize: 13, fontWeight: docsSubTab === "transcripts" ? 600 : 400, color: docsSubTab === "transcripts" ? "#1e3a5f" : "#64748b", background: "transparent", border: "none", borderBottom: docsSubTab === "transcripts" ? "2px solid #1e3a5f" : "2px solid transparent", cursor: "pointer" }}>
                Transcripts {transcripts.length > 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({transcripts.length})</span>}
              </button>
            </div>

            {docsSubTab === "documents" && (<>
            <div className="case-overlay-section">
              <div className="case-overlay-section-title" style={{ marginBottom: 12 }}>Upload Document</div>
              <DragDropZone accept=".pdf,.docx,.doc,.txt" onFileSelect={(files) => {
                const fileInput = document.getElementById("doc-upload-file-input");
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
                const bg = startBackgroundUpload(file.name);
                fileInput.value = "";
                try {
                  let saved;
                  if (file.size > 20 * 1024 * 1024) {
                    saved = await apiUploadCaseDocumentChunked(file, c.id, docUploadType, (pct) => bg.updateProgress(pct));
                  } else {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("caseId", c.id);
                    formData.append("docType", docUploadType);
                    saved = await apiUploadCaseDocument(formData);
                  }
                  setCaseDocuments(prev => [saved, ...prev]);
                  log("Document Uploaded", `${saved.filename} (${saved.docType})`);
                  bg.markDone();
                } catch (err) { bg.markError(err.message); }
              }} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>File (PDF, DOCX, DOC, TXT) — or drag & drop</label>
                  <input id="doc-upload-file-input" type="file" accept=".pdf,.docx,.doc,.txt" style={{ fontSize: 12, width: "100%" }} />
                  {docUploadProgress !== null && <div style={{ marginTop: 4, fontSize: 11, color: "#6366f1" }}>Uploading: {docUploadProgress}%</div>}
                </div>
                <div style={{ minWidth: 160 }}>
                  <label style={{ fontSize: 11, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Document Type</label>
                  <select value={docUploadType} onChange={e => setDocUploadType(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 5, border: "1px solid var(--c-border)", width: "100%", background: "var(--c-bg)", color: "var(--c-text)" }}>
                    {["Medical Records", "Police/Accident Report", "Insurance Correspondence", "Demand Letter", "Settlement Agreement", "Expert Report", "Witness Statement", "Discovery Material", "Billing Records", "Deposition Transcript", "Court Order", "Photograph/Video", "Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-gold btn-sm" disabled={docUploadProgress !== null}>{docUploadProgress !== null ? `${docUploadProgress}%` : "Upload"}</button>
                <div style={{ position: "relative" }}>
                  <input id="doc-folder-upload-input" type="file" multiple webkitdirectory="" directory="" style={{ display: "none" }}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      if (!files.length) return;
                      const validExts = [".pdf", ".docx", ".doc", ".txt"];
                      const validFiles = files.filter(f => validExts.some(ext => f.name.toLowerCase().endsWith(ext)));
                      if (!validFiles.length) { alert("No supported files found in folder (PDF, DOCX, DOC, TXT)."); return; }
                      const firstPath = (files[0].webkitRelativePath || "");
                      const folderName = firstPath.split("/")[0] || "Uploaded Folder";
                      try {
                        const folder = await apiCreateDocFolder(c.id, folderName);
                        setDocFolders(prev => [...prev, folder]);
                        for (const file of validFiles) {
                          const bg = startBackgroundUpload(file.name);
                          try {
                            let saved;
                            if (file.size > 20 * 1024 * 1024) {
                              saved = await apiUploadCaseDocumentChunked(file, c.id, docUploadType, (pct) => bg.updateProgress(pct), folder.id);
                            } else {
                              const formData = new FormData();
                              formData.append("file", file);
                              formData.append("caseId", c.id);
                              formData.append("docType", docUploadType);
                              formData.append("folderId", folder.id);
                              saved = await apiUploadCaseDocument(formData);
                            }
                            setCaseDocuments(prev => [saved, ...prev]);
                            log("Document Uploaded", `${saved.filename} → ${folderName}`);
                            bg.markDone();
                          } catch (err) { bg.markError(err.message); }
                        }
                      } catch (err) { alert("Failed to create folder: " + err.message); }
                    }}
                  />
                  <button type="button" className="btn btn-sm" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, padding: "5px 10px", borderRadius: 5 }}
                    onClick={() => document.getElementById("doc-folder-upload-input")?.click()}>
                    <FolderPlus size={13} /> Upload Folder
                  </button>
                </div>
                {caseMsConnected && (
                  <button type="button" className="btn btn-sm" style={{ background: "#0078d4", border: "none", color: "white", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, padding: "5px 10px", borderRadius: 5 }}
                    onClick={() => { setShowOneDriveImport(true); setOneDriveLink(""); setOneDriveItems([]); setOneDriveSelected(new Set()); setOneDriveError(""); }}>
                    <Download size={13} /> Import from OneDrive
                  </button>
                )}
              </form>
              </DragDropZone>
            </div>

            {showOneDriveImport && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => !oneDriveImporting && setShowOneDriveImport(false)}>
                <div style={{ background: "var(--c-card)", borderRadius: 12, width: "90%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>Import from OneDrive</div>
                    <button onClick={() => !oneDriveImporting && setShowOneDriveImport(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
                  </div>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--c-border)" }}>
                    <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Paste a OneDrive sharing link:</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="text" placeholder="https://1drv.ms/... or https://onedrive.live.com/..." value={oneDriveLink} onChange={e => setOneDriveLink(e.target.value)} disabled={oneDriveLoading || oneDriveImporting}
                        style={{ flex: 1, fontSize: 12, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }} />
                      <button className="btn btn-sm" disabled={!oneDriveLink.trim() || oneDriveLoading || oneDriveImporting} style={{ background: "#0078d4", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                        onClick={async () => {
                          setOneDriveLoading(true); setOneDriveError(""); setOneDriveItems([]); setOneDriveSelected(new Set());
                          try {
                            const result = await apiResolveOneDriveLink(oneDriveLink.trim());
                            const files = (result.items || []).filter(i => i.isFile);
                            if (!files.length) { setOneDriveError("No files found at this link."); }
                            else { setOneDriveItems(files); setOneDriveSelected(new Set(files.map((_, i) => i))); }
                          } catch (err) { setOneDriveError(err.message || "Failed to resolve link"); }
                          setOneDriveLoading(false);
                        }}>
                        {oneDriveLoading ? "Loading..." : "Resolve"}
                      </button>
                    </div>
                    {oneDriveError && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{oneDriveError}</div>}
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", minHeight: 100 }}>
                    {oneDriveLoading && <div style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 12 }}>Resolving link...</div>}
                    {!oneDriveLoading && oneDriveItems.length === 0 && !oneDriveError && <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>Paste a OneDrive link above to see available files.</div>}
                    {!oneDriveLoading && oneDriveItems.length > 0 && (
                      <>
                        <div style={{ padding: "8px 20px", borderBottom: "1px solid var(--c-border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{oneDriveItems.length} file{oneDriveItems.length !== 1 ? "s" : ""} found</span>
                          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => {
                            if (oneDriveSelected.size === oneDriveItems.length) setOneDriveSelected(new Set());
                            else setOneDriveSelected(new Set(oneDriveItems.map((_, i) => i)));
                          }}>{oneDriveSelected.size === oneDriveItems.length ? "Deselect All" : "Select All"}</button>
                        </div>
                        {oneDriveItems.map((item, i) => (
                          <div key={item.id} onClick={() => !oneDriveImporting && setOneDriveSelected(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                            style={{ padding: "10px 20px", borderBottom: "1px solid var(--c-border2)", cursor: oneDriveImporting ? "default" : "pointer", display: "flex", gap: 10, alignItems: "center", background: oneDriveSelected.has(i) ? "#eff6ff" : "transparent" }}>
                            <input type="checkbox" checked={oneDriveSelected.has(i)} readOnly disabled={oneDriveImporting} style={{ accentColor: "#0078d4" }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{item.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{fmtFileSize(item.size)}{item.mimeType ? ` · ${item.mimeType.split("/").pop()}` : ""}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  {oneDriveImporting && (
                    <div style={{ padding: "8px 20px", background: "#eff6ff", borderTop: "1px solid var(--c-border)" }}>
                      <div style={{ fontSize: 12, color: "#0078d4", fontWeight: 600, marginBottom: 4 }}>Importing: {oneDriveProgress.done} of {oneDriveProgress.total}</div>
                      <div style={{ height: 6, borderRadius: 3, background: "#dbeafe" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: "#0078d4", width: `${oneDriveProgress.total ? (oneDriveProgress.done / oneDriveProgress.total * 100) : 0}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "12px 20px", borderTop: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{oneDriveSelected.size} selected</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-outline btn-sm" disabled={oneDriveImporting} onClick={() => setShowOneDriveImport(false)}>Cancel</button>
                      <button className="btn btn-sm" disabled={oneDriveSelected.size === 0 || oneDriveImporting} style={{ background: "#0078d4", color: "white", border: "none" }}
                        onClick={async () => {
                          const files = [...oneDriveSelected].map(i => oneDriveItems[i]);
                          setOneDriveImporting(true); setOneDriveProgress({ done: 0, total: files.length });
                          let imported = 0;
                          for (const file of files) {
                            try {
                              const saved = await apiImportOneDriveFile({ driveId: file.driveId, itemId: file.id, caseId: c.id, docType: docUploadType });
                              setCaseDocuments(prev => [saved, ...prev]);
                              imported++;
                              setOneDriveProgress(p => ({ ...p, done: p.done + 1 }));
                              log("Document Imported", `${file.name} from OneDrive`);
                            } catch (err) {
                              setOneDriveProgress(p => ({ ...p, done: p.done + 1 }));
                              console.error(`Failed to import ${file.name}:`, err.message);
                            }
                          }
                          setOneDriveImporting(false);
                          alert(`Imported ${imported} of ${files.length} file${files.length !== 1 ? "s" : ""} from OneDrive.`);
                          if (imported > 0) setShowOneDriveImport(false);
                        }}>
                        Import {oneDriveSelected.size} File{oneDriveSelected.size !== 1 ? "s" : ""}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="case-overlay-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>
                  Documents {caseDocuments.length > 0 && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginLeft: 6 }}>({docFilterType === "All" ? caseDocuments.length : caseDocuments.filter(d => d.docType === docFilterType).length}{docFilterType !== "All" ? ` of ${caseDocuments.length}` : ""})</span>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {caseDocuments.length > 0 && (
                    <select value={docFilterType} onChange={e => setDocFilterType(e.target.value)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}>
                      <option value="All">All Types</option>
                      {[...new Set(caseDocuments.map(d => d.docType))].sort().map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                  <button onClick={async () => { const name = prompt("Folder name:"); if (name) { try { const f = await apiCreateDocFolder(c.id, name); setDocFolders(prev => [...prev, { ...f, collapsed: true }]); } catch (err) { alert(err.message); } } }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><FolderPlus size={12} /> Folder</button>
                  {isAttorneyPlus && caseDocuments.length > 0 && (
                    <button onClick={() => { setDocSelectMode(!docSelectMode); setSelectedDocIds(new Set()); }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: docSelectMode ? "1px solid #ef4444" : "1px solid var(--c-border)", background: docSelectMode ? "#fef2f2" : "var(--c-bg)", color: docSelectMode ? "#ef4444" : "var(--c-text)", cursor: "pointer" }}>{docSelectMode ? "Cancel" : "Select"}</button>
                  )}
                </div>
              </div>
              {docSelectMode && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca", flexWrap: "wrap" }}>
                  <button onClick={() => { const filtered = caseDocuments.filter(d => docFilterType === "All" || d.docType === docFilterType); setSelectedDocIds(new Set(filtered.map(d => d.id))); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Select All</button>
                  <button onClick={() => setSelectedDocIds(new Set())} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Deselect All</button>
                  {selectedDocIds.size > 0 && (
                    <>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <select
                          defaultValue=""
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val === "") return;
                            const folderId = val === "__none__" ? null : parseInt(val);
                            const folderName = val === "__none__" ? "No Folder" : (docFolders.find(f => f.id === folderId)?.name || "folder");
                            try {
                              await apiBatchMoveDocuments([...selectedDocIds], folderId);
                              setCaseDocuments(prev => prev.map(d => selectedDocIds.has(d.id) ? { ...d, folderId } : d));
                              log("Batch Moved", `${selectedDocIds.size} documents to ${folderName}`);
                              setSelectedDocIds(new Set()); setDocSelectMode(false);
                            } catch (err) { alert("Move failed: " + err.message); }
                            e.target.value = "";
                          }}
                          style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #6366f1", background: "#eef2ff", color: "#4338ca", cursor: "pointer", fontWeight: 600 }}
                        >
                          <option value="" disabled>Move to Folder ({selectedDocIds.size})</option>
                          <option value="__none__">No Folder (Unfiled)</option>
                          {(() => {
                            const renderOpts = (parentId, depth) => docFolders.filter(f => (f.parentId || f.parent_id || null) === parentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).flatMap(f => [
                              <option key={f.id} value={f.id}>{"  ".repeat(depth)}{depth > 0 ? "└ " : ""}{f.name}</option>,
                              ...renderOpts(f.id, depth + 1)
                            ]);
                            return renderOpts(null, 0);
                          })()}
                        </select>
                      </div>
                      <button onClick={async () => {
                        if (!await confirmDelete()) return;
                        try {
                          await apiBatchDeleteDocuments([...selectedDocIds]);
                          setCaseDocuments(prev => prev.filter(d => !selectedDocIds.has(d.id)));
                          log("Batch Deleted", `${selectedDocIds.size} documents`);
                          setSelectedDocIds(new Set()); setDocSelectMode(false);
                        } catch (err) { alert("Batch delete failed: " + err.message); }
                      }} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 4, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete Selected ({selectedDocIds.size})</button>
                    </>
                  )}
                </div>
              )}
              {docsLoading && <div style={{ fontSize: 12, color: "#64748b", padding: "12px 0" }}>Loading...</div>}
              {!docsLoading && caseDocuments.length === 0 && <div className="empty" style={{ fontSize: 12 }}>No documents uploaded yet</div>}
              {(() => {
                const renderDocRow = (doc) => {
                  const isDocEditing = editingDocId === doc.id;
                  return (
                    <div key={doc.id} style={{ borderBottom: "1px solid var(--c-border)", padding: "12px 0" }} draggable={!docSelectMode && !expandedDocId} onDragStart={e => { if (window.getSelection()?.toString()) { e.preventDefault(); return; } e.dataTransfer.setData("docId", String(doc.id)); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {docSelectMode && <input type="checkbox" checked={selectedDocIds.has(doc.id)} onChange={e => { const next = new Set(selectedDocIds); if (e.target.checked) next.add(doc.id); else next.delete(doc.id); setSelectedDocIds(next); }} style={{ width: 16, height: 16, flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isDocEditing ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <input value={editingDocData.filename || ""} onChange={e => setEditingDocData(d => ({ ...d, filename: e.target.value }))} style={{ fontSize: 13, fontWeight: 500, padding: "3px 6px", borderRadius: 4, border: "1px solid #3B82F6", flex: 1, minWidth: 120 }} />
                              <select value={editingDocData.docType || "Other"} onChange={e => setEditingDocData(d => ({ ...d, docType: e.target.value }))} style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid #3B82F6" }}>
                                {["Medical Records", "Police/Accident Report", "Insurance Correspondence", "Demand Letter", "Settlement Agreement", "Expert Report", "Witness Statement", "Discovery Material", "Billing Records", "Deposition Transcript", "Court Order", "Photograph/Video", "Other"].map(t => <option key={t}>{t}</option>)}
                              </select>
                              <button onClick={async () => { try { const updated = await apiUpdateCaseDocument(doc.id, editingDocData); setCaseDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, filename: updated.filename, docType: updated.docType } : d)); log("Document edited", editingDocData.filename); setEditingDocId(null); } catch (err) { alert("Save failed: " + err.message); } }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #059669", background: "#D1FAE5", color: "#065F46", cursor: "pointer", fontWeight: 600 }}>Save</button>
                              <button onClick={() => setEditingDocId(null)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer" }}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "#2563eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.15s" }} onClick={() => openAppDocViewer(doc.id, doc.filename, doc.contentType, c.id)} onMouseEnter={e => e.currentTarget.style.textDecorationColor = "#2563eb"} onMouseLeave={e => e.currentTarget.style.textDecorationColor = "transparent"} title="Click to view">{doc.filename}</div>
                                <button onClick={() => { setEditingDocId(doc.id); setEditingDocData({ filename: doc.filename, docType: doc.docType }); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--c-text3)", display: "inline-flex", flexShrink: 0 }} title="Edit name/type"><Pencil size={11} /></button>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--c-text2)", marginTop: 2 }}>
                                {doc.source === "client" && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#dbeafe", color: "#1d4ed8", fontWeight: 600, marginRight: 6 }}>Client Upload</span>}
                                <span style={{ cursor: "pointer" }} onClick={() => { setEditingDocId(doc.id); setEditingDocData({ filename: doc.filename, docType: doc.docType }); }} title="Click to edit">{doc.docType}</span> · {fmtFileSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()}{doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                              </div>
                            </>
                          )}
                        </div>
                        {!isDocEditing && !docSelectMode && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                            {doc.ocrStatus === "processing" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7c3aed", fontWeight: 500, padding: "4px 10px", borderRadius: 6, background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                                <Loader2 size={12} className="animate-spin" style={{ color: "#7c3aed" }} /> Reading Document...
                              </span>
                            )}
                            <button className="border border-blue-300 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors bg-transparent cursor-pointer" onClick={() => openAppDocViewer(doc.id, doc.filename, doc.contentType, c.id)}>
                              <Eye size={12} className="inline mr-1" />View
                            </button>
                            <button className="border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer" onClick={async () => { try { const blob = await apiDownloadDocument(doc.id); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = doc.filename; a.click(); URL.revokeObjectURL(url); } catch (err) { alert("Download failed: " + err.message); } }}>Download</button>
                            {doc.ocrStatus === "complete" && doc.hasText && (
                              <button className="border border-yellow-300 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors bg-transparent cursor-pointer" disabled={docSummarizing === doc.id} onClick={async () => { setDocSummarizing(doc.id); try { const { summary } = await apiSummarizeDocument(doc.id); setCaseDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, summary } : d)); setExpandedDocId(doc.id); } catch (err) { alert("Summarize failed: " + err.message); } setDocSummarizing(null); }}>{docSummarizing === doc.id ? "Summarizing..." : (doc.summary ? "Re-summarize" : <><Sparkles size={10} className="inline mr-0.5" /> Summarize</>)}</button>
                            )}
                            <button className="border border-red-300 dark:border-red-800/50 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors bg-transparent cursor-pointer" onClick={async () => { if (!await confirmDelete()) return; try { await apiDeleteCaseDocument(doc.id); setCaseDocuments(prev => prev.filter(d => d.id !== doc.id)); log("Document Deleted", doc.filename); } catch (err) { alert("Delete failed: " + err.message); } }}>Delete</button>
                          </div>
                        )}
                      </div>
                      {doc.summary && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)} className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium bg-transparent border-none cursor-pointer p-0">
                            {expandedDocId === doc.id ? "▾ Hide Summary" : "▸ View Summary"}
                          </button>
                          {expandedDocId === doc.id && (
                            <AiPanel title="Document Summary" result={doc.summary}
                              actions={<button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => navigator.clipboard.writeText(doc.summary)}>Copy</button>}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                };
                const filteredDocs = caseDocuments.filter(d => docFilterType === "All" || d.docType === docFilterType);
                const clientDocs = filteredDocs.filter(d => d.source === "client");
                const firmDocs = filteredDocs.filter(d => d.source !== "client");
                const renderDocSection = (docs, sectionLabel, sectionStyle) => {
                  if (docs.length === 0) return null;
                  const sectionUnfiled = docs.filter(d => !d.folderId);
                  return (
                    <div style={{ marginBottom: 16, ...sectionStyle }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sectionLabel === "Client Provided Documents" ? "#1d4ed8" : "#1e293b", padding: "8px 12px", marginBottom: 8, borderRadius: 6, background: sectionLabel === "Client Provided Documents" ? "#dbeafe" : "#f1f5f9", border: sectionLabel === "Client Provided Documents" ? "1px solid #93c5fd" : "1px solid #e2e8f0" }}>
                        {sectionLabel} <span style={{ fontSize: 11, fontWeight: 400, color: sectionLabel === "Client Provided Documents" ? "#3b82f6" : "#64748b" }}>({docs.length})</span>
                      </div>
                      {(() => {
                        const renderFolder = (folder, depth = 0) => {
                          const folderItems = docs.filter(d => d.folderId === folder.id);
                          const childFolders = docFolders.filter(f => (f.parentId || f.parent_id) === folder.id).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                          const totalCount = folderItems.length + childFolders.reduce((sum, cf) => sum + docs.filter(d => d.folderId === cf.id).length, 0);
                          return (
                            <div key={`folder-${folder.id}-${sectionLabel}`} style={{ marginBottom: depth > 0 ? 4 : 8, border: "1px solid var(--c-border)", borderRadius: 6, overflow: "hidden", marginLeft: depth > 0 ? 16 : 0 }}
                              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.outline = "2px solid #6366f1"; }}
                              onDragLeave={e => { e.currentTarget.style.outline = ""; }}
                              onDrop={async e => { e.stopPropagation(); e.currentTarget.style.outline = ""; const docId = e.dataTransfer.getData("docId"); if (docId) { try { await apiMoveDocument(parseInt(docId), folder.id); setCaseDocuments(prev => prev.map(d => d.id === parseInt(docId) ? { ...d, folderId: folder.id } : d)); } catch (err) { alert(err.message); } } }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--c-bg2)", cursor: "pointer", userSelect: "none" }} onClick={() => setDocFolders(prev => prev.map(f => f.id === folder.id ? { ...f, collapsed: !f.collapsed } : f))}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <FolderOpen size={14} style={{ color: depth > 0 ? "#8b5cf6" : "#6366f1" }} />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>{folder.name}</span>
                                  <span style={{ fontSize: 10, color: "#94a3b8" }}>({totalCount})</span>
                                </div>
                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                  <button onClick={e => { e.stopPropagation(); const name = prompt("Subfolder name:"); if (name) { apiCreateDocFolder(c.id, name, folder.id).then(f => setDocFolders(prev => [...prev, { ...f, collapsed: true }])).catch(err => alert(err.message)); } }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94a3b8" }} title="Add subfolder"><FolderPlus size={11} /></button>
                                  <button onClick={e => { e.stopPropagation(); const name = prompt("Rename folder:", folder.name); if (name && name !== folder.name) { apiUpdateDocFolder(folder.id, { name }).then(u => setDocFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name: u.name } : f))).catch(err => alert(err.message)); } }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94a3b8" }}><Pencil size={11} /></button>
                                  <button onClick={async e => { e.stopPropagation(); if (!await confirmDelete()) return; apiDeleteDocFolder(folder.id).then(() => { const descendantIds = docFolders.filter(f => (f.parentId || f.parent_id) === folder.id).map(f => f.id); setDocFolders(prev => prev.filter(f => f.id !== folder.id && !descendantIds.includes(f.id))); setCaseDocuments(prev => prev.map(d => d.folderId === folder.id || descendantIds.includes(d.folderId) ? { ...d, folderId: null } : d)); }).catch(err => alert(err.message)); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94a3b8" }}><Trash2 size={11} /></button>
                                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{folder.collapsed ? "▶" : "▼"}</span>
                                </div>
                              </div>
                              {!folder.collapsed && (
                                <div style={{ padding: "0 4px 4px" }}>
                                  {childFolders.map(cf => renderFolder(cf, depth + 1))}
                                  {folderItems.length > 0 && folderItems.map(doc => renderDocRow(doc))}
                                  {folderItems.length === 0 && childFolders.length === 0 && <div style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Empty — drag documents here</div>}
                                </div>
                              )}
                            </div>
                          );
                        };
                        const topFolders = docFolders.filter(f => !(f.parentId || f.parent_id)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                        return topFolders.map(folder => renderFolder(folder));
                      })()}
                      {docFolders.length > 0 && sectionUnfiled.length > 0 && (
                        <div style={{ marginTop: 8 }}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = "#f0f9ff"; }}
                          onDragLeave={e => { e.currentTarget.style.background = ""; }}
                          onDrop={async e => { e.currentTarget.style.background = ""; const docId = e.dataTransfer.getData("docId"); if (docId) { try { await apiMoveDocument(parseInt(docId), null); setCaseDocuments(prev => prev.map(d => d.id === parseInt(docId) ? { ...d, folderId: null } : d)); } catch (err) { alert(err.message); } } }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid var(--c-border2)" }}>Unfiled</div>
                          {sectionUnfiled.map(doc => renderDocRow(doc))}
                        </div>
                      )}
                      {docFolders.length === 0 && sectionUnfiled.map(doc => renderDocRow(doc))}
                    </div>
                  );
                };
                return (<>
                  {renderDocSection(clientDocs, "Client Provided Documents", {})}
                  {renderDocSection(firmDocs, "Firm Documents", {})}
                  {clientDocs.length === 0 && firmDocs.length === 0 && null}
                </>);
              })()}
            </div>
            </>)}

            {docsSubTab === "transcripts" && (<>
            <div className="case-overlay-section">
              <div className="case-overlay-section-title" style={{ marginBottom: 12 }}>Upload Audio / Video</div>
              <DragDropZone accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.aac,.flac,.mov,.avi,audio/*,video/*" onFileSelect={(files) => {
                const fileInput = document.getElementById("transcript-upload-file-input");
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
                const bg = startBackgroundUpload(file.name);
                fileInput.value = "";
                setTranscriptUploading(true);
                try {
                  let saved;
                  if (file.size > 20 * 1024 * 1024) {
                    saved = await apiUploadTranscriptChunked(file, c.id, (pct) => bg.updateProgress(pct));
                  } else {
                    const formData = new FormData();
                    formData.append("audio", file);
                    formData.append("caseId", c.id);
                    saved = await apiUploadTranscript(formData);
                  }
                  setTranscripts(prev => [saved, ...prev]);
                  bg.markDone();
                } catch (err) { bg.markError(err.message); }
                setTranscriptUploading(false);
              }} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 11, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Audio/Video File (MP3, WAV, M4A, OGG, FLAC, AAC, WebM, MP4, MOV, AVI) — or drag & drop</label>
                  <input id="transcript-upload-file-input" type="file" accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.aac,.flac,.mov,.avi,audio/*,video/*" style={{ fontSize: 12, width: "100%" }} />
                </div>
                <button type="submit" className="btn btn-sm" disabled={transcriptUploading} style={{ background: "#1e293b", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  {transcriptUploading ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : <><Upload size={12} /> Upload & Transcribe</>}
                </button>
                {scribeConnected && (
                  <button type="button" onClick={openScribeImportModal} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
                    <Download size={12} /> Pull from Scribe
                  </button>
                )}
              </form>
              </DragDropZone>
            </div>

            {showScribeImportModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: "var(--c-bg)", borderRadius: 12, width: "90%", maxWidth: 600, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Download size={16} style={{ color: "#7c3aed" }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)" }}>Import from Scribe</span>
                    </div>
                    <button onClick={() => setShowScribeImportModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-text2)", fontSize: 18 }}>&times;</button>
                  </div>
                  <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
                    {scribeImportLoading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 40, color: "#94a3b8" }}>
                        <Loader2 size={16} className="animate-spin" /> Loading Scribe transcripts...
                      </div>
                    ) : scribeImportList.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 40 }}>No new transcripts available in Scribe to import.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{scribeImportList.length} transcript{scribeImportList.length !== 1 ? "s" : ""} available</p>
                        {scribeImportList.map(st => (
                          <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid var(--c-border2)", borderRadius: 8, gap: 12 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.filename}</div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                {st.duration ? `${Math.floor(st.duration / 60)}m ${Math.round(st.duration % 60)}s` : ""}
                                {st.duration && st.createdAt ? " · " : ""}
                                {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : ""}
                                {st.hasSummaries ? " · AI Summaries" : ""}
                              </div>
                            </div>
                            <button
                              disabled={scribeImporting === st.id}
                              onClick={() => handleScribeImport(st.id)}
                              style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: scribeImporting === st.id ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 4, opacity: scribeImporting === st.id ? 0.6 : 1, flexShrink: 0 }}
                            >
                              {scribeImporting === st.id ? <><Loader2 size={11} className="animate-spin" /> Importing...</> : <><Download size={11} /> Import</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="case-overlay-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div className="case-overlay-section-title" style={{ marginBottom: 0 }}>
                  Transcripts {transcripts.length > 0 && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginLeft: 6 }}>({transcripts.length})</span>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={async () => { const name = prompt("Folder name:"); if (name) { try { const f = await apiCreateTranscriptFolder(c.id, name); setTranscriptFolders(prev => [...prev, f]); } catch (err) { alert(err.message); } } }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><FolderPlus size={12} /> Folder</button>
                  {isAttorneyPlus && transcripts.length > 0 && (
                    <button onClick={() => { setTranscriptSelectMode(!transcriptSelectMode); setSelectedTranscriptIds(new Set()); }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: transcriptSelectMode ? "1px solid #ef4444" : "1px solid var(--c-border)", background: transcriptSelectMode ? "#fef2f2" : "var(--c-bg)", color: transcriptSelectMode ? "#ef4444" : "var(--c-text)", cursor: "pointer" }}>{transcriptSelectMode ? "Cancel" : "Select"}</button>
                  )}
                </div>
              </div>
              {transcriptSelectMode && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>
                  <button onClick={() => setSelectedTranscriptIds(new Set(transcripts.map(t => t.id)))} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Select All</button>
                  <button onClick={() => setSelectedTranscriptIds(new Set())} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Deselect All</button>
                  {selectedTranscriptIds.size > 0 && (
                    <button onClick={async () => {
                      if (!await confirmDelete()) return;
                      try {
                        await apiBatchDeleteTranscripts([...selectedTranscriptIds]);
                        setTranscripts(prev => prev.filter(t => !selectedTranscriptIds.has(t.id)));
                        log("Batch Deleted", `${selectedTranscriptIds.size} transcripts`);
                        setSelectedTranscriptIds(new Set()); setTranscriptSelectMode(false);
                      } catch (err) { alert("Batch delete failed: " + err.message); }
                    }} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 4, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete Selected ({selectedTranscriptIds.size})</button>
                  )}
                </div>
              )}
              {transcriptsLoading ? <p style={{ fontSize: 12, color: "#94a3b8" }}>Loading...</p> :
               transcripts.length === 0 ? <p style={{ fontSize: 12, color: "#94a3b8" }}>No transcripts yet. Upload an audio file above.</p> :
               <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {transcripts.map(t => (
                  <div key={t.id} style={{ border: "1px solid var(--c-border2)", borderRadius: 8, overflow: "hidden" }}>
                    <div
                      onClick={() => {
                        if (transcriptSelectMode) { const next = new Set(selectedTranscriptIds); if (next.has(t.id)) next.delete(t.id); else next.add(t.id); setSelectedTranscriptIds(next); return; }
                        if (expandedTranscriptId === t.id) {
                          setExpandedTranscriptId(null);
                          setTranscriptDetail(null);
                          setTranscriptEdits(null);
                          setSelectedSegments(new Set());
                          setMergeUndoStack([]);
                          setShowTranscriptHistory(false);
                          setTranscriptHistory([]);
                          setTranscriptReadingView(false);
                        } else if (t.status === "completed") {
                          setExpandedTranscriptId(t.id);
                          setSelectedSegments(new Set());
                          setMergeUndoStack([]);
                          setTranscriptDetailLoading(true);
                          apiGetTranscriptDetail(t.id).then(d => {
                            setTranscriptDetail(d);
                            setTranscriptEdits(JSON.parse(JSON.stringify(d.transcript)));
                          }).catch(() => {}).finally(() => setTranscriptDetailLoading(false));
                        }
                      }}
                      style={{ padding: "12px 16px", cursor: t.status === "completed" ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: expandedTranscriptId === t.id ? "var(--c-bg2)" : "transparent" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        {transcriptSelectMode && <input type="checkbox" checked={selectedTranscriptIds.has(t.id)} readOnly style={{ width: 16, height: 16, flexShrink: 0 }} />}
                        {t.isVideo ? <Video size={16} style={{ color: "#8b5cf6", flexShrink: 0 }} /> : <FileAudio size={16} style={{ color: "#6366f1", flexShrink: 0 }} />}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {editingTranscriptId === t.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                <input value={editingTranscriptData.filename || ""} onChange={e => setEditingTranscriptData(d => ({ ...d, filename: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (async () => { try { const updated = await apiUpdateTranscript(t.id, { filename: editingTranscriptData.filename, description: editingTranscriptData.description }); setTranscripts(prev => prev.map(x => x.id === t.id ? { ...x, filename: updated.filename, description: updated.description } : x)); setEditingTranscriptId(null); } catch (err) { alert("Save failed: " + err.message); } })(); } if (e.key === "Escape") setEditingTranscriptId(null); }} style={{ fontSize: 13, fontWeight: 600, padding: "3px 6px", borderRadius: 4, border: "1px solid #3B82F6", flex: 1, minWidth: 120 }} autoFocus />
                                <button disabled={suggestingTranscriptNameId === t.id} onClick={async (e) => { e.stopPropagation(); setSuggestingTranscriptNameId(t.id); try { const { suggestedName } = await apiSuggestTranscriptName(t.id); setEditingTranscriptData(d => ({ ...d, filename: suggestedName })); } catch (err) { alert("Suggest failed: " + err.message); } setSuggestingTranscriptNameId(null); }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #a78bfa", background: "#ede9fe", color: "#5b21b6", cursor: suggestingTranscriptNameId === t.id ? "wait" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, opacity: suggestingTranscriptNameId === t.id ? 0.6 : 1 }} title="AI suggest filename">{suggestingTranscriptNameId === t.id ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={10} />} Suggest</button>
                                <button onClick={async () => { try { const updated = await apiUpdateTranscript(t.id, { filename: editingTranscriptData.filename, description: editingTranscriptData.description }); setTranscripts(prev => prev.map(x => x.id === t.id ? { ...x, filename: updated.filename, description: updated.description } : x)); setEditingTranscriptId(null); } catch (err) { alert("Save failed: " + err.message); } }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #059669", background: "#D1FAE5", color: "#065F46", cursor: "pointer", fontWeight: 600 }}>Save</button>
                                <button onClick={() => setEditingTranscriptId(null)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer" }}>Cancel</button>
                              </div>
                              <input value={editingTranscriptData.description || ""} onChange={e => setEditingTranscriptData(d => ({ ...d, description: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (async () => { try { const updated = await apiUpdateTranscript(t.id, { filename: editingTranscriptData.filename, description: editingTranscriptData.description }); setTranscripts(prev => prev.map(x => x.id === t.id ? { ...x, filename: updated.filename, description: updated.description } : x)); setEditingTranscriptId(null); } catch (err) { alert("Save failed: " + err.message); } })(); } if (e.key === "Escape") setEditingTranscriptId(null); }} placeholder="Add description..." style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid #3B82F6", width: "100%", color: "#475569" }} />
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }} onClick={e => { e.stopPropagation(); setEditingTranscriptId(t.id); setEditingTranscriptData({ filename: t.filename, description: t.description || "" }); }} title="Click to edit name">{t.filename}</div>
                              {t.description ? <div style={{ fontSize: 11, color: "#475569", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }} onClick={e => { e.stopPropagation(); setEditingTranscriptId(t.id); setEditingTranscriptData({ filename: t.filename, description: t.description || "" }); }} title="Click to edit description">{t.description}</div> : <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, cursor: "pointer", fontStyle: "italic" }} onClick={e => { e.stopPropagation(); setEditingTranscriptId(t.id); setEditingTranscriptData({ filename: t.filename, description: "" }); }} title="Click to add description">Add description...</div>}
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                {t.durationSeconds ? `${Math.floor(t.durationSeconds / 60)}m ${Math.round(t.durationSeconds % 60)}s` : ""}
                                {t.durationSeconds && t.segmentCount ? " · " : ""}
                                {t.segmentCount ? `${t.segmentCount} segments` : ""}
                                {(t.durationSeconds || t.segmentCount) ? " · " : ""}
                                {new Date(t.createdAt).toLocaleDateString()}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {t.status === "processing" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b", background: "#fef3c7", padding: "2px 10px", borderRadius: 12, fontWeight: 600 }}>
                            <Loader2 size={11} className="animate-spin" /> Transcribing...
                          </span>
                        )}
                        {t.status === "completed" && (
                          <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", padding: "2px 10px", borderRadius: 12, fontWeight: 600 }}>Completed</span>
                        )}
                        {t.status === "completed" && (
                          <button onClick={(e) => { e.stopPropagation(); openTranscriptViewer(t); }} className="border border-green-400 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-50 transition-colors bg-transparent cursor-pointer" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Eye size={12} /> View
                          </button>
                        )}
                        {t.status === "error" && (
                          <span style={{ fontSize: 11, color: "#dc2626", background: "#fee2e2", padding: "2px 10px", borderRadius: 12, fontWeight: 600 }} title={t.errorMessage || ""}>Error</span>
                        )}
                        <button onClick={async (e) => { e.stopPropagation(); if (!await confirmDelete()) return; apiDeleteTranscript(t.id).then(() => setTranscripts(prev => prev.filter(x => x.id !== t.id))).catch(err => alert(err.message)); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8" }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {expandedTranscriptId === t.id && (
                      <div style={{ borderTop: "1px solid var(--c-border2)", padding: 16 }}>
                        {transcriptDetailLoading ? <p style={{ fontSize: 12, color: "#94a3b8" }}>Loading transcript...</p> :
                         transcriptDetail && transcriptEdits ? (() => {
                          const speakers = [...new Set(transcriptEdits.map(s => s.speaker))];
                          const speakerColors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];
                          const getSpeakerColor = (sp) => speakerColors[speakers.indexOf(sp) % speakerColors.length];
                          const fmtTime = (sec) => { const m = Math.floor(sec / 60); const s = Math.round(sec % 60); return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };

                          return (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {speakers.map(sp => (
                                    <div key={sp} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 10px", borderRadius: 12, background: getSpeakerColor(sp) + "18", color: getSpeakerColor(sp), fontWeight: 600, cursor: "pointer", border: `1px solid ${getSpeakerColor(sp)}30` }}
                                      onClick={() => setEditingSpeaker(editingSpeaker === sp ? null : sp)}
                                    >
                                      {editingSpeaker === sp ? (
                                        <input
                                          autoFocus
                                          defaultValue={sp}
                                          style={{ background: "transparent", border: "none", outline: "none", color: "inherit", fontSize: 11, fontWeight: 600, width: 100 }}
                                          onBlur={(e) => {
                                            const newName = e.target.value.trim() || sp;
                                            if (newName !== sp) {
                                              setTranscriptEdits(prev => prev.map(seg => seg.speaker === sp ? { ...seg, speaker: newName } : seg));
                                            }
                                            setEditingSpeaker(null);
                                          }}
                                          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      ) : (
                                        <><Pencil size={10} /> {sp}</>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={async () => {
                                    try {
                                      const blob = await apiDownloadTranscriptAudio(t.id);
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a"); a.href = url; a.download = t.filename; a.click();
                                      URL.revokeObjectURL(url);
                                    } catch (err) { alert("Download failed: " + err.message); }
                                  }} className="btn btn-outline btn-sm" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                    <Download size={11} /> Audio
                                  </button>
                                  <div style={{ position: "relative" }}>
                                    <button onClick={() => setExportDropdownId(exportDropdownId === t.id ? null : t.id)} className="btn btn-outline btn-sm" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                      <FileText size={11} /> Export <ChevronDown size={9} />
                                    </button>
                                    {exportDropdownId === t.id && (
                                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--c-bg)", border: "1px solid var(--c-border2)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 140, overflow: "hidden" }}>
                                        {[{ label: "Text (.txt)", fmt: "txt", ext: "_transcript.txt" }, { label: "Word (.docx)", fmt: "docx", ext: "_transcript.docx" }, { label: "PDF (.pdf)", fmt: "pdf", ext: "_transcript.pdf" }].map(opt => (
                                          <button key={opt.fmt} onClick={async () => {
                                            setExportDropdownId(null);
                                            try {
                                              const blob = await apiExportTranscript(t.id, opt.fmt);
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement("a"); a.href = url; a.download = t.filename.replace(/\.[^.]+$/, "") + opt.ext; a.click();
                                              URL.revokeObjectURL(url);
                                            } catch (err) { alert("Export failed: " + err.message); }
                                          }} style={{ display: "block", width: "100%", padding: "8px 14px", fontSize: 11, border: "none", background: "transparent", color: "var(--c-text)", cursor: "pointer", textAlign: "left" }}
                                            onMouseEnter={(e) => e.target.style.background = "var(--c-bg2)"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    disabled={transcriptSaving}
                                    onClick={async () => {
                                      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
                                      setTranscriptSaving(true);
                                      try {
                                        const prevState = transcriptDetail.transcript;
                                        await apiUpdateTranscript(t.id, { transcript: transcriptEdits });
                                        setTranscriptDetail(prev => ({ ...prev, transcript: transcriptEdits }));
                                        apiSaveTranscriptHistory(t.id, { changeType: "manual_save", changeDescription: "Manual save", previousState: prevState }).catch(() => {});
                                      } catch (err) { alert("Save failed: " + err.message); }
                                      setTranscriptSaving(false);
                                    }}
                                    className="btn btn-sm" style={{ background: "#1e293b", color: "#fff", border: "none", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                                  >
                                    {transcriptSaving ? <Loader2 size={11} className="animate-spin" /> : null}
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setShowTranscriptHistory(!showTranscriptHistory);
                                      if (!showTranscriptHistory) {
                                        setTranscriptHistoryLoading(true);
                                        apiGetTranscriptHistory(t.id).then(setTranscriptHistory).catch(() => setTranscriptHistory([])).finally(() => setTranscriptHistoryLoading(false));
                                      }
                                    }}
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: showTranscriptHistory ? "#ede9fe" : undefined, borderColor: showTranscriptHistory ? "#a78bfa" : undefined, color: showTranscriptHistory ? "#5b21b6" : undefined }}
                                  >
                                    <RotateCcw size={11} /> History
                                  </button>
                                  {autoSaveStatus && (
                                    <span style={{ fontSize: 10, color: autoSaveStatus === "saved" ? "#10b981" : "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
                                      {autoSaveStatus === "saving" ? <><Loader2 size={10} className="animate-spin" /> Saving...</> : <><Check size={10} /> Saved</>}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setTranscriptReadingView(!transcriptReadingView)}
                                    className="btn btn-sm"
                                    style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: transcriptReadingView ? "#6366f1" : "transparent", color: transcriptReadingView ? "#fff" : "#475569", border: transcriptReadingView ? "1px solid #6366f1" : "1px solid #e2e8f0" }}
                                  >
                                    <Eye size={11} /> Reading View
                                  </button>
                                  <button
                                    onClick={() => {
                                      const speakerColorsMap = {};
                                      speakers.forEach((sp, i) => { speakerColorsMap[sp] = speakerColors[i % speakerColors.length]; });
                                      const presentWindow = window.open("", "_blank", "width=1200,height=800");
                                      if (!presentWindow) { alert("Pop-up blocked. Please allow pop-ups for this site."); return; }
                                      const title = t.filename || "Transcript";
                                      presentWindow.document.write(`<!DOCTYPE html><html><head><title>${title} — Present Mode</title><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; padding-top: 16px; transition: background 0.3s, color 0.3s; }
body.dark { background: #0f172a; color: #e2e8f0; }
body.light { background: #ffffff; color: #1e293b; }
.theme-bar { display: flex; justify-content: flex-end; margin-bottom: 12px; gap: 4px; }
.theme-btn { padding: 4px 14px; font-size: 12px; font-weight: 500; border: 1px solid #94a3b8; border-radius: 6px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
body.dark .theme-btn { background: transparent; color: #94a3b8; border-color: #475569; }
body.dark .theme-btn.active { background: #334155; color: #f8fafc; border-color: #6366f1; }
body.light .theme-btn { background: transparent; color: #64748b; border-color: #cbd5e1; }
body.light .theme-btn.active { background: #e0e7ff; color: #3730a3; border-color: #6366f1; }
.header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; }
body.dark .header { border-bottom: 1px solid #334155; }
body.light .header { border-bottom: 1px solid #e2e8f0; }
.title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
body.dark .title { color: #f8fafc; }
body.light .title { color: #0f172a; }
.meta { font-size: 14px; }
body.dark .meta { color: #94a3b8; }
body.light .meta { color: #64748b; }
.legend { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
body.dark .legend-item { color: #cbd5e1; }
body.light .legend-item { color: #475569; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.segments { max-width: 900px; margin: 0 auto; }
.segment { display: flex; gap: 16px; padding: 12px 16px; border-radius: 8px; margin-bottom: 4px; align-items: flex-start; }
body.dark .segment:nth-child(even) { background: rgba(30, 41, 59, 0.5); }
body.light .segment:nth-child(even) { background: #f8fafc; }
.timestamp { flex-shrink: 0; width: 60px; font-size: 13px; font-family: monospace; padding-top: 3px; }
body.dark .timestamp { color: #64748b; }
body.light .timestamp { color: #94a3b8; }
.speaker { flex-shrink: 0; width: 140px; font-size: 14px; font-weight: 600; padding-top: 2px; }
.text { flex: 1; font-size: 18px; line-height: 1.7; }
body.dark .text { color: #e2e8f0; }
body.light .text { color: #1e293b; }
</style></head><body class="dark">
<div class="theme-bar"><button class="theme-btn active" id="darkBtn" onclick="setTheme('dark')">Dark</button><button class="theme-btn" id="lightBtn" onclick="setTheme('light')">Light</button></div>
<div class="header"><div class="title">${title}</div><div class="meta">${transcriptEdits.length} segments${transcriptDetail.durationSeconds ? ' · ' + Math.floor(transcriptDetail.durationSeconds / 60) + 'm ' + Math.round(transcriptDetail.durationSeconds % 60) + 's' : ''}</div></div>
<div class="legend">${speakers.map(sp => `<div class="legend-item"><div class="legend-dot" style="background:${speakerColorsMap[sp]}"></div>${sp}</div>`).join("")}</div>
<div class="segments">${transcriptEdits.map(seg => `<div class="segment"><div class="timestamp">${fmtTime(seg.startTime)}</div><div class="speaker" style="color:${speakerColorsMap[seg.speaker] || '#94a3b8'}">${seg.speaker}</div><div class="text">${seg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>`).join("")}</div>
<script>
function setTheme(t){document.body.className=t;document.getElementById('darkBtn').className='theme-btn'+(t==='dark'?' active':'');document.getElementById('lightBtn').className='theme-btn'+(t==='light'?' active':'');}
document.addEventListener("keydown",function(e){if(e.key==="Escape")window.close();});
<${"/"}script>
</body></html>`);
                                      presentWindow.document.close();
                                    }}
                                    className="btn btn-sm"
                                    style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: "#0f172a", color: "#f8fafc", border: "1px solid #334155" }}
                                  >
                                    <Scale size={11} /> Present
                                  </button>
                                  <ScribeTranscriptButtons transcriptId={t.id} scribeTranscriptId={t.scribeTranscriptId} scribeStatus={t.scribeStatus} onRefreshed={() => { apiGetTranscriptDetail(t.id).then(d => { setTranscriptDetail(d); setTranscriptEdits(JSON.parse(JSON.stringify(d.transcript))); }).catch(() => {}); }} />
                                  {t.scribeTranscriptId && (
                                    <button
                                      disabled={summariesLoading}
                                      onClick={async () => {
                                        if (transcriptDetail?.summaries?.length && !summariesLoading) {
                                          setShowSummaries(!showSummaries);
                                          return;
                                        }
                                        setSummariesLoading(true);
                                        try {
                                          const result = await apiGetScribeSummaries(t.id);
                                          if (result.summaries && result.summaries.length > 0) {
                                            setTranscriptDetail(prev => ({ ...prev, summaries: result.summaries }));
                                            setShowSummaries(true);
                                          } else {
                                            alert("No summaries available yet for this transcript.");
                                          }
                                        } catch (err) { alert("Failed to fetch summaries: " + err.message); }
                                        setSummariesLoading(false);
                                      }}
                                      className="btn btn-sm"
                                      style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: showSummaries ? "#ede9fe" : "transparent", border: "1px solid #a78bfa", color: showSummaries ? "#5b21b6" : "#7c3aed" }}
                                    >
                                      {summariesLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Summaries
                                      {transcriptDetail?.summaries?.length > 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>({transcriptDetail.summaries.length})</span>}
                                    </button>
                                  )}
                                  {!t.scribeTranscriptId && (
                                    <button
                                      disabled={summariesLoading}
                                      onClick={async () => {
                                        if (transcriptDetail?.summaries?.length && !summariesLoading) {
                                          setShowSummaries(!showSummaries);
                                          return;
                                        }
                                        setSummariesLoading(true);
                                        try {
                                          const result = await apiSummarizeTranscript(t.id);
                                          if (result.summaries && result.summaries.length > 0) {
                                            setTranscriptDetail(prev => ({ ...prev, summaries: result.summaries }));
                                            setShowSummaries(true);
                                          } else {
                                            alert("Summary generation returned no results.");
                                          }
                                        } catch (err) { alert("Failed to summarize transcript: " + err.message); }
                                        setSummariesLoading(false);
                                      }}
                                      className="btn btn-sm"
                                      style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: showSummaries ? "#ede9fe" : "transparent", border: "1px solid #a78bfa", color: showSummaries ? "#5b21b6" : "#7c3aed" }}
                                    >
                                      {summariesLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Summarize
                                      {transcriptDetail?.summaries?.length > 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>({transcriptDetail.summaries.length})</span>}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {showTranscriptHistory && (
                                <div style={{ marginBottom: 12, border: "1px solid #e9d5ff", borderRadius: 8, background: "#faf5ff", overflow: "hidden" }}>
                                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #e9d5ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6" }}>Version History</span>
                                    <button onClick={() => setShowTranscriptHistory(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1 }}>&times;</button>
                                  </div>
                                  <div style={{ maxHeight: 200, overflowY: "auto", padding: 8 }}>
                                    {transcriptHistoryLoading ? <p style={{ fontSize: 11, color: "#94a3b8", padding: 8 }}>Loading history...</p> :
                                     transcriptHistory.length === 0 ? <p style={{ fontSize: 11, color: "#94a3b8", padding: 8 }}>No version history yet.</p> :
                                     transcriptHistory.map(h => {
                                       const typeColors = { edit: { bg: "#dbeafe", color: "#1d4ed8", label: "Edit" }, manual_save: { bg: "#dcfce7", color: "#15803d", label: "Save" }, revert: { bg: "#fef3c7", color: "#92400e", label: "Revert" }, merge: { bg: "#e0e7ff", color: "#4338ca", label: "Merge" } };
                                       const tc = typeColors[h.changeType] || { bg: "#f1f5f9", color: "#64748b", label: h.changeType };
                                       return (
                                         <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 8px", borderRadius: 6, marginBottom: 4, background: "#fff", border: "1px solid #f1f5f9" }}>
                                           <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                             <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: tc.bg, color: tc.color, whiteSpace: "nowrap" }}>{tc.label}</span>
                                             <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.changeDescription || h.changeType}</span>
                                             <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>by {h.changedBy}</span>
                                             <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{new Date(h.createdAt).toLocaleString()}</span>
                                           </div>
                                           <button
                                             disabled={revertingHistoryId === h.id}
                                             onClick={async () => {
                                               if (!window.confirm("Revert to this version? Current changes will be saved as a history entry.")) return;
                                               setRevertingHistoryId(h.id);
                                               try {
                                                 const reverted = await apiRevertTranscript(t.id, h.id);
                                                 setTranscriptDetail(reverted);
                                                 setTranscriptEdits(JSON.parse(JSON.stringify(reverted.transcript)));
                                                 const freshHistory = await apiGetTranscriptHistory(t.id);
                                                 setTranscriptHistory(freshHistory);
                                               } catch (err) { alert("Revert failed: " + err.message); }
                                               setRevertingHistoryId(null);
                                             }}
                                             style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #f59e0b", background: "#fffbeb", color: "#92400e", cursor: revertingHistoryId === h.id ? "wait" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, flexShrink: 0, opacity: revertingHistoryId === h.id ? 0.6 : 1 }}
                                           >
                                             {revertingHistoryId === h.id ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <RotateCcw size={10} />} Revert
                                           </button>
                                         </div>
                                       );
                                     })
                                    }
                                  </div>
                                </div>
                              )}

                              {transcriptDetail.isVideo && (
                                <div style={{ marginBottom: 16, borderRadius: 8, overflow: "hidden", border: "1px solid var(--c-border2)", background: "#000" }}>
                                  <video
                                    controls
                                    style={{ width: "100%", maxHeight: 400, display: "block" }}
                                    src={`/api/transcripts/${t.id}/video`}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}

                              {transcriptDetail.summaries && Array.isArray(transcriptDetail.summaries) && transcriptDetail.summaries.length > 0 && (
                                <div style={{ marginBottom: 16, border: "1px solid #c4b5fd", borderRadius: 8, overflow: "hidden" }}>
                                  <div
                                    onClick={() => setShowSummaries(!showSummaries)}
                                    style={{ padding: "10px 14px", background: "#ede9fe", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <Sparkles size={14} style={{ color: "#7c3aed" }} />
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>AI Summaries</span>
                                      <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 400 }}>({transcriptDetail.summaries.length})</span>
                                    </div>
                                    <ChevronRight size={14} style={{ color: "#7c3aed", transform: showSummaries ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                                  </div>
                                  {showSummaries && (
                                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, background: "#faf5ff" }}>
                                      {transcriptDetail.summaries.map((summary, si) => (
                                        <div key={si} style={{ border: "1px solid #e9d5ff", borderRadius: 6, padding: "12px 14px", background: "#fff" }}>
                                          {(summary.title || summary.type) && (
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                              {summary.title || summary.type}
                                            </div>
                                          )}
                                          <div style={{ fontSize: 12, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
                                            {summary.content || summary.text || summary.summary || JSON.stringify(summary)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {selectedSegments.size >= 2 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 8, background: "#6366f118", border: "1px solid #6366f130", borderRadius: 6 }}>
                                  <Merge size={13} style={{ color: "#6366f1" }} />
                                  <span style={{ fontSize: 11, color: "var(--c-text)", fontWeight: 500 }}>{selectedSegments.size} lines selected</span>
                                  <button
                                    onClick={() => {
                                      const sorted = [...selectedSegments].sort((a, b) => a - b);
                                      setMergeUndoStack(prev => [...prev, transcriptEdits.map(s => ({ ...s }))]);
                                      setTranscriptEdits(prev => {
                                        const updated = [...prev];
                                        const first = sorted[0];
                                        const last = sorted[sorted.length - 1];
                                        const mergedText = sorted.map(i => updated[i].text).join(" ");
                                        const merged = { ...updated[first], text: mergedText, endTime: updated[last].endTime };
                                        updated.splice(first, last - first + 1, merged);
                                        return updated;
                                      });
                                      setSelectedSegments(new Set());
                                    }}
                                    style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                  >
                                    <Merge size={11} /> Merge
                                  </button>
                                  <button onClick={() => setSelectedSegments(new Set())} style={{ background: "transparent", border: "1px solid var(--c-border2)", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "var(--c-text2)" }}>
                                    Cancel
                                  </button>
                                </div>
                              )}

                              {mergeUndoStack.length > 0 && selectedSegments.size < 2 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                  <button
                                    onClick={() => {
                                      setMergeUndoStack(prev => {
                                        const stack = [...prev];
                                        const last = stack.pop();
                                        if (last) setTranscriptEdits(last);
                                        return stack;
                                      });
                                    }}
                                    style={{ background: "transparent", border: "1px solid var(--c-border2)", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}
                                  >
                                    <RotateCcw size={11} /> Undo merge
                                  </button>
                                </div>
                              )}

                              {transcriptReadingView ? (
                                <div>
                                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: "22px" }}>Speakers:</span>
                                    {speakers.map((sp, i) => (
                                      <div key={sp} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: speakerColors[i % speakerColors.length], flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{sp}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 500, overflowY: "auto" }}>
                                    {transcriptEdits.map((seg, idx) => (
                                      <div key={idx} style={{ display: "flex", gap: 14, padding: "10px 14px", borderRadius: 6, background: idx % 2 === 0 ? "#f8fafc" : "transparent", alignItems: "flex-start", borderLeft: `3px solid ${getSpeakerColor(seg.speaker)}` }}>
                                        <div style={{ flexShrink: 0, width: 52, fontSize: 11, color: "#94a3b8", fontFamily: "monospace", paddingTop: 3 }}>
                                          {fmtTime(seg.startTime)}
                                        </div>
                                        <div style={{ flexShrink: 0, width: 120 }}>
                                          <span style={{ fontSize: 12, fontWeight: 600, color: getSpeakerColor(seg.speaker) }}>{seg.speaker}</span>
                                        </div>
                                        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: "#1e293b" }}>
                                          {seg.text}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflowY: "auto" }}>
                                {transcriptEdits.map((seg, idx) => (
                                  <div key={idx} style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: 6, background: selectedSegments.has(idx) ? "#6366f110" : (idx % 2 === 0 ? "var(--c-bg2)" : "transparent"), alignItems: "flex-start", border: selectedSegments.has(idx) ? "1px solid #6366f130" : "1px solid transparent" }}>
                                    <div style={{ flexShrink: 0, paddingTop: 2 }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedSegments.has(idx)}
                                        onChange={() => {
                                          setSelectedSegments(prev => {
                                            const next = new Set(prev);
                                            if (next.has(idx)) next.delete(idx);
                                            else next.add(idx);
                                            return next;
                                          });
                                        }}
                                        style={{ cursor: "pointer", accentColor: "#6366f1", width: 14, height: 14 }}
                                      />
                                    </div>
                                    <div style={{ flexShrink: 0, width: 48, fontSize: 10, color: "#94a3b8", fontFamily: "monospace", paddingTop: 2 }}>
                                      {fmtTime(seg.startTime)}
                                    </div>
                                    <div style={{ flexShrink: 0, width: 100 }}>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: getSpeakerColor(seg.speaker), cursor: "pointer" }}
                                        onClick={() => {
                                          const currentSpeakers = [...new Set(transcriptEdits.map(s => s.speaker))];
                                          const currentIdx = currentSpeakers.indexOf(seg.speaker);
                                          const nextSpeaker = currentSpeakers[(currentIdx + 1) % currentSpeakers.length];
                                          setTranscriptEdits(prev => prev.map((s, i) => i === idx ? { ...s, speaker: nextSpeaker } : s));
                                        }}
                                        title="Click to cycle speaker"
                                      >
                                        {seg.speaker}
                                      </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      {editingSegmentIdx === idx ? (
                                        <textarea
                                          autoFocus
                                          defaultValue={seg.text}
                                          style={{ width: "100%", fontSize: 12, lineHeight: 1.5, padding: 4, border: "1px solid #6366f1", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical", minHeight: 40, fontFamily: "inherit" }}
                                          onBlur={(e) => {
                                            const newText = e.target.value.trim();
                                            if (newText !== seg.text) {
                                              setTranscriptEdits(prev => prev.map((s, i) => i === idx ? { ...s, text: newText } : s));
                                            }
                                            setEditingSegmentIdx(null);
                                          }}
                                          onKeyDown={(e) => { if (e.key === "Escape") { setEditingSegmentIdx(null); } }}
                                        />
                                      ) : (
                                        <div
                                          style={{ fontSize: 12, lineHeight: 1.5, color: "var(--c-text)", cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}
                                          onClick={() => setEditingSegmentIdx(idx)}
                                          title="Click to edit"
                                        >
                                          {seg.text}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              )}

                            </div>
                          );
                        })() : <p style={{ fontSize: 12, color: "#94a3b8" }}>No transcript data.</p>}
                      </div>
                    )}
                  </div>
                ))}
               </div>
              }
            </div>
            </>)}
          </div>
        )}

        {/* ── Correspondence Tab ── */}
        {activeTab === "correspondence" && (
          <div className="case-overlay-body">
            <div className="case-overlay-section">
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 12, borderBottom: "1px solid var(--c-border2)" }}>
                <button onClick={() => setCorrSubTab("emails")} className={`pb-4 text-sm font-medium bg-transparent border-none cursor-pointer ${corrSubTab === "emails" ? "border-b-2 border-gray-900 dark:border-slate-100 text-gray-900 dark:text-slate-100" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`} style={{ padding: "8px 16px" }}>
                  Emails {correspondence.filter(e => !e.isVoicemail).length > 0 && <span className="text-gray-400 dark:text-slate-500 font-normal ml-1 text-xs">({correspondence.filter(e => !e.isVoicemail).length})</span>}
                </button>
                <button onClick={() => setCorrSubTab("texts")} className={`pb-4 text-sm font-medium bg-transparent border-none cursor-pointer ${corrSubTab === "texts" ? "border-b-2 border-gray-900 dark:border-slate-100 text-gray-900 dark:text-slate-100" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`} style={{ padding: "8px 16px" }}>
                  Texts {smsMessages.length > 0 && <span className="text-gray-400 dark:text-slate-500 font-normal ml-1 text-xs">({smsMessages.length})</span>}
                </button>
                <button onClick={() => setCorrSubTab("voicemails")} className={`pb-4 text-sm font-medium bg-transparent border-none cursor-pointer ${corrSubTab === "voicemails" ? "border-b-2 border-gray-900 dark:border-slate-100 text-gray-900 dark:text-slate-100" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`} style={{ padding: "8px 16px" }}>
                  Voicemails {((voicemails || []).length + (correspondence || []).filter(e => e.isVoicemail).length) > 0 && <span className="text-gray-400 dark:text-slate-500 font-normal ml-1 text-xs">({(voicemails || []).length + (correspondence || []).filter(e => e.isVoicemail).length})</span>}
                </button>
                <div style={{ flex: 1 }} />
                <button className="border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 bg-transparent cursor-pointer mb-1" onClick={() => {
                  setShowAutoText(true);
                }}>Auto Text Settings</button>
              </div>

              {corrSubTab === "emails" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>
                      Email: <span style={{ fontFamily: "monospace", color: "var(--c-text)", cursor: "pointer" }} onClick={() => {
                        navigator.clipboard.writeText(`case-${c.id}@plaintiff.mattrmindr.com`);
                        setCorrCopied(true);
                        setTimeout(() => setCorrCopied(false), 2000);
                      }}>{corrCopied ? "Copied!" : `case-${c.id}@plaintiff.mattrmindr.com`}</span>
                    </span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {isAttorneyPlus && correspondence.filter(e => !e.isVoicemail).length > 0 && (
                        <button onClick={() => { setCorrSelectMode(!corrSelectMode); setSelectedCorrIds(new Set()); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: corrSelectMode ? "1px solid #ef4444" : "1px solid var(--c-border)", background: corrSelectMode ? "#fef2f2" : "var(--c-bg)", color: corrSelectMode ? "#ef4444" : "var(--c-text)", cursor: "pointer" }}>{corrSelectMode ? "Cancel" : "Select"}</button>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => {
                        setCorrLoading(true);
                        apiGetCorrespondence(c.id).then(setCorrespondence).catch(() => {}).finally(() => setCorrLoading(false));
                      }}>Refresh</button>
                    </div>
                  </div>
                  {corrSelectMode && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>
                      <button onClick={() => setSelectedCorrIds(new Set(correspondence.filter(e => !e.isVoicemail).map(e => e.id)))} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Select All</button>
                      <button onClick={() => setSelectedCorrIds(new Set())} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Deselect All</button>
                      {selectedCorrIds.size > 0 && (
                        <button onClick={async () => {
                          if (!await confirmDelete()) return;
                          try {
                            await apiBatchDeleteCorrespondence([...selectedCorrIds]);
                            setCorrespondence(prev => prev.filter(e => !selectedCorrIds.has(e.id)));
                            log("Batch Deleted", `${selectedCorrIds.size} emails`);
                            setSelectedCorrIds(new Set()); setCorrSelectMode(false);
                          } catch (err) { alert("Batch delete failed: " + err.message); }
                        }} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 4, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete Selected ({selectedCorrIds.size})</button>
                      )}
                    </div>
                  )}
                  {corrLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0" }}>Loading correspondence...</div>}
                  {!corrLoading && correspondence.filter(e => !e.isVoicemail).length === 0 && (
                    <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "20px 0" }}>
                      No correspondence received yet. CC or forward emails to <span style={{ fontFamily: "monospace", color: "var(--c-text)" }}>case-{c.id}@plaintiff.mattrmindr.com</span> and they will appear here.
                    </div>
                  )}
                  {!corrLoading && correspondence.filter(e => !e.isVoicemail).map(email => {
                    const isExpanded = expandedEmail === email.id;
                    const dateStr = email.receivedAt ? new Date(email.receivedAt).toLocaleString() : "";
                    return (
                      <div key={email.id} style={{ borderBottom: "1px solid var(--c-border2)", padding: "10px 0" }}>
                        <div style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }} onClick={() => { if (corrSelectMode) { const next = new Set(selectedCorrIds); if (next.has(email.id)) next.delete(email.id); else next.add(email.id); setSelectedCorrIds(next); return; } setExpandedEmail(isExpanded ? null : email.id); }}>
                          {corrSelectMode && <input type="checkbox" checked={selectedCorrIds.has(email.id)} readOnly style={{ width: 16, height: 16, flexShrink: 0, marginTop: 8 }} />}
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                            {(email.fromName || email.fromEmail || "?")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{email.fromName || email.fromEmail}</div>
                              <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{dateStr}</div>
                            </div>
                            <div style={{ fontSize: 13, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject || "(no subject)"}</div>
                            {!isExpanded && <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{(email.bodyText || "").substring(0, 120)}</div>}
                            {email.hasAttachments && <div style={{ fontSize: 11, color: "var(--c-text)", marginTop: 2 }}>Attachments: {email.attachments.length}</div>}
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 10, marginLeft: 42 }}>
                            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                              <div>From: {email.fromName} &lt;{email.fromEmail}&gt;</div>
                              {email.toEmails && <div>To: {email.toEmails}</div>}
                              {email.ccEmails && <div>CC: {email.ccEmails}</div>}
                            </div>
                            {email.attachments.length > 0 && (
                              <div style={{ marginTop: 8, marginBottom: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", marginBottom: 6 }}>Attachments</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {email.attachments.map((att, idx) => {
                                    const isImage = att.contentType?.startsWith("image/");
                                    const isPdf = att.contentType === "application/pdf";
                                    const icon = isImage ? "img" : isPdf ? "pdf" : "file";
                                    return (
                                      <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                        <button onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/correspondence/attachment/${email.id}/${idx}?inline=true`, { credentials: "include" });
                                            if (!res.ok) throw new Error("Failed to load attachment");
                                            const blob = await res.blob();
                                            const typedBlob = new Blob([blob], { type: att.contentType || "application/octet-stream" });
                                            openBlobInViewer(typedBlob, att.filename, att.contentType);
                                          } catch (err) { alert("Failed to load attachment: " + err.message); }
                                        }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 14px", background: "var(--c-bg2)", borderRadius: 6, border: "1px solid var(--c-border)", cursor: "pointer", minWidth: 90, textAlign: "center" }} title="Click to view">
                                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", textTransform: "uppercase" }}>{icon}</span>
                                          <span style={{ fontSize: 11, color: "var(--c-text)", fontWeight: 600, wordBreak: "break-all", maxWidth: 120 }}>{att.filename}</span>
                                          <span style={{ fontSize: 10, color: "#64748b" }}>{fmtFileSize(att.size)}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div style={{ fontSize: 13, color: "var(--c-text)", whiteSpace: "pre-wrap", background: "var(--c-bg2)", borderRadius: 6, padding: 12, marginTop: 8, maxHeight: 400, overflow: "auto", border: "1px solid var(--c-border)" }}>
                              {email.bodyText || "(empty)"}
                            </div>
                            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                              <button className="btn btn-outline btn-sm" style={{ fontSize: 11, color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                                if (!await confirmDelete()) return;
                                try {
                                  await apiDeleteCorrespondence(email.id);
                                  setCorrespondence(p => p.filter(e => e.id !== email.id));
                                  setExpandedEmail(null);
                                  log("Correspondence Removed", `Deleted email from ${email.fromName || email.fromEmail}: "${email.subject || "(no subject)"}"`)
                                } catch (err) { console.error(err); }
                              }}>Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {corrSubTab === "texts" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {smsConfigs.length > 0 ? `${smsConfigs.filter(sc => sc.enabled).length} active auto-text recipient${smsConfigs.filter(sc => sc.enabled).length !== 1 ? "s" : ""}` : "No auto-text configured"}
                    </span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {isAttorneyPlus && smsMessages.length > 0 && (
                        <button onClick={() => { setSmsSelectMode(!smsSelectMode); setSelectedSmsIds(new Set()); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: smsSelectMode ? "1px solid #ef4444" : "1px solid var(--c-border)", background: smsSelectMode ? "#fef2f2" : "var(--c-bg)", color: smsSelectMode ? "#ef4444" : "var(--c-text)", cursor: "pointer" }}>{smsSelectMode ? "Cancel" : "Select"}</button>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => {
                        setSmsCompose(true);
                        setSmsComposePhone("");
                        setSmsComposeBody("");
                        setSmsComposeName("");
                        setSmsComposeSearch(""); setSmsComposeResults([]); setSmsComposeSelected(null); setSmsComposeDropdown(false);
                      }}>Send Text</button>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => {
                        apiGetSmsMessages(c.id).then(setSmsMessages).catch(() => {});
                      }}>Refresh</button>
                    </div>
                  </div>

                  {/* Monitored Numbers */}
                  <div style={{ marginBottom: 12, border: "1px solid var(--c-border2)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--c-bg2)", cursor: "pointer" }} onClick={() => setSmsWatchExpanded(p => !p)}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                        {smsWatchExpanded ? "▾" : "▸"} Monitored Numbers {smsWatchNumbers.length > 0 && <span style={{ color: "#64748b", fontWeight: 400 }}>({smsWatchNumbers.length})</span>}
                      </span>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "1px 6px" }} onClick={e => { e.stopPropagation(); setSmsWatchAdding(true); setSmsWatchExpanded(true); setSmsWatchPhone(""); setSmsWatchName(""); }}>+ Add</button>
                    </div>
                    {smsWatchExpanded && (
                      <div style={{ padding: "6px 12px" }}>
                        {smsWatchNumbers.length === 0 && !smsWatchAdding && (
                          <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", padding: "6px 0" }}>No monitored numbers. Add a phone number to automatically link incoming texts to this case.</div>
                        )}
                        {smsWatchNumbers.map(w => (
                          <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--c-border2)" }}>
                            <div>
                              <span style={{ fontSize: 12, color: "var(--c-text)", fontFamily: "monospace" }}>{w.phoneNumber}</span>
                              {w.contactName && <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{w.contactName}</span>}
                            </div>
                            <button onClick={() => { apiDeleteSmsWatch(w.id).then(() => setSmsWatchNumbers(p => p.filter(x => x.id !== w.id))).catch(() => {}); }} style={{ background: "none", border: "none", color: "#e05252", fontSize: 12, cursor: "pointer", padding: "0 2px", lineHeight: 1 }} title="Remove">✕</button>
                          </div>
                        ))}
                        {smsWatchAdding && (
                          <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 0" }}>
                            <input value={smsWatchPhone} onChange={e => setSmsWatchPhone(e.target.value)} placeholder="Phone number" style={{ flex: 1, fontSize: 12, padding: "4px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)" }} />
                            <input value={smsWatchName} onChange={e => setSmsWatchName(e.target.value)} placeholder="Name (optional)" style={{ flex: 1, fontSize: 12, padding: "4px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)" }} />
                            <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => {
                              if (!smsWatchPhone.trim()) return;
                              apiAddSmsWatch(c.id, { phoneNumber: smsWatchPhone.trim(), contactName: smsWatchName.trim() })
                                .then(w => { setSmsWatchNumbers(p => [w, ...p]); setSmsWatchAdding(false); setSmsWatchPhone(""); setSmsWatchName(""); })
                                .catch(err => alert(err.message || "Failed to add"));
                            }}>Add</button>
                            <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setSmsWatchAdding(false)}>Cancel</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {smsSelectMode && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>
                      <button onClick={() => setSelectedSmsIds(new Set(smsMessages.map(m => m.id)))} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Select All</button>
                      <button onClick={() => setSelectedSmsIds(new Set())} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Deselect All</button>
                      {selectedSmsIds.size > 0 && (
                        <button onClick={async () => {
                          if (!await confirmDelete()) return;
                          try {
                            await apiBatchDeleteSmsMessages([...selectedSmsIds]);
                            setSmsMessages(prev => prev.filter(m => !selectedSmsIds.has(m.id)));
                            log("Batch Deleted", `${selectedSmsIds.size} text messages`);
                            setSelectedSmsIds(new Set()); setSmsSelectMode(false);
                          } catch (err) { alert("Batch delete failed: " + err.message); }
                        }} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 4, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete Selected ({selectedSmsIds.size})</button>
                      )}
                    </div>
                  )}

                  {smsMessages.length === 0 && (
                    <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "20px 0" }}>
                      No text messages yet. Configure Auto Text settings to send automated reminders, or click "Send Text" to send a one-off message.
                    </div>
                  )}

                  {smsMessages.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflow: "auto" }}>
                      {smsMessages.map(msg => {
                        const isOut = msg.direction === "outbound";
                        const time = msg.sentAt ? new Date(msg.sentAt).toLocaleString() : "";
                        return (
                          <div key={msg.id} style={{ display: "flex", justifyContent: isOut ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 6 }} onClick={() => { if (smsSelectMode) { const next = new Set(selectedSmsIds); if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id); setSelectedSmsIds(next); } }}>
                            {smsSelectMode && <input type="checkbox" checked={selectedSmsIds.has(msg.id)} readOnly style={{ width: 16, height: 16, flexShrink: 0, marginTop: 8, cursor: "pointer" }} />}
                            <div style={{
                              maxWidth: smsSelectMode ? "70%" : "75%", padding: "8px 12px", borderRadius: 12,
                              background: isOut ? "#1e3a5f" : "var(--c-bg2)",
                              color: isOut ? "#fff" : "var(--c-text)",
                              border: isOut ? "none" : "1px solid var(--c-border)",
                              borderBottomRightRadius: isOut ? 4 : 12,
                              borderBottomLeftRadius: isOut ? 12 : 4,
                              cursor: smsSelectMode ? "pointer" : "default",
                            }}>
                              <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{msg.body}</div>
                              <div style={{ fontSize: 10, color: isOut ? "rgba(255,255,255,0.6)" : "#64748b", marginTop: 4, display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <span>{msg.contactName || msg.phoneNumber}</span>
                                <span>{time}</span>
                              </div>
                              {msg.status === "failed" && <div style={{ fontSize: 10, color: "#e05252", marginTop: 2 }}>Failed to send</div>}
                              {msg.status === "not_configured" && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 2 }}>Saved (Twilio not configured)</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {smsScheduled.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", marginBottom: 6 }}>Upcoming Scheduled Texts</div>
                      {smsScheduled.slice(0, 10).map(s => (
                        <div key={s.id} style={{ fontSize: 12, color: "var(--c-text)", padding: "4px 0", borderBottom: "1px solid var(--c-border2)", display: "flex", justifyContent: "space-between" }}>
                          <span>{s.eventTitle} — {s.phoneNumber}</span>
                          <span style={{ color: "#64748b" }}>{s.sendAt ? new Date(s.sendAt).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                      {smsScheduled.length > 10 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>+{smsScheduled.length - 10} more</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Send Text Compose Modal ── */}
        {smsCompose && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSmsCompose(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--c-bg)", borderRadius: 10, width: 440, maxWidth: "95vw", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--c-text)", marginBottom: 16 }}>Send Text Message</div>
              <div style={{ marginBottom: 12, position: "relative" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Recipient</label>
                <input
                  value={smsComposeSelected ? smsComposeName : smsComposeSearch}
                  onChange={e => {
                    const q = e.target.value;
                    setSmsComposeSearch(q);
                    setSmsComposeSelected(null);
                    setSmsComposeName(q);
                    setSmsComposePhone("");
                    if (q.trim().length >= 1) {
                      const lower = q.trim().toLowerCase();
                      const contactMatches = (allContacts || []).filter(ct => !ct.deletedAt && ct.name && ct.name.toLowerCase().includes(lower)).slice(0, 8);
                      const partyMatches = (parties || []).filter(p => p.name && p.name.toLowerCase().includes(lower) && !contactMatches.some(cm => cm.name.toLowerCase() === p.name.toLowerCase())).slice(0, 4);
                      const expertMatches = (experts || []).filter(ex => ex.name && ex.name.toLowerCase().includes(lower) && !contactMatches.some(cm => cm.name.toLowerCase() === ex.name.toLowerCase())).slice(0, 4);
                      const fmtPhone = (num) => {
                        if (!num) return null;
                        const digits = num.replace(/\D/g, "");
                        if (digits.length === 10) return "+1" + digits;
                        if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
                        if (num.startsWith("+") && digits.length >= 11) return "+" + digits;
                        return digits.length >= 10 ? "+" + digits : null;
                      };
                      const results = [];
                      contactMatches.forEach(ct => {
                        const phones = [];
                        const p1 = fmtPhone(ct.phone); if (p1) phones.push({ label: "Phone", number: p1 });
                        const p2 = fmtPhone(ct.cell); if (p2) phones.push({ label: "Cell", number: p2 });
                        results.push({ id: "ct-" + ct.id, name: ct.name, category: ct.category, phones, source: "Contact" });
                      });
                      partyMatches.forEach(p => {
                        const phones = [];
                        const d = p.data || {};
                        const p1 = fmtPhone(d.phone); if (p1) phones.push({ label: "Phone", number: p1 });
                        const p2 = fmtPhone(d.cell); if (p2) phones.push({ label: "Cell", number: p2 });
                        results.push({ id: "party-" + p.id, name: p.name, category: p.partyType || "Party", phones, source: "Case Party" });
                      });
                      expertMatches.forEach(ex => {
                        const phones = [];
                        const p1 = fmtPhone(ex.phone); if (p1) phones.push({ label: "Phone", number: p1 });
                        const p2 = fmtPhone(ex.cell); if (p2) phones.push({ label: "Cell", number: p2 });
                        results.push({ id: "expert-" + ex.id, name: ex.name, category: "Expert", phones, source: "Expert" });
                      });
                      setSmsComposeResults(results);
                      setSmsComposeDropdown(results.length > 0);
                    } else {
                      setSmsComposeResults([]);
                      setSmsComposeDropdown(false);
                    }
                  }}
                  onFocus={() => { if (smsComposeResults.length > 0 && !smsComposeSelected) setSmsComposeDropdown(true); }}
                  onBlur={() => { setTimeout(() => setSmsComposeDropdown(false), 200); }}
                  placeholder="Search contacts or type a name..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", fontSize: 13, boxSizing: "border-box" }}
                />
                {smsComposeSelected && (
                  <button onClick={() => { setSmsComposeSelected(null); setSmsComposeSearch(""); setSmsComposeName(""); setSmsComposePhone(""); }} style={{ position: "absolute", right: 8, top: 28, background: "transparent", border: "none", fontSize: 14, color: "var(--c-text3)", cursor: "pointer", lineHeight: 1 }}>✕</button>
                )}
                {smsComposeDropdown && smsComposeResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                    {smsComposeResults.map(r => (
                      <div key={r.id} onClick={() => {
                        setSmsComposeSelected(r);
                        setSmsComposeName(r.name);
                        setSmsComposeSearch(r.name);
                        setSmsComposeDropdown(false);
                        if (r.phones.length >= 1) setSmsComposePhone(r.phones[0].number);
                        else setSmsComposePhone("");
                      }} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--c-border)", fontSize: 12 }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ fontWeight: 600, color: "var(--c-text)" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "var(--c-text3)" }}>
                          {r.category} {r.phones.length > 0 ? " — " + r.phones.map(p => `${p.label}: ${p.number}`).join(", ") : " — No phone on file"}
                          <span style={{ marginLeft: 6, opacity: 0.7 }}>({r.source})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {smsComposeSelected && smsComposeSelected.phones.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Phone Number</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {smsComposeSelected.phones.map((p, pi) => (
                      <label key={pi} style={{ fontSize: 13, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input type="radio" name="composePhone" checked={smsComposePhone === p.number} onChange={() => setSmsComposePhone(p.number)} />
                        <span style={{ color: "var(--c-text3)", fontSize: 11, minWidth: 40 }}>{p.label}:</span> {p.number}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {smsComposeSelected && smsComposeSelected.phones.length === 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Phone Number</label>
                  <input value={smsComposePhone} onChange={e => setSmsComposePhone(e.target.value)} placeholder="(251) 555-1234" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", fontSize: 13, boxSizing: "border-box" }} />
                  <div style={{ fontSize: 10, color: "#e07a30", marginTop: 2 }}>No phone number on file — enter one manually</div>
                </div>
              )}

              {smsComposeSelected && smsComposeSelected.phones.length === 1 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Phone Number</label>
                  <div style={{ fontSize: 13, color: "var(--c-text)", padding: "8px 10px", background: "var(--c-bg2)", borderRadius: 6, border: "1px solid var(--c-border)" }}>{smsComposePhone}</div>
                </div>
              )}

              {!smsComposeSelected && smsComposeName.trim() && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Phone Number</label>
                  <input value={smsComposePhone} onChange={e => setSmsComposePhone(e.target.value)} placeholder="(251) 555-1234" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Message</label>
                <textarea value={smsComposeBody} onChange={e => setSmsComposeBody(e.target.value)} placeholder="Type your message..." rows={4} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} disabled={smsDrafting} onClick={async () => {
                    setSmsDrafting(true);
                    try {
                      const res = await apiDraftSmsMessage({ caseId: c.id, contactName: smsComposeName, contactType: "client" });
                      setSmsComposeBody(res.draft);
                    } catch (err) { alert("Draft failed: " + err.message); }
                    setSmsDrafting(false);
                  }}>{smsDrafting ? "Drafting..." : "Draft with AI"}</button>
                  <span style={{ fontSize: 11, color: smsComposeBody.length > 160 ? "#f59e0b" : "#64748b" }}>
                    {smsComposeBody.length}/160 {smsComposeBody.length > 160 ? `(${Math.ceil(smsComposeBody.length / 153)} segments)` : ""}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSmsCompose(false)}>Cancel</button>
                <button className="btn btn-sm" style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 13, opacity: (!smsComposePhone || !smsComposeBody || smsSending) ? 0.5 : 1 }} disabled={!smsComposePhone || !smsComposeBody || smsSending} onClick={async () => {
                  setSmsSending(true);
                  try {
                    await apiSendSms({ caseId: c.id, phoneNumber: smsComposePhone, body: smsComposeBody, contactName: smsComposeName });
                    setSmsCompose(false);
                    apiGetSmsMessages(c.id).then(setSmsMessages).catch(() => {});
                    log("SMS Sent", `Text to ${smsComposeName || smsComposePhone}: "${smsComposeBody.substring(0, 80)}..."`);
                  } catch (err) { alert("Send failed: " + err.message); }
                  setSmsSending(false);
                }}>{smsSending ? "Sending..." : "Send"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Auto Text Settings Modal ── */}
        {showAutoText && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAutoText(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--c-bg)", borderRadius: 10, width: 520, maxWidth: "95vw", maxHeight: "85vh", overflow: "auto", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--c-text)" }}>Auto Text Settings</div>
                <button onClick={() => setShowAutoText(false)} style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "var(--c-text2)" }}>x</button>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                Configure automatic text message reminders for hearing dates, court dates, and deadlines. Recipients will receive SMS reminders at the intervals you choose.
              </div>

              {smsConfigs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text2)", marginBottom: 8 }}>Active Recipients</div>
                  {smsConfigs.map(cfg => (
                    <div key={cfg.id} style={{ padding: "10px 12px", background: "var(--c-bg2)", borderRadius: 8, border: "1px solid var(--c-border)", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{cfg.contactName || "Unnamed"}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {cfg.contactType} — {(cfg.phoneNumbers || []).join(", ")}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            Reminders: {[cfg.notifyHearings && "Hearings", cfg.notifyCourtDates && "Court Dates", cfg.notifyDeadlines && "Deadlines", cfg.notifyMeetings && "Meetings"].filter(Boolean).join(", ") || "None"}
                            {" | "}{(cfg.reminderDays || []).map(d => d === 0 ? "Day of" : d === 1 ? "1 day before" : `${d} days before`).join(", ")}
                          </div>
                          {cfg.customMessage && (
                            <div style={{ fontSize: 10, color: "var(--c-text3)", marginTop: 2, fontStyle: "italic", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              Message: "{cfg.customMessage}"
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button onClick={async () => {
                            try {
                              await apiUpdateSmsConfig(cfg.id, { enabled: !cfg.enabled });
                              setSmsConfigs(p => p.map(x => x.id === cfg.id ? { ...x, enabled: !x.enabled } : x));
                            } catch (err) { console.error(err); }
                          }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: cfg.enabled ? "#059669" : "var(--c-bg2)", color: cfg.enabled ? "#fff" : "var(--c-text2)", cursor: "pointer" }}>
                            {cfg.enabled ? "On" : "Off"}
                          </button>
                          <button onClick={async () => {
                            if (!await confirmDelete()) return;
                            try {
                              await apiDeleteSmsConfig(cfg.id);
                              setSmsConfigs(p => p.filter(x => x.id !== cfg.id));
                              apiGetSmsScheduled(c.id).then(setSmsScheduled).catch(() => {});
                            } catch (err) { console.error(err); }
                          }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #fca5a5", background: "transparent", color: "#e05252", cursor: "pointer" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!smsAddingRecipient ? (
                <button className="btn btn-outline btn-sm" style={{ fontSize: 12, width: "100%" }} onClick={() => {
                  setSmsAddingRecipient(true);
                  setSmsNewName(""); setSmsNewPhones([]); setSmsNewType("client");
                  setSmsNewNotifyHearings(true); setSmsNewNotifyCourtDates(true);
                  setSmsNewNotifyDeadlines(false); setSmsNewNotifyMeetings(false);
                  setSmsNewReminderDays([1, 7]); setSmsNewCustomDay(""); setSmsOtherChecked(false); setSmsAddPhone(""); setSmsNewMessage("");
                  setSmsContactSearch(""); setSmsContactSelected(null); setSmsContactResults([]); setSmsContactDropdownOpen(false);
                }}>+ Add Recipient</button>
              ) : (
                <div style={{ padding: 16, background: "var(--c-bg2)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", marginBottom: 12 }}>Add Recipient</div>

                  <div style={{ marginBottom: 8, position: "relative" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Contact</label>
                    <input
                      value={smsContactSelected ? smsNewName : smsContactSearch}
                      onChange={e => {
                        const q = e.target.value;
                        setSmsContactSearch(q);
                        setSmsContactSelected(null);
                        setSmsNewName(q);
                        setSmsNewPhones([]);
                        setSmsAddPhone("");
                        if (q.trim().length >= 1) {
                          const lower = q.trim().toLowerCase();
                          const contactMatches = (allContacts || []).filter(ct => !ct.deletedAt && ct.name && ct.name.toLowerCase().includes(lower)).slice(0, 8);
                          const partyMatches = (parties || []).filter(p => p.name && p.name.toLowerCase().includes(lower) && !contactMatches.some(cm => cm.name.toLowerCase() === p.name.toLowerCase())).slice(0, 4);
                          const expertMatches = (experts || []).filter(ex => ex.name && ex.name.toLowerCase().includes(lower) && !contactMatches.some(cm => cm.name.toLowerCase() === ex.name.toLowerCase())).slice(0, 4);
                          const results = [];
                          contactMatches.forEach(ct => {
                            const phones = [];
                            if (ct.phone) phones.push({ label: "Phone", number: ct.phone });
                            if (ct.cell) phones.push({ label: "Cell", number: ct.cell });
                            results.push({ id: "ct-" + ct.id, name: ct.name, category: ct.category, phones, source: "Contact" });
                          });
                          partyMatches.forEach(p => {
                            const phones = [];
                            const d = p.data || {};
                            if (d.phone) phones.push({ label: "Phone", number: d.phone });
                            if (d.cell) phones.push({ label: "Cell", number: d.cell });
                            results.push({ id: "party-" + p.id, name: p.name, category: p.partyType || "Party", phones, source: "Case Party" });
                          });
                          expertMatches.forEach(ex => {
                            const phones = [];
                            if (ex.phone) phones.push({ label: "Phone", number: ex.phone });
                            if (ex.cell) phones.push({ label: "Cell", number: ex.cell });
                            results.push({ id: "expert-" + ex.id, name: ex.name, category: "Expert", phones, source: "Expert" });
                          });
                          setSmsContactResults(results);
                          setSmsContactDropdownOpen(results.length > 0);
                        } else {
                          setSmsContactResults([]);
                          setSmsContactDropdownOpen(false);
                        }
                      }}
                      onFocus={() => { if (smsContactResults.length > 0 && !smsContactSelected) setSmsContactDropdownOpen(true); }}
                      onBlur={() => { setTimeout(() => setSmsContactDropdownOpen(false), 200); }}
                      placeholder="Search contacts or type a name..."
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, boxSizing: "border-box" }}
                    />
                    {smsContactSelected && (
                      <button onClick={() => { setSmsContactSelected(null); setSmsContactSearch(""); setSmsNewName(""); setSmsNewPhones([]); setSmsNewType("client"); }} style={{ position: "absolute", right: 6, top: 20, background: "transparent", border: "none", fontSize: 14, color: "#64748b", cursor: "pointer", lineHeight: 1 }}>✕</button>
                    )}
                    {smsContactDropdownOpen && smsContactResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                        {smsContactResults.map(r => (
                          <div key={r.id} onClick={() => {
                            setSmsContactSelected(r);
                            setSmsNewName(r.name);
                            setSmsContactSearch(r.name);
                            setSmsContactDropdownOpen(false);
                            const catMap = { Client: "client", Witness: "witness", "Family Member": "family", Expert: "expert" };
                            setSmsNewType(catMap[r.category] || "client");
                            if (r.phones.length === 1) setSmsNewPhones([r.phones[0].number]);
                            else if (r.phones.length > 1) setSmsNewPhones(r.phones.map(p => p.number));
                            else setSmsNewPhones([]);
                          }} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--c-border)", fontSize: 12 }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg2)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ fontWeight: 600, color: "var(--c-text)" }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {r.category} {r.phones.length > 0 ? " — " + r.phones.map(p => `${p.label}: ${p.number}`).join(", ") : " — No phone on file"}
                              <span style={{ marginLeft: 6, opacity: 0.7 }}>({r.source})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {smsContactSelected && smsContactSelected.phones.length > 1 && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Phone Numbers</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {smsContactSelected.phones.map((p, pi) => (
                          <label key={pi} style={{ fontSize: 12, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input type="checkbox" checked={smsNewPhones.includes(p.number)} onChange={e => {
                              if (e.target.checked) setSmsNewPhones(prev => [...prev, p.number]);
                              else setSmsNewPhones(prev => prev.filter(n => n !== p.number));
                            }} />
                            <span style={{ color: "var(--c-text3)", fontSize: 11, minWidth: 40 }}>{p.label}:</span> {p.number}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {smsContactSelected && smsContactSelected.phones.length === 0 && (
                    <div style={{ fontSize: 10, color: "#e07a30", marginBottom: 4 }}>No phone number on file — add one below</div>
                  )}

                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Add Number</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={smsAddPhone} onChange={e => setSmsAddPhone(e.target.value)} onKeyDown={e => {
                        if (e.key === "Enter" && smsAddPhone.trim()) {
                          if (!smsNewPhones.includes(smsAddPhone.trim())) setSmsNewPhones(p => [...p, smsAddPhone.trim()]);
                          setSmsAddPhone("");
                        }
                      }} placeholder="(251) 555-1234" style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, boxSizing: "border-box" }} />
                      <button onClick={() => {
                        if (smsAddPhone.trim() && !smsNewPhones.includes(smsAddPhone.trim())) setSmsNewPhones(p => [...p, smsAddPhone.trim()]);
                        setSmsAddPhone("");
                      }} className="btn btn-sm" style={{ fontSize: 11, padding: "4px 12px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--c-text3)", marginTop: 2 }}>1 text will be sent to each number</div>
                  </div>

                  {smsNewPhones.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Numbers to Text ({smsNewPhones.length})</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {smsNewPhones.map((ph, i) => (
                          <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 12, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4 }}>
                            {ph}
                            <button onClick={() => setSmsNewPhones(p => p.filter((_, idx) => idx !== i))} style={{ background: "transparent", border: "none", fontSize: 12, color: "var(--c-text3)", cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Contact Type</label>
                    <select value={smsNewType} onChange={e => setSmsNewType(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12 }}>
                      <option value="client">Client</option>
                      <option value="witness">Witness</option>
                      <option value="family">Family Member</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Notify About</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {[["Hearings", smsNewNotifyHearings, setSmsNewNotifyHearings], ["Court Dates", smsNewNotifyCourtDates, setSmsNewNotifyCourtDates], ["Deadlines", smsNewNotifyDeadlines, setSmsNewNotifyDeadlines], ["Meetings", smsNewNotifyMeetings, setSmsNewNotifyMeetings]].map(([lbl, val, set]) => (
                        <label key={lbl} style={{ fontSize: 12, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                          <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} /> {lbl}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Remind</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      {[[0, "Day of"], [1, "1 day before"], [3, "3 days before"], [7, "1 week before"], [14, "2 weeks before"]].map(([val, lbl]) => (
                        <label key={val} style={{ fontSize: 12, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                          <input type="checkbox" checked={smsNewReminderDays.includes(val)} onChange={e => {
                            if (e.target.checked) setSmsNewReminderDays(p => [...p, val].sort((a, b) => a - b));
                            else setSmsNewReminderDays(p => p.filter(d => d !== val));
                          }} /> {lbl}
                        </label>
                      ))}
                      <label style={{ fontSize: 12, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="checkbox" checked={smsOtherChecked} onChange={e => {
                          setSmsOtherChecked(e.target.checked);
                          if (!e.target.checked) {
                            setSmsNewReminderDays(p => p.filter(d => [0, 1, 3, 7, 14].includes(d)));
                            setSmsNewCustomDay("");
                          }
                        }} /> Other
                      </label>
                    </div>
                    {smsOtherChecked && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                        <input type="number" min="1" max="365" value={smsNewCustomDay} onChange={e => setSmsNewCustomDay(e.target.value)} onKeyDown={e => {
                          if (e.key === "Enter") {
                            const num = parseInt(smsNewCustomDay);
                            if (num > 0) {
                              setSmsNewReminderDays(p => [...new Set([...p, num])].sort((a, b) => a - b));
                              setSmsNewCustomDay("");
                            }
                          }
                        }} placeholder="# of days" style={{ width: 80, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, boxSizing: "border-box" }} />
                        <button onClick={() => {
                          const num = parseInt(smsNewCustomDay);
                          if (num > 0) {
                            setSmsNewReminderDays(p => [...new Set([...p, num])].sort((a, b) => a - b));
                            setSmsNewCustomDay("");
                          }
                        }} className="btn btn-sm" style={{ fontSize: 11, padding: "3px 10px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Add</button>
                      </div>
                    )}
                    {smsNewReminderDays.filter(d => ![0, 1, 3, 7, 14].includes(d)).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {smsNewReminderDays.filter(d => ![0, 1, 3, 7, 14].includes(d)).map(d => (
                          <span key={d} style={{ fontSize: 11, padding: "2px 8px", background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 12, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4 }}>
                            {d} days before
                            <button onClick={() => setSmsNewReminderDays(p => p.filter(x => x !== d))} style={{ background: "transparent", border: "none", fontSize: 12, color: "var(--c-text3)", cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Message Preview</label>
                    <div style={{ fontSize: 10, color: "var(--c-text3)", marginBottom: 4 }}>
                      {smsNewMessage ? "Custom message — this exact text will be sent with each reminder." : "Default message shown below. Click to edit and customize."}
                    </div>
                    <textarea
                      value={smsNewMessage || `Reminder: ${smsNewName || "[Name]"} have a [Event Type] scheduled [timing] on [Date]. If you have questions, please contact our office.`}
                      onChange={e => setSmsNewMessage(e.target.value)}
                      rows={3}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: smsNewMessage ? "var(--c-bg)" : "var(--c-bg2)", color: "var(--c-text)", fontSize: 12, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5, fontStyle: smsNewMessage ? "normal" : "italic" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      {smsNewMessage ? (
                        <button onClick={() => setSmsNewMessage("")} style={{ fontSize: 10, color: "var(--c-accent, #1e3a5f)", background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>Reset to default</button>
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--c-text3)" }}>Auto-generated per event</span>
                      )}
                      {smsNewMessage && (
                        <span style={{ fontSize: 10, color: smsNewMessage.length > 160 ? "#f59e0b" : "var(--c-text3)" }}>
                          {smsNewMessage.length} chars {smsNewMessage.length > 160 ? `(${Math.ceil(smsNewMessage.length / 153)} segments)` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setSmsAddingRecipient(false)}>Cancel</button>
                    <button className="btn btn-sm" style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 12, opacity: (smsNewPhones.length === 0 || !smsNewName) ? 0.5 : 1 }} disabled={smsNewPhones.length === 0 || !smsNewName} onClick={async () => {
                      try {
                        const created = await apiCreateSmsConfig({
                          caseId: c.id,
                          phoneNumbers: smsNewPhones,
                          contactName: smsNewName,
                          contactType: smsNewType,
                          notifyHearings: smsNewNotifyHearings,
                          notifyCourtDates: smsNewNotifyCourtDates,
                          notifyDeadlines: smsNewNotifyDeadlines,
                          notifyMeetings: smsNewNotifyMeetings,
                          reminderDays: smsNewReminderDays,
                          customMessage: smsNewMessage || "",
                        });
                        setSmsConfigs(p => [...p, created]);
                        setSmsAddingRecipient(false);
                        apiGetSmsScheduled(c.id).then(setSmsScheduled).catch(() => {});
                        log("Auto Text Added", `Added ${smsNewName} (${smsNewPhones.join(", ")}) for auto text reminders`);
                      } catch (err) { alert("Failed to add recipient: " + err.message); }
                    }}>Add Recipient</button>
                  </div>
                </div>
              )}

              {corrSubTab === "voicemails" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {(voicemails || []).length + (correspondence || []).filter(e => e.isVoicemail).length} voicemail{((voicemails || []).length + (correspondence || []).filter(e => e.isVoicemail).length) !== 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => {
                        setShowAddVoicemail(true); setEditingVmId(null);
                        setVmCallerName(""); setVmCallerNumber(""); setVmDuration(""); setVmTranscript(""); setVmNotes(""); setVmReceivedAt("");
                      }}>Add Voicemail</button>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => {
                        setVoicemailsLoading(true);
                        apiGetVoicemails(c.id).then(setVoicemails).catch(() => {}).finally(() => setVoicemailsLoading(false));
                        setCorrLoading(true);
                        apiGetCorrespondence(c.id).then(setCorrespondence).catch(() => {}).finally(() => setCorrLoading(false));
                      }}>Refresh</button>
                    </div>
                  </div>

                  {(() => { const vmEmails = (correspondence || []).filter(e => e.isVoicemail); if (vmEmails.length === 0) return null; return (
                    <div style={{ marginBottom: 12 }}>
                      {vmEmails.map(email => {
                        const isExpanded = expandedEmail === email.id;
                        const dateStr = email.receivedAt ? new Date(email.receivedAt).toLocaleString() : "";
                        const audioAttachments = (email.attachments || []).filter(a => a.contentType && a.contentType.startsWith("audio/"));
                        return (
                          <div key={`vm-email-${email.id}`} style={{ borderBottom: "1px solid var(--c-border2)", padding: "12px 0" }}>
                            <div style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }} onClick={() => setExpandedEmail(isExpanded ? null : email.id)}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                                {(email.fromName || email.fromEmail || "?")[0].toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{email.fromName || email.fromEmail}</div>
                                  <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{dateStr}</div>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject || "(no subject)"}</div>
                                {!isExpanded && <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{(email.bodyText || "").substring(0, 120)}</div>}
                                {audioAttachments.length > 0 && !isExpanded && <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2 }}>🎵 Audio attachment</div>}
                              </div>
                            </div>
                            {isExpanded && (
                              <div style={{ marginTop: 10, marginLeft: 42 }}>
                                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                                  <div>From: {email.fromName} &lt;{email.fromEmail}&gt;</div>
                                  {email.toEmails && <div>To: {email.toEmails}</div>}
                                </div>
                                {email.bodyText && (
                                  <div style={{ fontSize: 13, color: "var(--c-text)", whiteSpace: "pre-wrap", background: "var(--c-bg2)", borderRadius: 6, padding: 12, marginTop: 8, maxHeight: 200, overflow: "auto", border: "1px solid var(--c-border)" }}>
                                    {email.bodyText}
                                  </div>
                                )}
                                {email.attachments.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {email.attachments.map((att, idx) => {
                                      const isAudio = att.contentType && att.contentType.startsWith("audio/");
                                      return (
                                        <div key={idx} style={{ marginBottom: 6 }}>
                                          {isAudio ? (
                                            <div>
                                              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", marginBottom: 4 }}>{att.filename}</div>
                                              <audio controls preload="none" style={{ height: 32, width: "100%" }}>
                                                <source src={`/api/correspondence/attachment/${email.id}/${idx}?inline=true`} type={att.contentType} />
                                              </audio>
                                            </div>
                                          ) : (
                                            <button onClick={async () => {
                                              try {
                                                const res = await fetch(`/api/correspondence/attachment/${email.id}/${idx}?inline=true`, { credentials: "include" });
                                                if (!res.ok) throw new Error("Failed to load attachment");
                                                const blob = await res.blob();
                                                const typedBlob = new Blob([blob], { type: att.contentType || "application/octet-stream" });
                                                openBlobInViewer(typedBlob, att.filename, att.contentType);
                                              } catch (err) { alert("Failed to load attachment: " + err.message); }
                                            }} style={{ fontSize: 11, padding: "4px 10px", background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 4, cursor: "pointer", color: "var(--c-text)" }}>
                                              📎 {att.filename} ({fmtFileSize(att.size)})
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div style={{ marginTop: 8 }}>
                                  <button className="btn btn-outline btn-sm" style={{ fontSize: 11, color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                                    if (!await confirmDelete()) return;
                                    try {
                                      await apiDeleteCorrespondence(email.id);
                                      setCorrespondence(p => p.filter(e => e.id !== email.id));
                                      setExpandedEmail(null);
                                    } catch (err) { console.error(err); }
                                  }}>Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ); })()}

                  {showAddVoicemail && (
                    <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 12 }}>{editingVmId ? "Edit Voicemail" : "Add Voicemail"}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Caller Name</label>
                          <input value={vmCallerName} onChange={e => setVmCallerName(e.target.value)} placeholder="Caller name" style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Caller Number</label>
                          <input value={vmCallerNumber} onChange={e => setVmCallerNumber(e.target.value)} placeholder="Phone number" style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Duration (seconds)</label>
                          <input type="number" value={vmDuration} onChange={e => setVmDuration(e.target.value)} placeholder="Duration in seconds" style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Received At</label>
                          <input type="datetime-local" value={vmReceivedAt} onChange={e => setVmReceivedAt(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Transcript</label>
                        <textarea value={vmTranscript} onChange={e => setVmTranscript(e.target.value)} placeholder="Voicemail transcript text..." rows={3} style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Notes</label>
                        <textarea value={vmNotes} onChange={e => setVmNotes(e.target.value)} placeholder="Internal notes..." rows={2} style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary btn-sm" style={{ fontSize: 12, padding: "4px 14px" }} onClick={async () => {
                          try {
                            const data = { callerName: vmCallerName, callerNumber: vmCallerNumber, duration: vmDuration ? parseInt(vmDuration) : null, transcriptText: vmTranscript, notes: vmNotes, receivedAt: vmReceivedAt ? new Date(vmReceivedAt).toISOString() : null };
                            if (editingVmId) {
                              const updated = await apiUpdateVoicemail(editingVmId, data);
                              setVoicemails(p => p.map(v => v.id === editingVmId ? updated : v));
                              log("Voicemail Updated", `Updated voicemail from ${vmCallerName || "Unknown"}`);
                            } else {
                              const created = await apiCreateVoicemail(c.id, data);
                              setVoicemails(p => [created, ...p]);
                              log("Voicemail Added", `Added voicemail from ${vmCallerName || "Unknown"}`);
                            }
                            setShowAddVoicemail(false); setEditingVmId(null);
                          } catch (err) { alert("Failed to save voicemail: " + err.message); }
                        }}>{editingVmId ? "Save Changes" : "Add Voicemail"}</button>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 12, padding: "4px 14px" }} onClick={() => { setShowAddVoicemail(false); setEditingVmId(null); }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {voicemailsLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0" }}>Loading voicemails...</div>}
                  {!voicemailsLoading && (voicemails || []).length === 0 && (correspondence || []).filter(e => e.isVoicemail).length === 0 && !showAddVoicemail && (
                    <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "20px 0" }}>
                      No voicemails recorded yet. Voicemail emails (with "Voice Message" in subject) appear here automatically, or click "Add Voicemail" to log one manually.
                    </div>
                  )}
                  {!voicemailsLoading && (voicemails || []).map(vm => {
                    const dateStr = vm.receivedAt ? new Date(vm.receivedAt).toLocaleString() : "";
                    const durationStr = vm.duration ? `${Math.floor(vm.duration / 60)}:${String(vm.duration % 60).padStart(2, "0")}` : "";
                    return (
                      <div key={vm.id} style={{ borderBottom: "1px solid var(--c-border2)", padding: "12px 0" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                            {(vm.callerName || vm.callerNumber || "?")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{vm.callerName || "Unknown Caller"}</div>
                              <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{dateStr}</div>
                            </div>
                            {vm.callerNumber && <div style={{ fontSize: 12, color: "#64748b" }}>{vm.callerNumber}</div>}
                            {durationStr && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Duration: {durationStr}</div>}
                            {vm.transcriptText && (
                              <div style={{ fontSize: 12, color: "var(--c-text)", marginTop: 6, background: "var(--c-bg2)", borderRadius: 6, padding: "8px 10px", border: "1px solid var(--c-border)", whiteSpace: "pre-wrap" }}>
                                {vm.transcriptText}
                              </div>
                            )}
                            {vm.notes && (
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>Notes: {vm.notes}</div>
                            )}
                            {vm.hasAudio && (
                              <div style={{ marginTop: 6 }}>
                                <audio controls preload="none" style={{ height: 32, width: "100%" }}>
                                  <source src={`/api/voicemails/${vm.id}/audio`} type={vm.audioMime || "audio/mpeg"} />
                                </audio>
                              </div>
                            )}
                            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                              {vm.hasAudio && (
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px", color: transcribingVmId === vm.id ? "#94a3b8" : "#7c3aed", borderColor: transcribingVmId === vm.id ? "#94a3b8" : "#7c3aed" }} disabled={transcribingVmId === vm.id} onClick={async () => {
                                  try {
                                    setTranscribingVmId(vm.id);
                                    const updated = await apiTranscribeVoicemail(vm.id);
                                    setVoicemails(p => p.map(v => v.id === vm.id ? updated : v));
                                    log("Voicemail Transcribed", `Transcribed voicemail from ${vm.callerName || "Unknown"}`);
                                  } catch (err) { alert("Transcription failed: " + err.message); }
                                  finally { setTranscribingVmId(null); }
                                }}>{transcribingVmId === vm.id ? "Transcribing..." : (vm.transcriptText ? "Re-Transcribe" : "Transcribe")}</button>
                              )}
                              <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => {
                                setEditingVmId(vm.id); setShowAddVoicemail(true);
                                setVmCallerName(vm.callerName || ""); setVmCallerNumber(vm.callerNumber || "");
                                setVmDuration(vm.duration ? String(vm.duration) : ""); setVmTranscript(vm.transcriptText || "");
                                setVmNotes(vm.notes || ""); setVmReceivedAt(vm.receivedAt ? new Date(vm.receivedAt).toISOString().slice(0, 16) : "");
                              }}>Edit</button>
                              <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "2px 8px", color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                                if (!await confirmDelete()) return;
                                try {
                                  await apiDeleteVoicemail(vm.id);
                                  setVoicemails(p => p.filter(v => v.id !== vm.id));
                                  log("Voicemail Deleted", `Deleted voicemail from ${vm.callerName || "Unknown"}`);
                                } catch (err) { alert("Failed to delete: " + err.message); }
                              }}>Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {attachmentPreview && (
          <div
            onClick={() => { if (attachmentPreview.blobUrl) URL.revokeObjectURL(attachmentPreview.blobUrl); setAttachmentPreview(null); }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: "var(--c-bg)", borderRadius: 10, width: "90vw", maxWidth: 900, height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--c-border)", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)" }}>{attachmentPreview.filename}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => { const a = document.createElement("a"); a.href = attachmentPreview.url; a.download = attachmentPreview.filename; a.click(); }}
                    style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, background: "#f59e0b", color: "#fff", borderRadius: 4, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >Download</button>
                  <button
                    onClick={() => { if (attachmentPreview.blobUrl) URL.revokeObjectURL(attachmentPreview.blobUrl); setAttachmentPreview(null); }}
                    style={{ background: "transparent", border: "none", fontSize: 20, color: "#64748b", cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}
                  >✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#1F2428" }}>
                {attachmentPreview.contentType?.startsWith("image/") ? (
                  <img src={attachmentPreview.url} alt={attachmentPreview.filename} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : attachmentPreview.contentType === "application/pdf" ? (
                  <iframe src={attachmentPreview.url} title={attachmentPreview.filename} style={{ width: "100%", height: "100%", border: "none" }} />
                ) : (
                  <div style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📎</div>
                    <div>Preview not available for this file type.</div>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => { const a = document.createElement("a"); a.href = attachmentPreview.url; a.download = attachmentPreview.filename; a.click(); }} style={{ color: "#0f172a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 14 }}>Download to view</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Filings Tab ── */}
        {activeTab === "filings" && (
          <div className="case-overlay-body">
            <DragDropZone accept=".pdf,application/pdf" onFileSelect={(files) => {
              const fileInput = document.getElementById("filing-upload-input");
              if (fileInput && files[0]) {
                const dt = new DataTransfer();
                dt.items.add(files[0]);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", padding: "8px 10px", border: "1px dashed var(--c-border)", borderRadius: 6, background: "var(--c-bg)" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 10, fontWeight: 500, color: "var(--c-text3)", display: "block", marginBottom: 3 }}>Upload Filing (PDF) — or drag & drop</label>
                {filingUploadProgress !== null && <div style={{ fontSize: 11, color: "#6366f1", marginBottom: 4 }}>Uploading: {filingUploadProgress}%</div>}
                <input type="file" accept=".pdf,application/pdf" id="filing-upload-input" style={{ fontSize: 11, width: "100%" }} disabled={filingUploadProgress !== null} onChange={async (e) => {
                  const file = e.target.files[0]; if (!file) return;
                  const bg = startBackgroundUpload(file.name);
                  e.target.value = "";
                  try {
                    let saved;
                    if (file.size > 20 * 1024 * 1024) {
                      saved = await apiUploadFilingChunked(file, c.id, filingUploadFiledBy, filingUploadDate, filingUploadDocType, (pct) => bg.updateProgress(pct));
                    } else {
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("caseId", c.id);
                      if (filingUploadFiledBy) formData.append("filedBy", filingUploadFiledBy);
                      if (filingUploadDate) formData.append("filingDate", filingUploadDate);
                      if (filingUploadDocType) formData.append("docType", filingUploadDocType);
                      saved = await apiUploadFiling(formData);
                    }
                    setFilings(prev => [saved, ...prev]);
                    log("Filing uploaded", `${file.name}`);
                    bg.markDone();
                    setFilingClassifying(saved.id);
                    try {
                      const { classification } = await apiClassifyFiling(saved.id);
                      setFilings(prev => prev.map(f => f.id === saved.id ? { ...f, filename: classification.suggestedName || f.filename, filedBy: classification.filedBy || f.filedBy, docType: classification.docType || f.docType, filingDate: classification.filingDate || f.filingDate, summary: classification.summary || f.summary } : f));
                      log("Filing auto-classified", `${classification.suggestedName || file.name} → ${classification.filedBy || "Unknown"}`);
                    } catch (classErr) { console.error("Auto-classify error:", classErr); }
                    setFilingClassifying(null);
                  } catch (err) { bg.markError(err.message); setFilingClassifying(null); }
                }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: "var(--c-text3)", display: "block", marginBottom: 3 }}>Filed By</label>
                <select value={filingUploadFiledBy} onChange={e => setFilingUploadFiledBy(e.target.value)} style={{ fontSize: 11, padding: "4px 6px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }}>
                  <option value="">— Auto-detect —</option>
                  <option>Plaintiff</option><option>Defendant</option><option>Court</option><option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: "var(--c-text3)", display: "block", marginBottom: 3 }}>Filing Date</label>
                <input type="date" value={filingUploadDate} onChange={e => setFilingUploadDate(e.target.value)} style={{ fontSize: 11, padding: "4px 6px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: "var(--c-text3)", display: "block", marginBottom: 3 }}>Doc Type</label>
                <input type="text" placeholder="e.g., Motion to Compel" value={filingUploadDocType} onChange={e => setFilingUploadDocType(e.target.value)} style={{ fontSize: 11, padding: "4px 6px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", width: 140 }} />
              </div>
            </div>
            </DragDropZone>

            {filingClassifying && (
              <div style={{ background: "#FEF9C3", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" style={{ width: 14, height: 14, border: "2px solid #D97706", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                AI is classifying the filing...
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Filter by party:</label>
              <select value={filingFilterBy} onChange={e => setFilingFilterBy(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB" }}>
                <option value="All">All</option>
                <option>Plaintiff</option><option>Defendant</option><option>Court</option><option>Other</option>
              </select>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {filings.length} filing{filings.length !== 1 ? "s" : ""}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                {canRemove && <button onClick={() => { setFilingSelectMode(!filingSelectMode); setSelectedFilingIds(new Set()); }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: filingSelectMode ? "1px solid #ef4444" : "1px solid var(--c-border)", background: filingSelectMode ? "#fef2f2" : "var(--c-bg)", color: filingSelectMode ? "#ef4444" : "var(--c-text)", cursor: "pointer" }}>{filingSelectMode ? "Cancel" : "Select"}</button>}
              </div>
            </div>
            {filingSelectMode && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fca5a5" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>{selectedFilingIds.size} selected</span>
                {selectedFilingIds.size > 0 && (
                  <button onClick={async () => {
                    if (!await confirmDelete()) return;
                    try {
                      await apiBatchDeleteFilings([...selectedFilingIds]);
                      setFilings(prev => prev.filter(f => !selectedFilingIds.has(f.id)));
                      log("Batch Deleted", `${selectedFilingIds.size} filings`);
                      setSelectedFilingIds(new Set());
                    } catch (err) { alert("Batch delete failed: " + err.message); }
                  }} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 4, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete Selected ({selectedFilingIds.size})</button>
                )}
                <button onClick={() => {
                  const filtered = filings.filter(f => filingFilterBy === "All" || f.filedBy === filingFilterBy);
                  if (selectedFilingIds.size === filtered.length) setSelectedFilingIds(new Set());
                  else setSelectedFilingIds(new Set(filtered.map(f => f.id)));
                }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", cursor: "pointer" }}>
                  {selectedFilingIds.size === filings.filter(f => filingFilterBy === "All" || f.filedBy === filingFilterBy).length ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}

            {filingsLoading ? <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading filings...</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                
                {filings.filter(f => filingFilterBy === "All" || f.filedBy === filingFilterBy).map(f => {
                  const partyColors = { Plaintiff: "#DC2626", Defendant: "#2563EB", Court: "#059669", Other: "#6B7280" };
                  const partyColor = partyColors[f.filedBy] || "#6B7280";
                  const isEditing = editingFilingId === f.id;
                  return (
                    <div key={f.id} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", background: "#FAFBFC" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {filingSelectMode && <input type="checkbox" checked={selectedFilingIds.has(f.id)} onChange={e => { const next = new Set(selectedFilingIds); if (e.target.checked) next.add(f.id); else next.delete(f.id); setSelectedFilingIds(next); }} style={{ width: 16, height: 16, flexShrink: 0 }} />}
                        {isEditing ? (
                          <input value={editingFilingData.filename || ""} onChange={e => setEditingFilingData(d => ({ ...d, filename: e.target.value }))} style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 150, padding: "3px 6px", borderRadius: 4, border: "1px solid #3B82F6" }} />
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 150 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#2563eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.15s" }} onClick={() => openAppFilingViewer(f.id, f.filename)} onMouseEnter={e => e.currentTarget.style.textDecorationColor = "#2563eb"} onMouseLeave={e => e.currentTarget.style.textDecorationColor = "transparent"} title="Click to view">{f.filename}</span>
                            <button onClick={() => { setEditingFilingId(f.id); setEditingFilingData({ filename: f.filename, filedBy: f.filedBy || "", docType: f.docType || "", filingDate: f.filingDate ? f.filingDate.substring(0, 10) : "" }); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--c-text3)", display: "inline-flex", flexShrink: 0 }} title="Edit filing"><Pencil size={11} /></button>
                          </span>
                        )}
                        {isEditing ? (
                          <select value={editingFilingData.filedBy || ""} onChange={e => setEditingFilingData(d => ({ ...d, filedBy: e.target.value }))} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #3B82F6" }}>
                            <option value="">— None —</option>
                            <option>Plaintiff</option><option>Defendant</option><option>Court</option><option>Other</option>
                          </select>
                        ) : reassigningFilingId === f.id ? (
                          <select autoFocus value={f.filedBy || ""} onChange={async e => {
                            const newParty = e.target.value;
                            try {
                              await apiUpdateFiling(f.id, { filedBy: newParty });
                              setFilings(prev => prev.map(x => x.id === f.id ? { ...x, filedBy: newParty } : x));
                              log("Filing reassigned", `${f.filename} → ${newParty}`);
                            } catch (err) { alert("Reassign failed: " + err.message); }
                            setReassigningFilingId(null);
                          }} onBlur={() => setReassigningFilingId(null)} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #3B82F6" }}>
                            <option value="">— None —</option>
                            <option>Plaintiff</option><option>Defendant</option><option>Court</option><option>Other</option>
                          </select>
                        ) : (
                          f.filedBy ? <span style={{ fontSize: 10, fontWeight: 600, color: partyColor, background: partyColor + "12", border: `1px solid ${partyColor}33`, borderRadius: 6, padding: "2px 8px", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap", fontFamily: "'Inter',sans-serif" }} onClick={() => setReassigningFilingId(f.id)} title="Click to reassign party">{f.filedBy}</span>
                          : <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontStyle: "italic" }} onClick={() => setReassigningFilingId(f.id)} title="Click to assign party">No party</span>
                        )}
                        {isEditing ? (
                          <input value={editingFilingData.docType || ""} onChange={e => setEditingFilingData(d => ({ ...d, docType: e.target.value }))} placeholder="Doc type" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #3B82F6", width: 120 }} />
                        ) : (
                          f.docType && <span style={{ fontSize: 10, color: "#6B7280", background: "#F3F4F6", borderRadius: 4, padding: "2px 7px", cursor: "pointer" }} onClick={() => { setEditingFilingId(f.id); setEditingFilingData({ filename: f.filename, filedBy: f.filedBy || "", docType: f.docType || "", filingDate: f.filingDate ? f.filingDate.substring(0, 10) : "" }); }} title="Click to edit">{f.docType}</span>
                        )}
                        {f.source === "email" && <span style={{ fontSize: 10, color: "#D97706", background: "#FEF3C7", borderRadius: 4, padding: "2px 7px" }}>📧 Email</span>}
                        {isEditing ? (
                          <input type="date" value={editingFilingData.filingDate || ""} onChange={e => setEditingFilingData(d => ({ ...d, filingDate: e.target.value }))} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #3B82F6" }} />
                        ) : (
                          f.filingDate && <span style={{ fontSize: 10, color: "#6B7280", cursor: "pointer" }} onClick={() => { setEditingFilingId(f.id); setEditingFilingData({ filename: f.filename, filedBy: f.filedBy || "", docType: f.docType || "", filingDate: f.filingDate ? f.filingDate.substring(0, 10) : "" }); }} title="Click to edit">Filed: {new Date(f.filingDate).toLocaleDateString()}</span>
                        )}
                        {isEditing && (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={async () => {
                              try {
                                await apiUpdateFiling(f.id, editingFilingData);
                                setFilings(prev => prev.map(x => x.id === f.id ? { ...x, filename: editingFilingData.filename, filedBy: editingFilingData.filedBy, docType: editingFilingData.docType, filingDate: editingFilingData.filingDate || null } : x));
                                log("Filing edited", editingFilingData.filename);
                                setEditingFilingId(null);
                              } catch (err) { alert("Save failed: " + err.message); }
                            }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text2)", cursor: "pointer", fontWeight: 600 }}>Save</button>
                            <button onClick={() => setEditingFilingId(null)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text3)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{f.fileSize ? fmtFileSize(f.fileSize) : ""}</span>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{f.uploadedByName ? `by ${f.uploadedByName}` : ""}{f.sourceEmailFrom ? `from ${f.sourceEmailFrom}` : ""}</span>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                          <button onClick={() => openAppFilingViewer(f.id, f.filename)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text2)", cursor: "pointer", fontWeight: 500 }}>View</button>
                          <button disabled={filingClassifying === f.id} onClick={async () => { setFilingClassifying(f.id); try { const { classification } = await apiClassifyFiling(f.id); setFilings(prev => prev.map(x => x.id === f.id ? { ...x, filename: classification.suggestedName || x.filename, filedBy: classification.filedBy || x.filedBy, docType: classification.docType || x.docType, filingDate: classification.filingDate || x.filingDate, summary: classification.summary || x.summary } : x)); log("Filing classified", `${classification.suggestedName || f.filename}`); } catch (err) { alert("Classification failed: " + err.message); } setFilingClassifying(null); }} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text2)", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 3, opacity: filingClassifying === f.id ? 0.6 : 1 }}>{filingClassifying === f.id ? "Classifying..." : <><Sparkles size={9} /> Classify</>}</button>
                          <button disabled={filingSummarizing === f.id} onClick={async () => { setFilingSummarizing(f.id); try { const { summary } = await apiSummarizeFiling(f.id); setFilings(prev => prev.map(x => x.id === f.id ? { ...x, summary } : x)); setExpandedFilingId(f.id); log("Filing summarized", f.filename); } catch (err) { alert("Summary failed: " + err.message); } setFilingSummarizing(null); }} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text2)", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 3, opacity: filingSummarizing === f.id ? 0.6 : 1 }}>{filingSummarizing === f.id ? "Summarizing..." : (f.summary ? <><Sparkles size={9} /> Re-summarize</> : <><Sparkles size={9} /> Summarize</>)}</button>
                          {canRemove && <button onClick={async () => { if (!await confirmDelete()) return; try { await apiDeleteFiling(f.id); setFilings(prev => prev.filter(x => x.id !== f.id)); log("Filing deleted", f.filename); } catch (err) { alert("Delete failed: " + err.message); } }} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text2)", cursor: "pointer", fontWeight: 500 }}>Delete</button>}
                        </div>
                      </div>
                      {f.originalFilename && f.originalFilename !== f.filename && (
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, fontStyle: "italic" }}>Original: {f.originalFilename}</div>
                      )}
                      {f.summary && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => setExpandedFilingId(expandedFilingId === f.id ? null : f.id)} style={{ fontSize: 11, fontWeight: 500, color: "var(--c-text2)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{expandedFilingId === f.id ? "▾ Hide Summary" : "▸ View Summary"}</button>
                          {expandedFilingId === f.id && (
                            <div style={{ marginTop: 6 }}>
                              <AiPanel title="Filing Summary" result={f.summary} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filings.length === 0 && !filingsLoading && (
                  <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>No filings yet</div>
                    <div style={{ fontSize: 12 }}>Upload a PDF filing above, or forward an email with a PDF attachment to the case email alias to auto-create filings.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Activity Tab ── */}
        {/* ── Linked Cases Tab ── */}
        {activeTab === "linked" && (
          <div className="case-overlay-body">
            <div className="case-overlay-section">
              <div className="case-overlay-section-title" style={{ marginBottom: 12 }}>
                <span>Linked Cases</span>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>{linkedCases.length} linked</span>
              </div>
              {!showLinkForm && (
                <button className="btn btn-outline btn-sm" style={{ marginBottom: 16 }} onClick={() => { setShowLinkForm(true); setLinkIsPd(null); setLinkCaseSearch(""); setLinkRelationship(""); setLinkExternalForm({ externalCaseNumber: "", externalCaseStyle: "", externalCourt: "", externalCounty: "Mobile", externalCharges: "", externalAttorney: "", externalStatus: "Active", externalNotes: "", relationship: "" }); }}>+ Link a Case</button>
              )}
              {showLinkForm && (
                <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 12 }}>Link a Case</div>
                  {linkIsPd === null && (
                    <div>
                      <div style={{ fontSize: 13, color: "var(--c-text)", marginBottom: 12 }}>Does our firm represent the client in the linked case?</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff" }} onClick={() => setLinkIsPd(true)}>Yes</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setLinkIsPd(false)}>No</button>
                        <button className="btn btn-sm btn-outline" style={{ marginLeft: "auto" }} onClick={() => setShowLinkForm(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {linkIsPd === true && (() => {
                    const q = linkCaseSearch.toLowerCase().trim();
                    const matches = q.length >= 2 ? (allCases || []).filter(ac => ac.id !== c.id && !linkedCases.some(lc => lc.linkedCaseId === ac.id) && (
                      (ac.caseNum || "").toLowerCase().includes(q) || (ac.title || "").toLowerCase().includes(q) || (ac.clientName || "").toLowerCase().includes(q)
                    )).slice(0, 8) : [];
                    return (
                      <div>
                        <div className="form-group">
                          <label>Search cases by number, title, or defendant</label>
                          <input value={linkCaseSearch} onChange={e => setLinkCaseSearch(e.target.value)} placeholder="Start typing to search..." autoFocus />
                        </div>
                        <div className="form-group">
                          <label>Relationship</label>
                          <select value={linkRelationship} onChange={e => setLinkRelationship(e.target.value)}>
                            <option value="">Select relationship...</option>
                            <option>Defendant</option>
                            <option>Related Claim</option>
                            <option>Prior Case</option>
                            <option>Companion Case</option>
                            <option>Appeal</option>
                            <option>Other</option>
                          </select>
                        </div>
                        {matches.length > 0 && (
                          <div style={{ border: "1px solid var(--c-border)", borderRadius: 6, maxHeight: 240, overflowY: "auto", marginBottom: 8 }}>
                            {matches.map(ac => (
                              <div key={ac.id} style={{ padding: "8px 12px", borderBottom: "1px solid var(--c-border2)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onClick={async () => {
                                  try {
                                    const saved = await apiCreateLinkedCase({ caseId: c.id, isPdCase: true, linkedCaseId: ac.id, relationship: linkRelationship });
                                    setLinkedCases(p => [saved, ...p]);
                                    setShowLinkForm(false);
                                  } catch (err) { alert("Failed to link case: " + err.message); }
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{ac.caseNum || "No Case #"}</div>
                                  <div style={{ fontSize: 12, color: "var(--c-text2)" }}>{ac.title || ac.clientName || "Untitled"}</div>
                                </div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>{ac.status || ""}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.length >= 2 && matches.length === 0 && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>No matching cases found.</div>}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="btn btn-sm btn-outline" onClick={() => { setLinkIsPd(null); setLinkCaseSearch(""); }}>Back</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setShowLinkForm(false)}>Cancel</button>
                        </div>
                      </div>
                    );
                  })()}
                  {linkIsPd === false && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div className="form-group"><label>Case Number</label><input value={linkExternalForm.externalCaseNumber} onChange={e => setLinkExternalForm(p => ({ ...p, externalCaseNumber: e.target.value }))} placeholder="e.g. CC-2025-001234" /></div>
                        <div className="form-group"><label>Case Style (Parties)</label><input value={linkExternalForm.externalCaseStyle} onChange={e => setLinkExternalForm(p => ({ ...p, externalCaseStyle: e.target.value }))} placeholder="e.g. Smith v. ABC Insurance Co." /></div>
                        <div className="form-group"><label>Court</label><input value={linkExternalForm.externalCourt} onChange={e => setLinkExternalForm(p => ({ ...p, externalCourt: e.target.value }))} placeholder="e.g. Superior Court" /></div>
                        <div className="form-group"><label>County</label><input value={linkExternalForm.externalCounty} onChange={e => setLinkExternalForm(p => ({ ...p, externalCounty: e.target.value }))} /></div>
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Related Claims (brief description)</label><input value={linkExternalForm.externalCharges} onChange={e => setLinkExternalForm(p => ({ ...p, externalCharges: e.target.value }))} placeholder="e.g. Auto Accident - Personal Injury" /></div>
                        <div className="form-group"><label>Attorney / Counsel</label><input value={linkExternalForm.externalAttorney} onChange={e => setLinkExternalForm(p => ({ ...p, externalAttorney: e.target.value }))} placeholder="e.g. Private counsel name" /></div>
                        <div className="form-group"><label>Status</label>
                          <select value={linkExternalForm.externalStatus} onChange={e => setLinkExternalForm(p => ({ ...p, externalStatus: e.target.value }))}>
                            <option>Active</option><option>Closed</option><option>Pending</option><option>Disposed</option><option>Transferred</option><option>Unknown</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Relationship</label>
                          <select value={linkExternalForm.relationship} onChange={e => setLinkExternalForm(p => ({ ...p, relationship: e.target.value }))}>
                            <option value="">Select relationship...</option>
                            <option>Defendant</option><option>Related Claim</option><option>Prior Case</option><option>Companion Case</option><option>Appeal</option><option>Other</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Notes</label><input value={linkExternalForm.externalNotes} onChange={e => setLinkExternalForm(p => ({ ...p, externalNotes: e.target.value }))} placeholder="Optional notes" /></div>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => { setLinkIsPd(null); }}>Back</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setShowLinkForm(false)}>Cancel</button>
                        <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff" }} disabled={!linkExternalForm.externalCaseNumber.trim() && !linkExternalForm.externalCaseStyle.trim()} onClick={async () => {
                          try {
                            const saved = await apiCreateLinkedCase({ caseId: c.id, isPdCase: false, ...linkExternalForm });
                            setLinkedCases(p => [saved, ...p]);
                            setShowLinkForm(false);
                          } catch (err) { alert("Failed to link case: " + err.message); }
                        }}>Link Case</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {linkedCasesLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0" }}>Loading linked cases...</div>}
              {!linkedCasesLoading && linkedCases.length === 0 && !showLinkForm && (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "20px 0" }}>No linked cases yet. Click "Link a Case" to connect related cases.</div>
              )}
              {linkedCases.map(lc => {
                const isExpanded = expandedLinkedId === lc.id;
                const caseNum = lc.isPdCase ? (lc.linkedCaseNum || "—") : (lc.externalCaseNumber || "—");
                const caseStyle = lc.isPdCase ? (lc.linkedCaseTitle || lc.linkedDefendant || "—") : (lc.externalCaseStyle || "—");
                const charges = lc.isPdCase ? (() => { try { const ch = typeof lc.linkedCharges === "string" ? JSON.parse(lc.linkedCharges) : lc.linkedCharges; return Array.isArray(ch) ? ch.map(x => x.description || x.statute || "").filter(Boolean).join(", ") : ""; } catch { return ""; } })() : (lc.externalCharges || "");
                const status = lc.isPdCase ? (lc.linkedStatus || "") : (lc.externalStatus || "");
                return (
                  <div key={lc.id} className="card" style={{ marginBottom: 8 }}>
                    <div style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }} onClick={() => setExpandedLinkedId(isExpanded ? null : lc.id)}>
                      <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{isExpanded ? "▼" : "▶"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{caseNum}</span>
                          {lc.relationship && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#1E2A3A15", color: "#0f172a", fontWeight: 600 }}>{lc.relationship}</span>}
                          {lc.isPdCase && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#2F7A5F18", color: "#2F7A5F", fontWeight: 600 }}>PD Case</span>}
                          {status && <span style={{ fontSize: 10, color: "#64748b" }}>{status}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--c-text2)", marginTop: 2 }}>{caseStyle}</div>
                        {charges && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{charges}</div>}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: "0 14px 12px 34px", borderTop: "1px solid var(--c-border2)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                          {lc.isPdCase ? (<>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Case Number:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.linkedCaseNum || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Defendant:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.linkedDefendant || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Court:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.linkedCourt || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>County:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.linkedCounty || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Status:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.linkedStatus || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Stage:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.linkedStage || "—"}</div></div>
                            <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: "#64748b" }}>Charges:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{charges || "—"}</div></div>
                          </>) : (<>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Case Number:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalCaseNumber || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Case Style:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalCaseStyle || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Court:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalCourt || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>County:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalCounty || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Status:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalStatus || "—"}</div></div>
                            <div><span style={{ fontSize: 11, color: "#64748b" }}>Attorney:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalAttorney || "—"}</div></div>
                            <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: "#64748b" }}>Charges:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalCharges || "—"}</div></div>
                            {lc.externalNotes && <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: "#64748b" }}>Notes:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.externalNotes}</div></div>}
                          </>)}
                          {lc.relationship && <div><span style={{ fontSize: 11, color: "#64748b" }}>Relationship:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.relationship}</div></div>}
                          <div><span style={{ fontSize: 11, color: "#64748b" }}>Added by:</span><div style={{ fontSize: 13, color: "var(--c-text)" }}>{lc.addedBy || "—"} on {lc.addedAt ? new Date(lc.addedAt).toLocaleDateString() : "—"}</div></div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          {lc.isPdCase && lc.linkedCaseId && onSelectCase && (
                            <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff" }} onClick={() => {
                              const target = (allCases || []).find(ac => ac.id === lc.linkedCaseId);
                              if (target) onSelectCase(target);
                            }}>Go to Case</button>
                          )}
                          <button className="btn btn-sm btn-outline" style={{ color: "#e05252", borderColor: "#e0525233" }} onClick={async () => {
                              if (!await confirmDelete()) return;
                              try {
                                await apiDeleteLinkedCase(lc.id);
                                setLinkedCases(p => p.filter(x => x.id !== lc.id));
                              } catch (err) { alert("Failed to remove: " + err.message); }
                            }}>Unlink</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Client Portal Tab ── */}
        {activeTab === "portal" && (() => {
          const TOGGLES = [
            { key: "show_stage", label: "Case Stage / Progress" },
            { key: "show_attorney_name", label: "Staff Assigned" },
            { key: "show_case_type", label: "Case Type" },
            { key: "show_accident_date", label: "Accident Date" },
            { key: "show_next_court_date", label: "Next Court Date" },
            { key: "show_documents", label: "Firm Documents" },
            { key: "show_messaging", label: "Messaging" },
            { key: "show_medical_treatments", label: "Medical Treatments" },
            { key: "show_negotiations", label: "Negotiations" },
            { key: "show_case_value", label: "Case Value" },
          ];

          const saveSettings = async () => {
            setPortalSaving(true);
            try {
              await apiUpdatePortalSettings(c.id, portalSettings);
              setPortalSaveMsg("Settings saved");
              setTimeout(() => setPortalSaveMsg(""), 3000);
            } catch (err) { alert("Save failed: " + err.message); }
            setPortalSaving(false);
          };

          const sendMessage = async () => {
            if (!portalMsgBody.trim()) return;
            try {
              const msg = await apiSendPortalMessage(c.id, portalMsgBody.trim());
              setPortalMessages(p => [...p, msg]);
              setPortalMsgBody("");
            } catch (err) { alert("Send failed: " + err.message); }
          };

          const inviteClient = async () => {
            const f = portalInviteForm;
            if (!f.name || !f.email) { alert("Name and email are required"); return; }
            try {
              const result = await apiCreatePortalClient(c.id, f);
              setPortalClients(p => [result, ...p]);
              setPortalInviteResult(result);
            } catch (err) { alert("Invite failed: " + err.message); }
          };

          const unreadCount = portalMessages.filter(m => m.sender_type === "client" && !m.read_at).length;

          return (
            <div className="case-overlay-body">
              {portalLoading && <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0" }}>Loading portal settings...</div>}

              {portalSettings && (<>
                <div className="case-overlay-section">
                  <div className="case-overlay-section-title" style={{ marginBottom: 16 }}>
                    <span>Visibility Settings</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {portalSaveMsg && <span style={{ fontSize: 11, color: "#2F7A5F", fontWeight: 600 }}>{portalSaveMsg}</span>}
                      <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", fontSize: 11 }} onClick={saveSettings} disabled={portalSaving}>
                        {portalSaving ? "Saving..." : "Save Settings"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {TOGGLES.map(t => (
                      <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--c-text)", cursor: "pointer" }}>
                        <input type="checkbox" checked={!!portalSettings[t.key]} onChange={e => setPortalSettings(p => ({ ...p, [t.key]: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: "#f59e0b" }} />
                        {t.label}
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Custom Status Message for Client</label>
                    <textarea
                      value={portalSettings.status_message || ""}
                      onChange={e => setPortalSettings(p => ({ ...p, status_message: e.target.value }))}
                      placeholder="e.g. We are currently waiting on medical records from your provider..."
                      rows={3}
                      style={{ width: "100%", fontSize: 13, padding: "8px 10px", border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical" }}
                    />
                  </div>
                </div>

                <div className="case-overlay-section" style={{ marginTop: 24 }}>
                  <div className="case-overlay-section-title" style={{ marginBottom: 12 }}>
                    <span>Client Portal Users</span>
                    <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }} onClick={() => { setPortalInviteOpen(true); setPortalInviteForm({ name: "", email: "", phone: "", sendWelcomeEmail: true }); setPortalInviteResult(null); }}>+ Invite Client</button>
                  </div>
                  {portalClients.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "10px 0" }}>No clients have been invited to the portal yet.</div>}
                  {portalClients.map(cl => (
                    <div key={cl.id} className="card" style={{ padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{cl.name}</div>
                        <div style={{ fontSize: 12, color: "var(--c-text2)" }}>{cl.email}{cl.phone ? ` · ${cl.phone}` : ""}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {cl.is_active === false ? <span style={{ color: "#e05252" }}>Deactivated</span> : <span style={{ color: "#2F7A5F" }}>Active</span>}
                          {cl.last_login ? ` · Last login: ${new Date(cl.last_login).toLocaleDateString()}` : " · Never logged in"}
                        </div>
                      </div>
                      {cl.is_active !== false && (
                        <button className="btn btn-sm btn-outline" style={{ color: "#e05252", borderColor: "#fca5a533", fontSize: 11 }} onClick={async () => {
                          if (!await confirmDelete()) return;
                          try {
                            await apiDeletePortalClient(c.id, cl.id);
                            setPortalClients(p => p.map(x => x.id === cl.id ? { ...x, is_active: false } : x));
                          } catch (err) { alert(err.message); }
                        }}>Deactivate</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="case-overlay-section" style={{ marginTop: 24 }}>
                  <div className="case-overlay-section-title" style={{ marginBottom: 12 }}>
                    <span>Client Messages {unreadCount > 0 && <span style={{ fontSize: 10, background: "#e05252", color: "#fff", borderRadius: "50%", padding: "1px 6px", marginLeft: 6 }}>{unreadCount}</span>}</span>
                  </div>
                  <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid var(--c-border)", borderRadius: 8, padding: 12, marginBottom: 12, background: "var(--c-bg2)" }}>
                    {portalMessages.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No messages yet.</div>}
                    {portalMessages.map(msg => {
                      const isFirm = msg.sender_type === "firm";
                      return (
                        <div key={msg.id} style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: isFirm ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "75%", padding: "8px 12px", borderRadius: 10, background: isFirm ? "#1e3a5f" : "var(--c-bg)", border: isFirm ? "none" : "1px solid var(--c-border)", color: isFirm ? "#fff" : "var(--c-text)", fontSize: 13 }}>
                            {msg.body}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                            {msg.sender_name} · {msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={portalMsgBody}
                      onChange={e => setPortalMsgBody(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Reply to client..."
                      style={{ flex: 1, fontSize: 13, padding: "8px 12px", border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }}
                    />
                    <button className="btn btn-sm" style={{ background: "#1e3a5f", color: "#fff" }} onClick={sendMessage}>Send</button>
                  </div>
                </div>
              </>)}

              {portalInviteOpen && (
                <div className="case-overlay" style={{ zIndex: 10002 }}>
                  <div className="login-box" style={{ width: 440, maxWidth: "95vw" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--c-text)", marginBottom: 16 }}>Invite Client to Portal</div>
                    {!portalInviteResult ? (<>
                      <div className="form-group">
                        <label>Client Name</label>
                        <input value={portalInviteForm.name} onChange={e => setPortalInviteForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={portalInviteForm.email} onChange={e => setPortalInviteForm(p => ({ ...p, email: e.target.value }))} placeholder="client@email.com" />
                      </div>
                      <div className="form-group">
                        <label>Phone (optional)</label>
                        <input value={portalInviteForm.phone} onChange={e => setPortalInviteForm(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 555-5555" />
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--c-text)", marginBottom: 16, cursor: "pointer" }}>
                        <input type="checkbox" checked={portalInviteForm.sendWelcomeEmail} onChange={e => setPortalInviteForm(p => ({ ...p, sendWelcomeEmail: e.target.checked }))} />
                        Send welcome email with login instructions
                      </label>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setPortalInviteOpen(false)}>Cancel</button>
                        <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff" }} onClick={inviteClient}>Create Account</button>
                      </div>
                    </>) : (
                      <div>
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#166534", marginBottom: 8 }}>Account Created</div>
                          <div style={{ fontSize: 13, color: "#15803d" }}>
                            <div><strong>Name:</strong> {portalInviteResult.name}</div>
                            <div><strong>Email:</strong> {portalInviteResult.email}</div>
                            <div style={{ marginTop: 8 }}><strong>Temporary Password:</strong></div>
                            <div style={{ fontFamily: "monospace", fontSize: 18, color: "#1e3a5f", background: "#f0f4f8", border: "1px solid #d0d7de", borderRadius: 6, padding: "8px 16px", textAlign: "center", marginTop: 4, letterSpacing: 2 }}>{portalInviteResult.tempPassword}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                              {portalInviteForm.sendWelcomeEmail ? "A welcome email has been sent with these credentials." : "Share these credentials with the client securely."}
                            </div>
                          </div>
                        </div>
                        <button className="btn btn-sm" style={{ background: "#1e3a5f", color: "#fff", width: "100%" }} onClick={() => setPortalInviteOpen(false)}>Done</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Activity Tab ── */}
        {activeTab === "activity" && (() => {
          const ACTIVITY_FILTERS = [
            { key: "all", label: "All" },
            { key: "field", label: "Field Edits" },
            { key: "note", label: "Notes" },
            { key: "task", label: "Tasks" },
            { key: "link", label: "Links" },
            { key: "deadline", label: "Deadlines" },
            { key: "billing", label: "Billing" },
            { key: "expense", label: "Expenses" },
            { key: "correspondence", label: "Correspondence" },
          ];
          const matchFilter = (entry) => {
            if (activityFilter === "all") return true;
            const a = (entry.action || "").toLowerCase();
            if (activityFilter === "field") return a.includes("changed") || a.includes("updated") || a.includes("custom field") || a.includes("custom date") || a.includes("team");
            if (activityFilter === "note") return a.includes("note");
            if (activityFilter === "task") return a.includes("task");
            if (activityFilter === "link") return a.includes("link");
            if (activityFilter === "deadline") return a.includes("deadline");
            if (activityFilter === "billing") return a.includes("billing");
            if (activityFilter === "expense") return a.includes("expense");
            if (activityFilter === "correspondence") return a.includes("correspondence");
            return true;
          };
          const filtered = activity.filter(matchFilter);
          return (
          <div className="case-overlay-body">
            <div className="case-overlay-section">
              <div className="case-overlay-section-title" style={{ marginBottom: 12 }}>
                <span>Case Activity</span>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>{filtered.length} event{filtered.length !== 1 ? "s" : ""}{activityFilter !== "all" ? ` (filtered)` : ""}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                {ACTIVITY_FILTERS.map(f => (
                  <button key={f.key} className={activityFilter === f.key ? "bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer" : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer"} onClick={() => setActivityFilter(f.key)}>{f.label}</button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "20px 0" }}>
                  {activity.length === 0 ? "No activity recorded yet. Changes to this case will appear here." : "No matching activity for this filter."}
                </div>
              )}

              {filtered.map((entry, i) => (
                <div key={entry.id} className="activity-entry">
                  <div className="activity-avatar-col">
                    <Avatar userId={entry.userId} size={28} />
                    {i < filtered.length - 1 && <div className="activity-line" />}
                  </div>
                  <div className="activity-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: "var(--c-hover)", border: `1px solid ${actionColor(entry.action)}44`,
                        color: actionColor(entry.action),
                      }}>{entry.action}</span>
                      <span style={{ fontSize: 12, color: "var(--c-text)", fontWeight: 500 }}>{entry.userName}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{entry.userRole}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--c-text)", marginBottom: 4, lineHeight: 1.5 }}>{entry.detail}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmtTs(entry.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

      </div>

      {backgroundUploads.length > 0 && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 99999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
          {backgroundUploads.map(u => (
            <div key={u.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", gap: 6, minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                  {u.status === "uploading" && <Loader2 size={14} style={{ color: "#6366f1", animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                  {u.status === "done" && <Check size={14} style={{ color: "#059669", flexShrink: 0 }} />}
                  {u.status === "error" && <AlertCircle size={14} style={{ color: "#dc2626", flexShrink: 0 }} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.filename}</span>
                </div>
                <button onClick={() => removeBackgroundUpload(u.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94a3b8", fontSize: 14, lineHeight: 1 }}>✕</button>
              </div>
              {u.status === "uploading" && (
                <div style={{ width: "100%", height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${u.progress}%`, height: "100%", background: "#6366f1", borderRadius: 2, transition: "width 0.3s ease" }} />
                </div>
              )}
              <div style={{ fontSize: 11, color: u.status === "error" ? "#dc2626" : u.status === "done" ? "#059669" : "#64748b" }}>
                {u.status === "uploading" && `Uploading... ${u.progress}%`}
                {u.status === "done" && "Upload complete"}
                {u.status === "error" && (u.error || "Upload failed")}
              </div>
            </div>
          ))}
        </div>
      )}

    </>
  );
}

// ─── CaseFileLinks Component ──────────────────────────────────────────────────
// Stores local file path strings (not file contents) — user pastes or types a
// path and it's saved as a clickable link that opens via the file:// protocol.
const LINK_CATEGORIES = ["General", "Motions", "Discovery", "Medical Records", "Insurance", "Expert Reports", "Demand/Settlement", "Court Orders", "Depositions", "Photographs", "Other"];

function CaseFileLinks({ caseId, links, currentUser, onAddLink, onDeleteLink, confirmDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState("General");

  const handleAdd = () => {
    const path = newPath.trim();
    if (!path) return;
    // Derive a display label from the filename if none provided
    const label = newLabel.trim() || path.split(/[\\/]/).pop() || path;
    onAddLink({
      id: newId(),
      caseId,
      path,
      label,
      category: newCat,
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    });
    setNewPath("");
    setNewLabel("");
    setNewCat("General");
    setShowForm(false);
  };

  const openLink = (path) => {
    // Normalise backslashes → forward slashes for file:// URI
    const uri = "file:///" + path.replace(/\\/g, "/").replace(/^\/+/, "");
    window.open(uri, "_blank");
  };

  // Derive a file-type icon from the extension
  const linkIcon = (path) => {
    const ext = (path || "").split(".").pop().toLowerCase();
    const map = { pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊", ppt: "📋", pptx: "📋", txt: "📃", csv: "📊", jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", msg: "📧", eml: "📧", zip: "🗜️" };
    return map[ext] || "📎";
  };

  return (
    <div className="case-overlay-section">
      <div className="case-overlay-section-title" style={{ marginBottom: 14 }}>
        <span>Linked Files {links.length > 0 && <span style={{ color: "#64748b" }}>({links.length})</span>}</span>
        <button
          className="btn btn-outline btn-sm"
          style={{ fontSize: 11 }}
          onClick={() => setShowForm(s => !s)}
        >{showForm ? "Cancel" : "+ Add Link"}</button>
      </div>

      {showForm && (
        <div style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)", borderRadius: 7, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>File Path *</label>
            <input
              autoFocus
              value={newPath}
              onChange={e => setNewPath(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="e.g. C:\Cases\Smith v Jones\Complaint.pdf or /Users/ben/cases/file.pdf"
              style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
            />
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Paste the full path to the file on your computer or network drive.</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Display Name <span style={{ color: "#64748b" }}>(optional)</span></label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="Defaults to filename"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Category</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ height: 36 }}>
                {LINK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-gold" style={{ fontSize: 12 }} onClick={handleAdd} disabled={!newPath.trim()}>Add Link</button>
            <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={() => { setShowForm(false); setNewPath(""); setNewLabel(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {links.length === 0 && !showForm && (
        <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
          No linked files yet. Click "+ Add Link" to paste a local or network file path.
        </div>
      )}

      {links.length > 0 && (
        <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 6, overflow: "hidden" }}>
          {links.map((link, i) => (
            <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < links.length - 1 ? "1px solid var(--c-border2)" : "none", transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: 18, flexShrink: 0, width: 26, textAlign: "center" }}>{linkIcon(link.path)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  onClick={() => openLink(link.path)}
                  title={link.path}
                  style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text)"; e.currentTarget.style.textDecoration = "none"; }}
                >
                  {link.label}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#64748b", background: "var(--c-border)", border: "1px solid var(--c-border3)", borderRadius: 3, padding: "1px 5px" }}>{link.category}</span>
                  <span style={{ fontSize: 10, color: "var(--c-text2)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }} title={link.path}>{link.path}</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Added by {link.addedBy} · {new Date(link.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
              <button
                onClick={async () => { if (!await confirmDelete()) return; onDeleteLink(link.id); }}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px 6px", fontSize: 14, flexShrink: 0, lineHeight: 1 }}
                title="Remove link"
                onMouseEnter={e => e.currentTarget.style.color = "#e05252"}
                onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
              >🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Note type config ─────────────────────────────────────────────────────────
const NOTE_TYPES = [
  { label: "General",          color: "var(--c-text2)", bg: "var(--c-card)" },
  { label: "Attorney Note",    color: "#0f172a", bg: "#fef3c7" },
  { label: "Client Contact",   color: "#5599cc", bg: "#f1f5f9" },
  { label: "Settlement Discussion",  color: "#44bbaa", bg: "#ccfbf1" },
  { label: "Court / Hearing",  color: "#e07a30", bg: "#fff7ed" },
  { label: "Investigation",    color: "#4CAE72", bg: "#dcfce7" },
  { label: "Witness Interview", color: "#a066cc", bg: "#fdf4ff" },
  { label: "Social Work",      color: "#e05252", bg: "#fef2f2" },
  { label: "Internal",         color: "#64748b", bg: "var(--c-bg)" },
];

const noteTypeStyle = (label) => NOTE_TYPES.find(t => t.label === label) || NOTE_TYPES[0];

// ─── CaseNotes Component ──────────────────────────────────────────────────────
function CaseNotes({ caseId, notes, currentUser, onAddNote, onDeleteNote, onUpdateNote, caseRecord, confirmDelete, collapseToggle }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ type: "General", body: "", time: "" });
  const [assignId, setAssignId] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const speechRecRef = useRef(null);
  const speechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleSpeech = useCallback(() => {
    if (isListening && speechRecRef.current) {
      speechRecRef.current.stop();
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
      }
      if (transcript) {
        setForm(p => ({ ...p, body: p.body + (p.body && !p.body.endsWith(" ") ? " " : "") + transcript }));
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") alert("Microphone access was denied. Please allow microphone permissions.");
      setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    speechRecRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening]);

  useEffect(() => {
    return () => { if (speechRecRef.current) { try { speechRecRef.current.stop(); } catch {} } };
  }, []);

  const currentIsSupportStaff = isSupportStaff(currentUser);

  const caseTeamIds   = caseRecord ? [caseRecord.assignedAttorney, caseRecord.secondAttorney, caseRecord.caseManager, caseRecord.investigator, caseRecord.paralegal].filter(id => id > 0) : [];
  const caseTeamUsers = USERS.filter(u => caseTeamIds.includes(u.id) && isAttyPara(u));
  const otherAttyPara = USERS.filter(u => !caseTeamIds.includes(u.id) && isAttyPara(u));

  const handleAdd = () => {
    if (!form.body.trim()) return;
    onAddNote({
      id: newId(),
      caseId,
      type: form.type,
      body: form.body.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: new Date().toISOString(),
      timeLogged: form.time.trim() || null,
      timeLogUser: (currentIsSupportStaff && assignId > 0) ? assignId : null,
    });
    if (speechRecRef.current) { try { speechRecRef.current.stop(); } catch {} }
    setIsListening(false);
    setForm({ type: "General", body: "", time: "" });
    setAssignId(0);
    setShowForm(false);
  };

  return (
    <div className="panel-section">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {collapseToggle}
          <div className="panel-section-title" style={{ marginBottom: 0 }}>
            Notes {notes.length > 0 && <span style={{ color: "#64748b" }}>({notes.length})</span>}
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          style={{ fontSize: 11 }}
          onClick={() => { setShowForm(s => !s); setExpandedId(null); if (showForm) { setAssignId(0); if (speechRecRef.current) { try { speechRecRef.current.stop(); } catch {} } setIsListening(false); } }}
        >
          {showForm ? "Cancel" : "+ Add Note"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-border3)", borderRadius: 7, padding: 14, marginBottom: 12 }}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label>Note Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {NOTE_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ marginBottom: 0 }}>Note</label>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleSpeech}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", fontSize: 11, fontWeight: 500,
                    border: isListening ? "1px solid #ef4444" : "1px solid var(--c-border)",
                    borderRadius: 5,
                    background: isListening ? "rgba(239,68,68,0.1)" : "var(--c-bg)",
                    color: isListening ? "#ef4444" : "var(--c-text2)",
                    cursor: "pointer",
                    animation: isListening ? "pulse-mic 1.5s infinite" : "none",
                  }}
                  title={isListening ? "Stop dictation" : "Start voice dictation"}
                >
                  <span style={{ fontSize: 14 }}>{isListening ? "🔴" : "🎙️"}</span>
                  {isListening ? "Listening…" : "Dictate"}
                </button>
              )}
            </div>
            <textarea
              rows={5}
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder={isListening ? "Speak now — your words will appear here…" : "Enter detailed note here…"}
              style={{ resize: "vertical", marginTop: 4 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label>Time Spent <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>(optional — e.g. 1.5 hours, 30 min)</span></label>
            <input
              type="text"
              placeholder="e.g. 1.5 hours, 30 min"
              value={form.time}
              onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
            />
          </div>
          {currentIsSupportStaff && (
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Assign Time Credit To <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>(optional)</span></label>
              <StaffSearchField value={assignId} onChange={val => setAssignId(val)} placeholder="Search attorneys…" userList={[...caseTeamUsers, ...otherAttyPara]} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-gold" style={{ fontSize: 12 }} onClick={handleAdd} disabled={!form.body.trim()}>
              Save Note
            </button>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Will be recorded as {currentUser.name} · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 && !showForm && (
        <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>No notes yet. Click "+ Add Note" to create the first one.</div>
      )}
      {notes.length > 0 && (
        <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 6, overflow: "hidden" }}>
          {notes.map((note, i) => {
            const ts = noteTypeStyle(note.type);
            const dt = new Date(note.createdAt);
            const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const isExpanded = expandedId === note.id;
            const preview = note.body.length > 80 ? note.body.slice(0, 80) + "…" : note.body;

            return (
              <div
                key={note.id}
                className={`note-item ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
              >
                {/* Collapsed header — always visible */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isExpanded ? 10 : 4 }}>
                  <span
                    className="note-type-badge"
                    style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.color}44` }}
                  >
                    {note.type}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b", flex: 1 }}>{note.authorName}</span>
                  <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>{dateStr}</span>
                  <span style={{ fontSize: 10, color: "#e2e8f0" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>

                {!isExpanded && (
                  <div style={{ fontSize: 12, color: "#64748b", paddingLeft: 2, fontStyle: "italic", lineHeight: 1.4 }}>
                    {preview}
                  </div>
                )}

                {/* Expanded body */}
                {isExpanded && (
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>👤 {note.authorName} ({note.authorRole})</span>
                      <span>🕐 {dateStr} at {timeStr}</span>
                    </div>
                    {editingNoteId === note.id ? (
                      <div onClick={e => e.stopPropagation()}>
                        <textarea
                          rows={6}
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          style={{ width: "100%", fontSize: 13, lineHeight: 1.7, padding: "10px 12px", borderRadius: 5, border: "1px solid var(--c-accent)", background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                          autoFocus
                        />
                        <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 11 }}
                            onClick={() => { setEditingNoteId(null); setEditBody(""); }}
                            disabled={editSaving}
                          >Cancel</button>
                          <button
                            className="btn btn-gold btn-sm"
                            style={{ fontSize: 11 }}
                            disabled={editSaving || !editBody.trim() || editBody.trim() === note.body}
                            onClick={async () => {
                              setEditSaving(true);
                              try {
                                await onUpdateNote(note.id, { body: editBody.trim() });
                                setEditingNoteId(null);
                                setEditBody("");
                              } catch (err) {
                                alert("Failed to update note: " + err.message);
                              } finally {
                                setEditSaving(false);
                              }
                            }}
                          >{editSaving ? "Saving…" : "Save"}</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "var(--c-text)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--c-hover)", padding: "10px 12px", borderRadius: 5, border: "1px solid var(--c-border)" }}>
                        {note.body}
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      {editingNoteId !== note.id && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11 }}
                          onClick={e => { e.stopPropagation(); setEditingNoteId(note.id); setEditBody(note.body); }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11, color: "#e05252", borderColor: "#fca5a5" }}
                        onClick={async e => { e.stopPropagation(); if (!await confirmDelete()) return; onDeleteNote(note.id); setExpandedId(null); }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Case Print View (full case file with notes) ──────────────────────────────
function CasePrintView({ c, notes, tasks, deadlines, links, onClose }) {

  const handlePrint = () => {
    const el = document.getElementById("case-print-content");
    const w = window.open("", "_blank", "width=900,height=800");
    w.document.write(`
      <html><head><title>${c.title} — Case File</title>
      <style>
        body { font-family: Georgia, 'Inter', serif; color: #111; margin: 0; padding: 0; }
        .doc { padding: 60px 72px; max-width: 816px; margin: 0 auto; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
        .meta { font-size: 11px; color: #777; margin-bottom: 24px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; margin-bottom: 8px; }
        .ip { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 12px; }
        .ik { color: #666; min-width: 130px; flex-shrink: 0; }
        .iv { color: #111; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
        th { text-align: left; padding: 5px 8px; background: #f5f5f5; border-bottom: 1px solid #bbb; font-size: 11px; color: #555; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        .note-block { margin-bottom: 14px; padding: 12px 14px; border: 1px solid #ddd; border-radius: 4px; page-break-inside: avoid; }
        .note-head { display: flex; gap: 12px; align-items: center; margin-bottom: 6px; font-size: 11px; color: #555; }
        .nt { font-weight: 700; color: #333; font-size: 12px; }
        .nb { font-size: 13px; color: #222; line-height: 1.65; white-space: pre-wrap; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
        @page { margin: 0.75in; }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const lead = getUserById(c.assignedAttorney);
  const second = getUserById(c.secondAttorney);
  const para = getUserById(c.caseManager);
  const inv = getUserById(c.investigator);
  const sw = getUserById(c.paralegal);
  const now = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="print-overlay">
      <div style={{ width: "100%", maxWidth: 860 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
          <div style={{ color: "var(--c-text)", fontSize: 14, fontWeight: 600 }}>📄 Case File Preview — {c.title}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-gold" onClick={handlePrint}>🖨 Print / Save as PDF</button>
            <button className="btn btn-outline" onClick={onClose}>✕ Close</button>
          </div>
        </div>

        {/* Document preview */}
        <div id="case-print-content">
          <div className="print-doc">
            {/* Header */}
            <div style={{ borderBottom: "2px solid #333", paddingBottom: 16, marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ marginBottom: 4, fontFamily: "Georgia, serif" }}>{c.title}</h1>
                  <div className="meta">
                    {c.caseNum && <span style={{ marginRight: 16 }}>Case No. {c.caseNum}</span>}
                    {c.caseType && <span style={{ marginRight: 16 }}>{c.caseType}</span>}
                    <span>Status: {c.status}</span>
                    {c.stage && <span style={{ marginLeft: 16 }}>Stage: {c.stage}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "#777" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 2 }}>MattrMindr</div>
                  <div>Printed {now}</div>
                </div>
              </div>
            </div>

            {/* Case details */}
            <h2>Case Information</h2>
            <div className="info-grid">
              {[
                ["Client", c.clientName],
                ["Case Type", c.caseType],
                ["Injury Type", c.injuryType],
                ["Accident Date", c.accidentDate],
                ["State Jurisdiction", c.stateJurisdiction],
                ["SOL Date", c.statuteOfLimitationsDate],
                ["County", c.county],
                ["Court", c.court],
                ["Judge", c.judge],
                ["Liability Assessment", c.liabilityAssessment],
                ["Comparative Fault %", c.comparativeFaultPct],
                ["Case Value Estimate", c.caseValueEstimate],
                ["Demand Amount", c.demandAmount],
                ["Settlement Amount", c.settlementAmount],
                ["Assigned Attorney", lead?.name],
                ["2nd Attorney", second?.name],
                ["Case Manager", para?.name],
                ["Investigator", inv?.name],
                ["Paralegal", sw?.name],
                ...(c._customTeam || []).map(m => [m.role, USERS.find(u => u.id === m.userId)?.name]),
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="ip"><span className="ik">{k}</span><span className="iv">{v}</span></div>
              ))}
            </div>

            {/* Key dates */}
            <h2>Key Dates</h2>
            <div className="info-grid">
              {[
                ["Accident Date", fmt(c.accidentDate)],
                ["SOL Date", fmt(c.statuteOfLimitationsDate)],
                ["Next Court Date", fmt(c.nextCourtDate)],
                ["Trial Date", fmt(c.trialDate)],
                ["Disposition Date", fmt(c.dispositionDate)],
              ].map(([k, v]) => (
                <div key={k} className="ip"><span className="ik">{k}</span><span className="iv">{v}</span></div>
              ))}
            </div>

            {/* Deadlines */}
            {deadlines.length > 0 && (
              <>
                <h2>Deadlines</h2>
                <table>
                  <thead><tr><th>Deadline</th><th>Type</th><th>Due Date</th><th>Days</th></tr></thead>
                  <tbody>
                    {[...deadlines].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(d => {
                      const days = daysUntil(d.date);
                      return (
                        <tr key={d.id}>
                          <td>{d.title}</td>
                          <td>{d.type || "—"}</td>
                          <td>{fmt(d.date)}</td>
                          <td>{days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <>
                <h2>Tasks</h2>
                <table>
                  <thead><tr><th>Task</th><th>Assigned To</th><th>Due</th><th>Status</th><th>Priority</th><th>Time</th></tr></thead>
                  <tbody>
                    {[...tasks].sort((a, b) => (a.due || "").localeCompare(b.due || "")).map(t => (
                      <tr key={t.id}>
                        <td>{t.title}</td>
                        <td>{getUserById(t.assigned)?.name || "—"}</td>
                        <td>{fmt(t.due)}</td>
                        <td>{t.status}</td>
                        <td>{getEffectivePriority(t)}</td>
                        <td>{t.timeLogged || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Notes */}
            <h2>Notes {notes.length > 0 ? `(${notes.length})` : "(None)"}</h2>
            {notes.length === 0 && <p style={{ fontSize: 12, color: "#777", fontStyle: "italic" }}>No notes on record for this case.</p>}
            {[...notes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(note => {
              const dt = new Date(note.createdAt);
              return (
                <div key={note.id} className="note-block">
                  <div className="note-head">
                    <span className="nt">{note.type}</span>
                    <span>·</span>
                    <span>{note.authorName} ({note.authorRole})</span>
                    <span>·</span>
                    <span>{dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    {note.timeLogged && <><span>·</span><span style={{ fontWeight: 600 }}>⏱ {note.timeLogged}</span></>}
                  </div>
                  <div className="nb">{note.body}</div>
                </div>
              );
            })}

            {/* Linked Files index */}
            {links && links.length > 0 && (
              <>
                <h2>Linked Files ({links.length})</h2>
                <table>
                  <thead><tr><th>Label</th><th>Category</th><th>Path</th><th>Added By</th><th>Date</th></tr></thead>
                  <tbody>
                    {links.map(link => (
                      <tr key={link.id}>
                        <td>{link.label}</td>
                        <td>{link.category || "General"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 10, wordBreak: "break-all" }}>{link.path}</td>
                        <td>{link.addedBy}</td>
                        <td>{new Date(link.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Footer */}
            <div className="footer">
              <span>MattrMindr Case Management · Confidential — Attorney Work Product</span>
              <span>Printed {now}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── iCal parser (client-side, no network needed for stored data) ─────────────


export { CaseDetailOverlay, CasePrintView, EditField, CaseFileLinks, CaseNotes };
