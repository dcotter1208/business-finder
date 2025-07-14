import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGO_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

// Log connection details (without exposing password)
console.log("=== MongoDB Connection Debug Info ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "MONGO_URI (sanitized):",
  uri
    ? uri.replace(/\/\/([^:]+):([^@]+)@/, "//[USERNAME]:[PASSWORD]@")
    : "undefined"
);

// Validate connection string format
if (uri && !uri.startsWith("mongodb")) {
  console.error(
    "❌ Invalid MongoDB connection string format. Should start with 'mongodb://' or 'mongodb+srv://'"
  );
}

// Enhanced connection function with detailed error logging
async function connectWithLogging() {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    const client = new MongoClient(uri);
    const connection = await client.connect();
    console.log("✅ MongoDB connection successful!");

    // Test the connection by pinging
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB ping successful!");

    return connection;
  } catch (error) {
    console.error("❌ MongoDB Connection Error Details:");
    console.error("Error Type:", error.constructor.name);
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Error Code Name:", error.codeName);

    if (error.errorLabels) {
      console.error("Error Labels:", Array.from(error.errorLabels));
    }

    if (error.errorResponse) {
      console.error(
        "Error Response:",
        JSON.stringify(error.errorResponse, null, 2)
      );
    }

    // Specific guidance for common auth errors
    if (
      error.code === 8000 ||
      error.message.includes("Authentication failed")
    ) {
      console.error("\n🔍 Authentication Error Troubleshooting:");
      console.error(
        "1. Check your username and password in the connection string"
      );
      console.error(
        "2. Verify your MongoDB Atlas user exists and has proper permissions"
      );
      console.error(
        "3. Check if your IP address is whitelisted in MongoDB Atlas"
      );
      console.error("4. Ensure your cluster is not paused or suspended");
      console.error(
        "5. Try connecting with MongoDB Compass using the same credentials"
      );
    }

    throw error;
  }
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    console.log("🔄 Creating new MongoDB connection (development mode)");
    client = new MongoClient(uri);
    global._mongoClientPromise = connectWithLogging();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log("🔄 Creating new MongoDB connection (production mode)");
  client = new MongoClient(uri);
  clientPromise = connectWithLogging();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
