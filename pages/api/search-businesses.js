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

    res.status(200).json({
      success: true,
      query,
      results: formattedResults,
      totalResults: formattedResults.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching for businesses",
      error: error.message,
    });
  }
}
