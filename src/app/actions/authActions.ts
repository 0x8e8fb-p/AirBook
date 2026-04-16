"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("[Auth] Attempting to create user in database:", email);

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      }
    });

    console.log("[Auth] User created successfully");
    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Registration error details:", error);
    return { success: false, error: error?.message || "Something went wrong in the database" };
  }
}

export async function sendPasswordResetEmail(email: string) {
  if (!email) {
    return { success: false, error: "Email is required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Return success even if user doesn't exist for security reasons
      return { success: true };
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    // Save token in the database
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      }
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "AirBook <noreply@resend.dev>", // Or your verified domain
        to: email.toLowerCase(),
        subject: "Reset your AirBook password",
        html: `
          <h1>Reset Your Password</h1>
          <p>Click the link below to reset your password for AirBook. This link will expire in 1 hour.</p>
          <a href="${resetLink}">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `
      });
    } else {
      console.log("No RESEND_API_KEY found. Reset link is:", resetLink);
      // Fallback for local dev
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Password reset error:", error);
    return { success: false, error: "Failed to send reset email" };
  }
}

export async function updatePassword(formData: FormData) {
  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!token || !email || !password) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        token,
      }
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid or expired token" };
    }

    if (new Date() > verificationToken.expires) {
      return { success: false, error: "Token has expired" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword }
    });

    // Delete token so it can't be reused
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token,
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Update password error:", error);
    return { success: false, error: "Failed to update password" };
  }
}