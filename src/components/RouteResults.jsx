import { useState } from "react";

const RouteResults = ({ routes, origin, destination }) => {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id);

  // Function to format duration (minutes to hours and minutes)
  const formatDuration = (minutes) => {
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

  // Icons for different transport types
  const getIconForType = (type) => {
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

  return (
    <div className="route-results">
      <h2 className="results-title">
        {origin?.formatted} to {destination?.formatted}
      </h2>

      {routes.map((route) => (
        <div
          key={route.id}
          className={`route-item ${
            selectedRouteId === route.id ? "selected" : ""
          }`}
          onClick={() => setSelectedRouteId(route.id)}
        >
          <div className="route-header">
            <div className="route-type">
              {getIconForType(route.type)} {route.type}
            </div>
            <div className="route-duration">
              {formatDuration(route.duration)}
            </div>
          </div>

          <div className="route-details">
            <div className="route-distance">{route.distance} km</div>
            <div className="route-price">{route.price}</div>
          </div>

          <div className="route-segments">
            {route.segments.map((segment, index) => (
              <div key={index} className="segment">
                <div className="segment-type">
                  {getIconForType(segment.type)}{" "}
                  {formatDuration(segment.duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RouteResults;
