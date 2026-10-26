"""DocWallet USA: concurrent receipt replay check in disposable PG17 only."""
import os
import subprocess
import time

assert os.environ.get("PGPASSWORD") == "synthetic_test_only"
assert os.environ.get("PGOPTIONS") == "-c app.usa_ephemeral_contract_ci=SYNTHETIC_ONLY"
BASE = ["psql", "-X", "-h", "localhost", "-U", "postgres", "-d",
        "usa_contract_ci", "-At", "-v", "ON_ERROR_STOP=1"]
VIEW = "11111111-1111-4111-8111-111111111111"
INTENT = "22222222-2222-4222-8222-222222222222"

def sql(q: str, timeout: int = 12) -> subprocess.CompletedProcess[str]:
    return subprocess.run(BASE + ["-c", q], check=False,
                          capture_output=True, text=True, timeout=timeout)

receipt = (
    "SELECT usa_esign_race_ci.insert_pair('synthetic_issuer',"
    f"'{VIEW}','{INTENT}',repeat('a',64),repeat('b',64));"
)
writer = subprocess.Popen(
    BASE + ["-c", f"BEGIN; {receipt} SELECT pg_sleep(6); COMMIT;"],
    text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
)
try:
    observed = False
    for _ in range(45):
        active = sql(
            "SELECT count(*) FROM pg_stat_activity "
            "WHERE pid <> pg_backend_pid() AND wait_event='PgSleep' "
            "AND query LIKE '%usa_esign_race_ci.insert_pair%';"
        )
        assert active.returncode == 0, active.stderr
        if active.stdout.strip() == "1":
            observed = True
            break
        if writer.poll() is not None:
            raise AssertionError("Receipt issuer transaction ended before race test")
        time.sleep(.1)
    assert observed, "Failed to observe active transaction holding event uniqueness constraint"

    # Conflicting INSERT ... ON CONFLICT must WAIT for the still uncommitted
    # issuer/event keys; it cannot claim success in a second connection.
    concurrent = sql("SET lock_timeout='1000ms'; " + receipt)
    assert concurrent.returncode != 0, concurrent.stdout
    assert "lock timeout" in concurrent.stderr, concurrent.stderr

    stdout, stderr = writer.communicate(timeout=12)
    assert writer.returncode == 0, stderr + stdout
    assert "\n2\n" in "\n" + stdout, stdout

    replay = sql(receipt)
    assert replay.returncode != 0, replay.stdout
    assert "receipt replay denied" in replay.stderr, replay.stderr

    rows = sql("SELECT count(*) FROM usa_esign_race_ci.events;")
    assert rows.returncode == 0, rows.stderr
    assert rows.stdout.strip() == "2", rows.stdout
    print("PASS: concurrent uncommitted receipt pair blocks duplicate writer, "
          "replay after commit fails, and exactly two records persist")
finally:
    if writer.poll() is None:
        writer.kill()
        writer.communicate(timeout=3)
