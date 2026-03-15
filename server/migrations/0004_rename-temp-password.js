exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'temp_password'
      ) THEN
        ALTER TABLE users RENAME COLUMN temp_password TO temp_password_hash;
      END IF;
    END $$
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'temp_password_hash'
      ) THEN
        ALTER TABLE users RENAME COLUMN temp_password_hash TO temp_password;
      END IF;
    END $$
  `);
};
