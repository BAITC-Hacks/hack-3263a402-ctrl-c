import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";

const parameters = { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 };
function derive(password: string, salt: Uint8Array): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, parameters, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt-v1$16384$8$5$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts.slice(0, 4).join("$") !== "scrypt-v1$16384$8$5" || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{64}$/.test(parts[5])) return false;
  const actual = await derive(password, Buffer.from(parts[4], "hex"));
  return timingSafeEqual(actual, Buffer.from(parts[5], "hex"));
}

// A valid-shaped, impossible verifier keeps unknown-user login on the same KDF path.
export const dummyPasswordHash = "scrypt-v1$16384$8$5$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";
export const randomToken = () => randomBytes(32).toString("hex");
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
