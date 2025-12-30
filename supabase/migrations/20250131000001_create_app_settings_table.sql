-- Create app_settings table for storing application-wide settings
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by key
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Add RLS policy (allow all authenticated users to read, only admins to write)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading
CREATE POLICY "Allow authenticated users to read app settings"
  ON app_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy for writing (only admins)
CREATE POLICY "Allow admins to update app settings"
  ON app_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- Policy for inserting (only admins)
CREATE POLICY "Allow admins to insert app settings"
  ON app_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- Insert default courier settings if not exists
INSERT INTO app_settings (key, value) VALUES (
  'app_courier_settings',
  '{
    "id": "courier-settings-default",
    "active_courier": "bobgo",
    "bobgo_api_enabled": true,
    "courier_guy_api_enabled": false,
    "bobgo_locker_name": "BobGo Lockers",
    "courier_guy_locker_name": "Courier Guy Lockers",
    "updated_at": "'|| CURRENT_TIMESTAMP ||'",
    "updated_by": null
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE app_settings IS 'Application-wide settings and configuration including courier provider selection';
COMMENT ON COLUMN app_settings.key IS 'Unique identifier for the setting (e.g., app_courier_settings)';
COMMENT ON COLUMN app_settings.value IS 'JSON value of the setting';
