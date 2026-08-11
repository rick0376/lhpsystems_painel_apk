// src/components/layout/AdminShell/AdminShell.tsx

import Image from "next/image";

import { AdminNav } from "../AdminNav/AdminNav";
import { LogoutButton } from "../LogoutButton/LogoutButton";

import styles from "./styles.module.scss";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({
  children,
}: AdminShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandArea}>
          <div className={styles.headerInner}>
            <div className={styles.brand}>
              <div className={styles.logoContainer}>
                <Image
                  src="/images/logo.jpeg"
                  alt="LHP Systems"
                  width={62}
                  height={62}
                  className={styles.logo}
                  priority
                />
              </div>

              <div className={styles.brandContent}>
                <span className={styles.brandEyebrow}>
                  Tecnologia & Gestão
                </span>

                <strong className={styles.brandTitle}>
                  LHP Systems
                </strong>

                <span className={styles.brandSubtitle}>
                  Gestão de APKs • Licenças • Acessos
                </span>
              </div>
            </div>

            <div className={styles.logoutArea}>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className={styles.navigationArea}>
          <div className={styles.navigationInner}>
            <AdminNav />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image
              src="/images/logo.jpeg"
              alt="LHP Systems"
              width={38}
              height={38}
              className={styles.footerLogo}
            />

            <div>
              <strong>LHP Systems</strong>

              <span>
                Tecnologia, sistemas e soluções digitais.
              </span>
            </div>
          </div>

          <div className={styles.footerCenter}>
            <span>© 2026 LHP Systems</span>
            <small>Todos os direitos reservados.</small>
          </div>

          <div className={styles.footerDeveloper}>
            <span>Desenvolvido por</span>
            <strong>Rick Pereira</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}