import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { USERS } from "./firmData.js";
import PortalApp from "./portal/PortalApp.js";
import DocViewerWindow from "./DocViewerWindow.js";
import TranscriptViewerWindow from "./TranscriptViewerWindow.js";
import { LayoutDashboard, Briefcase, Calendar, CheckSquare, FileText, Clock, BarChart3, Brain, MessageSquare, Users, UserCog, Settings, HelpCircle, Menu, X, Bot, Search, Plus, Download, Scale, Pin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, CalendarClock, PenLine, FileSearch, ListChecks, FolderOpen, Layers, User, CalendarDays, ClipboardList, AlertCircle, BarChart2, Lock, Mic, Upload, FileAudio, Pencil, Trash2, Loader2, Merge, Check, RotateCcw, FolderPlus, Camera, Shield, Eye, Video, SlidersHorizontal, GitBranch, Zap, ToggleLeft, ToggleRight, Filter, RefreshCw, Inbox, Mail, MessageCircle } from "lucide-react";
import {
  apiLogin, apiLogout, apiChangePassword, apiForgotPassword, apiResetPassword, apiSendTempPassword, apiMe, apiSavePreferences,
  apiGetCases, apiGetDeletedCases, apiGetCasesAll, apiCreateCase, apiUpdateCase, apiDeleteCase, apiRestoreCase,
  apiGetTasks, apiGetCaseTasks, apiCreateTask, apiCreateTasks, apiUpdateTask, apiCompleteTask, apiReassignTasksByRole,
  apiGetDeadlines, apiCreateDeadline, apiUpdateDeadline, apiDeleteDeadline,
  apiGetUsers, apiCreateUser, apiDeleteUser, apiGetDeletedUsers, apiRestoreUser, apiUpdateUserRoles, apiUpdateUser,
  apiGetNotes, apiGetQuickNotes, apiCreateNote, apiUpdateNote, apiDeleteNote,
  apiGetLinks, apiCreateLink, apiDeleteLink,
  apiGetActivity, apiGetRecentActivity, apiCreateActivity,
  apiGetContacts, apiGetDeletedContacts, apiCreateContact, apiUpdateContact, apiDeleteContact, apiRestoreContact, apiMergeContacts, apiGetContactCases, apiGetContactCaseCounts,
  apiGetContactNotes, apiCreateContactNote, apiDeleteContactNote,
  apiGetContactStaff, apiCreateContactStaff, apiUpdateContactStaff, apiDeleteContactStaff,
  apiGetContactPhones, apiAddContactPhone, apiUpdateContactPhone, apiDeleteContactPhone,
  apiGetContactCaseLinks, apiAddContactCaseLink, apiDeleteContactCaseLink,
  apiAiSearch,
  apiChargeAnalysis, apiDeadlineGenerator, apiCaseStrategy, apiDraftDocument, apiCaseTriage, apiClientSummary, apiDocSummary, apiTaskSuggestions, apiAdvocateChat,
  apiGetCaseDocuments, apiUploadCaseDocument, apiSummarizeDocument, apiGetDocOcrStatus, apiDownloadDocument, apiDeleteCaseDocument, apiUpdateCaseDocument,
  apiGetFilings, apiUploadFiling, apiDeleteFiling, apiSummarizeFiling, apiUpdateFiling, apiClassifyFiling,
  apiGetCorrespondence, apiDeleteCorrespondence, apiGetAllCorrespondence,
  apiGetVoicemails, apiCreateVoicemail, apiUpdateVoicemail, apiDeleteVoicemail, apiTranscribeVoicemail,
  apiGetParties, apiCreateParty, apiUpdateParty, apiDeleteParty,
  apiConflictCheck,
  apiGetExperts, apiCreateExpert, apiUpdateExpert, apiDeleteExpert,
  apiGetMiscContacts, apiCreateMiscContact, apiUpdateMiscContact, apiDeleteMiscContact,
  apiGetTemplates, apiDeleteTemplate, apiUpdateTemplate, apiGetTemplateSource, apiUploadTemplateFile, apiSaveTemplate, apiGenerateDocument, apiDetectPleadingSections,
  apiGetTimeEntries, apiCreateTimeEntry, apiUpdateTimeEntry, apiDeleteTimeEntry,
  apiGetTraining, apiCreateTraining, apiUploadTrainingDoc, apiUpdateTraining, apiDeleteTraining,
  apiGetPinnedCases, apiSetPinnedCases,
  apiBatchPreview, apiBatchApply,
  apiGetCalendarFeeds, apiCreateCalendarFeed, apiUpdateCalendarFeed, apiDeleteCalendarFeed,
  apiGetInsurancePolicies, apiCreateInsurancePolicy, apiUpdateInsurancePolicy, apiDeleteInsurancePolicy,
  apiGetMedicalTreatments, apiCreateMedicalTreatment, apiUpdateMedicalTreatment, apiDeleteMedicalTreatment,
  apiUploadMedicalRecord, apiGetMedicalRecords, apiDeleteMedicalRecord, apiUpdateMedicalRecord, apiMedicalRecordFromDocument, apiCommitMedicalRecords,
  apiGetLiens, apiCreateLien, apiUpdateLien, apiDeleteLien,
  apiGetDamages, apiCreateDamage, apiUpdateDamage, apiDeleteDamage, apiDamageFromDocument, apiUploadDamageBill,
  apiGetExpenses, apiCreateExpense, apiUpdateExpense, apiDeleteExpense,
  apiGetNegotiations, apiCreateNegotiation, apiUpdateNegotiation, apiDeleteNegotiation,
  apiGetLinkedCases, apiCreateLinkedCase, apiDeleteLinkedCase,
  apiGetPortalSettings, apiUpdatePortalSettings, apiGetPortalClients, apiCreatePortalClient, apiDeletePortalClient,
  apiGetPortalMessages, apiSendPortalMessage, apiMarkPortalMsgRead,
  apiGetSmsConfigs, apiCreateSmsConfig, apiUpdateSmsConfig, apiDeleteSmsConfig,
  apiGetSmsMessages, apiGetSmsScheduled, apiSendSms, apiDraftSmsMessage,
  apiGetSmsWatch, apiAddSmsWatch, apiDeleteSmsWatch, apiGetUnmatchedSms, apiAssignSms, apiGetUnmatchedEmails, apiAssignUnmatchedEmail, apiReprocessUnmatchedEmails, apiReprocessStatus,
  apiGetPermissionKeys, apiGetPermissions, apiCreatePermissionsBulk, apiDeletePermissionsBulk, apiCheckPermissions,
  apiSendSupport,
  apiGetCollabUnreadCount,
  apiGetTranscripts, apiUploadTranscript, apiUploadTranscriptChunked, apiGetTranscriptDetail, apiUpdateTranscript, apiDeleteTranscript, apiDownloadTranscriptAudio, apiExportTranscript, apiSuggestTranscriptName, apiGetTranscriptHistory, apiSaveTranscriptHistory, apiRevertTranscript,
  apiMfaSetup, apiMfaVerifySetup, apiMfaVerify, apiMfaDisable,
  apiUploadProfilePicture, apiDeleteProfilePicture,
  apiGetDocFolders, apiCreateDocFolder, apiUpdateDocFolder, apiDeleteDocFolder, apiMoveDocument, apiBatchMoveDocuments,
  apiGetTranscriptFolders, apiCreateTranscriptFolder,
  apiBatchDeleteDocuments, apiBatchDeleteTranscripts, apiBatchDeleteCorrespondence, apiBatchDeleteSmsMessages, apiBatchDeleteFilings,
  apiUploadCaseDocumentChunked, apiUploadFilingChunked,
  apiDownloadFiling,
  apiGetUnreadClientComm,
  apiGetDeletedData, apiRestoreDeletedItem, apiBatchRestoreDeleted, apiBatchPurgeDeleted,
  apiParseIntake,
  apiGetDocHtml, apiGetXlsxData, apiGetPptxSlides, apiGetAnnotations, apiGetOfficeViewUrl,
  apiGetMsStatus, apiGetMsConfigured, apiGetMsAuthUrl, apiDisconnectMs, apiConfigureMs,
  apiGetMsCalendarSettings, apiUpdateMsCalendarSettings, apiSyncAllDeadlinesToOutlook, apiGetOutlookEvents,
  apiGetOutlookContacts, apiImportOutlookContacts, apiExportContactsToOutlook,
  apiResolveOneDriveLink, apiImportOneDriveFile,
  apiGetOnlyofficeStatus,
  apiGetScribeStatus, apiConnectScribe, apiDisconnectScribe, apiGetScribeSummaries, apiSummarizeTranscript, apiSendToScribe, apiImportFromScribe, apiListScribeTranscripts, apiImportNewFromScribe,
  apiGetVoirdireStatus, apiConnectVoirdire, apiDisconnectVoirdire,
  apiGetCustomReports, apiCreateCustomReport, apiUpdateCustomReport, apiDeleteCustomReport, apiRunCustomReport, apiCustomReportAiAssist,
  apiGetCustomAgents, apiCreateCustomAgent, apiUpdateCustomAgent, apiDeleteCustomAgent, apiRunCustomAgent, apiChatCustomAgent, apiUploadAgentInstructions, apiClearAgentInstructions,
  apiGetTaskFlows, apiGetTaskFlow, apiCreateTaskFlow, apiUpdateTaskFlow, apiDeleteTaskFlow,
  apiGetCustomWidgets, apiCreateCustomWidget, apiUpdateCustomWidget, apiDeleteCustomWidget, apiRunCustomWidget,
} from "./api.js";
import CollaborateView from "./CollaborateView.js";
import TrialCenterView from "./TrialCenterView.js";

import {
  STAFF_ROLES, hasRole, isAppAdmin, AVATAR_PALETTE, makeInitials, pickAvatar,
  today, newId, addDays, fmt, fmtFileSize, daysUntil, urgencyColor, recordType,
  PRIORITY_RANK, RANK_PRIORITY, getEffectivePriority,
  TASK_CHAINS, MULTI_CHAINS, DUAL_CHAINS, generateDefaultTasks,
  isDarkMode, statusBadgeStyle, Badge, getUserById, Avatar,
  ScribeTranscriptButtons, SortTh, DragDropZone,
  US_STATES, COURT_RULES,
  ATTY_PARA_ROLES, isAttyPara, isSupportStaff,
  Toggle, AiPanel, EscalateBox,
  CaseSearchField, StaffSearchField,
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

const FONTS = ``;

const CSS = `
${FONTS}
:root {
  --c-text:    #1e293b;
  --c-text-h:  #0f172a;
  --c-text2:   #475569;
  --c-text3:   #64748b;
  --c-text4:   #64748b;
  --c-bg:      #f8fafc;
  --c-bg2:     #f1f5f9;
  --c-card:    #FFFFFF;
  --c-hover:   #f1f5f9;
  --c-border:  #e2e8f0;
  --c-border2: #f1f5f9;
  --c-border3: #e2e8f0;
  --c-accent:  #f59e0b;
  --c-success: #059669;
  --c-warning: #d97706;
  --c-error:   #dc2626;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--c-bg); color: var(--c-text); font-family: 'Inter', sans-serif; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f8fafc; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.app { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 240px; background: #f1f5f9; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid #e2e8f0; }
.sidebar-logo-text { font-family: 'Inter', sans-serif; font-size: 17px; color: #0f172a; font-weight: 700; }
.sidebar-logo-sub { font-size: 10px; color: #64748b; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 2px; }
.sidebar-user { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
.sidebar-user-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-role { font-size: 11px; color: #64748b; }
.sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 0; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; cursor: pointer; font-size: 13.5px; color: #64748b; border-left: 3px solid transparent; transition: all 0.15s; font-family: 'Inter', sans-serif; }
.nav-item:hover { color: #1e293b; background: #f1f5f9; }
.nav-item.active { color: #0f172a; background: #f1f5f9; border-left-color: #f59e0b; font-weight: 600; }
.nav-icon { font-size: 15px; width: 18px; text-align: center; }
.nav-badge { margin-left: auto; background: #f5dada; color: #B24A4A; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { padding: 14px 28px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; flex-shrink: 0; flex-wrap: wrap; gap: 10px; }
.topbar-title { font-family: 'Inter', sans-serif; font-size: 20px; color: #0f172a; font-weight: 600; }
.topbar-subtitle { font-size: 12px; color: #64748b; margin-top: 1px; }
.topbar-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.btn { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; font-family: 'Inter', sans-serif; }
.btn-gold { background: #f59e0b; color: #0f172a; }
.btn-gold:hover { background: #d97706; }
.btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; color: #475569; border: 1px solid #e2e8f0; }
.btn-outline:hover { border-color: #94a3b8; color: #0f172a; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.content { flex: 1; overflow-y: auto; padding: 24px 28px; background: #f8fafc; }
.card { background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.card-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
.card-title { font-family: 'Inter', sans-serif; font-size: 15px; color: #1e293b; font-weight: 600; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-family: 'Inter', sans-serif; }
.stat-value { font-family: 'Inter', sans-serif; font-size: 32px; color: #0f172a; font-weight: 700; margin-top: 4px; }
.stat-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 14px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; white-space: nowrap; font-family: 'Inter', sans-serif; font-weight: 600; }
td { padding: 11px 14px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-family: 'Inter', sans-serif; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f1f5f9; }
.clickable-row { cursor: pointer; }
.selected-row td { background: #f1f5f9 !important; }
.selected-row td:first-child { border-left: 3px solid #f59e0b; }
input:not([type=radio]):not([type=checkbox]), select, textarea { background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; padding: 8px 12px; border-radius: 8px; font-size: 13.5px; font-family: 'Inter', sans-serif; width: 100%; }
input:not([type=radio]):not([type=checkbox]):focus, select:focus, textarea:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
input[type=radio], input[type=checkbox] { width: auto; padding: 0; border: none; background: none; cursor: pointer; }
label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; font-family: 'Inter', sans-serif; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 14px; }
.tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
.tab { padding: 8px 16px; font-size: 13px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; font-weight: 500; white-space: nowrap; font-family: 'Inter', sans-serif; }
.tab.active { color: #0f172a; border-bottom-color: #f59e0b; font-weight: 600; }
.tab:hover:not(.active) { color: #334155; }
.tab-divider { width: 1px; background: #e2e8f0; margin: 4px 6px; }
.deadline-item { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; }
.deadline-item:last-child { border-bottom: none; }
.dl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dl-info { flex: 1; min-width: 0; }
.dl-title { font-size: 13.5px; color: #0f172a; font-family: 'Inter', sans-serif; }
.dl-case { font-size: 11.5px; color: #64748b; margin-top: 2px; }
.empty { text-align: center; padding: 40px 20px; color: #64748b; font-size: 14px; }
.detail-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 440px; background: #FFFFFF; border-left: 1px solid #e2e8f0; z-index: 500; overflow-y: auto; box-shadow: -10px 0 30px rgba(0,0,0,0.15); }
.panel-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: flex-start; justify-content: space-between; position: sticky; top: 0; background: #FFFFFF; z-index: 1; }
.panel-content { padding: 20px 24px; }
.panel-section { margin-bottom: 22px; }
.panel-section-title { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; font-weight: 600; font-family: 'Inter', sans-serif; }
.info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; gap: 12px; }
.info-row:last-child { border-bottom: none; }
.info-key { color: #64748b; flex-shrink: 0; }
.info-val { color: #1e293b; text-align: right; word-break: break-word; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(3px); }
.modal { background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; width: 620px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
.modal-body { flex: 1; overflow-y: auto; min-height: 0; }
.modal-title { font-family: 'Inter', sans-serif; font-size: 20px; color: #0f172a; font-weight: 600; margin-bottom: 4px; }
.modal-sub { font-size: 12px; color: #64748b; margin-bottom: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; flex-shrink: 0; position: sticky; bottom: -28px; background: inherit; padding-bottom: 0; z-index: 1; }
.login-bg { min-height: 100vh; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
.login-box { background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 16px; padding: 44px 40px; width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
.login-title { font-family: 'Inter', sans-serif; font-size: 26px; color: #0f172a; text-align: center; margin-bottom: 6px; }
.login-sub { font-size: 12px; color: #64748b; text-align: center; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 32px; }
.calc-result { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-top: 16px; }
.pagination { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; flex-wrap: wrap; }
.page-btn { padding: 4px 10px; border-radius: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; cursor: pointer; font-size: 12px; }
.page-btn:hover { border-color: #94a3b8; color: #0f172a; }
.page-btn.active { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
.checkbox { width: 17px; height: 17px; border-radius: 4px; border: 2px solid #cbd5e1; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; flex-shrink: 0; transition: all 0.15s; }
.checkbox.done { background: #2F7A5F; border-color: #2F7A5F; }
.rec-badge { display: inline-flex; align-items: center; gap: 3px; background: #d1fae5; color: #065f46; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; margin-left: 5px; }
.chain-badge { display: inline-flex; align-items: center; gap: 3px; background: #ede9fe; color: #5b21b6; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; margin-left: 5px; }
.task-inline-edit { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
.task-inline-edit input[type="date"] { background: #f1f5f9; border: 1px solid #e2e8f0; color: #1e293b; border-radius: 6px; padding: 2px 6px; font-size: 11px; }
.task-inline-edit select { background: #f1f5f9; border: 1px solid #e2e8f0; color: #1e293b; border-radius: 6px; padding: 2px 6px; font-size: 11px; }
.task-inline-edit input[type="date"]:focus, .task-inline-edit select:focus { outline: none; border-color: #f59e0b; }
.toggle { width: 38px; height: 20px; border-radius: 10px; cursor: pointer; position: relative; flex-shrink: 0; transition: background 0.2s; }
.toggle-knob { position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left 0.2s; }
.report-card { background: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.report-card:hover { border-color: #cbd5e1; background: #f8fafc; }
.report-card.active { border-color: #f59e0b; background: #fffbeb; }
.report-card-icon { font-size: 24px; margin-bottom: 8px; }
.report-card-title { font-family: 'Inter', sans-serif; font-size: 14px; color: #0f172a; font-weight: 600; margin-bottom: 4px; }
.report-card-desc { font-size: 11px; color: #64748b; line-height: 1.4; }
.report-output { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
.report-output-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
.report-output-title { font-family: 'Inter', sans-serif; font-size: 16px; color: #0f172a; font-weight: 600; }
.report-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
@media print {
  .sidebar, .topbar, .tabs, .report-card, .btn, .pagination { display: none !important; }
  .content { padding: 0 !important; }
  .report-output { border: none; background: white; color: black; }
  .report-output-header { border-bottom: 2px solid #333; }
  .report-output-title { color: black !important; font-size: 18px; }
  table { font-size: 11px; }
  th, td { border-bottom: 1px solid #ddd !important; color: black !important; padding: 6px 10px !important; }
  th { background: #f5f5f5 !important; }
  @page { margin: 0.75in; }
}
.note-item { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.1s; }
.note-item:last-child { border-bottom: none; }
.note-item:hover { background: #f1f5f9; }
.note-item.expanded { background: #f1f5f9; border-left: 3px solid #f59e0b; }
.note-type-badge { display: inline-block; padding: 1px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
.print-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 30px 20px; }
.print-doc { background: #fff; color: #111; width: 816px; min-height: 100vh; padding: 60px 72px; font-family: 'Inter', sans-serif; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.print-doc h1 { font-family: 'Inter', sans-serif; font-size: 22px; color: #111; margin-bottom: 4px; }
.print-doc h2 { font-family: 'Inter', sans-serif; font-size: 15px; color: #333; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
.print-doc .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
.print-doc .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 8px; }
.print-doc .info-pair { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 12px; }
.print-doc .info-pair .k { color: #666; min-width: 130px; flex-shrink: 0; }
.print-doc .info-pair .v { color: #111; font-weight: 500; }
.print-doc .note-block { margin-bottom: 16px; padding: 14px 16px; border: 1px solid #ddd; border-radius: 4px; break-inside: avoid; }
.print-doc .note-block .note-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.print-doc .note-block .note-body { font-size: 13px; color: #222; line-height: 1.6; white-space: pre-wrap; }
.print-doc table { width: 100%; border-collapse: collapse; font-size: 12px; }
.print-doc th { text-align: left; padding: 6px 10px; background: #f5f5f5; border-bottom: 1px solid #ccc; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
.print-doc td { padding: 6px 10px; border-bottom: 1px solid #eee; color: #222; }
.print-doc .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
.case-overlay { position: fixed; top: 0; left: 220px; right: 0; bottom: 0; background: #f8fafc; z-index: 600; display: flex; flex-direction: column; overflow: hidden; }
.case-overlay-header { flex-shrink: 0; background: #FFFFFF; border-bottom: 1px solid #e2e8f0; padding: 18px 32px; display: flex; align-items: flex-start; justify-content: space-between; z-index: 10; gap: 16px; flex-wrap: wrap; }
.case-overlay-tabs { flex-shrink: 0; display: flex; gap: 0; border-bottom: 1px solid #e2e8f0; padding: 0 32px; background: #FFFFFF; overflow-y: hidden; flex-wrap: nowrap; }
.case-overlay-tab { padding: 12px 20px; font-size: 13px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; font-weight: 500; font-family: 'Inter', sans-serif; }
.case-overlay-tab:hover { color: #334155; }
.case-overlay-tab.active { color: #0f172a; border-bottom-color: #1e293b; font-weight: 600; }
.case-overlay-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 28px 32px; background: #f8fafc; }
.case-overlay-body > * { max-width: 1100px; width: 100%; margin-left: auto; margin-right: auto; }
.case-overlay-section { margin-bottom: 32px; }
.case-overlay-section-title { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; font-family: 'Inter', sans-serif; }
.activity-entry { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
.activity-entry:last-child { border-bottom: none; }
.activity-avatar-col { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 36px; }
.activity-line { width: 1px; flex: 1; background: #e2e8f0; min-height: 20px; }
.activity-body { flex: 1; min-width: 0; }
.activity-action { font-size: 13px; color: #0f172a; font-weight: 600; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
.activity-detail { font-size: 12px; color: #475569; margin-bottom: 3px; line-height: 1.5; }
.activity-meta { font-size: 11px; color: #64748b; }
.edit-field { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f1f5f9; }
.edit-field:last-child { border-bottom: none; }
.edit-field-key { font-size: 12px; color: #64748b; min-width: 150px; flex-shrink: 0; }
.edit-field-val { flex: 1; font-size: 13px; color: #1e293b; }
.edit-field-val input, .edit-field-val select { background: transparent; border: none; color: #1e293b; font-size: 13px; padding: 2px 4px; border-radius: 4px; width: 100%; font-family: 'Inter', sans-serif; }
.edit-field-val input:hover, .edit-field-val select:hover { background: #f1f5f9; }
.edit-field-val input:focus, .edit-field-val select:focus { background: #f1f5f9; outline: none; border: none; }
.edit-field-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.edit-field:hover .edit-field-actions { opacity: 1; }
.add-field-row { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
.overlay-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; }

/* ── Dark Mode ─────────────────────────────────────────────────────────────── */
.dark {
  color-scheme: dark;
  --c-text:    #E6EDF3;
  --c-text-h:  #E6EDF3;
  --c-text2:   #9DA7B3;
  --c-text3:   #6E7681;
  --c-text4:   #6E7681;
  --c-bg:      #0E1116;
  --c-bg2:     #161B22;
  --c-card:    #161B22;
  --c-hover:   #1C2330;
  --c-border:  #27313D;
  --c-border2: #1C2330;
  --c-border3: #27313D;
  --c-accent:  #4F7393;
  --c-success: #2F7A5F;
  --c-warning: #B67A18;
  --c-error:   #B24A4A;
}
body.dark-body { background: #0E1116; }
.dark .sidebar { background: #12161C; border-right-color: #27313D; }
.dark .sidebar-logo { border-bottom-color: #27313D; }
.dark .sidebar-logo-text { color: #4F7393; }
.dark .sidebar-logo-sub { color: #6E7681; }
.dark .sidebar-user { border-bottom-color: #27313D; }
.dark .sidebar-user-name { color: #E6EDF3; }
.dark .sidebar-user-role { color: #6E7681; }
.dark .sidebar-nav { scrollbar-color: #27313D #12161C; }
.dark .nav-item { color: #9DA7B3; }
.dark .nav-item:hover { color: #E6EDF3; background: #1A212B; }
.dark .nav-item.active { color: #e2e8f0; background: #1e293b; border-left-color: #f59e0b; }
.dark .main { background: #0E1116; }
.dark .topbar { background: #161B22; border-bottom-color: #27313D; }
.dark .topbar-title { color: #E6EDF3; }
.dark .topbar-subtitle { color: #6E7681; }
.dark .content { background: #020617; }
.dark .card { background: #1e293b; border-color: #334155; box-shadow: 0 1px 6px rgba(0,0,0,0.4); }
.dark .card-header { border-bottom-color: #334155; }
.dark .card-title { color: #e2e8f0; }
.dark .stat-card { background: #161B22; border-color: #27313D; box-shadow: 0 1px 6px rgba(0,0,0,0.4); }
.dark .stat-label { color: #6E7681; }
.dark .stat-value { color: #E6EDF3; }
.dark .stat-sub { color: #6E7681; }
.dark th { color: #6E7681; border-bottom-color: #27313D; background: transparent; }
.dark td { color: #9DA7B3; border-bottom-color: #1C2330; }
.dark tr:last-child td { border-bottom: none; }
.dark tr:hover td { background: #1C2330; }
.dark .selected-row td { background: #1C2330 !important; }
.dark .selected-row td:first-child { border-left-color: #f59e0b; }
.dark input:not([type=radio]):not([type=checkbox]), .dark select, .dark textarea { background: #1C2330; border-color: #27313D; color: #E6EDF3; }
.dark input:not([type=radio]):not([type=checkbox]):focus, .dark select:focus, .dark textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
.dark label { color: #6E7681; }
.dark .tabs { border-bottom-color: #334155; }
.dark .tab { color: #94a3b8; }
.dark .tab.active { color: #e2e8f0; border-bottom-color: #f59e0b; }
.dark .tab:hover:not(.active) { color: #e2e8f0; }
.dark .tab-divider { background: #27313D; }
.dark .detail-panel { background: #161B22; border-left-color: #27313D; }
.dark .panel-header { background: #161B22; border-bottom-color: #27313D; }
.dark .panel-section-title { color: #6E7681; }
.dark .info-row { border-bottom-color: #1C2330; }
.dark .info-key { color: #6E7681; }
.dark .info-val { color: #E6EDF3; }
.dark .modal { background: #1C2330; border-color: #27313D; }
.dark .modal-title { color: #E6EDF3; }
.dark .modal-sub { color: #6E7681; }
.dark .modal-footer { border-top-color: #27313D; }
.dark .modal-box { background: #161B22; border-color: #27313D; color: #E6EDF3; }
.dark .login-bg { background: #0E1116; }
.dark .login-box { background: #161B22; border-color: #27313D; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
.dark .login-title { color: #E6EDF3; }
.dark .login-sub { color: #6E7681; }
.dark .btn-outline { color: #9DA7B3; border-color: #27313D; }
.dark .btn-outline:hover { color: #e2e8f0; border-color: #64748b; background: transparent; }
.dark .btn-gold { background: #f59e0b; color: #0f172a; }
.dark .btn-gold:hover { background: #d97706; }
.dark .deadline-item { border-bottom-color: #1C2330; }
.dark .dl-title { color: #E6EDF3; }
.dark .dl-case { color: #6E7681; }
.dark .empty { color: #6E7681; }
.dark .case-overlay { background: #020617; }
.dark .case-overlay-header { background: #161B22; border-bottom-color: #27313D; }
.dark .case-overlay-tabs { background: #161B22; border-bottom-color: #27313D; }
.dark .case-overlay-tab { color: #94a3b8; }
.dark .case-overlay-tab:hover { color: #e2e8f0; }
.dark .case-overlay-tab.active { color: #e2e8f0; border-bottom-color: #f1f5f9; }
.dark .case-overlay-section-title { color: #6E7681; }
.dark .case-overlay-body { background: #020617; }
.dark .activity-entry { border-bottom-color: #1C2330; }
.dark .activity-action { color: #E6EDF3; }
.dark .activity-detail { color: #9DA7B3; }
.dark .activity-meta { color: #6E7681; }
.dark .activity-line { background: #27313D; }
.dark .edit-field { border-bottom-color: #1C2330; }
.dark .edit-field-key { color: #6E7681; }
.dark .edit-field-val { color: #E6EDF3; }
.dark .edit-field-val input, .dark .edit-field-val select { color: #E6EDF3; background: transparent; }
.dark .edit-field-val input:hover, .dark .edit-field-val select:hover { background: #1C2330; }
.dark .edit-field-val input:focus, .dark .edit-field-val select:focus { background: #1C2330; }
.dark .note-item { border-bottom-color: #1C2330; }
.dark .note-item:hover { background: #1C2330; }
.dark .note-item.expanded { background: #1C2330; border-left-color: #f59e0b; }
.dark .report-card { background: #161B22; border-color: #27313D; }
.dark .report-card:hover { background: #1C2330; border-color: #27313D; }
.dark .report-card.active { border-color: #f59e0b; background: #1C2330; }
.dark .report-card-title { color: #E6EDF3; }
.dark .report-card-desc { color: #6E7681; }
.dark .report-output { background: #161B22; border-color: #27313D; }
.dark .report-output-header { border-bottom-color: #27313D; }
.dark .report-output-title { color: #E6EDF3; }
.dark .report-meta { color: #6E7681; }
.dark .calc-result { background: #1C2330; border-color: #27313D; }
.dark .pagination { border-top-color: #27313D; color: #6E7681; }
.dark .page-btn { background: #1C2330; border-color: #27313D; color: #6E7681; }
.dark .page-btn:hover { border-color: #f59e0b; color: #fbbf24; }
.dark .page-btn.active { background: #451a03; border-color: #f59e0b; color: #fbbf24; }
.dark .task-inline-edit input[type="date"] { background: #1C2330; border-color: #27313D; color: #E6EDF3; }
.dark .task-inline-edit select { background: #1C2330; border-color: #27313D; color: #E6EDF3; }
.dark .checkbox { border-color: #27313D; }
.dark .checkbox.done { background: #2F7A5F; border-color: #2F7A5F; }
.dark ::-webkit-scrollbar-track { background: #0E1116; }
.dark ::-webkit-scrollbar-thumb { background: #27313D; }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; }
.dark .sidebar-footer { border-top-color: #27313D; }
.dark-mode-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 8px 0; background: transparent; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 12px; color: #64748b; font-family: 'Inter', sans-serif; margin-bottom: 10px; transition: all 0.15s; }
.dark-mode-btn:hover { border-color: #94a3b8; color: #0f172a; }
.dark .dark-mode-btn { border-color: #27313D; color: #94a3b8; }
.dark .dark-mode-btn:hover { border-color: #f59e0b; color: #fbbf24; }
.hamburger-btn { display: none; background: none; border: 1px solid var(--c-border); border-radius: 6px; padding: 6px 10px; font-size: 20px; cursor: pointer; color: var(--c-text); line-height: 1; }
.sidebar-backdrop { display: none; }
.cal-grid-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
.cal-grid-wrap > div { min-width: 320px; }
.cal-card { overflow: hidden; min-width: 0; }
.hide-mobile { }
@media (max-width: 768px) {
  .hamburger-btn { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; }
  .sidebar { position: fixed; z-index: 700; top: 0; bottom: 0; left: 0; transform: translateX(-100%); transition: transform 0.25s ease; }
  .sidebar.open { transform: translateX(0); }
  .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 699; }
  .nav-item { padding: 12px 20px; min-height: 44px; }
  .content { padding: 14px 12px; }
  .topbar { padding: 10px 12px; }
  .topbar-title { font-size: 17px; }
  .topbar-actions { width: 100%; }
  .topbar-actions select, .topbar-actions input { width: 100% !important; min-width: 0 !important; font-size: 16px !important; min-height: 44px; }
  .grid4 { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .grid2, .form-row { grid-template-columns: 1fr; }
  .stat-value { font-size: 24px; }
  .stat-card { padding: 14px 16px; }
  .btn { min-height: 44px; padding: 10px 16px; font-size: 14px; }
  .btn-sm { min-height: 38px; padding: 8px 12px; font-size: 13px; }
  input:not([type=radio]):not([type=checkbox]), select, textarea { font-size: 16px !important; min-height: 44px; padding: 10px 12px; }
  .checkbox { width: 22px; height: 22px; }
  .modal { width: calc(100vw - 16px) !important; max-width: 620px; padding: 18px; border-radius: 8px; }
  .detail-panel { width: 100% !important; }
  .login-box { width: calc(100vw - 24px) !important; max-width: 400px; padding: 28px 20px; }
  .print-doc { width: 100% !important; padding: 24px 16px; }
  .case-overlay { left: 0 !important; }
  .case-overlay-header { padding: 14px 12px; flex-wrap: wrap; gap: 10px; }
  .case-overlay-actions { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; flex-shrink: 1 !important; }
  .case-overlay-actions::-webkit-scrollbar { display: none; }
  .case-overlay-actions .btn { white-space: nowrap; }
  .case-overlay-tabs { padding: 0 8px; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; position: relative; flex-wrap: nowrap; }
  .case-overlay-tabs::-webkit-scrollbar { display: none; }
  .case-overlay-tab { padding: 10px 14px; white-space: nowrap; font-size: 12px; min-height: 44px; display: flex; align-items: center; flex-shrink: 0; }
  .case-overlay-body { padding: 16px 12px; }
  .overlay-cols { grid-template-columns: 1fr; gap: 0; }
  .edit-field-key { min-width: 110px; font-size: 11px; }
  .edit-field-actions { opacity: 1; }
  .table-wrap { overflow-x: visible; }
  table.mobile-cards { display: block; width: 100%; }
  table.mobile-cards thead { display: none; }
  table.mobile-cards tbody { display: flex; flex-direction: column; gap: 8px; padding: 8px; }
  table.mobile-cards tr { display: flex; flex-direction: column; background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 8px; padding: 12px 14px; gap: 6px; cursor: pointer; }
  table.mobile-cards tr:hover td { background: transparent; }
  table.mobile-cards td { display: flex; align-items: center; gap: 8px; padding: 2px 0 !important; border-bottom: none !important; font-size: 13px; }
  table.mobile-cards td::before { content: attr(data-label); font-size: 11px; color: var(--c-text3); text-transform: uppercase; letter-spacing: 0.06em; min-width: 90px; flex-shrink: 0; font-weight: 600; }
  table.mobile-cards td[data-label=""]::before, table.mobile-cards td:not([data-label])::before { display: none; }
  table.mobile-cards td.mobile-hide { display: none; }
  table.mobile-cards .selected-row { border-color: var(--c-accent); border-width: 2px; }
  table.mobile-cards .selected-row td:first-child { border-left: none; }
  .pinned-card-mobile { border: none; box-shadow: none; background: transparent; margin-bottom: 8px; }
  .pinned-card-mobile table.mobile-cards tr { border-left: 3px solid #B67A18; }
  th { padding: 8px 8px; font-size: 10px; }
  td { padding: 8px 8px; font-size: 12px; }
  .hide-mobile { display: none !important; }
  .show-mobile { display: flex !important; }
  .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; flex-wrap: nowrap; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { white-space: nowrap; padding: 10px 14px; font-size: 13px; min-height: 44px; display: flex; align-items: center; }
  .pagination { font-size: 12px; flex-wrap: wrap; gap: 6px; }
  .page-btn { min-height: 38px; min-width: 38px; display: flex; align-items: center; justify-content: center; }
  .modal-title { font-size: 18px; }
  .card-header { padding: 12px 14px; flex-wrap: wrap; gap: 8px; }
  .card-title { font-size: 14px; }
  .deadline-item { padding: 12px; }
  .note-item { padding: 10px 12px; }
  .print-overlay { padding: 10px 8px; }
  .modal-footer { gap: 8px; flex-wrap: wrap; }
  .modal-footer .btn { flex: 1; min-width: 100px; text-align: center; justify-content: center; }
  .report-card { padding: 14px 16px; }
  .info-row { flex-direction: column; gap: 2px; }
  .info-val { text-align: left; }
  .mobile-grid-1 { grid-template-columns: 1fr !important; display: grid !important; }
  .collapse-strip { display: none !important; }
  .col-collapse-btn { display: none !important; }
  .case-overlay-section { border-right: none !important; padding-left: 0 !important; padding-right: 0 !important; }
  .mobile-full { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
  .cal-grid-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
  .cal-grid-wrap > div { min-width: 320px; }
  .cal-card { overflow: hidden; min-width: 0; }
  .activity-entry { gap: 10px; }
  .activity-avatar-col { width: 28px; }
  .toggle { width: 44px; height: 24px; }
  .toggle-knob { width: 20px; height: 20px; }
  .dark-mode-btn { min-height: 44px; }
  .case-overlay-body [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .modal [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .case-overlay-header > div:first-child { min-width: 0; flex: 1; }
  .case-overlay-header select { max-width: 100%; font-size: 14px !important; }
  .topbar-actions .btn { flex: 1; min-width: 0; text-align: center; justify-content: center; }
  .field-input { width: 100% !important; }
  .case-overlay-panel { width: 100% !important; max-width: 100vw !important; }
  .report-card { min-width: 0 !important; }
}
@media (max-width: 480px) {
  .grid4 { grid-template-columns: 1fr; }
  .stat-value { font-size: 22px; }
  .topbar-title { font-size: 15px; }
  .topbar-subtitle { font-size: 11px; }
  .case-overlay-header { padding: 10px 10px; }
  .case-overlay-body { padding: 12px 10px; }
  .edit-field { flex-wrap: wrap; gap: 4px; }
  .edit-field-key { min-width: 100%; font-size: 11px; }
  .btn { font-size: 13px; }
  .btn-sm { font-size: 12px; }
  .modal { padding: 14px; }
  .modal-title { font-size: 16px; }
  .content { padding: 10px 8px; }
  table.mobile-cards td::before { min-width: 80px; font-size: 10px; }
  table.mobile-cards tr { padding: 10px 12px; }
  .topbar-actions { gap: 6px; }
}
@keyframes pulse-mic {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes advocate-fab-pulse {
  0% { box-shadow: 0 2px 12px rgba(99,102,241,0.3); }
  50% { box-shadow: 0 2px 20px rgba(99,102,241,0.6); }
  100% { box-shadow: 0 2px 12px rgba(99,102,241,0.3); }
}
@keyframes advocate-slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.advocate-fab {
  position: fixed; bottom: 80px; right: 24px; z-index: 9998;
  width: 52px; height: 52px; border-radius: 50%;
  background: #4f46e5;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 12px rgba(79,70,229,0.3);
  animation: advocate-fab-pulse 2.5s ease-in-out infinite;
  transition: transform 0.2s;
}
.advocate-fab:hover { transform: scale(1.08); }
.advocate-panel {
  position: fixed; bottom: 80px; right: 24px; z-index: 9999;
  width: 400px; height: 580px; max-height: calc(100vh - 48px);
  background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  display: flex; flex-direction: column; overflow: hidden;
  animation: advocate-slide-up 0.25s ease-out;
}
.advocate-panel-header {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 14px; border-bottom: 1px solid var(--c-border);
  background: var(--c-card); flex-shrink: 0;
}
@media (max-width: 768px) {
  .advocate-panel {
    position: fixed;
    width: 100vw; height: 100dvh; max-height: 100dvh;
    bottom: 0; right: 0; left: 0; top: 0;
    border-radius: 0; border: none;
    box-shadow: none;
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .advocate-panel-header {
    padding: 14px 12px; gap: 6px;
    min-height: 54px;
  }
  .advocate-fab { bottom: 72px; left: 16px; right: auto; width: 48px; height: 48px; }
  .advocate-msg-area { padding: 10px 10px !important; }
  .advocate-input-bar { padding: 10px 10px !important; }
  .advocate-input-bar input { font-size: 16px !important; padding: 10px 12px !important; }
  .advocate-input-bar button { min-width: 44px; min-height: 44px; font-size: 16px !important; }
  .advocate-case-search { padding: 6px 10px !important; }
  .advocate-case-search input { font-size: 16px !important; }
  .advocate-stats-bar { padding: 4px 10px !important; }
  .advocate-starter-chips { max-width: 100% !important; padding: 0 6px; }
  .advocate-starter-chips button { font-size: 12px !important; padding: 8px 14px !important; min-height: 36px; }
  .advocate-panel-header .advocate-header-actions button { min-width: 40px; min-height: 40px; font-size: 18px !important; display: flex; align-items: center; justify-content: center; }
  .advocate-panel-header .advocate-header-actions .btn { min-width: unset; min-height: 36px; font-size: 11px !important; padding: 4px 10px !important; }
  .advocate-msg-area > div > div > div { max-width: 92% !important; }
  .advocate-nav-chips button { font-size: 12px !important; padding: 7px 12px !important; min-height: 36px; }
  [class*="replit"] iframe[style*="bottom"], .replit-badge, #__replco_badge { left: 8px !important; right: auto !important; }
}
`;

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
  const view = location.pathname.split("/")[1] || "dashboard";
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
    if (view === "contacts" && !contextContactsCache) {
      apiGetContacts().then(setContextContactsCache).catch(() => {});
    }
    if (view === "documents" && !contextTemplatesCache) {
      apiGetTemplates().then(setContextTemplatesCache).catch(() => {});
    }
    if (view === "timelog" && currentUser) {
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
    setView("trialcenter");
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
    dashboard: { icon: "⬛", label: "Dashboard" },
    cases: { icon: "⚖️", label: "Cases" },
    deadlines: { icon: "📅", label: "Calendar" },
    tasks: { icon: "✅", label: "Tasks" },
    documents: { icon: "📄", label: "Templates" },
    timelog: { icon: "🕐", label: "Time Log" },
    reports: { icon: "📊", label: "Reports" },
    aicenter: { icon: "✦", label: "AI Center" },
    collaborate: { icon: "💬", label: "Collaborate" },
    contacts: { icon: "📇", label: "Contacts" },
    staff: { icon: "👥", label: "Staff" },
    trialcenter: { icon: "⚖️", label: "Trial Center" },
    customization: { icon: "⚙️", label: "Customization" },
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
        if (lastCaseId && lastView === "cases") {
          const found = cases.find(c => c.id === Number(lastCaseId));
          if (found) {
            setSelectedCase(found);
            navigate("/cases");
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
      setView("cases");
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
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "cases", icon: Briefcase, label: "Cases" },
            { id: "deadlines", icon: Calendar, label: "Calendar" },
            { id: "tasks", icon: CheckSquare, label: "Tasks", badge: overdueBadge || null },
            { id: "documents", icon: FileText, label: "Templates" },
            { id: "timelog", icon: Clock, label: "Time Log" },
            { id: "reports", icon: BarChart3, label: "Reports" },
            { id: "aicenter", icon: Brain, label: "AI Center" },
            { id: "trialcenter", icon: Scale, label: "Trial Center" },
            { id: "collaborate", icon: MessageSquare, label: "Collaborate", badge: collabUnread > 0 ? collabUnread : null },
            { id: "contacts", icon: Users, label: "Contacts" },
            { id: "unmatched", icon: Inbox, label: "Unmatched" },
            { id: "staff", icon: UserCog, label: "Staff" },
            ...((isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.access_customization) ? [{ id: "customization", icon: SlidersHorizontal, label: "Customization" }] : []),
            ...((isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.view_deleted_data) ? [{ id: "deleted", icon: Trash2, label: "Deleted Data" }] : []),
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
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} allCases={allCases} deadlines={allDeadlines} tasks={tasks} onSelectCase={(c, tab) => { setPendingTab(tab || null); handleSelectCase(c); setView("cases"); }} onAddRecord={handleAddRecord} onCompleteTask={handleCompleteTask} onUpdateTask={handleUpdateTask} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onNavigate={(viewId) => setView(viewId)} pinnedContacts={pinnedContactsList} onSelectContact={() => setView("contacts")} confirmDelete={confirmDelete} />} />
          <Route path="/cases" element={<CasesView currentUser={currentUser} allCases={allCases} tasks={tasks} selectedCase={selectedCase} setSelectedCase={handleSelectCase} pendingTab={pendingTab} clearPendingTab={() => setPendingTab(null)} onAddRecord={handleAddRecord} onUpdateCase={handleUpdateCase} onCompleteTask={handleCompleteTask} onAddTask={(saved) => { setTasks(p => [...p, saved]); refreshCaseData(); }} deadlines={allDeadlines} caseNotes={caseNotes} setCaseNotes={setCaseNotes} caseLinks={caseLinks} setCaseLinks={setCaseLinks} caseActivity={caseActivity} setCaseActivity={setCaseActivity} deletedCases={deletedCases} setDeletedCases={setDeletedCases} onDeleteCase={handleDeleteCase} onRestoreCase={handleRestoreCase} onAddDeadline={async (dl) => { try { const saved = await apiCreateDeadline(dl); setAllDeadlines(p => [...p, saved]); refreshCaseData(); } catch (err) { console.error("Failed to add deadline:", err); } }} onUpdateDeadline={async (id, data) => { try { const updated = await apiUpdateDeadline(id, data); setAllDeadlines(p => p.map(d => d.id === id ? updated : d)); refreshCaseData(); } catch (err) { console.error("Failed to update deadline:", err); } }} onDeleteDeadline={async (id) => { try { await apiDeleteDeadline(id); setAllDeadlines(p => p.filter(d => d.id !== id)); refreshCaseData(); } catch (err) { console.error("Failed to delete deadline:", err); } }} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onTogglePinnedCase={handleTogglePinnedCase} onOpenAdvocate={openAdvocateFromCase} onOpenTrialCenter={openTrialCenterFromCase} confirmDelete={confirmDelete} openAppDocViewer={openAppDocViewer} openAppFilingViewer={openAppFilingViewer} openBlobInViewer={openBlobInViewer} openTranscriptViewer={openTranscriptViewer} />} />
          <Route path="/deadlines" element={<DeadlinesView deadlines={allDeadlines} tasks={tasks} onAddDeadline={async (dl) => { try { const saved = await apiCreateDeadline(dl); setAllDeadlines(p => [...p, saved]); refreshCaseData(); } catch (err) { alert("Failed to add deadline: " + err.message); } }} onUpdateDeadline={async (id, data) => { try { const updated = await apiUpdateDeadline(id, data); setAllDeadlines(p => p.map(d => d.id === id ? updated : d)); refreshCaseData(); } catch (err) { console.error("Failed to update deadline:", err); } }} onDeleteDeadline={async (id) => { try { await apiDeleteDeadline(id); setAllDeadlines(p => p.filter(d => d.id !== id)); refreshCaseData(); } catch (err) { alert("Failed to remove deadline: " + err.message); } }} allCases={allCases} calcInputs={calcInputs} setCalcInputs={setCalcInputs} calcResult={calcResult} runCalc={() => { const rule = COURT_RULES.find(r => r.id === Number(calcInputs.ruleId)); if (rule && calcInputs.fromDate) setCalcResult({ rule, from: calcInputs.fromDate, result: addDays(calcInputs.fromDate, rule.days) }); }} currentUser={currentUser} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onSelectCase={(c) => { handleSelectCase(c); setView("cases"); }} confirmDelete={confirmDelete} msStatus={appMsStatus} />} />
          <Route path="/documents" element={<DocumentsView currentUser={currentUser} allCases={allCases} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} />} />
          <Route path="/tasks" element={<TasksView tasks={tasks} onAddTask={async (task) => { try { const saved = await apiCreateTask(task); setTasks(p => [...p, saved]); refreshCaseData(); } catch (err) { alert("Failed to add task: " + err.message); } }} allCases={allCases} currentUser={currentUser} onCompleteTask={handleCompleteTask} onUpdateTask={handleUpdateTask} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} />} />
          <Route path="/reports" element={<ReportsView allCases={allCases} tasks={tasks} deadlines={allDeadlines} currentUser={currentUser} onUpdateCase={handleUpdateCase} onCompleteTask={handleCompleteTask} onAddTask={(saved) => { setTasks(p => [...p, saved]); refreshCaseData(); }} onDeleteCase={handleDeleteCase} caseNotes={caseNotes} setCaseNotes={setCaseNotes} caseLinks={caseLinks} setCaseLinks={setCaseLinks} caseActivity={caseActivity} setCaseActivity={setCaseActivity} onAddDeadline={async (dl) => { try { const saved = await apiCreateDeadline(dl); setAllDeadlines(p => [...p, saved]); refreshCaseData(); } catch (err) { console.error("Failed to add deadline:", err); } }} onUpdateDeadline={async (id, data) => { try { const updated = await apiUpdateDeadline(id, data); setAllDeadlines(p => p.map(d => d.id === id ? updated : d)); refreshCaseData(); } catch (err) { console.error("Failed to update deadline:", err); } }} onMenuToggle={() => setSidebarOpen(true)} onOpenAdvocate={openAdvocateFromCase} onOpenTrialCenter={openTrialCenterFromCase} confirmDelete={confirmDelete} openAppDocViewer={openAppDocViewer} openAppFilingViewer={openAppFilingViewer} openBlobInViewer={openBlobInViewer} openTranscriptViewer={openTranscriptViewer} />} />
          <Route path="/aicenter" element={<AiCenterView allCases={allCases} currentUser={currentUser} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} confirmDelete={confirmDelete} />} />
          <Route path="/trialcenter" element={<TrialCenterView currentUser={currentUser} users={allUsers} cases={allCases} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} onTrialCenterCaseChange={(caseId) => setCurrentUser(prev => prev ? { ...prev, preferences: { ...(prev.preferences || {}), trialCenterCaseId: caseId } } : prev)} />} />
          <Route path="/collaborate" element={<CollaborateView currentUser={currentUser} allUsers={allUsers} allCases={allCases} pinnedCaseIds={pinnedCaseIds} onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/timelog" element={<TimeLogView currentUser={currentUser} allCases={allCases} tasks={tasks} caseNotes={caseNotes} correspondence={allCorrespondence} allUsers={allUsers} onMenuToggle={() => setSidebarOpen(true)} pinnedCaseIds={pinnedCaseIds} />} />
          <Route path="/contacts" element={<ContactsView currentUser={currentUser} allCases={allCases} onOpenCase={c => { handleSelectCase(c); setView("cases"); }} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} msStatus={appMsStatus} />} />
          <Route path="/unmatched" element={<UnmatchedView allCases={allCases} onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/staff" element={<StaffView allCases={allCases} currentUser={currentUser} setCurrentUser={setCurrentUser} allUsers={allUsers} setAllUsers={setAllUsers} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} />} />
          <Route path="/customization" element={(isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.access_customization) ? <CustomizationView currentUser={currentUser} allCases={allCases} allUsers={allUsers} pinnedCaseIds={pinnedCaseIds} onMenuToggle={() => setSidebarOpen(true)} confirmDelete={confirmDelete} /> : <Navigate to="/dashboard" replace />} />
          <Route path="/deleted" element={(isAppAdmin(currentUser) || userPerms._isAdmin || userPerms.view_deleted_data) ? <DeletedDataView onMenuToggle={() => setSidebarOpen(true)} /> : <Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to={localStorage.getItem("lextrack-last-view") ? "/" + localStorage.getItem("lextrack-last-view") : "/dashboard"} replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
          style={fabPosition ? { left: fabPosition.x, top: fabPosition.y, right: "auto", bottom: "auto", ...(fabDragging || fabMoveMode ? { animation: "none", cursor: fabDragging ? "grabbing" : "grab", transition: "none" } : {}) } : (view === "collaborate" ? { bottom: "auto", top: 62 } : (fabMoveMode ? { animation: "none", cursor: "grab" } : undefined))}
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
        <div className="advocate-panel" style={view === "collaborate" ? { bottom: "auto", top: 62 } : undefined}>
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

