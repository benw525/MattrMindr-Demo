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

export { FONTS, CSS };
