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

type PermissionOption = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  allowed: boolean;
};

type EditableApkUser = {
  id: string;
  projectId: string;
  name: string;
  username: string;
  active: boolean;
  expiresAt: string;
  maxDevices: number;
  notes: string;
};

type EditApkUserFormProps = {
  user: EditableApkUser;
  projects: ProjectOption[];
  permissions: PermissionOption[];
  projectName: string;
};

export function EditApkUserForm({
  user,
  projects,
  permissions: initialPermissions,
  projectName: initialProjectName,
}: EditApkUserFormProps) {
  const router = useRouter();

  const [projectId, setProjectId] = useState(user.projectId);
  const [projectName, setProjectName] = useState(initialProjectName);

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");

  const [active, setActive] = useState(user.active);
  const [expiresAt, setExpiresAt] = useState(user.expiresAt);
  const [maxDevices, setMaxDevices] = useState(user.maxDevices);
  const [notes, setNotes] = useState(user.notes);

  const [permissions, setPermissions] =
    useState<PermissionOption[]>(initialPermissions);

  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleProjectChange(newProjectId: string) {
    setProjectId(newProjectId);

    const selectedProject = projects.find(
      (project) => project.id === newProjectId,
    );

    setProjectName(selectedProject?.name ?? "");

    // Se continuar no projeto original, restaura as permissões atuais.
    if (newProjectId === user.projectId) {
      setPermissions(initialPermissions);
      return;
    }

    setLoadingPermissions(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${newProjectId}/permissions`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setPermissions([]);
        setError(
          data?.error ||
          "Não foi possível carregar as permissões deste projeto.",
        );
        return;
      }

      const projectPermissions: PermissionOption[] = (
        data?.permissions ?? []
      ).map(
        (permission: {
          id: string;
          name: string;
          key: string;
          description: string | null;
          active: boolean;
        }) => ({
          id: permission.id,
          name: permission.name,
          key: permission.key,
          description: permission.description,
          allowed: false,
        }),
      );

      setPermissions(projectPermissions);
    } catch {
      setPermissions([]);
      setError("Falha ao carregar as permissões do projeto.");
    } finally {
      setLoadingPermissions(false);
    }
  }

  function togglePermission(permissionId: string, allowed: boolean) {
    setPermissions((current) =>
      current.map((permission) =>
        permission.id === permissionId
          ? {
            ...permission,
            allowed,
          }
          : permission,
      ),
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
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
        maxDevices: number;
        notes: string;
        password?: string;
        permissions: {
          permissionId: string;
          allowed: boolean;
        }[];
      } = {
        projectId,
        name,
        username,
        active,
        expiresAt,
        maxDevices,
        notes,

        permissions: permissions.map((permission) => ({
          permissionId: permission.id,
          allowed: permission.allowed,
        })),
      };

      if (password.trim()) {
        body.password = password;
      }

      const response = await fetch(
        `/api/apk-users/${user.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
          "Não foi possível editar o usuário.",
        );
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
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.grid}>
        <label className={styles.label}>
          Projeto

          <select
            className={styles.input}
            value={projectId}
            onChange={(event) =>
              handleProjectChange(
                event.target.value,
              )
            }
            disabled={
              loading || loadingPermissions
            }
          >
            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Nome do usuário

          <input
            className={styles.input}
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
          />
        </label>

        <label className={styles.label}>
          Login

          <input
            className={styles.input}
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            required
          />
        </label>

        <PasswordInput
          label="Nova senha"
          placeholder="Deixe em branco para manter"
          value={password}
          onChange={setPassword}
        />

        <label className={styles.label}>
          Expira em

          <input
            className={styles.input}
            type="date"
            value={expiresAt}
            onChange={(event) =>
              setExpiresAt(event.target.value)
            }
          />
        </label>

        <label className={styles.label}>
          Máximo de dispositivos/navegadores

          <input
            className={styles.input}
            type="number"
            min={1}
            value={maxDevices}
            onChange={(event) =>
              setMaxDevices(
                Number(event.target.value),
              )
            }
          />
        </label>
      </div>

      <h2 className={styles.sectionTitle}>
        Acesso geral
      </h2>

      <div className={styles.permissions}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(event.target.checked)
            }
          />

          Usuário ativo
        </label>
      </div>

      <h2 className={styles.sectionTitle}>
        Permissões — {projectName}
      </h2>

      {loadingPermissions ? (
        <div className={styles.permissionsEmpty}>
          Carregando permissões...
        </div>
      ) : permissions.length === 0 ? (
        <div className={styles.permissionsEmpty}>
          Este APK ainda não possui permissões
          específicas cadastradas.
        </div>
      ) : (
        <div className={styles.permissions}>
          {permissions.map((permission) => (
            <label
              key={permission.id}
              className={styles.checkbox}
            >
              <input
                type="checkbox"
                checked={permission.allowed}
                onChange={(event) =>
                  togglePermission(
                    permission.id,
                    event.target.checked,
                  )
                }
              />

              <span>
                <strong>
                  {permission.name}
                </strong>

                {permission.description && (
                  <small>
                    {permission.description}
                  </small>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      <label className={styles.label}>
        Observações

        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
        />
      </label>

      <div className={styles.actions}>
        <Link
          href={`/apk-users/${user.id}`}
          className={styles.cancelButton}
        >
          Cancelar
        </Link>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={
            loading || loadingPermissions
          }
        >
          {loading
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}