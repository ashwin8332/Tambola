/**
 * Admin Creation Script
 * 
 * Usage: node scripts/createAdmin.js
 * 
 * This script creates an admin account directly in the database.
 * Run this script from the server directory.
 */

import mongoose from "mongoose";
import Admin from "../models/admin.model.js";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tambola";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

const createAdmin = async () => {
  try {
    console.log("\n🔐 Tambola Admin Creation Script\n");
    console.log("=====================================\n");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check if admin exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log("⚠️  An admin already exists:");
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}\n`);
      
      const proceed = await question("Do you want to create another admin? (yes/no): ");
      if (proceed.toLowerCase() !== "yes") {
        console.log("\n❌ Admin creation cancelled.");
        process.exit(0);
      }
    }

    // Get admin details
    console.log("\nEnter admin details:\n");

    const username = await question("👤 Username: ");
    if (!username || username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    const email = await question("📧 Email: ");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Check if email exists
    const emailExists = await Admin.findOne({ email });
    if (emailExists) {
      throw new Error("Email already exists");
    }

    const password = await question("🔒 Password (min 8 chars): ");
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const phone = await question("📱 Phone (optional, press Enter to skip): ");

    console.log("\n📝 Creating admin account...");

    // Create admin
    const admin = new Admin({
      username,
      email,
      password,
      phone: phone || undefined,
      role: "superadmin",
      status: "active",
    });

    await admin.save();

    console.log("\n✅ Admin created successfully!");
    console.log("\n=====================================");
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log("=====================================\n");
    console.log("You can now login at: /admin/login\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
