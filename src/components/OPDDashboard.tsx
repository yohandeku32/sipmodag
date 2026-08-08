import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Save,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  User,
  WalletCards,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getReviewAction, postReviewAction, toBoolean } from '../reviewApi';
import { OPDData } from '../types';
import { BudgetInput, BudgetRecord, ReviewNotification, ReviewRecord, RevisionTarget } from '../reviewTypes';

type UploadSlotKey = 'file1' | 'file2' | 'file3' | 'file4';

type UploadedFile = {
  name: string;
  size: string;
  fileObj: File | null;
} | null;

type UploadedFiles = Record<UploadSlotKey, UploadedFile>;

type Props = {
  apiUrl: string;
  loggedInOPD: OPDData;
  handleLogout: () => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  uploadedFiles: UploadedFiles;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFiles>>;
  uploadStatus: 'IDLE' | 'UPLOADING' | 'SUCCESS';
  uploadProgress: number;
  uploadedSuccessKeys: string[];
  handleLocalFileChange: (slot: UploadSlotKey, file: File | null) => void;
  triggerUploadSimulation: (budget: BudgetInput) => void | Promise<void>;
  revisionTarget: RevisionTarget | null;
  onStartRevision: (target: RevisionTarget) => void;
  onCancelRevision: () => void;
};

const slots: Array<{
  key: UploadSlotKey;
  title: string;
  documentName: string;
  description: string;
  accept: string;
  icon: typeof FileText;
}> = [
  {
    key: 'file1',
    title: 'Dokumen GAP',
    documentName: 'GAP',
    description: 'Gender Analysis Pathway.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: FileText,
  },
  {
    key: 'file2',
    title: 'Dokumen GBS',
    documentName: 'GBS',
    description: 'Gender Budget Statement.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: FileSpreadsheet,
  },
  {
    key: 'file3',
    title: 'Dokumen KAK',
    documentName: 'KAK',
    description: 'Kerangka Acuan Kerja responsif gender.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: FileText,
  },
  {
    key: 'file4',
    title: 'SK Focal Point',
    documentName: 'SK FOCAL POINT',
    description: 'SK Focal Point Pengarusutamaan Gender.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: ShieldCheck,
  },
];

const statusLabel: Record<string, string> = {
  MENUNGGU_REVIEW: 'Menunggu Review',
  SEDANG_DIREVIEW: 'Sedang Direview',
  PERLU_REVISI: 'Perlu Revisi',
  DIUNGGAH_ULANG: 'Diunggah Ulang',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
};

const statusClass: Record<string, string> = {
  MENUNGGU_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  SEDANG_DIREVIEW: 'border-blue-200 bg-blue-50 text-blue-700',
  PERLU_REVISI: 'border-rose-200 bg-rose-50 text-rose-700',
  DIUNGGAH_ULANG: 'border-violet-200 bg-violet-50 text-violet-700',
  DISETUJUI: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DITOLAK: 'border-slate-300 bg-slate-100 text-slate-700',
};

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

const formatAmountInput = (value: string | number) => {
  const digits = onlyDigits(String(value ?? ''));
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
};

const parseAmountInput = (value: string) => Number(onlyDigits(value) || 0);

const formatRupiah = (value: string | number | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function OPDDashboard({
  apiUrl,
  loggedInOPD,
  handleLogout,
  selectedYear,
  setSelectedYear,
  uploadedFiles,
  setUploadedFiles,
  uploadStatus,
  uploadProgress,
  uploadedSuccessKeys,
  handleLocalFileChange,
  triggerUploadSimulation,
  revisionTarget,
  onStartRevision,
  onCancelRevision,
}: Props) {
  const selectedCount = Object.values(uploadedFiles).filter(Boolean).length;
  const [notifications, setNotifications] = useState<ReviewNotification[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [paguAnggaran, setPaguAnggaran] = useState('');
  const [tanggalPagu, setTanggalPagu] = useState('');
  const [realisasiAnggaran, setRealisasiAnggaran] = useState('');
  const [tanggalRealisasi, setTanggalRealisasi] = useState('');
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState<string | null>(null);

  const unreadCount = notifications.filter(item => !toBoolean(item.IS_READ)).length;

  const loadBudgetData = async () => {
    setBudgetLoading(true);
    setBudgetMessage(null);

    try {
      const result = await getReviewAction<{ budget: BudgetRecord | null }>(
        apiUrl,
        'getOPDBudget',
        { opdName: loggedInOPD.namaOPD, tahun: selectedYear },
      );

      const budget = result.budget;
      setPaguAnggaran(budget ? formatAmountInput(budget.PAGU_ARG) : '');
      setTanggalPagu(budget?.TANGGAL_PAGU || '');
      setRealisasiAnggaran(
        budget && Number(budget.REALISASI_ARG || 0) > 0
          ? formatAmountInput(budget.REALISASI_ARG)
          : '',
      );
      setTanggalRealisasi(budget?.TANGGAL_REALISASI || '');
    } catch (error) {
      setPaguAnggaran('');
      setTanggalPagu('');
      setRealisasiAnggaran('');
      setTanggalRealisasi('');
      setBudgetMessage(error instanceof Error ? error.message : 'Data anggaran gagal dimuat.');
    } finally {
      setBudgetLoading(false);
    }
  };

  const getBudgetPayload = (): BudgetInput | null => {
    const pagu = parseAmountInput(paguAnggaran);
    const realisasi = parseAmountInput(realisasiAnggaran);

    if (pagu <= 0 || !tanggalPagu) {
      setBudgetMessage('Pagu Anggaran Responsif Gender dan tanggal pagu wajib diisi sebelum upload.');
      return null;
    }

    if (realisasi > 0 && !tanggalRealisasi) {
      setBudgetMessage('Tanggal realisasi wajib diisi jika realisasi anggaran sudah diisi.');
      return null;
    }

    return {
      paguAnggaran: pagu,
      tanggalPagu,
      realisasiAnggaran: realisasi,
      tanggalRealisasi: realisasi > 0 ? tanggalRealisasi : '',
    };
  };

  const saveBudgetData = async () => {
    const budget = getBudgetPayload();
    if (!budget) return;

    setBudgetSaving(true);
    setBudgetMessage(null);

    try {
      await postReviewAction<{ budget: BudgetRecord }>(apiUrl, {
        action: 'saveOPDBudget',
        opdName: loggedInOPD.namaOPD,
        tahun: selectedYear,
        ...budget,
      });
      setBudgetMessage('Data anggaran berhasil disimpan.');
    } catch (error) {
      setBudgetMessage(error instanceof Error ? error.message : 'Data anggaran gagal disimpan.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleUploadWithBudget = () => {
    const budget = getBudgetPayload();
    if (!budget) return;
    void triggerUploadSimulation(budget);
  };

  const loadReviewData = async (silent = false) => {
    if (!silent) setLoadingReviews(true);
    setReviewError(null);

    try {
      const [notificationResult, reviewResult] = await Promise.all([
        getReviewAction<{ unreadCount: number; notifications: ReviewNotification[] }>(
          apiUrl,
          'getOPDNotifications',
          { opdName: loggedInOPD.namaOPD },
        ),
        getReviewAction<{ count: number; reviews: ReviewRecord[] }>(
          apiUrl,
          'getOPDReviews',
          { opdName: loggedInOPD.namaOPD, tahun: selectedYear },
        ),
      ]);

      setNotifications(notificationResult.notifications || []);
      setReviews(reviewResult.reviews || []);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Data review gagal dimuat.');
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    void loadBudgetData();
  }, [loggedInOPD.namaOPD, selectedYear]);

  useEffect(() => {
    void loadReviewData();
    const timer = window.setInterval(() => void loadReviewData(true), 30000);
    return () => window.clearInterval(timer);
  }, [loggedInOPD.namaOPD, selectedYear]);

  const reviewById = useMemo(
    () => new Map(reviews.map(item => [item.REVIEW_ID, item])),
    [reviews],
  );

  const markNotificationRead = async (notification: ReviewNotification) => {
    if (toBoolean(notification.IS_READ)) return;

    setNotifications(current =>
      current.map(item =>
        item.NOTIFICATION_ID === notification.NOTIFICATION_ID
          ? { ...item, IS_READ: true }
          : item,
      ),
    );

    try {
      await postReviewAction(apiUrl, {
        action: 'markNotificationRead',
        notificationId: notification.NOTIFICATION_ID,
      });
    } catch (error) {
      console.error('Gagal menandai notifikasi:', error);
    }
  };

  const startRevisionFromReview = (review: ReviewRecord) => {
    onStartRevision({
      uploadId: review.UPLOAD_ID,
      reviewId: review.REVIEW_ID,
      jenisDokumen: review.JENIS_DOKUMEN,
      tahun: review.TAHUN,
      catatan: review.CATATAN,
      reviewFileUrl: review.REVIEW_FILE_URL,
      reviewFileName: review.REVIEW_FILE_NAME,
    });

    document.getElementById('opd-upload-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const matchingRevisionSlot = revisionTarget
    ? slots.find(slot => slot.documentName === revisionTarget.jenisDokumen.toUpperCase())?.key || null
    : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F1FF] text-slate-800">
      <div className="pointer-events-none fixed -left-24 top-16 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-28 top-24 h-96 w-96 rounded-full bg-orange-200/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1500px] p-3 sm:p-5 lg:p-7">
        <div className="overflow-hidden rounded-[34px] border border-white/90 bg-[#F8F8FC] shadow-[0_32px_90px_-46px_rgba(91,92,226,0.34)] ring-1 ring-violet-100/70 lg:grid lg:min-h-[calc(100vh-3.5rem)] lg:grid-cols-[245px_minmax(0,1fr)]">

          {/* SIDEBAR */}
          <aside className="border-b border-slate-200 bg-white px-4 py-5 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
            <div className="flex items-center justify-between gap-3 lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png/500px-Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png"
                    alt="Logo Pemerintah Provinsi Nusa Tenggara Timur"
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-slate-950">SIPMODAG</p>
                  <p className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Portal OPD
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNotifications(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 transition hover:bg-violet-100 lg:hidden"
                aria-label="Buka notifikasi review"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6 hidden lg:block">
              <p className="px-3 text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Menu
              </p>

              <nav className="mt-3 space-y-1.5">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex w-full items-center gap-3 rounded-xl bg-violet-50 px-3 py-3 text-left text-[10px] font-extrabold text-violet-700"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                  <span className="ml-auto h-5 w-1 rounded-full bg-violet-600" />
                </button>

                <button
                  type="button"
                  onClick={() => document.getElementById('opd-upload-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload Dokumen
                </button>

                <button
                  type="button"
                  onClick={() => setShowNotifications(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Bell className="h-4 w-4" />
                  Notifikasi
                  {unreadCount > 0 && (
                    <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => void loadReviewData()}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Hasil Review
                </button>
              </nav>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F7F5FF] p-4 ring-1 ring-violet-100 lg:mt-8">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-violet-500">
                Tahun Anggaran
              </p>
              <div className="relative mt-3">
                <select
                  value={selectedYear}
                  onChange={event => setSelectedYear(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-violet-100 bg-white px-3 py-3 pr-9 text-xs font-extrabold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="2025">Tahun 2025</option>
                  <option value="2026">Tahun 2026</option>
                  <option value="2027">Tahun 2027</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="mt-5 hidden lg:block">
              <p className="px-3 text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Instansi
              </p>
              <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-black text-slate-900">
                      {loggedInOPD.namaPendek}
                    </p>
                    <p className="mt-1 text-[8px] font-semibold text-slate-400">
                      OPD Provinsi NTT
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-extrabold text-rose-600 transition hover:bg-rose-50 lg:flex"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <section className="min-w-0">
            {/* TOP BAR */}
            <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/55 px-5 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-violet-600">
                  Dashboard OPD
                </p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  Selamat Datang, {loggedInOPD.namaPendek}
                </h1>
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  Kelola dokumen PUG, anggaran, dan hasil review dalam satu halaman.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-[9px] font-extrabold text-slate-500 shadow-sm sm:block">
                  Tahun {selectedYear}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotifications(true)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  aria-label="Buka notifikasi review"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-[10px] font-extrabold text-white transition hover:bg-rose-700 lg:hidden"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </header>

            <div className="space-y-5 p-4 sm:p-6 lg:p-7">
              {/* METRIC CARDS */}
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Dokumen',
                    value: `${loggedInOPD.jumlahUpload}/4`,
                    caption: 'Dokumen terkirim',
                    icon: FileText,
                    iconClass: 'bg-orange-50 text-orange-500',
                    badgeClass: 'text-emerald-600',
                  },
                  {
                    label: 'Notifikasi',
                    value: unreadCount,
                    caption: 'Belum dibaca',
                    icon: Bell,
                    iconClass: 'bg-violet-50 text-violet-600',
                    badgeClass: unreadCount > 0 ? 'text-rose-500' : 'text-emerald-600',
                  },
                  {
                    label: 'Hasil Review',
                    value: reviews.length,
                    caption: `Tahun ${selectedYear}`,
                    icon: CheckCircle2,
                    iconClass: 'bg-cyan-50 text-cyan-600',
                    badgeClass: 'text-cyan-600',
                  },
                  {
                    label: 'Tahun Aktif',
                    value: selectedYear,
                    caption: 'Tahun anggaran',
                    icon: CalendarDays,
                    iconClass: 'bg-rose-50 text-rose-500',
                    badgeClass: 'text-violet-600',
                  },
                ].map(item => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                            {item.value}
                          </p>
                          <p className={`mt-1 text-[8px] font-extrabold ${item.badgeClass}`}>
                            {item.caption}
                          </p>
                        </div>

                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* REVIEW STRIP */}
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div
                  id="opd-upload-form"
                  className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-violet-600">
                        Form Pengunggahan Dokumen PUG
                      </p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                        {revisionTarget
                          ? `Upload Ulang ${revisionTarget.jenisDokumen}`
                          : `Dokumen Tahun ${selectedYear}`}
                      </h2>
                      {revisionTarget && (
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          File perbaikan akan disimpan sebagai versi baru.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl bg-violet-50 px-4 py-3 text-right ring-1 ring-violet-100">
                      <p className="text-[8px] font-extrabold uppercase tracking-wider text-violet-500">
                        Dipilih
                      </p>
                      <p className="mt-1 text-xl font-black text-violet-800">
                        {selectedCount}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    {revisionTarget && (
                      <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-black text-rose-800">
                              Dokumen memerlukan revisi
                            </p>
                            <p className="mt-2 text-[11px] leading-relaxed text-rose-700">
                              {revisionTarget.catatan ||
                                'Periksa catatan operator pada bagian hasil review.'}
                            </p>
                            {revisionTarget.reviewFileUrl && (
                              <a
                                href={revisionTarget.reviewFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka {revisionTarget.reviewFileName || 'file hasil review'}
                              </a>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={onCancelRevision}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm"
                            aria-label="Batalkan upload ulang"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ANGGARAN */}
                    <section className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 shadow-sm">
                      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-300/15 blur-3xl" />

                      <div className="relative flex flex-col gap-3 border-b border-violet-100/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                            <WalletCards className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-950">
                              Anggaran Responsif Gender
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-slate-500">
                              Tahun {selectedYear}
                            </p>
                          </div>
                        </div>
                        <span className="self-start rounded-full border border-rose-200 bg-white/80 px-2.5 py-1 text-[9px] font-extrabold text-rose-700 shadow-sm sm:self-auto">
                          Pagu wajib
                        </span>
                      </div>

                      <div className="relative p-5 pt-0">
                        {budgetLoading ? (
                          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-4 text-xs font-semibold text-slate-400 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Memuat data anggaran...
                          </div>
                        ) : (
                          <>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                  Pagu Anggaran Responsif Gender *
                                </label>
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                                    Rp
                                  </span>
                                  <input
                                    value={paguAnggaran}
                                    onChange={event => {
                                      setPaguAnggaran(formatAmountInput(event.target.value));
                                      setBudgetMessage(null);
                                    }}
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-extrabold text-slate-800 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                  Tanggal Pagu *
                                </label>
                                <div className="relative">
                                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="date"
                                    value={tanggalPagu}
                                    onChange={event => {
                                      setTanggalPagu(event.target.value);
                                      setBudgetMessage(null);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                  Realisasi Anggaran Responsif Gender
                                </label>
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                                    Rp
                                  </span>
                                  <input
                                    value={realisasiAnggaran}
                                    onChange={event => {
                                      setRealisasiAnggaran(formatAmountInput(event.target.value));
                                      setBudgetMessage(null);
                                    }}
                                    inputMode="numeric"
                                    placeholder="Bisa diisi menyusul"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-extrabold text-slate-800 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                  Tanggal Realisasi
                                </label>
                                <div className="relative">
                                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="date"
                                    value={tanggalRealisasi}
                                    disabled={!realisasiAnggaran}
                                    onChange={event => {
                                      setTanggalRealisasi(event.target.value);
                                      setBudgetMessage(null);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-950 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Ringkasan {selectedYear}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-200">
                                  Pagu {formatRupiah(parseAmountInput(paguAnggaran))} · Realisasi{' '}
                                  {formatRupiah(parseAmountInput(realisasiAnggaran))}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void saveBudgetData()}
                                disabled={budgetSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-[10px] font-extrabold text-white transition hover:bg-violet-700 disabled:opacity-50"
                              >
                                {budgetSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                {budgetSaving ? 'Menyimpan...' : 'Simpan / Perbarui Anggaran'}
                              </button>
                            </div>
                          </>
                        )}

                        {budgetMessage && (
                          <div
                            className={`mt-4 rounded-xl border px-4 py-3 text-[10px] font-semibold shadow-sm ${
                              budgetMessage.includes('berhasil')
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {budgetMessage}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* UPLOAD CARDS */}
                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {slots.map((slot, index) => {
                        const Icon = slot.icon;
                        const file = uploadedFiles[slot.key];
                        const isUploaded = uploadedSuccessKeys.includes(slot.key);
                        const inputId = `upload-${slot.key}`;
                        const disabledByRevision = Boolean(
                          revisionTarget && matchingRevisionSlot !== slot.key,
                        );

                        const accent =
                          index === 0
                            ? 'bg-orange-50 text-orange-500'
                            : index === 1
                              ? 'bg-violet-50 text-violet-600'
                              : index === 2
                                ? 'bg-cyan-50 text-cyan-600'
                                : 'bg-rose-50 text-rose-500';

                        return (
                          <article
                            key={slot.key}
                            className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                              disabledByRevision
                                ? 'border-slate-200 bg-slate-50 opacity-45'
                                : isUploaded
                                  ? 'border-emerald-200 bg-emerald-50/45'
                                  : file
                                    ? 'border-violet-200 bg-violet-50/45'
                                    : 'border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`rounded-xl p-2.5 ${
                                    isUploaded ? 'bg-emerald-100 text-emerald-700' : accent
                                  }`}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                                    {slot.title}
                                  </h3>
                                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                                    {slot.description}
                                  </p>
                                </div>
                              </div>

                              {isUploaded && !revisionTarget ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[8px] font-extrabold text-emerald-700">
                                  <Check className="h-3 w-3" /> Terkirim
                                </span>
                              ) : file ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[8px] font-extrabold text-violet-700">
                                  <Check className="h-3 w-3" /> Terpilih
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-5">
                              {file ? (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-extrabold text-slate-700">
                                      {file.name}
                                    </p>
                                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                                      {file.size}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setUploadedFiles(previous => ({
                                        ...previous,
                                        [slot.key]: null,
                                      }))
                                    }
                                    className="shrink-0 rounded-lg bg-red-50 px-2.5 py-2 text-[9px] font-extrabold text-red-600"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <input
                                    id={inputId}
                                    type="file"
                                    accept={slot.accept}
                                    disabled={disabledByRevision}
                                    className="hidden"
                                    onChange={event => {
                                      handleLocalFileChange(
                                        slot.key,
                                        event.target.files?.[0] || null,
                                      );
                                      event.currentTarget.value = '';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    disabled={disabledByRevision}
                                    onClick={() =>
                                      document.getElementById(inputId)?.click()
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-4 py-3.5 text-[10px] font-extrabold text-white transition hover:bg-violet-700 disabled:pointer-events-none disabled:bg-slate-300"
                                  >
                                    <UploadCloud className="h-4 w-4" />
                                    {revisionTarget && matchingRevisionSlot === slot.key
                                      ? 'Pilih File Revisi'
                                      : 'Pilih Dokumen'}
                                  </button>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {uploadStatus === 'UPLOADING' && (
                      <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                        <div className="flex items-center justify-between gap-4 text-xs font-extrabold text-violet-800">
                          <span className="flex items-center gap-2">
                            <UploadCloud className="h-4 w-4 animate-pulse" />
                            Sedang mengunggah...
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                          <div
                            className="h-full rounded-full bg-violet-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[9px] font-semibold leading-relaxed text-slate-400">
                        Format PDF, DOC, DOCX, XLS, XLSX. Maksimal 10 MB per file.
                      </p>
                      <button
                        type="button"
                        onClick={handleUploadWithBudget}
                        disabled={
                          uploadStatus !== 'IDLE' ||
                          selectedCount === 0 ||
                          budgetLoading ||
                          parseAmountInput(paguAnggaran) <= 0 ||
                          !tanggalPagu
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-600 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {uploadStatus === 'SUCCESS' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <UploadCloud className="h-4 w-4" />
                        )}
                        {revisionTarget ? 'Kirim File Revisi' : 'Kirim ke Antrean Review'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PANEL HASIL REVIEW */}
                <aside className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-violet-600">
                        Requests
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-950">
                        Hasil Review
                      </h3>
                      <p className="mt-1 text-[9px] text-slate-400">
                        Tahun {selectedYear}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void loadReviewData()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
                      aria-label="Segarkan hasil review"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingReviews ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="mt-5">
                    {reviewError ? (
                      <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] font-semibold leading-relaxed text-red-700">
                        {reviewError}
                      </p>
                    ) : loadingReviews ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat review...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-inset ring-slate-100">
                        <CheckCircle2 className="mx-auto h-7 w-7 text-slate-300" />
                        <p className="mt-3 text-[10px] font-bold text-slate-500">
                          Belum ada hasil review
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.slice(0, 6).map(review => (
                          <article
                            key={review.REVIEW_ID}
                            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-violet-100 hover:bg-violet-50/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-black text-slate-900">
                                  {review.JENIS_DOKUMEN}
                                </p>
                                <p className="mt-1 text-[8px] text-slate-400">
                                  {review.CREATED_AT}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-[7px] font-extrabold ${
                                  statusClass[review.STATUS_REVIEW] ||
                                  statusClass.SEDANG_DIREVIEW
                                }`}
                              >
                                {statusLabel[review.STATUS_REVIEW] || review.STATUS_REVIEW}
                              </span>
                            </div>

                            {review.CATATAN && (
                              <p className="mt-3 line-clamp-3 text-[9px] leading-relaxed text-slate-600">
                                {review.CATATAN}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {review.REVIEW_FILE_URL && (
                                <a
                                  href={review.REVIEW_FILE_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[8px] font-extrabold text-slate-600 hover:text-violet-700"
                                >
                                  <Download className="h-3 w-3" />
                                  File Review
                                </a>
                              )}

                              {review.STATUS_REVIEW === 'PERLU_REVISI' && (
                                <button
                                  type="button"
                                  onClick={() => startRevisionFromReview(review)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-2 text-[8px] font-extrabold text-white hover:bg-violet-700"
                                >
                                  <UploadCloud className="h-3 w-3" />
                                  Upload Ulang
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNotifications(true)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-[9px] font-extrabold text-violet-700 transition hover:bg-violet-100"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Lihat Notifikasi
                  </button>
                </aside>
              </section>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.button
              type="button"
              aria-label="Tutup notifikasi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
            />

            <motion.aside
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed right-4 top-20 z-[100] flex max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:right-6 sm:top-24"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-950">Notifikasi</h2>
                    {unreadCount > 0 && (
                      <p className="mt-0.5 text-[9px] font-semibold text-slate-400">{unreadCount} belum dibaca</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-3">
                {notifications.length === 0 ? (
                  <div className="flex min-h-44 flex-col items-center justify-center text-center">
                    <Bell className="h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-xs font-black text-slate-700">Belum ada notifikasi</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map(notification => {
                      const review = reviewById.get(notification.REVIEW_ID);
                      const unread = !toBoolean(notification.IS_READ);

                      return (
                        <article
                          key={notification.NOTIFICATION_ID}
                          onClick={() => void markNotificationRead(notification)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                            unread
                              ? 'border-violet-200 bg-violet-50/80'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-900">{notification.JUDUL}</p>
                              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">{notification.PESAN}</p>
                            </div>
                            {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />}
                          </div>

                          <p className="mt-2 text-[8px] text-slate-400">{notification.CREATED_AT}</p>

                          {review && (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {review.REVIEW_FILE_URL && (
                                <a
                                  href={review.REVIEW_FILE_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={event => event.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-extrabold text-slate-600 hover:text-blue-700"
                                >
                                  <Download className="h-3 w-3" /> File Review
                                </a>
                              )}

                              {review.STATUS_REVIEW === 'PERLU_REVISI' && (
                                <button
                                  type="button"
                                  onClick={event => {
                                    event.stopPropagation();
                                    void markNotificationRead(notification);
                                    startRevisionFromReview(review);
                                    setShowNotifications(false);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[8px] font-extrabold text-white hover:bg-violet-700"
                                >
                                  <UploadCloud className="h-3 w-3" /> Upload Ulang
                                </button>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
