import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, Search, X, RotateCcw, Check, AlertTriangle, Menu, ChevronDown, ChevronRight, Filter, Loader2 } from "lucide-react";
import {
  apiGetDeletedData, apiRestoreDeletedItem, apiBatchRestoreDeleted, apiBatchPurgeDeleted,
} from "../api.js";
import {
  fmt, Badge, isDarkMode, getUserById, Avatar,
  hasRole, isAppAdmin,
  SortTh, Toggle,
} from "../shared.js";
function DeletedDataView({ onMenuToggle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({});
  const [batchAction, setBatchAction] = useState(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const searchTimerRef = useRef(null);

  const loadData = useCallback(async (q) => {
    setLoading(true);
    try {
      const result = await apiGetDeletedData(q || "");
      setData(result || []);
    } catch (err) {
      console.error("Failed to load deleted data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadData(search);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, loadData]);

  const handleRestore = async (type, id) => {
    setRestoring(`${type}-${id}`);
    try {
      await apiRestoreDeletedItem(type, id);
      setSelected(prev => { const n = { ...prev }; delete n[`${type}-${id}`]; return n; });
      loadData(search);
    } catch (err) {
      alert("Restore failed: " + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const toggleSelect = (type, id) => {
    const key = `${type}-${id}`;
    setSelected(prev => {
      const n = { ...prev };
      if (n[key]) delete n[key]; else n[key] = { type, id };
      return n;
    });
  };

  const toggleSelectAll = () => {
    const allItems = data.flatMap(g => g.items.map(i => ({ type: g.type, id: i.id })));
    const allSelected = allItems.every(i => selected[`${i.type}-${i.id}`]);
    if (allSelected) {
      setSelected({});
    } else {
      const n = {};
      allItems.forEach(i => { n[`${i.type}-${i.id}`] = i; });
      setSelected(n);
    }
  };

  const toggleGroupSelect = (group) => {
    const groupItems = group.items.map(i => ({ type: group.type, id: i.id }));
    const allGroupSelected = groupItems.every(i => selected[`${i.type}-${i.id}`]);
    setSelected(prev => {
      const n = { ...prev };
      if (allGroupSelected) {
        groupItems.forEach(i => { delete n[`${i.type}-${i.id}`]; });
      } else {
        groupItems.forEach(i => { n[`${i.type}-${i.id}`] = i; });
      }
      return n;
    });
  };

  const selectedItems = Object.values(selected);
  const selectedCount = selectedItems.length;

  const handleBatchRestore = async () => {
    if (selectedCount === 0) return;
    setBatchAction("restoring");
    try {
      await apiBatchRestoreDeleted(selectedItems);
      setSelected({});
      loadData(search);
    } catch (err) {
      alert("Batch restore failed: " + err.message);
    } finally {
      setBatchAction(null);
    }
  };

  const handleBatchPurge = async () => {
    if (selectedCount === 0) return;
    setBatchAction("purging");
    try {
      await apiBatchPurgeDeleted(selectedItems);
      setSelected({});
      setConfirmPurge(false);
      loadData(search);
    } catch (err) {
      alert("Batch purge failed: " + err.message);
    } finally {
      setBatchAction(null);
    }
  };

  const totalItems = data.reduce((sum, g) => sum + g.items.length, 0);

  const toggleGroupCollapse = (type) => {
    setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="md:hidden" onClick={onMenuToggle} style={{ marginRight: 4 }}><Menu size={20} /></button>
          <Trash2 size={22} style={{ color: "#dc2626" }} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-h)", fontFamily: "'Inter',sans-serif" }}>Deleted Data</h1>
            <p style={{ fontSize: 12, color: "var(--c-text2)", marginTop: 2 }}>Soft-deleted records are automatically purged after 30 days</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 500, padding: "4px 12px", borderRadius: 20, background: "var(--c-bg2)", color: "var(--c-text2)" }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</div>
          <button onClick={() => loadData(search)} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 500, borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text-h)", cursor: "pointer" }}>
            <RotateCcw size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />Refresh
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ position: "relative", maxWidth: 500 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--c-text3)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search deleted items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 13, borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text-h)", fontFamily: "'Inter',sans-serif" }}
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 12, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>{selectedCount} selected</span>
          <button onClick={toggleSelectAll} style={{ fontSize: 12, color: "#1d4ed8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            {data.flatMap(g => g.items).every(i => selected[`${data.find(g => g.items.includes(i))?.type}-${i.id}`]) ? "Deselect All" : "Select All"}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleBatchRestore}
            disabled={batchAction !== null}
            style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#059669", cursor: "pointer", opacity: batchAction ? 0.6 : 1 }}
          >
            {batchAction === "restoring" ? <Loader2 size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} className="animate-spin" /> : <RotateCcw size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />}
            Restore Selected
          </button>
          <button
            onClick={() => setConfirmPurge(true)}
            disabled={batchAction !== null}
            style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer", opacity: batchAction ? 0.6 : 1 }}
          >
            <Trash2 size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Purge Selected
          </button>
        </div>
      )}

      {confirmPurge && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--c-card)", borderRadius: 12, padding: 24, maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>Permanently Delete {selectedCount} Item{selectedCount !== 1 ? "s" : ""}?</h3>
            <p style={{ fontSize: 13, color: "var(--c-text2)", marginBottom: 20 }}>This action cannot be undone. The selected items and any associated cloud storage objects will be permanently removed.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmPurge(false)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text-h)", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleBatchPurge} disabled={batchAction === "purging"} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", opacity: batchAction === "purging" ? 0.6 : 1 }}>
                {batchAction === "purging" ? "Purging..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "var(--c-text2)" }}>
            <Loader2 size={20} className="animate-spin" style={{ marginRight: 8 }} /> Loading deleted data...
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--c-text2)" }}>
            <Trash2 size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 500, color: "var(--c-text-h)" }}>{search ? "No matching deleted items" : "No deleted data"}</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>{search ? "Try a different search term" : "Items you delete will appear here for 30 days before being permanently removed"}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.map(group => {
              const allGroupSelected = group.items.every(i => selected[`${group.type}-${i.id}`]);
              const someGroupSelected = group.items.some(i => selected[`${group.type}-${i.id}`]);
              const isCollapsed = !!collapsedGroups[group.type];
              return (
                <div key={group.type} style={{ borderRadius: 12, border: "1px solid var(--c-border)", background: "var(--c-card)", overflow: "hidden" }}>
                  <div
                    style={{ padding: "12px 16px", borderBottom: isCollapsed ? "none" : "1px solid var(--c-border)", background: "var(--c-bg2)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleGroupCollapse(group.type)}
                  >
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                      onChange={() => toggleGroupSelect(group)}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                    <ChevronRight size={14} style={{ color: "var(--c-text2)", transition: "transform 0.2s", transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)", flexShrink: 0 }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", flex: 1 }}>{group.label}</h3>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 10, background: "var(--c-border)", color: "var(--c-text2)" }}>{group.items.length}</span>
                  </div>
                  {!isCollapsed && (
                    <div>
                      {group.items.map(item => (
                        <div key={item.id} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--c-border2)", transition: "background 0.15s", cursor: "pointer", background: selected[`${group.type}-${item.id}`] ? "#f0f9ff" : "transparent" }} onClick={() => toggleSelect(group.type, item.id)} onMouseEnter={e => { if (!selected[`${group.type}-${item.id}`]) e.currentTarget.style.background = "var(--c-hover)"; }} onMouseLeave={e => { if (!selected[`${group.type}-${item.id}`]) e.currentTarget.style.background = "transparent"; }}>
                          <input
                            type="checkbox"
                            checked={!!selected[`${group.type}-${item.id}`]}
                            onChange={() => toggleSelect(group.type, item.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--c-text-h)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 3, fontSize: 11, color: "var(--c-text2)", flexWrap: "wrap" }}>
                              {item.caseTitle && <span style={{ padding: "1px 6px", borderRadius: 4, background: "var(--c-bg2)" }}>Case: {item.caseTitle}</span>}
                              <span>Deleted: {new Date(item.deletedAt).toLocaleDateString()}</span>
                              <span style={{ fontWeight: 500, color: item.daysRemaining <= 7 ? "#dc2626" : item.daysRemaining <= 14 ? "#d97706" : "var(--c-text2)" }}>
                                {item.daysRemaining} day{item.daysRemaining !== 1 ? "s" : ""} remaining
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); handleRestore(group.type, item.id); }}
                            disabled={restoring === `${group.type}-${item.id}`}
                            style={{ padding: "5px 14px", fontSize: 12, fontWeight: 500, borderRadius: 8, border: "1px solid #a7f3d0", color: "#059669", background: "transparent", cursor: "pointer", opacity: restoring === `${group.type}-${item.id}` ? 0.5 : 1, flexShrink: 0 }}
                          >
                            {restoring === `${group.type}-${item.id}` ? <Loader2 size={12} className="animate-spin" /> : <><RotateCcw size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />Restore</>}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default DeletedDataView;
