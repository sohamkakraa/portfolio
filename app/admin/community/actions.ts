"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";
import { approveGuess, deleteGuess, deleteSignup, isPlace } from "@/lib/basecamp/community";

/** Every action re-checks the session; a server action is a public endpoint like any other. */
async function requireAdmin() {
  const token = (await cookies()).get("admin_session")?.value;
  const session = token ? await verifySessionToken(token).catch(() => null) : null;
  if (!session) throw new Error("Not signed in.");
}

const ID = /^[0-9a-f-]{36}$/;

export async function approve(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!ID.test(id)) return;
  await approveGuess(id);
  revalidatePath("/lists");
  revalidatePath("/admin/community");
}

export async function remove(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!ID.test(id)) return;
  await deleteGuess(id);
  revalidatePath("/lists");
  revalidatePath("/admin/community");
}

export async function removeSignup(formData: FormData) {
  await requireAdmin();
  const placeId = formData.get("placeId");
  const email = String(formData.get("email") ?? "");
  if (!isPlace(placeId) || !email) return;
  await deleteSignup(placeId, email);
  revalidatePath("/admin/community");
}
