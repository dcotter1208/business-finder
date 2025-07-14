import clientPromise from "../../lib/mongodb";

// Helper function to get current time in Eastern timezone
const getEasternTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// Convert the localeString back to a Date object in Eastern time
const getEasternDate = () => {
  const easternTimeString = getEasternTime();
  // Parse the formatted string back to a Date object
  const [datePart, timePart] = easternTimeString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute, second] = timePart.split(":");

  return new Date(year, month - 1, day, hour, minute, second);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { business } = req.body;

  if (!business) {
    return res.status(400).json({ message: "Business data is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("business_finder");
    const collection = db.collection("phone_calls");

    // DEBUG: Log database and collection info
    console.log("🔍 Database name:", db.databaseName);
    console.log("🔍 Collection name:", collection.collectionName);

    // DEBUG: List all databases to see what exists
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log(
      "📋 Available databases:",
      databases.databases.map((db) => db.name)
    );

    const easternNow = getEasternDate();

    // Check if this business has already been called
    const existingCall = await collection.findOne({
      businessId: business.id,
    });

    console.log("🔍 Existing call found:", existingCall ? "YES" : "NO");

    if (existingCall) {
      // Update the existing record with new call timestamp
      const result = await collection.updateOne(
        { businessId: business.id },
        {
          $set: {
            lastCalled: easternNow,
            callCount: existingCall.callCount + 1,
            updatedAt: easternNow,
          },
        }
      );

      console.log("📝 Update result:", result);

      return res.status(200).json({
        success: true,
        message: "Phone call logged successfully",
        data: {
          businessId: business.id,
          isNewRecord: false,
          callCount: existingCall.callCount + 1,
        },
      });
    } else {
      // Create new record
      const phoneCallRecord = {
        businessId: business.id,
        businessName: business.name,
        phone: business.phone,
        address: business.address,
        website: business.website,
        description: business.description,
        rating: business.rating,
        reviews: business.reviews,
        type: business.type,
        status: "called",
        firstCalled: easternNow,
        lastCalled: easternNow,
        callCount: 1,
        createdAt: easternNow,
        updatedAt: easternNow,
      };

      console.log("📝 Inserting document:", phoneCallRecord);

      const result = await collection.insertOne(phoneCallRecord);

      console.log("✅ Insert result:", result);
      console.log("🆔 Inserted ID:", result.insertedId);

      // DEBUG: Verify the document was inserted
      const verifyInsert = await collection.findOne({ _id: result.insertedId });
      console.log(
        "🔍 Verification - Document found:",
        verifyInsert ? "YES" : "NO"
      );

      return res.status(201).json({
        success: true,
        message: "Phone call logged successfully",
        data: {
          businessId: business.id,
          isNewRecord: true,
          callCount: 1,
          _id: result.insertedId,
        },
      });
    }
  } catch (error) {
    console.error("❌ Database Error Details:");
    console.error("Error Type:", error.constructor.name);
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Error Code Name:", error.codeName);
    console.error("Error Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Error saving phone call data",
      error: error.message,
    });
  }
}
