'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────
interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    grade?: string;
    homeroom?: string;
  };
  school: {
    name: string;
    code: string;
  };
  assessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    height?: number;
    weight?: number;
    bmi?: number;
    painScale?: number;
    generalAppearance?: string;
    skinCondition?: string;
    eyes?: string;
    ears?: string;
    throat?: string;
    cardiovascular?: string;
    respiratory?: string;
    abdomen?: string;
    neurological?: string;
    otherFindings?: string;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface FilterOptions {
  grades: string[];
  homerooms: string[];
  schools: { id: string; name: string; code: string }[];
  visitTypes: string[];
}

// ─── Outcome helper ─────────────────────────────────────────────────
type Outcome = 'Sent to Class' | 'Sent Home' | 'Referred to Hospital' | 'Under Observation' | 'Follow-up';

function deriveOutcome(visit: Visit): Outcome {
  const t = (visit.treatment || '').toLowerCase();
  const n = (visit.notes || '').toLowerCase();
  const combined = `${t} ${n}`;

  if (combined.includes('hospital') || combined.includes('emergency') || combined.includes('ambulance') || combined.includes('referred'))
    return 'Referred to Hospital';
  if (visit.visitType === 'EMERGENCY') return 'Referred to Hospital';
  if (combined.includes('sent home') || combined.includes('go home') || combined.includes('parent pick'))
    return 'Sent Home';
  if (combined.includes('observation') || combined.includes('resting') || combined.includes('monitor'))
    return 'Under Observation';
  if (visit.followUpRequired) return 'Follow-up';
  return 'Sent to Class';
}

const OUTCOME_STYLES: Record<Outcome, string> = {
  'Sent to Class':        'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
  'Sent Home':            'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  'Referred to Hospital': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  'Under Observation':    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  'Follow-up':            'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20',
};

const VISIT_TYPE_STYLES: Record<string, string> = {
  ILLNESS:         'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
  INJURY:          'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
  ROUTINE_CHECKUP: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  VACCINATION:     'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  EMERGENCY:       'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  FOLLOW_UP:       'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
};

// ─── Avatar helper ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Component ──────────────────────────────────────────────────────
export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Tabs (reference: Health Analytics tabbed style)
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'followups' | 'senthome'>('all');

  // Filter state
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visitType, setVisitType] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [userRole, setUserRole] = useState('');

  // Quick-view modal
  const [quickViewVisit, setQuickViewVisit] = useState<Visit | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUserRole(d.user.role); })
      .catch(() => {});
  }, []);

  // Fetch filter options
  useEffect(() => {
    fetch('/api/visits?filters=true')
      .then((r) => r.json())
      .then((d) => setFilterOptions(d))
      .catch(() => {});
  }, []);

  // Fetch visits
  const fetchVisits = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    if (visitType) p.set('visitType', visitType);
    if (schoolId) p.set('schoolId', schoolId);

    fetch(`/api/visits?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setVisits(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedSearch, dateFrom, dateTo, visitType, schoolId]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  // ─── Derived data ───────────────────────────────────────────────
  const filteredVisits = useMemo(() => {
    // Start with server-filtered list
    let rows = visits;

    // Tab filters
    if (activeTab !== 'all') {
      const today = new Date().toDateString();
      if (activeTab === 'today') {
        rows = rows.filter((v) => new Date(v.visitDate).toDateString() === today);
      } else if (activeTab === 'followups') {
        rows = rows.filter((v) => v.followUpRequired);
      } else if (activeTab === 'senthome') {
        rows = rows.filter((v) => {
          const o = deriveOutcome(v);
          return o === 'Sent Home' || o === 'Referred to Hospital';
        });
      }
    }

    // Client-only outcome dropdown
    if (outcomeFilter) rows = rows.filter((v) => deriveOutcome(v) === outcomeFilter);
    return rows;
  }, [visits, outcomeFilter, activeTab]);

  const todayStr = new Date().toDateString();

  const todayVisits = useMemo(
    () => visits.filter((v) => new Date(v.visitDate).toDateString() === todayStr),
    [visits, todayStr]
  );

  const stats = useMemo(() => {
    const sentHome = todayVisits.filter((v) => {
      const o = deriveOutcome(v);
      return o === 'Sent Home' || o === 'Referred to Hospital';
    }).length;
    const inClinic = todayVisits.filter((v) => deriveOutcome(v) === 'Under Observation').length;
    return {
      visitsToday: todayVisits.length,
      inClinic,
      sentHome,
    };
  }, [todayVisits]);

  // ─── Helpers ────────────────────────────────────────────────────
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const fmtType = (t: string) => t.replace(/_/g, ' ');

  const clearFilters = () => {
    setSearch(''); setDateFrom(''); setDateTo('');
    setVisitType(''); setOutcomeFilter(''); setSchoolId('');
    setActiveTab('all');
  };

  const activeFilterCount = [dateFrom, dateTo, visitType, outcomeFilter, schoolId].filter(Boolean).length;

  // ─── Print helper ───────────────────────────────────────────────
  const handlePrintReport = (visit: Visit) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const name = `${visit.student.firstName} ${visit.student.lastName}`;
    const outcome = deriveOutcome(visit);
    w.document.write(`
      <html><head><title>Visit Report – ${name}</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; vertical-align: top; }
        td:first-child { font-weight: 600; width: 180px; color: #475569; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Clinic Visit Report</h1>
      <p class="meta">Taaleem Clinic &mdash; ${visit.school.name} &mdash; Generated ${new Date().toLocaleString()}</p>
      <table>
        <tr><td>Patient</td><td>${name} (ID: ${visit.student.studentId})</td></tr>
        <tr><td>Grade</td><td>${visit.student.grade || '—'}</td></tr>
        <tr><td>Visit Date &amp; Time</td><td>${fmtDate(visit.visitDate)} at ${fmtTime(visit.visitDate)}</td></tr>
        <tr><td>Visit Type</td><td>${fmtType(visit.visitType)}</td></tr>
        <tr><td>Chief Complaint</td><td>${visit.chiefComplaint || '—'}</td></tr>
        <tr><td>Diagnosis</td><td>${visit.diagnosis || '—'}</td></tr>
        <tr><td>Treatment</td><td>${visit.treatment || '—'}</td></tr>
        <tr><td>Outcome</td><td>${outcome}</td></tr>
        <tr><td>Follow-up Required</td><td>${visit.followUpRequired ? 'Yes' : 'No'}${visit.followUpDate ? ' — ' + fmtDate(visit.followUpDate) : ''}</td></tr>
        <tr><td>Notes</td><td>${visit.notes || '—'}</td></tr>
        <tr><td>Recorded By</td><td>${visit.creator.firstName} ${visit.creator.lastName}</td></tr>
      </table>
      ${visit.assessment ? `
      <h2 style="font-size:16px; margin-top:28px;">Vital Signs</h2>
      <table>
        ${visit.assessment.temperature ? `<tr><td>Temperature</td><td>${visit.assessment.temperature} °C</td></tr>` : ''}
        ${visit.assessment.bloodPressureSystolic ? `<tr><td>Blood Pressure</td><td>${visit.assessment.bloodPressureSystolic}/${visit.assessment.bloodPressureDiastolic || '—'} mmHg</td></tr>` : ''}
        ${visit.assessment.heartRate ? `<tr><td>Heart Rate</td><td>${visit.assessment.heartRate} bpm</td></tr>` : ''}
        ${visit.assessment.respiratoryRate ? `<tr><td>Respiratory Rate</td><td>${visit.assessment.respiratoryRate} /min</td></tr>` : ''}
        ${visit.assessment.oxygenSaturation ? `<tr><td>O₂ Saturation</td><td>${visit.assessment.oxygenSaturation}%</td></tr>` : ''}
        ${visit.assessment.painScale !== undefined && visit.assessment.painScale !== null ? `<tr><td>Pain Scale</td><td>${visit.assessment.painScale}/10</td></tr>` : ''}
      </table>` : ''}
      <div class="footer">
        <p>Confidential — For authorized personnel only</p>
        <p>Taaleem Clinic Management System</p>
      </div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <Layout defaultSidebarOpen={false}>
      <div className="max-w-full">
        {/* ────── Header ────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Medical Visit Log</h1>
            <p className="text-slate-600 text-sm mt-0.5">Real-time clinic activity &amp; visit records</p>
          </div>
        </div>

        {/* ────── Today's Clinic Stats ────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Visits Today */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visits Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.visitsToday}</p>
            </div>
          </div>

          {/* Currently in Clinic */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Currently in Clinic</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inClinic}</p>
            </div>
          </div>

          {/* Sent Home */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sent Home</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sentHome}</p>
            </div>
          </div>
        </div>

        {/* ────── Tabs (clean dashboard style) ────── */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { key: 'all', label: 'All Records' },
              { key: 'today', label: 'Today' },
              { key: 'followups', label: 'Follow-ups' },
              { key: 'senthome', label: 'Sent Home / Hospital' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ────── Advanced Filter Bar ────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by Student, ID, or Complaint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Date From */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-slate-500 z-10">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full sm:w-40 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-slate-500 z-10">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full sm:w-40 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
              />
            </div>

            {/* Visit Type */}
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full sm:w-36 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50 text-slate-700"
            >
              <option value="">All Types</option>
              <option value="ILLNESS">Illness</option>
              <option value="INJURY">Injury</option>
            </select>

            {/* Outcome */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50 text-slate-700"
            >
              <option value="">All Outcomes</option>
              <option value="Sent to Class">Sent to Class</option>
              <option value="Sent Home">Sent Home</option>
              <option value="Referred to Hospital">Referred to Hospital</option>
            </select>

            {/* School (Admin) */}
            {userRole === 'ADMIN' && filterOptions?.schools && filterOptions.schools.length > 0 && (
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50 text-slate-700"
              >
                <option value="">All Schools</option>
                {filterOptions.schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {/* Clear */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-medium whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ────── Results count ────── */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : (
              <>
                <span className="font-semibold text-slate-700">{filteredVisits.length}</span>
                {' '}visit{filteredVisits.length !== 1 ? 's' : ''}
                {(debouncedSearch || activeFilterCount > 0) && <span className="text-slate-400"> (filtered)</span>}
              </>
            )}
          </p>
        </div>

        {/* ────── Visit Table ────── */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-9 w-9 border-[3px] border-indigo-100 border-t-indigo-600"></div>
            <p className="mt-4 text-sm text-slate-500">Loading visit records...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold">No visits found</p>
            <p className="text-sm text-slate-400 mt-1">
              {debouncedSearch || activeFilterCount > 0 ? 'Try adjusting your filters or search terms' : 'Create a new assessment to get started'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-2 px-5 py-3 bg-slate-50/80 border-b border-gray-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Time</div>
              <div className="col-span-3">Complaint &amp; Diagnosis</div>
              <div className="col-span-2">Status / Outcome</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-gray-100">
              {filteredVisits.map((visit) => {
                const outcome = deriveOutcome(visit);
                const name = `${visit.student.firstName} ${visit.student.lastName}`;
                const initials = `${visit.student.firstName[0]}${visit.student.lastName[0]}`.toUpperCase();
                const typeStyle = VISIT_TYPE_STYLES[visit.visitType] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20';
                const outcomeStyle = OUTCOME_STYLES[outcome];

                return (
                  <li key={visit.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Desktop row */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-2 px-5 py-3.5 items-center">
                      {/* Patient */}
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(name)}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/visits/${visit.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate block">
                            {name}
                          </Link>
                          <p className="text-xs text-slate-500 truncate">
                            Grade {visit.student.grade || '—'} &middot; ID: {visit.student.studentId}
                          </p>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-900">{fmtDate(visit.visitDate)}</p>
                        <p className="text-xs text-slate-500">{fmtTime(visit.visitDate)}</p>
                      </div>

                      {/* Complaint & Diagnosis */}
                      <div className="col-span-3 min-w-0">
                        <p className="text-sm text-gray-800 truncate" title={visit.chiefComplaint || ''}>
                          {visit.chiefComplaint || <span className="text-slate-400 italic">No complaint</span>}
                        </p>
                        {visit.diagnosis && (
                          <p className="text-xs text-slate-500 truncate mt-0.5" title={visit.diagnosis}>
                            Dx: {visit.diagnosis}
                          </p>
                        )}
                      </div>

                      {/* Status / Outcome */}
                      <div className="col-span-2 flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${typeStyle}`}>
                          {fmtType(visit.visitType)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${outcomeStyle}`}>
                          {outcome}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          onClick={() => setQuickViewVisit(visit)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Quick View"
                        >
                          {/* Eye icon */}
                          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrintReport(visit)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Print Report"
                        >
                          {/* FileText icon */}
                          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <Link
                          href={`/visits/${visit.id}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Full Details"
                        >
                          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="lg:hidden px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(name)}`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <Link href={`/visits/${visit.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 block truncate">
                                {name}
                              </Link>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Grade {visit.student.grade || '—'} &middot; {fmtDate(visit.visitDate)} {fmtTime(visit.visitDate)}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2 flex-shrink-0">
                              <button onClick={() => setQuickViewVisit(visit)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button onClick={() => handlePrintReport(visit)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {visit.chiefComplaint && (
                            <p className="text-xs text-slate-600 mt-1.5 truncate">{visit.chiefComplaint}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeStyle}`}>
                              {fmtType(visit.visitType)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${outcomeStyle}`}>
                              {outcome}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ────── Quick View Modal ────── */}
      {quickViewVisit && (
        <QuickViewModal visit={quickViewVisit} onClose={() => setQuickViewVisit(null)} />
      )}
    </Layout>
  );
}

// ─── Quick View Modal ───────────────────────────────────────────────
function QuickViewModal({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const outcome = deriveOutcome(visit);
  const outcomeStyle = OUTCOME_STYLES[outcome];
  const typeStyle = VISIT_TYPE_STYLES[visit.visitType] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20';
  const name = `${visit.student.firstName} ${visit.student.lastName}`;
  const initials = `${visit.student.firstName[0]}${visit.student.lastName[0]}`.toUpperCase();

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(name)}`}>
                {initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{name}</h3>
                <p className="text-xs text-slate-500">ID: {visit.student.studentId} &middot; Grade {visit.student.grade || '—'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeStyle}`}>
                {visit.visitType.replace(/_/g, ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${outcomeStyle}`}>
                {outcome}
              </span>
              {visit.followUpRequired && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                  Follow-up Required
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoCell label="Date & Time" value={`${fmtDate(visit.visitDate)} at ${fmtTime(visit.visitDate)}`} />
              <InfoCell label="School" value={visit.school.name} />
              <InfoCell label="Complaint" value={visit.chiefComplaint || '—'} full />
              <InfoCell label="Diagnosis" value={visit.diagnosis || '—'} full />
              <InfoCell label="Treatment" value={visit.treatment || '—'} full />
              {visit.notes && <InfoCell label="Notes" value={visit.notes} full />}
              <InfoCell label="Recorded By" value={`${visit.creator.firstName} ${visit.creator.lastName}`} />
              {visit.followUpDate && <InfoCell label="Follow-up Date" value={fmtDate(visit.followUpDate)} />}
            </div>

            {/* Vitals */}
            {visit.assessment && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Vital Signs</h4>
                <div className="grid grid-cols-3 gap-3">
                  {visit.assessment.temperature && (
                    <VitalCard icon="🌡️" label="Temp" value={`${visit.assessment.temperature}°C`} />
                  )}
                  {visit.assessment.bloodPressureSystolic && (
                    <VitalCard icon="💓" label="BP" value={`${visit.assessment.bloodPressureSystolic}/${visit.assessment.bloodPressureDiastolic || '—'}`} />
                  )}
                  {visit.assessment.heartRate && (
                    <VitalCard icon="❤️" label="HR" value={`${visit.assessment.heartRate} bpm`} />
                  )}
                  {visit.assessment.oxygenSaturation && (
                    <VitalCard icon="🫁" label="SpO₂" value={`${visit.assessment.oxygenSaturation}%`} />
                  )}
                  {visit.assessment.painScale !== undefined && visit.assessment.painScale !== null && (
                    <VitalCard icon="📊" label="Pain" value={`${visit.assessment.painScale}/10`} />
                  )}
                  {visit.assessment.bmi && (
                    <VitalCard icon="📏" label="BMI" value={visit.assessment.bmi.toFixed(1)} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-gray-100 transition-colors">
              Close
            </button>
            <Link
              href={`/visits/${visit.id}`}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Open Full Record
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────
function InfoCell({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function VitalCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
      <p className="text-sm mb-0.5">{icon}</p>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
