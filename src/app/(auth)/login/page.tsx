// src/app/(auth)/login/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../../../components/ui/PasswordInput/PasswordInput";
import styles from "./styles.module.scss";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível fazer login.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <div className={styles.logoBox}>
          <span className={styles.logoText}>LHP</span>
        </div>

        <h1 className={styles.title}>Painel APK</h1>

        <p className={styles.subtitle}>
          Controle de usuários, licenças e permissões do aplicativo.
        </p>

        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.label}>
            E-mail
            <input
              className={styles.input}
              type="email"
              placeholder="admin@lhpsystems.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <PasswordInput
            label="Senha"
            placeholder="Digite sua senha"
            value={password}
            onChange={setPassword}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>

        <p className={styles.footer}>
          © 2026 LHP Systems. Todos os direitos reservados.
        </p>
      </section>
    </main>
  );
}
