import { useEffect, useRef, useState } from "react";

const MapView = ({ origin, destination, selectedRoutes }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routeLines, setRouteLines] = useState([]);

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  useEffect(() => {
    // Initialize map when component mounts
    if (!map && mapRef.current) {
      // Check if Leaflet is already loaded
      if (window.L) {
        initializeMap();
        return;
      }

      // Create a script element for the Geoapify Maps API
      const script = document.createElement("script");
      script.src = `https://cdn.jsdelivr.net/npm/@geoapify/leaflet-address-search-plugin@^1/dist/L.Control.GeoapifyAddressSearch.min.js`;
      script.async = true;
      document.head.appendChild(script);

      // Create a link element for the Leaflet CSS
      const leafletCSS = document.createElement("link");
      leafletCSS.rel = "stylesheet";
      leafletCSS.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/leaflet.css";
      document.head.appendChild(leafletCSS);

      // Create a script element for the Leaflet JS
      const leafletScript = document.createElement("script");
      leafletScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/leaflet.js";
      leafletScript.async = true;

      leafletScript.onload = () => {
        // Initialize map after Leaflet is loaded
        initializeMap();
      };

      document.head.appendChild(leafletScript);
    }

    // Clean up
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Function to initialize the map
  const initializeMap = () => {
    if (mapRef.current && !map) {
      const newMap = L.map(mapRef.current).setView([51.505, -0.09], 13);

      L.tileLayer(
        "https://maps.geoapify.com/v1/tile/{style}/{z}/{x}/{y}.png?apiKey={apiKey}",
        {
          attribution:
            'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>',
          apiKey: apiKey,
          style: "osm-bright",
          maxZoom: 20,
        }
      ).addTo(newMap);

      setMap(newMap);
    }
  };

  useEffect(() => {
    // Add markers and route lines when origin, destination, or selected routes change
    if (map && origin && destination) {
      try {
        // Clear previous markers and routes
        markers.forEach((marker) => marker.remove());
        routeLines.forEach((line) => line.remove());

        const newMarkers = [];
        const newRouteLines = [];

        // Check if coordinates are valid
        const originLat = parseFloat(origin.lat);
        const originLon = parseFloat(origin.lon);
        const destLat = parseFloat(destination.lat);
        const destLon = parseFloat(destination.lon);

        if (
          isNaN(originLat) ||
          isNaN(originLon) ||
          isNaN(destLat) ||
          isNaN(destLon)
        ) {
          console.error("Invalid coordinates:", origin, destination);
          return;
        }

        // Add origin marker
        const originMarker = L.marker([originLat, originLon])
          .addTo(map)
          .bindPopup(`<strong>Origin:</strong> ${origin.formatted}`);

        // Add destination marker
        const destMarker = L.marker([destLat, destLon])
          .addTo(map)
          .bindPopup(`<strong>Destination:</strong> ${destination.formatted}`);

        newMarkers.push(originMarker, destMarker);

        // Fit map to show both markers
        const bounds = L.latLngBounds([
          [originLat, originLon],
          [destLat, destLon],
        ]);

        // Ensure bounds are valid (not a point)
        if (
          bounds.isValid() &&
          bounds.getNorthEast().distanceTo(bounds.getSouthWest()) > 0
        ) {
          map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          // If bounds are too small or invalid, just center on the origin with some zoom
          map.setView([originLat, originLon], 12);
        }

        // Add route lines for each selected route
        if (selectedRoutes && selectedRoutes.length > 0) {
          // We'll display route lines by requesting routing data from Geoapify API
          // For now, we'll just show a straight line for demonstration
          selectedRoutes.forEach((route) => {
            fetchAndDisplayRoute(
              origin,
              destination,
              route.type,
              map,
              newRouteLines
            );
          });
        }

        setMarkers(newMarkers);
        setRouteLines(newRouteLines);
      } catch (error) {
        console.error("Error updating map:", error);
      }
    }
  }, [map, origin, destination, selectedRoutes]);

  // Function to fetch and display route between two points
  const fetchAndDisplayRoute = async (
    from,
    to,
    mode,
    mapInstance,
    linesArray
  ) => {
    try {
      // Validate coordinates
      const fromLat = parseFloat(from.lat);
      const fromLon = parseFloat(from.lon);
      const toLat = parseFloat(to.lat);
      const toLon = parseFloat(to.lon);

      if (isNaN(fromLat) || isNaN(fromLon) || isNaN(toLat) || isNaN(toLon)) {
        console.error("Invalid coordinates for route:", from, to);
        return;
      }

      // Convert transportation mode to Geoapify format
      const transportType = mapTransportMode(mode);

      // Build URL for Geoapify Routing API
      const url = `https://api.geoapify.com/v1/routing?waypoints=${fromLat},${fromLon}|${toLat},${toLon}&mode=${transportType}&apiKey=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Create a polyline from the route geometry
        const routeCoordinates = [];

        // Extract coordinates from GeoJSON
        const geometry = data.features[0].geometry;
        if (geometry.type === "LineString") {
          geometry.coordinates.forEach((coord) => {
            // Note: GeoJSON uses [longitude, latitude] format
            routeCoordinates.push([coord[1], coord[0]]);
          });
        }

        // Define colors for different transport modes
        const colors = {
          train: "#0077cc",
          bus: "#5cb85c",
          car: "#f0ad4e",
          plane: "#d9534f",
          walk: "#5bc0de",
          bike: "#28a745",
          ferry: "#17a2b8",
        };

        // Create a polyline with the route coordinates
        const polyline = L.polyline(routeCoordinates, {
          color: colors[mode] || "#777",
          weight: 5,
          opacity: 0.7,
        }).addTo(mapInstance);

        linesArray.push(polyline);
      } else {
        // If no route data, just draw a straight line
        const line = L.polyline(
          [
            [fromLat, fromLon],
            [toLat, toLon],
          ],
          {
            color: "#777",
            weight: 3,
            opacity: 0.5,
            dashArray: "5, 10",
          }
        ).addTo(mapInstance);

        linesArray.push(line);
      }
    } catch (error) {
      console.error("Error fetching route:", error);

      // Try to extract valid coordinates
      let fromLat = parseFloat(from.lat);
      let fromLon = parseFloat(from.lon);
      let toLat = parseFloat(to.lat);
      let toLon = parseFloat(to.lon);

      // Use fallback coordinates if needed
      if (isNaN(fromLat) || isNaN(fromLon)) {
        console.warn("Using fallback origin coordinates");
        fromLat = 51.5;
        fromLon = -0.09;
      }

      if (isNaN(toLat) || isNaN(toLon)) {
        console.warn("Using fallback destination coordinates");
        toLat = 51.51;
        toLon = -0.08;
      }

      // Fallback to straight line if API call fails
      const line = L.polyline(
        [
          [fromLat, fromLon],
          [toLat, toLon],
        ],
        {
          color: "#777",
          weight: 3,
          opacity: 0.5,
          dashArray: "5, 10",
        }
      ).addTo(mapInstance);

      linesArray.push(line);
    }
  };

  // Map Rome2Rio transport modes to Geoapify modes
  const mapTransportMode = (mode) => {
    const modeMap = {
      car: "drive",
      bus: "drive", // Approximation
      train: "transit",
      plane: "drive", // Not directly supported
      walk: "walk",
      bike: "bicycle",
      ferry: "transit", // Approximation
    };

    return modeMap[mode.toLowerCase()] || "drive";
  };

  return (
    <div className="map-container">
      <div ref={mapRef} className="map"></div>
    </div>
  );
};

export default MapView;
