"use client";

import { useContext } from 'react';
import { ExamContext } from '@/contexts/ExamContext';

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExamContext must be used within an ExamProvider');
  }
  return context;
};
