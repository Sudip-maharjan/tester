import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import RouteResults from "./components/RouteResults";
import MapView from "./components/MapView";
import routeService from "./services/routeService";
import "./App.css";

function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (originData, destinationData) => {
    setOrigin(originData);
    setDestination(destinationData);
    setLoading(true);
    setError(null);

    try {
      // Use the route service to fetch real routes
      let searchResults = await routeService.fetchRoutes(
        originData,
        destinationData
      );

      // Add extra transport modes like planes for longer distances
      searchResults = routeService.addExtraTransportModes(
        searchResults,
        originData,
        destinationData
      );

      setRoutes(searchResults);
    } catch (err) {
      setError("Failed to fetch routes. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Header />
      <main>
        <SearchForm onSearch={handleSearch} />

        {loading && <div className="loading">Searching for routes...</div>}
        {error && <div className="error">{error}</div>}

        {routes.length > 0 && (
          <div className="results-container">
            <RouteResults
              routes={routes}
              origin={origin}
              destination={destination}
            />
            <MapView
              origin={origin}
              destination={destination}
              selectedRoutes={routes}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
