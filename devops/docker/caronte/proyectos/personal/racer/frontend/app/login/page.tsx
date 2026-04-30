'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './login.module.css';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  LogIn,
  ArrowLeft,
  Send,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
  'auth/wrong-password': 'Contraseña incorrecta. Verifica tus credenciales',
  'auth/invalid-credential': 'Credenciales inválidas. Revisa email y contraseña',
  'auth/invalid-email': 'El formato del correo electrónico no es válido',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al administrador',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Cuenta temporalmente bloqueada',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  'auth/internal-error': 'Error interno del servidor. Intenta de nuevo',
};

function getFirebaseErrorMessage(code: string): string {
  return FIREBASE_ERROR_MAP[code] || 'Error al iniciar sesión. Intenta de nuevo';
}

function waitForAuthenticatedUser(timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(); return; }
    const timeoutId = window.setTimeout(() => { unsubscribe(); resolve(); }, timeoutMs);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) return;
      window.clearTimeout(timeoutId);
      unsubscribe();
      resolve();
    });
  });
}

function waitForAuthUserUid(targetUid: string, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser?.uid === targetUid) { resolve(); return; }
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (auth.currentUser?.uid === targetUid) { window.clearInterval(intervalId); resolve(); return; }
      if (Date.now() - startedAt >= timeoutMs) { window.clearInterval(intervalId); resolve(); }
    }, 100);
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem('racer_remember_email');
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
  }, []);

  const emailError = emailTouched && email.length > 0 && !EMAIL_REGEX.test(email)
    ? 'Formato de email inválido' : '';
  const passwordError = passwordTouched && password.length > 0 && password.length < MIN_PASSWORD_LENGTH
    ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres` : '';

  const isEmailValid = EMAIL_REGEX.test(email);
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;

  const handleLogin = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!isEmailValid) { setError('Ingresa un correo electrónico válido'); setEmailTouched(true); return; }
    if (!isPasswordValid) { setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`); setPasswordTouched(true); return; }

    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('racer_remember_email', email);
      } else {
        localStorage.removeItem('racer_remember_email');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (BACKEND_URL) {
        const idToken = await userCredential.user.getIdToken();
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
          const backendError = await response.json().catch(() => null);
          throw new Error(backendError?.error || 'El backend no pudo validar tu sesión');
        }
      }

      await waitForAuthenticatedUser();
      await waitForAuthUserUid(userCredential.user.uid);
      router.replace('/dashboard');
    } catch (err: any) {
      const firebaseCode = err?.code || '';
      const message = firebaseCode ? getFirebaseErrorMessage(firebaseCode) : err.message || 'Error al iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, isEmailValid, isPasswordValid, router]);

  const handleForgotPassword = useCallback(async () => {
    if (!email || !EMAIL_REGEX.test(email)) {
      setError('Ingresa tu correo electrónico primero para recibir el enlace de recuperación');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setRecoverySent(true);
      setRecoveryMode(false);
    } catch (err: any) {
      const firebaseCode = err?.code || '';
      if (firebaseCode === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo electrónico');
      } else {
        setError('Error al enviar el correo de recuperación. Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <h2>{recoveryMode ? 'Recuperar Acceso' : 'Panel de Control'}</h2>
          <p className={styles.subtitle}>
            {recoveryMode
              ? 'Te enviaremos un enlace para restablecer tu contraseña'
              : 'Sistema de Control de Acceso R.A.C.E.R'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} className={styles.errorIcon} />
            {error}
          </div>
        )}

        {/* Recovery sent */}
        {recoverySent && (
          <div className={styles.error} style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.20)', background: 'rgba(52,211,153,0.07)' }}>
            <CheckCircle size={16} style={{ flexShrink: 0, color: '#34d399' }} />
            Revisa tu bandeja de entrada. Hemos enviado el enlace para restablecer tu contraseña.
          </div>
        )}

        {recoveryMode ? (
          <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
            <div className={styles.formGroup}>
              <label>Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className={emailError ? styles.inputError : ''}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? <span className={styles.spinner} /> : <><Send size={16} /> Enviar Enlace</>}
            </button>

            <p className={styles.link}>
              <button
                type="button"
                className={styles.forgotPassword}
                onClick={() => { setRecoveryMode(false); setError(''); }}
                style={{ color: '#60a5fa', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className={styles.formGroup}>
              <label>Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="tu@correo.com"
                  required
                  className={emailError ? styles.inputError : ''}
                />
              </div>
              {emailTouched && email.length > 0 && (
                <span className={`${styles.validationHint} ${isEmailValid ? styles.valid : styles.invalid}`}>
                  {isEmailValid
                    ? <><CheckCircle size={12} /> Email válido</>
                    : <><AlertCircle size={12} /> Formato inválido</>}
                </span>
              )}
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label>Contraseña</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="••••••••"
                  required
                  className={passwordError ? styles.inputError : ''}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordTouched && password.length > 0 && (
                <span className={`${styles.validationHint} ${isPasswordValid ? styles.valid : styles.invalid}`}>
                  {isPasswordValid
                    ? <><CheckCircle size={12} /> Contraseña válida</>
                    : <><AlertCircle size={12} /> Mínimo {MIN_PASSWORD_LENGTH} caracteres</>}
                </span>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className={styles.extraOptions}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Recordar sesión
              </label>
              <button
                type="button"
                className={styles.forgotPassword}
                onClick={() => { setRecoveryMode(true); setError(''); }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading
                ? <span className={styles.spinner} />
                : <><LogIn size={17} /> Iniciar Sesión</>}
            </button>
          </form>
        )}

        {!recoveryMode && (
          <p className={styles.restrictedAccess}>
            <Lock size={12} />
            Acceso exclusivo para personal del centro
          </p>
        )}
      </div>
    </div>
  );
}
