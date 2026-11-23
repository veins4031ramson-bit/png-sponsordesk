import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "png_sponsordesk_state_v1";
const HOURS_72_MS = 72 * 60 * 60 * 1000;

const INITIAL_SPONSORS = [
  {
    id: "sp-1",
    name: "Coral Sea Logistics Ltd",
    contact: "Procurement Desk",
    amountPGK: 12500,
    invoiceNo: "INV-2026-001",
    invoiceStatus: "Paid",
    notes: "Port Moresby event & logistics sponsorship",
  },
  {
    id: "sp-2",
    name: "Highlands Agro Ventures",
    contact: "Finance Team",
    amountPGK: 8000,
    invoiceNo: "INV-2026-002",
    invoiceStatus: "Sent",
    notes: "Regional operations & equipment partner",
  },
];

const INITIAL_ARRIVALS = [
  {
    id: "arr-1",
    travellerName: "Traveller Check-In #01",
    portOfEntry: "Jacksons International (POM)",
    arrivalAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    pngdacCleared: true,
    docsVerified: true,
    sponsorLinked: "Coral Sea Logistics Ltd",
  },
  {
    id: "arr-2",
    travellerName: "Traveller Check-In #02",
    portOfEntry: "Lae Nadzab / POM",
    arrivalAt: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(),
    pngdacCleared: false,
    docsVerified: true,
    sponsorLinked: "Highlands Agro Ventures",
  },
];

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sponsors: INITIAL_SPONSORS, arrivals: INITIAL_ARRIVALS };
    }
    const parsed = JSON.parse(raw);
    return {
      sponsors: Array.isArray(parsed.sponsors) ? parsed.sponsors : INITIAL_SPONSORS,
      arrivals: Array.isArray(parsed.arrivals) ? parsed.arrivals : INITIAL_ARRIVALS,
    };
  } catch {
    return { sponsors: INITIAL_SPONSORS, arrivals: INITIAL_ARRIVALS };
  }
}

function formatRemaining72h(arrivalIso) {
  const arrivalMs = new Date(arrivalIso).getTime();
  if (Number.isNaN(arrivalMs)) return "Invalid time";
  const deadlineMs = arrivalMs + HOURS_72_MS;
  const diffMs = deadlineMs - Date.now();

  if (diffMs <= 0) {
    const overdueHrs = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    return `72h window elapsed (${overdueHrs}h ago)`;
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${totalHours}h ${mins}m left in 72h window`;
}

export default function App() {
  const saved = useMemo(() => loadSavedState(), []);

  const [sponsors, setSponsors] = useState(saved.sponsors);
  const [arrivals, setArrivals] = useState(saved.arrivals);
  const [activeTab, setActiveTab] = useState("sponsorships");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [searchQuery, setSearchQuery] = useState("");

  // New sponsorship & invoice form state
  const [sponsorName, setSponsorName] = useState("");
  const [contactName, setContactName] = useState("");
  const [amountPGK, setAmountPGK] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("Draft");
  const [sponsorNotes, setSponsorNotes] = useState("");

  // New 72-hour PNGDAC arrival form state
  const [travellerName, setTravellerName] = useState("");
  const [portOfEntry, setPortOfEntry] = useState("Jacksons International (POM)");
  const [sponsorLinked, setSponsorLinked] = useState(
    saved.sponsors[0]?.name || "General Sponsorship"
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sponsors, arrivals })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [sponsors, arrivals]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const totals = useMemo(() => {
    const totalCommitted = sponsors.reduce(
      (sum, item) => sum + (Number(item.amountPGK) || 0),
      0
    );
    const totalPaid = sponsors
      .filter((item) => item.invoiceStatus === "Paid")
      .reduce((sum, item) => sum + (Number(item.amountPGK) || 0), 0);
    const pendingArrivals = arrivals.filter((a) => !a.pngdacCleared).length;
    return { totalCommitted, totalPaid, pendingArrivals };
  }, [sponsors, arrivals]);

  function handleAddSponsor(e) {
    e.preventDefault();
    const cleanName = sponsorName.trim();
    const numericAmount = Number(amountPGK);
    if (!cleanName || Number.isNaN(numericAmount) || numericAmount <= 0) return;

    const nextIndex = String(sponsors.length + 1).padStart(3, "0");
    const newRecord = {
      id: `sp-${Date.now()}`,
      name: cleanName,
      contact: contactName.trim() || "Primary Contact",
      amountPGK: numericAmount,
      invoiceNo: `INV-2026-${nextIndex}`,
      invoiceStatus,
      notes: sponsorNotes.trim() || "Offline entry",
    };

    setSponsors((prev) => [newRecord, ...prev]);
    setSponsorName("");
    setContactName("");
    setAmountPGK("");
    setSponsorNotes("");
  }

  function cycleInvoiceStatus(id) {
    const order = ["Draft", "Sent", "Paid"];
    setSponsors((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentIdx = order.indexOf(item.invoiceStatus);
        const nextStatus = order[(currentIdx + 1) % order.length];
        return { ...item, invoiceStatus: nextStatus };
      })
    );
  }

  function handleAddArrival(e) {
    e.preventDefault();
    const cleanTraveller = travellerName.trim();
    if (!cleanTraveller) return;

    const newArrival = {
      id: `arr-${Date.now()}`,
      travellerName: cleanTraveller,
      portOfEntry: portOfEntry.trim() || "POM",
      arrivalAt: new Date().toISOString(),
      pngdacCleared: false,
      docsVerified: true,
      sponsorLinked: sponsorLinked || "General Sponsorship",
    };

    setArrivals((prev) => [newArrival, ...prev]);
    setTravellerName("");
  }

  function toggleArrivalCleared(id) {
    setArrivals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pngdacCleared: !a.pngdacCleared } : a))
    );
  }

  const filteredSponsors = sponsors.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.invoiceNo.toLowerCase().includes(q) ||
      s.invoiceStatus.toLowerCase().includes(q)
    );
  });

  const filteredArrivals = arrivals.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      a.travellerName.toLowerCase().includes(q) ||
      a.portOfEntry.toLowerCase().includes(q) ||
      a.sponsorLinked.toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>PNG SponsorDesk</h1>
          <p style={styles.subtitle}>
            Offline-First Sponsorship Tracker, Invoicing &amp; 72h PNGDAC Arrival Log
          </p>
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor: isOnline ? "#dcfce7" : "#fef3c7",
            color: isOnline ? "#166534" : "#92400e",
          }}
        >
          {isOnline ? "Online · Sync Ready" : "Offline · Saved Locally"}
        </span>
      </header>

      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Sponsorships</span>
          <strong style={styles.statValue}>
            PGK {totals.totalCommitted.toLocaleString()}
          </strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Invoices Paid</span>
          <strong style={styles.statValue}>
            PGK {totals.totalPaid.toLocaleString()}
          </strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Pending 72h PNGDAC</span>
          <strong style={styles.statValue}>{totals.pendingArrivals}</strong>
        </div>
      </section>

      <div style={styles.tabRow}>
        <button
          type="button"
          onClick={() => setActiveTab("sponsorships")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "sponsorships" ? styles.tabBtnActive : {}),
          }}
        >
          Sponsorships &amp; Invoices
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pngdac")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "pngdac" ? styles.tabBtnActive : {}),
          }}
        >
          72h PNGDAC Arrivals
        </button>
      </div>

      <div style={styles.searchWrap}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sponsor, invoice #, or traveller..."
          style={styles.input}
        />
      </div>

      {activeTab === "sponsorships" ? (
        <main style={styles.mainStack}>
          <form onSubmit={handleAddSponsor} style={styles.card}>
            <h2 style={styles.cardTitle}>New Sponsorship &amp; Invoice</h2>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sponsor / Organisation Name</label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. BSP / Steamships / Local Partner"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.twoCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Amount (PGK)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amountPGK}
                  onChange={(e) => setAmountPGK(e.target.value)}
                  placeholder="5000"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Invoice Status</label>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Contact Person</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name or phone/email"
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Notes</label>
              <input
                type="text"
                value={sponsorNotes}
                onChange={(e) => setSponsorNotes(e.target.value)}
                placeholder="Deliverables, receipt ref, or terms"
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.primaryBtn}>
              Save Sponsorship &amp; Invoice
            </button>
          </form>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>
              Invoices &amp; Sponsors ({filteredSponsors.length})
            </h2>
            <div style={styles.listStack}>
              {filteredSponsors.map((item) => (
                <div key={item.id} style={styles.itemRow}>
                  <div>
                    <div style={styles.itemTitle}>{item.name}</div>
                    <div style={styles.itemMeta}>
                      {item.invoiceNo} · PGK{" "}
                      {(Number(item.amountPGK) || 0).toLocaleString()} ·{" "}
                      {item.contact}
                    </div>
                    {item.notes ? (
                      <div style={styles.itemNotes}>{item.notes}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleInvoiceStatus(item.id)}
                    style={styles.statusBtn}
                    title="Tap to cycle invoice status"
                  >
                    {item.invoiceStatus}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main style={styles.mainStack}>
          <form onSubmit={handleAddArrival} style={styles.card}>
            <h2 style={styles.cardTitle}>Log 72-Hour PNGDAC Arrival</h2>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Traveller Check-In Label / Name</label>
              <input
                type="text"
                value={travellerName}
                onChange={(e) => setTravellerName(e.target.value)}
                placeholder="e.g. Traveller Check-In #03 - J. Kila"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.twoCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Port of Entry</label>
                <input
                  type="text"
                  value={portOfEntry}
                  onChange={(e) => setPortOfEntry(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Linked Sponsor</label>
                <input
                  type="text"
                  value={sponsorLinked}
                  onChange={(e) => setSponsorLinked(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
            <button type="submit" style={styles.primaryBtn}>
              Start 72h Arrival Timer
            </button>
          </form>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>
              Arrival Queue ({filteredArrivals.length})
            </h2>
            <div style={styles.listStack}>
              {filteredArrivals.map((arr) => (
                <div key={arr.id} style={styles.itemRow}>
                  <div>
                    <div style={styles.itemTitle}>
                      <span>{arr.travellerName}</span>
                    </div>
                    <div style={styles.itemMeta}>
                      {arr.portOfEntry} · {arr.sponsorLinked}
                    </div>
                    <div style={styles.itemNotes}>
                      {formatRemaining72h(arr.arrivalAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleArrivalCleared(arr.id)}
                    style={{
                      ...styles.statusBtn,
                      backgroundColor: arr.pngdacCleared ? "#dcfce7" : "#fee2e2",
                      color: arr.pngdacCleared ? "#166534" : "#991b1b",
                    }}
                  >
                    {arr.pngdacCleared ? "Cleared" : "Pending"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "16px",
    maxWidth: "760px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "0.875rem",
    color: "#475569",
  },
  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    marginBottom: "14px",
  },
  statCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  statValue: {
    fontSize: "1.1rem",
    fontWeight: 700,
  },
  tabRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "12px",
  },
  tabBtn: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderColor: "#0f172a",
  },
  searchWrap: {
    marginBottom: "14px",
  },
  mainStack: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
  },
  cardTitle: {
    margin: "0 0 12px",
    fontSize: "1.05rem",
    fontWeight: 700,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "10px",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  primaryBtn: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  listStack: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  itemTitle: {
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  itemMeta: {
    fontSize: "0.8rem",
    color: "#475569",
    marginTop: "2px",
  },
  itemNotes: {
    fontSize: "0.78rem",
    color: "#64748b",
    marginTop: "3px",
  },
  statusBtn: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
};
