-- Lock down users, bookings, events tables.
-- These tables are written only by server functions using the service role
-- (which bypasses RLS). No anon/authenticated client should ever read or
-- write them directly via the Data API. Add explicit deny-all policies so
-- the security posture is clear and the linter is satisfied.

-- ===== users =====
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;

CREATE POLICY "Deny all client access to users"
ON public.users
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ===== bookings =====
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.bookings FROM anon, authenticated;

CREATE POLICY "Deny all client access to bookings"
ON public.bookings
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ===== events =====
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.events FROM anon, authenticated;

CREATE POLICY "Deny all client access to events"
ON public.events
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
