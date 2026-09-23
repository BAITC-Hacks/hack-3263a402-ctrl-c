"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2, LogOut, ShieldCheck, UserRound, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {RankCard} from "./experience";
import type {Experience} from "@/lib/experience";
import type { PublicUser } from "@/lib/identity";

type Mode = "login" | "register" | "profile";
const AccountContext = createContext<{ user: PublicUser | null; open: (mode: Mode, link?: boolean) => void }>({ user: null, open: () => {} });

async function accountRequest(body: Record<string, unknown>) {
  let response: Response;
  try { response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", "X-Blitz-CSRF": "1" }, body: JSON.stringify(body) }); }
  catch { throw new Error("Нет соединения. Проверь интернет и попробуй снова."); }
  const data = await response.json().catch(() => ({ error: "Сервис временно недоступен. Попробуй ещё раз." })) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить действие.");
  return data;
}

export function AccountProvider({ user, children, experience }: { user: PublicUser | null; children: ReactNode; experience?:Experience }) {
  const [visible, setVisible] = useState(false), [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState(""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false), [linkProgress, setLinkProgress] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const open = (next: Mode, link = false) => { setMode(next); setLinkProgress(link); setError(""); setVisible(true); };
  useEffect(() => { if (!visible) { setPassword(""); setConfirm(""); setShowPassword(false); setError(""); } }, [visible]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    if (mode === "register" && password !== confirm) { setError("Пароли не совпадают. Проверь повторный ввод."); return; }
    setBusy(true); setError("");
    try { await accountRequest({ action: mode, username, password, ...(mode === "register" ? { linkProgress } : {}) }); window.location.reload(); }
    catch (error) { setError(error instanceof Error ? error.message : "Нет соединения. Попробуй ещё раз."); setBusy(false); }
  }
  async function otherAction(action: "logout" | "chatgpt") {
    if (busy) return; setBusy(true); setError("");
    try { await accountRequest({ action }); window.location.assign(action === "chatgpt" ? "/signin-with-chatgpt?return_to=/" : "/"); }
    catch (error) { setError(error instanceof Error ? error.message : "Нет соединения. Попробуй ещё раз."); setBusy(false); }
  }
  return <AccountContext.Provider value={{ user, open }}>{children}
    <Dialog open={visible} onOpenChange={value => { if (!busy) setVisible(value); }}><DialogContent className="account-dialog" showCloseButton={!busy}>
      <DialogHeader><span className="account-symbol">{mode === "profile" ? <UserRound size={26} /> : <Zap size={26} />}</span><DialogTitle>{mode === "profile" ? "Твой аккаунт" : mode === "register" ? "Твоё место для роста" : "С возвращением"}</DialogTitle><DialogDescription>{mode === "profile" ? "Блицы, практика и прогресс сохраняются в твоём профиле." : mode === "register" ? "Создай аккаунт и продолжай обучение с любого устройства." : "Войди, чтобы вернуться к своим блицам и достижениям."}</DialogDescription></DialogHeader>
      {mode === "profile" && user ? <div className="account-profile-details"><RankCard total={experience?.total}/><div className="account-identity"><UserRound size={22} /><div><strong>{user.displayName}</strong><small>{user.provider === "password" ? "Аккаунт BLITZ" : "Вход через ChatGPT"}</small></div><Check size={18} /></div><div className="account-saved"><ShieldCheck size={18} /><p>Твои материалы, ответы и результаты доступны после входа в этот аккаунт.</p></div>{user.canLinkProgress && <button className="button primary full-width" onClick={() => open("register", true)}><KeyRound size={17} /> Привязать логин к этому профилю</button>}{user.username && user.provider === "chatgpt" && <p className="account-note">Также можно войти по логину <strong>{user.username}</strong> и своему паролю.</p>}<button className="button outline full-width account-logout" disabled={busy} onClick={() => void otherAction("logout")}>{busy ? <Loader2 size={17} className="spin" /> : <LogOut size={17} />} Выйти из аккаунта</button>{error && <p className="form-error" role="alert">{error}</p>}</div> : <>
        <div className="account-mode" role="group" aria-label="Способ входа"><button type="button" aria-pressed={mode === "login"} disabled={busy} onClick={() => { setMode("login"); setError(""); }}>Вход</button><button type="button" aria-pressed={mode === "register"} disabled={busy} onClick={() => { setMode("register"); setError(""); }}>Регистрация</button></div>
        <form className="account-form" onSubmit={submit}>
          <label htmlFor="account-username">Логин</label><Input id="account-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={event => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,31}" placeholder="Например, tahir" required disabled={busy} aria-describedby="username-hint" /><p id="username-hint" className="account-hint">3–32 символа: латинские буквы, цифры, точка, дефис или _</p>
          <label htmlFor="account-password">Пароль</label><div className="password-input"><Input id="account-password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} minLength={mode === "register" ? 15 : 1} maxLength={128} required disabled={busy} aria-describedby={mode === "register" ? "password-hint" : undefined} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
          {mode === "register" && <><p id="password-hint" className="account-hint">От 15 до 128 символов. Подойдёт длинная фраза — пробелы разрешены.</p><label htmlFor="account-confirm">Повтори пароль</label><Input id="account-confirm" name="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} minLength={15} maxLength={128} required disabled={busy} />{user?.canLinkProgress && <label className="account-link-choice" htmlFor="link-progress"><Checkbox id="link-progress" checked={linkProgress} onCheckedChange={value => setLinkProgress(value === true)} disabled={busy} /><span><strong>Привязать текущие блицы и прогресс</strong><small>Профиль {user.displayName} станет доступен по этому логину и паролю.</small></span></label>}<p className="account-note">Сохрани пароль в менеджере паролей, чтобы вернуться к своему профилю.</p></>}
          {error && <p className="form-error" role="alert">{error}</p>}<button className="button primary full-width" type="submit" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Подключаем твой профиль…</> : <>{mode === "register" ? "Создать аккаунт" : "Войти"}<ArrowRight size={17} /></>}</button>
        </form>
        <div className="account-alternative"><span>или</span></div><button type="button" className="button outline full-width" disabled={busy} onClick={() => void otherAction("chatgpt")}>Продолжить через ChatGPT</button>
      </>}
    </DialogContent></Dialog>
  </AccountContext.Provider>;
}

export function AccountSignInButton() {
  const { open } = useContext(AccountContext);
  return <button type="button" className="button primary" onClick={() => open("login")}><UserRound size={17} /> Войти в аккаунт</button>;
}
export function AccountControl() {
  const { user, open } = useContext(AccountContext);
  return <button className="account-control" type="button" onClick={() => open(user ? "profile" : "login")}><UserRound size={17} /><span>{user ? user.username || "Мой аккаунт" : "Войти"}</span></button>;
}
export function AccountProfile() {
  const { user, open } = useContext(AccountContext);
  return <button className="profile account-sidebar-profile" type="button" onClick={() => open(user ? "profile" : "login")}><span className="avatar"><UserRound size={18} /></span><span><strong>{user?.displayName || "Твоё пространство"}</strong><small>{user ? "Личный аккаунт" : "Войти и сохранить прогресс"}</small></span><ArrowRight size={15} /></button>;
}
