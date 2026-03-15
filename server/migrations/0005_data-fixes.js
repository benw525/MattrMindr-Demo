exports.up = async (pgm) => {
  pgm.sql(`UPDATE cases SET stage = 'Suit Filed' WHERE stage = 'Litigation Filed'`);

  pgm.sql(`
    UPDATE case_correspondence SET is_voicemail = true
    WHERE is_voicemail = false AND subject ~* 'voice\\s*message'
  `);
};

exports.down = false;
