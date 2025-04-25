import React, { useState, useEffect, useRef } from 'react';

function Header({ searchTerm, onSearchChange, allDoctors }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = allDoctors
      .filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 3); // Get top 3 matches

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);

  }, [searchTerm, allDoctors]);

  // Close suggestions when clicking outside
   useEffect(() => {
     function handleClickOutside(event) {
       if (inputRef.current && !inputRef.current.contains(event.target) &&
           suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
         setShowSuggestions(false);
       }
     }
     document.addEventListener("mousedown", handleClickOutside);
     return () => {
       document.removeEventListener("mousedown", handleClickOutside);
     };
   }, [inputRef, suggestionsRef]);


  const handleInputChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleSuggestionClick = (doctorName) => {
    onSearchChange(doctorName); // Update the search term in App state
    setShowSuggestions(false); // Hide suggestions
    inputRef.current?.blur(); // Optional: remove focus from input
  };

   const handleKeyDown = (event) => {
     if (event.key === 'Enter') {
        setShowSuggestions(false); // Hide suggestions on Enter
        inputRef.current?.blur();
     }
   };

  return (
    <header className="app-header">
      <h1>Doctor Finder</h1>
      <div className="autocomplete-container" ref={inputRef}>
        <input
          type="text"
          placeholder="Search for doctors by name..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(suggestions.length > 0)} // Show suggestions on focus if available
          onKeyDown={handleKeyDown}
          data-testid="autocomplete-input"
          className="autocomplete-input"
        />
        {showSuggestions && (
          <ul className="suggestions-list" ref={suggestionsRef}>
            {suggestions.map((doctor, index) => (
              <li
                key={doctor.id || index} // Use a unique ID if available, otherwise index
                onClick={() => handleSuggestionClick(doctor.name)}
                data-testid="suggestion-item"
                className="suggestion-item"
              >
                {doctor.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}

export default Header; 