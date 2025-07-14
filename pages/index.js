import { useState, useEffect } from "react";
import Head from "next/head";
import {
  Container,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Link,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Phone,
  Web,
  Star,
  LocationOn,
  History,
  Search,
  CheckCircle,
} from "@mui/icons-material";

const businessTypes = [
  "Roofing",
  "HVAC",
  "Fencing",
  "Plumbing",
  "Electrical",
  "Siding",
  "Landscaping",
  "Home cleaning",
  "Commercial cleaning",
  "Security services",
  "Painting",
  "Janitorial",
];

export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [service, setService] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // New state for tabs and call history
  const [activeTab, setActiveTab] = useState(0);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!zipCode || !service) {
      setError("Please enter both zip code and select a service type");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/search-businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service,
          zipCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setSearched(true);
      } else {
        setError(data.message || "Error searching for businesses");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove any non-digit characters and format as needed
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  const handlePhoneCall = async (business) => {
    try {
      // Log the phone call to the database
      const response = await fetch("/api/save-phone-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Phone call logged successfully:", data.data);

        // Refresh search results if we're on the search tab to show updated "Previously Called" status
        if (activeTab === 0 && searched) {
          // Update the results state to mark this business as previously called
          setResults((prevResults) =>
            prevResults.map((result) =>
              result.id === business.id
                ? { ...result, previously_called: true }
                : result
            )
          );
        }

        // Refresh call history if we're on the history tab
        if (activeTab === 1) {
          fetchCallHistory();
        }
      } else {
        console.error("Failed to log phone call:", data.message);
      }
    } catch (error) {
      console.error("Error logging phone call:", error);
    }

    // Initiate the phone call regardless of logging success/failure
    window.location.href = `tel:${business.phone}`;
  };

  // New function to fetch call history
  const fetchCallHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/call-history");
      const data = await response.json();

      if (data.success) {
        setCallHistory(data.results);
      } else {
        setHistoryError(data.message || "Error fetching call history");
      }
    } catch (err) {
      setHistoryError("Network error. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch call history when tab changes to history
  useEffect(() => {
    if (activeTab === 1) {
      fetchCallHistory();
    }
  }, [activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderBusinessCard = (business, isHistory = false) => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 300,
        width: "100%",
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {business.name}
        </Typography>

        {business.rating && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Rating
              value={business.rating}
              precision={0.1}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {business.rating}{" "}
              {business.reviews && `(${business.reviews} reviews)`}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          {business.type && <Chip label={business.type} size="small" />}
          {business.previously_called && !isHistory && (
            <Chip
              label="Previously Called"
              size="small"
              color="success"
              icon={<CheckCircle />}
              variant="outlined"
            />
          )}
        </Box>

        {isHistory && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Last Called:</strong> {formatDate(business.lastCalled)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Total Calls:</strong> {business.callCount}
            </Typography>
            {business.firstCalled && (
              <Typography variant="body2" color="text.secondary">
                <strong>First Called:</strong>{" "}
                {formatDate(business.firstCalled)}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          {business.description}
        </Typography>

        {business.address && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
            }}
          >
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {business.address}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Grid container spacing={1}>
          {business.phone && (
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Phone />}
                onClick={() => handlePhoneCall(business)}
              >
                {formatPhoneNumber(business.phone)}
              </Button>
            </Grid>
          )}
          {business.website && (
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Web />}
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </Button>
            </Grid>
          )}
        </Grid>
      </CardActions>
    </Card>
  );

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          py: 4,
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab icon={<Search />} label="Search Businesses" />
            <Tab icon={<History />} label="Call History" />
          </Tabs>
        </Box>

        {/* Search Tab Content */}
        {activeTab === 0 && (
          <>
            {/* Search Form */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box component="form" onSubmit={handleSearch}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 3,
                      alignItems: "stretch",
                    }}
                  >
                    <Box sx={{ flex: { xs: "none", md: 1 } }}>
                      <TextField
                        fullWidth
                        label="Zip Code"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="Enter your zip code"
                        variant="outlined"
                        inputProps={{ maxLength: 5, pattern: "[0-9]{5}" }}
                      />
                    </Box>
                    <Box sx={{ flex: { xs: "none", md: 1 } }}>
                      <FormControl fullWidth>
                        <InputLabel>Service Type</InputLabel>
                        <Select
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                          label="Service Type"
                        >
                          {businessTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: { xs: "none", md: 1 } }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{ height: 56 }}
                      >
                        {loading ? <CircularProgress size={24} /> : "Search"}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Search Results */}
            {searched && !loading && (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Search Results{" "}
                  {results.length > 0 && `(${results.length} found)`}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {results.length === 0 ? (
                  <Alert severity="info">
                    No businesses found for "{service}" near {zipCode}. Try a
                    different service type or zip code.
                  </Alert>
                ) : (
                  <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                    {results.map((business) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        width="100%"
                        key={business.id}
                      >
                        {renderBusinessCard(business, false)}
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </>
        )}

        {/* Call History Tab Content */}
        {activeTab === 1 && (
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h5">
                Call History{" "}
                {callHistory.length > 0 && `(${callHistory.length} businesses)`}
              </Typography>
              <Button
                variant="outlined"
                onClick={fetchCallHistory}
                disabled={historyLoading}
                startIcon={
                  historyLoading ? <CircularProgress size={16} /> : <History />
                }
              >
                Refresh
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* History Error Message */}
            {historyError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {historyError}
              </Alert>
            )}

            {historyLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : callHistory.length === 0 ? (
              <Alert severity="info">
                No call history found. Start making calls to businesses to see
                them here!
              </Alert>
            ) : (
              <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                {callHistory.map((business) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    width="100%"
                    key={business.id}
                  >
                    {renderBusinessCard(business, true)}
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}
