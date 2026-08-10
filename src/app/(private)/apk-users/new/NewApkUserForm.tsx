// src/app/(private)/apk-users/new/NewApkUserForm.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PasswordInput } from "../../../../components/ui/PasswordInput/PasswordInput";

import styles from "./styles.module.scss";

type PermissionOption = {
  id: string;
  name: string;
  key: string;
  description: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
  permissions: PermissionOption[];
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

  const [projectId, setProjectId] = useState(
    initialProjectId || "",
  );

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [active, setActive] = useState(true);

  const [expiresAt, setExpiresAt] = useState("");

  const [maxDevices, setMaxDevices] =
    useState(1);

  const [notes, setNotes] = useState("");

  const [permissionAccess, setPermissionAccess] =
    useState<Record<string, boolean>>({});

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) =>
          project.id === projectId,
      ),
    [projectId, projects],
  );

  function handleProjectChange(
    newProjectId: string,
  ) {
    setProjectId(newProjectId);

    /*
     * Ao trocar o projeto, limpamos
     * as permissões marcadas anteriormente.
     *
     * Assim nunca carregamos uma permissão
     * de um APK para outro.
     */
    setPermissionAccess({});

    setError("");
  }

  function togglePermission(
    permissionId: string,
    allowed: boolean,
  ) {
    setPermissionAccess((current) => ({
      ...current,

      [permissionId]: allowed,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!selectedProject) {
        setError(
          "Selecione um projeto/aplicativo.",
        );

        return;
      }

      const permissions =
        selectedProject.permissions.map(
          (permission) => ({
            permissionId: permission.id,

            allowed:
              permissionAccess[
              permission.id
              ] ?? false,
          }),
        );

      const response = await fetch(
        "/api/apk-users",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            projectId,
            name,
            username,
            password,
            active,
            expiresAt,
            maxDevices,
            notes,
            permissions,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
          "Não foi possível cadastrar o usuário.",
        );

        return;
      }

      /*
       * Se o cadastro veio diretamente
       * da página de um projeto,
       * voltamos para aquele projeto.
       */
      if (initialProjectId) {
        router.push(
          `/projects/${projectId}`,
        );
      } else {
        router.push(
          `/apk-users/${data.apkUser.id}`,
        );
      }

      router.refresh();
    } catch {
      setError(
        "Falha de conexão com o servidor.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.card}>
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <div className={styles.gridTwo}>
          <label className={styles.label}>
            Projeto / aplicativo

            <select
              className={styles.input}
              value={projectId}
              onChange={(event) =>
                handleProjectChange(
                  event.target.value,
                )
              }
              required
              disabled={loading}
            >
              <option value="">
                Selecione um projeto
              </option>

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
            Nome do cliente/igreja

            <input
              className={styles.input}
              placeholder="Ex: Igreja LHP"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              disabled={loading}
            />
          </label>
        </div>

        <div className={styles.gridTwo}>
          <label className={styles.label}>
            Usuário de login

            <input
              className={styles.input}
              placeholder="Ex: igreja_lhp"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
              required
              disabled={loading}
            />
          </label>

          <PasswordInput
            label="Senha de acesso"
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
              onChange={(event) =>
                setExpiresAt(
                  event.target.value,
                )
              }
              disabled={loading}
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
                  Number(
                    event.target.value,
                  ),
                )
              }
              disabled={loading}
            />
          </label>
        </div>

        <div
          className={
            styles.permissionsCard
          }
        >
          <div
            className={
              styles.permissionsHeader
            }
          >
            <div>
              <strong>
                Acesso geral
              </strong>

              <p>
                Controle principal de acesso
                deste usuário.
              </p>
            </div>
          </div>

          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(event) =>
                setActive(
                  event.target.checked,
                )
              }
              disabled={loading}
            />

            <span>
              <b>Usuário ativo</b>

              <small>
                Permite que este usuário
                faça login no aplicativo.
              </small>
            </span>
          </label>
        </div>

        {selectedProject ? (
          <div
            className={
              styles.permissionsCard
            }
          >
            <div
              className={
                styles.permissionsHeader
              }
            >
              <div>
                <strong>
                  Permissões —{" "}
                  {selectedProject.name}
                </strong>

                <p>
                  Marque apenas os recursos
                  que este usuário poderá
                  utilizar.
                </p>
              </div>

              <span
                className={
                  styles.permissionCount
                }
              >
                {
                  selectedProject
                    .permissions.length
                }{" "}
                permissão(ões)
              </span>
            </div>

            {selectedProject.permissions
              .length === 0 ? (
              <div
                className={
                  styles.emptyPermissions
                }
              >
                Este APK ainda não possui
                permissões específicas
                cadastradas.
              </div>
            ) : (
              <div
                className={
                  styles.permissionsList
                }
              >
                {selectedProject.permissions.map(
                  (permission) => (
                    <label
                      key={permission.id}
                      className={
                        styles.permissionRow
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          permissionAccess[
                          permission.id
                          ] ?? false
                        }
                        onChange={(
                          event,
                        ) =>
                          togglePermission(
                            permission.id,
                            event.target
                              .checked,
                          )
                        }
                        disabled={loading}
                      />

                      <div
                        className={
                          styles.permissionInfo
                        }
                      >
                        <strong>
                          {permission.name}
                        </strong>

                        <code>
                          {permission.key}
                        </code>

                        {permission.description && (
                          <p>
                            {
                              permission.description
                            }
                          </p>
                        )}
                      </div>
                    </label>
                  ),
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              styles.projectNotice
            }
          >
            Selecione um projeto para
            carregar as permissões específicas
            deste APK.
          </div>
        )}

        <label className={styles.label}>
          Observações

          <textarea
            className={styles.textarea}
            placeholder="Observações internas..."
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            disabled={loading}
          />
        </label>

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            className={styles.backButton}
            type="button"
            onClick={() => {
              if (initialProjectId) {
                router.push(
                  `/projects/${initialProjectId}`,
                );

                return;
              }

              router.push("/apk-users");
            }}
            disabled={loading}
          >
            Voltar
          </button>

          <button
            className={
              styles.submitButton
            }
            type="submit"
            disabled={
              loading || !projectId
            }
          >
            {loading
              ? "Salvando..."
              : "Salvar usuário"}
          </button>
        </div>
      </form>
    </section>
  );
}