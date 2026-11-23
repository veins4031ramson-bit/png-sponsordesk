import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Download,
  FileText,
  Globe,
  Plus,
  Printer,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users
} from 'lucide-react';

const STORAGE_KEY = 'png_sponsordesk_v5_data';

const INITIAL_STATE = {
  sponsors: [
    {
      id: 'sp-1',
      companyName: 'Coral Sea Logistics & Advisory Ltd',
      ipaNumber: '1-104829',
      tinNumber: '500982144',
      contactName: 'Esther Kila',
      contactEmail: 'compliance@coralsealogs.com.pg',
      contactPhone: '+675 7200 4110',
      address: 'Level 3, Harbour City Tower, Port Moresby, NCD, PNG',
      docs: {
        ipaCert: true,
        companyExtract: true,
        tinCert: true
      }
    }
  ],
  applications: [
    {
      id: 'app-101',
      sponsorId: 'sp-1',
      travellerName: 'David Callahan',
      nationality: 'Australia',
      passportNumber: 'PB8849201',
      passportExpiry: '2027-08-15',
      arrivalDate: '2026-11-25',
      departureDate: '2026-12-08',
      visaType: 'Business Short Stay (Single Entry - Up to 30 Days)',
      varn: 'VARN-2026-88412',
      purpose: 'Technical equipment inspection and client briefing in Port Moresby and Lae.',
      paidWorkRisk: false,
      thirdCountrySixMonthStay: true,
      pngdacSubmitted: false,
      checklist: {
        passportScan: true,
        flightItinerary: true,
        sponsorLetter: true,
        accommodationOrHost: true
      },
      docLinks: {
        passportUrl: 'https://onedrive.live.com/passport-scan-example',
        itineraryUrl: 'https://onedrive.live.com/flight-itinerary-example',
        letterUrl: 'https://onedrive.live.com/sponsor-letter-example'
      }
    }
  ],
  invoices: [
    {
      id: 'inv-201',
      sponsorId: 'sp-1',
      invoiceNumber: 'INV-2026-001',
      currency: 'PGK',
      amount: 350,
      includeGst: false,
      itemLabel: 'PNG SponsorDesk Monthly Workspace (14-Day Trial Complete)',
      status: 'Paid',
      paymentMethod: 'BSP / Kina Bank EFT',
      paddleLink: 'https://pay.paddle.com/checkout/example',
      dueDate: '2026-12-01'
    }
  ],
  readiness: {
    githubVercelLive: false,
    mobileSmokeTested: false,
    ipaTinVerified: false,
    separateVisaFunds: true,
    backupTested: false
  }
};

function daysBetween(targetDateStr, fromDateStr = null) {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr + 'T00:00:00');
  const base = fromDateStr ? new Date(fromDateStr + 'T00:00:00') : new Date();
  const baseMidnight = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - baseMidnight) / (1000 * 60 * 60 * 24));
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_STATE, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to read localStorage:', e);
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientViewMode, setClientViewMode] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('app-101');
  const [copiedNotice, setCopiedNotice] = useState('');

  const [newApp, setNewApp] = useState({
    sponsorId: INITIAL_STATE.sponsors[0]?.id || '',
    travellerName: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    arrivalDate: '',
    departureDate: '',
    visaType: 'Business Short Stay (Single Entry - Up to 30 Days)',
    varn: '',
    purpose: '',
    paidWorkRisk: false,
    thirdCountrySixMonthStay: true,
    pngdacSubmitted: false
  });

  const [newSponsor, setNewSponsor] = useState({
    companyName: '',
    ipaNumber: '',
    tinNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  const [newInvoice, setNewInvoice] = useState({
    sponsorId: INITIAL_STATE.sponsors[0]?.id || '',
    currency: 'PGK',
    amount: 350,
    includeGst: false,
    itemLabel: 'PNG SponsorDesk Monthly Subscription',
    status: 'Unpaid',
    paymentMethod: 'BSP / Kina Bank EFT',
    paddleLink: 'https://pay.paddle.com/checkout/your-product'
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save localStorage:', e);
    }
  }, [data]);

  const notifyCopy = (label) => {
    setCopiedNotice(label);
    setTimeout(() => setCopiedNotice(''), 2200);
  };

  const copyText = async (text, label = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      notifyCopy(label);
    } catch {
      notifyCopy('Copy manually if blocked');
    }
  };

  const selectedApp = useMemo(
    () => data.applications.find((a) => a.id === selectedAppId) || data.applications[0] || null,
    [data.applications, selectedAppId]
  );

  const selectedSponsor = useMemo(() => {
    if (!selectedApp) return data.sponsors[0] || null;
    return data.sponsors.find((s) => s.id === selectedApp.sponsorId) || data.sponsors[0] || null;
  }, [data.sponsors, selectedApp]);

  const evaluateFlags = (app) => {
    const flags = [];
    const daysToArrival = daysBetween(app.arrivalDate);
    const passportMonthsAtArrival =
      app.passportExpiry && app.arrivalDate
        ? (new Date(app.arrivalDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.4)
        : null;

    if (passportMonthsAtArrival !== null) {
      const remainingAtArrival =
        (new Date(app.passportExpiry) - new Date(app.arrivalDate)) / (1000 * 60 * 60 * 24 * 30.4);
      if (remainingAtArrival < 6) {
        flags.push({
          level: 'high',
          text: 'Passport has less than 6 months validity at arrival date.'
        });
      }
    } else if (passportMonthsAtArrival !== null && passportMonthsAtArrival < 6) {
      flags.push({ level: 'high', text: 'Check passport 6-month validity.' });
    }

    if (app.paidWorkRisk) {
      flags.push({
        level: 'high',
        text: 'Paid work / local employment flagged — verify Work Permit & Employment Visa pathway instead of short-term business visit.'
      });
    }

    if (!app.thirdCountrySixMonthStay) {
      flags.push({
        level: 'medium',
        text: 'Applying outside country of nationality — verify at least 6 months legal residency/stay proof.'
      });
    }

    if (daysToArrival !== null && daysToArrival <= 3 && daysToArrival >= -1 && !app.pngdacSubmitted) {
      flags.push({
        level: 'high',
        text: `Within 72-hour PNGDAC window (${daysToArrival <= 0 ? 'Arriving/Arrived' : `in ${daysToArrival}d`}) — submit PNG Digital Arrival Card in English.`
      });
    }

    return flags;
  };

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.applications;
    return data.applications.filter((app) => {
      const sp = data.sponsors.find((s) => s.id === app.sponsorId);
      return (
        app.travellerName.toLowerCase().includes(q) ||
        app.passportNumber.toLowerCase().includes(q) ||
        (app.varn || '').toLowerCase().includes(q) ||
        (sp?.companyName || '').toLowerCase().includes(q)
      );
    });
  }, [data.applications, data.sponsors, searchQuery]);

  const pngdacWindowApps = useMemo(() => {
    return data.applications.filter((app) => {
      const d = daysBetween(app.arrivalDate);
      return d !== null && d <= 3 && d >= -1;
    });
  }, [data.applications]);

  const handleAddApplication = (e) => {
    e.preventDefault();
    if (!newApp.travellerName.trim() || !newApp.passportNumber.trim()) return;
    const id = 'app-' + Date.now();
    const record = {
      id,
      ...newApp,
      checklist: {
        passportScan: false,
        flightItinerary: false,
        sponsorLetter: false,
        accommodationOrHost: false
      },
      docLinks: {
        passportUrl: '',
        itineraryUrl: '',
        letterUrl: ''
      }
    };
    setData((prev) => ({
      ...prev,
      applications: [record, ...prev.applications]
    }));
    setSelectedAppId(id);
    setNewApp((prev) => ({
      ...prev,
      travellerName: '',
      nationality: '',
      passportNumber: '',
      passportExpiry: '',
      arrivalDate: '',
      departureDate: '',
      varn: '',
      purpose: '',
      paidWorkRisk: false,
      pngdacSubmitted: false
    }));
    setActiveTab('pipeline');
  };

  const handleAddSponsor = (e) => {
    e.preventDefault();
    if (!newSponsor.companyName.trim()) return;
    const id = 'sp-' + Date.now();
    const created = {
      id,
      ...newSponsor,
      docs: { ipaCert: false, companyExtract: false, tinCert: false }
    };
    setData((prev) => ({
      ...prev,
      sponsors: [...prev.sponsors, created],
      invoices: prev.invoices.length ? prev.invoices : prev.invoices
    }));
    setNewApp((prev) => ({ ...prev, sponsorId: prev.sponsorId || id }));
    setNewInvoice((prev) => ({ ...prev, sponsorId: prev.sponsorId || id }));
    setNewSponsor({
      companyName: '',
      ipaNumber: '',
      tinNumber: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      address: ''
    });
  };

  const handleAddInvoice = (e) => {
    e.preventDefault();
    const baseAmount = Number(newInvoice.amount) || 0;
    const totalAmount = newInvoice.includeGst ? Number((baseAmount * 1.1).toFixed(2)) : baseAmount;
    const inv = {
      id: 'inv-' + Date.now(),
      sponsorId: newInvoice.sponsorId || data.sponsors[0]?.id || '',
      invoiceNumber: `INV-2026-${String(data.invoices.length + 1).padStart(3, '0')}`,
      currency: newInvoice.currency,
      amount: totalAmount,
      includeGst: newInvoice.includeGst,
      itemLabel: newInvoice.itemLabel || 'PNG SponsorDesk Service',
      status: newInvoice.status,
      paymentMethod: newInvoice.currency === 'USD' ? 'Paddle Checkout (USD)' : 'BSP / Kina Bank EFT',
      paddleLink: newInvoice.paddleLink,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    };
    setData((prev) => ({ ...prev, invoices: [inv, ...prev.invoices] }));
  };

  const toggleInvoiceStatus = (invId) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((item) =>
        item.id === invId
          ? { ...item, status: item.status === 'Paid' ? 'Unpaid' : 'Paid' }
          : item
      )
    }));
  };

  const toggleChecklistItem = (appId, key) => {
    setData((prev) => ({
      ...prev,
      applications: prev.applications.map((app) =>
        app.id === appId
          ? { ...app, checklist: { ...app.checklist, [key]: !app.checklist[key] } }
          : app
      )
    }));
  };

  const updateDocLink = (appId, key, val) => {
    setData((prev) => ({
      ...prev,
      applications: prev.applications.map((app) =>
        app.id === appId
          ? { ...app, docLinks: { ...(app.docLinks || {}), [key]: val } }
          : app
      )
    }));
  };

  const exportJsonBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `png-sponsordesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifyCopy('JSON backup downloaded');
  };

  const importJsonBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setData({ ...INITIAL_STATE, ...parsed });
        notifyCopy('Backup restored');
      } catch {
        notifyCopy('Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  const buildPortalBundle = (app, sp) =>
    [
      `SPONSOR: ${sp?.companyName || '-'} (IPA: ${sp?.ipaNumber || '-'}, TIN: ${sp?.tinNumber || '-'})`,
      `TRAVELLER: ${app.travellerName} (${app.nationality})`,
      `PASSPORT: ${app.passportNumber} | EXPIRY: ${app.passportExpiry || '-'}`,
      `DATES: Arrival ${app.arrivalDate || '-'} -> Departure ${app.departureDate || '-'}`,
      `VISA CLASS: ${app.visaType} | VARN: ${app.varn || 'Pending'}`,
      `PURPOSE: ${app.purpose || '-'}`
    ].join('\n');

  const buildClientChecklistMessage = (app, sp) =>
    [
      `Hello ${app.travellerName},`,
      `Sponsoring entity (${sp?.companyName || 'PNG Sponsor'}) is preparing your PNG entry file.`,
      `Please confirm/send:`,
      `- Clear passport bio scan (6+ months validity past arrival ${app.arrivalDate || 'TBD'})`,
      `- Flight itinerary & host/accommodation details`,
      `- Complete PNG Digital Arrival Card (pngdac.ica.gov.pg) within 72 hours before arrival (free, in English).`
    ].join('\n');

  const buildPngdacGroupSummary = () => {
    const batch = pngdacWindowApps.slice(0, 10);
    if (!batch.length) return 'No travellers currently inside the 72-hour PNGDAC arrival window.';
    return [
      `PNGDAC 72-Hour Arrival Batch (${batch.length}/10 max per group):`,
      ...batch.map(
        (a, idx) =>
          `${idx + 1}. ${a.travellerName} | Pass: ${a.passportNumber} | Arr: ${a.arrivalDate} | Status: ${
            a.pngdacSubmitted ? 'Submitted' : 'PENDING PNGDAC'
          }`
      )
    ].join('\n');
  };

  const pgkRevenue = data.invoices
    .filter((i) => i.currency === 'PGK' && i.status === 'Paid')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const usdRevenue = data.invoices
    .filter((i) => i.currency === 'USD' && i.status === 'Paid')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const totalAlerts = data.applications.reduce((acc, app) => acc + evaluateFlags(app).length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="sticky top-0 z-20 bg-slate-900 text-white px-4 py-3 shadow print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="font-bold text-base sm:text-lg tracking-tight">PNG SponsorDesk</h1>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                Offline-Ready (v5)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              ICSA Sponsor File, 72-Hr PNGDAC Helper &amp; PGK/USD Billing
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setClientViewMode((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg font-medium border ${
                clientViewMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {clientViewMode ? 'Exit Client View' : 'Traveller Client View'}
            </button>
            <button
              onClick={exportJsonBackup}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700"
              title="Export JSON backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>
            <label className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
              <input type="file" accept="application/json" onChange={importJsonBackup} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      {copiedNotice && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotice}</span>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 px-4 overflow-x-auto print:hidden">
        <div className="max-w-6xl mx-auto flex gap-1 py-1.5 text-xs sm:text-sm">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Clock },
            { id: 'pipeline', label: 'Visa Pipeline', icon: Users },
            { id: 'intake', label: 'Intake & PNGDAC', icon: Globe },
            { id: 'letter', label: 'Sponsor Letter', icon: FileText },
            { id: 'sponsors', label: 'Sponsor Vault', icon: Building2 },
            { id: 'billing', label: 'Billing & Invoices', icon: Receipt }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 space-y-5">
        {clientViewMode && selectedApp ? (
          <section className="bg-white border border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Traveller Checklist View
                </span>
