import React, { createContext, useState, useContext } from "react";
import { useGetPosProductsQuery } from "../features/centerSlice";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const {refetch} = useGetPosProductsQuery()
  const [sessions, setSession] = useState(JSON.parse(localStorage.getItem('cartSessions') ?? '[1]'));
  const [activeSession, setActiveSession] = useState(sessions[sessions.length-1]);
  const [displayImage, setImageDisplay] = useState(JSON.parse(localStorage.getItem('img_disp')??'true'))
  const handleImageDisplay = display => {
    localStorage.setItem('img_disp', display );
    refetch()
    setImageDisplay(display);
  }
  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, sessions, setSession, activeSession, setActiveSession, displayImage, handleImageDisplay }}>
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook for using the context
export const useSearch = () => useContext(SearchContext);