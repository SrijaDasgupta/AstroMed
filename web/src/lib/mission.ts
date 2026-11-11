import { cookies } from "next/headers";
import { ENV_COOKIE, getEnvironment } from "@/lib/environments";

export async function getCurrentEnvironment() {
  const store = await cookies();
  return getEnvironment(store.get(ENV_COOKIE)?.value);
}
