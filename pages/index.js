import { useState } from "react";
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
} from "@mui/material";
import { Phone, Web, Star, LocationOn } from "@mui/icons-material";

const businessTypes = [
  "Roofing",
  "HVAC",
  "Moving Companies",
  "Construction Labor",
  "Security Services",
  "Home Care",
  "Warehouse Staffing",
  "Delivery Services",
  "Janitorial",
  "Restaurant Staff",
];

export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [service, setService] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

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

  return (
    <>
      <Head>
        <title>Business Finder</title>
        <meta name="description" content="Find local businesses near you" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container
        maxWidth="lg"
        sx={{
          py: 4,
          px: { xs: 1, sm: 2, md: 3 }, // Minimal padding on mobile
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            Business Finder
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find local service providers in your area
          </Typography>
        </Box>

        {/* Search Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSearch}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter your zip code"
                    variant="outlined"
                    inputProps={{ maxLength: 5, pattern: "[0-9]{5}" }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
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
                </Grid>
                <Grid item xs={12} md={4}>
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
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {searched && !loading && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Search Results {results.length > 0 && `(${results.length} found)`}
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
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 300,
                        width: "100%",
                        padding: 2,
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
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {business.rating}{" "}
                              {business.reviews &&
                                `(${business.reviews} reviews)`}
                            </Typography>
                          </Box>
                        )}

                        {business.type && (
                          <Chip
                            label={business.type}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          paragraph
                        >
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
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
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
                                href={`tel:${business.phone}`}
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
