// src/app/(private)/apk-users/new/NewApkUserForm.tsx

"use client";

import {
  useMemo,
  useState,
} from "react";

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

  const [
    projectId,
    setProjectId,
  ] = useState(
    initialProjectId || "",
  );

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [active, setActive] =
    useState(true);

  const [
    expiresAt,
    setExpiresAt,
  ] = useState("");

  const [
    maxDevices,
    setMaxDevices,
  ] = useState(1);

  const [notes, setNotes] =
    useState("");

  const [
    permissionAccess,
    setPermissionAccess,
  ] = useState<
    Record<string, boolean>
  >({});

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            project.id ===
            projectId,
        ),
      [projectId, projects],
    );

  const allowedCount =
    selectedProject
      ? selectedProject.permissions.filter(
        (permission) =>
          permissionAccess[
          permission.id
          ] === true,
      ).length
      : 0;

  function handleProjectChange(
    newProjectId: string,
  ) {
    setProjectId(newProjectId);

    setPermissionAccess({});

    setError("");
  }

  function togglePermission(
    permissionId: string,
    allowed: boolean,
  ) {
    setPermissionAccess(
      (current) => ({
        ...current,

        [permissionId]:
          allowed,
      }),
    );
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
            permissionId:
              permission.id,

            allowed:
              permissionAccess[
              permission.id
              ] ?? false,
          }),
        );

      const response =
        await fetch(
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

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
          "Não foi possível cadastrar o usuário.",
        );

        return;
      }

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

  function handleBack() {
    if (initialProjectId) {
      router.push(
        `/projects/${initialProjectId}`,
      );

      return;
    }

    router.push("/apk-users");
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
              Escolha o aplicativo e
              defina os dados utilizados
              no login.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          <label
            className={styles.label}
          >
            <span>
              Projeto / aplicativo
            </span>

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
                required
                disabled={loading}
              >
                <option value="">
                  Selecione um projeto
                </option>

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
              Nome do cliente / igreja
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
                placeholder="Ex: Igreja LHP"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                required
                disabled={loading}
              />
            </div>
          </label>

          <label
            className={styles.label}
          >
            <span>
              Usuário de login
            </span>

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
                placeholder="Ex: igreja_lhp"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target
                      .value,
                  )
                }
                required
                disabled={loading}
              />
            </div>
          </label>

          <div
            className={
              styles.passwordField
            }
          >
            <PasswordInput
              label="Senha de acesso"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={setPassword}
            />

            <small>
              Senha utilizada pelo
              usuário para entrar no
              aplicativo.
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
            className={`${styles.sectionIcon} ${styles.licenseIcon}`}
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
              Configure validade, limite
              de dispositivos e situação
              geral do usuário.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          <label
            className={styles.label}
          >
            <span>
              Data de expiração
            </span>

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
                disabled={loading}
              />
            </div>

            <small>
              Deixe sem data caso o
              acesso não tenha prazo.
            </small>
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
                disabled={loading}
              />
            </div>

            <small>
              Quantidade máxima de
              celulares ou navegadores
              permitidos.
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
                Permite que o usuário
                faça login no aplicativo
                imediatamente.
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
              disabled={loading}
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
              className={`${styles.sectionIcon} ${styles.permissionIcon}`}
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
                {selectedProject
                  ? `Permissões — ${selectedProject.name}`
                  : "Permissões do APK"}
              </h2>

              <p>
                Marque somente os recursos
                que este usuário poderá
                utilizar.
              </p>
            </div>
          </div>

          {selectedProject && (
            <div
              className={
                styles.permissionCounter
              }
            >
              <strong>
                {allowedCount}
              </strong>

              <span>
                de{" "}
                {
                  selectedProject
                    .permissions.length
                }{" "}
                liberadas
              </span>
            </div>
          )}
        </div>

        {!selectedProject ? (
          <div
            className={
              styles.projectNotice
            }
          >
            <AppWindow size={24} />

            <strong>
              Selecione um projeto
            </strong>

            <p>
              As permissões específicas
              serão carregadas após
              selecionar o aplicativo.
            </p>
          </div>
        ) : selectedProject
          .permissions.length ===
          0 ? (
          <div
            className={
              styles.projectNotice
            }
          >
            <ShieldCheck size={24} />

            <strong>
              Nenhuma permissão
            </strong>

            <p>
              Este APK ainda não possui
              permissões específicas
              cadastradas.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.permissionsList
            }
          >
            {selectedProject.permissions.map(
              (permission) => {
                const allowed =
                  permissionAccess[
                  permission.id
                  ] ?? false;

                return (
                  <label
                    key={permission.id}
                    className={`${styles.permissionRow} ${allowed
                        ? styles.permissionRowActive
                        : ""
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={(
                        event,
                      ) =>
                        togglePermission(
                          permission.id,
                          event.target
                            .checked,
                        )
                      }
                      disabled={
                        loading
                      }
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

                    <span
                      className={
                        allowed
                          ? styles.allowedBadge
                          : styles.blockedBadge
                      }
                    >
                      {allowed
                        ? "Liberado"
                        : "Bloqueado"}
                    </span>
                  </label>
                );
              },
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
            className={`${styles.sectionIcon} ${styles.notesIcon}`}
          >
            <StickyNote size={20} />
          </div>

          <div>
            <span>
              Informações internas
            </span>

            <h2>
              Observações
            </h2>

            <p>
              Informações administrativas
              sobre este usuário.
            </p>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Observações internas..."
          value={notes}
          onChange={(event) =>
            setNotes(
              event.target.value,
            )
          }
          disabled={loading}
        />
      </section>

      <div className={styles.actions}>
        <div
          className={
            styles.actionsText
          }
        >
          <strong>
            Criar novo usuário?
          </strong>

          <span>
            O acesso será criado com as
            configurações definidas acima.
          </span>
        </div>

        <div
          className={
            styles.actionButtons
          }
        >
          <button
            className={
              styles.backButton
            }
            type="button"
            onClick={handleBack}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            className={
              styles.submitButton
            }
            type="submit"
            disabled={
              loading ||
              !projectId
            }
          >
            <Save
              size={17}
              strokeWidth={2.5}
            />

            {loading
              ? "Salvando..."
              : "Salvar usuário"}
          </button>
        </div>
      </div>
    </form>
  );
}