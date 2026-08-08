import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  UsersRound,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OperatorSession } from '../reviewTypes';

type Props = {
  session: OperatorSession;
};

type AccountRaw = {
  USER_ID: string;
  NAMA?: string;
  USERNAME?: string;
  ROLE?: string;
  OPD_ID?: string;
  NAMA_OPD?: string;
  EMAIL?: string;
  STATUS?: string;
  CREATED_AT?: string;
};

type AccountResponse = {
  success: boolean;
  message?: string;
  count: number;
  items: AccountRaw[];
};

type AccountRow = {
  no: number;
  namaOPD: string;
  account: AccountRaw | null;
};

type ModalState =
  | { type: 'email'; row: AccountRow }
  | { type: 'password'; row: AccountRow }
  | { type: 'delete'; row: AccountRow }
  | null;

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

const normalizeName = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/&/g, ' DAN ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

async function readJson(response: Response) {
  const result = await response.json();

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `Server merespons ${response.status}.`
    );
  }

  return result;
}

export default function OperatorAccountManager({ session }: Props) {
  const [accounts, setAccounts] = useState<AccountRaw[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAccounts = async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/operator-accounts', window.location.origin);
      url.searchParams.set('action', 'getOperatorAccounts');
      url.searchParams.set('token', session.token);
      url.searchParams.set('_t', String(Date.now()));

      const response = await fetch(url.toString(), {
        cache: 'no-store',
      });

      const result = (await readJson(response)) as AccountResponse;
      setAccounts(result.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Data akun OPD gagal dimuat.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, [session.token]);

  const rows = useMemo<AccountRow[]>(() => {
    const accountMap = new Map(
      accounts.map(account => [
        normalizeName(account.NAMA_OPD || ''),
        account,
      ])
    );

    return OFFICIAL_42_OPDS.map((namaOPD, index) => ({
      no: index + 1,
      namaOPD,
      account: accountMap.get(normalizeName(namaOPD)) || null,
    }));
  }, [accounts]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter(row =>
      [
        row.namaOPD,
        row.account?.EMAIL,
        row.account?.STATUS,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    const registered = rows.filter(row => row.account).length;
    const active = rows.filter(
      row =>
        row.account &&
        String(row.account.STATUS || '').toUpperCase() === 'AKTIF'
    ).length;

    return {
      total: rows.length,
      registered,
      active,
      unregistered: rows.length - registered,
    };
  }, [rows]);

  const openEmailModal = (row: AccountRow) => {
    setEmail(row.account?.EMAIL || '');
    setMessage(null);
    setModal({ type: 'email', row });
  };

  const openPasswordModal = (row: AccountRow) => {
    setNewPassword('');
    setConfirmPassword('');
    setMessage(null);
    setModal({ type: 'password', row });
  };

  const openDeleteModal = (row: AccountRow) => {
    setDeleteConfirm('');
    setMessage(null);
    setModal({ type: 'delete', row });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setDeleteConfirm('');
  };

  const postAction = async (
    action: string,
    extra: Record<string, unknown>
  ) => {
    const response = await fetch('/api/operator-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        token: session.token,
        ...extra,
      }),
    });

    return readJson(response);
  };

  const saveEmail = async () => {
    if (!modal || modal.type !== 'email' || !modal.row.account) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Email wajib diisi.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await postAction('updateOPDAccountEmail', {
        userId: modal.row.account.USER_ID,
        email: cleanEmail,
      });

      setMessage(`Email ${modal.row.namaOPD} berhasil diperbarui.`);
      closeModal();
      await loadAccounts(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Email gagal diperbarui.'
      );
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!modal || modal.type !== 'password' || !modal.row.account) return;

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await postAction('setOPDAccountPassword', {
        userId: modal.row.account.USER_ID,
        password: newPassword,
      });

      setMessage(`Password ${modal.row.namaOPD} berhasil diganti.`);
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Password gagal diganti.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!modal || modal.type !== 'delete' || !modal.row.account) return;

    if (deleteConfirm !== 'HAPUS') {
      setError('Ketik HAPUS untuk mengonfirmasi.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await postAction('deleteOPDAccount', {
        userId: modal.row.account.USER_ID,
      });

      setMessage(
        `Akun ${modal.row.namaOPD} dihapus. Data upload/review OPD tetap tersimpan.`
      );
      closeModal();
      await loadAccounts(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Akun gagal dihapus.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total OPD',
            value: summary.total,
            icon: UsersRound,
            tone: 'bg-slate-100 text-slate-700',
          },
          {
            label: 'Sudah Terdaftar',
            value: summary.registered,
            icon: UserCheck,
            tone: 'bg-blue-50 text-blue-700',
          },
          {
            label: 'Akun Aktif',
            value: summary.active,
            icon: ShieldCheck,
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Belum Terdaftar',
            value: summary.unregistered,
            icon: UserX,
            tone: 'bg-amber-50 text-amber-700',
          },
        ].map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {item.value}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Kelola Akun OPD
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Edit email, ganti password, atau hapus akun OPD tanpa membuka SQL Editor TiDB.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Cari OPD atau email..."
                className="w-full min-w-[260px] rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadAccounts(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Segarkan
            </button>
          </div>
        </div>

        {message && (
          <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                <th className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  No
                </th>
                <th className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  OPD
                </th>
                <th className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Email
                </th>
                <th className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Status Akun
                </th>
                <th className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Terdaftar
                </th>
                <th className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      Memuat akun OPD...
                    </p>
                  </td>
                </tr>
              ) : (
                visibleRows.map(row => {
                  const account = row.account;
                  const active =
                    String(account?.STATUS || '').toUpperCase() === 'AKTIF';

                  return (
                    <tr
                      key={row.namaOPD}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4 text-xs font-bold text-slate-400">
                        {row.no}
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[380px] text-xs font-extrabold leading-relaxed text-slate-800">
                          {row.namaOPD}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {account ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span>{account.EMAIL || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            Belum ada
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {account ? (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                              active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {active ? 'AKTIF' : account.STATUS || 'TIDAK AKTIF'}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700">
                            BELUM TERDAFTAR
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                        {account ? formatDate(account.CREATED_AT) : '-'}
                      </td>

                      <td className="px-5 py-4">
                        {account ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEmailModal(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-extrabold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Email
                            </button>

                            <button
                              type="button"
                              onClick={() => openPasswordModal(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-extrabold text-amber-700 transition hover:bg-amber-100"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Ganti Password
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] font-extrabold text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Daftar melalui halaman Login OPD
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {modal && modal.row.account && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                    Kelola Akun OPD
                  </p>
                  <h3 className="mt-1 text-lg font-black leading-snug text-slate-950">
                    {modal.row.namaOPD}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modal.type === 'email' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Email Baru
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveEmail()}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-blue-900 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Simpan Email
                  </button>
                </div>
              )}

              {modal.type === 'password' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={event => setNewPassword(event.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Konfirmasi Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={event => setConfirmPassword(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void savePassword()}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Ganti Password
                  </button>
                </div>
              )}

              {modal.type === 'delete' && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold leading-relaxed text-rose-700">
                    Yang dihapus hanya akun login OPD dari tabel USERS.
                    Data upload, review, notifikasi, anggaran, dan file Google Drive tidak ikut dihapus.
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Ketik HAPUS untuk konfirmasi
                    </label>
                    <input
                      value={deleteConfirm}
                      onChange={event =>
                        setDeleteConfirm(event.target.value.toUpperCase())
                      }
                      placeholder="HAPUS"
                      className="mt-2 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-extrabold text-rose-800 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void deleteAccount()}
                    disabled={saving || deleteConfirm !== 'HAPUS'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-rose-800 disabled:opacity-40"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Hapus Akun OPD
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
