/**
 * The phrase a member types to confirm account deletion.
 *
 * It lives here rather than in the action file because a `"use server"` module
 * may only export async functions — exporting a constant from one fails the
 * build. Both the form and the action import it, so the text on screen and the
 * text being checked cannot drift apart.
 */
export const DELETE_CONFIRMATION = "HAPUS AKUN";
