"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

type RadioConfigValues = {
  host: string;
  sourcePort: number;
  publicPort: number | null;
  playerUrl: string;
  sourceUsername: string;
  mountPoint: string;
  useTls: boolean;
  enabled: boolean;
  bitrate: number;
  sampleRate: number;
  channels: number;
  version: number;
  credentialConfigured: boolean;
  updatedAt: string | null;
};

type Props = {
  projectId: string;
  initialConfig: RadioConfigValues;
};

export function RadioConfigForm({ projectId, initialConfig }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initialConfig);
  const [sourcePassword, setSourcePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function setField<K extends keyof RadioConfigValues>(
    field: K,
    value: RadioConfigValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/projects/${projectId}/radio-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: values.host,
          sourcePort: values.sourcePort,
          publicPort: values.publicPort,
          playerUrl: values.playerUrl,
          sourceUsername: values.sourceUsername,
          sourcePassword,
          mountPoint: values.mountPoint,
          useTls: values.useTls,
          enabled: values.enabled,
          bitrate: values.bitrate,
          sampleRate: values.sampleRate,
          channels: values.channels,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        config?: RadioConfigValues;
      };

      if (!response.ok || !data.config) {
        setError(data.error || "Não foi possível salvar a configuração.");
        return;
      }

      setValues((current) => ({
        ...current,
        ...data.config,
        credentialConfigured: true,
      }));
      setSourcePassword("");
      setSuccess("Configuração atualizada. O app receberá os novos dados automaticamente.");
      router.refresh();
    } catch {
      setError("Falha de comunicação com o painel.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.statusRow}>
        <div>
          <span className={styles.statusLabel}>Status da transmissão</span>
          <strong className={values.enabled ? styles.enabled : styles.disabled}>
            {values.enabled ? "Liberada" : "Desativada"}
          </strong>
        </div>
        <div>
          <span className={styles.statusLabel}>Versão da configuração</span>
          <strong>{values.version || "Ainda não salva"}</strong>
        </div>
        <div>
          <span className={styles.statusLabel}>Credencial DJ</span>
          <strong>
            {values.credentialConfigured ? "Protegida" : "Não cadastrada"}
          </strong>
        </div>
      </div>

      <div className={styles.grid}>
        <label className={styles.label}>
          Host da rádio
          <input
            className={styles.input}
            value={values.host}
            onChange={(event) => setField("host", event.target.value)}
            placeholder="stream3.svrdedicado.org"
            required
          />
        </label>

        <label className={styles.label}>
          Porta DJ
          <input
            className={styles.input}
            type="number"
            min={1}
            max={65535}
            value={values.sourcePort}
            onChange={(event) =>
              setField("sourcePort", Number(event.target.value))
            }
            required
          />
        </label>

        <label className={styles.label}>
          Porta pública do player
          <input
            className={styles.input}
            type="number"
            min={1}
            max={65535}
            value={values.publicPort ?? ""}
            onChange={(event) =>
              setField(
                "publicPort",
                event.target.value ? Number(event.target.value) : null,
              )
            }
          />
        </label>

        <label className={styles.label}>
          URL pública do player
          <input
            className={styles.input}
            type="url"
            value={values.playerUrl}
            onChange={(event) => setField("playerUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className={styles.label}>
          Usuário DJ
          <input
            className={styles.input}
            value={values.sourceUsername}
            onChange={(event) =>
              setField("sourceUsername", event.target.value)
            }
            placeholder="live"
            required
          />
        </label>

        <label className={styles.label}>
          Senha DJ
          <input
            className={styles.input}
            type="password"
            value={sourcePassword}
            onChange={(event) => setSourcePassword(event.target.value)}
            placeholder={
              values.credentialConfigured
                ? "Deixe em branco para manter a senha atual"
                : "Informe a senha DJ"
            }
            autoComplete="new-password"
          />
          <small className={styles.hint}>
            Informe apenas a senha. O usuário “live” fica no campo anterior.
          </small>
        </label>

        <label className={styles.label}>
          Mount point
          <input
            className={styles.input}
            value={values.mountPoint}
            onChange={(event) => setField("mountPoint", event.target.value)}
            placeholder="/"
            required
          />
        </label>

        <label className={styles.label}>
          Bitrate
          <select
            className={styles.input}
            value={values.bitrate}
            onChange={(event) => setField("bitrate", Number(event.target.value))}
          >
            {[64, 96, 128, 192, 256, 320].map((value) => (
              <option key={value} value={value}>
                {value} kbps
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Taxa de amostragem
          <select
            className={styles.input}
            value={values.sampleRate}
            onChange={(event) =>
              setField("sampleRate", Number(event.target.value))
            }
          >
            <option value={22050}>22050 Hz</option>
            <option value={44100}>44100 Hz</option>
            <option value={48000}>48000 Hz</option>
          </select>
        </label>

        <label className={styles.label}>
          Canais
          <select
            className={styles.input}
            value={values.channels}
            onChange={(event) => setField("channels", Number(event.target.value))}
          >
            <option value={1}>Mono</option>
            <option value={2}>Estéreo</option>
          </select>
        </label>
      </div>

      <div className={styles.switches}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={(event) => setField("enabled", event.target.checked)}
          />
          Permitir transmissão ao vivo
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={values.useTls}
            onChange={(event) => setField("useTls", event.target.checked)}
          />
          Conexão segura TLS
        </label>
      </div>

      <div className={styles.notice}>
        No SonicPanel mostrado, a opção <strong>Interrupção AutoDJ</strong> está
        ativada. Assim, quando a conexão DJ for aceita, o AutoDJ deve ceder o ar
        para a oração ao vivo.
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button className={styles.submitButton} type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar configuração da rádio"}
        </button>
      </div>
    </form>
  );
}
