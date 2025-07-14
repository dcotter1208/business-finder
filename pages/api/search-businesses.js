import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { service, zipCode } = req.body;

  if (!service || !zipCode) {
    return res
      .status(400)
      .json({ message: "Service and zip code are required" });
  }

  try {
    // Construct the search query
    const query = `${service} near ${zipCode}`;

    // You'll need to set your SERPAPI_API_KEY environment variable
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "API key not configured" });
    }

    // Make request to SerpAPI
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
        query
      )}&api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const data = await response.json();

    // Format the results
    const formattedResults =
      data.local_results?.map((business) => ({
        id: business.place_id,
        name: business.title,
        website: business.website || null,
        phone: business.phone || null,
        address: business.address || null,
        description:
          business.description || business.type || "No description available",
        rating: business.rating || null,
        reviews: business.reviews || null,
        type: business.type || null,
        thumbnail: business.thumbnail || null,
      })) || [];

    // Check which businesses have been called before
    try {
      const client = await clientPromise;
      const db = client.db("business_finder");
      const collection = db.collection("phone_calls");

      // Get all the business IDs from search results
      const businessIds = formattedResults.map((business) => business.id);

      // Find which ones have been called before
      const calledBusinesses = await collection
        .find({ businessId: { $in: businessIds } })
        .toArray();

      // Create a Set for faster lookup
      const calledBusinessIds = new Set(
        calledBusinesses.map((record) => record.businessId)
      );

      // Add previously_called property to each result
      const resultsWithCallStatus = formattedResults.map((business) => ({
        ...business,
        previously_called: calledBusinessIds.has(business.id),
      }));

      res.status(200).json({
        success: true,
        query,
        results: resultsWithCallStatus,
        totalResults: resultsWithCallStatus.length,
      });
    } catch (dbError) {
      console.warn("Could not check call history:", dbError);
      // If database check fails, still return results without call status
      const resultsWithCallStatus = formattedResults.map((business) => ({
        ...business,
        previously_called: false,
      }));

      res.status(200).json({
        success: true,
        query,
        results: resultsWithCallStatus,
        totalResults: resultsWithCallStatus.length,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching for businesses",
      error: error.message,
    });
  }
}
