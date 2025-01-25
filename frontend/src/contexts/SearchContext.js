import React, { createContext, useState, useContext } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSession] = useState(JSON.parse(localStorage.getItem('cartSessions') ?? '[1]'));
  const [activeSession, setActiveSession] = useState(sessions[sessions.length-1]);
  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, sessions, setSession, activeSession, setActiveSession }}>
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook for using the context
export const useSearch = () => useContext(SearchContext);