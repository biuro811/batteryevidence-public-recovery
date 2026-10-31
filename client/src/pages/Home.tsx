import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Mail,
  Menu,
  ScanSearch,
  ShieldCheck,
  X,
} from "lucide-react";

type Lang = "en" | "pl" | "de";
type Service = "audit" | "closure" | "combined" | "unsure";

type Content = {
  nav: string[];
  eyebrow: string;
  heroA: string;
  heroB: string;
  intro: string;
  primary: string;
  secondary: string;
  heroNote: string;
  allModels: string;
  issueLabel: string;
  issueTitle: string;
  issueText: string;
  methodLabel: string;
  methodTitle: string;
  receiveLabel: string;
  receiveTitle: string;
  packagesLabel: string;
  packagesTitle: string;
  contactLabel: string;
  contactTitle: string;
  contactText: string;
  form: {
    route: string;
    selectRoute: string;
    name: string;
    email: string;
    company: string;
    model: string;
    issue: string;
    context: string;
    privacy: string;
    submit: string;
    pending: string;
    success: string;
    successText: string;
    error: string;
  };
  routes: Record<Service, string>;
  packageOne: string;
  packageTwo: string;
  boundary: string;
  faqLabel: string;
  faqTitle: string;
  footer: string;
};

const content: Record<Lang, Content> = {
  en: {
    nav: ["Problem", "Method", "Deliverables", "Scope", "FAQ", "Fit check"],
    eyebrow: "BATTERY DOCUMENT EVIDENCE · REGULATION (EU) 2023/1542",
    heroA: "Before the passport,",
    heroB: "prove the data.",
    intro: "BatteryDocs reviews and organises source-linked documentation for starter, UPS, portable, primary, light-means-of-transport, EV and industrial batteries—whether the immediate need is evidence readiness, supplier follow-up or Battery Passport data.",
    primary: "Choose your service route",
    secondary: "View the EU timeline",
    heroNote: "Start with a written scope check. A model number or defined problem is helpful, but not required for the first contact. Confidential files are requested only through a private post-order intake.",
    allModels: "ALL · STARTER · UPS · PORTABLE · PRIMARY · LMT · EV · INDUSTRIAL",
    issueLabel: "THE REAL BOTTLENECK",
    issueTitle: "Most companies do not have a QR-code problem.",
    issueText: "They have an evidence problem. A datasheet, declaration, spreadsheet and test report should describe the same model and revision. Often they do not. A digital passport cannot repair weak source data—it can only publish it faster.",
    methodLabel: "A DECISION-READY METHOD",
    methodTitle: "From document pile to controlled next actions.",
    receiveLabel: "WHAT YOU RECEIVE",
    receiveTitle: "Not another generic readiness score.",
    packagesLabel: "TWO SERVICE ROUTES",
    packagesTitle: "Start with diagnosis—or go directly to evidence closure.",
    contactLabel: "REQUEST A FIT CHECK",
    contactTitle: "Choose the route that matches your evidence position.",
    contactText: "Tell us who you are and choose a service route—or ask us to recommend one. A model number and defined evidence issue are helpful but optional at first contact. Do not attach confidential documents at this stage.",
    form: { route: "Service route *", selectRoute: "Select a route", name: "Name *", email: "Work email *", company: "Company *", model: "Battery model or configuration (optional)", issue: "Main evidence problem or decision (optional)", context: "Optional context", privacy: "I have read the Privacy Notice and want YFG to use these details to respond and take the requested pre-contractual steps.", submit: "Open email draft", pending: "Opening email draft…", success: "Email draft opened", successText: "Review the draft and send it to YFG. This website does not retain the form details.", error: "Your email app could not be opened. Please email office@yfgglobal.com." },
    routes: { audit: "Package 1 — Readiness & Evidence Audit", closure: "Package 2 — Evidence Closure & Technical Data Pack", combined: "Package 1 + 2 — audit, then evidence closure", unsure: "Not sure — recommend the starting point" },
    packageOne: "For a company that needs to determine applicability, ownership and the real state of its source evidence.",
    packageTwo: "For a defined set of evidence gaps, suppliers and documents after an intake review.",
    boundary: "BatteryDocs does not currently sell certification, legal advice, laboratory testing, Digital Product Passport issuance, EU registry submission, production DPP hosting, QR/UPI resolver operation or guaranteed platform export.",
    faqLabel: "SCOPE & ACCEPTANCE FAQ",
    faqTitle: "Know what is included before you order.",
    footer: "BatteryDocs Readiness & Evidence services are provided by Y.F.G. GENESIS spółka z ograniczoną odpowiedzialnością · Łódź, Poland.",
  },
  pl: {
    nav: ["Problem", "Metoda", "Rezultat", "Zakres", "FAQ", "Sprawdź zakres"],
    eyebrow: "DOWODY DLA BATERII · ROZPORZĄDZENIE (UE) 2023/1542",
    heroA: "Najpierw dowody.",
    heroB: "Potem paszport.",
    intro: "BatteryDocs porządkuje dokumentację powiązaną ze źródłami dla akumulatorów rozruchowych, UPS, przenośnych, pierwotnych, LMT, EV i przemysłowych — dla gotowości dowodowej, korespondencji z dostawcą lub danych do Battery Passport.",
    primary: "Wybierz ścieżkę usługi",
    secondary: "Zobacz harmonogram UE",
    heroNote: "Zacznij od pisemnego sprawdzenia zakresu. Numer modelu lub opis problemu są pomocne, ale nie są wymagane przy pierwszym kontakcie. Poufne pliki są przyjmowane wyłącznie prywatnie po zamówieniu.",
    allModels: "WSZYSTKIE · ROZRUCHOWE · UPS · PRZENOŚNE · PIERWOTNE · LMT · EV · PRZEMYSŁOWE",
    issueLabel: "PRAWDZIWE WĄSKIE GARDŁO",
    issueTitle: "Większość firm nie ma problemu z kodem QR.",
    issueText: "Ma problem z dowodami. Karta katalogowa, deklaracja, arkusz i raport z badań powinny opisywać ten sam model oraz rewizję. Często tak nie jest. Cyfrowy paszport nie naprawi słabych danych źródłowych — może je tylko szybciej opublikować.",
    methodLabel: "METODA DO PODJĘCIA DECYZJI",
    methodTitle: "Od stosu dokumentów do kontrolowanych działań.",
    receiveLabel: "CO OTRZYMUJESZ",
    receiveTitle: "Nie kolejny ogólny wynik gotowości.",
    packagesLabel: "DWA KIERUNKI USŁUG",
    packagesTitle: "Zacznij od diagnozy — albo od razu od zamykania luk dowodowych.",
    contactLabel: "POPROŚ O FIT CHECK",
    contactTitle: "Wybierz ścieżkę zgodną z obecnym stanem dowodów.",
    contactText: "Powiedz, kim jesteś i wybierz interesującą usługę — albo poproś o rekomendację. Numer modelu i opis problemu są pomocne, ale opcjonalne. Nie dołączaj na tym etapie poufnych dokumentów.",
    form: { route: "Ścieżka usługi *", selectRoute: "Wybierz ścieżkę", name: "Imię i nazwisko *", email: "Email służbowy *", company: "Firma *", model: "Model lub konfiguracja baterii (opcjonalnie)", issue: "Główny problem dowodowy lub decyzja (opcjonalnie)", context: "Opcjonalny kontekst", privacy: "Zapoznałem(-am) się z Informacją o prywatności i chcę, aby YFG użyła tych danych do odpowiedzi oraz żądanych działań przedumownych.", submit: "Otwórz szkic wiadomości", pending: "Otwieranie szkicu wiadomości…", success: "Szkic wiadomości został otwarty", successText: "Sprawdź wiadomość i wyślij ją do YFG. Strona nie zapisuje danych z tego formularza.", error: "Nie można było otworzyć programu pocztowego. Napisz na office@yfgglobal.com." },
    routes: { audit: "Pakiet 1 — Audyt gotowości i dowodów", closure: "Pakiet 2 — Zamykanie luk i pakiet danych technicznych", combined: "Pakiet 1 + 2 — audyt, potem zamykanie luk", unsure: "Nie wiem — proszę o rekomendację" },
    packageOne: "Dla firmy, która musi ustalić zastosowanie regulacji, odpowiedzialność i rzeczywisty stan dokumentów źródłowych.",
    packageTwo: "Dla zdefiniowanego zestawu luk, dostawców i dokumentów po przeglądzie intake.",
    boundary: "BatteryDocs nie oferuje obecnie certyfikacji, porad prawnych, badań laboratoryjnych, wydania Digital Product Passport, zgłoszeń do rejestru UE, produkcyjnego hostingu DPP, resolvera QR/UPI ani gwarantowanego eksportu na platformę.",
    faqLabel: "FAQ: ZAKRES I ODBIÓR",
    faqTitle: "Poznaj zakres przed złożeniem zamówienia.",
    footer: "Usługi BatteryDocs Readiness & Evidence świadczy Y.F.G. GENESIS spółka z ograniczoną odpowiedzialnością · Łódź, Polska.",
  },
  de: {
    nav: ["Problem", "Methode", "Ergebnis", "Umfang", "FAQ", "Umfang prüfen"],
    eyebrow: "BATTERIEDOKUMENTATION · VERORDNUNG (EU) 2023/1542",
    heroA: "Zuerst Nachweise.",
    heroB: "Dann der Pass.",
    intro: "BatteryDocs prüft und ordnet quellenverknüpfte Dokumentation für Starter-, USV-, tragbare, Primär-, LMT-, EV- und Industriebatterien — für Nachweisbereitschaft, Lieferantenkommunikation oder Battery-Passport-Daten.",
    primary: "Leistungsweg wählen",
    secondary: "EU-Zeitplan ansehen",
    heroNote: "Starten Sie mit einer schriftlichen Umfangsprüfung. Modellnummer oder klar beschriebenes Problem sind hilfreich, aber beim ersten Kontakt nicht erforderlich. Vertrauliche Dateien werden erst über einen privaten Zugang nach Auftrag angenommen.",
    allModels: "ALLE · STARTER · USV · TRAGBAR · PRIMÄR · LMT · EV · INDUSTRIE",
    issueLabel: "DER EIGENTLICHE ENGPass",
    issueTitle: "Die meisten Unternehmen haben kein QR-Code-Problem.",
    issueText: "Sie haben ein Nachweisproblem. Datenblatt, Erklärung, Tabelle und Prüfbericht sollten dasselbe Modell und dieselbe Revision beschreiben. Oft ist das nicht der Fall. Ein digitaler Pass repariert schwache Quelldaten nicht — er veröffentlicht sie nur schneller.",
    methodLabel: "ENTSCHEIDUNGSREIFE METHODE",
    methodTitle: "Vom Dokumentenstapel zu kontrollierten nächsten Schritten.",
    receiveLabel: "WAS SIE ERHALTEN",
    receiveTitle: "Keinen weiteren allgemeinen Readiness-Score.",
    packagesLabel: "ZWEI LEISTUNGSWEGE",
    packagesTitle: "Mit Diagnose beginnen — oder direkt Nachweislücken schließen.",
    contactLabel: "FIT CHECK ANFRAGEN",
    contactTitle: "Wählen Sie den Weg, der zu Ihrer Nachweislage passt.",
    contactText: "Sagen Sie uns, wer Sie sind, und wählen Sie einen Leistungsweg — oder bitten Sie um eine Empfehlung. Modellnummer und Nachweisproblem sind beim ersten Kontakt optional. Bitte fügen Sie noch keine vertraulichen Dokumente bei.",
    form: { route: "Leistungsweg *", selectRoute: "Weg auswählen", name: "Name *", email: "Geschäftliche E-Mail *", company: "Unternehmen *", model: "Batteriemodell oder Konfiguration (optional)", issue: "Wichtigstes Nachweisproblem oder Entscheidung (optional)", context: "Optionaler Kontext", privacy: "Ich habe die Datenschutzerklärung gelesen und möchte, dass YFG diese Angaben für die Antwort und die gewünschten vorvertraglichen Schritte verwendet.", submit: "E-Mail-Entwurf öffnen", pending: "E-Mail-Entwurf wird geöffnet…", success: "E-Mail-Entwurf geöffnet", successText: "Bitte prüfen Sie den Entwurf und senden Sie ihn an YFG. Die Website speichert diese Formulardaten nicht.", error: "Ihr E-Mail-Programm konnte nicht geöffnet werden. Bitte schreiben Sie an office@yfgglobal.com." },
    routes: { audit: "Paket 1 — Bereitschafts- und Nachweisaudit", closure: "Paket 2 — Nachweislückenschließung & technisches Datenpaket", combined: "Paket 1 + 2 — Audit, dann Nachweisschließung", unsure: "Unsicher — bitte Einstieg empfehlen" },
    packageOne: "Für Unternehmen, die Anwendbarkeit, Verantwortung und den tatsächlichen Zustand ihrer Quelldokumentation klären müssen.",
    packageTwo: "Für einen definierten Satz von Nachweislücken, Lieferanten und Dokumenten nach einer Intake-Prüfung.",
    boundary: "BatteryDocs bietet derzeit keine Zertifizierung, Rechtsberatung, Labortests, Ausstellung eines Digital Battery Passport, EU-Registereinreichung, produktives DPP-Hosting, QR/UPI-Resolver-Betrieb oder garantierten Plattformexport an.",
    faqLabel: "FAQ: UMFANG & ABNAHME",
    faqTitle: "Klarheit über Leistung und Abnahme vor der Bestellung.",
    footer: "BatteryDocs Readiness & Evidence Services werden von Y.F.G. GENESIS spółka z ograniczoną odpowiedzialnością · Łódź, Polen erbracht.",
  },
};

const steps = [
  ["01", "Define one model", "Agree the assessed model, revision, battery category, main supplier and source manifest."],
  ["02", "Map every claim", "AI-assisted extraction accelerates review; every material finding stays linked to its source."],
  ["03", "Expose uncertainty", "Separate confirmed facts from missing evidence, conflicts, wrong-model documents and open assumptions."],
  ["04", "Request what matters", "Deliver prioritised questions and document requests for the responsible supplier or technical owner."],
];

const deliverables = [
  ["Evidence matrix", "Each assessed data point linked to the supplied source and model revision."],
  ["Gap & conflict register", "Missing evidence separated from contradictory and out-of-scope material."],
  ["Supplier request pack", "Specific questions, documents and confirmations to request next."],
  ["Priority action plan", "What to resolve first, why it matters and who should own the answer."],
  ["Access & disclosure blueprint", "A proposed audience map prepared for discussion, not technical enforcement."],
  ["Readiness brief", "A concise management view of the current evidence position and next decision."],
];

const faqs = [
  ["What does Package 1 deliver?", "For one defined battery model or configuration, Package 1 can deliver a Scope Decision, Economic Operator Map, a versioned Data & Evidence Matrix, RAG assessment, Gap Register, Evidence Request List, Priority Action Plan and recommended technical route. The written Order Form controls the final scope."],
  ["Can Package 2 start without Package 1?", "Yes, when the available Gap Register or missing-data list is sufficiently defined, versioned and attributable after intake review. Otherwise, Package 1 may be recommended first."],
  ["Does acceptance require every RED or AMBER field to turn GREEN?", "No. BatteryDocs records appropriate evidence, separately required technical work or a remaining open gap with its reason and responsible owner. Certification, regulatory approval and market access are not promised."],
  ["Can we upload supplier documents on this website?", "No. The public form is text-only. After a written proposal, mutual Order Form acceptance and cleared payment, an authorised contact may receive a separate private intake for the agreed document manifest."],
];

function languageFromPath(): Lang {
  if (typeof window === "undefined") return "en";
  if (window.location.pathname.startsWith("/pl")) return "pl";
  if (window.location.pathname.startsWith("/de")) return "de";
  return "en";
}

function languagePath(language: Lang) {
  return language === "en" ? "/" : `/${language}`;
}

export default function Home() {
  const [language] = useState<Lang>(languageFromPath);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    serviceInterest: "" as Service | "",
    name: "",
    workEmail: "",
    company: "",
    batteryModel: "",
    evidenceIssue: "",
    context: "",
    privacyAccepted: false,
    website: "",
  });
  const [emailDraftOpened, setEmailDraftOpened] = useState(false);
  const t = content[language];

  const update = (field: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [field]: value }));
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.serviceInterest || !form.privacyAccepted) return;
    const route = t.routes[form.serviceInterest as Service];
    const subject = `BatteryDocs scope check — ${route}`;
    const body = [
      "BatteryDocs scope-check enquiry",
      "",
      `Service route: ${route}`,
      `Name: ${form.name}`,
      `Work email: ${form.workEmail}`,
      `Company: ${form.company}`,
      `Battery model/configuration: ${form.batteryModel || "Not provided"}`,
      `Evidence issue: ${form.evidenceIssue || "Not provided"}`,
      `Context: ${form.context || "Not provided"}`,
      "",
      "I confirm that I have not included confidential files, passwords or sensitive information."
    ].join("\n");
    window.location.href = `mailto:office@yfgglobal.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setEmailDraftOpened(true);
  };

  const navLinks = [["#problem", t.nav[0]], ["#method", t.nav[1]], ["#deliverables", t.nav[2]], ["#scope", t.nav[3]], ["#faq", t.nav[4]], ["#contact", t.nav[5]]];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f4ee] text-[#122019]">
      <header className="sticky top-0 z-50 border-b border-[#122019]/10 bg-[#f5f4ee]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href={languagePath(language)} className="group flex items-center gap-3" aria-label="BatteryDocs home">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1725d1] text-sm font-black text-white shadow-[3px_3px_0_#ffdc59]">BD</span>
            <span><span className="block font-display text-lg font-extrabold tracking-[-.06em]">BatteryDocs</span><span className="block text-[9px] font-bold tracking-[.15em] text-[#122019]/50">BY Y.F.G. GENESIS</span></span>
          </a>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {navLinks.map(([href, label]) => <a key={href} href={href} className="text-xs font-bold tracking-wide text-[#122019]/62 transition hover:text-[#1725d1]">{label}</a>)}
          </nav>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="flex rounded-full border border-[#122019]/12 p-1 text-[10px] font-bold">
              {(["en", "pl", "de"] as Lang[]).map(item => <a key={item} href={languagePath(item)} className={`rounded-full px-2 py-1 uppercase ${item === language ? "bg-[#122019] text-white" : "text-[#122019]/55 hover:text-[#122019]"}`}>{item}</a>)}
            </div>
            <a href="#contact" className="bd-button bg-[#1725d1] text-white">{t.nav[5]}<ArrowRight className="size-4" /></a>
          </div>
          <button type="button" onClick={() => setMenuOpen(value => !value)} className="grid size-10 place-items-center rounded-lg border border-[#122019]/12 sm:hidden" aria-label="Toggle menu">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
        {menuOpen && <nav className="border-t border-[#122019]/10 bg-[#f5f4ee] px-5 py-4 sm:hidden">{navLinks.map(([href, label]) => <a onClick={() => setMenuOpen(false)} className="block border-b border-[#122019]/8 py-3 text-sm font-bold" href={href} key={href}>{label}</a>)}<div className="flex gap-2 pt-4">{(["en", "pl", "de"] as Lang[]).map(item => <a key={item} href={languagePath(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${item === language ? "border-[#122019] bg-[#122019] text-white" : "border-[#122019]/16 text-[#122019]/64"}`}>{item}</a>)}</div></nav>}
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-[#122019]/10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_24%,rgba(255,220,89,.58),transparent_26rem),radial-gradient(circle_at_10%_92%,rgba(23,37,209,.16),transparent_32rem)]" />
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-22 sm:pt-24 lg:grid-cols-[1.15fr_.85fr] lg:px-12 lg:pb-28 lg:pt-30">
            <div className="max-w-3xl">
              <p className="bd-kicker text-[#1725d1]">{t.eyebrow}</p>
              <h1 className="mt-7 font-display text-[clamp(3.6rem,8vw,7.4rem)] font-extrabold leading-[.83] tracking-[-.085em]">{t.heroA}<br /><span className="text-[#1725d1]">{t.heroB}</span></h1>
              <p className="mt-9 max-w-2xl text-lg leading-8 text-[#122019]/70 sm:text-xl">{t.intro}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a href="#scope" className="bd-button bg-[#1725d1] text-white">{t.primary}<ArrowRight className="size-4" /></a>
                <a href="https://eur-lex.europa.eu/eli/reg/2023/1542/oj" target="_blank" rel="noreferrer" className="bd-button border border-[#122019]/16 bg-white/50 text-[#122019]">{t.secondary}<ArrowRight className="size-4" /></a>
              </div>
              <p className="mt-7 max-w-xl border-l-2 border-[#ffdc59] pl-4 text-sm leading-6 text-[#122019]/62">{t.heroNote}</p>
            </div>
            <div className="relative self-end rounded-[2rem] bg-[#122019] p-5 text-white shadow-[14px_14px_0_rgba(23,37,209,.18)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/12 pb-5"><span className="font-mono text-[10px] font-bold tracking-[.17em] text-[#ffdc59]">YFG-TEST-IND-002 · REV A</span><Fingerprint className="size-5 text-[#ffdc59]" /></div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[.17em] text-white/50">Illustrative Evidence Register</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                {[ ["Manufacturer", "CONFIRMED", "2 controlled sources"], ["Nominal capacity", "CONFIRMED", "Same revision"], ["Battery mass", "CONFLICT", "56.0 kg vs 59.0 kg"], ["Test report", "WRONG MODEL", "Revision B ≠ assessed model"] ].map(([field, status, source]) => <div className="grid grid-cols-[1.2fr_.8fr] gap-3 border-b border-white/8 p-3 last:border-0" key={field}><span className="text-xs font-semibold">{field}</span><span className={`text-right font-mono text-[10px] font-bold ${status === "CONFIRMED" ? "text-emerald-300" : "text-[#ffdc59]"}`}>{status}<small className="mt-1 block font-sans text-[10px] font-normal text-white/45">{source}</small></span></div>)}
              </div>
              <p className="mt-5 text-[10px] font-bold tracking-[.12em] text-white/42">SYNTHETIC ILLUSTRATION · NOT A REAL BATTERY ASSESSMENT</p>
            </div>
          </div>
          <div className="border-y border-[#122019]/10 bg-[#1725d1] px-5 py-3 text-center font-mono text-[10px] font-bold tracking-[.16em] text-white sm:text-xs">{t.allModels}</div>
        </section>

        <section id="problem" className="scroll-mt-24 border-b border-[#122019]/10 bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:px-12 lg:py-32">
            <div><p className="bd-kicker text-[#1725d1]">{t.issueLabel}</p><h2 className="mt-6 max-w-lg font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.issueTitle}</h2></div>
            <div className="max-w-2xl"><p className="text-2xl leading-9 tracking-[-.035em] text-[#122019]/74 sm:text-3xl">{t.issueText}</p><div className="mt-10 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-[#f5f4ee] p-5"><p className="font-display text-4xl font-extrabold tracking-[-.08em] text-[#1725d1]">71</p><p className="mt-2 text-xs font-bold leading-5 text-[#122019]/55">working-matrix fields</p></div><div className="rounded-2xl bg-[#f5f4ee] p-5"><p className="font-display text-4xl font-extrabold tracking-[-.08em] text-[#1725d1]">100%</p><p className="mt-2 text-xs font-bold leading-5 text-[#122019]/55">source-linked findings</p></div><div className="rounded-2xl bg-[#ffdc59] p-5"><p className="font-display text-4xl font-extrabold tracking-[-.08em] text-[#122019]">1</p><p className="mt-2 text-xs font-bold leading-5 text-[#122019]/65">defined model at a time</p></div></div></div>
          </div>
        </section>

        <section id="method" className="scroll-mt-24 border-b border-[#122019]/10">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32"><p className="bd-kicker text-[#1725d1]">{t.methodLabel}</p><h2 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.methodTitle}</h2><div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[#122019]/12 bg-[#122019]/12 md:grid-cols-2 xl:grid-cols-4">{steps.map(([number, title, text]) => <article className="bg-[#f5f4ee] p-6 sm:p-7" key={number}><span className="font-mono text-xs font-black text-[#1725d1]">{number}</span><h3 className="mt-12 font-display text-2xl font-extrabold tracking-[-.05em]">{title}</h3><p className="mt-4 text-sm leading-6 text-[#122019]/62">{text}</p></article>)}</div></div>
        </section>

        <section id="deliverables" className="scroll-mt-24 border-b border-[#122019]/10 bg-[#122019] text-white">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-12 lg:py-32"><div><p className="bd-kicker text-[#ffdc59]">{t.receiveLabel}</p><h2 className="mt-6 font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.receiveTitle}</h2><p className="mt-7 max-w-sm text-lg leading-7 text-white/64">A compact evidence package your technical and compliance teams can act on.</p></div><div className="grid gap-3 sm:grid-cols-2">{deliverables.map(([title, text], index) => <article className="rounded-2xl border border-white/12 bg-white/5 p-6" key={title}><p className="font-mono text-[10px] font-bold tracking-[.15em] text-[#ffdc59]">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-8 font-display text-2xl font-extrabold tracking-[-.045em]">{title}</h3><p className="mt-3 text-sm leading-6 text-white/62">{text}</p></article>)}</div></div>
        </section>

        <section className="border-b border-[#122019]/10 bg-white"><div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.85fr] lg:px-12 lg:py-32"><div><p className="bd-kicker text-[#1725d1]">NAMED RESPONSIBILITY</p><h2 className="mt-6 font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">Meet the people behind the evidence.</h2><p className="mt-7 max-w-xl text-lg leading-7 text-[#122019]/63">BatteryDocs combines executive accountability, project coordination and technical review. Every engagement remains human-led, source-linked and bounded by the written Order Form.</p></div><div className="space-y-3">{[["Oleksandr Barannykov", "President of the Management Board", "Executive oversight and client accountability."], ["Natalia Dwornicka", "Manager", "Project coordination and client communication."], ["Yevhen Barannykov", "Technical Director", "Technical review and evidence-workflow oversight."]].map(([name, role, text]) => <article className="rounded-2xl border border-[#122019]/10 p-6" key={name}><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#1725d1]">{role}</p><h3 className="mt-2 font-display text-2xl font-extrabold tracking-[-.045em]">{name}</h3><p className="mt-2 text-sm text-[#122019]/58">{text}</p></article>)}</div></div></section>

        <section id="scope" className="scroll-mt-24 border-b border-[#122019]/10"><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32"><p className="bd-kicker text-[#1725d1]">{t.packagesLabel}</p><h2 className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.packagesTitle}</h2><div className="mt-14 grid gap-5 lg:grid-cols-2"><article className="rounded-[2rem] bg-[#1725d1] p-7 text-white sm:p-10"><p className="font-mono text-[10px] font-bold tracking-[.16em] text-[#ffdc59]">PACKAGE 1</p><h3 className="mt-5 font-display text-4xl font-extrabold leading-none tracking-[-.07em]">Readiness & Evidence Audit</h3><p className="mt-6 text-base leading-7 text-white/74">{t.packageOne}</p><ul className="mt-8 space-y-3 text-sm text-white/82">{["Scope Decision & Economic Operator Map", "Versioned 71-field Data & Evidence Matrix", "RAG assessment, Gap Register & Evidence Request List", "Priority Action Plan and recommended technical route"].map(item => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#ffdc59]" />{item}</li>)}</ul><a href="#contact" className="bd-button mt-9 bg-[#ffdc59] text-[#122019]">Request an audit<ArrowRight className="size-4" /></a></article><article className="rounded-[2rem] border border-[#122019]/12 bg-white p-7 sm:p-10"><p className="font-mono text-[10px] font-bold tracking-[.16em] text-[#1725d1]">PACKAGE 2</p><h3 className="mt-5 font-display text-4xl font-extrabold leading-none tracking-[-.07em]">Evidence Closure & Technical Data Pack</h3><p className="mt-6 text-base leading-7 text-[#122019]/66">{t.packageTwo}</p><ul className="mt-8 space-y-3 text-sm text-[#122019]/72">{["Requests grouped into six evidence workstreams", "Supplier/client follow-up and controlled document register", "Version, owner, date, source and SHA-256 integrity record", "Updated matrix, Technical Data Pack, provenance register and QA handover"].map(item => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#1725d1]" />{item}</li>)}</ul><a href="#contact" className="bd-button mt-9 border border-[#122019]/14 text-[#122019]">Request a data-pack quote<ArrowRight className="size-4" /></a></article></div><div className="mt-8 flex gap-4 rounded-2xl border border-[#122019]/10 bg-[#ffdc59]/40 p-5 text-sm leading-6 text-[#122019]/72"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#1725d1]" /><p>{t.boundary}</p></div></div></section>

        <section id="faq" className="scroll-mt-24 border-b border-[#122019]/10 bg-white"><div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.74fr_1.26fr] lg:px-12 lg:py-32"><div><p className="bd-kicker text-[#1725d1]">{t.faqLabel}</p><h2 className="mt-6 font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.faqTitle}</h2></div><div className="border-t border-[#122019]/12">{faqs.map(([question, answer], index) => <details className="group border-b border-[#122019]/12" key={question}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 [&::-webkit-details-marker]:hidden"><span className="flex gap-4"><span className="mt-1 font-mono text-xs font-bold text-[#1725d1]">{String(index + 1).padStart(2, "0")}</span><span className="font-display text-xl font-extrabold tracking-[-.045em] sm:text-2xl">{question}</span></span><ChevronDown className="size-5 shrink-0 text-[#1725d1] transition group-open:rotate-180" /></summary><p className="pb-7 pl-9 text-sm leading-7 text-[#122019]/64">{answer}</p></details>)}</div></div></section>

        <section id="contact" className="scroll-mt-24 bg-[#f5f4ee]"><div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12 lg:py-32"><div><p className="bd-kicker text-[#1725d1]">{t.contactLabel}</p><h2 className="mt-6 font-display text-5xl font-extrabold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.contactTitle}</h2><p className="mt-7 max-w-xl text-lg leading-7 text-[#122019]/65">{t.contactText}</p><div className="mt-10 space-y-4 rounded-2xl border border-[#122019]/10 bg-white p-5 text-sm leading-6 text-[#122019]/62"><p className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-[#1725d1]" />The public form accepts text only. Do not send confidential documents, passwords, special-category personal data, classified information or known malware.</p><p className="flex gap-3"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-[#1725d1]" />A project-specific private intake is issued only after a written proposal, mutual Order Form acceptance and cleared payment.</p><a className="inline-flex items-center gap-2 font-bold text-[#1725d1] hover:underline" href="mailto:office@yfgglobal.com"><Mail className="size-4" />office@yfgglobal.com</a></div></div>
          <form onSubmit={onSubmit} className="rounded-[2rem] border border-[#122019]/12 bg-white p-6 shadow-[10px_10px_0_rgba(23,37,209,.12)] sm:p-9">
            {emailDraftOpened ? <div className="rounded-2xl bg-[#eaf7ed] p-7"><ShieldCheck className="size-8 text-emerald-700" /><p className="mt-5 font-display text-3xl font-extrabold tracking-[-.06em] text-emerald-950">{t.form.success}</p><p className="mt-3 text-sm leading-6 text-emerald-900/70">{t.form.successText}</p><button type="button" onClick={() => { setEmailDraftOpened(false); setForm(current => ({ ...current, name: "", workEmail: "", company: "", batteryModel: "", evidenceIssue: "", context: "", privacyAccepted: false })); }} className="bd-button mt-6 bg-emerald-800 text-white">New request<ArrowRight className="size-4" /></button></div> : <>
              <div className="grid gap-5 sm:grid-cols-2"><label className="form-label sm:col-span-2">{t.form.route}<select value={form.serviceInterest} onChange={event => update("serviceInterest", event.target.value)} required className="form-control mt-2"><option value="">{t.form.selectRoute}</option>{(Object.keys(t.routes) as Service[]).map(key => <option value={key} key={key}>{t.routes[key]}</option>)}</select></label><label className="form-label">{t.form.name}<input required value={form.name} onChange={event => update("name", event.target.value)} className="form-control mt-2" /></label><label className="form-label">{t.form.email}<input required type="email" value={form.workEmail} onChange={event => update("workEmail", event.target.value)} className="form-control mt-2" /></label><label className="form-label sm:col-span-2">{t.form.company}<input required value={form.company} onChange={event => update("company", event.target.value)} className="form-control mt-2" /></label><label className="form-label sm:col-span-2">{t.form.model}<input value={form.batteryModel} onChange={event => update("batteryModel", event.target.value)} className="form-control mt-2" /></label><label className="form-label sm:col-span-2">{t.form.issue}<textarea value={form.evidenceIssue} onChange={event => update("evidenceIssue", event.target.value)} rows={3} className="form-control mt-2 resize-y" /></label><label className="form-label sm:col-span-2">{t.form.context}<textarea value={form.context} onChange={event => update("context", event.target.value)} rows={2} className="form-control mt-2 resize-y" /></label></div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f5f4ee] p-4 text-xs leading-5 text-[#122019]/67"><input required type="checkbox" checked={form.privacyAccepted} onChange={event => update("privacyAccepted", event.target.checked)} className="mt-0.5 size-4 accent-[#1725d1]" /><span>{t.form.privacy} <a href="/privacy" className="font-bold text-[#1725d1] hover:underline">Privacy Notice</a>.</span></label>
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.website} onChange={event => update("website", event.target.value)} />
              <button disabled={!form.privacyAccepted || !form.serviceInterest} className="bd-button mt-6 w-full justify-center bg-[#1725d1] text-white disabled:cursor-not-allowed disabled:opacity-50">{t.form.submit}<ArrowRight className="size-4" /></button>
            </>}
          </form>
        </div></section>
      </main>
      <footer className="bg-[#122019] px-5 py-10 text-white sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 sm:flex-row"><div><p className="font-display text-2xl font-extrabold tracking-[-.065em]">BatteryDocs</p><p className="mt-3 max-w-xl text-xs leading-5 text-white/54">{t.footer}</p></div><div className="flex flex-wrap items-start gap-x-5 gap-y-2 text-xs font-bold text-white/65"><a href="/privacy" className="hover:text-white">Privacy & imprint</a><a href="mailto:office@yfgglobal.com" className="hover:text-white">office@yfgglobal.com</a><a href="https://eur-lex.europa.eu/eli/reg/2023/1542/oj" target="_blank" rel="noreferrer" className="hover:text-white">Regulation (EU) 2023/1542</a></div></div></footer>
    </div>
  );
}
