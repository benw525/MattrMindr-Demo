exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'firm'`);
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS firm_viewed_at TIMESTAMPTZ`);
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES document_folders(id) ON DELETE SET NULL`);
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`);
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '[]'`);
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS content_html TEXT`);
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'complete'`);

  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture BYTEA`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_type TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_access_token TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_refresh_token TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_token_expiry TIMESTAMPTZ`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_account_email TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_calendar_sync BOOLEAN DEFAULT false`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_sync_deadline_types JSONB DEFAULT '[]'`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS scribe_url TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS scribe_token TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS scribe_user_email TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS voirdire_url TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS voirdire_token TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS voirdire_user_email TEXT`);

  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS in_litigation BOOLEAN NOT NULL DEFAULT FALSE`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS demand_response_due DATE`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_dob DATE`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_ssn TEXT NOT NULL DEFAULT ''`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_address TEXT NOT NULL DEFAULT ''`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_phones JSONB NOT NULL DEFAULT '[]'`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_emergency_contact TEXT NOT NULL DEFAULT ''`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_email TEXT NOT NULL DEFAULT ''`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_bankruptcy BOOLEAN NOT NULL DEFAULT FALSE`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_case_number TEXT NOT NULL DEFAULT ''`);
  pgm.sql(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS fee_is_flat BOOLEAN DEFAULT false`);

  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT false`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS video_data BYTEA`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS video_content_type TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS r2_audio_key TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS r2_video_key TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES transcript_folders(id) ON DELETE SET NULL`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS scribe_transcript_id TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS scribe_status TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS transcript_versions JSONB`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS summaries JSONB`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS pipeline_log JSONB`);

  pgm.sql(`ALTER TABLE case_correspondence ADD COLUMN IF NOT EXISTS is_voicemail BOOLEAN DEFAULT false`);

  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS billed NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS owed NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS reduction_value NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS reduction_is_percent BOOLEAN DEFAULT false`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS client_paid NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS firm_paid NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS insurance_paid NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS write_off NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_damages ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`);

  pgm.sql(`ALTER TABLE case_liens ADD COLUMN IF NOT EXISTS reduction_value NUMERIC(12,2)`);
  pgm.sql(`ALTER TABLE case_liens ADD COLUMN IF NOT EXISTS reduction_is_percent BOOLEAN DEFAULT false`);

  pgm.sql(`ALTER TABLE case_negotiations ADD COLUMN IF NOT EXISTS policy_id INTEGER`);
  pgm.sql(`ALTER TABLE case_negotiations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);

  pgm.sql(`ALTER TABLE jury_analyses ADD COLUMN IF NOT EXISTS daubert_challenge TEXT`);

  pgm.sql(`ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);

  pgm.sql(`ALTER TABLE trial_jurors ADD COLUMN IF NOT EXISTS voirdire_juror_id TEXT`);

  pgm.sql(`ALTER TABLE trial_timeline_events ADD COLUMN IF NOT EXISTS file_data BYTEA`);
  pgm.sql(`ALTER TABLE trial_timeline_events ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT ''`);
  pgm.sql(`ALTER TABLE trial_timeline_events ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT ''`);
  pgm.sql(`ALTER TABLE trial_timeline_events ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0`);
  pgm.sql(`ALTER TABLE trial_timeline_events ADD COLUMN IF NOT EXISTS association TEXT DEFAULT 'general'`);

  pgm.sql(`ALTER TABLE trial_pinned_docs ADD COLUMN IF NOT EXISTS transcript_id INTEGER`);

  pgm.sql(`ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS outlook_event_id TEXT`);

  pgm.sql(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_flow_id INTEGER`);

  pgm.sql(`ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS source_document_id INTEGER REFERENCES case_documents(id) ON DELETE SET NULL`);
  pgm.sql(`ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS body_part TEXT DEFAULT ''`);

  pgm.sql(`ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES document_folders(id) ON DELETE CASCADE`);

  const softDeleteTables = [
    'case_documents', 'case_transcripts', 'case_filings', 'case_correspondence',
    'deadlines', 'case_notes', 'time_entries',
    'case_insurance_policies', 'case_medical_treatments', 'case_liens',
    'case_damages', 'case_negotiations', 'case_parties', 'case_experts', 'case_misc_contacts'
  ];
  for (const tbl of softDeleteTables) {
    pgm.sql(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
  }
};

exports.down = false;
