
"use client";

import { useState, useEffect } from 'react';
import type React from 'react';

const CurrentYear: React.FC = () => {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (year === null) {
    // Return a placeholder or null during server render / initial client render before useEffect runs.
    // Using a span with a non-breaking space to maintain some space, or you can return null.
    return <span>&nbsp;</span>; 
  }

  return <>{year}</>;
};

export default CurrentYear;
