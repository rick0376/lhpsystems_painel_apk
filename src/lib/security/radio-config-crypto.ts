import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const FORMAT_VERSION = "v1";

function getEncryptionKey() {
  const secret = process.env.RADIO_CONFIG_ENCRYPTION_KEY;

  if (!secret || secret.length < 32) {
    throw new Error(
      "RADIO_CONFIG_ENCRYPTION_KEY precisa ter pelo menos 32 caracteres.",
    );
  }

  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptRadioSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptRadioSecret(encryptedValue: string) {
  const [version, ivValue, tagValue, ciphertextValue] =
    encryptedValue.split(".");

  if (
    version !== FORMAT_VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue
  ) {
    throw new Error("Formato de credencial de rádio inválido.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
