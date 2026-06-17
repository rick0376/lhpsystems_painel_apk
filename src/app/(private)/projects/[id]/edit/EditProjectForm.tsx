// src/app/(private)/projects/[id]/edit/EditProjectForm.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

type EditableProject = {
  id: string;
  name: string;
  slug: string;
  appKey: string;
  description: string;
  supportWhatsappLabel: string;
  supportWhatsappNumber: string;
  supportWhatsappMessage: string;
  active: boolean;
};

type EditProjectFormProps = {
  project: EditableProject;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
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

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [appKey, setAppKey] = useState(project.appKey);
  const [description, setDescription] = useState(project.description);
  const [supportWhatsappLabel, setSupportWhatsappLabel] = useState(
    project.supportWhatsappLabel || "(12) 991890682",
  );
  const [supportWhatsappMessage, setSupportWhatsappMessage] = useState(
    project.supportWhatsappMessage ||
      "Olá, minha licença do LHP Projection Center expirou. Pode me ajudar?",
  );
  const [active, setActive] = useState(project.active);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);

    if (!slug.trim()) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
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
        setError(data?.error || "Não foi possível editar o projeto.");
        return;
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        <label className={styles.label}>
          Nome do projeto
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: LHP Projection Center"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
          />
        </label>

        <label className={styles.label}>
          Slug
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: lhp-projection-center"
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
          />
        </label>

        <label className={styles.label}>
          App Key
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: LHP_PROJECTION_CENTER"
            value={appKey}
            onChange={(event) => setAppKey(event.target.value.toUpperCase())}
          />
        </label>

        <label className={styles.label}>
          WhatsApp de suporte
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: (12) 991890682"
            value={supportWhatsappLabel}
            onChange={(event) =>
              setSupportWhatsappLabel(formatWhatsappLabel(event.target.value))
            }
          />
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Projeto ativo
        </label>
      </div>

      <label className={styles.label}>
        Mensagem padrão do WhatsApp
        <textarea
          className={styles.textarea}
          placeholder="Mensagem enviada pelo cliente"
          value={supportWhatsappMessage}
          onChange={(event) => setSupportWhatsappMessage(event.target.value)}
        />
      </label>

      <label className={styles.label}>
        Descrição
        <textarea
          className={styles.textarea}
          placeholder="Descrição interna sobre este aplicativo"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className={styles.actions}>
        <Link href={`/projects/${project.id}`} className={styles.cancelButton}>
          Cancelar
        </Link>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
