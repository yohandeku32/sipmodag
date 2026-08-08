import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { motion } from 'motion/react';
import { postReviewAction } from '../reviewApi';
import { OperatorSession } from '../reviewTypes';

const NTT_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png/500px-Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png';

type Props = {
  apiUrl: string;
  onAuthenticated: (session: OperatorSession) => void;
  onCancel: () => void;
};

export default function OperatorLogin({
  apiUrl,
  onAuthenticated,
  onCancel,
}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError(null);

    if (!username.trim() || !password) {
      setError(
        'Username dan kata sandi wajib diisi.'
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        await postReviewAction<OperatorSession>(
          apiUrl,
          {
            action: 'login',
            username: username.trim(),
            password,
          }
        );

      if (
        !['OPERATOR_PUSAT', 'ADMIN'].includes(
          result.user.role
        )
      ) {
        throw new Error(
          'Akun ini tidak memiliki akses operator.'
        );
      }

      onAuthenticated({
        token: result.token,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Login operator gagal.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0B1220] text-slate-800"
      style={{
        backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.075) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.075) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute -left-52 -top-52 h-[620px] w-[620px] rounded-full bg-blue-600/15 blur-[130px]" />

      <div className="pointer-events-none absolute -bottom-64 right-0 h-[580px] w-[580px] rounded-full bg-indigo-600/10 blur-[130px]" />

      <div className="relative z-10 min-h-screen px-4 py-5 sm:px-6 sm:py-7">

        {/* NAVBAR */}
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-3 shadow-lg shadow-black/20 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={NTT_LOGO_URL}
              alt="Logo Provinsi NTT"
              className="h-10 w-auto shrink-0"
              referrerPolicy="no-referrer"
            />

            <div className="h-8 w-px bg-white/15" />

            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-none tracking-tight text-white">
                SIPMODAG
              </p>

              <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                DP3AP2KB Provinsi NTT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-slate-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Kembali ke Beranda
            </span>

            <span className="sm:hidden">
              Kembali
            </span>
          </button>
        </nav>

        {/* CONTENT */}
        <div className="mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl grid-cols-1 items-center gap-10 py-10 lg:grid-cols-[1fr_0.82fr] lg:gap-20 lg:py-14">

          {/* LEFT */}
          <motion.section
            initial={{
              opacity: 0,
              x: -18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.4,
              ease: 'easeOut',
            }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
              <ShieldCheck className="h-3.5 w-3.5" />

              Portal Operator
            </div>

            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Dashboard
              <span className="block text-blue-400">
                Operator
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              Review dan pengelolaan dokumen PUG dan PPRG.
            </p>

            <div className="mt-9 hidden max-w-lg border-t border-white/10 pt-6 lg:block">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Akses Operator
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    SIPMODAG Provinsi Nusa Tenggara Timur
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* LOGIN CARD */}
          <motion.section
            initial={{
              opacity: 0,
              y: 18,
              scale: 0.99,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.4,
              ease: 'easeOut',
            }}
            className="w-full"
          >
            <div className="relative mx-auto w-full max-w-lg">
              {/* GLOW */}
              <div className="pointer-events-none absolute inset-8 rounded-[32px] bg-blue-500/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">

                {/* CARD HEADER */}
                <div className="mb-7 flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      Login Operator
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Masukkan akun operator.
                    </p>
                  </div>
                </div>

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* USERNAME */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Username
                    </label>

                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        value={username}
                        onChange={(event) => {
                          setUsername(
                            event.target.value
                          );
                          setError(null);
                        }}
                        autoComplete="username"
                        placeholder="Masukkan username"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Kata Sandi
                    </label>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={(event) => {
                          setPassword(
                            event.target.value
                          );

                          setError(null);
                        }}
                        autoComplete="current-password"
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Enter'
                          ) {
                            event.preventDefault();

                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                        placeholder="Masukkan kata sandi"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            value => !value
                          )
                        }
                        aria-label={
                          showPassword
                            ? 'Sembunyikan kata sandi'
                            : 'Tampilkan kata sandi'
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}
                  {error && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-700"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-900 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}

                    {loading
                      ? 'Memeriksa...'
                      : 'Masuk'}
                  </button>
                </form>

                {/* BOTTOM */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Akses khusus operator SIPMODAG
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
