const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const uri = "mongodb+srv://vikash18:pulsar200ns@vicky.oerutaj.mongodb.net/bit_hostel";

async function test() {
  try {
    console.log("Connecting to Atlas...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("CONNECTED TO ATLAS SUCCESSFULLY!");
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log("USERS COUNT IN ATLAS:", users.length);
    users.forEach(u => console.log("USER:", u.email, u.role));
    process.exit(0);
  } catch (err) {
    console.error("ATLAS ERROR:", err.message);
    process.exit(1);
  }
}

test();
