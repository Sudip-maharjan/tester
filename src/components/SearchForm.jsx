import { useState, useEffect } from "react";
import {
  GeoapifyGeocoderAutocomplete,
  GeoapifyContext,
} from "@geoapify/react-geocoder-autocomplete";
import "@geoapify/geocoder-autocomplete/styles/minimal.css";

const SearchForm = ({ onSearch }) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  useEffect(() => {
    // Enable search button only when both origin and destination are selected
    setIsValid(origin && destination);
  }, [origin, destination]);

  const handleOriginSelect = (result) => {
    if (result) {
      setOrigin(result.properties);
    } else {
      setOrigin(null);
    }
  };

  const handleDestinationSelect = (result) => {
    if (result) {
      setDestination(result.properties);
    } else {
      setDestination(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onSearch(origin, destination);
    }
  };

  return (
    <div className="search-form">
      <form onSubmit={handleSubmit}>
        <div className="search-inputs">
          <div className="form-group location-input">
            <label htmlFor="origin">From</label>
            <GeoapifyContext apiKey={apiKey}>
              <GeoapifyGeocoderAutocomplete
                placeholder="Enter origin"
                placeSelect={handleOriginSelect}
              />
            </GeoapifyContext>
          </div>

          <div className="form-group location-input">
            <label htmlFor="destination">To</label>
            <GeoapifyContext apiKey={apiKey}>
              <GeoapifyGeocoderAutocomplete
                placeholder="Enter destination"
                placeSelect={handleDestinationSelect}
              />
            </GeoapifyContext>
          </div>
        </div>

        <button type="submit" className="search-button" disabled={!isValid}>
          Find Routes
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
