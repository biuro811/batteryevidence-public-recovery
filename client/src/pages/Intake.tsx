import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileUp, Loader2, ShieldAlert } from "lucide-react";

type Document = { id: string; originalName: string; bytes: number; sha256: string; createdAt: string; status: string; rejectionReason?: string };

function recoverToken(reference: string) {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const incoming = fragment.get("token");
  const key = `batterydocs-order-token:${reference}`;
  if (incoming) { sessionStorage.setItem(key, incoming); history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); return incoming; }
  return sessionStorage.getItem(key) || "";
}

export default function Intake() {
  const reference = useMemo(() => new URLSearchParams(window.location.search).get("reference") || "", []);
  const [token, setToken] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState("Loading private intake…");
  const [busy, setBusy] = useState(false);

  const load = async (known = token) => {
    if (!reference || !known) { setMessage("This intake link is incomplete or has expired. Please contact BatteryDocs."); return; }
    const response = await fetch(`/api/intake?reference=${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${known}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(payload.message || payload.error || "Private intake is unavailable."); return; }
    setDocuments(payload.documents || []); setMessage(payload.notice || "");
  };
  useEffect(() => { const value = reference ? recoverToken(reference) : ""; setToken(value); void load(value); }, [reference]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/intake?reference=${encodeURIComponent(reference)}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": file.type || "application/octet-stream", "x-file-name": encodeURIComponent(file.name) }, body: file });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Upload was not accepted.");
      setMessage(`${file.name} was uploaded to private quarantine and awaits manual review.`);
      await load(token);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  };

  return <main className="min-h-screen bg-[#f5f4ee] px-5 py-10 text-[#122019] sm:px-8"><div className="mx-auto max-w-3xl"><a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1725d1] hover:underline"><ArrowLeft className="size-4" />BatteryDocs</a><div className="mt-8 rounded-[2rem] border border-[#122019]/12 bg-white p-6 shadow-[10px_10px_0_rgba(23,37,209,.12)] sm:p-10"><p className="bd-kicker text-[#1725d1]">PRIVATE POST-PAYMENT INTAKE · {reference || "REFERENCE REQUIRED"}</p><h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-.07em]">Controlled document intake</h1><div className="mt-6 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><p>Use only for the agreed document manifest. Files enter private quarantine and require a manual security review before operations can open them. This deployment does not claim automated malware scanning. Do not upload passwords, executable files, special-category personal data or material outside the agreed scope.</p></div>{message && <p className="mt-6 rounded-xl bg-[#f5f4ee] p-4 text-sm leading-6 text-[#122019]/70">{message}</p>}<label className="bd-button mt-6 cursor-pointer bg-[#1725d1] text-white">{busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}Select PDF, XLSX or CSV (max 10 MB)<input className="hidden" type="file" accept=".pdf,.xlsx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" disabled={busy} onChange={upload} /></label><div className="mt-10 border-t border-[#122019]/10 pt-7"><h2 className="font-display text-2xl font-extrabold tracking-[-.05em]">Intake register</h2>{documents.length === 0 ? <p className="mt-4 text-sm text-[#122019]/60">No documents have been received through this private link.</p> : <div className="mt-5 space-y-3">{documents.map(document => <article key={document.id} className="rounded-xl border border-[#122019]/10 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{document.originalName}</p><p className="mt-1 text-xs text-[#122019]/55">{(document.bytes / 1024).toFixed(1)} KB · SHA-256 {document.sha256.slice(0, 14)}…</p></div><span className="rounded-full bg-[#f5f4ee] px-3 py-1 text-xs font-bold text-[#122019]/65">{document.status.replaceAll("_", " ")}</span></div>{document.rejectionReason && <p className="mt-3 text-sm text-red-700">{document.rejectionReason}</p>}</article>)}</div>}</div></div></div></main>;
}
