"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useExamContext } from '@/hooks/useExamContext';
import { Clock } from 'lucide-react';

const TimerDisplay: React.FC = () => {
  const { examData } = useExamContext();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Initialize elapsed time if exam was already in progress and paused from a previous session (though isPaused is reset on load)
    // Or if exam is finished.
    if (examData.startTime) {
        if (examData.endTime) {
             setElapsedTime(Math.floor((examData.endTime - examData.startTime) / 1000));
        } else if (!examData.isPaused) {
            // If exam started, not ended, not paused, calculate current elapsed time
            setElapsedTime(Math.floor((Date.now() - examData.startTime) / 1000));
        }
        // If paused and not ended, elapsedTime will hold its last value before pause.
    } else {
        setElapsedTime(0); // Not started
    }


    if (!examData.startTime || examData.endTime || examData.isPaused) {
      // Timer should not run if exam hasn't started, has ended, or is paused.
      // If it ended, the final time is set above.
      // If paused, the interval won't start/will be cleared, preserving current elapsedTime.
      return;
    }

    // Exam is active and not paused, timer should run.
    const timerInterval = setInterval(() => {
      // Ensure startTime is treated as a number for calculation
      setElapsedTime(Math.floor((Date.now() - (examData.startTime as number)) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [examData.startTime, examData.endTime, examData.isPaused]);

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
    
    // If no specific unit found, try to parse as total minutes
    if (totalSeconds === 0 && /^\d+$/.test(durationStr.trim())) {
        totalSeconds = parseInt(durationStr.trim()) * 60;
    }

    return totalSeconds > 0 ? totalSeconds : null;
  }

  const totalDurationSeconds = durationInSeconds();

  return (
    <div className="flex items-center gap-2 text-sm font-medium tabular-nums">
      <Clock className="h-5 w-5 text-primary" />
      <span>{formatTime(elapsedTime)}</span>
      {totalDurationSeconds !== null && (
        <span className="text-muted-foreground">/ {formatTime(totalDurationSeconds)}</span>
      )}
    </div>
  );
};

export default TimerDisplay;
