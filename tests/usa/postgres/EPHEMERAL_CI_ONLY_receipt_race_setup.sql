-- DocWallet USA / disposable PostgreSQL 17 multi-connection replay race.
-- NOT a signing service or deployable DB migration.
DO $guard$
BEGIN
 IF current_database() <> 'usa_contract_ci'
    OR current_setting('app.usa_ephemeral_contract_ci', true) IS DISTINCT FROM 'SYNTHETIC_ONLY' THEN
   RAISE EXCEPTION 'REFUSING NON-EPHEMERAL USA RECEIPT RACE SETUP';
 END IF;
END $guard$;
BEGIN;
CREATE SCHEMA usa_esign_race_ci;
REVOKE ALL ON SCHEMA usa_esign_race_ci FROM PUBLIC;
CREATE TABLE usa_esign_race_ci.events (
 issuer text NOT NULL,
 event_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('document_viewed','sign_intent_recorded')),
 receipt_sha text NOT NULL CHECK(receipt_sha ~ '^[a-f0-9]{64}$'),
 PRIMARY KEY(issuer,event_id)
);
ALTER TABLE usa_esign_race_ci.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON usa_esign_race_ci.events FROM PUBLIC;
CREATE FUNCTION usa_esign_race_ci.insert_pair(
 p_issuer text, p_view uuid, p_intent uuid, p_view_digest text, p_intent_digest text
) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE n integer;
BEGIN
 IF p_issuer !~ '^[A-Za-z0-9_-]{3,128}$'
    OR p_view IS NULL OR p_intent IS NULL OR p_view=p_intent
    OR p_view_digest !~ '^[a-f0-9]{64}$'
    OR p_intent_digest !~ '^[a-f0-9]{64}$' THEN
   RAISE EXCEPTION 'invalid receipt pair';
 END IF;
 INSERT INTO usa_esign_race_ci.events(issuer,event_id,kind,receipt_sha)
 VALUES (p_issuer,p_view,'document_viewed',p_view_digest),
        (p_issuer,p_intent,'sign_intent_recorded',p_intent_digest)
 ON CONFLICT (issuer,event_id) DO NOTHING;
 GET DIAGNOSTICS n = ROW_COUNT;
 IF n<>2 THEN RAISE EXCEPTION 'receipt replay denied' USING ERRCODE='23505'; END IF;
 RETURN n;
END
$$;
COMMIT;
