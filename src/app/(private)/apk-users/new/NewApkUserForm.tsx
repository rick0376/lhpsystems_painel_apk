// src/app/(private)/apk-users/new/NewApkUserForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../../../../components/ui/PasswordInput/PasswordInput";
import styles from "./styles.module.scss";

type ProjectOption = { id: string; name: string };
type NewApkUserFormProps = { projects: ProjectOption[]; initialProjectId?: string };

export function NewApkUserForm({ projects, initialProjectId }: NewApkUserFormProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(initialProjectId || "");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [canTransmit, setCanTransmit] = useState(true);
  const [canOpenSettings, setCanOpenSettings] = useState(true);
  const [canEditRadioConfig, setCanEditRadioConfig] = useState(false);
  const [canAccessRadioManager, setCanAccessRadioManager] = useState(false);
  const [canViewRadioDashboard, setCanViewRadioDashboard] = useState(false);
  const [canManageAutoDj, setCanManageAutoDj] = useState(false);
  const [canViewRadioLibrary, setCanViewRadioLibrary] = useState(false);
  const [canUploadRadioTracks, setCanUploadRadioTracks] = useState(false);
  const [canDeleteRadioTracks, setCanDeleteRadioTracks] = useState(false);
  const [canManageRadioPlaylists, setCanManageRadioPlaylists] = useState(false);
  const [canManageRadioSchedules, setCanManageRadioSchedules] = useState(false);
  const [canManageRadioIntervals, setCanManageRadioIntervals] = useState(false);
  const [canManageRadioSettings, setCanManageRadioSettings] = useState(false);
  const [canViewRadioAudit, setCanViewRadioAudit] = useState(false);
  const [maxDevices, setMaxDevices] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/apk-users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId, name, username, password, active, expiresAt,
          canTransmit, canOpenSettings, canEditRadioConfig,
          canAccessRadioManager,
          canViewRadioDashboard,
          canManageAutoDj,
          canViewRadioLibrary,
          canUploadRadioTracks,
          canDeleteRadioTracks,
          canManageRadioPlaylists,
          canManageRadioSchedules,
          canManageRadioIntervals,
          canManageRadioSettings,
          canViewRadioAudit,
          maxDevices, notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data?.error || "Não foi possível cadastrar o usuário."); return; }
      router.push("/apk-users"); router.refresh();
    } catch { setError("Falha de conexão com o servidor."); } finally { setLoading(false); }
  }

  return <section className={styles.card}><form className={styles.form} onSubmit={handleSubmit}>
    <div className={styles.gridTwo}>
      <label className={styles.label}>Projeto / aplicativo<select className={styles.input} value={projectId} onChange={e=>setProjectId(e.target.value)} required><option value="">Selecione um projeto</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
      <label className={styles.label}>Nome do cliente/igreja<input className={styles.input} placeholder="Ex: Igreja LHP" value={name} onChange={e=>setName(e.target.value)} required /></label>
    </div>
    <div className={styles.gridTwo}>
      <label className={styles.label}>Usuário de login<input className={styles.input} placeholder="Ex: igreja_lhp" value={username} onChange={e=>setUsername(e.target.value)} required /></label>
      <PasswordInput label="Senha de acesso" placeholder="Mínimo 6 caracteres" value={password} onChange={setPassword} />
    </div>
    <div className={styles.gridTwo}>
      <label className={styles.label}>Data de expiração<input className={styles.input} type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} /></label>
      <label className={styles.label}>Máximo de dispositivos/navegadores<input className={styles.input} type="number" min={1} value={maxDevices} onChange={e=>setMaxDevices(Number(e.target.value))} /></label>
    </div>

    <div className={styles.permissionsCard}><strong>Permissões gerais do aplicativo</strong>
      <label className={styles.checkboxRow}><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/><span>Usuário ativo</span></label>
      <label className={styles.checkboxRow}><input type="checkbox" checked={canTransmit} onChange={e=>setCanTransmit(e.target.checked)}/><span>Pode transmitir ao vivo</span></label>
      <label className={styles.checkboxRow}><input type="checkbox" checked={canOpenSettings} onChange={e=>setCanOpenSettings(e.target.checked)}/><span>Pode abrir configurações</span></label>
      <label className={styles.checkboxRow}><input type="checkbox" checked={canEditRadioConfig} onChange={e=>setCanEditRadioConfig(e.target.checked)}/><span>Pode editar dados da rádio</span></label>
    </div>

    <div className={styles.permissionsCard}><strong>Permissões do LHP Radio Manager</strong>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canAccessRadioManager}
              onChange={(event) => setCanAccessRadioManager(event.target.checked)}
            />
            <span>Acessar o Radio Manager</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canViewRadioDashboard}
              onChange={(event) => setCanViewRadioDashboard(event.target.checked)}
            />
            <span>Ver painel e status da rádio</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canManageAutoDj}
              onChange={(event) => setCanManageAutoDj(event.target.checked)}
            />
            <span>Iniciar, parar e reiniciar AutoDJ</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canViewRadioLibrary}
              onChange={(event) => setCanViewRadioLibrary(event.target.checked)}
            />
            <span>Ver biblioteca e músicas</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canUploadRadioTracks}
              onChange={(event) => setCanUploadRadioTracks(event.target.checked)}
            />
            <span>Enviar e substituir músicas</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canDeleteRadioTracks}
              onChange={(event) => setCanDeleteRadioTracks(event.target.checked)}
            />
            <span>Excluir músicas</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canManageRadioPlaylists}
              onChange={(event) => setCanManageRadioPlaylists(event.target.checked)}
            />
            <span>Criar, editar e excluir playlists</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canManageRadioSchedules}
              onChange={(event) => setCanManageRadioSchedules(event.target.checked)}
            />
            <span>Gerenciar programação agendada</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canManageRadioIntervals}
              onChange={(event) => setCanManageRadioIntervals(event.target.checked)}
            />
            <span>Gerenciar intervalos e vinhetas</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canManageRadioSettings}
              onChange={(event) => setCanManageRadioSettings(event.target.checked)}
            />
            <span>Alterar configurações da rádio</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={canViewRadioAudit}
              onChange={(event) => setCanViewRadioAudit(event.target.checked)}
            />
            <span>Ver histórico de alterações</span>
          </label>
    </div>

    <label className={styles.label}>Observações<textarea className={styles.textarea} placeholder="Observações internas..." value={notes} onChange={e=>setNotes(e.target.value)} /></label>
    {error && <p className={styles.error}>{error}</p>}
    <div className={styles.actions}><button className={styles.backButton} type="button" onClick={()=>router.push("/apk-users")}>Voltar</button><button className={styles.submitButton} type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar usuário"}</button></div>
  </form></section>;
}
