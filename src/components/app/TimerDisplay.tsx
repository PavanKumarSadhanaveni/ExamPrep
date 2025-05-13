"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useExamContext } from '@/hooks/useExamContext';
import { Clock } from 'lucide-react';

const TimerDisplay: React.FC = () => {
  const { examData } = useExamContext();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!examData.startTime || examData.endTime) {
      if (examData.startTime && examData.endTime) {
        setElapsedTime(Math.floor((examData.endTime - examData.startTime) / 1000));
      }
      return;
    }

    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - (examData.startTime || Date.now())) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [examData.startTime, examData.endTime]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const durationInSeconds = () => {
    if (!examData.examInfo?.duration) return null;
    const durationStr = examData.examInfo.duration;
    let totalSeconds = 0;
    const hoursMatch = durationStr.match(/(\d+)\s*hour/i);
    const minutesMatch = durationStr.match(/(\d+)\s*min/i);

    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
    
    return totalSeconds > 0 ? totalSeconds : null;
  }

  const totalDurationSeconds = durationInSeconds();

  return (
    <div className="flex items-center gap-2 text-sm font-medium tabular-nums">
      <Clock className="h-5 w-5 text-primary" />
      <span>{formatTime(elapsedTime)}</span>
      {totalDurationSeconds && (
        <span className="text-muted-foreground">/ {formatTime(totalDurationSeconds)}</span>
      )}
    </div>
  );
};

export default TimerDisplay;
