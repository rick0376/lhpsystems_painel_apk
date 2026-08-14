// src/app/(private)/projects/[id]/permissions/PermissionsManager.tsx

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";

import styles from "./styles.module.scss";

type Permission = {
    id: string;
    name: string;
    key: string;
    description: string | null;
    active: boolean;
};

type Props = {
    projectId: string;
    projectName: string;
    initialPermissions: Permission[];
};

export default function PermissionsManager({
    projectId,
    projectName,
    initialPermissions,
}: Props) {
    const [permissions, setPermissions] =
        useState<Permission[]>(initialPermissions);

    const [name, setName] =
        useState("");

    const [key, setKey] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/permissions`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            name,
                            key,
                            description,
                        }),
                    },
                );

            const data =
                await response.json();

            if (!response.ok) {
                setError(
                    data?.error ||
                    "Não foi possível criar a permissão.",
                );

                return;
            }

            setPermissions(
                (current) =>
                    [
                        ...current,
                        data.permission,
                    ].sort(
                        (a, b) =>
                            a.name.localeCompare(
                                b.name,
                            ),
                    ),
            );

            setName("");
            setKey("");
            setDescription("");
        } catch {
            setError(
                "Erro de conexão com o servidor.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <section className={styles.header}>
                <div>
                    <span className={styles.badge}>
                        Permissões APK
                    </span>

                    <h1>{projectName}</h1>

                    <p>
                        Cadastre somente as permissões que pertencem a este aplicativo.
                    </p>
                </div>

                <Link
                    href={`/projects/${projectId}`}
                    className={styles.backButton}
                >
                    Voltar
                </Link>
            </section>

            <section className={styles.formCard}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Nova permissão</h2>

                        <p>
                            Crie uma função que poderá ser liberada ou bloqueada por usuário.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className={styles.form}
                >
                    <label>
                        <span>
                            Nome da permissão
                        </span>

                        <input
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value,
                                )
                            }
                            placeholder="Ex.: Excluir playlists"
                            required
                        />
                    </label>

                    <label>
                        <span>Chave</span>

                        <input
                            value={key}
                            onChange={(event) =>
                                setKey(
                                    event.target.value
                                        .replace(
                                            /\s+/g,
                                            "_",
                                        )
                                        .replace(
                                            /[^a-zA-Z0-9_]/g,
                                            "",
                                        ),
                                )
                            }
                            placeholder="Ex.: canDeleteRadioPlaylists"
                            required
                        />
                    </label>

                    <label className={styles.full}>
                        <span>Descrição</span>

                        <input
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value,
                                )
                            }
                            placeholder="Ex.: Permite excluir playlists da rádio."
                        />
                    </label>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            type="submit"
                            disabled={loading}
                        >
                            <Plus size={18} />

                            {loading
                                ? "Salvando..."
                                : "Adicionar permissão"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={styles.listCard}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>
                            Permissões cadastradas
                        </h2>

                        <p>
                            {permissions.length} permissão(ões) neste aplicativo.
                        </p>
                    </div>
                </div>

                {permissions.length === 0 ? (
                    <div className={styles.empty}>
                        Nenhuma permissão específica cadastrada.
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {permissions.map(
                            (permission) => (
                                <article
                                    key={permission.id}
                                    className={
                                        styles.permission
                                    }
                                >
                                    <div>
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
                                            permission.active
                                                ? styles.active
                                                : styles.inactive
                                        }
                                    >
                                        {permission.active
                                            ? "Ativa"
                                            : "Inativa"}
                                    </span>
                                </article>
                            ),
                        )}
                    </div>
                )}
            </section>
        </>
    );
}