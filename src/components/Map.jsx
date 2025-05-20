import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function Map({ routeGeoJson }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maps.geoapify.com/v1/styles/positron/style.json?apiKey=2712ff601bc54f7080e4b585a282ca52`,
      center: [85.324, 27.7172], // Kathmandu by default
      zoom: 6,
    });
  }, []);

  useEffect(() => {
    if (!map.current || !routeGeoJson) return;

    // Remove existing route layer if exists
    if (map.current.getSource("route")) {
      map.current.removeLayer("route-line");
      map.current.removeSource("route");
    }

    map.current.addSource("route", {
      type: "geojson",
      data: routeGeoJson,
    });

    map.current.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#0074D9",
        "line-width": 5,
      },
    });

    // Fit map to route bounds
    const coordinates = routeGeoJson.geometry.coordinates;
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.current.fitBounds(bounds, { padding: 40 });
  }, [routeGeoJson]);

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
}

export default Map;
