import { useState, type ChangeEvent } from 'react';
import './USHashTool.css';

/** Client-side SHA-256 demonstration only. No upload, persistence or server fetch. */
export default function USHashTool() {
  const [hash, setHash] = useState('');
  const [filename, setFilename] = useState('');
  const [expected, setExpected] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function hashFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setHash(''); setFilename(''); setStatus('');
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setStatus('Choose a file under 20 MB for this browser-only demonstration.');
      event.target.value = '';
      return;
    }
    if (!globalThis.crypto?.subtle) {
      setStatus('This browser does not support secure SHA-256 hashing here.');
      return;
    }
    setBusy(true);
    try {
      const bytes = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const value = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      setHash(value);
      setFilename(file.name);
      setStatus('SHA-256 calculated locally. Your document was not uploaded.');
    } catch {
      setStatus('Could not calculate the hash. Try another file.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  const normalized = expected.trim().toLowerCase();
  const formatValid = normalized.length === 0 || /^[a-f0-9]{64}$/.test(normalized);
  const match = normalized && formatValid && hash ? normalized === hash : null;

  return <section className="avuh" aria-label="Local document integrity tool">
    <div className="avuh-copy">
      <p className="avus-eyebrow">Interactive USA document demo</p>
      <h2>Check a document's digital fingerprint.</h2>
      <p>Generate a SHA-256 hash of a sample file directly in your browser, or compare it with a known hash. No document contents are transmitted or stored by this preview.</p>
      <p><strong>Important:</strong> matching hashes indicate byte-for-byte integrity relative to a trusted reference. They do not prove the identity of a signer or the legal validity of an electronic signature.</p>
    </div>
    <div className="avuh-tool">
      <label>Choose a non-confidential file (20 MB max)
        <input type="file" onChange={hashFile} disabled={busy} />
      </label>
      {filename && <p><strong>File:</strong> {filename}</p>}
      {hash && <><label>SHA-256 fingerprint<textarea rows={3} readOnly value={hash} aria-label="Calculated SHA-256" /></label>
        <button type="button" onClick={async () => {
          try { await navigator.clipboard.writeText(hash); setStatus('Hash copied to clipboard.'); }
          catch { setStatus('Copy unavailable. Select the fingerprint above manually.'); }
        }}>Copy fingerprint</button></>}
      <label>Compare with a known SHA-256 (optional)
        <input type="text" spellCheck={false} inputMode="text" maxLength={64} value={expected} onChange={event => setExpected(event.target.value)} placeholder="Paste a trusted 64-character hex digest" />
      </label>
      {!formatValid && <p className="avuh-error">SHA-256 must contain 64 hexadecimal characters.</p>}
      {match !== null && <p className={match ? 'avuh-ok' : 'avuh-error'} role="status">{match ? 'Hashes match: file bytes match the provided reference.' : 'Hashes do not match: file bytes differ from the reference.'}</p>}
      {status && <p role="status">{status}</p>}
      {busy && <p role="status">Calculating locally...</p>}
    </div>
  </section>;
}
