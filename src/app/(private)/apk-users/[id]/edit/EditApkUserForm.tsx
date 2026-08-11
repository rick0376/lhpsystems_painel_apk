// src/app/(private)/apk-users/[id]/edit/EditApkUserForm.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AppWindow,
  CalendarClock,
  KeyRound,
  Save,
  ShieldCheck,
  Smartphone,
  StickyNote,
  UserRound,
} from "lucide-react";

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

  const [projectId, setProjectId] =
    useState(user.projectId);

  const [
    projectName,
    setProjectName,
  ] = useState(
    initialProjectName,
  );

  const [name, setName] =
    useState(user.name);

  const [username, setUsername] =
    useState(user.username);

  const [password, setPassword] =
    useState("");

  const [active, setActive] =
    useState(user.active);

  const [
    expiresAt,
    setExpiresAt,
  ] = useState(user.expiresAt);

  const [
    maxDevices,
    setMaxDevices,
  ] = useState(user.maxDevices);

  const [notes, setNotes] =
    useState(user.notes);

  const [
    permissions,
    setPermissions,
  ] =
    useState<PermissionOption[]>(
      initialPermissions,
    );

  const [
    loadingPermissions,
    setLoadingPermissions,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleProjectChange(
    newProjectId: string,
  ) {
    setProjectId(newProjectId);

    const selectedProject =
      projects.find(
        (project) =>
          project.id ===
          newProjectId,
      );

    setProjectName(
      selectedProject?.name ?? "",
    );

    if (
      newProjectId ===
      user.projectId
    ) {
      setPermissions(
        initialPermissions,
      );

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

      const data =
        await response.json();

      if (!response.ok) {
        setPermissions([]);

        setError(
          data?.error ||
          "Não foi possível carregar as permissões deste projeto.",
        );

        return;
      }

      const projectPermissions: PermissionOption[] =
        (
          data?.permissions ?? []
        ).map(
          (permission: {
            id: string;
            name: string;
            key: string;
            description:
            | string
            | null;
            active: boolean;
          }) => ({
            id: permission.id,
            name: permission.name,
            key: permission.key,
            description:
              permission.description,
            allowed: false,
          }),
        );

      setPermissions(
        projectPermissions,
      );
    } catch {
      setPermissions([]);

      setError(
        "Falha ao carregar as permissões do projeto.",
      );
    } finally {
      setLoadingPermissions(
        false,
      );
    }
  }

  function togglePermission(
    permissionId: string,
    allowed: boolean,
  ) {
    setPermissions((current) =>
      current.map((permission) =>
        permission.id ===
          permissionId
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

        permissions:
          permissions.map(
            (permission) => ({
              permissionId:
                permission.id,

              allowed:
                permission.allowed,
            }),
          ),
      };

      if (password.trim()) {
        body.password =
          password;
      }

      const response = await fetch(
        `/api/apk-users/${user.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(body),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
          "Não foi possível editar o usuário.",
        );

        return;
      }

      router.push(
        `/apk-users/${user.id}`,
      );

      router.refresh();
    } catch {
      setError(
        "Falha de conexão com o servidor.",
      );
    } finally {
      setLoading(false);
    }
  }

  const allowedCount =
    permissions.filter(
      (permission) =>
        permission.allowed,
    ).length;

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

      <section
        className={
          styles.formSection
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <div
            className={
              styles.sectionIcon
            }
          >
            <UserRound size={20} />
          </div>

          <div>
            <span>
              Identificação
            </span>

            <h2>
              Dados de acesso
            </h2>

            <p>
              Informações usadas para
              identificar e autenticar
              este usuário.
            </p>
          </div>
        </div>

        <div
          className={styles.grid}
        >
          <label
            className={styles.label}
          >
            <span>Projeto</span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <AppWindow
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <select
                className={
                  styles.input
                }
                value={projectId}
                onChange={(event) =>
                  handleProjectChange(
                    event.target
                      .value,
                  )
                }
                disabled={
                  loading ||
                  loadingPermissions
                }
              >
                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {project.name}
                    </option>
                  ),
                )}
              </select>
            </div>
          </label>

          <label
            className={styles.label}
          >
            <span>
              Nome do usuário
            </span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <UserRound
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <input
                className={
                  styles.input
                }
                value={name}
                onChange={(event) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                required
              />
            </div>
          </label>

          <label
            className={styles.label}
          >
            <span>Login</span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <KeyRound
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <input
                className={
                  styles.input
                }
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target
                      .value,
                  )
                }
                required
              />
            </div>
          </label>

          <div
            className={
              styles.passwordField
            }
          >
            <PasswordInput
              label="Nova senha"
              placeholder="Deixe em branco para manter"
              value={password}
              onChange={setPassword}
            />

            <small>
              Deixe em branco para
              manter a senha atual.
            </small>
          </div>
        </div>
      </section>

      <section
        className={
          styles.formSection
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <div
            className={`${styles.sectionIcon} ${styles.accessSectionIcon}`}
          >
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <span>
              Licença
            </span>

            <h2>
              Controle de acesso
            </h2>

            <p>
              Defina validade, quantidade
              de dispositivos e situação
              geral do usuário.
            </p>
          </div>
        </div>

        <div
          className={styles.grid}
        >
          <label
            className={styles.label}
          >
            <span>Expira em</span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <CalendarClock
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <input
                className={
                  styles.input
                }
                type="date"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(
                    event.target
                      .value,
                  )
                }
              />
            </div>
          </label>

          <label
            className={styles.label}
          >
            <span>
              Máximo de dispositivos
            </span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <Smartphone
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <input
                className={
                  styles.input
                }
                type="number"
                min={1}
                value={maxDevices}
                onChange={(event) =>
                  setMaxDevices(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </div>

            <small>
              Celulares e navegadores
              permitidos para este login.
            </small>
          </label>
        </div>

        <div
          className={
            styles.statusBox
          }
        >
          <div
            className={
              styles.statusInfo
            }
          >
            <div
              className={
                styles.statusIcon
              }
            >
              <ShieldCheck
                size={18}
              />
            </div>

            <div>
              <strong>
                Usuário ativo
              </strong>

              <span>
                Desative para bloquear
                imediatamente o acesso aos
                aplicativos.
              </span>
            </div>
          </div>

          <label
            className={styles.switch}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(event) =>
                setActive(
                  event.target
                    .checked,
                )
              }
            />

            <span
              className={
                styles.slider
              }
            />
          </label>
        </div>
      </section>

      <section
        className={
          styles.formSection
        }
      >
        <div
          className={
            styles.permissionsHeader
          }
        >
          <div
            className={
              styles.sectionHeaderSimple
            }
          >
            <div
              className={`${styles.sectionIcon} ${styles.permissionSectionIcon}`}
            >
              <ShieldCheck
                size={20}
              />
            </div>

            <div>
              <span>
                Recursos do aplicativo
              </span>

              <h2>
                Permissões —{" "}
                {projectName}
              </h2>

              <p>
                Escolha quais funções
                estarão disponíveis para
                este usuário.
              </p>
            </div>
          </div>

          <div
            className={
              styles.permissionCounter
            }
          >
            <strong>
              {allowedCount}
            </strong>

            <span>
              de {permissions.length}{" "}
              liberadas
            </span>
          </div>
        </div>

        {loadingPermissions ? (
          <div
            className={
              styles.permissionsEmpty
            }
          >
            Carregando permissões...
          </div>
        ) : permissions.length ===
          0 ? (
          <div
            className={
              styles.permissionsEmpty
            }
          >
            Este APK ainda não possui
            permissões específicas
            cadastradas.
          </div>
        ) : (
          <div
            className={
              styles.permissions
            }
          >
            {permissions.map(
              (permission) => (
                <label
                  key={permission.id}
                  className={`${styles.permissionItem} ${permission.allowed
                      ? styles.permissionItemActive
                      : ""
                    }`}
                >
                  <div
                    className={
                      styles.permissionCheck
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        permission.allowed
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
                    />
                  </div>

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
                      <small>
                        {
                          permission.description
                        }
                      </small>
                    )}
                  </div>

                  <span
                    className={
                      permission.allowed
                        ? styles.allowedBadge
                        : styles.blockedBadge
                    }
                  >
                    {permission.allowed
                      ? "Liberado"
                      : "Bloqueado"}
                  </span>
                </label>
              ),
            )}
          </div>
        )}
      </section>

      <section
        className={
          styles.formSection
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <div
            className={`${styles.sectionIcon} ${styles.notesSectionIcon}`}
          >
            <StickyNote
              size={20}
            />
          </div>

          <div>
            <span>
              Informações internas
            </span>

            <h2>Observações</h2>

            <p>
              Anotações administrativas
              sobre este usuário.
            </p>
          </div>
        </div>

        <textarea
          className={
            styles.textarea
          }
          value={notes}
          placeholder="Digite alguma observação sobre este usuário..."
          onChange={(event) =>
            setNotes(
              event.target.value,
            )
          }
        />
      </section>

      <div className={styles.actions}>
        <div
          className={
            styles.actionsText
          }
        >
          <strong>
            Salvar alterações?
          </strong>

          <span>
            As novas configurações serão
            aplicadas ao usuário.
          </span>
        </div>

        <div
          className={
            styles.actionButtons
          }
        >
          <Link
            href={`/apk-users/${user.id}`}
            className={
              styles.cancelButton
            }
          >
            Cancelar
          </Link>

          <button
            className={
              styles.submitButton
            }
            type="submit"
            disabled={
              loading ||
              loadingPermissions
            }
          >
            <Save
              size={17}
              strokeWidth={2.5}
            />

            {loading
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </div>
    </form>
  );
}