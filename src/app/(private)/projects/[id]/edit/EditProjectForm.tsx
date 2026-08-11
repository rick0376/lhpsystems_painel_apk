// src/app/(private)/projects/[id]/edit/EditProjectForm.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AppWindow,
  CheckCircle2,
  KeyRound,
  Link2,
  MessageCircle,
  Save,
} from "lucide-react";

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

function formatWhatsappLabel(
  value: string,
) {
  const digits =
    onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits
      ? `(${digits}`
      : "";
  }

  return `(${digits.slice(
    0,
    2,
  )}) ${digits.slice(2)}`;
}

function normalizeWhatsappNumber(
  label: string,
) {
  const digits =
    onlyDigits(label);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

export function EditProjectForm({
  project,
}: EditProjectFormProps) {
  const router = useRouter();

  const [name, setName] =
    useState(project.name);

  const [slug, setSlug] =
    useState(project.slug);

  const [appKey, setAppKey] =
    useState(project.appKey);

  const [
    description,
    setDescription,
  ] = useState(project.description);

  const [
    supportWhatsappLabel,
    setSupportWhatsappLabel,
  ] = useState(
    project.supportWhatsappLabel ||
    "(12) 991890682",
  );

  const [
    supportWhatsappMessage,
    setSupportWhatsappMessage,
  ] = useState(
    project.supportWhatsappMessage ||
    `Olá, preciso de ajuda com meu acesso ao aplicativo ${project.name}.`,
  );

  const [active, setActive] =
    useState(project.active);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleNameChange(
    value: string,
  ) {
    setName(value);

    if (!slug.trim()) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${project.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            slug,
            appKey,
            description,
            supportWhatsappLabel,

            supportWhatsappNumber:
              normalizeWhatsappNumber(
                supportWhatsappLabel,
              ),

            supportWhatsappMessage,
            active,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
          "Não foi possível editar o projeto.",
        );

        return;
      }

      router.push(
        `/projects/${project.id}`,
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
        className={styles.formSection}
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
            <AppWindow size={20} />
          </div>

          <div>
            <span>
              Identificação
            </span>

            <h2>
              Dados do projeto
            </h2>

            <p>
              Informações principais usadas
              para identificar o aplicativo.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          <label
            className={styles.label}
          >
            <span>
              Nome do projeto
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

              <input
                className={
                  styles.input
                }
                type="text"
                placeholder="Ex: LHP Projection Center"
                value={name}
                onChange={(event) =>
                  handleNameChange(
                    event.target.value,
                  )
                }
              />
            </div>
          </label>

          <label
            className={styles.label}
          >
            <span>Slug</span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <Link2
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <input
                className={
                  styles.input
                }
                type="text"
                placeholder="Ex: lhp-projection-center"
                value={slug}
                onChange={(event) =>
                  setSlug(
                    slugify(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </div>

            <small>
              Identificador usado nas URLs
              internas do projeto.
            </small>
          </label>

          <label
            className={styles.label}
          >
            <span>App Key</span>

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
                type="text"
                placeholder="Ex: LHP_PROJECTION_CENTER"
                value={appKey}
                onChange={(event) =>
                  setAppKey(
                    event.target.value,
                  )
                }
              />
            </div>

            <small>
              Chave usada pelo aplicativo
              para identificação no painel.
            </small>
          </label>

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
                <CheckCircle2
                  size={18}
                />
              </div>

              <div>
                <strong>
                  Projeto ativo
                </strong>

                <span>
                  Permite que este projeto
                  utilize o painel.
                </span>
              </div>
            </div>

            <label
              className={
                styles.switch
              }
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
        </div>

        <label
          className={styles.label}
        >
          <span>Descrição</span>

          <textarea
            className={
              styles.textarea
            }
            placeholder="Descrição interna sobre este aplicativo"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
          />
        </label>
      </section>

      <section
        className={styles.formSection}
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <div
            className={`${styles.sectionIcon} ${styles.whatsappSectionIcon}`}
          >
            <MessageCircle
              size={20}
            />
          </div>

          <div>
            <span>
              Atendimento
            </span>

            <h2>
              Suporte pelo WhatsApp
            </h2>

            <p>
              Configure o número e a
              mensagem padrão enviados pelo
              usuário.
            </p>
          </div>
        </div>

        <div
          className={
            styles.supportGrid
          }
        >
          <label
            className={styles.label}
          >
            <span>
              WhatsApp de suporte
            </span>

            <div
              className={
                styles.inputWrapper
              }
            >
              <MessageCircle
                size={17}
                className={
                  styles.inputIcon
                }
              />

              <input
                className={
                  styles.input
                }
                type="text"
                placeholder="Ex: (12) 991890682"
                value={
                  supportWhatsappLabel
                }
                onChange={(event) =>
                  setSupportWhatsappLabel(
                    formatWhatsappLabel(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </div>
          </label>
        </div>

        <label
          className={styles.label}
        >
          <span>
            Mensagem padrão do WhatsApp
          </span>

          <textarea
            className={
              styles.textarea
            }
            placeholder="Mensagem enviada pelo cliente"
            value={
              supportWhatsappMessage
            }
            onChange={(event) =>
              setSupportWhatsappMessage(
                event.target.value,
              )
            }
          />

          <small>
            Esta mensagem será utilizada
            quando o usuário solicitar
            suporte.
          </small>
        </label>
      </section>

      <div className={styles.actions}>
        <div>
          <strong>
            Salvar alterações?
          </strong>

          <span>
            As novas configurações serão
            aplicadas ao projeto.
          </span>
        </div>

        <div
          className={
            styles.actionButtons
          }
        >
          <Link
            href={`/projects/${project.id}`}
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
            disabled={loading}
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