import React, { useCallback, useEffect, useState } from "react";
import { ComboBox } from "@carbon/react";
import { useIntl } from "react-intl";
import { getFromOpenElisServer } from "../../utils/Utils";

/**
 * Autocomplete/type-ahead mode for storage location selection
 * Uses Carbon ComboBox for searchable selection
 */
const AutocompleteMode = ({ onLocationChange }) => {
  const intl = useIntl();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Normalize Carbon ComboBox onInputChange events to a plain string value
  const handleSearch = (event) => {
    const inputValue =
      event?.inputValue !== undefined
        ? event.inputValue
        : event?.target?.value || "";
    setSearchTerm(inputValue);
  };

  // Perform search against storage locations API
  const performSearch = useCallback(
    (term) => {
      if (!term || term.trim().length < 2) {
        // Require at least 2 characters before searching
        setSearchResults([]);
        setErrorMessage(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      getFromOpenElisServer(
        `/rest/storage/locations/search?q=${encodeURIComponent(term)}`,
        (results) => {
          // results will be undefined on network/error conditions
          if (results === undefined) {
            setSearchResults([]);
            setErrorMessage(
              intl.formatMessage({
                id: "storage.location.search.error",
                defaultMessage: "Error loading locations",
              }),
            );
            setIsLoading(false);
            return;
          }

          const resultsArray = Array.isArray(results) ? results : [];
          setSearchResults(resultsArray);
          setIsLoading(false);
        },
      );
    },
    [intl],
  );

  // Debounce search calls when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  return (
    <div className="autocomplete-container">
      <ComboBox
        id="location-search"
        titleText={intl.formatMessage({ id: "storage.location.label" })}
        placeholder="Search for location..."
        items={searchResults}
        itemToString={(item) => (item ? item.hierarchicalPath : "")}
        onChange={({ selectedItem }) =>
          onLocationChange && onLocationChange(selectedItem)
        }
        onInputChange={handleSearch}
        loading={isLoading}
        shouldFilterItem={() => false} // API already filters results
        invalid={!!errorMessage}
        invalidText={errorMessage || undefined}
      />
    </div>
  );
};

export default AutocompleteMode;
