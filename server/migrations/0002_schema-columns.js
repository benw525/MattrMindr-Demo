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

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS source`);
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS firm_viewed_at`);
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS folder_id`);
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS sort_order`);
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS annotations`);
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS content_html`);
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS ocr_status`);

  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS mfa_secret`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS mfa_enabled`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS profile_picture`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS profile_picture_type`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS ms_access_token`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS ms_refresh_token`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS ms_token_expiry`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS ms_account_email`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS ms_calendar_sync`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS ms_sync_deadline_types`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS scribe_url`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS scribe_token`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS scribe_user_email`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS voirdire_url`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS voirdire_token`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS voirdire_user_email`);

  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS in_litigation`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS demand_response_due`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_dob`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_ssn`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_address`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_phones`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_emergency_contact`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_email`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS client_bankruptcy`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS court_case_number`);
  pgm.sql(`ALTER TABLE cases DROP COLUMN IF EXISTS fee_is_flat`);

  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS is_video`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS video_data`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS video_content_type`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS r2_audio_key`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS r2_video_key`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS folder_id`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS sort_order`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS description`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS scribe_transcript_id`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS scribe_status`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS transcript_versions`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS summaries`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS pipeline_log`);

  pgm.sql(`ALTER TABLE case_correspondence DROP COLUMN IF EXISTS is_voicemail`);

  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS billed`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS owed`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS reduction_value`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS reduction_is_percent`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS client_paid`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS firm_paid`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS insurance_paid`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS write_off`);
  pgm.sql(`ALTER TABLE case_damages DROP COLUMN IF EXISTS name`);

  pgm.sql(`ALTER TABLE case_liens DROP COLUMN IF EXISTS reduction_value`);
  pgm.sql(`ALTER TABLE case_liens DROP COLUMN IF EXISTS reduction_is_percent`);

  pgm.sql(`ALTER TABLE case_negotiations DROP COLUMN IF EXISTS policy_id`);
  pgm.sql(`ALTER TABLE case_negotiations DROP COLUMN IF EXISTS deleted_at`);

  pgm.sql(`ALTER TABLE jury_analyses DROP COLUMN IF EXISTS daubert_challenge`);

  pgm.sql(`ALTER TABLE sms_messages DROP COLUMN IF EXISTS deleted_at`);

  pgm.sql(`ALTER TABLE trial_jurors DROP COLUMN IF EXISTS voirdire_juror_id`);

  pgm.sql(`ALTER TABLE trial_timeline_events DROP COLUMN IF EXISTS file_data`);
  pgm.sql(`ALTER TABLE trial_timeline_events DROP COLUMN IF EXISTS file_name`);
  pgm.sql(`ALTER TABLE trial_timeline_events DROP COLUMN IF EXISTS file_type`);
  pgm.sql(`ALTER TABLE trial_timeline_events DROP COLUMN IF EXISTS file_size`);
  pgm.sql(`ALTER TABLE trial_timeline_events DROP COLUMN IF EXISTS association`);

  pgm.sql(`ALTER TABLE trial_pinned_docs DROP COLUMN IF EXISTS transcript_id`);

  pgm.sql(`ALTER TABLE deadlines DROP COLUMN IF EXISTS outlook_event_id`);

  pgm.sql(`ALTER TABLE tasks DROP COLUMN IF EXISTS source_flow_id`);

  pgm.sql(`ALTER TABLE medical_records DROP COLUMN IF EXISTS source_document_id`);
  pgm.sql(`ALTER TABLE medical_records DROP COLUMN IF EXISTS body_part`);

  pgm.sql(`ALTER TABLE document_folders DROP COLUMN IF EXISTS parent_id`);

  const softDeleteTables = [
    'case_documents', 'case_transcripts', 'case_filings', 'case_correspondence',
    'deadlines', 'case_notes', 'time_entries',
    'case_insurance_policies', 'case_medical_treatments', 'case_liens',
    'case_damages', 'case_negotiations', 'case_parties', 'case_experts', 'case_misc_contacts'
  ];
  for (const tbl of softDeleteTables) {
    pgm.sql(`ALTER TABLE ${tbl} DROP COLUMN IF EXISTS deleted_at`);
  }
};
