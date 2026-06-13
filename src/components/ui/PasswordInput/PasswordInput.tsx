// src/components/ui/PasswordInput/PasswordInput.tsx

"use client";

import { useState } from "react";
import styles from "./styles.module.scss";

type PasswordInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

export function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className={styles.label}>
      {label}

      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <button
          className={styles.eyeButton}
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? (
            <span className={styles.eyeIcon}>🙈</span>
          ) : (
            <span className={styles.eyeIcon}>👁️</span>
          )}
        </button>
      </div>
    </label>
  );
}
