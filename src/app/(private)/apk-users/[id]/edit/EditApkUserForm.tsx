// src/app/(private)/apk-users/[id]/edit/EditApkUserForm.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../../../../../components/ui/PasswordInput/PasswordInput";
import styles from "./styles.module.scss";

type ProjectOption = {
  id: string;
  name: string;
};

type EditableApkUser = {
  id: string;
  projectId: string;
  name: string;
  username: string;
  active: boolean;
  expiresAt: string;
  canTransmit: boolean;
  canOpenSettings: boolean;
  canEditRadioConfig: boolean;
  maxDevices: number;
  notes: string;
};

type EditApkUserFormProps = {
  user: EditableApkUser;
  projects: ProjectOption[];
};

export function EditApkUserForm({ user, projects }: EditApkUserFormProps) {
  const router = useRouter();

  const [projectId, setProjectId] = useState(user.projectId);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(user.active);
  const [expiresAt, setExpiresAt] = useState(user.expiresAt);
  const [canTransmit, setCanTransmit] = useState(user.canTransmit);
  const [canOpenSettings, setCanOpenSettings] = useState(user.canOpenSettings);
  const [canEditRadioConfig, setCanEditRadioConfig] = useState(
    user.canEditRadioConfig,
  );
  const [maxDevices, setMaxDevices] = useState(user.maxDevices);
  const [notes, setNotes] = useState(user.notes);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const body: {
        projectId: string;
        name: string;
        username: string;
        active: boolean;
        expiresAt: string;
        canTransmit: boolean;
        canOpenSettings: boolean;
        canEditRadioConfig: boolean;
        maxDevices: number;
        notes: string;
        password?: string;
      } = {
        projectId,
        name,
        username,
        active,
        expiresAt,
        canTransmit,
        canOpenSettings,
        canEditRadioConfig,
        maxDevices,
        notes,
      };

      if (password.trim()) {
        body.password = password;
      }

      const response = await fetch(`/api/apk-users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível editar o usuário.");
        return;
      }

      router.push(`/apk-users/${user.id}`);
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
          Projeto
          <select
            className={styles.input}
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Nome do usuário
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: Pastor Rodolfo"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className={styles.label}>
          Login
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: rodolfo"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <PasswordInput
          label="Nova senha"
          placeholder="Deixe vazio para manter a senha atual"
          value={password}
          onChange={setPassword}
        />

        <label className={styles.label}>
          Expira em
          <input
            className={styles.input}
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </label>

        <label className={styles.label}>
          Máximo de dispositivos
          <input
            className={styles.input}
            type="number"
            min={1}
            value={maxDevices}
            onChange={(event) => setMaxDevices(Number(event.target.value))}
          />
        </label>
      </div>

      <div className={styles.permissions}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Usuário ativo
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={canTransmit}
            onChange={(event) => setCanTransmit(event.target.checked)}
          />
          Pode transmitir
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={canOpenSettings}
            onChange={(event) => setCanOpenSettings(event.target.checked)}
          />
          Pode abrir configurações
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={canEditRadioConfig}
            onChange={(event) => setCanEditRadioConfig(event.target.checked)}
          />
          Pode editar rádio
        </label>
      </div>

      <label className={styles.label}>
        Observações
        <textarea
          className={styles.textarea}
          placeholder="Observações internas sobre este usuário"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <div className={styles.actions}>
        <Link href={`/apk-users/${user.id}`} className={styles.cancelButton}>
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
