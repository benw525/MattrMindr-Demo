import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { FileText, Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2, Check, Download, Upload, Eye, Loader2, Copy, Filter, FolderPlus, Menu, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import {
  apiGetTemplates, apiDeleteTemplate, apiUpdateTemplate, apiGetTemplateSource, apiUploadTemplateFile, apiSaveTemplate, apiGenerateDocument, apiDetectPleadingSections,
  apiGetParties, apiGetExperts,
  apiCreateNote, apiCreateActivity,
  apiGetCaseDocuments,
  apiDraftDocument,
} from "../api.js";
import {
  fmt, fmtFileSize, getUserById, Avatar, isDarkMode, Badge,
  hasRole, isAppAdmin, today,
  SortTh, CaseSearchField, DragDropZone, Toggle, USERS, US_STATES, AiPanel,
} from "../shared.js";
function buildPartyFieldMap(parties) { // eslint-disable-line no-unused-vars
  const map = [];
  const grouped = {};
  for (const p of parties) {
    if (!grouped[p.partyType]) grouped[p.partyType] = [];
    grouped[p.partyType].push(p);
  }
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
  for (const [type, arr] of Object.entries(grouped)) {
    const typeSlug = slug(type);
    arr.forEach((party, idx) => {
      const n = idx + 1;
      const prefix = `_party_${typeSlug}_${n}`;
      const label = `${type} #${n}`;
      if (party.entityKind === "individual") {
        map.push({ key: `${prefix}_full_name`, label: `${label} — Full Name` });
        map.push({ key: `${prefix}_first_name`, label: `${label} — First Name` });
        map.push({ key: `${prefix}_middle_name`, label: `${label} — Middle Name` });
        map.push({ key: `${prefix}_last_name`, label: `${label} — Last Name` });
      } else {
        map.push({ key: `${prefix}_entity_name`, label: `${label} — Entity Name` });
        map.push({ key: `${prefix}_entity_type`, label: `${label} — Entity Type` });
        map.push({ key: `${prefix}_registered_agent`, label: `${label} — Registered Agent` });
        map.push({ key: `${prefix}_poc_name`, label: `${label} — POC Name` });
        map.push({ key: `${prefix}_poc_title`, label: `${label} — POC Title` });
        map.push({ key: `${prefix}_poc_phone`, label: `${label} — POC Phone` });
        map.push({ key: `${prefix}_poc_email`, label: `${label} — POC Email` });
      }
      map.push({ key: `${prefix}_address`, label: `${label} — Address` });
      map.push({ key: `${prefix}_full_address`, label: `${label} — Full Address` });
      map.push({ key: `${prefix}_city`, label: `${label} — City` });
      map.push({ key: `${prefix}_state`, label: `${label} — State` });
      map.push({ key: `${prefix}_zip`, label: `${label} — Zip` });
      map.push({ key: `${prefix}_email`, label: `${label} — Email` });
      map.push({ key: `${prefix}_phone`, label: `${label} — Phone (Primary)` });
    });
  }
  return map;
}

function getCaseFieldValue(c, key, parties) {
  if (key === "_todayDate") return new Date().toLocaleDateString();
  if (key === "_assignedAttorneyName") return USERS.find(u => u.id === c.assignedAttorney)?.name || "";
  if (key === "_secondAttorneyName") return USERS.find(u => u.id === c.secondAttorney)?.name || "";
  if (key === "_caseManagerName") return USERS.find(u => u.id === c.caseManager)?.name || "";
  if (key === "_investigatorName") return USERS.find(u => u.id === c.investigator)?.name || "";
  if (key === "_paralegalName") return USERS.find(u => u.id === c.paralegal)?.name || "";
  if (key.startsWith("_party_") && parties) {
    const m = key.match(/^_party_(.+?)_(\d+)_(.+)$/);
    if (m) {
      const [, typeSlug, numStr, field] = m;
      const idx = parseInt(numStr) - 1;
      const grouped = {};
      for (const p of parties) {
        const s = p.partyType.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
        if (!grouped[s]) grouped[s] = [];
        grouped[s].push(p);
      }
      const party = (grouped[typeSlug] || [])[idx];
      if (!party) return "";
      const d = party.data || {};
      switch (field) {
        case "full_name": return [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");
        case "first_name": return d.firstName || "";
        case "middle_name": return d.middleName || "";
        case "last_name": return d.lastName || "";
        case "entity_name": return d.entityName || "";
        case "entity_type": return d.entityType || "";
        case "registered_agent": return d.registeredAgent || "";
        case "poc_name": return d.pocName || "";
        case "poc_title": return d.pocTitle || "";
        case "poc_phone": return d.pocPhone || "";
        case "poc_email": return d.pocEmail || "";
        case "address": return d.address || "";
        case "full_address": return [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
        case "city": return d.city || "";
        case "state": return d.state || "";
        case "zip": return d.zip || "";
        case "email": return d.email || "";
        case "phone": return (d.phones || [])[0]?.number || "";
        default: return "";
      }
    }
  }
  return c[key] || "";
}

const TEMPLATE_CATEGORIES = ["Motions", "Orders", "Notices", "Subpoenas", "Client Letters", "General"];
const LETTER_SUB_TYPES = ["Client", "Insurance Company", "Defense Attorney", "Court", "Medical Provider", "Other"];
const CATEGORY_COLORS = { Pleadings: "#dbeafe", Letters: "#fef3c7", Subpoenas: "#e2e8f0", Reports: "#dbeafe", General: "#f1f5f9" };

function getPartyName(p) {
  const d = p.data || {};
  return p.entityKind === "corporation" ? (d.entityName || "") : [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");
}

function getPlaceholderSuggestions(token, caseData, parties, experts) {
  const key = token.toLowerCase();
  const suggestions = [];
  const allParties = parties || [];
  const ourClient = allParties.find(p => p.data?.isOurClient);

  if (/^plaintiffs$/.test(key)) {
    const names = allParties.filter(p => /plaintiff/i.test(p.partyType)).map(getPartyName).filter(Boolean);
    if (names.length) suggestions.push({ label: "All Plaintiffs", value: names.join(",\n") });
    if (!names.length && caseData.clientName) suggestions.push({ label: "Client", value: caseData.clientName });
  } else if (/^defendants$/.test(key)) {
    const names = allParties.filter(p => /defendant/i.test(p.partyType)).map(getPartyName).filter(Boolean);
    if (names.length) suggestions.push({ label: "All Defendants", value: names.join(",\n") });
  } else if (/^(defendant|def_name|def$)/.test(key)) {
    allParties.filter(p => /defendant/i.test(p.partyType)).forEach(p => {
      const name = getPartyName(p);
      if (name) suggestions.push({ label: `${p.partyType}: ${name}`, value: name });
    });
  } else if (/^(plaintiff|pl_name|pl$)/.test(key)) {
    allParties.filter(p => /plaintiff/i.test(p.partyType)).forEach(p => {
      const name = getPartyName(p);
      if (name) suggestions.push({ label: `${p.partyType}: ${name}`, value: name });
    });
    if (!suggestions.length && caseData.clientName) suggestions.push({ label: "Client", value: caseData.clientName });
  } else if (/^(client|client_name|our_client)/.test(key)) {
    if (ourClient) {
      const d = ourClient.data || {};
      const name = ourClient.entityKind === "corporation" ? (d.entityName || "") : [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");
      if (name) suggestions.push({ label: "Our Client", value: name });
    }
    if (!suggestions.length && caseData.clientName) suggestions.push({ label: "Client", value: caseData.clientName });
  } else if (/^(client_address|our_client_address)/.test(key)) {
    if (ourClient) {
      const d = ourClient.data || {};
      const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
      if (addr) suggestions.push({ label: "Our Client Address", value: addr });
    }
  } else if (/^(case_number|case_no|civil_action|cause_no|case_num)/.test(key)) {
    if (caseData.caseNum) suggestions.push({ label: "File Number", value: caseData.caseNum });
    if (caseData.courtCaseNumber) suggestions.push({ label: "Case Number", value: caseData.courtCaseNumber });
    if (caseData.shortCaseNum) suggestions.push({ label: "Short Case Number", value: caseData.shortCaseNum });
  } else if (/^(court$|court_name)/.test(key)) {
    if (caseData.court) suggestions.push({ label: "Court", value: caseData.court });
  } else if (/^(judge|judge_name)/.test(key)) {
    if (caseData.judge) suggestions.push({ label: "Judge", value: caseData.judge });
  } else if (/^(county|county_name)/.test(key)) {
    if (caseData.county) suggestions.push({ label: "County", value: caseData.county });
  } else if (/^(date|today|todays_date|current_date)/.test(key)) {
    suggestions.push({ label: "Today", value: new Date().toLocaleDateString() });
  } else if (/^(lead_attorney|attorney_name|attorney$|counsel$|assigned_attorney)/.test(key)) {
    const lead = USERS.find(u => u.id === caseData.assignedAttorney);
    if (lead) suggestions.push({ label: "Assigned Attorney", value: lead.name });
    const second = USERS.find(u => u.id === caseData.secondAttorney);
    if (second) suggestions.push({ label: "2nd Attorney", value: second.name });
  } else if (/^(opposing_counsel|opp_counsel|defense_counsel)/.test(key)) {
  } else if (/^(case_title|case_style|case_name|title$|style)/.test(key)) {
    if (caseData.title) suggestions.push({ label: "Case Title", value: caseData.title });
  } else if (/^(client_name)/.test(key)) {
    if (caseData.clientName) suggestions.push({ label: "Client", value: caseData.clientName });
  } else if (/^(trial_date)/.test(key)) {
    if (caseData.trialDate) suggestions.push({ label: "Trial Date", value: caseData.trialDate });
  } else if (/^(accident_date|incident_date)/.test(key)) {
    if (caseData.accidentDate) suggestions.push({ label: "Accident Date", value: caseData.accidentDate });
  } else if (/^(expert|expert_name)/.test(key)) {
    (experts || []).forEach(ex => {
      const name = ex.data?.name || "";
      if (name) suggestions.push({ label: `Expert: ${name}`, value: name });
    });
    if (!suggestions.length && caseData.expert) suggestions.push({ label: "Expert", value: caseData.expert });
  } else if (/^(case_manager|paralegal|paralegal_name)/.test(key)) {
    const para = USERS.find(u => u.id === caseData.caseManager);
    if (para) suggestions.push({ label: "Case Manager", value: para.name });
  } else if (/^(investigator|investigator_name)/.test(key)) {
    const inv = USERS.find(u => u.id === caseData.investigator);
    if (inv) suggestions.push({ label: "Investigator", value: inv.name });
  } else if (/^(paralegal_staff|paralegal_assigned)/.test(key)) {
    const sw = USERS.find(u => u.id === caseData.paralegal);
    if (sw) suggestions.push({ label: "Paralegal", value: sw.name });
  } else if (/defendant.*address/.test(key)) {
    allParties.filter(p => /defendant/i.test(p.partyType)).forEach(p => {
      const d = p.data || {};
      const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
      const name = p.entityKind === "corporation" ? (d.entityName || "") : [d.firstName, d.lastName].filter(Boolean).join(" ");
      if (addr) suggestions.push({ label: `${name} Address`, value: addr });
    });
  } else if (/plaintiff.*address/.test(key)) {
    allParties.filter(p => /plaintiff/i.test(p.partyType)).forEach(p => {
      const d = p.data || {};
      const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
      const name = p.entityKind === "corporation" ? (d.entityName || "") : [d.firstName, d.lastName].filter(Boolean).join(" ");
      if (addr) suggestions.push({ label: `${name} Address`, value: addr });
    });
  } else if (/^(state$|state_name)/.test(key)) {
    if (caseData.stateJurisdiction) suggestions.push({ label: "State", value: caseData.stateJurisdiction });
  } else if (/^(signature$)/.test(key)) {
    const lead = USERS.find(u => u.id === caseData.assignedAttorney);
    if (lead) suggestions.push({ label: `${lead.name}`, value: lead.name });
  } else if (/^(client_type)/.test(key)) {
    if (ourClient) {
      suggestions.push({ label: ourClient.partyType, value: ourClient.partyType });
    }
  } else if (/^(client_name)/.test(key)) {
    if (caseData.clientName) suggestions.push({ label: "Client", value: caseData.clientName });
  } else if (/^(attorney_code|bar_number|bar_num)/.test(key)) {
  } else if (/^(attorney_firm|firm_name|firm$)/.test(key)) {
  } else if (/^(attorney_address)/.test(key)) {
  } else if (/^(attorney_phone)/.test(key)) {
    const lead = USERS.find(u => u.id === caseData.assignedAttorney);
    if (lead?.phone) suggestions.push({ label: `${lead.name}`, value: lead.phone });
  } else if (/^(attorney_email)/.test(key)) {
    const lead = USERS.find(u => u.id === caseData.assignedAttorney);
    if (lead?.email) suggestions.push({ label: `${lead.name}`, value: lead.email });
  } else if (/^(today_date|todays_date)/.test(key)) {
    suggestions.push({ label: "Today", value: new Date().toLocaleDateString() });
  } else if (/addressee.*last|last.*name/.test(key)) {
    if (ourClient) {
      const d = ourClient.data || {};
      if (d.lastName) suggestions.push({ label: "Client Last Name", value: d.lastName });
    }
  }
  return suggestions;
}

const PLEADING_HEADER_PLACEHOLDERS = [
  { token: "COURT", label: "Court" },
  { token: "COUNTY", label: "County" },
  { token: "STATE", label: "State" },
  { token: "PLAINTIFFS", label: "Plaintiff(s)" },
  { token: "DEFENDANTS", label: "Defendant(s)" },
  { token: "CASE_NUMBER", label: "Case Number" },
  { token: "FILE_NUMBER", label: "File Number" },
];
const PLEADING_SIGNATURE_PLACEHOLDERS = [
  { token: "SIGNATURE", label: "Signature" },
  { token: "ATTORNEY_NAME", label: "Attorney Name" },
  { token: "ATTORNEY_CODE", label: "Attorney Code (Bar #)" },
  { token: "CLIENT_TYPE", label: "Client Type" },
  { token: "CLIENT_NAME", label: "Client Name" },
  { token: "ATTORNEY_FIRM", label: "Attorney Firm" },
  { token: "ATTORNEY_ADDRESS", label: "Attorney Address" },
  { token: "ATTORNEY_PHONE", label: "Attorney Phone" },
  { token: "ATTORNEY_EMAIL", label: "Attorney Email" },
];

function buildAllCaseFields(caseData, parties, experts) {
  const fields = [];
  const add = (cat, label, value) => { if (value) fields.push({ category: cat, label, value: String(value) }); };
  add("Case Info", "Case Title", caseData.title);
  add("Case Info", "File Number", caseData.caseNum);
  add("Case Info", "Case Number", caseData.courtCaseNumber);
  add("Case Info", "Client Name", caseData.clientName);
  add("Case Info", "Case Type", caseData.caseType);
  add("Case Info", "Injury Type", caseData.injuryType);
  add("Case Info", "State", caseData.stateJurisdiction);
  add("Case Info", "Court", caseData.court);
  add("Case Info", "County", caseData.county);
  add("Case Info", "Judge", caseData.judge);
  add("Case Info", "Status", caseData.status);
  add("Case Info", "Stage", caseData.stage);
  add("Case Info", "Case Value", caseData.caseValueEstimate);
  add("Case Info", "Demand Amount", caseData.demandAmount);
  add("Case Info", "Settlement Amount", caseData.settlementAmount);
  add("Case Info", "Contingency %", caseData.contingencyFeePct);
  const fmt = d => { try { return new Date(d).toLocaleDateString(); } catch { return ""; } };
  add("Dates", "Accident Date", caseData.accidentDate ? fmt(caseData.accidentDate) : "");
  add("Dates", "SOL Date", caseData.statuteOfLimitationsDate ? fmt(caseData.statuteOfLimitationsDate) : "");
  add("Dates", "Next Court Date", caseData.nextCourtDate ? fmt(caseData.nextCourtDate) : "");
  add("Dates", "Trial Date", caseData.trialDate ? fmt(caseData.trialDate) : "");
  add("Dates", "Disposition Date", caseData.dispositionDate ? fmt(caseData.dispositionDate) : "");
  add("Dates", "Today's Date", new Date().toLocaleDateString());
  const lead = USERS.find(u => u.id === caseData.assignedAttorney);
  const second = USERS.find(u => u.id === caseData.secondAttorney);
  const para = USERS.find(u => u.id === caseData.caseManager);
  const inv = USERS.find(u => u.id === caseData.investigator);
  const sw = USERS.find(u => u.id === caseData.paralegal);
  if (lead) { add("Staff", "Assigned Attorney", lead.name); add("Staff", "Assigned Attorney Email", lead.email); add("Staff", "Assigned Attorney Phone", lead.phone); }
  if (second) { add("Staff", "2nd Attorney", second.name); add("Staff", "2nd Attorney Email", second.email); add("Staff", "2nd Attorney Phone", second.phone); }
  if (para) { add("Staff", "Trial Coordinator", para.name); add("Staff", "Trial Coordinator Email", para.email); add("Staff", "Trial Coordinator Phone", para.phone); }
  if (inv) { add("Staff", "Investigator", inv.name); add("Staff", "Investigator Email", inv.email); add("Staff", "Investigator Phone", inv.phone); }
  if (sw) { add("Staff", "Paralegal", sw.name); add("Staff", "Paralegal Email", sw.email); add("Staff", "Paralegal Phone", sw.phone); }
  add("Staff", "Office", "Law Firm");
  add("Staff", "Office Address", "");
  (parties || []).forEach(p => {
    const d = p.data || {};
    const name = p.entityKind === "corporation" ? (d.entityName || "") : [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");
    if (!name) return;
    const prefix = `${p.partyType || "Party"}: ${name}`;
    add("Parties", `${prefix} — Name`, name);
    const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
    if (addr) add("Parties", `${prefix} — Address`, addr);
    if (d.phone) add("Parties", `${prefix} — Phone`, d.phone);
    if (d.email) add("Parties", `${prefix} — Email`, d.email);
    if (d.representedBy) add("Parties", `${prefix} — Represented By`, d.representedBy);
    if (d.isOurClient) add("Parties", "Our Client", name);
    if (p.entityKind === "individual") {
      if (d.ssnLast4) add("Parties", `${prefix} — SSN (last 4)`, d.ssnLast4);
      if (d.driversLicense) add("Parties", `${prefix} — Driver's License #`, d.driversLicense);
      if (d.employer) add("Parties", `${prefix} — Employer`, d.employer);
      if (d.occupation) add("Parties", `${prefix} — Occupation`, d.occupation);
      if (d.maritalStatus) add("Parties", `${prefix} — Marital Status`, d.maritalStatus);
      if (d.dob) add("Parties", `${prefix} — Date of Birth`, fmt(d.dob));
      if (d.dateOfDeath) add("Parties", `${prefix} — Date of Death`, fmt(d.dateOfDeath));
      if (d.isMinor) add("Parties", `${prefix} — Minor`, "Yes");
    } else {
      if (d.stateOfIncorporation) add("Parties", `${prefix} — State of Incorporation`, d.stateOfIncorporation);
      if (d.principalPlaceOfBusiness) add("Parties", `${prefix} — Principal Place of Business`, d.principalPlaceOfBusiness);
    }
  });
  (experts || []).forEach(ex => {
    const d = ex.data || {};
    if (!d.name) return;
    const prefix = d.name;
    add("Experts", `${prefix} — Name`, d.name);
    if (d.type) add("Experts", `${prefix} — Type`, d.type);
    if (d.company) add("Experts", `${prefix} — Company`, d.company);
    if (d.specialty) add("Experts", `${prefix} — Specialty`, d.specialty);
    if (d.phone) add("Experts", `${prefix} — Phone`, d.phone);
    if (d.email) add("Experts", `${prefix} — Email`, d.email);
    if (d.rate) add("Experts", `${prefix} — Rate`, d.rate);
    if (d.retainedDate) add("Experts", `${prefix} — Retained Date`, fmt(d.retainedDate));
    if (d.reportDate) add("Experts", `${prefix} — Report Date`, fmt(d.reportDate));
    if (d.depositionDate) add("Experts", `${prefix} — Deposition Date`, fmt(d.depositionDate));
  });
  return fields;
}

function GenerateDocumentModal({ caseData, currentUser, onClose, parties, experts, caseId, onAddNote, onLogActivity }) {
  const [mode, setMode] = useState("template");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState({});
  const [generating, setGenerating] = useState(false);
  const [includeCoS, setIncludeCoS] = useState(true);
  const [browseOpen, setBrowseOpen] = useState(null);
  const [aiDraft, setAiDraft] = useState({ loading: false, result: null, error: null, docType: "Demand Letter", instructions: "" });

  useEffect(() => {
    apiGetTemplates().then(t => { setTemplates(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const allTags = [...new Set(templates.flatMap(t => t.tags))].sort();
  const allCategories = [...new Set(templates.map(t => t.category || "General"))].sort();
  const filtered = templates.filter(t => {
    if (filter === "mine" && t.createdBy !== currentUser.id) return false;
    if (filter === "other" && t.createdBy === currentUser.id) return false;
    if (catFilter && (t.category || "General") !== catFilter) return false;
    if (tagFilter && !t.tags.includes(tagFilter)) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSelect = (tmpl) => {
    setSelected(tmpl);
    const v = {};
    const isPleading = tmpl.category === "Pleadings";
    const allPhs = [...tmpl.placeholders];
    if (isPleading) {
      const existing = new Set(allPhs.map(p => p.token));
      for (const sys of [...PLEADING_HEADER_PLACEHOLDERS, ...PLEADING_SIGNATURE_PLACEHOLDERS]) {
        if (!existing.has(sys.token)) allPhs.push(sys);
      }
    }
    for (const ph of allPhs) {
      if (ph.mapping && ph.mapping !== "_manual") {
        v[ph.token] = getCaseFieldValue(caseData, ph.mapping, parties || []);
      } else {
        const sugs = getPlaceholderSuggestions(ph.token, caseData, parties, experts);
        v[ph.token] = sugs.length === 1 ? sugs[0].value : "";
      }
    }
    if (tmpl.category === "Letters" && tmpl.subType) {
      const ourClient = (parties || []).find(p => p.data?.isOurClient);
      if (tmpl.subType === "Client" && ourClient) {
        const d = ourClient.data || {};
        const name = ourClient.entityKind === "corporation" ? (d.entityName || "") : [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");
        const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
        for (const ph of tmpl.placeholders) {
          const k = ph.token.toLowerCase();
          if (/addressee|recipient|to_name/.test(k) && name) v[ph.token] = v[ph.token] || name;
          if (/address|to_address/.test(k) && addr) v[ph.token] = v[ph.token] || addr;
        }
      } else if (tmpl.subType === "Defense Attorney") {
      }
    }
    setValues(v);
    setIncludeCoS(tmpl.category === "Pleadings");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await apiGenerateDocument(selected.id, values, caseData.id, selected.category === "Pleadings" ? includeCoS : false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.name} - ${caseData.title || "Document"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      alert("Failed to generate document: " + err.message);
    }
    setGenerating(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--c-bg)", borderRadius: 12, width: "90%", maxWidth: 750, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--c-border)", paddingBottom: 0, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, margin: 0, color: "var(--c-text-h)" }}>
              {mode === "template" && selected ? "Fill in Document Fields" : "Generate Document"}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--c-text2)" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 12 }}>
            <button onClick={() => setMode("template")} style={{ fontSize: 13, fontWeight: mode === "template" ? 600 : 400, padding: "8px 18px", border: "none", borderBottom: mode === "template" ? "2px solid #1E2A3A" : "2px solid transparent", background: "none", color: mode === "template" ? "var(--c-text-h)" : "var(--c-text2)", cursor: "pointer" }}>From Template</button>
            <button onClick={() => setMode("ai")} style={{ fontSize: 13, fontWeight: mode === "ai" ? 600 : 400, padding: "8px 18px", border: "none", borderBottom: mode === "ai" ? "2px solid #1e293b" : "2px solid transparent", background: "none", color: mode === "ai" ? "#1e293b" : "var(--c-text2)", cursor: "pointer" }}>AI Draft</button>
          </div>
          {mode === "template" && selected && (
            <div style={{ fontSize: 12, color: "#0f172a", padding: "8px 0 4px", cursor: "pointer" }} onClick={() => { setSelected(null); setValues({}); }}>
              ← Back to template list
            </div>
          )}
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: "auto", minHeight: 0 }}>
          {mode === "ai" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--c-text2)", marginBottom: 16 }}>Generate a first draft of a demand letter, motion, or brief using AI — tailored to your case details.</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text-h)", marginBottom: 4, display: "block" }}>Document Type</label>
                <select value={aiDraft.docType} onChange={e => setAiDraft(p => ({ ...p, docType: e.target.value, customType: e.target.value !== "Other" ? "" : (p.customType || "") }))} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg2)", color: "var(--c-text)" }}>
                  {["Demand Letter", "Settlement Demand", "Motion to Compel", "Motion for Summary Judgment", "Complaint/Petition", "Discovery Request", "Interrogatories", "Request for Production", "Deposition Notice", "Motion to Dismiss", "Continuance Request", "Daubert Motion", "Mediation Brief", "Trial Brief", "Other"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {aiDraft.docType === "Other" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text-h)", marginBottom: 4, display: "block" }}>Specify Document Type</label>
                  <input type="text" value={aiDraft.customType || ""} onChange={e => setAiDraft(p => ({ ...p, customType: e.target.value }))} placeholder="e.g. Letter of Protection, Spoliation Letter, Subpoena Duces Tecum..." style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 13, background: "var(--c-bg2)", color: "var(--c-text)" }} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text-h)", marginBottom: 4, display: "block" }}>Additional Instructions (optional)</label>
                <textarea value={aiDraft.instructions} onChange={e => setAiDraft(p => ({ ...p, instructions: e.target.value }))} style={{ width: "100%", minHeight: 60, padding: "8px", borderRadius: 6, border: "1px solid var(--c-border)", fontSize: 12, resize: "vertical", fontFamily: "inherit", background: "var(--c-bg2)", color: "var(--c-text)" }} placeholder="e.g. Emphasize liability and causation, include medical treatment timeline, reference policy limits..." />
              </div>
              {!aiDraft.result && !aiDraft.loading && (
                <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => {
                  const effectiveType = aiDraft.docType === "Other" ? ((aiDraft.customType || "").trim() || "Other Document") : aiDraft.docType;
                  setAiDraft(p => ({ ...p, loading: true, result: null, error: null }));
                  apiDraftDocument({ caseId: caseId || caseData.id, documentType: effectiveType, customInstructions: aiDraft.instructions })
                    .then(r => setAiDraft(p => ({ ...p, loading: false, result: r.result })))
                    .catch(e => setAiDraft(p => ({ ...p, loading: false, error: e.message })));
                }}>Generate Draft</button>
              )}
              {(aiDraft.loading || aiDraft.result || aiDraft.error) && (
                <AiPanel title={aiDraft.docType} result={aiDraft.result} loading={aiDraft.loading} error={aiDraft.error}
                  onRun={() => {
                    setAiDraft(p => ({ ...p, loading: true, result: null, error: null }));
                    apiDraftDocument({ caseId: caseId || caseData.id, documentType: aiDraft.docType, customInstructions: aiDraft.instructions })
                      .then(r => setAiDraft(p => ({ ...p, loading: false, result: r.result })))
                      .catch(e => setAiDraft(p => ({ ...p, loading: false, error: e.message })));
                  }}
                  actions={aiDraft.result ? (
                    <Fragment>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => { navigator.clipboard.writeText(aiDraft.result); }}>Copy</button>
                      {onAddNote && <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => {
                        onAddNote({ caseId: caseId || caseData.id, body: aiDraft.result, type: "Draft" });
                        if (onLogActivity) onLogActivity("AI Draft Saved", `${aiDraft.docType} draft saved as note`);
                        alert("Draft saved as case note.");
                      }}>Save as Note</button>}
                    </Fragment>
                  ) : null}
                />
              )}
            </div>
          )}
          {mode === "template" && loading && <div style={{ color: "#64748b", fontSize: 13 }}>Loading templates...</div>}

          {mode === "template" && !loading && !selected && (
            <>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Document Type</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["", ...allCategories].map(cat => (
                    <button key={cat || "_all"} onClick={() => setCatFilter(cat)}
                      style={{ fontSize: 12, padding: "7px 14px", borderRadius: 6, border: catFilter === cat ? "2px solid #1E2A3A" : "1px solid var(--c-border)", background: catFilter === cat ? "#f59e0b" : "var(--c-bg2)", color: catFilter === cat ? "#fff" : "var(--c-text)", cursor: "pointer", fontWeight: catFilter === cat ? 600 : 400, transition: "all 0.15s" }}
                    >{cat || "All Types"}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 150, fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }} />
                <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }}>
                  <option value="all">All Templates</option>
                  <option value="mine">My Templates</option>
                  <option value="other">Others' Templates</option>
                </select>
                {allTags.length > 0 && (
                  <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }}>
                    <option value="">All Tags</option>
                    {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>
              {filtered.length === 0 && <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", padding: "20px 0" }}>No templates found{catFilter ? ` for "${catFilter}"` : ""}. Upload templates from the Documents view first.</div>}
              {filtered.map(t => (
                <div key={t.id} onClick={() => handleSelect(t)} style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid var(--c-border)", marginBottom: 8, cursor: "pointer", background: "var(--c-bg2)", transition: "border-color 0.15s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#f59e0b"} onMouseOut={e => e.currentTarget.style.borderColor = ""}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{t.name}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: CATEGORY_COLORS[t.category] || "#f1f5f9", color: "#1e293b" }}>{t.category || "General"}{t.subType ? ` — ${t.subType}` : ""}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>by {t.createdByName} · {t.placeholders.length} field{t.placeholders.length !== 1 ? "s" : ""}</div>
                  {t.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      {t.tags.map(tag => <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#f1f5f9", color: "#1e293b" }}>{tag}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {mode === "template" && !loading && selected && (() => {
            const isPleading = selected.category === "Pleadings";
            const headerTokens = new Set(PLEADING_HEADER_PLACEHOLDERS.map(p => p.token));
            const sigTokens = new Set(PLEADING_SIGNATURE_PLACEHOLDERS.map(p => p.token));
            const bodyPhs = selected.placeholders.filter(ph => !isPleading || (!headerTokens.has(ph.token) && !sigTokens.has(ph.token)));
            const sectionLabel = (label) => (
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text2)", textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 0 4px", borderTop: "1px solid var(--c-border)", marginTop: 10 }}>{label}</div>
            );
            const allFields = buildAllCaseFields(caseData, parties, experts);
            const fieldCategories = [...new Set(allFields.map(f => f.category))];
            const renderPh = (ph) => {
              const sugs = getPlaceholderSuggestions(ph.token, caseData, parties, experts);
              const isOpen = browseOpen === ph.token;
              return (
                <div key={ph.token} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)" }}>{ph.label}</label>
                    <button
                      onClick={() => setBrowseOpen(isOpen ? null : ph.token)}
                      style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "1px solid var(--c-border)", background: isOpen ? "#f59e0b" : "var(--c-bg2)", color: isOpen ? "#fff" : "var(--c-text2)", cursor: "pointer" }}
                    >{isOpen ? "Close Fields" : "Browse Fields"}</button>
                  </div>
                  {sugs.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                      {sugs.map((s, i) => (
                        <button key={i} onClick={() => setValues(v => ({ ...v, [ph.token]: s.value }))}
                          style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "1px solid var(--c-border)", background: values[ph.token] === s.value ? "#f59e0b" : "var(--c-bg2)", color: values[ph.token] === s.value ? "#fff" : "var(--c-text)", cursor: "pointer" }}
                        >{s.label}</button>
                      ))}
                    </div>
                  )}
                  {isOpen && (
                    <div style={{ border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-bg2)", maxHeight: 200, overflowY: "auto", marginBottom: 6 }}>
                      {fieldCategories.map(cat => {
                        const catFields = allFields.filter(f => f.category === cat);
                        if (!catFields.length) return null;
                        return (
                          <div key={cat}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-text2)", textTransform: "uppercase", letterSpacing: 0.5, padding: "6px 10px 2px", background: "var(--c-bg)", position: "sticky", top: 0 }}>{cat}</div>
                            {catFields.map((f, i) => (
                              <div
                                key={i}
                                onClick={() => { setValues(v => ({ ...v, [ph.token]: f.value })); setBrowseOpen(null); }}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 10px", cursor: "pointer", fontSize: 11, borderBottom: "1px solid var(--c-border)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <span style={{ color: "var(--c-text2)", marginRight: 8, flexShrink: 0 }}>{f.label}</span>
                                <span style={{ color: "var(--c-text)", fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{f.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <input
                    value={values[ph.token] || ""}
                    onChange={e => setValues(v => ({ ...v, [ph.token]: e.target.value }))}
                    style={{ width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", boxSizing: "border-box" }}
                    placeholder={`Leave empty for <<${ph.token}>>`}
                  />
                </div>
              );
            };
            return (
              <>
                <div style={{ fontSize: 13, color: "var(--c-text2)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Template: <strong>{selected.name}</strong></span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: CATEGORY_COLORS[selected.category] || "#f1f5f9", color: "#1e293b" }}>{selected.category || "General"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                  Fill in fields below. Empty fields will appear as {"<<PLACEHOLDER>>"} in the document.
                  {isPleading && <span style={{ display: "block", marginTop: 4, color: "var(--c-text2)" }}>Case Header and Signature Block will be automatically included.</span>}
                </div>
                {isPleading && sectionLabel("Case Caption")}
                {isPleading && PLEADING_HEADER_PLACEHOLDERS.map(renderPh)}
                {bodyPhs.length > 0 && isPleading && sectionLabel("Document Body")}
                {bodyPhs.map(renderPh)}
                {isPleading && sectionLabel("Signature Block")}
                {isPleading && PLEADING_SIGNATURE_PLACEHOLDERS.map(renderPh)}
                {!isPleading && selected.placeholders.map(renderPh)}
                {isPleading && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--c-text2)", padding: "12px 0", borderTop: "1px solid var(--c-border)", marginTop: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={includeCoS} onChange={e => setIncludeCoS(e.target.checked)} />
                    Include Certificate of Service
                  </label>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px", fontSize: 14, marginTop: 8 }}
                  disabled={generating}
                  onClick={handleGenerate}
                >{generating ? "Generating..." : "Generate & Download"}</button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function DocumentsView({ currentUser, allCases, onMenuToggle, confirmDelete }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);

  useEffect(() => {
    apiGetTemplates().then(t => { setTemplates(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const allTags = [...new Set(templates.flatMap(t => t.tags))].sort();
  const allCategories = [...new Set(templates.map(t => t.category || "General"))].sort();
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = templates.filter(t => {
    if (filter === "mine" && t.createdBy !== currentUser.id) return false;
    if (catFilter && (t.category || "General") !== catFilter) return false;
    if (tagFilter && !t.tags.includes(tagFilter)) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Document Templates</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="!px-4 !py-2 !text-xs !font-medium !text-white !bg-slate-900 dark:!bg-slate-800 hover:!bg-slate-800 dark:hover:!bg-slate-700 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm !ml-auto" onClick={() => document.getElementById("docUploadInput").click()}><Plus size={14} className="inline mr-1" />New Template</button>
          <input id="docUploadInput" type="file" accept=".docx,.doc" style={{ display: "none" }} onChange={async e => {
            const file = e.target.files[0]; if (!file) return; e.target.value = "";
            try {
              const parsed = await apiUploadTemplateFile(file);
              const detected = (parsed.detectedPlaceholders || []).map(ph => ({
                ...ph, id: Date.now() + Math.random(), autoDetected: true,
                start: parsed.text.indexOf(`<<${ph.token}>>`),
                end: parsed.text.indexOf(`<<${ph.token}>>`) + `<<${ph.token}>>`.length,
                original: "",
              }));
              setWizard({ step: 1, file, text: parsed.text, paragraphs: parsed.paragraphs, placeholders: detected, name: file.name.replace(/\.(docx?|doc)$/i, ""), tags: [], newTag: "", isDoc: parsed.isDoc, category: "General", subType: "" });
            } catch (err) { alert("Failed to parse document: " + err.message); }
          }} />
        </div>
      </div>
      <div className="content">

      {!wizard && (
        <>
          <div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap" }}>
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 150, fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }} />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }}>
              <option value="all">All</option>
              <option value="mine">My Templates</option>
            </select>
            {allCategories.length > 1 && (
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }}>
                <option value="">All Categories</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {allTags.length > 0 && (
              <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }}>
                <option value="">All Tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {loading && <div style={{ color: "#64748b", fontSize: 13, padding: 20 }}>Loading...</div>}
          {!loading && filtered.length === 0 && <div style={{ color: "#64748b", fontSize: 13, fontStyle: "italic", padding: 20 }}>No templates yet. Click "+ New Template" to upload a .doc or .docx file and create your first template.</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(t => {
              const canEdit = t.createdBy === currentUser.id || hasRole(currentUser, "Managing Partner") || hasRole(currentUser, "Senior Partner") || hasRole(currentUser, "Partner");
              return (
              <div key={t.id} style={{ padding: 16, borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-bg2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>{t.name}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: CATEGORY_COLORS[t.category] || "#f1f5f9", color: "#1e293b" }}>{t.category || "General"}{t.subType ? ` — ${t.subType}` : ""}</span>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: t.visibility === "personal" ? "#fef3c7" : "#ecfdf5", color: "#1e293b", flexShrink: 0, marginLeft: 8 }}>
                    {t.visibility === "personal" ? "Personal" : "Global"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>by {t.createdByName} · {t.placeholders.length} field{t.placeholders.length !== 1 ? "s" : ""}</div>
                {t.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                    {t.tags.map(tag => <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#f1f5f9", color: "#1e293b" }}>{tag}</span>)}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {canEdit && (
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={async () => {
                      try {
                        const source = await apiGetTemplateSource(t.id);
                        setWizard({
                          step: 2,
                          editingId: t.id,
                          text: source.text,
                          placeholders: source.placeholders,
                          name: t.name,
                          tags: [...(t.tags || [])],
                          newTag: "",
                          visibility: t.visibility || "global",
                          category: t.category || "General",
                          subType: t.subType || "",
                          file: null,
                        });
                      } catch (err) { alert("Failed to load template: " + err.message); }
                    }}>Edit</button>
                  )}
                  {canEdit && (
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11, color: "#e05252", borderColor: "#e05252" }} onClick={async () => {
                      if (!await confirmDelete()) return;
                      try { await apiDeleteTemplate(t.id); setTemplates(p => p.filter(x => x.id !== t.id)); } catch (err) { alert(err.message); }
                    }}>Delete</button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Template Creation Wizard ── */}
      {wizard && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {(wizard.editingId ? ["Placeholders", "Review & Save"] : ["Name & Category", "Placeholders", "Review & Save"]).map((label, i) => {
              const stepNum = wizard.editingId ? i + 2 : i + 1;
              return <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 0", fontSize: 12, fontWeight: wizard.step === stepNum ? 700 : 400, color: wizard.step === stepNum ? "#0f172a" : "#64748b", borderBottom: `2px solid ${wizard.step === stepNum ? "#0f172a" : "var(--c-border)"}` }}>{i + 1}. {label}</div>;
            })}
          </div>

          {wizard.isDoc && wizard.step >= 1 && (
            <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 6, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: "#92400e" }}>
              This .doc file has been converted to .docx format. The text content is preserved, but some formatting may be simplified. For best results, use .docx files.
            </div>
          )}

          {/* Step 1: Name, Category, Tags (new templates only) */}
          {!wizard.editingId && wizard.step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 260px)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 4, flexShrink: 0 }}>Step 1: Name & Category</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, flexShrink: 0 }}>Name your template and choose a category.</div>

              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Template Name</label>
                  <input value={wizard.name} onChange={e => setWizard(w => ({ ...w, name: e.target.value }))} style={{ width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", boxSizing: "border-box" }} autoFocus />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Category</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <button key={cat} onClick={async () => {
                        setWizard(w => ({ ...w, category: cat, subType: cat !== "Letters" ? "" : w.subType }));
                        if (cat === "Pleadings" && wizard.file && !wizard.detectionDone) {
                          setWizard(w => ({ ...w, category: cat, subType: "", detectingPleading: true }));
                          try {
                            const result = await apiDetectPleadingSections(wizard.file);
                            setWizard(w => ({ ...w, detectingPleading: false, detectionDone: true, detectedSections: result, useSystemHeader: !result.hasHeader, useSystemSignature: !result.hasSignature, useSystemCos: !result.hasCos }));
                          } catch { setWizard(w => ({ ...w, detectingPleading: false, detectionDone: true, detectedSections: { hasHeader: false, hasSignature: false, hasCos: false } })); }
                        }
                      }}
                        style={{ padding: "8px 16px", borderRadius: 8, border: `2px solid ${wizard.category === cat ? "#4f46e5" : "var(--c-border)"}`, background: wizard.category === cat ? CATEGORY_COLORS[cat] : "var(--c-bg2)", cursor: "pointer", fontSize: 13, fontWeight: wizard.category === cat ? 700 : 400, color: "var(--c-text)" }}
                      >{cat}</button>
                    ))}
                  </div>
                </div>

                {wizard.category === "Pleadings" && wizard.detectingPleading && (
                  <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#1E40AF" }}>
                    Analyzing document for existing pleading sections...
                  </div>
                )}

                {wizard.category === "Pleadings" && wizard.detectionDone && wizard.detectedSections && (wizard.detectedSections.hasHeader || wizard.detectedSections.hasSignature || wizard.detectedSections.hasCos) && (
                  <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", marginBottom: 4 }}>Pleading Sections Detected</div>
                    <div style={{ fontSize: 12, color: "var(--c-text3)", marginBottom: 12 }}>Your document appears to contain some standard pleading sections. For each one, choose whether to use the system-provided version or keep what's in your document.</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {wizard.detectedSections.hasHeader && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>Case Header (Caption Block)</div>
                            <div style={{ fontSize: 11, color: "var(--c-text3)" }}>Court name, parties, case number</div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setWizard(w => ({ ...w, useSystemHeader: true }))} style={{ padding: "4px 10px", borderRadius: 5, border: `2px solid ${wizard.useSystemHeader ? "#f59e0b" : "var(--c-border)"}`, background: wizard.useSystemHeader ? "#d1fae5" : "var(--c-bg2)", cursor: "pointer", fontSize: 11, fontWeight: wizard.useSystemHeader ? 600 : 400, color: "var(--c-text)" }}>Use System</button>
                            <button onClick={() => setWizard(w => ({ ...w, useSystemHeader: false }))} style={{ padding: "4px 10px", borderRadius: 5, border: `2px solid ${!wizard.useSystemHeader ? "#f59e0b" : "var(--c-border)"}`, background: !wizard.useSystemHeader ? "#FEF3C7" : "var(--c-bg2)", cursor: "pointer", fontSize: 11, fontWeight: !wizard.useSystemHeader ? 600 : 400, color: "var(--c-text)" }}>Use Document's Own</button>
                          </div>
                        </div>
                      )}
                      {wizard.detectedSections.hasSignature && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>Signature Block</div>
                            <div style={{ fontSize: 11, color: "var(--c-text3)" }}>Attorney name, firm, address</div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setWizard(w => ({ ...w, useSystemSignature: true }))} style={{ padding: "4px 10px", borderRadius: 5, border: `2px solid ${wizard.useSystemSignature ? "#f59e0b" : "var(--c-border)"}`, background: wizard.useSystemSignature ? "#d1fae5" : "var(--c-bg2)", cursor: "pointer", fontSize: 11, fontWeight: wizard.useSystemSignature ? 600 : 400, color: "var(--c-text)" }}>Use System</button>
                            <button onClick={() => setWizard(w => ({ ...w, useSystemSignature: false }))} style={{ padding: "4px 10px", borderRadius: 5, border: `2px solid ${!wizard.useSystemSignature ? "#f59e0b" : "var(--c-border)"}`, background: !wizard.useSystemSignature ? "#FEF3C7" : "var(--c-bg2)", cursor: "pointer", fontSize: 11, fontWeight: !wizard.useSystemSignature ? 600 : 400, color: "var(--c-text)" }}>Use Document's Own</button>
                          </div>
                        </div>
                      )}
                      {wizard.detectedSections.hasCos && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>Certificate of Service</div>
                            <div style={{ fontSize: 11, color: "var(--c-text3)" }}>Service attestation with party list</div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setWizard(w => ({ ...w, useSystemCos: true }))} style={{ padding: "4px 10px", borderRadius: 5, border: `2px solid ${wizard.useSystemCos ? "#f59e0b" : "var(--c-border)"}`, background: wizard.useSystemCos ? "#d1fae5" : "var(--c-bg2)", cursor: "pointer", fontSize: 11, fontWeight: wizard.useSystemCos ? 600 : 400, color: "var(--c-text)" }}>Use System</button>
                            <button onClick={() => setWizard(w => ({ ...w, useSystemCos: false }))} style={{ padding: "4px 10px", borderRadius: 5, border: `2px solid ${!wizard.useSystemCos ? "#f59e0b" : "var(--c-border)"}`, background: !wizard.useSystemCos ? "#FEF3C7" : "var(--c-bg2)", cursor: "pointer", fontSize: 11, fontWeight: !wizard.useSystemCos ? 600 : 400, color: "var(--c-text)" }}>Use Document's Own</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {wizard.category === "Letters" && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Letter Type</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {LETTER_SUB_TYPES.map(st => (
                        <button key={st} onClick={() => setWizard(w => ({ ...w, subType: st }))}
                          style={{ padding: "6px 14px", borderRadius: 6, border: `2px solid ${wizard.subType === st ? "#f59e0b" : "var(--c-border)"}`, background: wizard.subType === st ? "#fef3c7" : "var(--c-bg2)", cursor: "pointer", fontSize: 12, fontWeight: wizard.subType === st ? 700 : 400, color: "var(--c-text)" }}
                        >{st}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Tags</label>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                    {wizard.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#f1f5f9", color: "#1e293b", cursor: "pointer" }} onClick={() => setWizard(w => ({ ...w, tags: w.tags.filter(t => t !== tag) }))}>
                        {tag} ✕
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input placeholder="Add a tag (e.g., Discovery, Motions)" value={wizard.newTag || ""} onChange={e => setWizard(w => ({ ...w, newTag: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter" && wizard.newTag?.trim()) { setWizard(w => ({ ...w, tags: [...w.tags, w.newTag.trim()], newTag: "" })); } }}
                      style={{ flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }} />
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { if (wizard.newTag?.trim()) setWizard(w => ({ ...w, tags: [...w.tags, w.newTag.trim()], newTag: "" })); }}>Add Tag</button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Visibility</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setWizard(w => ({ ...w, visibility: "global" }))}
                      style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${(wizard.visibility || "global") === "global" ? "#4f46e5" : "var(--c-border)"}`, background: (wizard.visibility || "global") === "global" ? "#f1f5f9" : "var(--c-bg2)", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Everyone</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>All staff can use this template</div>
                    </button>
                    <button onClick={() => setWizard(w => ({ ...w, visibility: "personal" }))}
                      style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${wizard.visibility === "personal" ? "#4f46e5" : "var(--c-border)"}`, background: wizard.visibility === "personal" ? "#f1f5f9" : "var(--c-bg2)", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Only Me</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Only visible to you</div>
                    </button>
                  </div>
                </div>

                {wizard.placeholders.length > 0 && (
                  <div style={{ background: "#d1fae5", border: "1px solid #10b981", borderRadius: 6, padding: "8px 14px", fontSize: 12, color: "#065f46" }}>
                    {wizard.placeholders.length} placeholder{wizard.placeholders.length !== 1 ? "s" : ""} auto-detected from {"<<"} {">> markers in your document."}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, flexShrink: 0, paddingTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setWizard(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={!wizard.name?.trim()} onClick={() => setWizard(w => ({ ...w, step: 2 }))}>Next: Placeholders</button>
              </div>
            </div>
          )}

          {/* Step 2: Select Placeholders */}
          {wizard.step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 260px)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 4, flexShrink: 0 }}>{wizard.editingId ? "Edit Placeholders" : "Step 2: Placeholders"}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, flexShrink: 0 }}>
                {wizard.editingId ? "Your existing placeholders are shown below. Add new ones or remove existing ones." : "Auto-detected placeholders are shown. You can also highlight text and click \"Make Placeholder\" to add more."}
              </div>

              <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0, overflow: "hidden" }}>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <div
                    id="docPreviewPane"
                    style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 20, flex: 1, minHeight: 0, overflow: "auto", fontSize: 13, lineHeight: 1.8, color: "var(--c-text)", whiteSpace: "pre-wrap", userSelect: "text" }}
                  >
                    {(() => {
                      let displayText = wizard.text;
                      const manualPhs = wizard.placeholders.filter(p => !p.autoDetected && p.start >= 0);
                      const sorted = [...manualPhs].sort((a, b) => b.start - a.start);
                      const parts = [];
                      let lastEnd = displayText.length;
                      for (const ph of sorted) {
                        if (ph.start < lastEnd) {
                          parts.unshift({ text: displayText.slice(ph.end, lastEnd), type: "text" });
                          parts.unshift({ text: `[${ph.label}]`, type: "placeholder", id: ph.id });
                          lastEnd = ph.start;
                        }
                      }
                      parts.unshift({ text: displayText.slice(0, lastEnd), type: "text" });
                      return parts.map((p, i) =>
                        p.type === "placeholder"
                          ? <span key={i} style={{ background: "#f1f5f9", color: "#1e40af", padding: "1px 4px", borderRadius: 3, fontWeight: 600, cursor: "pointer" }} title="Click to remove" onClick={() => setWizard(w => ({ ...w, placeholders: w.placeholders.filter(x => x.id !== p.id) }))}>{p.text}</span>
                          : <span key={i}>{p.text}</span>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-gold" style={{ fontSize: 12 }} onClick={() => {
                    const sel = window.getSelection();
                    if (!sel || sel.isCollapsed) return alert("Highlight some text first, then click this button.");
                    const text = sel.toString().trim();
                    if (!text) return;
                    const pane = document.getElementById("docPreviewPane");
                    if (!pane || !pane.contains(sel.anchorNode)) return alert("Please select text from the document preview.");
                    const fullText = wizard.text;
                    const range = sel.getRangeAt(0);
                    const preRange = document.createRange();
                    preRange.selectNodeContents(pane);
                    preRange.setEnd(range.startContainer, range.startOffset);
                    const preText = preRange.toString();
                    let idx = -1;
                    const manualPhs = wizard.placeholders.filter(p => !p.autoDetected && p.start >= 0);
                    const sortedPhs = [...manualPhs].sort((a, b) => a.start - b.start);
                    let offset = 0;
                    let visualPos = 0;
                    for (const ph of sortedPhs) {
                      if (visualPos + (ph.start - offset) > preText.length) break;
                      const labelLen = `[${ph.label}]`.length;
                      visualPos += (ph.start - offset);
                      visualPos += labelLen;
                      offset = ph.end;
                    }
                    const remainingVisual = preText.length - visualPos;
                    const charOffset = offset + remainingVisual;
                    const searchStart = Math.max(0, charOffset - 5);
                    idx = fullText.indexOf(text, searchStart);
                    if (idx === -1) idx = fullText.indexOf(text);
                    if (idx === -1) return alert("Could not locate the selected text. Try selecting a more unique phrase.");
                    const overlap = manualPhs.some(p => !(idx + text.length <= p.start || idx >= p.end));
                    if (overlap) return alert("This selection overlaps with an existing placeholder.");
                    const label = prompt("Name this placeholder (e.g., 'Client Name', 'Charge Description'):");
                    if (!label || !label.trim()) return;
                    const token = label.trim().replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
                    setWizard(w => ({
                      ...w,
                      placeholders: [...w.placeholders, { id: Date.now(), label: label.trim(), token, original: text, start: idx, end: idx + text.length, autoDetected: false }],
                    }));
                    sel.removeAllRanges();
                  }}>Make Placeholder</button>
                  </div>
                </div>

                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", marginBottom: 8 }}>Placeholders ({wizard.placeholders.length})</div>
                  {wizard.placeholders.length === 0 && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>None yet. Use {"<<NAME>>"} markers in your document or highlight text to add placeholders.</div>}
                  {wizard.placeholders.map(ph => (
                    <div key={ph.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--c-border2)", fontSize: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, color: "var(--c-text)" }}>{ph.label}</span>
                          {ph.autoDetected && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#d1fae5", color: "#065f46" }}>auto</span>}
                        </div>
                        {ph.original && <div style={{ color: "#64748b", fontSize: 11 }}>replaces: "{(ph.original || "").substring(0, 40)}{(ph.original || "").length > 40 ? "..." : ""}"</div>}
                        {!ph.original && ph.autoDetected && <div style={{ color: "#64748b", fontSize: 11 }}>{"<<"}{ph.token}{">>"}</div>}
                      </div>
                      <button onClick={() => setWizard(w => ({ ...w, placeholders: w.placeholders.filter(x => x.id !== ph.id) }))} style={{ background: "none", border: "none", color: "#e05252", cursor: "pointer", fontSize: 14 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, flexShrink: 0, paddingTop: 8 }}>
                <button className="btn btn-outline" onClick={() => { if (wizard.editingId) { setWizard(null); } else { setWizard(w => ({ ...w, step: 1 })); } }}>{wizard.editingId ? "Cancel" : "Back"}</button>
                <button className="btn btn-primary" onClick={() => setWizard(w => ({ ...w, step: 3 }))}>Next: Review & Save</button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Save */}
          {wizard.step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 260px)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 4, flexShrink: 0 }}>Review & Save</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, flexShrink: 0 }}>Review your template settings and placeholders, then save.</div>

              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                {wizard.editingId && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Template Name</label>
                      <input value={wizard.name} onChange={e => setWizard(w => ({ ...w, name: e.target.value }))} style={{ width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", boxSizing: "border-box" }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Category</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {TEMPLATE_CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setWizard(w => ({ ...w, category: cat, subType: cat !== "Letters" ? "" : w.subType }))}
                            style={{ padding: "6px 14px", borderRadius: 6, border: `2px solid ${wizard.category === cat ? "#f59e0b" : "var(--c-border)"}`, background: wizard.category === cat ? CATEGORY_COLORS[cat] : "var(--c-bg2)", cursor: "pointer", fontSize: 12, fontWeight: wizard.category === cat ? 700 : 400, color: "var(--c-text)" }}
                          >{cat}</button>
                        ))}
                      </div>
                    </div>

                    {wizard.category === "Letters" && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Letter Type</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {LETTER_SUB_TYPES.map(st => (
                            <button key={st} onClick={() => setWizard(w => ({ ...w, subType: st }))}
                              style={{ padding: "4px 12px", borderRadius: 6, border: `2px solid ${wizard.subType === st ? "#f59e0b" : "var(--c-border)"}`, background: wizard.subType === st ? "#fef3c7" : "var(--c-bg2)", cursor: "pointer", fontSize: 12, fontWeight: wizard.subType === st ? 700 : 400, color: "var(--c-text)" }}
                            >{st}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Tags</label>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                        {wizard.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#f1f5f9", color: "#1e293b", cursor: "pointer" }} onClick={() => setWizard(w => ({ ...w, tags: w.tags.filter(t => t !== tag) }))}>
                            {tag} ✕
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input placeholder="Add a tag" value={wizard.newTag || ""} onChange={e => setWizard(w => ({ ...w, newTag: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter" && wizard.newTag?.trim()) { setWizard(w => ({ ...w, tags: [...w.tags, w.newTag.trim()], newTag: "" })); } }}
                          style={{ flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }} />
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { if (wizard.newTag?.trim()) setWizard(w => ({ ...w, tags: [...w.tags, w.newTag.trim()], newTag: "" })); }}>Add Tag</button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 6 }}>Visibility</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setWizard(w => ({ ...w, visibility: "global" }))}
                          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${(wizard.visibility || "global") === "global" ? "#f59e0b" : "var(--c-border)"}`, background: (wizard.visibility || "global") === "global" ? "#f1f5f9" : "var(--c-bg2)", cursor: "pointer", textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Everyone</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>All staff can use this template</div>
                        </button>
                        <button onClick={() => setWizard(w => ({ ...w, visibility: "personal" }))}
                          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${wizard.visibility === "personal" ? "#f59e0b" : "var(--c-border)"}`, background: wizard.visibility === "personal" ? "#f1f5f9" : "var(--c-bg2)", cursor: "pointer", textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Only Me</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Only visible to you</div>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", marginBottom: 8 }}>Summary</div>
                  <div style={{ fontSize: 12, color: "var(--c-text2)", lineHeight: 1.8 }}>
                    <div><strong>Name:</strong> {wizard.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><strong>Category:</strong> <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: CATEGORY_COLORS[wizard.category] || "#f1f5f9", color: "#1e293b" }}>{wizard.category || "General"}{wizard.subType ? ` — ${wizard.subType}` : ""}</span></div>
                    <div><strong>Placeholders:</strong> {wizard.placeholders.length} ({wizard.placeholders.filter(p => p.autoDetected).length} auto-detected, {wizard.placeholders.filter(p => !p.autoDetected).length} manual)</div>
                    {wizard.tags.length > 0 && <div><strong>Tags:</strong> {wizard.tags.join(", ")}</div>}
                    <div><strong>Visibility:</strong> {(wizard.visibility || "global") === "global" ? "Everyone" : "Only Me"}</div>
                    {wizard.category === "Pleadings" && wizard.detectedSections && (wizard.detectedSections.hasHeader || wizard.detectedSections.hasSignature || wizard.detectedSections.hasCos) && (
                      <div style={{ marginTop: 4 }}>
                        <strong>Pleading Sections:</strong>
                        {wizard.detectedSections.hasHeader && <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 6px", borderRadius: 4, background: wizard.useSystemHeader ? "#d1fae5" : "#FEF3C7" }}>Header: {wizard.useSystemHeader ? "System" : "Document"}</span>}
                        {wizard.detectedSections.hasSignature && <span style={{ marginLeft: 4, fontSize: 11, padding: "1px 6px", borderRadius: 4, background: wizard.useSystemSignature ? "#d1fae5" : "#FEF3C7" }}>Signature: {wizard.useSystemSignature ? "System" : "Document"}</span>}
                        {wizard.detectedSections.hasCos && <span style={{ marginLeft: 4, fontSize: 11, padding: "1px 6px", borderRadius: 4, background: wizard.useSystemCos ? "#d1fae5" : "#FEF3C7" }}>CoS: {wizard.useSystemCos ? "System" : "Document"}</span>}
                      </div>
                    )}
                  </div>
                  {wizard.placeholders.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: "1px solid var(--c-border)", paddingTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text3)", marginBottom: 4 }}>Placeholder List:</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {wizard.placeholders.map(ph => (
                          <span key={ph.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: ph.autoDetected ? "#d1fae5" : "#f1f5f9", color: "#1e293b" }}>{ph.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, flexShrink: 0, paddingTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setWizard(w => ({ ...w, step: 2 }))}>Back</button>
                <button className="btn btn-primary" disabled={!wizard.name?.trim()} onClick={async () => {
                  try {
                    const phData = wizard.placeholders.map(p => ({
                      token: p.token, label: p.label, original: p.original || "",
                    }));

                    if (wizard.editingId) {
                      const updated = await apiUpdateTemplate(wizard.editingId, {
                        name: wizard.name.trim(),
                        tags: wizard.tags,
                        placeholders: phData,
                        visibility: wizard.visibility || "global",
                        category: wizard.category || "General",
                        subType: wizard.subType || "",
                        reprocessDocx: true,
                      });
                      setTemplates(p => p.map(t => t.id === updated.id ? updated : t));
                    } else {
                      const systemPrefs = wizard.category === "Pleadings" ? { useSystemHeader: wizard.useSystemHeader !== false, useSystemSignature: wizard.useSystemSignature !== false, useSystemCos: wizard.useSystemCos !== false } : null;
                      const saved = await apiSaveTemplate(wizard.file, wizard.name.trim(), wizard.tags, phData, wizard.visibility || "global", wizard.category || "General", wizard.subType || "", systemPrefs);
                      setTemplates(p => [...p, saved]);
                    }
                    setWizard(null);
                  } catch (err) { alert("Failed to save template: " + err.message); }
                }}>{wizard.editingId ? "Save Changes" : "Save Template"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      </div>
    </>
  );
}



export default DocumentsView;
export { GenerateDocumentModal };
