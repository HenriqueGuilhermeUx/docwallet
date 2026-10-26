-- DocWallet USA / ALTERNATIVE VENTURES
-- EPHEMERAL_GITHUB_ACTIONS_ONLY: tests synthetic rows in a disposable DB.
-- NOT a production migration, Supabase installation, or real signing ledger.
-- Must fail closed on any different database or without an explicit CI flag.
DO $guard$
BEGIN
 IF current_database() <> 'usa_contract_ci'
    OR current_setting('app.usa_ephemeral_contract_ci', true) IS DISTINCT FROM 'SYNTHETIC_ONLY' THEN
   RAISE EXCEPTION 'REFUSING NON-EPHEMERAL USA DOCWALLET TEST';
 END IF;
END
$guard$;

BEGIN;
CREATE SCHEMA usa_esign_ci;
REVOKE ALL ON SCHEMA usa_esign_ci FROM PUBLIC;

CREATE ROLE usa_esign_anon_ci NOLOGIN;
CREATE ROLE usa_esign_authenticated_ci NOLOGIN;

CREATE TABLE usa_esign_ci.signed_receipts (
  tenant_id uuid NOT NULL,
  issuer_id text NOT NULL CHECK (issuer_id ~ '^[A-Za-z0-9_-]{3,128}$'),
  actor_id text NOT NULL CHECK (actor_id ~ '^[A-Za-z0-9_-]{3,128}$'),
  event_id uuid NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('document_viewed','sign_intent_recorded')),
  document_sha256 text NOT NULL CHECK (document_sha256 ~ '^[a-f0-9]{64}$'),
  canonical_receipt_sha256 text NOT NULL CHECK (canonical_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issuer_id, event_id)
);
-- One issuer/event id must never be accepted twice, including across tenants.
ALTER TABLE usa_esign_ci.signed_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON usa_esign_ci.signed_receipts
  FROM PUBLIC, usa_esign_anon_ci, usa_esign_authenticated_ci;

CREATE FUNCTION usa_esign_ci.insert_new_receipt_pair(
  p_tenant uuid, p_issuer text, p_actor text, p_document_sha text,
  p_view uuid, p_intent uuid, p_view_time timestamptz, p_intent_time timestamptz,
  p_view_receipt_sha text, p_intent_receipt_sha text
) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE inserted integer;
BEGIN
  IF p_tenant IS NULL OR p_issuer IS NULL OR p_actor IS NULL
     OR p_document_sha !~ '^[a-f0-9]{64}$'
     OR p_view_receipt_sha !~ '^[a-f0-9]{64}$'
     OR p_intent_receipt_sha !~ '^[a-f0-9]{64}$'
     OR p_view IS NULL OR p_intent IS NULL OR p_view = p_intent
     OR p_view_time IS NULL OR p_intent_time IS NULL
     OR p_view_time >= p_intent_time THEN
    RAISE EXCEPTION 'invalid evidence pair';
  END IF;

  INSERT INTO usa_esign_ci.signed_receipts
    (tenant_id,issuer_id,actor_id,event_id,event_kind,document_sha256,canonical_receipt_sha256,occurred_at)
  VALUES
    (p_tenant,p_issuer,p_actor,p_view,'document_viewed',p_document_sha,p_view_receipt_sha,p_view_time),
    (p_tenant,p_issuer,p_actor,p_intent,'sign_intent_recorded',p_document_sha,p_intent_receipt_sha,p_intent_time)
  ON CONFLICT (issuer_id,event_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted <> 2 THEN
    -- Abort the WHOLE function call, including a possible partial insert.
    RAISE EXCEPTION 'duplicate evidence receipt' USING ERRCODE='23505';
  END IF;
  RETURN inserted;
END
$$;
REVOKE ALL ON FUNCTION usa_esign_ci.insert_new_receipt_pair(
 uuid,text,text,text,uuid,uuid,timestamptz,timestamptz,text,text)
 FROM PUBLIC, usa_esign_anon_ci, usa_esign_authenticated_ci;

-- Exact synthetic evidence only.
DO $test$
DECLARE
 t uuid := '11111111-1111-4111-8111-111111111111';
 t2 uuid := '22222222-2222-4222-8222-222222222222';
 v uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 i uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 v2 uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 i2 uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 n integer; denied boolean; count_events bigint;
BEGIN
 IF pg_catalog.has_table_privilege('usa_esign_anon_ci','usa_esign_ci.signed_receipts','INSERT')
    OR pg_catalog.has_table_privilege('usa_esign_authenticated_ci','usa_esign_ci.signed_receipts','SELECT')
    OR pg_catalog.has_function_privilege(
       'usa_esign_authenticated_ci',
       'usa_esign_ci.insert_new_receipt_pair(uuid,text,text,text,uuid,uuid,timestamptz,timestamptz,text,text)',
       'EXECUTE') THEN
    RAISE EXCEPTION 'client privileges exposed';
 END IF;
 SELECT usa_esign_ci.insert_new_receipt_pair(
   t,'issuer_syn','actor_syn',repeat('a',64),v,i,
   '2026-10-26 10:00:00+00','2026-10-26 10:05:00+00',repeat('1',64),repeat('2',64))
 INTO n;
 IF n <> 2 THEN RAISE EXCEPTION 'first two new receipts not inserted'; END IF;

 denied := false;
 BEGIN
   PERFORM usa_esign_ci.insert_new_receipt_pair(
     t,'issuer_syn','actor_syn',repeat('a',64),v,i,
     '2026-10-26 10:00:00+00','2026-10-26 10:05:00+00',repeat('1',64),repeat('2',64));
 EXCEPTION WHEN unique_violation THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'same event replay accepted'; END IF;

 denied := false;
 BEGIN
   PERFORM usa_esign_ci.insert_new_receipt_pair(
     t2,'issuer_syn','actor_syn',repeat('a',64),v,i,
     '2026-10-26 10:00:00+00','2026-10-26 10:05:00+00',repeat('1',64),repeat('2',64));
 EXCEPTION WHEN unique_violation THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'cross-tenant event replay accepted'; END IF;

 -- Already-inserted VIEW event must not cause the INTENT to appear on a
 -- partial conflict: a two-row function call either succeeds or rolls back.
 INSERT INTO usa_esign_ci.signed_receipts
  (tenant_id,issuer_id,actor_id,event_id,event_kind,document_sha256,canonical_receipt_sha256,occurred_at)
 VALUES(t,'issuer_syn','actor_syn',v2,'document_viewed',repeat('a',64),repeat('3',64),'2026-10-26 11:00:00+00');
 denied := false;
 BEGIN
   PERFORM usa_esign_ci.insert_new_receipt_pair(
     t,'issuer_syn','actor_syn',repeat('a',64),v2,i2,
     '2026-10-26 11:00:00+00','2026-10-26 11:05:00+00',repeat('3',64),repeat('4',64));
 EXCEPTION WHEN unique_violation THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'partial receipt pair conflict accepted'; END IF;
 IF EXISTS(SELECT 1 FROM usa_esign_ci.signed_receipts WHERE event_id=i2) THEN
   RAISE EXCEPTION 'partial receipt intent was incorrectly persisted';
 END IF;

 SELECT count(*) INTO count_events FROM usa_esign_ci.signed_receipts;
 IF count_events <> 3 THEN RAISE EXCEPTION 'expected exactly 3 synthetic events, got %',count_events; END IF;
 RAISE NOTICE 'PASS: atomic receipt pair, replay, cross-tenant replay, partial conflicts and no client grants';
END
$test$;
ROLLBACK;
-- ROLLBACK also drops all synthetic schema, roles and test rows.
