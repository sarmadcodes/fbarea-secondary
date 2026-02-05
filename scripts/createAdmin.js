/**
 * Script to promote a user to admin
 * Run: node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const promoteToAdmin = async (identifier) => {
  try {
    // Find user by email or CNIC
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { cnicNumber: identifier }
      ]
    });

    if (!user) {
      console.log('❌ User not found with email/CNIC:', identifier);
      return false;
    }

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log('\n✅ User promoted to admin successfully!');
    console.log('-----------------------------------');
    console.log('Name:', user.fullName);
    console.log('Email:', user.email);
    console.log('CNIC:', user.cnicNumber);
    console.log('Role:', user.role);
    console.log('-----------------------------------\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error promoting user:', error.message);
    return false;
  }
};

const listAllUsers = async () => {
  try {
    const users = await User.find({}).select('fullName email cnicNumber role');
    
    console.log('\n📋 All Users:');
    console.log('-----------------------------------');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   CNIC: ${user.cnicNumber}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  }
};

const main = async () => {
  await connectDB();

  console.log('===========================================');
  console.log('        Admin User Management');
  console.log('===========================================\n');

  rl.question('Do you want to:\n1. List all users\n2. Promote user to admin\n\nChoice (1 or 2): ', async (choice) => {
    if (choice === '1') {
      await listAllUsers();
      
      rl.question('\nEnter email or CNIC to promote to admin (or press Enter to exit): ', async (identifier) => {
        if (identifier.trim()) {
          await promoteToAdmin(identifier.trim());
        }
        rl.close();
        process.exit(0);
      });
    } else if (choice === '2') {
      rl.question('Enter email or CNIC of user to promote: ', async (identifier) => {
        await promoteToAdmin(identifier.trim());
        rl.close();
        process.exit(0);
      });
    } else {
      console.log('Invalid choice');
      rl.close();
      process.exit(0);
    }
  });
};

main();