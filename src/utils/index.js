/**
 * Format duration in minutes to a human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

/**
 * Format distance in kilometers
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  return `${distance.toFixed(1)} km`;
};

/**
 * Get emoji icon for transport type
 * @param {string} type - Transport type
 * @returns {string} Emoji icon
 */
export const getTransportIcon = (type) => {
  switch (type.toLowerCase()) {
    case "train":
      return "🚆";
    case "bus":
      return "🚌";
    case "car":
      return "🚗";
    case "plane":
      return "✈️";
    case "ferry":
      return "⛴️";
    case "walk":
      return "🚶";
    case "bike":
      return "🚲";
    default:
      return "🚩";
  }
};

/**
 * Get color for transport type
 * @param {string} type - Transport type
 * @returns {string} Color hex code
 */
export const getTransportColor = (type) => {
  switch (type.toLowerCase()) {
    case "train":
      return "#0077cc";
    case "bus":
      return "#5cb85c";
    case "car":
      return "#f0ad4e";
    case "plane":
      return "#d9534f";
    case "ferry":
      return "#17a2b8";
    case "walk":
      return "#5bc0de";
    case "bike":
      return "#28a745";
    default:
      return "#777777";
  }
};

/**
 * Calculate direct distance between two points using Haversine formula
 * @param {number} lat1 - Origin latitude
 * @param {number} lon1 - Origin longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default {
  formatDuration,
  formatDistance,
  getTransportIcon,
  getTransportColor,
  calculateDistance,
};
