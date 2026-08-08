import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileClock,
  FileSearch,
  FileText,
  Loader2,
  LogOut,
  LayoutDashboard,
  RotateCcw,
  RefreshCw,
  Search,
  Send,
  Table2,
  Check,
  Minus,
  ShieldCheck,
  UploadCloud,
  WalletCards,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { fileToBase64, getReviewAction, postReviewAction } from '../reviewApi';
import { OperatorSession, ReviewStatus, ReviewUpload } from '../reviewTypes';
import OperatorAccountManager from './OperatorAccountManager';

type Props = {
  apiUrl: string;
  session: OperatorSession;
  onLogout: () => void;
};

type QueueResponse = {
  count: number;
  items: ReviewUpload[];
};

type SubmitReviewResponse = {
  reviewId: string;
  uploadId: string;
  statusReview: ReviewStatus;
};

type OperatorTab = 'review' | 'opd-dashboard' | 'accounts';

type OPDOverviewRaw = {
  OPD_ID: string;
  NAMA_OPD: string;
  TAHUN: string;
  HAS_GAP: number | string;
  HAS_GBS: number | string;
  HAS_KAK: number | string;
  HAS_SK: number | string;
  UPLOAD_COUNT: number | string;
  LAST_UPLOADED_AT?: string | null;
};

type OPDOverviewResponse = {
  count: number;
  items: OPDOverviewRaw[];
};

type OPDBudgetRecord = {
  ANGGARAN_ID?: string;
  OPD_ID?: string;
  NAMA_OPD?: string;
  TAHUN?: string;
  PAGU_ARG?: number | string;
  TANGGAL_PAGU?: string | null;
  REALISASI_ARG?: number | string;
  TANGGAL_REALISASI?: string | null;
  UPDATED_AT?: string | null;
};

type OPDBudgetResponse = {
  budget: OPDBudgetRecord | null;
};

type ResetOPDResponse = {
  message: string;
  tahun: string;
  opdName: string;
  deleted: {
    uploads: number;
    reviews: number;
    notifications: number;
    anggaran: number;
  };
};

type DashboardOPDRow = {
  no: number;
  namaOPD: string;
  opdIds: string[];
  gap: boolean;
  gbs: boolean;
  kak: boolean;
  sk: boolean;
  uploadCount: number;
  lastUploadedAt: string;
};

const OFFICIAL_42_OPDS = [
  'BIRO UMUM SETDA PROVINSI NTT',
  'BIRO PENGADAAN BARANG DAN JASA SETDA PROVINSI NTT',
  'BIRO PEMERINTAHAN SETDA PROVINSI NTT',
  'BIRO ORGANISASI SETDA PROVINSI NTT',
  'BIRO ADMINISTRASI PIMPINAN SETDA PROVINSI NTT',
  'BIRO HUKUM SETDA PROVINSI NTT',
  'BIRO PEREKONOMIAN DAN ADMINISTRASI PEMBANGUNAN SETDA PROVINSI NTT',
  'BADAN PENGELOLAAN BENCANA DAERAH PROVINSI NTT',
  'BADAN SATUAN POLISI PAMONG PRAJA PROVINSI NTT',
  'BADAN KESATUAN BANGSA DAN POLITIK PROVINSI NTT',
  'BADAN PERENCANAAN PEMBANGUNAN, RISET DAN INOVASI DAERAH PROVINSI NTT',
  'BADAN PENGELOLAAN PERBATASAN DAERAH PROVINSI NTT',
  'BADAN PENDAPATAN DAN ASET DAERAH PROVINSI NTT',
  'BADAN PENGEMBANGAN SUMBER DAYA MANUSIA DAERAH PROVINSI NTT',
  'BADAN KEUANGAN DAERAH PROVINSI NTT',
  'BADAN KEPEGAWAIAN DAERAH PROVINSI NTT',
  'BADAN PENGHUBUNG PROVINSI NTT',
  'DINAS SOSIAL PROVINSI NTT',
  'DINAS LINGKUNGAN HIDUP DAN KEHUTANAN PROVINSI NTT',
  'DINAS KETENAGAKERJAAN DAN TRANSMIGRASI PROVINSI NTT',
  'DINAS KELAUTAN DAN PERIKANAN PROVINSI NTT',
  'DINAS PERHUBUNGAN PROVINSI NTT',
  'DINAS PENDIDIKAN DAN KEBUDAYAAN PROVINSI NTT',
  'DINAS PARIWISATA DAN EKONOMI KREATIF PROVINSI NTT',
  'DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU PROVINSI NTT',
  'DINAS PETERNAKAN PROVINSI NTT',
  'DINAS PERINDUSTRIAN DAN PERDAGANGAN PROVINSI NTT',
  'DINAS PEKERJAAN UMUM DAN PERUMAHAN RAKYAT PROVINSI NTT',
  'DINAS PEMBERDAYAAN MASYARAKAT DESA PROVINSI NTT',
  'DINAS PERTANIAN DAN KETAHANAN PANGAN PROVINSI NTT',
  'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL PROVINSI NTT',
  'DINAS KOMUNIKASI DAN INFORMASI PROVINSI NTT',
  'DINAS ENERGI DAN SUMBER DAYA MINERAL PROVINSI NTT',
  'DINAS KESEHATAN PROVINSI NTT',
  'DINAS KEARSIPAN DAN PERPUSTAKAAN PROVINSI NTT',
  'DINAS KEPEMUDAAN DAN OLAHRAGA PROVINSI NTT',
  'DINAS KOPERASI DAN USAHA KECIL MENENGAH PROVINSI NTT',
  'DINAS P3AP2KB PROVINSI NTT',
  'INSPEKTORAT DAERAH PROVINSI NTT',
  'SEKRETARIAT DEWAN PROVINSI NTT',
  'RSUD. W. Z. YOHANES KUPANG',
  'RSKD JIWA NAIMATA',
] as const;

const normalizeDashboardOPDName = (value: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/&/g, ' DAN ')
    .replace(/\bNUSA\s+TENGGARA\s+TIMUR\b/g, ' NTT ')
    .replace(/\bPROVINSI\s+NTT\b/g, ' NTT ')
    .replace(/\bSEKRETARIAT\s+DAERAH\b/g, ' SETDA ')
    .replace(/\bSATUAN\s+POLISI\s+PAMONG\s+PRAJA\b/g, ' SATPOL PP ')
    .replace(/\bRUMAH\s+SAKIT\s+UMUM\s+DAERAH\b/g, ' RSUD ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const OPD_STOP_WORDS = new Set([
  'PROVINSI', 'NTT', 'NUSA', 'TENGGARA', 'TIMUR', 'PEMERINTAH',
  'DAERAH', 'DAN', 'DINAS', 'BADAN', 'BIRO', 'SEKRETARIAT',
  'SETDA', 'UNIT', 'PELAKSANA', 'TEKNIS',
]);

const getDashboardOPDTokens = (value: string): string[] =>
  Array.from(
    new Set(
      normalizeDashboardOPDName(value)
        .split(' ')
        .filter(token => token.length > 1 && !OPD_STOP_WORDS.has(token)),
    ),
  );

const getDashboardOPDSimilarity = (left: string, right: string): number => {
  const normalizedLeft = normalizeDashboardOPDName(left);
  const normalizedRight = normalizeDashboardOPDName(right);

  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const compactLeft = normalizedLeft.replace(/\s+/g, '');
  const compactRight = normalizedRight.replace(/\s+/g, '');
  if (compactLeft === compactRight) return 0.99;

  const leftTokens = new Set(getDashboardOPDTokens(left));
  const rightTokens = new Set(getDashboardOPDTokens(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return compactLeft.includes(compactRight) || compactRight.includes(compactLeft)
      ? 0.75
      : 0;
  }

  let intersection = 0;
  leftTokens.forEach(token => {
    if (rightTokens.has(token)) intersection += 1;
  });

  const dice = (2 * intersection) / (leftTokens.size + rightTokens.size);
  const containsBonus =
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
      ? 0.15
      : 0;

  return Math.min(1, dice + containsBonus);
};

const hasFlag = (value: number | string | undefined) => Number(value || 0) > 0;

const STATUS_OPTIONS: Array<{ value: ReviewStatus | ''; label: string }> = [
  { value: '', label: 'Semua antrean' },
  { value: 'MENUNGGU_REVIEW', label: 'Menunggu review' },
  { value: 'DIUNGGAH_ULANG', label: 'Diunggah ulang' },
  { value: 'SEDANG_DIREVIEW', label: 'Sedang direview' },
  { value: 'PERLU_REVISI', label: 'Perlu revisi' },
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'DITOLAK', label: 'Ditolak' },
];

const statusLabel: Record<ReviewStatus, string> = {
  MENUNGGU_REVIEW: 'Menunggu Review',
  SEDANG_DIREVIEW: 'Sedang Direview',
  PERLU_REVISI: 'Perlu Revisi',
  DIUNGGAH_ULANG: 'Diunggah Ulang',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
};

const statusClass: Record<ReviewStatus, string> = {
  MENUNGGU_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  SEDANG_DIREVIEW: 'border-blue-200 bg-blue-50 text-blue-700',
  PERLU_REVISI: 'border-rose-200 bg-rose-50 text-rose-700',
  DIUNGGAH_ULANG: 'border-violet-200 bg-violet-50 text-violet-700',
  DISETUJUI: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DITOLAK: 'border-slate-300 bg-slate-100 text-slate-700',
};

const formatRupiah = (value: number | string | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getRealisasiPercentage = (pagu: number | string | undefined, realisasi: number | string | undefined) => {
  const paguNumber = Number(pagu || 0);
  const realisasiNumber = Number(realisasi || 0);
  if (paguNumber <= 0) return 0;
  return Math.min(100, Math.max(0, (realisasiNumber / paguNumber) * 100));
};

export default function OperatorDashboard({ apiUrl, session, onLogout }: Props) {
  const [queue, setQueue] = useState<ReviewUpload[]>([]);
  const [selected, setSelected] = useState<ReviewUpload | null>(null);
  const [year, setYear] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('PERLU_REVISI');
  const [note, setNote] = useState('');
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<OperatorTab>('review');
  const [overviewYear, setOverviewYear] = useState<string>(
    String(new Date().getFullYear()),
  );
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewRows, setOverviewRows] = useState<OPDOverviewRaw[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [budgetPopover, setBudgetPopover] = useState<{
    opdName: string;
    top: number;
    left: number;
  } | null>(null);
  const [budgetPopoverData, setBudgetPopoverData] =
    useState<OPDBudgetRecord | null>(null);
  const [budgetPopoverLoading, setBudgetPopoverLoading] =
    useState(false);
  const [budgetPopoverError, setBudgetPopoverError] =
    useState<string | null>(null);
  const budgetRequestRef = useRef(0);

  const loadQueue = async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setLoadError(null);

    try {
      const result = await getReviewAction<QueueResponse>(apiUrl, 'getReviewQueue', {
        token: session.token,
        tahun: year,
        status: statusFilter,
      });

      setQueue(result.items || []);
      setSelected(current => {
        if (!current) return result.items?.[0] || null;
        return result.items?.find(item => item.UPLOAD_ID === current.UPLOAD_ID) || result.items?.[0] || null;
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Data antrean gagal dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Muat sekali saat halaman/filter berubah.
    // Tidak ada auto-refresh berkala; refresh berikutnya hanya lewat tombol Segarkan.
    void loadQueue();
  }, [year, statusFilter, session.token]);

  useEffect(() => {
    if (!selected) return;
    setReviewStatus(selected.STATUS === 'DIUNGGAH_ULANG' ? 'SEDANG_DIREVIEW' : 'PERLU_REVISI');
    setNote('');
    setReviewFile(null);
    setSubmitMessage(null);
  }, [selected?.UPLOAD_ID]);

  const visibleQueue = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return queue;

    return queue.filter(item =>
      [item.NAMA_OPD, item.JENIS_DOKUMEN, item.FILE_NAME, item.STATUS]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [queue, search]);

  const summary = useMemo(() => ({
    total: queue.length,
    waiting: queue.filter(item => item.STATUS === 'MENUNGGU_REVIEW').length,
    revision: queue.filter(item => item.STATUS === 'DIUNGGAH_ULANG' || item.STATUS === 'PERLU_REVISI').length,
    active: queue.filter(item => item.STATUS === 'SEDANG_DIREVIEW').length,
  }), [queue]);


  const loadOPDOverview = async (manual = false) => {
    manual ? setOverviewRefreshing(true) : setOverviewLoading(true);
    setOverviewError(null);

    try {
      const result = await getReviewAction<OPDOverviewResponse>(
        apiUrl,
        'getOperatorOPDOverview',
        {
          token: session.token,
          tahun: overviewYear,
        },
      );

      setOverviewRows(result.items || []);
    } catch (error) {
      setOverviewError(
        error instanceof Error
          ? error.message
          : 'Dashboard OPD gagal dimuat.',
      );
    } finally {
      setOverviewLoading(false);
      setOverviewRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'opd-dashboard') return;

    // Muat sekali saat membuka Dashboard OPD atau mengganti tahun.
    // Setelah itu data hanya diperbarui saat tombol Segarkan diklik.
    void loadOPDOverview();
  }, [activeTab, overviewYear, session.token]);

  const opdDashboardRows = useMemo<DashboardOPDRow[]>(() => {
    const base = OFFICIAL_42_OPDS.map((namaOPD, index) => ({
      no: index + 1,
      namaOPD,
      opdIds: [] as string[],
      gap: false,
      gbs: false,
      kak: false,
      sk: false,
      uploadCount: 0,
      lastUploadedAt: '',
    }));

    overviewRows.forEach(raw => {
      const exactIndex = base.findIndex(
        item =>
          normalizeDashboardOPDName(item.namaOPD) ===
          normalizeDashboardOPDName(raw.NAMA_OPD),
      );

      let targetIndex = exactIndex;

      if (targetIndex < 0) {
        let bestIndex = -1;
        let bestScore = 0;

        base.forEach((item, index) => {
          const score = getDashboardOPDSimilarity(
            raw.NAMA_OPD,
            item.namaOPD,
          );

          if (score > bestScore) {
            bestScore = score;
            bestIndex = index;
          }
        });

        if (bestScore >= 0.45) {
          targetIndex = bestIndex;
        }
      }

      if (targetIndex < 0) return;

      const target = base[targetIndex];

      if (raw.OPD_ID && !target.opdIds.includes(raw.OPD_ID)) {
        target.opdIds.push(raw.OPD_ID);
      }

      target.gap = target.gap || hasFlag(raw.HAS_GAP);
      target.gbs = target.gbs || hasFlag(raw.HAS_GBS);
      target.kak = target.kak || hasFlag(raw.HAS_KAK);
      target.sk = target.sk || hasFlag(raw.HAS_SK);
      target.uploadCount += Number(raw.UPLOAD_COUNT || 0);

      const uploadedAt = String(raw.LAST_UPLOADED_AT || '');
      if (uploadedAt > target.lastUploadedAt) {
        target.lastUploadedAt = uploadedAt;
      }
    });

    return base;
  }, [overviewRows]);

  const visibleOPDDashboardRows = useMemo(() => {
    const query = overviewSearch.trim().toLowerCase();

    if (!query) return opdDashboardRows;

    return opdDashboardRows.filter(item =>
      item.namaOPD.toLowerCase().includes(query),
    );
  }, [opdDashboardRows, overviewSearch]);

  const overviewSummary = useMemo(() => {
    const uploaded = opdDashboardRows.filter(
      item => item.gap || item.gbs || item.kak || item.sk,
    ).length;

    const complete = opdDashboardRows.filter(
      item => item.gap && item.gbs && item.kak && item.sk,
    ).length;

    return {
      total: OFFICIAL_42_OPDS.length,
      uploaded,
      complete,
      empty: OFFICIAL_42_OPDS.length - uploaded,
    };
  }, [opdDashboardRows]);


  const overviewAnalytics = useMemo(() => {
    const totalOPD = Math.max(1, overviewSummary.total);
    const partial = Math.max(
      0,
      overviewSummary.uploaded - overviewSummary.complete,
    );

    const documentCounts = [
      {
        key: 'GAP',
        label: 'GAP',
        count: opdDashboardRows.filter(item => item.gap).length,
        barClass: 'bg-gradient-to-t from-pink-500 to-rose-300',
        badgeClass: 'bg-rose-50 text-rose-700',
      },
      {
        key: 'GBS',
        label: 'GBS',
        count: opdDashboardRows.filter(item => item.gbs).length,
        barClass: 'bg-gradient-to-t from-violet-600 to-purple-300',
        badgeClass: 'bg-violet-50 text-violet-700',
      },
      {
        key: 'KAK',
        label: 'KAK',
        count: opdDashboardRows.filter(item => item.kak).length,
        barClass: 'bg-gradient-to-t from-sky-500 to-cyan-300',
        badgeClass: 'bg-sky-50 text-sky-700',
      },
      {
        key: 'SK',
        label: 'SK Focal Point',
        count: opdDashboardRows.filter(item => item.sk).length,
        barClass: 'bg-gradient-to-t from-amber-500 to-yellow-300',
        badgeClass: 'bg-amber-50 text-amber-700',
      },
    ].map(item => ({
      ...item,
      percentage: Math.round((item.count / totalOPD) * 100),
    }));

    const uploadedDocuments = documentCounts.reduce(
      (total, item) => total + item.count,
      0,
    );
    const expectedDocuments = overviewSummary.total * 4;

    return {
      uploadPercentage: Math.round(
        (overviewSummary.uploaded / totalOPD) * 100,
      ),
      completePercentage: Math.round(
        (overviewSummary.complete / totalOPD) * 100,
      ),
      partial,
      partialPercentage: Math.round((partial / totalOPD) * 100),
      emptyPercentage: Math.round(
        (overviewSummary.empty / totalOPD) * 100,
      ),
      uploadedDocuments,
      expectedDocuments,
      documentPercentage:
        expectedDocuments > 0
          ? Math.round((uploadedDocuments / expectedDocuments) * 100)
          : 0,
      documentCounts,
    };
  }, [opdDashboardRows, overviewSummary]);

  useEffect(() => {
    budgetRequestRef.current += 1;
    setBudgetPopover(null);
    setBudgetPopoverData(null);
    setBudgetPopoverError(null);
    setBudgetPopoverLoading(false);
  }, [overviewYear]);

  const closeBudgetPopover = () => {
    budgetRequestRef.current += 1;
    setBudgetPopover(null);
    setBudgetPopoverData(null);
    setBudgetPopoverError(null);
    setBudgetPopoverLoading(false);
  };

  const openBudgetPopover = async (
    event: React.MouseEvent<HTMLButtonElement>,
    item: DashboardOPDRow,
  ) => {
    event.stopPropagation();

    if (budgetPopover?.opdName === item.namaOPD) {
      closeBudgetPopover();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 300;
    const estimatedHeight = 190;
    const padding = 12;

    const left = Math.max(
      padding,
      Math.min(
        rect.left,
        window.innerWidth - popoverWidth - padding,
      ),
    );

    const openAbove =
      rect.bottom + estimatedHeight + padding > window.innerHeight;

    const top = openAbove
      ? Math.max(padding, rect.top - estimatedHeight - 8)
      : rect.bottom + 8;

    setBudgetPopover({
      opdName: item.namaOPD,
      top,
      left,
    });
    setBudgetPopoverData(null);
    setBudgetPopoverError(null);
    setBudgetPopoverLoading(true);

    const requestId = budgetRequestRef.current + 1;
    budgetRequestRef.current = requestId;

    try {
      const result = await getReviewAction<OPDBudgetResponse>(
        apiUrl,
        'getOPDBudget',
        {
          token: session.token,
          opdName: item.namaOPD,
          tahun: overviewYear,
        },
      );

      if (requestId !== budgetRequestRef.current) return;
      setBudgetPopoverData(result.budget || null);
    } catch (error) {
      if (requestId !== budgetRequestRef.current) return;
      setBudgetPopoverError(
        error instanceof Error
          ? error.message
          : 'Data pagu gagal dimuat.',
      );
    } finally {
      if (requestId === budgetRequestRef.current) {
        setBudgetPopoverLoading(false);
      }
    }
  };

  const handleResetOPD = async (item: DashboardOPDRow) => {
    const hasAnyData =
      item.opdIds.length > 0 ||
      item.gap ||
      item.gbs ||
      item.kak ||
      item.sk;

    if (!hasAnyData) {
      setResetMessage(
        `${item.namaOPD} belum memiliki data untuk Tahun ${overviewYear}.`,
      );
      return;
    }

    const firstConfirm = window.confirm(
      `Reset data ${item.namaOPD} Tahun ${overviewYear}?\n\n` +
      `Upload, review, notifikasi, dan anggaran akan dihapus dari TiDB.\n\n` +
      `File di Google Drive tidak dihapus.`,
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      `Konfirmasi terakhir:\n\nHapus data ${item.namaOPD} Tahun ${overviewYear}?`,
    );

    if (!secondConfirm) return;

    const resetKey = `${item.no}-${overviewYear}`;
    setResettingKey(resetKey);
    setResetMessage(null);

    try {
      const result = await postReviewAction<ResetOPDResponse>(
        apiUrl,
        {
          action: 'resetOPDData',
          token: session.token,
          opdName: item.namaOPD,
          opdIds: item.opdIds,
          tahun: overviewYear,
        },
      );

      setResetMessage(
        `${result.message} Upload ${result.deleted.uploads}, review ` +
        `${result.deleted.reviews}, notifikasi ${result.deleted.notifications}, ` +
        `anggaran ${result.deleted.anggaran}.`,
      );

      await Promise.all([
        loadOPDOverview(true),
        loadQueue(true),
      ]);
    } catch (error) {
      setResetMessage(
        error instanceof Error
          ? error.message
          : 'Reset data OPD gagal.',
      );
    } finally {
      setResettingKey(null);
    }
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;

    if (reviewStatus === 'PERLU_REVISI' && !note.trim()) {
      setSubmitMessage('Catatan wajib diisi untuk status Perlu Revisi.');
      return;
    }

    if (reviewFile && reviewFile.size > 10 * 1024 * 1024) {
      setSubmitMessage('Ukuran file hasil review maksimal 10 MB.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const reviewFilePayload = reviewFile
        ? {
            filename: reviewFile.name,
            mimeType: reviewFile.type || 'application/octet-stream',
            data: await fileToBase64(reviewFile),
          }
        : undefined;

      await postReviewAction<SubmitReviewResponse>(apiUrl, {
        action: 'submitReview',
        token: session.token,
        uploadId: selected.UPLOAD_ID,
        operatorId: session.user.userId,
        statusReview: reviewStatus,
        catatan: note.trim(),
        reviewFile: reviewFilePayload,
      });

      setSubmitMessage('Review berhasil dikirim.');
      setNote('');
      setReviewFile(null);
      await loadQueue(true);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Review gagal dikirim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F1F1F6] text-slate-800">
      <div className="grid min-h-screen w-full bg-white lg:grid-cols-[245px_minmax(0,1fr)]">

        {/* SIDEBAR */}
        <aside className="relative overflow-hidden bg-[#31275F] px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:self-start lg:px-5 lg:py-6">
          <div className="pointer-events-none absolute -left-16 top-20 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-24 h-48 w-48 rounded-full bg-indigo-300/10 blur-3xl" />

          <div className="relative z-10 flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-black/10">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png/500px-Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png"
                  alt="Logo Pemerintah Provinsi Nusa Tenggara Timur"
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black tracking-tight text-white">
                  SIPMODAG
                </p>
                <p className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-violet-200/70">
                  Portal Operator
                </p>
              </div>
            </div>

            <div className="mt-9">
              <p className="px-3 text-[8px] font-extrabold uppercase tracking-[0.17em] text-violet-200/45">
                Workspace
              </p>

              <nav className="mt-3 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-extrabold transition ${
                    activeTab === 'review'
                      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-violet-100/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <FileSearch className="h-4 w-4" />
                  Antrean Review
                  {activeTab === 'review' && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-violet-300" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('opd-dashboard')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-extrabold transition ${
                    activeTab === 'opd-dashboard'
                      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-violet-100/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard OPD
                  {activeTab === 'opd-dashboard' && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-violet-300" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('accounts')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-extrabold transition ${
                    activeTab === 'accounts'
                      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-violet-100/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <UsersRound className="h-4 w-4" />
                  Akun OPD
                  {activeTab === 'accounts' && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-violet-300" />
                  )}
                </button>
              </nav>
            </div>

            <div className="mt-auto pt-8">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-violet-100">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-black text-white">
                      {session.user.name}
                    </p>
                    <p className="mt-1 text-[8px] font-semibold text-violet-200/60">
                      Operator Pusat
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-violet-100 transition hover:bg-rose-500/25 hover:text-white"
                    aria-label="Keluar"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 bg-[#F8F8FC] lg:min-h-screen">
          {/* MOBILE BRAND */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#31275F] text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-950">SIPMODAG</p>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Portal Operator
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-[9px] font-extrabold text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>

          {/* HEADER */}
          <header className="border-b border-slate-200/80 bg-white/85 px-5 py-5 backdrop-blur-sm sm:px-7 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#6558D3]">
                  Dashboard Operator
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[#241E4A]">
                  {activeTab === 'review'
                    ? 'Antrean Review Dokumen'
                    : activeTab === 'opd-dashboard'
                      ? 'Monitoring Progres OPD'
                      : 'Kelola Akun OPD'}
                </h1>
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  {activeTab === 'review'
                    ? 'Periksa dokumen yang dikirim OPD dan berikan hasil review.'
                    : activeTab === 'opd-dashboard'
                      ? 'Pantau progres unggahan, kelengkapan dokumen, dan anggaran OPD.'
                      : 'Kelola akun OPD yang terdaftar pada SIPMODAG.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTab !== 'accounts' && (
                  <div className="relative hidden w-72 lg:block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={activeTab === 'review' ? search : overviewSearch}
                      onChange={event =>
                        activeTab === 'review'
                          ? setSearch(event.target.value)
                          : setOverviewSearch(event.target.value)
                      }
                      placeholder={activeTab === 'review' ? 'Cari OPD atau dokumen...' : 'Cari nama OPD...'}
                      className="w-full rounded-xl border border-slate-200 bg-[#FAFAFD] py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 caret-violet-600 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    activeTab === 'opd-dashboard'
                      ? void loadOPDOverview(true)
                      : void loadQueue(true)
                  }
                  disabled={
                    activeTab === 'opd-dashboard'
                      ? overviewRefreshing
                      : refreshing
                  }
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-extrabold text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      activeTab === 'opd-dashboard'
                        ? overviewRefreshing
                          ? 'animate-spin'
                          : ''
                        : refreshing
                          ? 'animate-spin'
                          : ''
                    }`}
                  />
                  <span className="hidden sm:inline">Segarkan</span>
                </button>
              </div>
            </div>

            {/* MOBILE TABS */}
            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-[9px] font-extrabold ${
                  activeTab === 'review'
                    ? 'bg-[#31275F] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Antrean Review
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('opd-dashboard')}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-[9px] font-extrabold ${
                  activeTab === 'opd-dashboard'
                    ? 'bg-[#31275F] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Dashboard OPD
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-[9px] font-extrabold ${
                  activeTab === 'accounts'
                    ? 'bg-[#31275F] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Akun OPD
              </button>
            </div>
          </header>

          <div className="space-y-5 p-4 sm:p-6 lg:p-7">
        {activeTab === 'accounts' ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <OperatorAccountManager session={session} />
          </div>
        ) : activeTab === 'opd-dashboard' ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Total OPD',
                  value: overviewSummary.total,
                  tone: 'bg-white/70 text-[#596DDE]',
                  card: 'border-[#C9D8FF] bg-[#E9F0FF]',
                },
                {
                  label: 'Sudah Upload',
                  value: overviewSummary.uploaded,
                  tone: 'bg-white/70 text-[#D85D66]',
                  card: 'border-[#FFD1D1] bg-[#FFF0F0]',
                },
                {
                  label: 'Lengkap',
                  value: overviewSummary.complete,
                  tone: 'bg-white/70 text-[#3B9C8B]',
                  card: 'border-[#CDEBE5] bg-[#EAF8F5]',
                },
                {
                  label: 'Belum Upload',
                  value: overviewSummary.empty,
                  tone: 'bg-white/70 text-[#695BD8]',
                  card: 'border-[#DDD4FF] bg-[#F0ECFF]',
                },
              ].map(item => (
                <div
                  key={item.label}
                  className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.card}`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {item.label}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-3xl font-black tracking-tight text-slate-950">
                      {item.value}
                    </p>
                    <span className={`rounded-lg px-2.5 py-1 text-[9px] font-extrabold ${item.tone}`}>
                      Tahun {overviewYear}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,0.8fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#31275F] text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black tracking-tight text-slate-950">
                        Grafik Kelengkapan Dokumen
                      </h2>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        Jumlah OPD yang telah mengunggah setiap jenis dokumen
                      </p>
                    </div>
                  </div>

                  <span className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-extrabold text-slate-600">
                    Tahun {overviewYear}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid min-h-[270px] grid-cols-4 gap-3 sm:gap-5">
                    {overviewAnalytics.documentCounts.map(item => (
                      <div
                        key={item.key}
                        className="flex min-w-0 flex-col justify-end"
                      >
                        <div className="mb-3 text-center">
                          <p className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                            {item.count}
                          </p>
                          <p className="mt-0.5 text-[9px] font-extrabold text-slate-400">
                            {item.percentage}%
                          </p>
                        </div>

                        <div className="flex h-44 items-end rounded-2xl bg-slate-50 p-2 ring-1 ring-inset ring-slate-100">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                              height: `${Math.max(6, item.percentage)}%`,
                              opacity: 1,
                            }}
                            transition={{
                              duration: 0.55,
                              ease: 'easeOut',
                            }}
                            className={`w-full rounded-xl ${item.barClass}`}
                          />
                        </div>

                        <div className="mt-3 text-center">
                          <span className={`inline-flex max-w-full rounded-lg px-2 py-1.5 text-[9px] font-extrabold ${item.badgeClass}`}>
                            {item.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                          Total Dokumen Terkumpul
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-800">
                          {overviewAnalytics.uploadedDocuments} dari {overviewAnalytics.expectedDocuments} dokumen
                        </p>
                      </div>
                      <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-slate-200">
                        {overviewAnalytics.documentPercentage}%
                      </span>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${overviewAnalytics.documentPercentage}%`,
                        }}
                        transition={{
                          duration: 0.6,
                          ease: 'easeOut',
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 via-violet-500 to-pink-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 xl:p-8">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                    Persentase Upload OPD
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                    Cakupan Tahun {overviewYear}
                  </h2>
                </div>

                <div className="mt-6 flex justify-center">
                  <div
                    className="relative flex h-52 w-52 items-center justify-center rounded-full p-[18px] shadow-inner"
                    style={{
                      background: `conic-gradient(#6657E8 0 ${overviewAnalytics.uploadPercentage}%, #E8E5F5 ${overviewAnalytics.uploadPercentage}% 100%)`,
                    }}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white shadow-sm">
                      <span className="text-4xl font-black tracking-tight text-slate-950">
                        {overviewAnalytics.uploadPercentage}%
                      </span>
                      <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Sudah Upload
                      </span>
                      <span className="mt-2 rounded-lg bg-violet-50 px-2.5 py-1 text-[9px] font-extrabold text-violet-700">
                        {overviewSummary.uploaded}/{overviewSummary.total} OPD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-extrabold text-emerald-800">
                        Lengkap 4 Dokumen
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-800">
                        {overviewSummary.complete} OPD
                      </p>
                      <p className="text-[9px] font-bold text-emerald-600">
                        {overviewAnalytics.completePercentage}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                      <span className="text-[10px] font-extrabold text-violet-800">
                        Belum Lengkap
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-violet-800">
                        {overviewAnalytics.partial} OPD
                      </p>
                      <p className="text-[9px] font-bold text-violet-600">
                        {overviewAnalytics.partialPercentage}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-extrabold text-amber-800">
                        Belum Upload
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-amber-800">
                        {overviewSummary.empty} OPD
                      </p>
                      <p className="text-[9px] font-bold text-amber-600">
                        {overviewAnalytics.emptyPercentage}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-white p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Table2 className="h-5 w-5 text-violet-700" />
                      <h2 className="text-lg font-black tracking-tight text-slate-950">
                        Monitoring Kelengkapan Dokumen OPD
                      </h2>
                    </div>

                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-0 sm:w-72">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={overviewSearch}
                        onChange={event => setOverviewSearch(event.target.value)}
                        placeholder="Cari nama OPD..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={overviewYear}
                        onChange={event => setOverviewYear(event.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-9 text-xs font-extrabold text-slate-700 outline-none sm:w-32"
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button
                      type="button"
                      onClick={() => void loadOPDOverview(true)}
                      disabled={overviewRefreshing}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${overviewRefreshing ? 'animate-spin' : ''}`} />
                      Segarkan
                    </button>
                  </div>
                </div>
              </div>

              {resetMessage && (
                <div className="border-b border-slate-100 bg-blue-50 px-5 py-3 text-xs font-semibold text-blue-800">
                  {resetMessage}
                </div>
              )}

              {overviewError && (
                <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                  {overviewError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="w-16 px-4 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">No</th>
                      <th className="min-w-[360px] px-4 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Nama OPD</th>
                      {['GAP', 'GBS', 'KAK', 'SK'].map(label => (
                        <th key={label} className="w-20 px-3 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          {label}
                        </th>
                      ))}
                      <th className="w-24 px-3 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Lengkap</th>
                      <th className="w-36 px-4 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Terakhir Upload</th>
                      <th className="w-28 px-4 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {overviewLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center">
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Memuat data...
                          </span>
                        </td>
                      </tr>
                    ) : (
                      visibleOPDDashboardRows.map(item => {
                        const completeCount = [
                          item.gap,
                          item.gbs,
                          item.kak,
                          item.sk,
                        ].filter(Boolean).length;

                        const resetKey = `${item.no}-${overviewYear}`;
                        const resetting = resettingKey === resetKey;

                        const renderFlag = (checked: boolean) => (
                          <span
                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                              checked
                                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-slate-100 text-slate-300'
                            }`}
                            title={checked ? 'Sudah upload' : 'Belum upload'}
                          >
                            {checked ? (
                              <Check className="h-4 w-4 stroke-[3]" />
                            ) : (
                              <Minus className="h-4 w-4" />
                            )}
                          </span>
                        );

                        return (
                          <tr
                            key={item.namaOPD}
                            className="border-b border-slate-100 transition hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3 text-xs font-bold text-slate-400">
                              {item.no}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-extrabold text-slate-800">
                                {item.namaOPD}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-[9px] text-slate-400">
                                  {item.uploadCount > 0
                                    ? `${item.uploadCount} upload`
                                    : 'Belum ada data'}
                                </span>

                                <button
                                  type="button"
                                  onClick={event =>
                                    void openBudgetPopover(event, item)
                                  }
                                  className="inline-flex items-center gap-1 rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[8px] font-extrabold text-violet-700 transition hover:border-violet-200 hover:bg-violet-100"
                                >
                                  <WalletCards className="h-3 w-3" />
                                  Pagu Anggaran
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">{renderFlag(item.gap)}</td>
                            <td className="px-3 py-3 text-center">{renderFlag(item.gbs)}</td>
                            <td className="px-3 py-3 text-center">{renderFlag(item.kak)}</td>
                            <td className="px-3 py-3 text-center">{renderFlag(item.sk)}</td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                                  completeCount === 4
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : completeCount > 0
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {completeCount}/4
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[10px] font-semibold text-slate-400">
                              {item.lastUploadedAt || '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={
                                  resetting ||
                                  (item.opdIds.length === 0 &&
                                    completeCount === 0)
                                }
                                onClick={() => void handleResetOPD(item)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-35"
                                title={`Reset data Tahun ${overviewYear}`}
                              >
                                {resetting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3.5 w-3.5" />
                                )}
                                Reset
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Antrean',
              value: summary.total,
              caption: 'Seluruh dokumen',
              icon: FileSearch,
              cardClass: 'border-[#C9D8FF] bg-[#E9F0FF]',
              iconClass: 'bg-white/75 text-[#596DDE]',
              captionClass: 'text-[#596DDE]',
            },
            {
              label: 'Menunggu Review',
              value: summary.waiting,
              caption: 'Belum diperiksa',
              icon: FileClock,
              cardClass: 'border-[#FFD1D1] bg-[#FFF0F0]',
              iconClass: 'bg-white/75 text-[#E56B73]',
              captionClass: 'text-[#D85D66]',
            },
            {
              label: 'Perlu Revisi',
              value: summary.revision,
              caption: 'Perlu tindak lanjut',
              icon: RefreshCw,
              cardClass: 'border-[#CDEBE5] bg-[#EAF8F5]',
              iconClass: 'bg-white/75 text-[#3B9C8B]',
              captionClass: 'text-[#3B9C8B]',
            },
            {
              label: 'Sedang Direview',
              value: summary.active,
              caption: 'Sedang diproses',
              icon: FileCheck2,
              cardClass: 'border-[#DDD4FF] bg-[#F0ECFF]',
              iconClass: 'bg-white/75 text-[#695BD8]',
              captionClass: 'text-[#695BD8]',
            },
          ].map(item => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.cardClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-[#241E4A]">
                      {item.value}
                    </p>
                    <p className={`mt-1 text-[8px] font-extrabold ${item.captionClass}`}>
                      {item.caption}
                    </p>
                  </div>

                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${item.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid min-h-[650px] gap-5 xl:grid-cols-[minmax(410px,0.70fr)_minmax(0,1.30fr)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <div className="relative">
                  <select
                    value={year}
                    onChange={event => setYear(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-9 text-xs font-extrabold text-slate-700 outline-none sm:w-36"
                  >
                    <option value="">Semua Tahun</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value as ReviewStatus | '')}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-9 text-xs font-extrabold text-slate-700 outline-none sm:w-48"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="max-h-[660px] overflow-y-auto p-3">
              {loading ? (
                <div className="flex min-h-72 items-center justify-center gap-2 text-sm font-bold text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Memuat antrean...
                </div>
              ) : loadError ? (
                <div className="m-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{loadError}</div>
              ) : visibleQueue.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="mt-4 font-black text-slate-800">Antrean kosong</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Tidak ada dokumen.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleQueue.map(item => (
                    <button
                      key={item.UPLOAD_ID}
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected?.UPLOAD_ID === item.UPLOAD_ID
                          ? 'border-violet-300 bg-violet-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{item.NAMA_OPD}</p>
                          <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {item.JENIS_DOKUMEN} · Tahun {item.TAHUN} · Versi {item.VERSI}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${statusClass[item.STATUS]}`}>
                          {statusLabel[item.STATUS]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                        <span className="truncate">{item.FILE_NAME}</span>
                        <span className="flex shrink-0 items-center gap-1"><Clock3 className="h-3 w-3" />{item.UPLOADED_AT}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            {!selected ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
                <FileSearch className="h-12 w-12 text-slate-300" />
                <p className="mt-4 font-black text-slate-800">Pilih dokumen</p>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400">Pilih dokumen dari antrean.</p>
              </div>
            ) : (
              <motion.div key={selected.UPLOAD_ID} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-700">Dokumen</p>
                    <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950">{selected.NAMA_OPD}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{selected.JENIS_DOKUMEN} · Tahun {selected.TAHUN} · Versi {selected.VERSI}</p>
                  </div>
                  <span className={`self-start rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${statusClass[selected.STATUS]}`}>
                    {statusLabel[selected.STATUS]}
                  </span>
                </div>

                <section className="mt-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-blue-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B5CE2] text-white shadow-sm">
                        <WalletCards className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Anggaran Responsif Gender</p>
                        <p className="mt-1 text-[10px] text-slate-500">Tahun {selected.TAHUN}</p>
                      </div>
                    </div>
                    {!Number(selected.PAGU_ARG || 0) && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700">Belum diisi</span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-white p-4">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pagu ARG</p>
                      <p className="mt-2 text-lg font-black text-slate-950">{formatRupiah(selected.PAGU_ARG)}</p>
                      <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                        <CalendarDays className="h-3 w-3" /> {selected.TANGGAL_PAGU || 'Belum diisi'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-white p-4">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Realisasi ARG</p>
                      <p className="mt-2 text-lg font-black text-slate-950">{formatRupiah(selected.REALISASI_ARG)}</p>
                      <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                        <CalendarDays className="h-3 w-3" /> {selected.TANGGAL_REALISASI || 'Belum diisi'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-blue-100">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Realisasi</span>
                      <span className="text-blue-800">{getRealisasiPercentage(selected.PAGU_ARG, selected.REALISASI_ARG).toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-700 transition-all"
                        style={{ width: `${getRealisasiPercentage(selected.PAGU_ARG, selected.REALISASI_ARG)}%` }}
                      />
                    </div>
                  </div>
                </section>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900">{selected.FILE_NAME}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Diunggah {selected.UPLOADED_AT}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={selected.FILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#31275F] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#463A83]"
                    >
                      <ExternalLink className="h-4 w-4" /> Buka File OPD
                    </a>
                    <a
                      href={selected.FILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" /> Unduh
                    </a>
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Hasil Review</label>
                    <div className="relative">
                      <select
                        value={reviewStatus}
                        onChange={event => setReviewStatus(event.target.value as ReviewStatus)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm font-extrabold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      >
                        <option value="PERLU_REVISI">Perlu Revisi</option>
                        <option value="DISETUJUI">Disetujui</option>
                        <option value="DITOLAK">Ditolak</option>
                        <option value="SEDANG_DIREVIEW">Sedang Direview</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Catatan Operator</label>
                    <textarea
                      value={note}
                      onChange={event => {
                        setNote(event.target.value);
                        setSubmitMessage(null);
                      }}
                      rows={5}
                      placeholder="Tulis catatan review..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-700 outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">File Review (Opsional)</label>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-violet-300 hover:bg-violet-50">
                      <span className="flex min-w-0 items-center gap-3">
                        <UploadCloud className="h-5 w-5 shrink-0 text-violet-600" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-extrabold text-slate-700">{reviewFile?.name || 'Pilih file review'}</span>
                          <span className="mt-1 block text-[10px] text-slate-400">PDF, DOC, DOCX, XLS, XLSX · Maks. 10 MB</span>
                        </span>
                      </span>
                      <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-[10px] font-extrabold text-slate-600 shadow-sm">Pilih File</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={event => {
                          setReviewFile(event.target.files?.[0] || null);
                          setSubmitMessage(null);
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {submitMessage && (
                    <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
                      submitMessage.includes('berhasil')
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                      {submitMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? 'Mengirim...' : 'Kirim Review'}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </section>
          </>
        )}

          </div>
        </section>
      </div>

      {budgetPopover && (
        <>
          <button
            type="button"
            aria-label="Tutup pagu anggaran"
            onClick={closeBudgetPopover}
            className="fixed inset-0 z-[80] cursor-default bg-transparent"
          />

          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16 }}
            className="fixed z-[90] w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            style={{
              top: budgetPopover.top,
              left: budgetPopover.left,
            }}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <WalletCards className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900">
                  Pagu Anggaran
                </p>
                <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                  Tahun {overviewYear}
                </p>
              </div>
            </div>

            <div className="p-4">
              {budgetPopoverLoading ? (
                <div className="flex min-h-20 items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat...
                </div>
              ) : budgetPopoverError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[10px] font-semibold text-red-700">
                  {budgetPopoverError}
                </div>
              ) : budgetPopoverData &&
                Number(budgetPopoverData.PAGU_ARG || 0) > 0 ? (
                <>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Pagu ARG
                  </p>

                  <p className="mt-2 text-xl font-black tracking-tight text-slate-950">
                    {formatRupiah(budgetPopoverData.PAGU_ARG)}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[9px] font-semibold text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {budgetPopoverData.TANGGAL_PAGU || 'Tanggal belum diisi'}
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 px-3 py-4 text-center">
                  <p className="text-xs font-bold text-slate-500">
                    Pagu belum diisi
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </main>
  );
}
