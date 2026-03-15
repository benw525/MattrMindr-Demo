exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS r2_file_key TEXT`);
  pgm.sql(`ALTER TABLE case_filings ADD COLUMN IF NOT EXISTS r2_file_key TEXT`);
  pgm.sql(`ALTER TABLE case_voicemails ADD COLUMN IF NOT EXISTS r2_file_key TEXT`);
  pgm.sql(`ALTER TABLE doc_templates ADD COLUMN IF NOT EXISTS r2_file_key TEXT`);
  pgm.sql(`ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS r2_file_key TEXT`);
  pgm.sql(`ALTER TABLE trial_timeline_events ADD COLUMN IF NOT EXISTS r2_file_key TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS r2_audio_key TEXT`);
  pgm.sql(`ALTER TABLE case_transcripts ADD COLUMN IF NOT EXISTS r2_video_key TEXT`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS r2_profile_picture_key TEXT`);
  pgm.sql(`ALTER TABLE custom_agents ADD COLUMN IF NOT EXISTS r2_instruction_key TEXT`);
  pgm.sql(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS r2_attachment_key TEXT`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE case_documents DROP COLUMN IF EXISTS r2_file_key`);
  pgm.sql(`ALTER TABLE case_filings DROP COLUMN IF EXISTS r2_file_key`);
  pgm.sql(`ALTER TABLE case_voicemails DROP COLUMN IF EXISTS r2_file_key`);
  pgm.sql(`ALTER TABLE doc_templates DROP COLUMN IF EXISTS r2_file_key`);
  pgm.sql(`ALTER TABLE medical_records DROP COLUMN IF EXISTS r2_file_key`);
  pgm.sql(`ALTER TABLE trial_timeline_events DROP COLUMN IF EXISTS r2_file_key`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS r2_audio_key`);
  pgm.sql(`ALTER TABLE case_transcripts DROP COLUMN IF EXISTS r2_video_key`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS r2_profile_picture_key`);
  pgm.sql(`ALTER TABLE custom_agents DROP COLUMN IF EXISTS r2_instruction_key`);
  pgm.sql(`ALTER TABLE chat_messages DROP COLUMN IF EXISTS r2_attachment_key`);
};
