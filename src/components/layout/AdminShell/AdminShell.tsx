// src/components/layout/AdminShell/AdminShell.tsx

import Image from "next/image";
import { AdminNav } from "../AdminNav/AdminNav";
import { LogoutButton } from "../LogoutButton/LogoutButton";
import styles from "./styles.module.scss";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Image
              src="/images/logo.jpeg"
              alt="LHP Systems"
              width={48}
              height={48}
              className={styles.logo}
              priority
            />

            <div>
              <strong className={styles.brandTitle}>LHP Systems</strong>
              <span className={styles.brandSubtitle}>Painel de APKs</span>
            </div>
          </div>

          <LogoutButton />
        </div>

        <AdminNav />
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2026 LHP Systems. Todos os direitos reservados.</span>
          <span>Desenvolvido por Rick Pereira</span>
        </div>
      </footer>
    </div>
  );
}
