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
  Paper,
  Badge,
  useMediaQuery,
  useTheme,
  Snackbar,
} from "@mui/material";
import {
  Phone,
  Web,
  Star,
  LocationOn,
  History,
  Search,
  CheckCircle,
  Refresh,
  Add,
  Download,
  ContactPhone,
  Clear,
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

// Top 10 states for home services
const TOP_STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI"];

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

  // New state for zip code selection
  const [randomZipCodes, setRandomZipCodes] = useState([]);
  const [selectedZipChip, setSelectedZipChip] = useState(null);
  const [zipDataLoading, setZipDataLoading] = useState(true);
  const [zipDataCache, setZipDataCache] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  // Contact list state
  const [contactList, setContactList] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Check if desktop
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Contact list management functions
  const clearContactList = () => {
    setContactList([]);
    setSnackbarMessage("Contact list cleared");
    setSnackbarOpen(true);
  };

  const exportContactList = () => {
    if (contactList.length === 0) {
      setSnackbarMessage("No contacts to export");
      setSnackbarOpen(true);
      return;
    }

    // Create tab-delimited content (phone number first, then name)
    const header = "Phone\tName\n";
    const content = contactList
      .map((contact) => {
        const phone = contact.phone ? contact.phone.replace(/\D/g, "") : "";
        const name = contact.name || "Unknown";
        return `${phone}\t${name}`;
      })
      .join("\n");

    const fullContent = header + content;

    // Create and download the file
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skybroadcast_contacts_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setSnackbarMessage(`Exported ${contactList.length} contacts to file`);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Bulk add all search results to contact list
  const addAllToContactList = () => {
    if (results.length === 0) {
      setSnackbarMessage("No search results to add");
      setSnackbarOpen(true);
      return;
    }

    // Filter out businesses that are already in the contact list
    const newContacts = results.filter(
      (business) =>
        business.phone &&
        !contactList.some((contact) => contact.id === business.id)
    );

    if (newContacts.length === 0) {
      setSnackbarMessage("All businesses are already in your contact list");
      setSnackbarOpen(true);
      return;
    }

    setContactList((prev) => [...prev, ...newContacts]);
    setSnackbarMessage(
      `Added ${newContacts.length} new contact${
        newContacts.length === 1 ? "" : "s"
      } to list`
    );
    setSnackbarOpen(true);
  };

  // Function to select random zip codes from cached data
  const selectRandomZipCodes = (zipData) => {
    // Extract zip codes from top 10 states
    const allZipCodes = [];

    TOP_STATES.forEach((state) => {
      if (zipData[state] && zipData[state].cities) {
        Object.values(zipData[state].cities).forEach((zipArray) => {
          if (Array.isArray(zipArray)) {
            zipArray.forEach((zip) => {
              if (
                typeof zip === "number" ||
                (typeof zip === "string" && zip.length === 5)
              ) {
                allZipCodes.push(String(zip).padStart(5, "0"));
              }
            });
          }
        });
      }
    });

    // Remove duplicates and randomly select 10
    const uniqueZipCodes = [...new Set(allZipCodes)];
    const shuffled = uniqueZipCodes.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  };

  // Load and process zip code data
  useEffect(() => {
    const loadZipCodes = async () => {
      try {
        const response = await fetch("/zipcode.json");
        const zipData = await response.json();

        // Cache the data for regeneration
        setZipDataCache(zipData);

        // Select initial random zip codes
        const selected = selectRandomZipCodes(zipData);
        setRandomZipCodes(selected);
      } catch (error) {
        console.error("Error loading zip codes:", error);
      } finally {
        setZipDataLoading(false);
      }
    };

    loadZipCodes();
  }, []);

  // Regenerate zip codes
  const handleRegenerateZipCodes = () => {
    if (!zipDataCache) return;

    setRegenerating(true);
    setSelectedZipChip(null); // Clear any selected chip
    setZipCode(""); // Clear the input field

    // Add a small delay for visual feedback
    setTimeout(() => {
      const newZipCodes = selectRandomZipCodes(zipDataCache);
      setRandomZipCodes(newZipCodes);
      setRegenerating(false);
    }, 500);
  };

  // Handle zip code chip selection
  const handleZipChipClick = (zip) => {
    setSelectedZipChip(zip);
    setZipCode(zip);
  };

  // Clear chip selection when zip code is manually changed
  useEffect(() => {
    if (zipCode !== selectedZipChip) {
      setSelectedZipChip(null);
    }
  }, [zipCode, selectedZipChip]);

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
                {/* Quick Zip Code Selection */}
                {!zipDataLoading && randomZipCodes.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1">
                        Quick Zip Code Selection
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleRegenerateZipCodes}
                        disabled={regenerating}
                        startIcon={
                          regenerating ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Refresh />
                          )
                        }
                        sx={{ minWidth: 120 }}
                      >
                        {regenerating ? "Generating..." : "Regenerate"}
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {randomZipCodes.map((zip) => (
                        <Chip
                          key={zip}
                          label={zip}
                          onClick={() => handleZipChipClick(zip)}
                          color={
                            selectedZipChip === zip ? "primary" : "default"
                          }
                          variant={
                            selectedZipChip === zip ? "filled" : "outlined"
                          }
                          sx={{
                            cursor: "pointer",
                            opacity: regenerating ? 0.6 : 1,
                            transition: "opacity 0.3s ease",
                          }}
                          disabled={regenerating}
                        />
                      ))}
                    </Box>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                )}

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

            {/* Contact List Management - Desktop Only */}
            {isDesktop && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: "background.default" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <ContactPhone />
                    Contact List
                    <Badge
                      badgeContent={contactList.length}
                      color="primary"
                      max={9999}
                    >
                      <Chip
                        label={`${contactList.length} contacts`}
                        size="small"
                      />
                    </Badge>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={clearContactList}
                      disabled={contactList.length === 0}
                      startIcon={<Clear />}
                    >
                      Clear List
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={exportContactList}
                      disabled={contactList.length === 0}
                      startIcon={<Download />}
                    >
                      Export for Skybroadcast
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Add businesses from search results to build your contact list.
                  Export as tab-delimited .txt for Skybroadcast campaigns.
                  {contactList.length > 0 &&
                    ` Ready to export ${contactList.length} contact${
                      contactList.length === 1 ? "" : "s"
                    }.`}
                </Typography>
              </Paper>
            )}

            {/* Search Results */}
            {searched && !loading && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">
                    Search Results{" "}
                    {results.length > 0 && `(${results.length} found)`}
                  </Typography>
                  {isDesktop && results.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={addAllToContactList}
                      startIcon={<Add />}
                      sx={{ ml: 2 }}
                    >
                      Add All to List ({results.filter((r) => r.phone).length})
                    </Button>
                  )}
                </Box>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
