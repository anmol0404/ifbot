import "dotenv/config";
import mongoose from "mongoose";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is missing in your .env file!");
  process.exit(1);
}

// Define the schema inline to avoid esm/path resolution issues
const ConfigVarSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  encryptedValue: { type: String, required: true },
  category: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Number, required: true },
});

const ConfigVarModel = mongoose.model("ConfigVar", ConfigVarSchema);

async function run() {
  console.log("Connecting to database...");
  try {
    await mongoose.connect(databaseUrl);
    console.log("✅ Connected successfully to MongoDB!");

    console.log("Deleting all encrypted config override documents from DB...");
    const result = await ConfigVarModel.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} configuration overrides from MongoDB.`);
    console.log("\nAll old encrypted settings have been removed!");
    console.log("The bot will now fall back to the configuration values in your .env file.");
    console.log("You can start your bot now, and re-configure any variables using the /config command.");
  } catch (err) {
    console.error("❌ Error running script:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();
