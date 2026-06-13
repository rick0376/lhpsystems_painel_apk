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

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [appKey, setAppKey] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(slugify(value));
    }

    if (!appKey) {
      setAppKey(slugify(value).replaceAll("-", "_"));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          appKey,
          description,
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
              placeholder="Ex: LHP Live Prayer"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </label>

          <label className={styles.label}>
            Slug
            <input
              className={styles.input}
              placeholder="ex: lhp-live-prayer"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
            />
          </label>

          <label className={styles.label}>
            App Key
            <input
              className={styles.input}
              placeholder="ex: lhp_live_prayer"
              value={appKey}
              onChange={(event) => setAppKey(event.target.value)}
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
