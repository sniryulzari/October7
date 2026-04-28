-- ============================================================
-- Migration: Contributor role support
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add allowed_contributors column to locations
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS allowed_contributors uuid[] DEFAULT '{}';

-- 2. Update set_user_role to support 'contributor' and sync to profiles
CREATE OR REPLACE FUNCTION set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;

  IF new_role NOT IN ('admin', 'contributor', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update app_metadata (drives JWT claims)
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new_role)
  WHERE id = target_user_id;

  -- Keep profiles table in sync
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

-- 3. RPC: admin can add/remove a contributor from a specific location
CREATE OR REPLACE FUNCTION manage_location_contributor(
  p_location_id uuid,
  p_contributor_id uuid,
  p_action text  -- 'add' or 'remove'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Only admins can manage contributors';
  END IF;

  IF p_action NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'Invalid action. Use "add" or "remove"';
  END IF;

  IF p_action = 'add' THEN
    UPDATE locations
    SET allowed_contributors = array_append(
      COALESCE(allowed_contributors, ARRAY[]::uuid[]),
      p_contributor_id
    )
    WHERE id = p_location_id
      AND NOT (p_contributor_id = ANY(COALESCE(allowed_contributors, ARRAY[]::uuid[])));
  ELSE
    UPDATE locations
    SET allowed_contributors = array_remove(
      COALESCE(allowed_contributors, ARRAY[]::uuid[]),
      p_contributor_id
    )
    WHERE id = p_location_id;
  END IF;
END;
$$;

-- 4. RPC: cleanup contributor from all locations (called before user deletion)
CREATE OR REPLACE FUNCTION cleanup_contributor(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE locations
  SET allowed_contributors = array_remove(
    COALESCE(allowed_contributors, ARRAY[]::uuid[]),
    p_user_id
  )
  WHERE p_user_id = ANY(COALESCE(allowed_contributors, ARRAY[]::uuid[]));
END;
$$;

-- 5. RLS: contributors can UPDATE locations they are assigned to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations'
      AND policyname = 'contributors can update assigned locations'
  ) THEN
    CREATE POLICY "contributors can update assigned locations"
    ON locations FOR UPDATE
    TO authenticated
    USING (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'contributor'
      AND auth.uid() = ANY(COALESCE(allowed_contributors, ARRAY[]::uuid[]))
    )
    WITH CHECK (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'contributor'
      AND auth.uid() = ANY(COALESCE(allowed_contributors, ARRAY[]::uuid[]))
    );
  END IF;
END $$;
