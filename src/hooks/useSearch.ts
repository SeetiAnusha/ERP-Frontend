import { useState, useCallback } from 'react';

// Simple search state management (no Redux needed)
const searchStates: Record<string, string> = {};

export function useSearch(key: string = 'default') {
  const [searchTerm, setSearchTermState] = useState(searchStates[key] || '');

  const setSearchTerm = useCallback((term: string) => {
    searchStates[key] = term; // Persist across component unmounts
    setSearchTermState(term);
  }, [key]);

  const clearSearch = useCallback(() => {
    searchStates[key] = '';
    setSearchTermState('');
  }, [key]);

  return {
    searchTerm,
    setSearchTerm,
    clearSearch
  };
}