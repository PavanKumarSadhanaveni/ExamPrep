
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Slide {
  src: string;
  alt: string;
  dataAiHint: string;
}

interface ImageSlideshowProps {
  slides: Slide[];
  autoplay?: boolean;
  autoplayInterval?: number;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({
  slides,
  autoplay = true,
  autoplayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    if (!autoplay) return;

    const intervalId = setInterval(() => {
      goToNext();
    }, autoplayInterval);

    return () => clearInterval(intervalId);
  }, [autoplay, currentIndex, autoplayInterval, slides.length]);


  if (!slides || slides.length === 0) {
    return <p className="text-center text-muted-foreground">No slides to display.</p>;
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-[16/9] overflow-hidden rounded-lg shadow-xl group">
      <div
        className="flex transition-transform ease-out duration-500 h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            <Image
              src={slide.src}
              alt={slide.alt}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              data-ai-hint={slide.dataAiHint}
              priority={index === 0} // Prioritize loading the first image
            />
          </div>
        ))}
      </div>

      {/* Left Arrow */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* Right Arrow */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, slideIndex) => (
          <button
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            aria-label={`Go to slide ${slideIndex + 1}`}
            className={cn(
              'w-3 h-3 rounded-full transition-colors duration-300',
              currentIndex === slideIndex ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlideshow;
