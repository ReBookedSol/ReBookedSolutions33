-- Create function to send webhook for contact messages
CREATE OR REPLACE FUNCTION send_contact_webhook()
RETURNS TRIGGER AS $$
BEGIN
  SELECT net.http_post(
    url := 'https://hook.relay.app/api/v1/functions/send-webhook',
    body := jsonb_build_object(
      'table', 'contact_messages',
      'action', TG_OP,
      'new', row_to_json(NEW)
    )::text
  ) INTO null;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS contact_messages_webhook_trigger ON contact_messages;

-- Create trigger for contact messages
CREATE TRIGGER contact_messages_webhook_trigger
AFTER INSERT ON contact_messages
FOR EACH ROW
EXECUTE FUNCTION send_contact_webhook();

-- Create function to send webhook for reports
CREATE OR REPLACE FUNCTION send_report_webhook()
RETURNS TRIGGER AS $$
BEGIN
  SELECT net.http_post(
    url := 'https://hook.relay.app/api/v1/functions/send-webhook',
    body := jsonb_build_object(
      'table', 'reports',
      'action', TG_OP,
      'new', row_to_json(NEW)
    )::text
  ) INTO null;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS reports_webhook_trigger ON reports;

-- Create trigger for reports
CREATE TRIGGER reports_webhook_trigger
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION send_report_webhook();

-- Create function to send webhook for orders
CREATE OR REPLACE FUNCTION send_order_webhook()
RETURNS TRIGGER AS $$
BEGIN
  SELECT net.http_post(
    url := 'https://hook.relay.app/api/v1/functions/send-webhook',
    body := jsonb_build_object(
      'table', 'orders',
      'action', TG_OP,
      'new', row_to_json(NEW)
    )::text
  ) INTO null;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS orders_webhook_trigger ON orders;

-- Create trigger for orders
CREATE TRIGGER orders_webhook_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION send_order_webhook();
