import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Unlock,
  UserPlus,
  Building2,
} from 'lucide-react';
import { OPDData } from '../types';

const NTT_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png/500px-Coat_of_Arms_of_East_Nusa_Tenggara_NEW.png';

type Props = {
  apiUrl: string;
  data: OPDData[];
  searchOPDQuery: string;
  setSearchOPDQuery: (value: string) => void;
  showOPDDropdown: boolean;
  setShowOPDDropdown: (value: boolean) => void;
  selectedOPDToLogin: OPDData | null;
  setSelectedOPDToLogin: (value: OPDData | null) => void;
  password: string;
  setPassword: (value: string) => void;
  loginError: string | null;
  setLoginError: (value: string | null) => void;
  handleLoginSubmit: (
    event: React.FormEvent
  ) => void | Promise<void>;
  onCancel: () => void;
};

export default function OPDLoginScreen({
  apiUrl,
  data,
  searchOPDQuery,
  setSearchOPDQuery,
  showOPDDropdown,
  setShowOPDDropdown,
  selectedOPDToLogin,
  setSelectedOPDToLogin,
  password,
  setPassword,
  loginError,
  setLoginError,
  handleLoginSubmit,
  onCancel,
}: Props) {
  const [mode, setMode] =
    useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] =
    useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showLoginPassword, setShowLoginPassword] =
    useState(false);

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [
    showRegisterPassword,
    setShowRegisterPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [registerLoading, setRegisterLoading] =
    useState(false);

  const [registerError, setRegisterError] = useState<
    string | null
  >(null);

  const [registerSuccess, setRegisterSuccess] =
    useState<string | null>(null);

  const opdSelectorRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDownOutside = (
      event: PointerEvent
    ) => {
      const target = event.target as Node | null;

      if (
        showOPDDropdown &&
        target &&
        opdSelectorRef.current &&
        !opdSelectorRef.current.contains(target)
      ) {
        setShowOPDDropdown(false);
      }
    };

    document.addEventListener(
      'pointerdown',
      handlePointerDownOutside
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDownOutside
      );
    };
  }, [showOPDDropdown, setShowOPDDropdown]);

  const query = searchOPDQuery.toLowerCase().trim();

  const filteredOPDs = data.filter(opd => {
    if (!query) return true;

    return (
      opd.namaOPD.toLowerCase().includes(query) ||
      opd.namaPendek.toLowerCase().includes(query)
    );
  });

  const clearMessages = () => {
    setLoginError(null);
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const chooseOPD = (opd: OPDData) => {
    setSelectedOPDToLogin(opd);
    setSearchOPDQuery(opd.namaOPD);
    setShowOPDDropdown(false);
    clearMessages();
  };

  const switchMode = (
    nextMode: 'login' | 'register'
  ) => {
    setMode(nextMode);

    clearMessages();

    setPassword('');
    setRegisterPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (loginLoading) return;

    setLoginLoading(true);
    setLoginError(null);

    // Beri browser 1 frame untuk menampilkan status "Memeriksa..."
    // sebelum proses autentikasi dijalankan.
    await new Promise<void>(resolve => {
      window.requestAnimationFrame(() => resolve());
    });

    try {
      await handleLoginSubmit(event);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    clearMessages();

    if (!selectedOPDToLogin) {
      setRegisterError(
        'Silakan pilih instansi/OPD terlebih dahulu.'
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setRegisterError('Email wajib diisi.');
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterError(
        'Kata sandi minimal 8 karakter.'
      );
      return;
    }

    if (registerPassword !== confirmPassword) {
      setRegisterError(
        'Konfirmasi kata sandi tidak sama.'
      );
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(
        '/api/opd-auth',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8',
          },

          body: JSON.stringify({
            action: 'registerOPD',
            opdName: selectedOPDToLogin.namaOPD,
            email: cleanEmail,
            password: registerPassword,
            passwordConfirm: confirmPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            'Pendaftaran akun gagal.'
        );
      }

      setRegisterSuccess(
        result?.emailSent === false
          ? 'Akun berhasil dibuat, tetapi email pemberitahuan belum dapat dikirim.'
          : 'Akun berhasil dibuat. Email pemberitahuan sudah dikirim.'
      );

      setPassword('');
      setRegisterPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        setMode('login');
        setRegisterSuccess(null);
      }, 2200);
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : 'Pendaftaran akun gagal. Silakan coba lagi.'
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  /* ===================================================== */
  /* OPD SELECTOR */
  /* ===================================================== */

  const renderOPDSelector = () => (
    <div
      ref={opdSelectorRef}
      className="relative space-y-2"
    >
      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
        Instansi / OPD
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="text"
          disabled={mode === 'login' && loginLoading}
          value={searchOPDQuery}
          onChange={event => {
            setSearchOPDQuery(event.target.value);
            setShowOPDDropdown(true);

            clearMessages();

            if (
              selectedOPDToLogin &&
              event.target.value !==
                selectedOPDToLogin.namaOPD
            ) {
              setSelectedOPDToLogin(null);
            }
          }}
          onFocus={() =>
            setShowOPDDropdown(true)
          }
          placeholder="Cari nama instansi..."
          className="
            w-full
            rounded-xl
            border border-slate-300
            bg-slate-50
            py-3.5
            pl-11
            pr-11
            text-sm
            font-semibold
            text-slate-800
            outline-none
            transition-all
            duration-200
            placeholder:font-normal
            placeholder:text-slate-400
            focus:border-blue-500
            focus:bg-white
            focus:ring-4
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-400
          "
        />

        {selectedOPDToLogin && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-emerald-100 p-1 text-emerald-600">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <AnimatePresence>
        {showOPDDropdown && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -6,
            }}
            transition={{
              duration: 0.16,
            }}
            className="
              absolute
              z-30
              mt-2
              max-h-64
              w-full
              overflow-y-auto
              rounded-xl
              border
              border-slate-200
              bg-white
              p-1.5
              shadow-2xl
            "
          >
            {filteredOPDs.length > 0 ? (
              filteredOPDs.map(opd => (
                <button
                  key={`${opd.no}-${opd.namaOPD}`}
                  type="button"
                  onClick={() => chooseOPD(opd)}
                  className="
                    flex
                    w-full
                    items-start
                    justify-between
                    gap-3
                    rounded-lg
                    px-3.5
                    py-3
                    text-left
                    transition-colors
                    hover:bg-blue-50
                  "
                >
                  <span className="block text-xs font-bold leading-relaxed text-slate-800">
                    {opd.namaOPD}
                  </span>

                  {selectedOPDToLogin?.namaOPD ===
                    opd.namaOPD && (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                Instansi tidak ditemukan.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#0B1220]
        text-slate-800
      "
      style={{
        backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.075) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.075) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute -left-52 -top-52 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[130px]" />

      <div className="pointer-events-none absolute -bottom-64 right-0 h-[580px] w-[580px] rounded-full bg-indigo-600/10 blur-[130px]" />

      {/* PAGE */}
      <div className="relative z-10 min-h-screen px-4 py-5 sm:px-6 sm:py-7">

        {/* ================================================= */}
        {/* NAVBAR */}
        {/* ================================================= */}

        <nav
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            rounded-2xl
            border
            border-white/10
            bg-white/[0.07]
            px-5
            py-3
            shadow-lg
            shadow-black/20
            backdrop-blur-xl
            sm:px-6
          "
        >
          <div className="flex items-center gap-4">
            <img
              src={NTT_LOGO_URL}
              alt="Logo Provinsi NTT"
              className="h-10 w-auto"
              referrerPolicy="no-referrer"
            />

            <div className="h-8 w-px bg-white/15" />

            <div>
              <p className="text-lg font-black leading-none tracking-tight text-white">
                SIPMODAG
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                DP3AP2KB Provinsi NTT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/[0.05]
              px-3
              py-2
              text-xs
              font-bold
              text-slate-300
              transition-all
              hover:border-white/20
              hover:bg-white/10
              hover:text-white
              sm:px-4
            "
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

        {/* ================================================= */}
        {/* LOGIN AREA */}
        {/* ================================================= */}

        <div
          className="
            mx-auto
            grid
            min-h-[calc(100vh-112px)]
            max-w-7xl
            grid-cols-1
            items-center
            gap-10
            py-10
            lg:grid-cols-[1fr_0.9fr]
            lg:gap-16
            lg:py-14
          "
        >

          {/* =============================================== */}
          {/* LEFT */}
          {/* =============================================== */}

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
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-blue-400/20
                bg-blue-400/10
                px-3
                py-1.5
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-blue-300
              "
            >
              <Building2 className="h-3.5 w-3.5" />
              Portal OPD
            </div>

            <h1
              className="
                mt-5
                max-w-xl
                text-4xl
                font-black
                leading-[1.06]
                tracking-tight
                text-white
                sm:text-5xl
                lg:text-6xl
              "
            >
              {mode === 'login'
                ? 'Dashboard'
                : 'Pendaftaran'}

              <span className="block text-blue-400">
                OPD
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              {mode === 'login'
                ? 'Masuk menggunakan akun OPD yang telah terdaftar.'
                : 'Daftarkan akun untuk mengakses layanan SIPMODAG.'}
            </p>

            {/* INFO */}
            <div className="mt-9 hidden max-w-lg border-t border-white/10 pt-6 lg:block">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Sistem Informasi PUG & PPRG
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Pemerintah Provinsi Nusa Tenggara Timur
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =============================================== */}
          {/* FORM CARD */}
          {/* =============================================== */}

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
            <div
              className="
                mx-auto
                w-full
                max-w-xl
                rounded-[26px]
                border
                border-slate-200
                bg-white
                p-6
                shadow-2xl
                shadow-black/30
                sm:p-8
              "
            >

              {/* LOGIN / REGISTER TAB */}
              <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    switchMode('login')
                  }
                  className={`
                    rounded-lg
                    px-4
                    py-2.5
                    text-xs
                    font-extrabold
                    transition-all
                    ${
                      mode === 'login'
                        ? 'bg-white text-blue-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }
                  `}
                >
                  Login OPD
                </button>

                <button
                  type="button"
                  onClick={() =>
                    switchMode('register')
                  }
                  className={`
                    rounded-lg
                    px-4
                    py-2.5
                    text-xs
                    font-extrabold
                    transition-all
                    ${
                      mode === 'register'
                        ? 'bg-white text-blue-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }
                  `}
                >
                  Daftar Akun
                </button>
              </div>

              {/* =========================================== */}
              {/* LOGIN */}
              {/* =========================================== */}

              {mode === 'login' ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Lock className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                        Login OPD
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Masukkan akun SIPMODAG.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleLogin}
                    className="mt-7 space-y-5"
                  >
                    {renderOPDSelector()}

                    {/* PASSWORD */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Kata Sandi
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type={
                            showLoginPassword
                              ? 'text'
                              : 'password'
                          }
                          value={password}
                          onChange={event => {
                            setPassword(
                              event.target.value
                            );

                            setLoginError(null);
                          }}
                          placeholder="Masukkan kata sandi"
                          autoComplete="current-password"
                          onKeyDown={event => {
                            if (
                              event.key === 'Enter'
                            ) {
                              event.preventDefault();

                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-50
                            py-3.5
                            pl-11
                            pr-12
                            text-sm
                            text-slate-800
                            outline-none
                            transition-all
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                            disabled:text-slate-400
                          "
                        />

                        <button
                          type="button"
                          disabled={loginLoading}
                          onClick={() =>
                            setShowLoginPassword(
                              value => !value
                            )
                          }
                          aria-label={
                            showLoginPassword
                              ? 'Sembunyikan kata sandi'
                              : 'Tampilkan kata sandi'
                          }
                          className="
                            absolute
                            right-4
                            top-1/2
                            -translate-y-1/2
                            rounded-lg
                            p-1
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                          "
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ERROR */}
                    <AnimatePresence>
                      {loginError && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -6,
                          }}
                          className="
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-xs
                            font-semibold
                            leading-relaxed
                            text-red-700
                          "
                        >
                          {loginError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* LOGIN BUTTON */}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      aria-busy={loginLoading}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[#1E40AF]
                        px-5
                        py-3.5
                        text-sm
                        font-extrabold
                        text-white
                        shadow-lg
                        shadow-blue-900/20
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:bg-blue-900
                        hover:shadow-xl
                        disabled:cursor-not-allowed
                        disabled:opacity-70
                      "
                    >
                      {loginLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}

                      {loginLoading
                        ? 'Memeriksa...'
                        : 'Masuk'}
                    </button>

                    <p className="text-center text-xs text-slate-500">
                      Belum memiliki akun?{' '}

                      <button
                        type="button"
                        onClick={() =>
                          switchMode('register')
                        }
                        className="font-extrabold text-blue-700 transition-colors hover:text-blue-900"
                      >
                        Daftar akun
                      </button>
                    </p>
                  </form>
                </>
              ) : (
                /* ========================================= */
                /* REGISTER */
                /* ========================================= */

                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <UserPlus className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                        Daftar Akun OPD
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Satu OPD memiliki satu akun.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleRegister}
                    className="mt-7 space-y-5"
                  >
                    {renderOPDSelector()}

                    {/* EMAIL */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Email
                      </label>

                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type="email"
                          value={email}
                          onChange={event => {
                            setEmail(
                              event.target.value
                            );

                            setRegisterError(null);
                          }}
                          placeholder="contoh@opd.go.id"
                          autoComplete="email"
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-50
                            py-3.5
                            pl-11
                            pr-4
                            text-sm
                            text-slate-800
                            outline-none
                            transition-all
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                          "
                        />
                      </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Kata Sandi
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type={
                            showRegisterPassword
                              ? 'text'
                              : 'password'
                          }
                          value={registerPassword}
                          onChange={event => {
                            setRegisterPassword(
                              event.target.value
                            );

                            setRegisterError(null);
                          }}
                          placeholder="Minimal 8 karakter"
                          autoComplete="new-password"
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-50
                            py-3.5
                            pl-11
                            pr-12
                            text-sm
                            text-slate-800
                            outline-none
                            transition-all
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(
                              value => !value
                            )
                          }
                          aria-label={
                            showRegisterPassword
                              ? 'Sembunyikan kata sandi'
                              : 'Tampilkan kata sandi'
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Konfirmasi Kata Sandi
                      </label>

                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type={
                            showConfirmPassword
                              ? 'text'
                              : 'password'
                          }
                          value={confirmPassword}
                          onChange={event => {
                            setConfirmPassword(
                              event.target.value
                            );

                            setRegisterError(null);
                          }}
                          placeholder="Ulangi kata sandi"
                          autoComplete="new-password"
                          onKeyDown={event => {
                            if (
                              event.key === 'Enter'
                            ) {
                              event.preventDefault();

                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-50
                            py-3.5
                            pl-11
                            pr-12
                            text-sm
                            text-slate-800
                            outline-none
                            transition-all
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              value => !value
                            )
                          }
                          aria-label={
                            showConfirmPassword
                              ? 'Sembunyikan kata sandi'
                              : 'Tampilkan kata sandi'
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* MESSAGES */}
                    <AnimatePresence>
                      {registerError && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -6,
                          }}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-700"
                        >
                          {registerError}
                        </motion.div>
                      )}

                      {registerSuccess && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -6,
                          }}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-relaxed text-emerald-700"
                        >
                          {registerSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* REGISTER BUTTON */}
                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[#1E40AF]
                        px-5
                        py-3.5
                        text-sm
                        font-extrabold
                        text-white
                        shadow-lg
                        shadow-blue-900/20
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:bg-blue-900
                        hover:shadow-xl
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      <UserPlus className="h-4 w-4" />

                      {registerLoading
                        ? 'Mendaftarkan...'
                        : 'Daftar Akun'}
                    </button>

                    <p className="text-center text-xs text-slate-500">
                      Sudah memiliki akun?{' '}

                      <button
                        type="button"
                        onClick={() =>
                          switchMode('login')
                        }
                        className="font-extrabold text-blue-700 transition-colors hover:text-blue-900"
                      >
                        Login
                      </button>
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
