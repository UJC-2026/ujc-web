import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(1, "Kata sandi belum diisi."),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Nama lengkap minimal 3 karakter.")
      .max(80, "Nama lengkap terlalu panjang."),
    email: z.email("Masukkan alamat email yang valid."),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter.")
      .regex(/[a-z]/, "Sertakan minimal satu huruf kecil.")
      .regex(/[A-Z]/, "Sertakan minimal satu huruf besar.")
      .regex(/[0-9]/, "Sertakan minimal satu angka."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
