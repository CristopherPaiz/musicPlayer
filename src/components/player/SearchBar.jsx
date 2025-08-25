import { useState } from "react";
import PropTypes from "prop-types";

const SearchIcon = () => (
  <svg className="size-5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SearchBar = ({ searchTerm, setSearchTerm, searchHistory, onHistorySelect }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    setSearchTerm("");
  };

  const showHistory = isFocused && searchTerm === "" && searchHistory.length > 0;

  return (
    <div className="relative w-full max-w-md mx-auto mb-4">
      <div className="relative">
        <SearchIcon />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay to allow click on history
          placeholder="Buscar en la playlist..."
          className="w-full bg-white/10 text-white placeholder-white/60 rounded-full py-2 pl-10 pr-10 border border-transparent focus:border-white/30 focus:outline-none transition-colors"
        />
        {searchTerm && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
            <CloseIcon />
          </button>
        )}
      </div>

      {showHistory && (
        <ul className="absolute top-full mt-2 w-full bg-neutral-800 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {searchHistory.map((item, index) => (
            <li key={index} onClick={() => onHistorySelect(item)} className="px-4 py-2 text-white/80 hover:bg-white/10 cursor-pointer">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  searchHistory: PropTypes.array.isRequired,
  onHistorySelect: PropTypes.func.isRequired,
};

export default SearchBar;
