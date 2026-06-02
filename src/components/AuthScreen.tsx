import { useState } from "react";
import { ChevronsRight, Loader2, Lock, Mail, User } from "lucide-react";
import { authApi, type AuthUser } from "../lib/api";

interface Props {
  onAuthed: (token: string, user: AuthUser) => void;
}

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await authApi.login(email.trim(), password)
          : await authApi.register(email.trim(), password, name.trim() || "Охотник");
      onAuthed(res.token, res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-full items-center justify-center p-4">
      <div className="app-bg" />
      <div className="sys-panel relative w-full max-w-md overflow-hidden p-7">
        <div className="scanline" />
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sys-blue to-sys-purple text-2xl text-white shadow-[0_0_28px_-4px_rgba(47,107,255,0.9)]">
            ⚔️
          </div>
          <div>
            <div className="font-display text-xl font-black uppercase tracking-[0.2em] text-white glow-text">Heronote</div>
            <div className="text-xs uppercase tracking-[0.25em] text-sys-cyan">
              {mode === "login" ? "вход" : "новый герой"}
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-md py-2 font-ui text-sm font-semibold uppercase tracking-wide transition ${
                mode === m ? "bg-gradient-to-r from-sys-blue/40 to-sys-purple/30 text-white" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <Field icon={<User size={16} />}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя Охотника" className="input border-0 bg-transparent px-0 focus:shadow-none" />
            </Field>
          )}
          <Field icon={<Mail size={16} />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              autoComplete="email"
              className="input border-0 bg-transparent px-0 focus:shadow-none"
            />
          </Field>
          <Field icon={<Lock size={16} />}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="пароль"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="input border-0 bg-transparent px-0 focus:shadow-none"
            />
          </Field>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
        )}

        <button onClick={submit} disabled={loading} className="btn-sys mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display text-lg disabled:opacity-60">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <>{mode === "login" ? "Войти" : "Создать аккаунт"} <ChevronsRight size={20} /></>}
        </button>

        <p className="mt-4 text-center text-xs text-ink-500">Все данные хранятся на сервере в твоём аккаунте</p>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/12 bg-ink-900/60 px-3 transition focus-within:border-sys-azure/70">
      <span className="text-ink-500">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
