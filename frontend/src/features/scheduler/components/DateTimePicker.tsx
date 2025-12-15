import { useState, useRef, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  selectedDate: string;
  selectedTime: string;
}

export default function DateTimePicker({ onDateChange, onTimeChange, selectedDate, selectedTime }: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get today's date as minimum date
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const handleDateSelect = (date: string) => {
    onDateChange(date);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
    setShowTimePicker(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative" ref={datePickerRef}>
        <Label htmlFor="date-input" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date
        </Label>
        <div className="relative mt-2">
          <Input
            id="date-input"
            type="text"
            value={selectedDate ? new Date(selectedDate).toLocaleDateString() : ""}
            onClick={() => setShowDatePicker(!showDatePicker)}
            readOnly
            className="glass w-full pl-10 pr-4 py-2 cursor-pointer"
            placeholder="Select date"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-background border rounded-lg shadow-lg p-4 z-50 w-64">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              min={getMinDate()}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>

      <div className="relative" ref={timePickerRef}>
        <Label htmlFor="time-input" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time
        </Label>
        <div className="relative mt-2">
          <Input
            id="time-input"
            type="text"
            value={selectedTime || ""}
            onClick={() => setShowTimePicker(!showTimePicker)}
            readOnly
            className="glass w-full pl-10 pr-4 py-2 cursor-pointer"
            placeholder="Select time"
          />
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {showTimePicker && (
          <div className="absolute top-full left-0 mt-2 bg-background border rounded-lg shadow-lg p-2 z-50 w-32 max-h-40 overflow-y-auto">
            {generateTimeOptions().map((time) => (
              <div
                key={time}
                className={`p-2 cursor-pointer hover:bg-muted ${
                  selectedTime === time ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}