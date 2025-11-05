// deploy-backend.js
const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const ec2 = new AWS.EC2();
const REGION = "ap-south-1"; // Mumbai — change if needed
AWS.config.update({ region: REGION });

async function deploy() {
  // Read and encode your bash script
  const userDataPath = path.join(__dirname, "bin", "bash.sh");
  const userDataScript = fs.readFileSync(userDataPath, "utf8");
  const userDataEncoded = Buffer.from(userDataScript).toString("base64");

  const params = {
    ImageId: "ami-0a789f4871a5c4e84", // Ubuntu 22.04 LTS ARM64 (ap-south-1) — VALID AS OF 2025
    InstanceType: "t4g.micro", // Free tier eligible, ARM-based
    MinCount: 1,
    MaxCount: 1,
    // KeyName: 'your-key-pair',       // Optional: uncomment if you have a key pair
    SecurityGroupIds: ["sg-YOUR_SECURITY_GROUP_ID"], // 🔥 MUST REPLACE
    UserData: userDataEncoded,
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [{ Key: "Name", Value: "shiprocket-backend" }],
      },
    ],
  };

  try {
    console.log("🚀 Launching EC2 instance...");
    const data = await ec2.runInstances(params).promise();
    const instanceId = data.Instances[0].InstanceId;
    console.log(`✅ Instance launched: ${instanceId}`);

    // Wait until running
    console.log("⏳ Waiting for instance to be running...");
    await ec2
      .waitFor("instanceRunning", { InstanceIds: [instanceId] })
      .promise();

    // Allocate & associate Elastic IP
    console.log(".Assigning Elastic IP...");
    const eip = await ec2.allocateAddress({ Domain: "vpc" }).promise();
    await ec2
      .associateAddress({
        InstanceId: instanceId,
        AllocationId: eip.AllocationId,
      })
      .promise();

    console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("📌 Elastic IP (use this in ShipRocket):", eip.PublicIp);
    console.log("🆔 Instance ID:", instanceId);
    console.log("🔗 Access your backend at: http://" + eip.PublicIp + ":8000");
    console.log("💾 Save Allocation ID (for cleanup):", eip.AllocationId);
  } catch (err) {
    console.error("❌ Deployment failed:", err.message);
    process.exit(1);
  }
}

deploy();
