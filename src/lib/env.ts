export function getRequiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

