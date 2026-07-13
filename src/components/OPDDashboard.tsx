import React from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  LogOut,
  ShieldCheck,
  UploadCloud,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { OPDData } from '../types';

type UploadSlotKey = 'file1' | 'file2' | 'file3' | 'file4';

type UploadedFile = {
  name: string;
  size: string;
  fileObj: File | null;
} | null;

type UploadedFiles = Record<UploadSlotKey, UploadedFile>;

type Props = {
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
  triggerUploadSimulation: () => void;
};

const slots: Array<{
  key: UploadSlotKey;
  title: string;
  description: string;
  accept: string;
  icon: typeof FileText;
}> = [
  {
    key: 'file1',
    title: 'Dokumen GAP',
    description: 'Gender Analysis Pathway atau analisis kesenjangan gender OPD.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: FileText,
  },
  {
    key: 'file2',
    title: 'Dokumen GBS',
    description: 'Gender Budget Statement atau lembar pernyataan anggaran gender.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: FileSpreadsheet,
  },
  {
    key: 'file3',
    title: 'Dokumen KAK',
    description: 'Kerangka Acuan Kerja responsif gender untuk tahun anggaran terpilih.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: FileText,
  },
  {
    key: 'file4',
    title: 'SK Focal Point',
    description: 'Surat keputusan penunjukan Focal Point Pengarusutamaan Gender OPD.',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: ShieldCheck,
  },
];

export default function OPDDashboard({
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
}: Props) {
  const selectedCount = Object.values(uploadedFiles).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png/500px-Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png"
              alt="Logo Provinsi NTT"
              className="h-12 w-auto"
              referrerPolicy="no-referrer"
              onError={event => {
                event.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png/500px-Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png';
              }}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
                  Sesi OPD Aktif
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  SIPMODAG
                </span>
              </div>
              <h1 className="mt-2 max-w-3xl text-lg font-black leading-snug sm:text-xl">
                {loggedInOPD.namaOPD}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-xs font-extrabold text-red-300 transition hover:bg-red-500/20 lg:self-center"
          >
            <LogOut className="h-4 w-4" />
            Keluar Akun
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:py-10">
        <aside className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Profil Instansi
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {loggedInOPD.namaPendek}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Dokumen terdata
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900">
                {loggedInOPD.jumlahUpload}
                <span className="ml-1 text-sm font-bold text-slate-400">/ 4</span>
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-3xl border border-blue-200 bg-blue-950 p-5 text-white shadow-lg shadow-blue-900/10"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-300">
              Tahun Anggaran
            </p>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
              Semua dokumen yang dipilih akan disimpan untuk tahun berikut.
            </p>

            <div className="relative mt-5">
              <select
                value={selectedYear}
                onChange={event => setSelectedYear(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 pr-10 text-sm font-extrabold text-white outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-400/15"
              >
                <option value="2025" className="text-slate-900">Tahun 2025</option>
                <option value="2026" className="text-slate-900">Tahun 2026</option>
                <option value="2027" className="text-slate-900">Tahun 2027</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
            </div>
          </motion.section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black text-slate-800">Panduan pengunggahan</p>
            <div className="mt-4 space-y-3 text-[11px] leading-relaxed text-slate-500">
              <p>1. Pilih tahun anggaran yang sesuai.</p>
              <p>2. Unggah satu atau beberapa dokumen yang tersedia.</p>
              <p>3. Pastikan setiap file berukuran maksimal 10 MB.</p>
              <p>4. Tekan tombol kirim untuk memulai pengunggahan.</p>
            </div>
          </section>
        </aside>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
                Form Pengunggahan Dokumen PUG
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Dokumen Tahun {selectedYear}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Pilih dokumen yang tersedia. Kartu yang sudah berhasil tercatat akan menampilkan centang hijau dan lencana Terkirim.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Dipilih sekarang
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">{selectedCount}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {slots.map(slot => {
              const Icon = slot.icon;
              const file = uploadedFiles[slot.key];
              const isUploaded = uploadedSuccessKeys.includes(slot.key);
              const inputId = `upload-${slot.key}`;

              return (
                <article
                  key={slot.key}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                    isUploaded
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : file
                        ? 'border-blue-200 bg-blue-50/35'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-xl p-2.5 ${isUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide text-slate-850">
                          {slot.title}
                        </h3>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                          {slot.description}
                        </p>
                      </div>
                    </div>

                    {isUploaded ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
                        <Check className="h-3 w-3" />
                        Terkirim
                      </span>
                    ) : file ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-700">
                        <Check className="h-3 w-3" />
                        Terpilih
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5">
                    {file ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
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
                          onClick={() => {
                            setUploadedFiles(previous => ({
                              ...previous,
                              [slot.key]: null,
                            }));
                          }}
                          className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold text-red-500 hover:bg-red-50 hover:text-red-700"
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
                          className="hidden"
                          onChange={event => {
                            const selectedFile = event.target.files?.[0] || null;
                            handleLocalFileChange(slot.key, selectedFile);
                            event.currentTarget.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(inputId)?.click()}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-[11px] font-extrabold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <UploadCloud className="h-4 w-4" />
                          {isUploaded ? 'Unggah Ulang Dokumen' : 'Pilih Dokumen'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {uploadStatus === 'UPLOADING' && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between gap-4 text-xs font-extrabold text-blue-800">
                <span className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 animate-pulse" />
                  Sedang mengunggah...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-700 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-semibold leading-relaxed text-slate-400">
              Format: PDF, DOC, DOCX, XLS, XLSX. Maksimal 10 MB per file.
            </p>
            <button
              type="button"
              onClick={triggerUploadSimulation}
              disabled={uploadStatus !== 'IDLE' || selectedCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-700/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {uploadStatus === 'SUCCESS' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Kirim & Unggah Dokumen
            </button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
