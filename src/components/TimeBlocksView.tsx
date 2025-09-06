import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, addDays, isSameDay, isToday, getHours, getMinutes } from 'date-fns';
import { Settings, Plus, Check, Star, Home, Coffee, Book, Briefcase, Activity } from 'lucide-react';

interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string;
  completed: boolean;
  category: string;
}

const HOUR_HEIGHT = 70;
const TIME_LABEL_WIDTH = 50;
const COLOR_BAR_WIDTH = 24;
const COLOR_BAR_LEFT = 60;

// Mock data matching your design
const mockTimeBlocks: TimeBlock[] = [
  {
    id: '1',
    title: 'Morning workout',
    startTime: new Date(2025, 0, 6, 7, 45),
    endTime: new Date(2025, 0, 6, 8, 15),
    color: 'hsl(var(--calendar-workout))',
    completed: true,
    category: 'fitness'
  },
  {
    id: '2',
    title: 'Shower',
    startTime: new Date(2025, 0, 6, 8, 15),
    endTime: new Date(2025, 0, 6, 8, 30),
    color: 'hsl(var(--calendar-water))',
    completed: false,
    category: 'personal'
  },
  {
    id: '3',
    title: 'Breakfast',
    startTime: new Date(2025, 0, 6, 8, 30),
    endTime: new Date(2025, 0, 6, 9, 0),
    color: 'hsl(var(--calendar-food))',
    completed: false,
    category: 'food'
  },
  {
    id: '4',
    title: 'Project planning',
    startTime: new Date(2025, 0, 6, 10, 0),
    endTime: new Date(2025, 0, 6, 11, 0),
    color: 'hsl(var(--calendar-work))',
    completed: false,
    category: 'work'
  },
  {
    id: '5',
    title: 'Standup meeting',
    startTime: new Date(2025, 0, 6, 10, 0),
    endTime: new Date(2025, 0, 6, 10, 15),
    color: 'hsl(var(--calendar-meeting))',
    completed: false,
    category: 'meeting'
  }
];

const getIconForCategory = (category: string) => {
  const iconMap = {
    fitness: Activity,
    personal: Home,
    food: Coffee,
    work: Briefcase,
    meeting: Star,
  };
  return iconMap[category as keyof typeof iconMap] || Star;
};

const hourSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 7; // 7 AM to 7 PM
  return {
    hour,
    label: hour > 12 ? hour - 12 : hour,
    ampm: hour >= 12 ? 'PM' : 'AM'
  };
});

export default function TimeBlocksView() {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 0, 6)); // Jan 6, 2025
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = addDays(selectedDate, i);
      days.push({
        date,
        dayName: format(date, 'EEE').toUpperCase(),
        dayNumber: format(date, 'd'),
        isSelected: i === 0,
        isToday: isSameDay(date, new Date()),
      });
    }
    return days;
  }, [selectedDate]);

// Position time blocks with overlap detection
const positionedTimeBlocks = useMemo(() => {
  const blocks = mockTimeBlocks.map((block) => {
    const startHour = getHours(block.startTime) + getMinutes(block.startTime) / 60;
    const endHour = getHours(block.endTime) + getMinutes(block.endTime) / 60;
    
    const topPosition = (startHour - 7) * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 50);
    
    return {
      ...block,
      topPosition,
      height,
      startHour,
      endHour,
      formattedTime: `${format(block.startTime, 'HH:mm')} – ${format(block.endTime, 'HH:mm')}`,
      duration: Math.round((block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60)),
      column: 0 // Will be calculated below
    };
  });

  // Sort by start time
  blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Calculate columns for overlapping blocks
  const columns: Array<{ endTime: number; blocks: typeof blocks }> = [];
  
  blocks.forEach(block => {
    // Find the first column where this block can fit
    let columnIndex = 0;
    for (let i = 0; i < columns.length; i++) {
      if (block.startHour >= columns[i].endTime) {
        columnIndex = i;
        break;
      }
      columnIndex = i + 1;
    }
    
    // Ensure column exists
    while (columns.length <= columnIndex) {
      columns.push({ endTime: 0, blocks: [] });
    }
    
    // Add block to column
    block.column = columnIndex;
    columns[columnIndex].endTime = Math.max(columns[columnIndex].endTime, block.endHour);
    columns[columnIndex].blocks.push(block);
  });

  return blocks;
}, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
  };

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const currentHour = getHours(now) + getMinutes(now) / 60;
    return (currentHour - 7) * HOUR_HEIGHT;
  }, [currentTime]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b">
        <h1 className="text-2xl font-bold">{format(selectedDate, 'MMMM yyyy')}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Week Days */}
      <div className="flex gap-1 px-2 py-3 border-b bg-background overflow-x-auto">
        {weekDays.map((day, index) => (
          <Button
            key={index}
            variant={day.isSelected ? "default" : "ghost"}
            className={`min-w-[60px] h-16 flex-col gap-1 ${
              day.isSelected ? 'bg-primary text-primary-foreground rounded-full' : ''
            }`}
            onClick={() => setSelectedDate(day.date)}
          >
            <span className="text-xs">{day.dayName}</span>
            <span className="text-lg font-bold">{day.dayNumber}</span>
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Time Labels */}
          <div className="w-[50px] flex-shrink-0">
            {hourSlots.map((slot, index) => (
              <div key={index} className="h-[70px] flex flex-col items-end pr-2 pt-2">
                <span className="text-sm font-medium text-muted-foreground">{slot.label}</span>
                <span className="text-xs text-muted-foreground">{slot.ampm}</span>
              </div>
            ))}
          </div>

          {/* Timeline Area */}
          <div className="flex-1 relative" style={{ height: hourSlots.length * HOUR_HEIGHT }}>
            {/* Background timeline */}
            <div 
              className="absolute rounded-lg bg-timeline-bg"
              style={{
                width: COLOR_BAR_WIDTH,
                left: 10,
                top: 0,
                bottom: 0
              }}
            />

            {/* Hour Grid Lines */}
            {hourSlots.map((_, index) => (
              <div
                key={`grid-${index}`}
                className="absolute left-0 right-0 h-px bg-border"
                style={{ top: index * HOUR_HEIGHT }}
              />
            ))}

            {/* Current Time Indicator */}
            {isToday(selectedDate) && currentTimePosition > 0 && currentTimePosition < hourSlots.length * HOUR_HEIGHT && (
              <div
                className="absolute left-0 right-0 flex items-center z-10"
                style={{ top: currentTimePosition }}
              >
                <div className="w-3 h-3 bg-timeline-current rounded-full mr-2" />
                <div className="flex-1 h-0.5 bg-timeline-current" />
              </div>
            )}

            {/* Free Time Slots */}
            <div
              className="absolute bg-timeline-free rounded-lg p-2 text-xs text-muted-foreground"
              style={{
                top: 3 * HOUR_HEIGHT,
                height: HOUR_HEIGHT,
                left: COLOR_BAR_LEFT + COLOR_BAR_WIDTH + 20,
                right: 20
              }}
            >
              <div>Free time: 1 hr</div>
              <button className="text-blue-500 mt-1">Create event</button>
            </div>

            {/* Time Blocks */}
            {positionedTimeBlocks.map((block) => {
              const IconComponent = getIconForCategory(block.category);
              const columnWidth = 200; // Width for each column
              const textBlockLeft = COLOR_BAR_LEFT + COLOR_BAR_WIDTH + 20 + (block.column * columnWidth);
              
              return (
                <div key={block.id} className="absolute" style={{ top: block.topPosition }}>
                  {/* Color Block - always on the timeline */}
                  <div
                    className="absolute rounded-lg flex items-start justify-center pt-2 z-20"
                    style={{
                      width: COLOR_BAR_WIDTH,
                      height: block.height,
                      left: 10,
                      backgroundColor: block.color
                    }}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>

                  {/* Text Block - positioned in columns to avoid overlap */}
                  <Card
                    className="absolute p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    style={{
                      left: textBlockLeft,
                      width: columnWidth - 10,
                      height: block.height
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-6">
                        <h3 
                          className={`font-medium mb-1 text-sm ${
                            block.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {block.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {block.formattedTime} ({formatDuration(block.duration)})
                        </p>
                      </div>
                      
                      {/* Checkbox */}
                      <button
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          block.completed 
                            ? 'border-transparent' 
                            : 'border-current'
                        }`}
                        style={{
                          backgroundColor: block.completed ? block.color : 'transparent',
                          borderColor: block.completed ? 'transparent' : block.color
                        }}
                      >
                        {block.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAB */}
      <Button
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}