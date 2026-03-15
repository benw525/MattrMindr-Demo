/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { Inbox, Search, X, ChevronDown, ChevronRight, Check, AlertTriangle, Mail, MessageCircle, Menu, RefreshCw, Loader2, Briefcase, FileText } from "lucide-react";
import {
  apiGetUnmatchedSms, apiAssignSms, apiGetUnmatchedEmails, apiAssignUnmatchedEmail, apiReprocessUnmatchedEmails, apiReprocessStatus,
} from "../api.js";
import {
  fmt, Badge, isDarkMode,
  CaseSearchField, SortTh,
} from "../shared.js";
function UnmatchedView({ allCases, onMenuToggle }) {
  const [tab, setTab] = useState("emails");
  const [emails, setEmails] = useState([]);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMap, setSearchMap] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [reprocessing, setReprocessing] = useState(null);
  const pollRef = useRef(null);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGetUnmatchedEmails().catch(() => []),
      apiGetUnmatchedSms().catch(() => []),
    ]).then(([e, t]) => {
      setEmails(e);
      setTexts(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    let failCount = 0;
    pollRef.current = setInterval(async () => {
      try {
        const s = await apiReprocessStatus();
        failCount = 0;
        setReprocessing({ total: s.total, processed: s.processed, matched: s.matched, errors: s.errors });
        if (s.done) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setTimeout(() => { setReprocessing(null); refresh(); }, 1500);
        }
      } catch (_) {
        failCount++;
        if (failCount >= 5) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setReprocessing(null);
          refresh();
        }
      }
    }, 2000);
  }, [refresh]);

  const startReprocess = async () => {
    if (reprocessing) return;
    try {
      const result = await apiReprocessUnmatchedEmails();
      if (result.status === "complete") {
        refresh();
        return;
      }
      if (result.status === "started") {
        setReprocessing({ total: result.total, processed: 0, matched: 0, errors: 0 });
        startPolling();
      }
    } catch (err) {
      if (err.message && err.message.includes("already in progress")) {
        setReprocessing({ total: 0, processed: 0, matched: 0, errors: 0 });
        startPolling();
      } else {
        alert("Reprocess failed: " + err.message);
      }
    }
  };

  const doAssignEmail = async (emailId, caseId) => {
    setAssigningId(emailId);
    try {
      await apiAssignUnmatchedEmail(emailId, caseId);
      setEmails(p => p.filter(x => x.id !== emailId));
      setSearchMap(p => { const n = { ...p }; delete n[`e-${emailId}`]; return n; });
      setSelectedEmail(null);
    } catch (err) { alert(err.message || "Failed to assign"); }
    setAssigningId(null);
  };

  const doAssignText = async (msgId, caseId) => {
    setAssigningId(msgId);
    try {
      await apiAssignSms(msgId, caseId);
      setTexts(p => p.filter(x => x.id !== msgId));
      setSearchMap(p => { const n = { ...p }; delete n[`t-${msgId}`]; return n; });
    } catch (err) { alert(err.message || "Failed to assign"); }
    setAssigningId(null);
  };

  const CaseSearchBox = ({ itemKey, onAssign, isAssigning }) => {
    const q = (searchMap[itemKey] || "").toLowerCase().trim();
    const matches = q.length >= 2 ? allCases.filter(cs => (cs.caseNum && cs.caseNum.toLowerCase().includes(q)) || (cs.title && cs.title.toLowerCase().includes(q)) || (cs.clientName && cs.clientName.toLowerCase().includes(q))).slice(0, 8) : [];
    return (
      <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", borderRadius: 8, padding: 10, marginTop: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: matches.length > 0 ? 8 : 0 }}>
          <Search size={14} style={{ color: "#64748b", flexShrink: 0 }} />
          <input
            autoFocus
            placeholder="Search by case #, client name, or title..."
            value={searchMap[itemKey] || ""}
            onChange={e => setSearchMap(p => ({ ...p, [itemKey]: e.target.value }))}
            style={{ flex: 1, fontSize: 12, padding: "6px 10px", border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)" }}
          />
          <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }}
            onClick={() => setSearchMap(p => { const n = { ...p }; delete n[itemKey]; return n; })}>Cancel</button>
        </div>
        {q.length > 0 && q.length < 2 && <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 22 }}>Type at least 2 characters...</div>}
        {q.length >= 2 && matches.length === 0 && <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 22 }}>No cases found.</div>}
        {matches.length > 0 && (
          <div style={{ borderRadius: 6, border: "1px solid var(--c-border)", overflow: "hidden" }}>
            {matches.map(cs => (
              <div key={cs.id}
                style={{ padding: "8px 12px", fontSize: 12, cursor: isAssigning ? "wait" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--c-border2)", background: "var(--c-bg)", transition: "background 0.15s", opacity: isAssigning ? 0.6 : 1 }}
                onClick={() => !isAssigning && onAssign(cs.id)}
                onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg2)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--c-bg)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Briefcase size={13} style={{ color: "#f59e0b" }} />
                  <span style={{ color: "#5599cc", fontFamily: "monospace", fontWeight: 600 }}>{cs.caseNum}</span>
                  <span style={{ color: "var(--c-text)" }}>{cs.title || cs.clientName}</span>
                </div>
                <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>Assign</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const totalCount = emails.length + texts.length;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexShrink: 0 }}>
        <button className="md:hidden" onClick={onMenuToggle} style={{ background: "none", border: "none", color: "var(--c-text)", cursor: "pointer" }}><Menu size={22} /></button>
        <Inbox size={22} style={{ color: "#f59e0b" }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text)", margin: 0 }}>Unmatched</h1>
        {totalCount > 0 && <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{totalCount} item{totalCount !== 1 ? "s" : ""} need attention</span>}
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: "2px solid var(--c-border)", flexShrink: 0 }}>
        {[
          { id: "emails", label: "Emails", icon: Mail, count: emails.length },
          { id: "texts", label: "Texts", icon: MessageCircle, count: texts.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? "#f59e0b" : "var(--c-text2)", background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #f59e0b" : "2px solid transparent",
            marginBottom: -2, cursor: "pointer", transition: "all 0.15s",
          }}>
            <t.icon size={15} />
            {t.label}
            {t.count > 0 && <span style={{ background: tab === t.id ? "#f59e0b" : "var(--c-bg2)", color: tab === t.id ? "#fff" : "var(--c-text2)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", paddingTop: 20 }}>
      {loading && <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}><Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />Loading...</div>}

      {!loading && tab === "emails" && (
        <>
          {emails.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              <Mail size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>No unmatched emails</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>All filings emails have been matched to cases.</div>
            </div>
          )}
          {reprocessing && (
            <div style={{ background: "var(--c-bg2)", border: "1px solid #f59e0b33", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Loader2 size={16} className="animate-spin" style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Re-matching emails...</span>
                <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>{reprocessing.processed} / {reprocessing.total}</span>
              </div>
              <div style={{ height: 6, background: "var(--c-border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#f59e0b", borderRadius: 3, transition: "width 0.3s ease", width: `${reprocessing.total > 0 ? (reprocessing.processed / reprocessing.total) * 100 : 0}%` }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "#64748b" }}>
                <span>{reprocessing.matched} matched</span>
                {reprocessing.errors > 0 && <span style={{ color: "#ef4444" }}>{reprocessing.errors} error{reprocessing.errors !== 1 ? "s" : ""}</span>}
              </div>
            </div>
          )}
          {emails.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button onClick={startReprocess} disabled={!!reprocessing} className="btn btn-sm" style={{ background: reprocessing ? "#64748b" : "#f59e0b", color: "#fff", border: "none", fontSize: 11, padding: "4px 12px", borderRadius: 5, cursor: reprocessing ? "not-allowed" : "pointer", opacity: reprocessing ? 0.6 : 1 }}>
                  {reprocessing ? "Processing..." : "Re-match All"}
                </button>
              </div>
              {emails.map(email => {
                const isOpen = selectedEmail === email.id;
                const itemKey = `e-${email.id}`;
                const isLinking = searchMap[itemKey] !== undefined;
                return (
                  <div key={email.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-bg)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                      onClick={() => setSelectedEmail(isOpen ? null : email.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Mail size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject || "(No subject)"}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--c-text2)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>From: {email.from_name || email.from_email}</span>
                          {email.court_case_number && <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>Case #: {email.court_case_number}</span>}
                          {email.attachment_count > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><FileText size={11} />{email.attachment_count} attachment{email.attachment_count !== 1 ? "s" : ""}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{email.received_at ? new Date(email.received_at).toLocaleString() : ""}</span>
                        {isOpen ? <ChevronDown size={14} style={{ color: "#64748b" }} /> : <ChevronRight size={14} style={{ color: "#64748b" }} />}
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: "1px solid var(--c-border2)", padding: "12px 16px" }}>
                        {email.body_text && (
                          <div style={{ fontSize: 12, color: "var(--c-text)", whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto", background: "var(--c-bg2)", padding: "10px 12px", borderRadius: 6, marginBottom: 12, border: "1px solid var(--c-border2)" }}>
                            {email.body_text.substring(0, 2000)}
                          </div>
                        )}
                        {!isLinking ? (
                          <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                            onClick={() => setSearchMap(p => ({ ...p, [itemKey]: "" }))}>
                            <Briefcase size={14} /> Assign to Case
                          </button>
                        ) : (
                          <CaseSearchBox itemKey={itemKey} onAssign={(caseId) => doAssignEmail(email.id, caseId)} isAssigning={assigningId === email.id} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!loading && tab === "texts" && (
        <>
          {texts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              <MessageCircle size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>No unmatched texts</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>All incoming texts have been matched to cases.</div>
            </div>
          )}
          {texts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {texts.map(msg => {
                const itemKey = `t-${msg.id}`;
                const isLinking = searchMap[itemKey] !== undefined;
                return (
                  <div key={msg.id} style={{ border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-bg)", padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MessageCircle size={14} style={{ color: "#3b82f6", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", fontFamily: "monospace" }}>{msg.phoneNumber}</span>
                        {msg.contactName && <span style={{ fontSize: 12, color: "var(--c-text2)" }}>{msg.contactName}</span>}
                      </div>
                      <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>{msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ""}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--c-text)", whiteSpace: "pre-wrap", background: "var(--c-bg2)", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--c-border2)", marginBottom: 10 }}>{msg.body}</div>
                    {!isLinking ? (
                      <button className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => setSearchMap(p => ({ ...p, [itemKey]: "" }))}>
                        <Briefcase size={14} /> Assign to Case
                      </button>
                    ) : (
                      <CaseSearchBox itemKey={itemKey} onAssign={(caseId) => doAssignText(msg.id, caseId)} isAssigning={assigningId === msg.id} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}


export default UnmatchedView;
