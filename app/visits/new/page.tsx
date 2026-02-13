'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import PainScaleSelector from '@/components/PainScaleSelector';
import {
  Thermometer,
  HeartPulse,
  Wind,
  Droplets,
  Ruler,
  Activity,
  AlertTriangle,
  Clock,
  Eye,
  Stethoscope,
  X,
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  schoolId: string;
}

interface School {
  id: string;
  name: string;
  code: string;
}

interface PreviousVisit {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  assessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface StudentSummary {
  healthSummary?: {
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
  };
  statistics?: {
    totalVisits?: number;
  };
  student?: {
    grade?: string | null;
    homeroom?: string | null;
  };
}

/* ── shared input class tokens ─────────────────────────── */
const INPUT =
  'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-shadow disabled:bg-gray-50 disabled:text-gray-500';
const SELECT = INPUT;
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';
const CARD = 'bg-white rounded-2xl border border-gray-200/80 shadow-sm';

/* ── eye acuity options (reused 4 times) ───────────────── */
const ACUITY = ['6/3','6/3.8','6/4.8','6/6','6/7.5','6/9.5','6/12','6/15','6/19','6/24','6/30','6/38','6/48','6/60'];

export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userSchoolId, setUserSchoolId] = useState<string>('');
  const [previousVisits, setPreviousVisits] = useState<PreviousVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PreviousVisit | null>(null);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    schoolId: '',
    visitType: 'ROUTINE_CHECKUP',
    chiefComplaint: '',
    notes: '',
    diagnosis: '',
    treatment: '',
    followUpRequired: false,
    followUpDate: '',
    notifyParent: false,
    assessment: {
      temperature: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      height: '',
      weight: '',
      painScale: '',
      generalAppearance: '',
      skinCondition: '',
      eyes: '',
      ears: '',
      throat: '',
      cardiovascular: '',
      respiratory: '',
      abdomen: '',
      neurological: '',
      otherFindings: '',
      colorBlindness: '',
      visionTestingPerformed: '',
      visionTestingNotPerformedReason: '',
      correctiveLenses: '',
      correctiveLensesOtherReason: '',
      rightEye: '',
      leftEye: '',
      rightEyeWithCorrection: '',
      leftEyeWithCorrection: '',
      visionScreeningResult: '',
    },
  });

  /* ── data loading (unchanged) ─────────────────────────── */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserRole(data.user.role);
          setUserSchoolId(data.user.schoolId || '');
          if (data.user.role !== 'ADMIN' && data.user.schoolId) {
            const schoolId = data.user.schoolId;
            setSelectedSchoolId(schoolId);
            setFormData((prev) => ({ ...prev, schoolId }));
            fetch(`/api/students?schoolId=${schoolId}`)
              .then((res) => res.json())
              .then((studentData) => setStudents(studentData));
          }
        }
      });

    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => setSchools(data));

    const urlParams = new URLSearchParams(window.location.search);
    const studentIdParam = urlParams.get('studentId');
    const schoolIdParam = urlParams.get('schoolId');

    if (schoolIdParam) {
      setSelectedSchoolId(schoolIdParam);
      setFormData((prev) => ({ ...prev, schoolId: schoolIdParam }));
      fetch(`/api/students?schoolId=${schoolIdParam}`)
        .then((res) => res.json())
        .then((studentData) => {
          setStudents(studentData);
          if (studentIdParam && studentData.find((s: Student) => s.id === studentIdParam)) {
            setFormData((prev) => ({ ...prev, studentId: studentIdParam, schoolId: schoolIdParam }));
          }
        });
    }
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      fetch(`/api/students?schoolId=${selectedSchoolId}`)
        .then((res) => res.json())
        .then((data) => setStudents(data));
      setFormData((prev) => ({ ...prev, studentId: '', schoolId: selectedSchoolId }));
      setStudentSearchQuery('');
      setIsStudentDropdownOpen(false);
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (formData.studentId) {
      setLoadingVisits(true);
      fetch(`/api/students/${formData.studentId}/visits`)
        .then((res) => res.json())
        .then((data) => {
          setPreviousVisits(Array.isArray(data) ? data : []);
          setLoadingVisits(false);
        })
        .catch(() => { setPreviousVisits([]); setLoadingVisits(false); });

      fetch(`/api/students/${formData.studentId}/summary`)
        .then((res) => res.json())
        .then((data) => setStudentSummary(data.error ? null : data))
        .catch(() => setStudentSummary(null));
    } else {
      setPreviousVisits([]);
      setSelectedVisit(null);
      setStudentSummary(null);
    }
  }, [formData.studentId]);

  /* ── submit (unchanged) ───────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        studentId: formData.studentId,
        schoolId: formData.schoolId || selectedSchoolId,
        visitType: formData.visitType,
        chiefComplaint: formData.chiefComplaint || undefined,
        notes: formData.notes || undefined,
        diagnosis: formData.diagnosis || undefined,
        treatment: formData.treatment || undefined,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || undefined,
        notifyParent: formData.notifyParent,
        assessment: Object.fromEntries(
          Object.entries(formData.assessment).map(([key, value]) => {
            if (key === 'visionTestingPerformed') {
              return [key, value === 'true' ? true : value === 'false' ? false : undefined];
            }
            if (['temperature','bloodPressureSystolic','bloodPressureDiastolic','heartRate',
                 'respiratoryRate','oxygenSaturation','height','weight','painScale'].includes(key)) {
              return [key, value === '' ? undefined : Number(value) || undefined];
            }
            return [key, value === '' ? undefined : value];
          })
        ),
      };
      if (payload.assessment) {
        Object.keys(payload.assessment).forEach((key) => {
          if (payload.assessment[key] === '' || payload.assessment[key] === undefined) delete payload.assessment[key];
        });
        if (Object.keys(payload.assessment).length === 0) delete payload.assessment;
      }
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        router.push('/visits');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create visit');
        setLoading(false);
      }
    } catch {
      alert('An error occurred');
      setLoading(false);
    }
  };

  /* ── helpers ──────────────────────────────────────────── */
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatVisitType = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const filteredStudents = students.filter((s) => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase().trim();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
  });

  const selectedStudent = students.find((s) => s.id === formData.studentId);
  const handleStudentSelect = (id: string) => { setFormData({ ...formData, studentId: id }); setStudentSearchQuery(''); setIsStudentDropdownOpen(false); };

  const setAssessment = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, assessment: { ...prev.assessment, [key]: value } }));

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-28">
        {/* ── Breadcrumb ─────────────────────────────────── */}
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Clinical Visits', href: '/visits' },
            { label: 'New Assessment' },
          ]}
        />

        {/* ── Page header ────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 mt-1 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Assessment</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Record vitals, complaint, diagnosis and plan for this clinical visit.
            </p>
          </div>
          {selectedStudent && (
            <div className="hidden sm:flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-bold">
                {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-indigo-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
                <p className="text-[11px] text-indigo-600">
                  ID {selectedStudent.studentId}
                  {studentSummary?.student?.grade && ` · Grade ${studentSummary.student.grade}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Two-column grid (70 / 30) ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ════════════════ LEFT COLUMN — FORM ═══════════ */}
          <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6">

            {/* ── CARD 1 : Visit Details ────────────────── */}
            <section className={`${CARD} p-6`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Visit Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* School */}
                <div>
                  <label className={LABEL}>School</label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => { setSelectedSchoolId(e.target.value); setFormData({ ...formData, schoolId: e.target.value, studentId: '' }); }}
                    required
                    disabled={userRole !== 'ADMIN' && userSchoolId !== ''}
                    className={SELECT}
                  >
                    <option value="">Select a school</option>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {userRole !== 'ADMIN' && userSchoolId && (
                    <p className="mt-1 text-[11px] text-slate-400">Auto-assigned to your school</p>
                  )}
                </div>

                {/* Student search */}
                <div>
                  <label className={LABEL}>Student</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isStudentDropdownOpen || !selectedStudent ? studentSearchQuery : `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.studentId})`}
                      onChange={(e) => { setStudentSearchQuery(e.target.value); setIsStudentDropdownOpen(true); if (!e.target.value) setFormData({ ...formData, studentId: '' }); }}
                      onFocus={() => { setIsStudentDropdownOpen(true); if (selectedStudent) { setStudentSearchQuery(''); setFormData({ ...formData, studentId: '' }); } }}
                      onBlur={() => setTimeout(() => setIsStudentDropdownOpen(false), 200)}
                      placeholder={selectedStudent ? 'Click to search…' : 'Search by student ID or name…'}
                      required
                      disabled={!selectedSchoolId}
                      className={INPUT}
                    />
                    <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isStudentDropdownOpen && selectedSchoolId && (
                      <div className="absolute z-20 mt-1 w-full bg-white shadow-xl max-h-60 rounded-xl border border-gray-200 py-1 overflow-auto">
                        {filteredStudents.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-400">No students found</div>
                        ) : filteredStudents.map((s) => (
                          <div key={s.id} onClick={() => handleStudentSelect(s.id)}
                            className={`px-4 py-2.5 cursor-pointer text-sm hover:bg-blue-50 transition-colors ${formData.studentId === s.id ? 'bg-blue-50' : ''}`}>
                            <span className="font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                            <span className="ml-2 text-gray-400">({s.studentId})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!selectedSchoolId && <p className="mt-1 text-[11px] text-slate-400">Select a school first</p>}
                </div>

                {/* Visit Type */}
                <div>
                  <label className={LABEL}>Visit Type</label>
                  <select value={formData.visitType} onChange={(e) => setFormData({ ...formData, visitType: e.target.value })} required className={SELECT}>
                    <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                    <option value="ILLNESS">Illness</option>
                    <option value="INJURY">Injury</option>
                    <option value="VACCINATION">Vaccination</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                  </select>
                </div>

                {/* Chief Complaint (short) */}
                <div>
                  <label className={LABEL}>Chief Complaint</label>
                  <input type="text" value={formData.chiefComplaint} onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })} placeholder="Brief complaint…" className={INPUT} />
                </div>
              </div>
            </section>

            {/* ── CARD 2 : Vital Signs ──────────────────── */}
            <section className={`${CARD} p-6`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Vital Signs</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Temperature */}
                <VitalCard icon={<Thermometer className="w-4 h-4" />} label="Temperature" unit="°C">
                  <input type="number" step="0.1" value={formData.assessment.temperature} onChange={(e) => setAssessment('temperature', e.target.value)}
                    className={INPUT} placeholder="36.5" />
                </VitalCard>

                {/* Blood Pressure */}
                <VitalCard icon={<HeartPulse className="w-4 h-4" />} label="Blood Pressure" unit="mmHg">
                  <div className="flex gap-2">
                    <input type="number" placeholder="Sys" value={formData.assessment.bloodPressureSystolic} onChange={(e) => setAssessment('bloodPressureSystolic', e.target.value)} className={INPUT} />
                    <span className="self-center text-gray-300">/</span>
                    <input type="number" placeholder="Dia" value={formData.assessment.bloodPressureDiastolic} onChange={(e) => setAssessment('bloodPressureDiastolic', e.target.value)} className={INPUT} />
                  </div>
                </VitalCard>

                {/* Heart Rate */}
                <VitalCard icon={<HeartPulse className="w-4 h-4" />} label="Heart Rate" unit="bpm">
                  <input type="number" value={formData.assessment.heartRate} onChange={(e) => setAssessment('heartRate', e.target.value)} className={INPUT} placeholder="80" />
                </VitalCard>

                {/* Respiratory Rate */}
                <VitalCard icon={<Wind className="w-4 h-4" />} label="Respiratory Rate" unit="/min">
                  <input type="number" value={formData.assessment.respiratoryRate} onChange={(e) => setAssessment('respiratoryRate', e.target.value)} className={INPUT} placeholder="18" />
                </VitalCard>

                {/* O₂ Saturation */}
                <VitalCard icon={<Droplets className="w-4 h-4" />} label="Oxygen Saturation" unit="%">
                  <input type="number" step="0.1" value={formData.assessment.oxygenSaturation} onChange={(e) => setAssessment('oxygenSaturation', e.target.value)} className={INPUT} placeholder="98" />
                </VitalCard>

                {/* Height / Weight */}
                <VitalCard icon={<Ruler className="w-4 h-4" />} label="Height / Weight" unit="cm · kg">
                  <div className="flex gap-2">
                    <input type="number" step="0.1" placeholder="Height" value={formData.assessment.height} onChange={(e) => setAssessment('height', e.target.value)} className={INPUT} />
                    <input type="number" step="0.1" placeholder="Weight" value={formData.assessment.weight} onChange={(e) => setAssessment('weight', e.target.value)} className={INPUT} />
                  </div>
                </VitalCard>
              </div>
            </section>

            {/* ── CARD 3 : Assessment & Clinical Notes ──── */}
            <section className={`${CARD} p-6 space-y-6`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Assessment &amp; Clinical Notes</h2>
              </div>

              {/* Chief Complaint (expanded) */}
              <div>
                <label className={LABEL}>Detailed Complaint</label>
                <textarea rows={3} value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Describe the primary reason for today's visit…"
                  className={`${INPUT} resize-none`} />
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {['Headache','Fever','Abdominal pain','Injury during sports','Respiratory symptoms','Nausea / Vomiting','Dizziness'].map((chip) => (
                    <button key={chip} type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, chiefComplaint: prev.chiefComplaint ? `${prev.chiefComplaint.trim()}${prev.chiefComplaint.trim().endsWith('.') ? '' : '.'} ${chip}` : chip }))}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                      <span className="text-[10px]">+</span>{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Scale */}
              <div>
                <label className={LABEL}>Pain Scale</label>
                <p className="text-[11px] text-slate-400 mb-2">Tap the face that best matches the patient&apos;s pain level.</p>
                <PainScaleSelector
                  value={formData.assessment.painScale}
                  onChange={(score) => setAssessment('painScale', score.toString())}
                />
              </div>

              {/* Diagnosis */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={LABEL}>Diagnosis</label>
                  <select className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    defaultValue=""
                    onChange={(e) => { if (!e.target.value) return; setFormData((p) => ({ ...p, diagnosis: p.diagnosis ? `${p.diagnosis}\n${e.target.value}` : e.target.value })); }}>
                    <option value="">Common diagnoses…</option>
                    <option value="Upper respiratory tract infection">Upper respiratory tract infection</option>
                    <option value="Viral fever">Viral fever</option>
                    <option value="Tension-type headache">Tension-type headache</option>
                    <option value="Minor musculoskeletal injury">Minor musculoskeletal injury</option>
                    <option value="Allergic reaction">Allergic reaction</option>
                  </select>
                </div>
                <textarea value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} rows={3} className={`${INPUT} resize-none`} placeholder="Enter diagnosis…" />
              </div>

              {/* Plan / Treatment */}
              <div>
                <label className={LABEL}>Plan / Treatment</label>
                <textarea value={formData.treatment} onChange={(e) => setFormData({ ...formData, treatment: e.target.value })} rows={3} className={`${INPUT} resize-none`} placeholder="Describe treatment plan…" />
              </div>

              {/* Notes */}
              <div>
                <label className={LABEL}>Additional Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className={`${INPUT} resize-none`} placeholder="Any other observations…" />
              </div>
            </section>

            {/* ── CARD 4 : Vision & Health Record ───────── */}
            <section className={`${CARD} p-6`}>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Vision &amp; Health Record</h2>
                  <p className="text-[11px] text-slate-400">Auto-populated from latest health record. Modify if needed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className={LABEL}>Color Blindness</label>
                  <select value={formData.assessment.colorBlindness} onChange={(e) => setAssessment('colorBlindness', e.target.value)} className={SELECT}>
                    <option value="">Select</option><option value="Normal">Normal</option><option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Vision Testing Performed</label>
                  <select value={formData.assessment.visionTestingPerformed} onChange={(e) => setAssessment('visionTestingPerformed', e.target.value)} className={SELECT}>
                    <option value="">Select</option><option value="true">Yes</option><option value="false">No</option>
                  </select>
                </div>
                {formData.assessment.visionTestingPerformed === 'false' && (
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Reason Not Performed</label>
                    <input type="text" value={formData.assessment.visionTestingNotPerformedReason} onChange={(e) => setAssessment('visionTestingNotPerformedReason', e.target.value)} className={INPUT} />
                  </div>
                )}
                <div>
                  <label className={LABEL}>Corrective Lenses</label>
                  <select value={formData.assessment.correctiveLenses} onChange={(e) => setAssessment('correctiveLenses', e.target.value)} className={SELECT}>
                    <option value="">Select</option><option value="None">None</option><option value="Glasses">Glasses</option><option value="Contact lenses">Contact lenses</option><option value="Surgical correction">Surgical correction</option><option value="Other">Other</option>
                  </select>
                </div>
                {formData.assessment.correctiveLenses === 'Other' && (
                  <div>
                    <label className={LABEL}>Other Reason</label>
                    <input type="text" value={formData.assessment.correctiveLensesOtherReason} onChange={(e) => setAssessment('correctiveLensesOtherReason', e.target.value)} className={INPUT} />
                  </div>
                )}

                {/* Eye acuity (4 selects) */}
                {([
                  ['rightEye', 'Right Eye'],
                  ['leftEye', 'Left Eye'],
                  ['rightEyeWithCorrection', 'Right Eye (Correction)'],
                  ['leftEyeWithCorrection', 'Left Eye (Correction)'],
                ] as const).map(([key, lbl]) => (
                  <div key={key}>
                    <label className={LABEL}>{lbl}</label>
                    <select value={(formData.assessment as any)[key]} onChange={(e) => setAssessment(key, e.target.value)} className={SELECT}>
                      <option value="">Select</option>
                      {ACUITY.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                ))}

                <div>
                  <label className={LABEL}>Vision Screening Result</label>
                  <select value={formData.assessment.visionScreeningResult} onChange={(e) => setAssessment('visionScreeningResult', e.target.value)} className={SELECT}>
                    <option value="">Select</option><option value="Normal">Normal</option><option value="Abnormal">Abnormal</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ── Follow-up & Notify (inline) ───────────── */}
            <section className={`${CARD} p-6 space-y-4`}>
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.followUpRequired} onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Follow-up required</span>
                </label>
                {formData.followUpRequired && (
                  <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} className={`${INPUT} w-auto`} />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.notifyParent} onChange={(e) => setFormData({ ...formData, notifyParent: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Send notification email to parent</span>
                </label>
                {formData.notifyParent && (
                  <p className="text-xs text-slate-400">An email with visit details will be sent to the student&apos;s parent.</p>
                )}
              </div>
            </section>
          </form>

          {/* ════════════════ RIGHT COLUMN — SIDEBAR ═══════ */}
          <aside className="space-y-5 lg:sticky lg:top-20">

            {/* Patient Snapshot */}
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Patient Snapshot</h2>
                  <p className="text-[11px] text-slate-400">Allergies, conditions &amp; quick history</p>
                </div>
              </div>

              {/* Allergies */}
              <div className={`rounded-xl border px-4 py-3 mb-4 ${
                studentSummary?.healthSummary?.allergies && studentSummary.healthSummary.allergies !== 'None recorded'
                  ? 'border-rose-200 bg-rose-50/70'
                  : 'border-gray-200 bg-gray-50/60'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className={`w-3.5 h-3.5 ${
                    studentSummary?.healthSummary?.allergies && studentSummary.healthSummary.allergies !== 'None recorded' ? 'text-rose-500' : 'text-gray-400'
                  }`} />
                  <p className="text-xs font-semibold text-slate-700">Allergies</p>
                </div>
                <p className="text-xs text-slate-600">{studentSummary?.healthSummary?.allergies || 'No allergies recorded'}</p>
              </div>

              {/* Chronic Conditions */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-1">Chronic Conditions</p>
                <p className="text-xs text-slate-600">{studentSummary?.healthSummary?.chronicConditions || 'None recorded'}</p>
              </div>

              {/* Medications */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-1">Medications</p>
                <p className="text-xs text-slate-600">{studentSummary?.healthSummary?.medications || 'None recorded'}</p>
              </div>

              {/* Stats row */}
              {studentSummary?.statistics && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-blue-700">{studentSummary.statistics.totalVisits ?? 0}</p>
                    <p className="text-[10px] text-blue-500 font-medium">Total Visits</p>
                  </div>
                  <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-purple-700">{studentSummary.student?.grade ?? '—'}</p>
                    <p className="text-[10px] text-purple-500 font-medium">Grade</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent History */}
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Recent History</h2>
              </div>

              {formData.studentId ? (
                previousVisits.length === 0 && !loadingVisits ? (
                  <p className="text-xs text-slate-400 text-center py-4">No previous visits found</p>
                ) : (
                  <ol className="relative border-l-2 border-gray-200 space-y-4 ml-2 max-h-[360px] overflow-y-auto pr-1">
                    {previousVisits.slice(0, 5).map((visit) => (
                      <li key={visit.id} className="ml-4 relative">
                        <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                        <button type="button" onClick={() => setSelectedVisit(visit)} className="w-full text-left group">
                          <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {formatVisitType(visit.visitType)}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDate(visit.visitDate)}</p>
                          {visit.chiefComplaint && (
                            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{visit.chiefComplaint}</p>
                          )}
                        </button>
                      </li>
                    ))}
                    {loadingVisits && <li className="ml-4 text-[11px] text-slate-400">Loading…</li>}
                  </ol>
                )
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Select a student to view history</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Fixed Footer Bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <p className="hidden sm:block text-xs text-slate-400">
            {selectedStudent
              ? `Creating assessment for ${selectedStudent.firstName} ${selectedStudent.lastName}`
              : 'Select a student to begin'}
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" form="assessment-form" disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 transition-colors">
              {loading ? 'Saving…' : 'Save Assessment'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Visit Preview Modal ─────────────────────────── */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-base font-semibold text-gray-900">
                Visit — {formatDate(selectedVisit.visitDate)}
              </h3>
              <button onClick={() => setSelectedVisit(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Visit Type</p><p className="text-sm text-gray-900">{formatVisitType(selectedVisit.visitType)}</p></div>
                <div><p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Date</p><p className="text-sm text-gray-900">{formatDate(selectedVisit.visitDate)}</p></div>
              </div>
              {selectedVisit.chiefComplaint && (
                <div><p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Chief Complaint</p><p className="text-sm text-gray-900">{selectedVisit.chiefComplaint}</p></div>
              )}
              {selectedVisit.diagnosis && (
                <div><p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Diagnosis</p><p className="text-sm text-gray-900">{selectedVisit.diagnosis}</p></div>
              )}
              {selectedVisit.assessment && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase mb-2">Vital Signs</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedVisit.assessment.temperature && (
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{selectedVisit.assessment.temperature}°C</p>
                        <p className="text-[10px] text-slate-400">Temperature</p>
                      </div>
                    )}
                    {selectedVisit.assessment.bloodPressureSystolic && (
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{selectedVisit.assessment.bloodPressureSystolic}/{selectedVisit.assessment.bloodPressureDiastolic || '—'}</p>
                        <p className="text-[10px] text-slate-400">BP mmHg</p>
                      </div>
                    )}
                    {selectedVisit.assessment.heartRate && (
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{selectedVisit.assessment.heartRate}</p>
                        <p className="text-[10px] text-slate-400">Heart Rate bpm</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Created By</p>
                <p className="text-sm text-gray-900">{selectedVisit.creator.firstName} {selectedVisit.creator.lastName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* ── Sub-component: Vital Card ─────────────────────────── */
function VitalCard({ icon, label, unit, children }: { icon: React.ReactNode; label: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-gray-50/40 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">{unit}</span>
      </div>
      {children}
    </div>
  );
}
