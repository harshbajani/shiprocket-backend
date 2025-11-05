// cleanup.js
const AWS = require("aws-sdk");
require("dotenv").config();

const REGION = "ap-south-1";
AWS.config.update({ region: REGION });
const ec2 = new AWS.EC2();

const INSTANCE_ID = process.argv[2];
const ALLOCATION_ID = process.argv[3];

if (!INSTANCE_ID || !ALLOCATION_ID) {
  console.error("Usage: node cleanup.js <INSTANCE_ID> <ALLOCATION_ID>");
  process.exit(1);
}

async function cleanup() {
  try {
    console.log("🗑️ Terminating instance...");
    await ec2.terminateInstances({ InstanceIds: [INSTANCE_ID] }).promise();

    console.log("orelease Elastic IP...");
    await ec2.releaseAddress({ AllocationId: ALLOCATION_ID }).promise();

    console.log("✅ Cleanup complete.");
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
}

cleanup();
