exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS transcript_history (
      id SERIAL PRIMARY KEY,
      transcript_id INTEGER REFERENCES case_transcripts(id) ON DELETE CASCADE,
      change_type TEXT NOT NULL,
      change_description TEXT,
      previous_state JSONB,
      changed_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS custom_reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      data_source TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}',
      visibility TEXT DEFAULT 'private',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS custom_agents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      context_sources JSONB DEFAULT '[]',
      needs_case BOOLEAN DEFAULT true,
      interaction_mode TEXT DEFAULT 'single',
      model TEXT DEFAULT 'gpt-4o-mini',
      visibility TEXT DEFAULT 'private',
      shared_with INTEGER[] DEFAULT '{}',
      instruction_file BYTEA,
      instruction_filename TEXT,
      instruction_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      permission_key TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK (target_type IN ('role', 'user')),
      target_value TEXT NOT NULL,
      granted BOOLEAN NOT NULL DEFAULT true,
      expires_at TIMESTAMPTZ,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(permission_key, target_type, target_value)
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS unmatched_filings_emails (
      id SERIAL PRIMARY KEY,
      from_email TEXT,
      from_name TEXT,
      to_emails TEXT,
      cc_emails TEXT,
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      attachments JSONB DEFAULT '[]',
      court_case_number TEXT DEFAULT '',
      attachment_count INTEGER DEFAULT 0,
      assigned_case_id INTEGER REFERENCES cases(id),
      received_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS custom_task_flows (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trigger_condition JSONB NOT NULL,
      trigger_on TEXT DEFAULT 'update',
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS custom_task_flow_steps (
      id SERIAL PRIMARY KEY,
      flow_id INTEGER NOT NULL REFERENCES custom_task_flows(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      assigned_role VARCHAR(50),
      assigned_user_id INTEGER REFERENCES users(id),
      due_in_days INTEGER,
      priority TEXT DEFAULT 'Medium',
      depends_on_step_id INTEGER REFERENCES custom_task_flow_steps(id) ON DELETE SET NULL,
      recurring BOOLEAN DEFAULT false,
      recurring_days INTEGER,
      auto_escalate BOOLEAN DEFAULT true,
      escalate_medium_days INTEGER DEFAULT 30,
      escalate_high_days INTEGER DEFAULT 14,
      escalate_urgent_days INTEGER DEFAULT 7,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS task_flow_executions (
      id SERIAL PRIMARY KEY,
      flow_id INTEGER NOT NULL REFERENCES custom_task_flows(id) ON DELETE CASCADE,
      case_id INTEGER NOT NULL,
      triggered_by INTEGER REFERENCES users(id),
      triggered_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS custom_dashboard_widgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      widget_type TEXT NOT NULL,
      data_source TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}',
      size TEXT DEFAULT 'half',
      visibility TEXT DEFAULT 'private',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS integration_configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pgm.sql(`ALTER TABLE custom_task_flow_steps ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE custom_task_flow_steps DROP COLUMN IF EXISTS conditions`);
  pgm.sql(`DROP TABLE IF EXISTS integration_configs CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS custom_dashboard_widgets CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS task_flow_executions CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS custom_task_flow_steps CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS custom_task_flows CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS unmatched_filings_emails CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS permissions CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS custom_agents CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS custom_reports CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS transcript_history CASCADE`);
};
