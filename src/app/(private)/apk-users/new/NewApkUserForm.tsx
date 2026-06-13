// src/app/(private)/apk-users/new/NewApkUserForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../../../../components/ui/PasswordInput/PasswordInput";
import styles from "./styles.module.scss";

type ProjectOption = {
  id: string;
  name: string;
};

type NewApkUserFormProps = {
  projects: ProjectOption[];
  initialProjectId?: string;
};

export function NewApkUserForm({
  projects,
  initialProjectId,
}: NewApkUserFormProps) {
  const router = useRouter();

  const [projectId, setProjectId] = useState(initialProjectId || "");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  const [canTransmit, setCanTransmit] = useState(true);
  const [canOpenSettings, setCanOpenSettings] = useState(true);
  const [canEditRadioConfig, setCanEditRadioConfig] = useState(true);

  const [maxDevices, setMaxDevices] = useState(1);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/apk-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          name,
          username,
          password,
          active,
          expiresAt,
          canTransmit,
          canOpenSettings,
          canEditRadioConfig,
          maxDevices,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível cadastrar o usuário.");
        return;
      }

      router.push("/apk-users");
      router.refresh();
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.card}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.gridTwo}>
          <label className={styles.label}>
            Projeto APK
            <select
              className={styles.input}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">Selecione um projeto</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Nome do cliente/igreja
            <input
              className={styles.input}
              placeholder="Ex: Igreja LHP"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.gridTwo}>
          <label className={styles.label}>
            Usuário de login no APK
            <input
              className={styles.input}
              placeholder="Ex: igreja_lhp"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <PasswordInput
            label="Senha do APK"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={setPassword}
          />
        </div>

        <div className={styles.gridTwo}>
          <label className={styles.label}>
            Data de expiração
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

        <div className={styles.permissionsCard}>
          <strong>Permissões do APK</strong>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            <span>Usuário ativo</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canTransmit}
              onChange={(event) => setCanTransmit(event.target.checked)}
            />
            <span>Pode transmitir ao vivo</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canOpenSettings}
              onChange={(event) => setCanOpenSettings(event.target.checked)}
            />
            <span>Pode abrir configurações</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canEditRadioConfig}
              onChange={(event) => setCanEditRadioConfig(event.target.checked)}
            />
            <span>Pode editar dados da rádio</span>
          </label>
        </div>

        <label className={styles.label}>
          Observações
          <textarea
            className={styles.textarea}
            placeholder="Ex: Licença mensal, cliente em teste, observações internas..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            className={styles.backButton}
            type="button"
            onClick={() => router.push("/apk-users")}
          >
            Voltar
          </button>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar usuário"}
          </button>
        </div>
      </form>
    </section>
  );
}
