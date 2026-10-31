import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, FileText, Loader2, ShieldCheck } from "lucide-react";

type OrderData = {
  id: string;
  title: string;
  scopeSummary: string;
  serviceRoute: string;
  amountCents: number;
  currency: string;
  status: string;
  termsVersion: string;
  expiresAt: string;
  orderFormAcceptedAt?: string;
  paymentReceivedAt?: string;
  paymentClearedAt?: string;
  intakeReleasedAt?: string;
};

function tokenFromLocation(reference: string) {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = params.get("token");
  const key = `batterydocs-order-token:${reference}`;
  if (token) {
    sessionStorage.setItem(key, token);
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    return token;
  }
  return sessionStorage.getItem(key) || "";
}

export default function Order() {
  const reference = useMemo(() => new URLSearchParams(window.location.search).get("reference") || "", []);
  const [token, setToken] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [acceptedBy, setAcceptedBy] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Loading the private Order Form…");

  const load = async (knownToken?: string) => {
    const useToken = knownToken ?? token;
    if (!reference || !useToken) { setMessage("This private order link is incomplete or has expired. Please ask your BatteryDocs contact for a new link."); return; }
    const response = await fetch(`/api/orders/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${useToken}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(payload.message || payload.error || "The private order could not be opened."); return; }
    setOrder(payload.order); setMessage("");
  };

  useEffect(() => { const value = reference ? tokenFromLocation(reference) : ""; setToken(value); void load(value); }, [reference]);

  const acceptOrder = async () => {
    if (!accepted || !acceptedBy.trim() || !token) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(reference)}`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "accept_order_form", accepted: true, acceptedBy }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Order Form acceptance failed.");
      setOrder(payload.order);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Order Form acceptance failed."); }
    finally { setBusy(false); }
  };

  const checkout = async () => {
    if (!token) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(reference)}`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "create_test_checkout" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Checkout is not available.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout is not available."); }
    finally { setBusy(false); }
  };

  const euro = order ? new Intl.NumberFormat("en-IE", { style: "currency", currency: order.currency.toUpperCase() }).format(order.amountCents / 100) : "";
  const paid = ["paid", "payment_cleared", "intake_released", "active"].includes(order?.status || "");
  const intakeReady = ["intake_released", "active"].includes(order?.status || "");

  return <main className="min-h-screen bg-[#f5f4ee] px-5 py-10 text-[#122019] sm:px-8 lg:px-12"><div className="mx-auto max-w-3xl"><a className="inline-flex items-center gap-2 text-sm font-bold text-[#1725d1] hover:underline" href="/"><ArrowLeft className="size-4" />BatteryDocs</a><div className="mt-8 rounded-[2rem] border border-[#122019]/12 bg-white p-6 shadow-[10px_10px_0_rgba(23,37,209,.12)] sm:p-10">{!order ? <div className="py-10 text-center"><Loader2 className="mx-auto size-7 animate-spin text-[#1725d1]" /><p className="mt-5 text-sm text-[#122019]/65">{message}</p></div> : <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="bd-kicker text-[#1725d1]">PRIVATE ORDER FORM · {order.id}</p><h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-.07em]">{order.title}</h1></div><span className="rounded-full bg-[#f5f4ee] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#122019]/60">{order.status.replaceAll("_", " ")}</span></div><div className="mt-8 rounded-2xl bg-[#f5f4ee] p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#122019]/55">Written scope</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#122019]/75">{order.scopeSummary}</p></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-[#122019]/50">Order Form version</dt><dd className="mt-1 font-semibold">{order.termsVersion}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[#122019]/50">Amount</dt><dd className="mt-1 font-display text-2xl font-extrabold tracking-[-.05em]">{euro}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[#122019]/50">Private link expiry</dt><dd className="mt-1 font-semibold">{new Date(order.expiresAt).toLocaleString()}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[#122019]/50">Service route</dt><dd className="mt-1 font-semibold capitalize">{order.serviceRoute}</dd></div></dl><div className="mt-8 rounded-2xl border border-[#1725d1]/15 bg-[#eef0ff] p-5 text-sm leading-6 text-[#1725d1]"><ShieldCheck className="mb-2 size-5" />BatteryDocs provides evidence review and technical-data preparation only. The order does not provide certification, legal advice, laboratory testing, Battery Passport issuance, an EU registry submission or a market-access guarantee.</div>{message && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{message}</p>}{order.status === "order_form_pending" && <section className="mt-8 border-t border-[#122019]/10 pt-8"><h2 className="font-display text-2xl font-extrabold tracking-[-.05em]">Accept the written Order Form</h2><p className="mt-2 text-sm leading-6 text-[#122019]/63">Acceptance confirms the defined scope, exclusions, amount and payment terms above. It does not open confidential-file intake.</p><label className="form-label mt-5">Authorised contact name<input className="form-control mt-2" value={acceptedBy} onChange={event => setAcceptedBy(event.target.value)} /></label><label className="mt-4 flex gap-3 text-sm leading-6 text-[#122019]/70"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 size-4 accent-[#1725d1]" />I accept this written Order Form on behalf of the customer named in the order.</label><button onClick={acceptOrder} disabled={busy || !accepted || !acceptedBy.trim()} className="bd-button mt-6 bg-[#1725d1] text-white disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}Accept Order Form</button></section>}{order.status === "order_form_accepted" || order.status === "checkout_open" ? <section className="mt-8 border-t border-[#122019]/10 pt-8"><h2 className="font-display text-2xl font-extrabold tracking-[-.05em]">Payment</h2><p className="mt-2 text-sm leading-6 text-[#122019]/63">Checkout is hosted by Stripe. This recovery deployment only enables Stripe test mode when a test-mode server secret and signed webhook are configured; no live payment is initiated here.</p><button onClick={checkout} disabled={busy} className="bd-button mt-6 bg-[#1725d1] text-white">{busy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}Open test checkout</button></section> : null}{paid && <section className="mt-8 rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mb-2 size-5 text-emerald-700" />Payment has been recorded by the verified provider event. Intake remains closed until an authorised operations review marks the payment cleared.</section>}{intakeReady && <a className="bd-button mt-8 bg-[#1725d1] text-white" href={`/intake?reference=${encodeURIComponent(order.id)}#token=${encodeURIComponent(token)}`}>Open private intake</a>}</>}</div></div></main>;
}
