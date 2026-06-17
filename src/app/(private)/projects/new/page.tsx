// src/app/(private)/projects/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "../../../../components/layout/AdminShell/AdminShell";
import styles from "./styles.module.scss";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatWhatsappLabel(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
}

function normalizeWhatsappNumber(label: string) {
  const digits = onlyDigits(label);

  if (!digits) return "";
  if (digits.startsWith("55")) return digits;

  return `55${digits}`;
}

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [appKey, setAppKey] = useState("");
  const [description, setDescription] = useState("");
  const [supportWhatsappLabel, setSupportWhatsappLabel] =
    useState("(12) 991890682");
  const [supportWhatsappMessage, setSupportWhatsappMessage] = useState(
    "Olá, minha licença do LHP Projection Center expirou. Pode me ajudar?",
  );
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(slugify(value));
    }

    if (!appKey) {
      setAppKey(slugify(value).replaceAll("-", "_").toUpperCase());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          appKey,
          description,
          supportWhatsappLabel,
          supportWhatsappNumber: normalizeWhatsappNumber(supportWhatsappLabel),
          supportWhatsappMessage,
          active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível cadastrar o projeto.");
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Novo aplicativo</span>
          <h1 className={styles.title}>Cadastrar projeto APK</h1>
          <p className={styles.subtitle}>
            Crie um aplicativo para controlar usuários, licenças e permissões.
          </p>
        </div>

        <button
          className={styles.backButton}
          type="button"
          onClick={() => router.push("/projects")}
        >
          Voltar
        </button>
      </section>

      <section className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Nome do projeto
            <input
              className={styles.input}
              placeholder="Ex: LHP Projection Center"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </label>

          <label className={styles.label}>
            Slug
            <input
              className={styles.input}
              placeholder="ex: lhp-projection-center"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
            />
          </label>

          <label className={styles.label}>
            App Key
            <input
              className={styles.input}
              placeholder="ex: LHP_PROJECTION_CENTER"
              value={appKey}
              onChange={(event) => setAppKey(event.target.value.toUpperCase())}
            />
          </label>

          <label className={styles.label}>
            WhatsApp de suporte
            <input
              className={styles.input}
              placeholder="Ex: (12) 991890682"
              value={supportWhatsappLabel}
              onChange={(event) =>
                setSupportWhatsappLabel(formatWhatsappLabel(event.target.value))
              }
            />
          </label>

          <label className={styles.label}>
            Mensagem padrão do WhatsApp
            <textarea
              className={styles.textarea}
              placeholder="Mensagem enviada pelo cliente"
              value={supportWhatsappMessage}
              onChange={(event) =>
                setSupportWhatsappMessage(event.target.value)
              }
            />
          </label>

          <label className={styles.label}>
            Descrição
            <textarea
              className={styles.textarea}
              placeholder="Descrição do aplicativo"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            <span>Projeto ativo</span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar projeto"}
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
