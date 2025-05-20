import axios from "axios";

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

/**
 * Fetch routing information between two points for multiple transport modes
 * @param {Object} origin - Origin location object from Geoapify
 * @param {Object} destination - Destination location object from Geoapify
 * @returns {Promise<Array>} Array of route options
 */
export const fetchRoutes = async (origin, destination) => {
  try {
    // Create an array of promises for different transportation modes
    const modes = ["drive", "transit", "walk", "bicycle"];
    const routePromises = modes.map((mode) =>
      fetchRouteForMode(origin, destination, mode)
    );

    // Wait for all requests to complete
    const results = await Promise.allSettled(routePromises);

    // Process successful results
    const routes = results
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value);

    return routes;
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw error;
  }
};

/**
 * Fetch routing information for a specific transport mode
 * @param {Object} origin - Origin location
 * @param {Object} destination - Destination location
 * @param {string} mode - Transportation mode
 * @returns {Promise<Object|null>} Route information object or null
 */
const fetchRouteForMode = async (origin, destination, mode) => {
  try {
    const url = `https://api.geoapify.com/v1/routing`;

    const params = {
      waypoints: `${origin.lat},${origin.lon}|${destination.lat},${destination.lon}`,
      mode: mode,
      apiKey: API_KEY.trim(), // Ensure the API key doesn't have extra characters
    };

    const response = await axios.get(url, { params });

    if (!response.data.features || response.data.features.length === 0) {
      return null;
    }

    // Extract route data from response
    const routeData = response.data.features[0];
    const properties = routeData.properties;

    // Get nice display name for the mode
    const displayMode = getDisplayMode(mode);

    // Process route segments
    const segments = properties.legs.map((leg) => ({
      type: displayMode,
      from: leg.from || origin.formatted,
      to: leg.to || destination.formatted,
      duration: Math.round(leg.time / 60), // Convert seconds to minutes
      distance: Math.round((leg.distance / 1000) * 10) / 10, // Convert meters to km with 1 decimal
    }));

    // Get total values
    const totalDuration = Math.round(properties.time / 60); // Convert seconds to minutes
    const totalDistance = Math.round((properties.distance / 1000) * 10) / 10; // Convert meters to km with 1 decimal

    // Estimate price based on mode and distance (very rough estimates)
    const price = estimatePrice(mode, totalDistance);

    return {
      id: `${mode}-${Date.now()}`,
      type: displayMode,
      duration: totalDuration,
      distance: totalDistance,
      price,
      segments,
    };
  } catch (error) {
    console.error(`Error fetching ${mode} route:`, error);
    return null;
  }
};

/**
 * Convert API mode to display name
 * @param {string} mode - API transportation mode
 * @returns {string} Display name
 */
const getDisplayMode = (mode) => {
  switch (mode) {
    case "drive":
      return "car";
    case "transit":
      return "train";
    case "walk":
      return "walk";
    case "bicycle":
      return "bike";
    default:
      return mode;
  }
};

/**
 * Estimate price range based on mode and distance
 * @param {string} mode - Transportation mode
 * @param {number} distance - Distance in km
 * @returns {string} Price range estimate
 */
const estimatePrice = (mode, distance) => {
  switch (mode) {
    case "drive":
      // Estimate based on fuel cost
      const minCarPrice = Math.round(distance * 0.15);
      const maxCarPrice = Math.round(distance * 0.3);
      return `€${minCarPrice}-${maxCarPrice}`;

    case "transit":
      // Rough estimate for train tickets
      const minTrainPrice = Math.round(distance * 0.15);
      const maxTrainPrice = Math.round(distance * 0.4);
      return `€${minTrainPrice}-${maxTrainPrice}`;

    case "walk":
      // Walking is free
      return "Free";

    case "bicycle":
      // Biking is free or minor rental cost
      if (distance > 20) {
        return `€${Math.round(distance * 0.05)}-${Math.round(distance * 0.1)}`;
      }
      return "Free-€5";

    default:
      // Default calculation
      const minPrice = Math.round(distance * 0.1);
      const maxPrice = Math.round(distance * 0.25);
      return `€${minPrice}-${maxPrice}`;
  }
};

/**
 * Add transportation mode that isn't directly supported by the Geoapify API
 * like planes for longer distances
 * @param {Array} routes - Existing routes
 * @param {Object} origin - Origin location
 * @param {Object} destination - Destination location
 * @returns {Array} Updated routes array
 */
export const addExtraTransportModes = (routes, origin, destination) => {
  const updatedRoutes = [...routes];

  // Calculate direct distance between points
  const distance = calculateDistance(
    origin.lat,
    origin.lon,
    destination.lat,
    destination.lon
  );

  // If distance is over 300km, add air travel option
  if (distance > 300) {
    const flightDuration = 30 + Math.round((distance / 800) * 60); // Base 30min + flight time

    updatedRoutes.push({
      id: `plane-${Date.now()}`,
      type: "plane",
      duration: flightDuration,
      distance: distance,
      price: `€${Math.round(50 + distance * 0.1)}-${Math.round(
        100 + distance * 0.25
      )}`,
      segments: [
        {
          type: "plane",
          from: origin.formatted,
          to: destination.formatted,
          duration: flightDuration,
          distance: distance,
        },
      ],
    });
  }

  // If near water (would need proper check), could add ferry options

  return updatedRoutes;
};

/**
 * Calculate direct distance between two points using Haversine formula
 * @param {number} lat1 - Origin latitude
 * @param {number} lon1 - Origin longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default { fetchRoutes, addExtraTransportModes };
