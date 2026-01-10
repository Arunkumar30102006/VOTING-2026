-- Add OTP columns to shareholders table
ALTER TABLE shareholders 
ADD COLUMN IF NOT EXISTS otp_code text,
ADD COLUMN IF NOT EXISTS otp_expiry timestamptz;

-- Add comment to explain usage
COMMENT ON COLUMN shareholders.otp_code IS 'Temporary storage for hashed OTP code during 2FA';
COMMENT ON COLUMN shareholders.otp_expiry IS 'Expiration timestamp for the OTP code';
