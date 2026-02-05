/**
 * Script to generate payment records for all existing users
 * Run this once after adding the payment system
 * 
 * Usage: node scripts/generatePayments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Payment = require('../src/models/Payment');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const generatePaymentsForAllUsers = async () => {
  try {
    console.log('🔄 Starting payment generation...\n');

    // Get all users
    const users = await User.find({
      registrationCompletedAt: { $exists: true, $ne: null },
    });

    console.log(`📊 Found ${users.length} registered users\n`);

    let totalGenerated = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.fullName} (${user.email})`);
      
      const payments = await Payment.generateMonthlyPayments(
        user._id,
        user.registrationCompletedAt
      );

      console.log(`  ✅ Generated ${payments.length} payment records`);
      totalGenerated += payments.length;
    }

    console.log(`\n✨ Successfully generated ${totalGenerated} payment records!`);
  } catch (error) {
    console.error('❌ Error generating payments:', error);
  }
};

const main = async () => {
  await connectDB();
  await generatePaymentsForAllUsers();
  
  console.log('\n🎉 Payment generation complete!');
  process.exit(0);
};

main();