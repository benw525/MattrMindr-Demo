import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Merge, Phone, Menu, Pin } from "lucide-react";
import {
  apiGetContacts,
  apiGetDeletedContacts,
  apiCreateContact,
  apiUpdateContact,
  apiDeleteContact,
  apiRestoreContact,
  apiMergeContacts,
  apiGetContactCases,
  apiGetContactCaseCounts,
  apiGetContactNotes,
  apiCreateContactNote,
  apiDeleteContactNote,
  apiGetContactStaff,
  apiCreateContactStaff,
  apiUpdateContactStaff,
  apiDeleteContactStaff,
  apiGetContactPhones,
  apiAddContactPhone,
  apiUpdateContactPhone,
  apiDeleteContactPhone,
  apiGetContactCaseLinks,
  apiAddContactCaseLink,
  apiDeleteContactCaseLink,
  apiGetOutlookContacts,
  apiImportOutlookContacts,
  apiExportContactsToOutlook,
  apiSavePreferences,
} from "../api.js";
import {
  isAppAdmin,
} from "../shared.js";

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
const CONTACT_NOTE_TYPES = [
  { label: "General", bg: "var(--c-border)", color: "var(--c-text2)" },
  { label: "Call Log", bg: "#dcfce7", color: "#4CAE72" },
  { label: "Email Log", bg: "#f1f5f9", color: "#5599cc" },
  { label: "Meeting", bg: "#fef9c3", color: "#0f172a" },
  { label: "Follow-up", bg: "#fee2e2", color: "#e05252" },
];
function NewContactModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", category: "Client", phone: "", email: "", fax: "", address: "", firm: "", company: "", county: "Mobile" });
  const [extraPhones, setExtraPhones] = useState([]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    const saved = await onSave(form);
    if (saved && saved.id && extraPhones.length > 0) {
      for (const p of extraPhones) {
        if (p.number.trim()) {
          try { await apiAddContactPhone(saved.id, { label: p.label, number: p.number }); } catch {}
        }
      }
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 500, maxWidth: "calc(100vw - 24px)" }}>
        <div className="modal-header"><span>New Contact</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="field-label">Name *</label>
            <input className="field-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name or organization" autoFocus />
          </div>
          <div>
            <label className="field-label">Category *</label>
            <select className="field-input" value={form.category} onChange={e => set("category", e.target.value)}>
              {CONTACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {form.category === "Prosecutor" && (
            <div>
              <label className="field-label">Office</label>
              <input className="field-input" value={form.firm} onChange={e => set("firm", e.target.value)} placeholder="District Attorney's Office" />
            </div>
          )}
          {(form.category === "Adjuster" || form.category === "Expert") && (
            <div>
              <label className="field-label">Company</label>
              <input className="field-input" value={form.company} onChange={e => set("company", e.target.value)} placeholder="Company name" />
            </div>
          )}
          {(form.category === "Court" || form.category === "Judge") && (
            <div>
              <label className="field-label">County</label>
              <input className="field-input" value={form.county} onChange={e => set("county", e.target.value)} placeholder="County name" />
            </div>
          )}
          <div>
            <label className="field-label">Primary Phone</label>
            <input className="field-input" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label className="field-label" style={{ margin: 0 }}>Additional Phones ({extraPhones.length})</label>
              <button onClick={() => setExtraPhones(p => [...p, { id: Date.now(), label: "Cell", number: "" }])} style={{ background: "none", border: "none", color: "var(--c-accent, #1e3a5f)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>+ Add Phone</button>
            </div>
            {extraPhones.map((p, i) => (
              <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <select value={p.label} onChange={e => setExtraPhones(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="field-input" style={{ width: 90, flexShrink: 0, fontSize: 12 }}>
                  {["Cell", "Office", "Home", "Work", "Fax", "Other"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input className="field-input" value={p.number} onChange={e => setExtraPhones(prev => prev.map((x, j) => j === i ? { ...x, number: e.target.value } : x))} placeholder="(555) 555-5555" style={{ flex: 1 }} />
                <button onClick={() => setExtraPhones(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#e05252", fontSize: 14, cursor: "pointer", padding: "0 4px", flexShrink: 0, lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="field-label">Fax</label>
              <input className="field-input" value={form.fax} onChange={e => set("fax", e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input className="field-input" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="field-label">Address</label>
            <textarea className="field-input" rows={2} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, City, State ZIP" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.name.trim()} onClick={handleSave}>Create Contact</button>
        </div>
      </div>
    </div>
  );
}

const ATTORNEY_STAFF_TYPES = ["Paralegal", "Case Manager", "Legal Assistant", "Administrative Assistant", "Other"];
const COURT_STAFF_TYPES = ["Judicial Assistant", "Clerk", "Court Reporter", "Bailiff", "Other"];

function ContactDetailOverlay({ contact, currentUser, notes, allCases, onClose, onUpdate, onDelete, onAddNote, onDeleteNote, onSelectCase, confirmDelete }) {
  const [draft, setDraft] = useState({ ...contact });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteType, setNewNoteType] = useState("General");
  const [addingNote, setAddingNote] = useState(false);
  const [staff, setStaff] = useState([]);
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [addingStaff, setAddingStaff] = useState(false);
  const [phones, setPhones] = useState([]);
  const [caseLinks, setCaseLinks] = useState([]);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkDropdown, setLinkDropdown] = useState(false);
  const staffTimers = useRef({});
  const staffPendingData = useRef({});
  const phoneTimers = useRef({});

  const hasStaff = contact.category === "Insurance Company" || contact.category === "Court" || contact.category === "Defense Attorney";
  const staffTypes = contact.category === "Court" ? COURT_STAFF_TYPES : ATTORNEY_STAFF_TYPES;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft({ ...contact }); setShowDelete(false); }, [contact.id]);

  useEffect(() => {
    if (hasStaff) {
      apiGetContactStaff(contact.id).then(setStaff).catch(() => setStaff([]));
    } else {
      setStaff([]);
    }
    apiGetContactPhones(contact.id).then(setPhones).catch(() => setPhones([]));
    apiGetContactCaseLinks(contact.id).then(setCaseLinks).catch(() => setCaseLinks([]));
    return () => {
      Object.values(staffTimers.current).forEach(clearTimeout);
      Object.values(phoneTimers.current).forEach(clearTimeout);
      const pending = staffPendingData.current;
      Object.keys(pending).forEach(async (sid) => {
        try { await apiUpdateContactStaff(sid, { data: pending[sid] }); } catch {}
      });
      staffPendingData.current = {};
      staffTimers.current = {};
      phoneTimers.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id, hasStaff]);

  const set = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const save = async (updated) => {
    setSaving(true);
    try {
      const toSave = { ...updated, id: updated.id || contact.id };
      await onUpdate(toSave);
    } catch (err) {
      console.error("Contact save error:", err);
    }
    setSaving(false);
  };

  const addPhone = () => {
    const tempId = "tmp_" + Date.now();
    setPhones(prev => [...prev, { id: tempId, label: "Cell", number: "", contactId: contact.id, _unsaved: true }]);
  };
  const updatePhone = (phone, field, value) => {
    const updated = { ...phone, [field]: value };
    setPhones(prev => prev.map(p => p.id === phone.id ? updated : p));
    if (phoneTimers.current[phone.id]) clearTimeout(phoneTimers.current[phone.id]);
    phoneTimers.current[phone.id] = setTimeout(async () => {
      if (phone._unsaved) {
        const num = field === "number" ? value : phone.number;
        if (!num || !num.trim()) return;
        try {
          const saved = await apiAddContactPhone(contact.id, { label: updated.label, number: num });
          setPhones(prev => prev.map(p => p.id === phone.id ? { ...saved, _unsaved: false } : p));
        } catch {}
      } else {
        try { await apiUpdateContactPhone(phone.id, { [field]: value }); } catch {}
      }
    }, 600);
  };
  const removePhone = async (phoneId) => {
    const phone = phones.find(p => p.id === phoneId);
    if (phone && phone._unsaved) {
      setPhones(prev => prev.filter(p => p.id !== phoneId));
      return;
    }
    try {
      await apiDeleteContactPhone(phoneId);
      setPhones(prev => prev.filter(p => p.id !== phoneId));
    } catch {}
  };

  const addCaseLink = async (caseId) => {
    try {
      const link = await apiAddContactCaseLink(contact.id, caseId);
      if (link.id) setCaseLinks(prev => [...prev, link]);
      setLinkSearch(""); setLinkDropdown(false);
    } catch {}
  };
  const removeCaseLink = async (linkId) => {
    try {
      await apiDeleteContactCaseLink(linkId);
      setCaseLinks(prev => prev.filter(l => l.id !== linkId));
    } catch {}
  };

  const [fetchedAssocCases, setFetchedAssocCases] = useState([]);
  useEffect(() => {
    apiGetContactCases(contact.id).then(setFetchedAssocCases).catch(() => setFetchedAssocCases([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id, contact.category, caseLinks.length]);

  const assocCases = useMemo(() => {
    const nameMatched = [];
    if (allCases) {
      const cName = (contact.name || "").toLowerCase().trim();
      if (contact.category === "Client") {
        nameMatched.push(...allCases.filter(c => {
          if (c.deletedAt) return false;
          const dName = (c.clientName || "").toLowerCase().trim();
          return dName && cName && (dName === cName || dName.includes(cName) || cName.includes(dName));
        }));
      } else if (contact.category === "Judge") {
        nameMatched.push(...allCases.filter(c => c.judge === contact.name && !c.deletedAt));
      }
    }
    const seen = new Set(nameMatched.map(c => c.id));
    const merged = [...nameMatched];
    for (const fc of fetchedAssocCases) {
      if (!seen.has(fc.id)) { merged.push(fc); seen.add(fc.id); }
    }
    return merged;
  }, [contact, allCases, fetchedAssocCases]);

  const catStyle = CONTACT_CAT_STYLE[draft.category] || CONTACT_CAT_STYLE.Miscellaneous;

  const noteTypeStyle = (label) => CONTACT_NOTE_TYPES.find(t => t.label === label) || CONTACT_NOTE_TYPES[0];

  const submitNote = async () => {
    if (!newNoteBody.trim()) return;
    setAddingNote(true);
    try {
      await onAddNote(contact.id, {
        type: newNoteType, body: newNoteBody.trim(),
        authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role,
        createdAt: new Date().toISOString(),
      });
      setNewNoteBody("");
    } catch {}
    setAddingNote(false);
  };

  const addStaffMember = async () => {
    setAddingStaff(true);
    try {
      const s = await apiCreateContactStaff({ contactId: contact.id, staffType: staffTypes[0], data: { name: "", phone: "", email: "" } });
      setStaff(prev => [...prev, s]);
      setExpandedStaff(s.id);
    } catch {}
    setAddingStaff(false);
  };

  const removeStaffMember = async (id) => {
    if (!await confirmDelete()) return;
    try {
      await apiDeleteContactStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      if (expandedStaff === id) setExpandedStaff(null);
    } catch {}
  };

  const updateStaffType = async (id, staffType) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, staffType } : s));
    try { await apiUpdateContactStaff(id, { staffType }); } catch {}
  };

  const updateStaffField = (staffMember, field, value) => {
    const newData = { ...(staffPendingData.current[staffMember.id] || staffMember.data), [field]: value };
    staffPendingData.current[staffMember.id] = newData;
    setStaff(prev => prev.map(s => s.id === staffMember.id ? { ...s, data: newData } : s));
    if (staffTimers.current[staffMember.id]) clearTimeout(staffTimers.current[staffMember.id]);
    staffTimers.current[staffMember.id] = setTimeout(async () => {
      const dataToSave = staffPendingData.current[staffMember.id];
      delete staffPendingData.current[staffMember.id];
      try { await apiUpdateContactStaff(staffMember.id, { data: dataToSave }); } catch (err) { console.error(err); }
    }, 600);
  };

  return (
    <div className="case-overlay" style={{ left: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
      <div className="login-box" onClick={e => e.stopPropagation()} style={{ width: 600, maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 48px)", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative", padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid var(--c-border)", flexShrink: 0, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <select value={draft.category} onChange={e => { const v = e.target.value; setDraft(p => { const updated = { ...p, category: v }; save(updated); return updated; }); }} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", background: catStyle.bg, color: "#1e293b", border: "1px solid transparent", cursor: "pointer", appearance: "auto" }}>
                {CONTACT_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
              {saving && <span style={{ fontSize: 11, color: "#4CAE72" }}>Saving…</span>}
            </div>
            <input
              value={draft.name}
              onChange={e => set("name", e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--c-text)", fontFamily: "'Inter',sans-serif", width: "100%", padding: 0 }}
            />
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid var(--c-border)" }}>Contact Information</div>
            {contact.category === "Prosecutor" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Office</label>
                <input className="field-input" value={draft.firm || ""} onChange={e => set("firm", e.target.value)} placeholder="District Attorney's Office" />
              </div>
            )}
            {(contact.category === "Adjuster" || contact.category === "Expert") && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Company</label>
                <input className="field-input" value={draft.company || ""} onChange={e => set("company", e.target.value)} placeholder="Company name" />
              </div>
            )}
            {(contact.category === "Court" || contact.category === "Judge") && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>County</label>
                <input className="field-input" value={draft.county || ""} onChange={e => set("county", e.target.value)} placeholder="County name" />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Primary Phone</label>
              <input className="field-input" value={draft.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: "#64748b" }}>Additional Phone Numbers ({phones.length})</label>
                <button onClick={addPhone} style={{ background: "none", border: "none", color: "var(--c-accent, #1e3a5f)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>+ Add Phone</button>
              </div>
              {phones.map(p => (
                <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <select value={p.label} onChange={e => updatePhone(p, "label", e.target.value)} className="field-input" style={{ width: 90, flexShrink: 0, fontSize: 12 }}>
                    {["Cell", "Office", "Home", "Work", "Fax", "Other"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input className="field-input" value={p.number} onChange={e => updatePhone(p, "number", e.target.value)} placeholder="(555) 555-5555" style={{ flex: 1 }} />
                  <button onClick={() => removePhone(p.id)} style={{ background: "none", border: "none", color: "#e05252", fontSize: 14, cursor: "pointer", padding: "0 4px", flexShrink: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Fax</label>
                <input className="field-input" value={draft.fax} onChange={e => set("fax", e.target.value)} placeholder="(555) 555-5555" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Email</label>
                <input className="field-input" value={draft.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Address</label>
                <textarea className="field-input" rows={2} value={draft.address} onChange={e => set("address", e.target.value)} placeholder="Street, City, State ZIP" style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          {hasStaff && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid var(--c-border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>
                  Staff <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b", textTransform: "none", letterSpacing: 0 }}>({staff.length})</span>
                </div>
                <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={addStaffMember} disabled={addingStaff}>
                  {addingStaff ? "Adding…" : "+ Add Staff"}
                </button>
              </div>
              {staff.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No staff members added yet.</div>
              ) : (
                staff.map(s => {
                  const isExp = expandedStaff === s.id;
                  const d = s.data || {};
                  return (
                    <div key={s.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8 }}>
                      <div
                        onClick={() => setExpandedStaff(isExp ? null : s.id)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isExp ? "var(--c-bg2)" : "transparent", borderRadius: isExp ? "8px 8px 0 0" : 8, transition: "background 0.15s" }}
                      >
                        <span style={{ fontSize: 12, color: "var(--c-text2)" }}>{isExp ? "▲" : "▼"}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#1e293b" }}>{s.staffType}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", flex: 1 }}>{d.name || "Unnamed"}</span>
                        {d.phone && <span style={{ fontSize: 11, color: "#64748b" }}>{d.phone}</span>}
                      </div>
                      {isExp && (
                        <div style={{ padding: "14px 14px 10px", borderTop: "1px solid var(--c-border)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Type</label>
                              <select className="field-input" value={s.staffType} onChange={e => updateStaffType(s.id, e.target.value)}>
                                {staffTypes.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Name</label>
                              <input className="field-input" value={d.name || ""} onChange={e => updateStaffField(s, "name", e.target.value)} placeholder="Full name" />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Phone</label>
                              <input className="field-input" value={d.phone || ""} onChange={e => updateStaffField(s, "phone", e.target.value)} placeholder="(555) 555-5555" />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Email</label>
                              <input className="field-input" value={d.email || ""} onChange={e => updateStaffField(s, "email", e.target.value)} placeholder="email@example.com" />
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => removeStaffMember(s.id)} style={{ background: "none", border: "none", color: "#e05252", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Remove Staff</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid var(--c-border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>
                Associated Cases <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b", textTransform: "none", letterSpacing: 0 }}>({assocCases.length})</span>
              </div>
            </div>
            {assocCases.length === 0 && caseLinks.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", marginBottom: 12 }}>No associated cases found.</div>
            )}
            {assocCases.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ textAlign: "left", padding: "4px 8px 8px 0" }}>File Number</th>
                    <th style={{ textAlign: "left", padding: "4px 8px 8px 0" }}>Style</th>
                    <th style={{ textAlign: "left", padding: "4px 8px 8px 0" }}>Status</th>
                    <th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {assocCases.slice(0, 30).map(c => {
                    const link = caseLinks.find(l => l.caseId === c.id);
                    const handleClick = () => { if (onSelectCase) { onClose(); onSelectCase(c); } };
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }} onClick={handleClick}>
                        <td style={{ padding: "7px 8px 7px 0", color: "#5599cc", fontFamily: "monospace", fontSize: 11 }}>{c.caseNum}</td>
                        <td style={{ padding: "7px 8px 7px 0", color: "var(--c-text)" }}>{c.title}</td>
                        <td style={{ padding: "7px 0", color: c.status === "Active" ? "#4CAE72" : "var(--c-text2)", fontWeight: 600 }}>{c.status}</td>
                        <td style={{ padding: "7px 0" }}>
                          {link && <button onClick={e => { e.stopPropagation(); removeCaseLink(link.id); }} style={{ background: "none", border: "none", color: "#e05252", fontSize: 12, cursor: "pointer", padding: 0, lineHeight: 1 }} title="Remove from contact">✕</button>}
                        </td>
                      </tr>
                    );
                  })}
                  {assocCases.length > 30 && <tr><td colSpan={4} style={{ padding: "6px 0", color: "#64748b", fontSize: 11 }}>+ {assocCases.length - 30} more cases</td></tr>}
                </tbody>
              </table>
            )}
            <div style={{ position: "relative" }}>
              <input value={linkSearch} onChange={e => { setLinkSearch(e.target.value); setLinkDropdown(e.target.value.trim().length > 0); }} onFocus={() => { if (linkSearch.trim()) setLinkDropdown(true); }} onBlur={() => setTimeout(() => setLinkDropdown(false), 200)} placeholder="Search to link a case..." className="field-input" style={{ width: "100%", fontSize: 12 }} />
              {linkDropdown && (() => {
                const lower = linkSearch.trim().toLowerCase();
                const existingIds = new Set([...assocCases.map(c => c.id), ...caseLinks.map(l => l.caseId)]);
                const results = (allCases || []).filter(c => !c.deletedAt && !existingIds.has(c.id) && ((c.caseNum || "").toLowerCase().includes(lower) || (c.clientName || "").toLowerCase().includes(lower) || (c.title || "").toLowerCase().includes(lower))).slice(0, 8);
                return results.length > 0 ? (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                    {results.map(c => (
                      <div key={c.id} onMouseDown={e => e.preventDefault()} onClick={() => { addCaseLink(c.id); setLinkSearch(""); setLinkDropdown(false); }} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--c-border)", fontSize: 12 }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ color: "#5599cc", fontFamily: "monospace", fontSize: 11, marginRight: 8 }}>{c.caseNum}</span>
                        <span style={{ color: "var(--c-text)" }}>{c.title}</span>
                        {c.clientName && <span style={{ color: "var(--c-text3)", marginLeft: 6, fontSize: 11 }}>— {c.clientName}</span>}
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid var(--c-border)" }}>
              Notes <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b", textTransform: "none", letterSpacing: 0 }}>({(notes || []).length})</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <select value={newNoteType} onChange={e => setNewNoteType(e.target.value)} className="field-input" style={{ width: "auto", flexShrink: 0 }}>
                  {CONTACT_NOTE_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                </select>
              </div>
              <textarea
                className="field-input"
                rows={3}
                value={newNoteBody}
                onChange={e => setNewNoteBody(e.target.value)}
                placeholder="Add a note…"
                style={{ resize: "vertical", width: "100%" }}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote(); }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button className="btn btn-primary" disabled={!newNoteBody.trim() || addingNote} onClick={submitNote} style={{ fontSize: 12 }}>
                  {addingNote ? "Adding…" : "Add Note"}
                </button>
              </div>
            </div>
            {(notes || []).length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No notes yet.</div>
            ) : (
              (notes || []).map(note => {
                const ts = noteTypeStyle(note.type);
                return (
                  <div key={note.id} className="note-block">
                    <div className="note-head">
                      <span style={{ background: ts.bg, color: ts.color, padding: "1px 7px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>{note.type}</span>
                      <span>{note.authorName}</span>
                      <span>{note.authorRole}</span>
                      <span>{note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}</span>
                      <span style={{ marginLeft: "auto", cursor: "pointer", color: "#64748b", fontSize: 11 }} onClick={() => onDeleteNote(note.id, contact.id)}>Delete</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--c-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note.body}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ padding: "14px 28px", borderTop: "1px solid var(--c-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} style={{ background: "none", border: "none", color: "#e05252", fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 500 }}>Delete Contact</button>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#e05252" }}>Delete?</span>
                <button onClick={() => onDelete(contact.id)} style={{ background: "#e05252", border: "none", color: "#fff", borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>Confirm</button>
                <button onClick={() => setShowDelete(false)} style={{ background: "var(--c-border)", border: "1px solid var(--c-border)", color: "var(--c-text2)", borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={() => save(draft)} style={{ fontSize: 12, padding: "8px 24px" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactMergeModal({ contacts, contactNotes, onMerge, onClose }) {
  const hasAnyFirm = contacts.some(c => c.firm);
  const hasAnyCompany = contacts.some(c => c.company);
  const hasAnyCounty = contacts.some(c => c.county);
  const MERGE_FIELDS = [
    { key: "name",     label: "Name" },
    { key: "category", label: "Category" },
    ...(hasAnyFirm ? [{ key: "firm", label: "Firm" }] : []),
    ...(hasAnyCompany ? [{ key: "company", label: "Company" }] : []),
    ...(hasAnyCounty ? [{ key: "county", label: "County" }] : []),
    { key: "phone",    label: "Phone" },
    { key: "email",    label: "Email" },
    { key: "fax",      label: "Fax" },
    { key: "address",  label: "Address" },
  ];

  // choices[fieldKey] = contactId whose value to use — never ambiguous even when values match
  const initChoices = () => {
    const c = {};
    MERGE_FIELDS.forEach(({ key }) => { c[key] = contacts[0].id; });
    return c;
  };

  const [primaryId, setPrimaryId] = useState(contacts[0].id);
  const [choices, setChoices] = useState(initChoices);
  const [merging, setMerging] = useState(false);

  const handleSetPrimary = (id) => {
    setPrimaryId(id);
    const c = {};
    MERGE_FIELDS.forEach(({ key }) => { c[key] = id; });
    setChoices(c);
  };

  const totalNotes = contacts.reduce((sum, c) => sum + (contactNotes[c.id] || []).length, 0);

  const handleMerge = async () => {
    setMerging(true);
    const fields = {};
    MERGE_FIELDS.forEach(({ key }) => {
      const chosen = contacts.find(c => c.id === choices[key]);
      fields[key] = chosen ? (chosen[key] || "") : "";
    });
    try {
      await onMerge({ primaryId, mergeIds: contacts.filter(c => c.id !== primaryId).map(c => c.id), fields });
    } catch { setMerging(false); }
  };

  return (
    <div className="modal-overlay">
      <div onClick={e => e.stopPropagation()} style={{ width: 700, maxWidth: "calc(100vw - 40px)", maxHeight: "90vh", background: "var(--c-card)", border: "1px solid var(--c-border3)", borderRadius: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--c-border)", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>Merge {contacts.length} Contacts</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 24px", flex: 1, overflowY: "auto" }}>

          {/* Surviving record */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Surviving Record</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Choose which contact's database record is kept. All other records are permanently removed.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {contacts.map(c => {
                const catStyle = CONTACT_CAT_STYLE[c.category] || CONTACT_CAT_STYLE.Miscellaneous;
                const noteCount = (contactNotes[c.id] || []).length;
                const isPrimary = primaryId === c.id;
                return (
                  <div key={c.id} onClick={() => handleSetPrimary(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "9px 14px", borderRadius: 5, background: isPrimary ? "#f1f5f9" : "var(--c-card)", border: `1px solid ${isPrimary ? "#e2e8f0" : "#f1f5f9"}`, transition: "all 0.15s" }}>
                    <input type="radio" name="merge-primary" checked={isPrimary} onChange={() => handleSetPrimary(c.id)} onClick={e => e.stopPropagation()} style={{ flexShrink: 0, cursor: "pointer", width: "auto", padding: 0, border: "none", background: "none" }} />
                    <span style={{ color: isPrimary ? "var(--c-text)" : "var(--c-text2)", fontWeight: isPrimary ? 600 : 400, flex: 1, fontSize: 14 }}>{c.name}</span>
                    <span style={{ padding: "1px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: catStyle.bg, color: "#1e293b" }}>{c.category}</span>
                    {noteCount > 0 && <span style={{ fontSize: 11, color: "#64748b" }}>{noteCount} note{noteCount !== 1 ? "s" : ""}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Field-by-field chooser */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Choose Field Values</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Click a cell to choose that contact's value for each field.</div>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--c-border)", borderRadius: 5, overflow: "hidden", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "var(--c-card)", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ width: 90, padding: "9px 10px", textAlign: "left", fontWeight: 400 }}></th>
                  {contacts.map(c => (
                    <th key={c.id} style={{ padding: "9px 14px", textAlign: "left", fontSize: 13, fontWeight: 700, color: c.id === primaryId ? "#f59e0b" : "var(--c-text2)", borderLeft: "1px solid var(--c-border)", wordBreak: "break-word", letterSpacing: "normal", textTransform: "none" }}>
                      {c.name}{c.id === primaryId ? " ★" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MERGE_FIELDS.map(({ key, label: fLabel }) => {
                  const allSame = contacts.every(c => (c[key] || "") === (contacts[0][key] || ""));
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid #ffffff" }}>
                      <td style={{ padding: "11px 10px", background: "var(--c-hover)", borderRight: "1px solid var(--c-border)", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        {fLabel}
                      </td>
                      {allSame ? (
                        <td colSpan={contacts.length} style={{ padding: "11px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 4, background: "#dcfce7", color: "#1e293b", fontSize: 13 }}>
                            <span>✓</span>
                            <span style={{ fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>
                              {contacts[0][key] || <em style={{ color: "#64748b", fontStyle: "italic" }}>empty on all</em>}
                            </span>
                          </div>
                        </td>
                      ) : contacts.map(c => {
                        const val = c[key] || "";
                        const isChosen = choices[key] === c.id;
                        return (
                          <td
                            key={c.id}
                            onClick={() => setChoices(p => ({ ...p, [key]: c.id }))}
                            style={{ padding: "11px 14px", borderLeft: "1px solid #f1f5f9", cursor: "pointer", background: isChosen ? "#f1f5f9" : "transparent", verticalAlign: "middle", transition: "background 0.1s" }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <input
                                type="radio"
                                name={`mfc-${key}`}
                                checked={isChosen}
                                onChange={() => setChoices(p => ({ ...p, [key]: c.id }))}
                                onClick={e => e.stopPropagation()}
                                style={{ marginTop: 2, flexShrink: 0, cursor: "pointer", width: "auto", padding: 0, border: "none", background: "none" }}
                              />
                              {val ? (
                                <span style={{ color: isChosen ? "var(--c-text)" : "var(--c-text2)", fontSize: 13, wordBreak: "break-word", lineHeight: 1.5, fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{val}</span>
                              ) : (
                                <span style={{ color: "var(--c-border)", fontSize: 12, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>empty</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes notice */}
          {totalNotes > 0 && (
            <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 4, padding: "10px 14px", fontSize: 12, color: "#4CAE72" }}>
              {totalNotes} note{totalNotes !== 1 ? "s" : ""} across all selected contacts will be automatically combined onto the surviving record.
            </div>
          )}

          {/* Warning */}
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "10px 14px", fontSize: 12, color: "#cc4444" }}>
            This action is permanent. Non-surviving contacts will be hard-deleted and cannot be recovered.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 24px 20px", borderTop: "1px solid var(--c-border)", flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            onClick={handleMerge}
            disabled={merging}
            style={{ background: "#f59e0b", color: "var(--c-card)", border: "none", borderRadius: 4, padding: "8px 20px", fontWeight: 700, fontSize: 13, cursor: merging ? "not-allowed" : "pointer", opacity: merging ? 0.6 : 1 }}
          >
            {merging ? "Merging…" : `Merge ${contacts.length} Contacts`}
          </button>
        </div>
      </div>
    </div>
  );
}


function ContactsView({ currentUser, allCases, onOpenCase, onMenuToggle, confirmDelete, msStatus }) {
  const [contacts, setContacts] = useState(null);
  const [deletedContacts, setDeletedContacts] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactNotes, setContactNotes] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelected, setMergeSelected] = useState(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [contactCaseCounts, setContactCaseCounts] = useState({});
  const [pinnedContactIds, setPinnedContactIds] = useState(() => currentUser?.preferences?.pinnedContacts || []);
  const [showOutlookImport, setShowOutlookImport] = useState(false);
  const [outlookContacts, setOutlookContacts] = useState([]);
  const [outlookImportLoading, setOutlookImportLoading] = useState(false);
  const [outlookImportSelected, setOutlookImportSelected] = useState(new Set());
  const [outlookImportCategory, setOutlookImportCategory] = useState("Miscellaneous");
  const [outlookFieldMap, setOutlookFieldMap] = useState({ name: "name", email: "email", phone: "phone", company: "company", address: "address" });
  const [showOutlookExport, setShowOutlookExport] = useState(false);
  const [outlookExportSelected, setOutlookExportSelected] = useState(new Set());
  const [outlookExportBusy, setOutlookExportBusy] = useState(false);
  const [pinnedContactsExpanded, setPinnedContactsExpanded] = useState(true);
  const saveContactPins = (next) => { setPinnedContactIds(next); apiSavePreferences({ pinnedContacts: next }).catch(() => {}); };
  const togglePinContact = (id) => { const next = pinnedContactIds.includes(id) ? pinnedContactIds.filter(x => x !== id) : [...pinnedContactIds, id]; saveContactPins(next); };

  useEffect(() => {
    apiGetContacts().then(data => { setContacts(data); setLoading(false); }).catch(() => setLoading(false));
    apiGetContactCaseCounts().then(setContactCaseCounts).catch(() => {});
  }, []);

  useEffect(() => {
    if (categoryFilter !== "Deleted") return;
    if (deletedContacts !== null) return;
    apiGetDeletedContacts().then(setDeletedContacts).catch(console.error);
  }, [categoryFilter, deletedContacts]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectContact = async (c) => {
    setSelectedContact(c);
    if (!contactNotes[c.id]) {
      try {
        const notes = await apiGetContactNotes(c.id);
        setContactNotes(p => ({ ...p, [c.id]: notes }));
      } catch {}
    }
  };

  const handleUpdateContact = async (updated) => {
    try {
      const saved = await apiUpdateContact(updated.id, updated);
      setContacts(p => p ? p.map(c => c.id === saved.id ? saved : c) : p);
      setSelectedContact(saved);
    } catch (err) { alert("Failed to save: " + err.message); }
  };

  const handleDeleteContact = async (id) => {
    try {
      const deleted = await apiDeleteContact(id);
      setContacts(p => p ? p.filter(c => c.id !== id) : p);
      setDeletedContacts(p => p ? [deleted, ...p] : [deleted]);
      setSelectedContact(null);
    } catch (err) { alert("Failed to delete: " + err.message); }
  };

  const handleRestoreContact = async (id) => {
    try {
      const restored = await apiRestoreContact(id);
      setDeletedContacts(p => p ? p.filter(c => c.id !== id) : null);
      setContacts(p => p ? [...p, restored].sort((a, b) => a.name.localeCompare(b.name)) : [restored]);
    } catch (err) { alert("Failed to restore: " + err.message); }
  };

  const handleCreateContact = async (data) => {
    try {
      const saved = await apiCreateContact(data);
      setContacts(p => [...(p || []), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setShowNew(false);
      handleSelectContact(saved);
      return saved;
    } catch (err) { alert("Failed to create contact: " + err.message); }
  };

  const toggleMergeMode = () => {
    setMergeMode(m => !m);
    setMergeSelected(new Set());
    setSelectedContact(null);
  };

  const toggleMergeSelect = (id) => {
    setMergeSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleMerge = async ({ primaryId, mergeIds, fields }) => {
    try {
      const merged = await apiMergeContacts({ primaryId, mergeIds, fields });
      setContacts(p => {
        const without = (p || []).filter(c => c.id !== primaryId && !mergeIds.includes(c.id));
        return [...without, merged].sort((a, b) => a.name.localeCompare(b.name));
      });
      setContactNotes(p => {
        const combined = [...(p[primaryId] || []), ...mergeIds.flatMap(id => p[id] || [])];
        const next = { ...p, [merged.id]: combined };
        mergeIds.forEach(id => delete next[id]);
        return next;
      });
      setShowMergeModal(false);
      setMergeMode(false);
      setMergeSelected(new Set());
    } catch (err) { alert("Merge failed: " + err.message); }
  };

  const handleAddNote = async (contactId, noteData) => {
    const saved = await apiCreateContactNote({ ...noteData, contactId });
    setContactNotes(p => ({ ...p, [contactId]: [saved, ...(p[contactId] || [])] }));
  };

  const handleDeleteNote = async (noteId, contactId) => {
    try {
      await apiDeleteContactNote(noteId);
      setContactNotes(p => ({ ...p, [contactId]: (p[contactId] || []).filter(n => n.id !== noteId) }));
    } catch (err) { alert("Failed to delete note: " + err.message); }
  };

  const isDeleted = categoryFilter === "Deleted";
  const list = isDeleted ? (deletedContacts || []) : (contacts || []);

  const filtered = list.filter(c => {
    if (!isDeleted && categoryFilter !== "All" && c.category !== categoryFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.phone.toLowerCase().includes(search.toLowerCase()) &&
        !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {};
  (contacts || []).forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });

  const daysLeft = (deletedAt) => {
    if (!deletedAt) return null;
    const diff = 30 - Math.floor((Date.now() - new Date(deletedAt)) / 86400000);
    return Math.max(0, diff);
  };

  const tabs = [
    { id: "All",              label: `All (${(contacts || []).length})` },
    { id: "Client",           label: `Clients (${counts.Client || 0})` },
    { id: "Insurance Adjuster", label: `Adjusters (${counts["Insurance Adjuster"] || 0})` },
    { id: "Insurance Company", label: `Insurers (${counts["Insurance Company"] || 0})` },
    { id: "Medical Provider", label: `Medical (${counts["Medical Provider"] || 0})` },
    { id: "Defense Attorney", label: `Defense Atty (${counts["Defense Attorney"] || 0})` },
    { id: "Judge",            label: `Judges (${counts.Judge || 0})` },
    { id: "Court",            label: `Courts (${counts.Court || 0})` },
    { id: "Witness",          label: `Witnesses (${counts.Witness || 0})` },
    { id: "Expert",           label: `Experts (${counts.Expert || 0})` },
    { id: "Lienholder",       label: `Lienholders (${counts.Lienholder || 0})` },
    { id: "Family Member",    label: `Family (${counts["Family Member"] || 0})` },
    { id: "Miscellaneous",    label: `Misc (${counts.Miscellaneous || 0})` },
    { id: "Deleted",          label: `Deleted (${(deletedContacts || []).length})`, red: true },
  ];

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Contacts</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{loading ? "Loading…" : `${(contacts || []).length} contacts across ${CONTACT_CATEGORIES.length} categories`}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search contacts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="!pl-9 !pr-3 !py-2 !text-sm !border !border-slate-200 dark:!border-slate-700 !rounded-lg !bg-white dark:!bg-slate-800 !text-slate-700 dark:!text-slate-300 focus:!ring-2 focus:!ring-amber-500/30 focus:!border-amber-500 !w-[220px]"
            />
          </div>
          {isAppAdmin(currentUser) && !isDeleted && (
            <button
              onClick={toggleMergeMode}
              style={{ background: mergeMode ? "#f59e0b" : "var(--c-border)", color: mergeMode ? "var(--c-card)" : "var(--c-text2)", border: `1px solid ${mergeMode ? "#f59e0b" : "var(--c-border)"}`, borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}
            >
              {mergeMode ? "Cancel Merge" : "Merge Contacts"}
            </button>
          )}
          {!mergeMode && msStatus?.connected && !isDeleted && (
            <>
              <button className="btn btn-outline btn-sm" style={{ fontSize: 12 }} onClick={async () => {
                setShowOutlookImport(true);
                setOutlookImportLoading(true);
                try { const oc = await apiGetOutlookContacts(); setOutlookContacts(oc); } catch (err) { alert("Failed to load Outlook contacts: " + err.message); }
                setOutlookImportLoading(false);
              }}>📨 Import from Outlook</button>
              <button className="btn btn-outline btn-sm" style={{ fontSize: 12 }} onClick={() => { setShowOutlookExport(true); setOutlookExportSelected(new Set()); }}>📤 Export to Outlook</button>
            </>
          )}
          {!mergeMode && <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Contact</button>}
        </div>
      </div>

      {showOutlookImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowOutlookImport(false)}>
          <div style={{ background: "var(--c-card)", borderRadius: 12, width: "90%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>📨 Import Contacts from Outlook</div>
              <button onClick={() => setShowOutlookImport(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--c-border)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Import as:</label>
              <select value={outlookImportCategory} onChange={e => setOutlookImportCategory(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
                {CONTACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-sm" style={{ fontSize: 11, marginLeft: "auto" }} onClick={() => {
                if (outlookImportSelected.size === outlookContacts.length) setOutlookImportSelected(new Set());
                else setOutlookImportSelected(new Set(outlookContacts.map((_, i) => i)));
              }}>{outlookImportSelected.size === outlookContacts.length ? "Deselect All" : "Select All"}</button>
            </div>
            <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--c-border)", background: "#f8fafc" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Field Mapping (Outlook → MattrMindr)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 16px" }}>
                {[
                  { outlookField: "name", label: "Display Name", targets: ["name", "(skip)"] },
                  { outlookField: "email", label: "Email", targets: ["email", "phone", "(skip)"] },
                  { outlookField: "phone", label: "Phone", targets: ["phone", "email", "(skip)"] },
                  { outlookField: "company", label: "Company", targets: ["company", "firm", "(skip)"] },
                  { outlookField: "address", label: "Address", targets: ["address", "(skip)"] },
                ].map(f => (
                  <div key={f.outlookField} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748b", width: 70, flexShrink: 0 }}>{f.label} →</span>
                    <select value={outlookFieldMap[f.outlookField] || f.outlookField} onChange={e => setOutlookFieldMap(prev => ({ ...prev, [f.outlookField]: e.target.value }))} style={{ fontSize: 11, padding: "2px 4px", flex: 1 }}>
                      {f.targets.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
              {outlookImportLoading && <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading Outlook contacts...</div>}
              {!outlookImportLoading && outlookContacts.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No contacts found in your Outlook account.</div>}
              {!outlookImportLoading && outlookContacts.map((c, i) => (
                <div key={i} onClick={() => setOutlookImportSelected(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                  style={{ padding: "10px 20px", borderBottom: "1px solid var(--c-border2)", cursor: "pointer", display: "flex", gap: 10, alignItems: "center", background: outlookImportSelected.has(i) ? "#eff6ff" : "transparent" }}>
                  <input type="checkbox" checked={outlookImportSelected.has(i)} readOnly style={{ accentColor: "#0078d4" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{[c.email, c.phone, c.company].filter(Boolean).join(" · ")}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{outlookImportSelected.size} selected</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowOutlookImport(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" disabled={outlookImportSelected.size === 0} onClick={async () => {
                  const toImport = [...outlookImportSelected].map(i => {
                    const oc = outlookContacts[i];
                    const mapped = {};
                    Object.entries(outlookFieldMap).forEach(([src, dest]) => {
                      if (dest !== "(skip)" && oc[src]) mapped[dest] = oc[src];
                    });
                    if (!mapped.name) mapped.name = oc.name;
                    return mapped;
                  });
                  try {
                    const r = await apiImportOutlookContacts(toImport, outlookImportCategory);
                    alert(`Imported ${r.imported} contact${r.imported !== 1 ? "s" : ""}${r.skipped ? ` (${r.skipped} skipped — duplicates)` : ""}.`);
                    setShowOutlookImport(false);
                    apiGetContacts().then(setContacts).catch(() => {});
                  } catch (err) { alert("Import failed: " + err.message); }
                }}>Import {outlookImportSelected.size} Contact{outlookImportSelected.size !== 1 ? "s" : ""}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOutlookExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowOutlookExport(false)}>
          <div style={{ background: "var(--c-card)", borderRadius: 12, width: "90%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>📤 Export Contacts to Outlook</div>
              <button onClick={() => setShowOutlookExport(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid var(--c-border)", display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => {
                if (outlookExportSelected.size === filtered.length) setOutlookExportSelected(new Set());
                else setOutlookExportSelected(new Set(filtered.map(c => c.id)));
              }}>{outlookExportSelected.size === filtered.length ? "Deselect All" : "Select All"}</button>
              <span style={{ fontSize: 12, color: "#64748b" }}>Showing {filtered.length} contacts ({categoryFilter})</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setOutlookExportSelected(prev => { const n = new Set(prev); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                  style={{ padding: "10px 20px", borderBottom: "1px solid var(--c-border2)", cursor: "pointer", display: "flex", gap: 10, alignItems: "center", background: outlookExportSelected.has(c.id) ? "#eff6ff" : "transparent" }}>
                  <input type="checkbox" checked={outlookExportSelected.has(c.id)} readOnly style={{ accentColor: "#0078d4" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{[c.category, c.email, c.phone].filter(Boolean).join(" · ")}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{outlookExportSelected.size} selected</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowOutlookExport(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" disabled={outlookExportSelected.size === 0 || outlookExportBusy} onClick={async () => {
                  setOutlookExportBusy(true);
                  try {
                    const r = await apiExportContactsToOutlook([...outlookExportSelected]);
                    alert(`Exported ${r.exported} contact${r.exported !== 1 ? "s" : ""} to Outlook${r.errors ? ` (${r.errors} error${r.errors !== 1 ? "s" : ""})` : ""}.`);
                    setShowOutlookExport(false);
                  } catch (err) { alert("Export failed: " + err.message); }
                  setOutlookExportBusy(false);
                }}>{outlookExportBusy ? "Exporting..." : `Export ${outlookExportSelected.size} Contact${outlookExportSelected.size !== 1 ? "s" : ""}`}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content" style={{ paddingTop: 0 }}>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--c-border)", marginBottom: 20, overflowX: "auto" }}>
          {tabs.map(t => (
            <div
              key={t.id}
              onClick={() => setCategoryFilter(t.id)}
              style={{
                padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                borderBottom: categoryFilter === t.id ? `2px solid ${t.red ? "#e05252" : "#f59e0b"}` : "2px solid transparent",
                color: categoryFilter === t.id ? (t.red ? "#e05252" : "#f59e0b") : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* Deleted contacts table */}
        {isDeleted && (
          <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--c-border)" }}>
                <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600 }}>Category</th>
                <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600 }}>Name</th>
                <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600 }}>Deleted</th>
                <th style={{ textAlign: "left", padding: "6px 0", fontWeight: 600 }}>Days Remaining</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(deletedContacts === null) ? (
                <tr><td colSpan={5} style={{ padding: 20, color: "#64748b", textAlign: "center" }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 20, color: "#64748b", textAlign: "center" }}>No deleted contacts.</td></tr>
              ) : filtered.map(c => {
                const days = daysLeft(c.deletedAt);
                const catStyle = CONTACT_CAT_STYLE[c.category] || CONTACT_CAT_STYLE.Miscellaneous;
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #ffffff" }}>
                    <td data-label="Category" style={{ padding: "10px 12px 10px 0" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: catStyle.bg, color: catStyle.color }}>{c.category}</span>
                    </td>
                    <td data-label="Name" style={{ padding: "10px 12px 10px 0", color: "var(--c-text)" }}>{c.name}</td>
                    <td data-label="Deleted" style={{ padding: "10px 12px 10px 0", color: "#64748b" }}>{c.deletedAt ? new Date(c.deletedAt).toLocaleDateString() : ""}</td>
                    <td data-label="Remaining" style={{ padding: "10px 12px 10px 0", color: days <= 7 ? "#e05252" : "var(--c-text2)", fontWeight: days <= 7 ? 700 : 400 }}>{days} days</td>
                    <td data-label="" style={{ padding: "10px 0", textAlign: "right" }}>
                      <button onClick={() => handleRestoreContact(c.id)} style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#4CAE72", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Restore</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Active contacts table */}
        {!isDeleted && (
          <>
            {(() => {
              const pinnedContacts = !mergeMode && pinnedContactIds.length > 0 ? pinnedContactIds.map(id => (contacts || []).find(c => c.id === id)).filter(Boolean) : [];
              return pinnedContacts.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setPinnedContactsExpanded(p => !p)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Pin size={14} className="text-red-500" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text-h)" }}>Pinned Contacts</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>({pinnedContacts.length})</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{pinnedContactsExpanded ? "▼" : "▶"}</span>
                  </div>
                  {pinnedContactsExpanded && (
                    <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {pinnedContacts.map(c => {
                          const catStyle = CONTACT_CAT_STYLE[c.category] || CONTACT_CAT_STYLE.Miscellaneous;
                          const caseCount = c.category === "Client" ? allCases.filter(a => a.clientName === c.name && !a.deletedAt).length
                                          : c.category === "Judge" ? allCases.filter(a => a.judge === c.name && !a.deletedAt).length
                                          : (contactCaseCounts[c.id] || 0);
                          return (
                            <tr key={c.id} onClick={() => handleSelectContact(c)} style={{ borderBottom: "1px solid var(--c-border2)", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                              <td style={{ width: 30, padding: "10px 4px 10px 10px" }}>
                                <button onClick={e => { e.stopPropagation(); togglePinContact(c.id); }} title="Unpin" className="bg-transparent border-none cursor-pointer p-0 leading-none"><Pin size={14} className="text-red-500" /></button>
                              </td>
                              <td data-label="Category" style={{ padding: "10px 12px 10px 0" }}>
                                <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: catStyle.bg, color: "#1e293b" }}>{c.category}</span>
                              </td>
                              <td data-label="Name" style={{ padding: "10px 12px 10px 0", color: "var(--c-text)", fontWeight: 500 }}>{c.name}</td>
                              <td data-label="Phone" className="hide-mobile" style={{ padding: "10px 12px 10px 0", color: "var(--c-text2)", fontFamily: "monospace", fontSize: 12 }}>{c.phone || <span style={{ color: "var(--c-border)" }}>—</span>}</td>
                              <td data-label="Email" className="hide-mobile" style={{ padding: "10px 12px 10px 0", color: "#2563eb", fontSize: 12, wordBreak: "break-all" }}>{c.email || <span style={{ color: "var(--c-border)" }}>—</span>}</td>
                              <td data-label="Cases" style={{ padding: "10px 0", color: caseCount > 0 ? "#f59e0b" : "var(--c-border)", fontWeight: caseCount > 0 ? 600 : 400 }}>{caseCount > 0 ? caseCount : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })()}
            {mergeMode && (
              <div style={{ position: "sticky", top: 0, zIndex: 12, marginBottom: 0, padding: "10px 14px", background: "#dcfce7", border: "1px solid #bbf7d0", borderBottom: "none", borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", gap: 14, fontSize: 13 }}>
                <span style={{ color: "#4CAE72" }}>Select 2 or more contacts to merge.</span>
                {mergeSelected.size >= 2 && (
                  <button
                    onClick={async () => {
                      const selected = [...mergeSelected];
                      const toLoad = selected.filter(id => !contactNotes[id]);
                      if (toLoad.length > 0) {
                        await Promise.all(toLoad.map(id => apiGetContactNotes(id).then(notes => setContactNotes(p => ({ ...p, [id]: notes }))).catch(() => {})));
                      }
                      setShowMergeModal(true);
                    }}
                    style={{ background: "#f59e0b", color: "var(--c-card)", border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                  >
                    Merge Selected ({mergeSelected.size})
                  </button>
                )}
                <span style={{ color: "#64748b", fontSize: 12 }}>{mergeSelected.size} selected</span>
              </div>
            )}
            <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {mergeMode && <th style={{ width: 32, padding: "6px 8px 6px 0", position: "sticky", top: mergeMode ? 44 : 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}></th>}
                  {!mergeMode && <th style={{ width: 30, padding: "6px 4px 6px 0", position: "sticky", top: 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}></th>}
                  <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600, position: "sticky", top: mergeMode ? 44 : 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600, position: "sticky", top: mergeMode ? 44 : 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}>Name</th>
                  <th className="hide-mobile" style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600, position: "sticky", top: mergeMode ? 44 : 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}>Phone</th>
                  <th className="hide-mobile" style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 600, position: "sticky", top: mergeMode ? 44 : 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "6px 0", fontWeight: 600, position: "sticky", top: mergeMode ? 44 : 0, background: "var(--c-bg)", zIndex: 11, borderBottom: "1px solid var(--c-border)" }}>Cases</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={mergeMode ? 7 : 7} style={{ padding: 30, color: "#64748b", textAlign: "center" }}>Loading contacts…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={mergeMode ? 7 : 7} style={{ padding: 30, color: "#64748b", textAlign: "center" }}>
                    {search ? "No contacts match your search." : "No contacts in this category yet."}
                  </td></tr>
                ) : filtered.map(c => {
                  const catStyle = CONTACT_CAT_STYLE[c.category] || CONTACT_CAT_STYLE.Miscellaneous;
                  const caseCount = c.category === "Client"   ? allCases.filter(a => a.clientName === c.name && !a.deletedAt).length
                                  : c.category === "Judge"    ? allCases.filter(a => a.judge === c.name && !a.deletedAt).length
                                  : (contactCaseCounts[c.id] || 0);
                  const isChecked = mergeSelected.has(c.id);
                  const isPinned = pinnedContactIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => mergeMode ? toggleMergeSelect(c.id) : handleSelectContact(c)}
                      style={{ borderBottom: "1px solid #ffffff", cursor: "pointer", transition: "background 0.1s", background: isChecked ? "#f1f5f9" : "" }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = "var(--c-card)"; }}
                      onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = ""; }}
                    >
                      {mergeMode && (
                        <td data-label="" style={{ padding: "10px 8px 10px 0" }}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleMergeSelect(c.id)} onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, cursor: "pointer" }} />
                        </td>
                      )}
                      {!mergeMode && (
                        <td data-label="" style={{ padding: "10px 4px 10px 0", width: 30 }}>
                          <button onClick={e => { e.stopPropagation(); togglePinContact(c.id); }} title={isPinned ? "Unpin" : "Pin"} className={`bg-transparent border-none cursor-pointer p-0 leading-none transition-opacity ${isPinned ? "opacity-100" : "opacity-30 hover:opacity-100"}`}><Pin size={14} className={isPinned ? "text-red-500" : "text-slate-300 dark:text-slate-600"} /></button>
                        </td>
                      )}
                      <td data-label="Category" style={{ padding: "10px 12px 10px 0" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: catStyle.bg, color: "#1e293b" }}>
                          {c.category}
                        </span>
                      </td>
                      <td data-label="Name" style={{ padding: "10px 12px 10px 0", color: "var(--c-text)", fontWeight: 500 }}>{c.name}</td>
                      <td data-label="Phone" className="hide-mobile" style={{ padding: "10px 12px 10px 0", color: "var(--c-text2)", fontFamily: "monospace", fontSize: 12 }}>{c.phone || <span style={{ color: "var(--c-border)" }}>—</span>}</td>
                      <td data-label="Email" className="hide-mobile" style={{ padding: "10px 12px 10px 0", color: "#2563eb", fontSize: 12, wordBreak: "break-all" }}>{c.email || <span style={{ color: "var(--c-border)" }}>—</span>}</td>
                      <td data-label="Cases" style={{ padding: "10px 0", color: caseCount > 0 ? "#f59e0b" : "var(--c-border)", fontWeight: caseCount > 0 ? 600 : 400 }}>
                        {caseCount > 0 ? caseCount : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {selectedContact && (
        <ContactDetailOverlay
          contact={selectedContact}
          currentUser={currentUser}
          notes={contactNotes[selectedContact.id]}
          allCases={allCases}
          onClose={() => setSelectedContact(null)}
          onUpdate={handleUpdateContact}
          onDelete={handleDeleteContact}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onSelectCase={onOpenCase}
          confirmDelete={confirmDelete}
        />
      )}
      {showNew && <NewContactModal onSave={handleCreateContact} onClose={() => setShowNew(false)} />}
      {showMergeModal && mergeSelected.size >= 2 && (
        <ContactMergeModal
          contacts={(contacts || []).filter(c => mergeSelected.has(c.id))}
          contactNotes={contactNotes}
          onMerge={handleMerge}
          onClose={() => setShowMergeModal(false)}
        />
      )}
    </>
  );
}


export default ContactsView;
