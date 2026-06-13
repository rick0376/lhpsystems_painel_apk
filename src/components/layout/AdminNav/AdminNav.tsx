// src/components/layout/AdminNav/AdminNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./styles.module.scss";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    enabled: true,
  },
  {
    label: "Projetos APK",
    href: "/projects",
    enabled: true,
  },
  {
    label: "Usuários APK",
    href: "/apk-users",
    enabled: true,
  },
  {
    label: "Licenças",
    href: "/licenses",
    enabled: true,
  },
  {
    label: "Dispositivos",
    href: "/devices",
    enabled: true,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {menuItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        if (!item.enabled) {
          return (
            <span key={item.href} className={styles.disabledItem}>
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? styles.activeItem : styles.item}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
