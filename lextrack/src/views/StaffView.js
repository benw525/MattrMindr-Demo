import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Menu, Pin } from "lucide-react";
import {
  apiCreateUser,
  apiDeleteUser,
  apiRestoreUser,
  apiUpdateUserRoles,
  apiUpdateUser,
  apiSavePreferences,
  apiSendTempPassword,
} from "../api.js";
import {
  STAFF_ROLES,
  isAppAdmin,
  Badge,
  USERS,
  makeInitials,
  pickAvatar,
} from "../shared.js";
function EditContactModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    cell: user.cell || "",
    ext: user.ext || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const saved = await onSave(user.id, { ...form, name: form.name.trim() });
      onClose(saved);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Edit Contact Info</div>
        <div className="modal-sub">{user.name} · {(user.roles && user.roles.length ? user.roles : [user.role]).join(", ")}</div>

        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => set("name", e.target.value)} autoFocus /></div>
        <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="name@firm.com" /></div>
        <div className="form-group"><label>Extension</label><input value={form.ext} onChange={e => set("ext", e.target.value)} placeholder="e.g. 312" /></div>
        <div className="form-row">
          <div className="form-group"><label>Direct Line</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(251) 278-0000" /></div>
          <div className="form-group"><label>Cell</label><input value={form.cell} onChange={e => set("cell", e.target.value)} placeholder="(251) 404-0000" /></div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => onClose(null)}>Cancel</button>
          <button className="btn btn-gold" disabled={!form.name.trim() || busy} onClick={handleSave}>
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStaffModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", roles: ["Trial Attorney"], email: "", phone: "", cell: "", ext: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleRole = r => {
    const c = form.roles;
    const next = c.includes(r) ? c.filter(x => x !== r) : [...c, r];
    if (next.length > 0) set("roles", next);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.roles.length === 0) return;
    setBusy(true);
    try {
      const initials = makeInitials(form.name);
      const avatar = pickAvatar(form.name);
      const email = form.email.trim() || `${form.name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "")}@firm.com`;
      const role = form.roles[0];
      const saved = await onSave({ ...form, name: form.name.trim(), role, initials, avatar, email });
      onClose(saved);
    } catch (err) {
      alert("Failed to add staff: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Add Staff Member</div>
        <div className="modal-sub">A temporary password will be emailed to the new staff member.</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Role(s) *</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STAFF_ROLES.map(r => {
              const checked = form.roles.includes(r);
              return (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, color: checked ? "#f59e0b" : "#64748b", userSelect: "none" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleRole(r)} />
                  {r}
                </label>
              );
            })}
          </div>
        </div>

        <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Jane Smith" autoFocus /></div>
        <div className="form-group"><label>Extension</label><input value={form.ext} onChange={e => set("ext", e.target.value)} placeholder="e.g. 312" /></div>
        <div className="form-group"><label>Email</label><input value={form.email} onChange={e => set("email", e.target.value)} placeholder="auto-generated if blank" /></div>
        <div className="form-row">
          <div className="form-group"><label>Direct Line</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(251) 278-0000" /></div>
          <div className="form-group"><label>Cell</label><input value={form.cell} onChange={e => set("cell", e.target.value)} placeholder="(251) 404-0000" /></div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => onClose(null)}>Cancel</button>
          <button className="btn btn-gold" disabled={!form.name.trim() || form.roles.length === 0 || busy} onClick={handleSave}>
            {busy ? "Adding…" : "Add Staff Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
const CASE_FIELD_MAP = [
  { key: "title", label: "Case Title" },
  { key: "caseNum", label: "File Number" },
  { key: "courtCaseNumber", label: "Case Number" },
  { key: "clientName", label: "Client Name" },
  { key: "caseType", label: "Case Type" },
  { key: "injuryType", label: "Injury Type" },
  { key: "stateJurisdiction", label: "State" },
  { key: "county", label: "County" },
  { key: "court", label: "Court" },
  { key: "judge", label: "Judge" },
  { key: "status", label: "Status" },
  { key: "stage", label: "Stage" },
  { key: "dispositionType", label: "Disposition" },
  { key: "accidentDate", label: "Accident Date" },
  { key: "statuteOfLimitationsDate", label: "SOL Date" },
  { key: "nextCourtDate", label: "Next Court Date" },
  { key: "trialDate", label: "Trial Date" },
  { key: "dispositionDate", label: "Disposition Date" },
  { key: "caseValueEstimate", label: "Case Value" },
  { key: "demandAmount", label: "Demand Amount" },
  { key: "settlementAmount", label: "Settlement Amount" },
  { key: "contingencyFeePct", label: "Contingency %" },
  { key: "_assignedAttorneyName", label: "Assigned Attorney Name" },
  { key: "_secondAttorneyName", label: "2nd Attorney Name" },
  { key: "_caseManagerName", label: "Case Manager Name" },
  { key: "_investigatorName", label: "Investigator Name" },
  { key: "_paralegalName", label: "Paralegal Name" },
  { key: "_todayDate", label: "Today's Date" },
];


function StaffView({ allCases, currentUser, setCurrentUser, allUsers, setAllUsers, onMenuToggle, confirmDelete }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const canAdmin = isAppAdmin(currentUser);
  const [roleFilter, setRoleFilter] = useState("All");
  const [pinnedIds, setPinnedIds] = useState(() => currentUser?.preferences?.pinnedStaff || []);
  const [pinnedExpanded, setPinnedExpanded] = useState(true);

  const [allStaffExpanded, setAllStaffExpanded] = useState(true);

  const savePins = (next) => { setPinnedIds(next); apiSavePreferences({ pinnedStaff: next }).catch(() => {}); };
  const togglePin = (id) => { const next = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [...pinnedIds, id]; savePins(next); };

  const activeUsers = allUsers.filter(u => !u.deletedAt);
  const deletedUsers = allUsers.filter(u => u.deletedAt);
  const filteredStaff = roleFilter === "All" ? activeUsers : activeUsers.filter(u => (u.roles && u.roles.length ? u.roles : [u.role]).includes(roleFilter));
  const pinnedStaff = filteredStaff.filter(u => pinnedIds.includes(u.id));
  const [showDeletedStaff, setShowDeletedStaff] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [colCount, setColCount] = useState(3);
  const allGridRef = useRef(null);
  const pinnedGridRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      const el = allGridRef.current || pinnedGridRef.current;
      if (!el) return;
      const cols = getComputedStyle(el).gridTemplateColumns.split(" ").length;
      setColCount(cols);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (allGridRef.current) ro.observe(allGridRef.current);
    if (pinnedGridRef.current) ro.observe(pinnedGridRef.current);
    return () => ro.disconnect();
  });

  const isRowExpanded = (section, index) => expandedRow && expandedRow.section === section && expandedRow.row === Math.floor(index / colCount);
  const toggleRow = (section, index) => {
    const row = Math.floor(index / colCount);
    setExpandedRow(prev => prev && prev.section === section && prev.row === row ? null : { section, row });
  };

  const handleAddStaff = async (formData) => {
    const saved = await apiCreateUser(formData);
    const newUser = { ...saved, offices: saved.offices || [] };
    USERS.push(newUser);
    setAllUsers(prev => [...prev, newUser]);
    try {
      await apiSendTempPassword(saved.id);
    } catch (e) {
      console.error("Failed to send temp password:", e);
    }
    return newUser;
  };

  const handleDeleteStaff = async (userId) => {
    try {
      await apiDeleteUser(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, deletedAt: new Date().toISOString() } : u));
      setConfirmDeleteId(null);
      setExpandedRow(null);
    } catch (err) {
      alert("Failed to remove staff: " + err.message);
    }
  };

  const handleRestoreStaff = async (userId) => {
    try {
      const restored = await apiRestoreUser(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...restored, deletedAt: null } : u));
      const existing = USERS.find(u => u.id === userId);
      if (!existing) {
        USERS.push({ ...restored, deletedAt: null });
      }
    } catch (err) {
      alert("Failed to restore staff: " + err.message);
    }
  };

  const handleToggleRole = async (userId, role, currentRoles) => {
    const next = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    if (next.length === 0) return;
    try {
      const updated = await apiUpdateUserRoles(userId, next);
      const merged = { roles: updated.roles, role: updated.role };
      USERS.forEach(u => { if (u.id === userId) Object.assign(u, merged); });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...merged } : u));
    } catch (err) {
      alert("Failed to update roles: " + err.message);
    }
  };

  const handleEditStaff = async (userId, data) => {
    const updated = await apiUpdateUser(userId, data);
    USERS.forEach(u => { if (u.id === userId) Object.assign(u, updated); });
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
    if (userId === currentUser.id) setCurrentUser(prev => ({ ...prev, ...updated }));
    return updated;
  };

  return (
    <>
      {showAddModal && (
        <AddStaffModal
          onSave={handleAddStaff}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingUser && (
        <EditContactModal
          user={editingUser}
          onSave={handleEditStaff}
          onClose={() => setEditingUser(null)}
        />
      )}
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Staff Directory</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{filteredStaff.length} of {activeUsers.length} team members</p>
          </div>
        </div>
        <div className="topbar-actions flex gap-2 items-center">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="!text-sm !border-slate-200 dark:!border-slate-700 !rounded-lg !bg-white dark:!bg-slate-800 !text-slate-700 dark:!text-slate-300 !py-2 !px-3">
            <option value="All">All Roles</option>
            {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {canAdmin && (
            <button className="!px-4 !py-2 !text-xs !font-medium !text-white !bg-amber-500 hover:!bg-amber-600 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm" onClick={() => setShowAddModal(true)}><Plus size={14} className="inline mr-1" />Add Staff</button>
          )}
        </div>
      </div>
      <div className="content">
        {pinnedStaff.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setPinnedExpanded(!pinnedExpanded)}
              style={{ background: "transparent", border: "none", padding: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter',sans-serif" }}
            >
              {pinnedExpanded ? "▾" : "▸"} Pinned ({pinnedStaff.length})
            </button>
            {pinnedExpanded && (
              <div ref={pinnedGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(290px,100%),1fr))", gap: 16 }}>
                {pinnedStaff.map((u, idx) => {
                  const mine = allCases.filter(c => c.assignedAttorney === u.id || c.secondAttorney === u.id || c.caseManager === u.id || c.investigator === u.id || c.paralegal === u.id);
                  const isExpanded = isRowExpanded("pinned", idx);
                  return (
                    <div key={u.id} className="card" style={{ padding: "20px 22px", position: "relative", cursor: "pointer", borderLeft: "3px solid #C9A84C" }} onClick={() => toggleRow("pinned", idx)}>
                      <div style={{ position: "absolute", top: 10, right: 12, display: "flex", gap: 4, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => togglePin(u.id)} title="Unpin" className="bg-transparent border-none cursor-pointer p-0.5 leading-none"><Pin size={14} className="text-amber-500" /></button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isExpanded ? 14 : 0 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: u.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{u.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "var(--c-text-h)", fontWeight: 600 }}>{u.name}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                            {(u.roles && u.roles.length ? u.roles : [u.role]).map(r => <Badge key={r} label={r} />)}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>{isExpanded ? "▾" : "▸"}</span>
                      </div>
                      {isExpanded && (
                        <>
                          {[
                            ["Extension", u.ext || "—"],
                            ["Direct Line", u.phone || "—"],
                            ["Cell", u.cell || "—"],
                            ["Email", u.email || "—"],
                            ["Active Cases", `${mine.filter(c => c.status === "Active").length} (${mine.length} total)`]
                          ].map(([k, v]) => (
                            <div key={k} className="info-row"><span className="info-key">{k}</span><span className="info-val" style={{ fontSize: 12 }}>{v}</span></div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div style={{ marginBottom: 0 }}>
          <button
            onClick={() => setAllStaffExpanded(!allStaffExpanded)}
            style={{ background: "transparent", border: "none", padding: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter',sans-serif" }}
          >
            {allStaffExpanded ? "▾" : "▸"} All Staff ({filteredStaff.length})
          </button>
        </div>
        {allStaffExpanded && <div ref={allGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(290px,100%),1fr))", gap: 16 }}>
          {filteredStaff.map((u, idx) => {
            const mine = allCases.filter(c => c.assignedAttorney === u.id || c.secondAttorney === u.id || c.caseManager === u.id || c.investigator === u.id || c.paralegal === u.id);
            const isConfirming = confirmDeleteId === u.id;
            const isExpanded = isRowExpanded("all", idx);
            return (
              <div key={u.id} className="card" style={{ padding: "20px 22px", position: "relative", cursor: "pointer" }} onClick={() => toggleRow("all", idx)}>
                {isExpanded && (
                  <div style={{ position: "absolute", top: 10, right: 12, display: "flex", gap: 4, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    {isConfirming ? (
                      <>
                        <span style={{ fontSize: 11, color: "#e05252" }}>Remove?</span>
                        <button onClick={() => handleDeleteStaff(u.id)} style={{ padding: "2px 8px", background: "#e05252", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ padding: "2px 8px", background: "transparent", color: "#64748b", border: "1px solid var(--c-border)", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>No</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => togglePin(u.id)} title={pinnedIds.includes(u.id) ? "Unpin" : "Pin to top"} className={`bg-transparent border-none cursor-pointer p-0.5 leading-none transition-opacity ${pinnedIds.includes(u.id) ? "opacity-100" : "opacity-50 hover:opacity-100"}`}><Pin size={14} className={pinnedIds.includes(u.id) ? "text-amber-500" : "text-slate-400"} /></button>
                        {(canAdmin || currentUser.id === u.id) && (
                          <button onClick={() => setEditingUser(u)} title="Edit contact info" style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "2px 4px" }}>✎</button>
                        )}
                        {canAdmin && (
                          <button onClick={async () => { if (!window.confirm(`Send a temporary password to ${u.email}?`)) return; try { const r = await apiSendTempPassword(u.id); alert(r.message || "Sent!"); } catch (e) { alert(e.message || "Failed"); } }} title="Send temporary password" style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: "2px 4px" }}>🔑</button>
                        )}
                        {canAdmin && (
                          <button onClick={() => setConfirmDeleteId(u.id)} title="Remove staff member" style={{ background: "transparent", border: "none", color: "var(--c-border)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "2px 4px" }}>✕</button>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isExpanded ? 14 : 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: u.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{u.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "var(--c-text-h)", fontWeight: 600 }}>{u.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {(u.roles && u.roles.length ? u.roles : [u.role]).map(r => <Badge key={r} label={r} />)}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>{isExpanded ? "▾" : "▸"}</span>
                </div>
                {isExpanded && (
                  <>
                    {[
                      ["Extension", u.ext || "—"],
                      ["Direct Line", u.phone || "—"],
                      ["Cell", u.cell || "—"],
                      ["Email", u.email || "—"],
                      ["Active Cases", `${mine.filter(c => c.status === "Active").length} (${mine.length} total)`]
                    ].map(([k, v]) => (
                      <div key={k} className="info-row"><span className="info-key">{k}</span><span className="info-val" style={{ fontSize: 12 }}>{v}</span></div>
                    ))}
                    {canAdmin && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--c-border)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                          Roles <span style={{ fontWeight: 400, color: "var(--c-border)" }}>— click to toggle</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {STAFF_ROLES.map(r => {
                            const on = (u.roles && u.roles.length ? u.roles : [u.role]).includes(r);
                            return (
                              <button
                                key={r}
                                onClick={() => handleToggleRole(u.id, r, u.roles && u.roles.length ? u.roles : [u.role])}
                                style={{ padding: "2px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: on ? "#fef3c7" : "transparent", color: on ? "#1F2428" : "var(--c-border)", transition: "all 0.15s" }}
                              >{r}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>}
        {canAdmin && deletedUsers.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowDeletedStaff(!showDeletedStaff)}
              style={{ background: "transparent", border: "1px solid var(--c-border)", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {showDeletedStaff ? "▾" : "▸"} Deactivated Staff ({deletedUsers.length})
            </button>
            {showDeletedStaff && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(290px,100%),1fr))", gap: 16, marginTop: 16 }}>
                {deletedUsers.map(u => (
                  <div key={u.id} className="card" style={{ padding: "20px 22px", opacity: 0.7, position: "relative" }}>
                    <div style={{ position: "absolute", top: 10, right: 12 }}>
                      <button
                        onClick={() => handleRestoreStaff(u.id)}
                        style={{ padding: "4px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                      >Restore</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{u.initials}</div>
                      <div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: "var(--c-text-h)", fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Deactivated {new Date(u.deletedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="info-row"><span className="info-key">Email</span><span className="info-val" style={{ fontSize: 12 }}>{u.email || "—"}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default StaffView;
