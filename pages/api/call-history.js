import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("business_finder");
    const collection = db.collection("phone_calls");

    // Fetch all phone call records, sorted by lastCalled date (most recent first)
    const callHistory = await collection
      .find({})
      .sort({ lastCalled: -1 })
      .toArray();

    console.log(`📋 Found ${callHistory.length} call history records`);

    // Transform the data to match the business format expected by the frontend
    const transformedResults = callHistory.map((record) => ({
      id: record.businessId,
      name: record.businessName,
      phone: record.phone,
      address: record.address,
      website: record.website,
      description: record.description,
      rating: record.rating,
      reviews: record.reviews,
      type: record.type,
      // Add call-specific data
      firstCalled: record.firstCalled,
      lastCalled: record.lastCalled,
      callCount: record.callCount,
    }));

    return res.status(200).json({
      success: true,
      results: transformedResults,
      totalCalls: callHistory.length,
    });
  } catch (error) {
    console.error("❌ Call History API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching call history",
      error: error.message,
    });
  }
}
