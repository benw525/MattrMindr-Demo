DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'temp_password'
  ) THEN
    ALTER TABLE users RENAME COLUMN temp_password TO temp_password_hash;
    RAISE NOTICE 'Renamed temp_password to temp_password_hash';
  ELSE
    RAISE NOTICE 'Column temp_password already renamed or does not exist';
  END IF;
END $$;
