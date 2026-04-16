"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const mobile = formData.get("mobile") as string;
  const password = formData.get("password") as string;

  if (!name || !username || !email || !mobile || !password) {
    return { success: false, error: "All fields are required" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existingEmail) {
      return { success: false, error: "An account with this email already exists" };
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    if (existingUsername) {
      return { success: false, error: "This username is already taken" };
    }

    const existingMobile = await prisma.user.findUnique({
      where: { mobile }
    });
    if (existingMobile) {
      return { success: false, error: "This mobile number is already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("[Auth] Attempting to create user in database:", email);

    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        mobile,
        password: hashedPassword,
      }
    });

    console.log("[Auth] User created successfully");

    // Send verification email
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      }
    });

    const verifyLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "AirBook <noreply@resend.dev>",
        to: email.toLowerCase(),
        subject: "Verify your AirBook account",
        html: `
          <h1>Welcome to AirBook!</h1>
          <p>Please click the link below to verify your email address and activate your account.</p>
          <a href="${verifyLink}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } else {
      console.log("No RESEND_API_KEY found. Verification link is:", verifyLink);
    }

    return { success: true, message: "Please check your email to verify your account before logging in." };
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

export async function verifyEmail(formData: FormData) {
  const token = formData.get("token") as string;
  const email = formData.get("email") as string;

  if (!token || !email) {
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
      return { success: false, error: "Invalid or expired verification link" };
    }

    if (new Date() > verificationToken.expires) {
      return { success: false, error: "Verification link has expired" };
    }

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: new Date() }
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
    console.error("[Auth] Verify email error:", error);
    return { success: false, error: "Failed to verify email" };
  }
}

export async function updateProfile(userId: string, formData: FormData) {
  if (!userId) return { success: false, error: "Not authenticated" };

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const mobile = formData.get("mobile") as string;
  const dobString = formData.get("dob") as string;

  try {
    // Check uniqueness for username and mobile
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), NOT: { id: userId } }
      });
      if (existingUser) return { success: false, error: "Username is already taken" };
    }

    if (mobile) {
      const existingUser = await prisma.user.findFirst({
        where: { mobile, NOT: { id: userId } }
      });
      if (existingUser) return { success: false, error: "Mobile number is already registered" };
    }

    let dob: Date | null = null;
    if (dobString) {
      dob = new Date(dobString);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username: username ? username.toLowerCase() : null,
        mobile,
        dob
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function deleteAccount(userId: string) {
  if (!userId) return { success: false, error: "Missing user ID" };

  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Delete account error:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

export async function updateProfileImage(userId: string, imageUrl: string) {
  if (!userId || !imageUrl) return { success: false, error: "Missing parameters" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl }
    });
    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Update profile image error:", error);
    return { success: false, error: "Failed to update profile image" };
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