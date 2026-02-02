"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Filter, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TokenBreakdown } from "@/hooks/use-token-metrics";

type FilterOption = {
  value: string;
  label: string;
};

type DateRange = {
  from: Date | null;
  to: Date | null;
};

export type ActiveFilters = {
  project: string | null;
  model: string | null;
  agent: string | null;
  dateRange: DateRange | null;
};

type FilterBarProps = {
  projects: TokenBreakdown[] | null;
  models: TokenBreakdown[] | null;
  agents: TokenBreakdown[] | null;
  filters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  isLoading?: boolean;
};

function SimpleSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  isLoading,
}: {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-10 items-center gap-2 border-2 border-border bg-background px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:border-primary/50"
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span
          className={
            selectedOption ? "text-foreground" : "text-muted-foreground"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-56 border-2 border-border bg-card shadow-lg">
          <div className="max-h-64 overflow-auto py-1">
            <button
              className="flex w-full items-center px-3 py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider transition-colors hover:bg-primary/10 hover:text-foreground"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              type="button"
            >
              All {label}s
            </button>
            {options.map((option) => (
              <button
                className={`flex w-full items-center px-3 py-2 font-mono text-xs transition-colors ${
                  value === option.value
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let displayValue: string;
  if (value?.from) {
    if (value.to) {
      displayValue = `${format(value.from, "MMM d")} - ${format(value.to, "MMM d")}`;
    } else {
      displayValue = format(value.from, "MMM d");
    }
  } else {
    displayValue = "Date Range";
  }

  const handleApply = () => {
    if (tempRange.from) {
      onChange(tempRange);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempRange({ from: null, to: null });
    onChange(null);
    setIsOpen(false);
  };

  // Generate calendar days
  const today = new Date();
  const currentMonth = tempRange.from ? new Date(tempRange.from) : today;
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
  for (let i = 0; i < startOffset; i++) {
    days.push({ date: null, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
      isCurrentMonth: true,
    });
  }

  const isSelected = (date: Date): boolean => {
    if (!tempRange.from) {
      return false;
    }
    if (tempRange.to) {
      return date >= tempRange.from && date <= tempRange.to;
    }
    return date.getTime() === tempRange.from.getTime();
  };

  const isStart = (date: Date) => {
    return tempRange.from?.getTime() === date.getTime();
  };

  const isEnd = (date: Date) => {
    return tempRange.to?.getTime() === date.getTime();
  };

  const handleDateClick = (date: Date) => {
    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      setTempRange({ from: date, to: null });
    } else if (tempRange.from && !tempRange.to) {
      if (date < tempRange.from) {
        setTempRange({ from: date, to: tempRange.from });
      } else {
        setTempRange({ ...tempRange, to: date });
      }
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-10 items-center gap-2 border-2 border-border bg-background px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:border-primary/50"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span
          className={value?.from ? "text-foreground" : "text-muted-foreground"}
        >
          {displayValue}
        </span>
        {value?.from && (
          <button
            className="ml-1 rounded p-0.5 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-[340px] border-2 border-border bg-card shadow-lg">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                className="p-1 hover:bg-muted"
                onClick={() =>
                  setTempRange((prev) => ({
                    ...prev,
                    from: prev.from
                      ? new Date(
                          prev.from.getFullYear(),
                          prev.from.getMonth() - 1,
                          1
                        )
                      : new Date(today.getFullYear(), today.getMonth() - 1, 1),
                  }))
                }
                type="button"
              >
                ←
              </button>
              <span className="font-bold font-mono text-sm">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </span>
              <button
                className="p-1 hover:bg-muted"
                onClick={() =>
                  setTempRange((prev) => ({
                    ...prev,
                    from: prev.from
                      ? new Date(
                          prev.from.getFullYear(),
                          prev.from.getMonth() + 1,
                          1
                        )
                      : new Date(today.getFullYear(), today.getMonth() + 1, 1),
                  }))
                }
                type="button"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  className="flex h-10 w-10 items-center justify-center font-mono text-[11px] text-muted-foreground"
                  key={day}
                >
                  {day}
                </div>
              ))}
              {days.map((day) => {
                if (!day.date) {
                  return <div className="h-10 w-10" key="empty" />;
                }
                const dateKey = day.date.toISOString();
                let buttonClass: string;
                if (isSelected(day.date)) {
                  if (isStart(day.date) || isEnd(day.date)) {
                    buttonClass = "bg-primary text-primary-foreground";
                  } else {
                    buttonClass = "bg-primary/20 text-foreground";
                  }
                } else {
                  buttonClass = "text-foreground hover:bg-muted";
                }
                return (
                  <div className="h-10 w-10" key={dateKey}>
                    <button
                      className={`flex h-full w-full items-center justify-center rounded-sm font-mono text-sm transition-colors ${buttonClass}`}
                      onClick={() => handleDateClick(day.date as Date)}
                      type="button"
                    >
                      {(day.date as Date).getDate()}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2 border-border border-t pt-3">
              <button
                className="flex-1 border-2 border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-muted"
                onClick={handleClear}
                type="button"
              >
                Clear
              </button>
              <button
                className="flex-1 border-2 border-primary bg-primary px-3 py-1.5 font-mono text-primary-foreground text-xs uppercase tracking-wider transition-colors hover:bg-primary/90"
                disabled={!tempRange.from}
                onClick={handleApply}
                type="button"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  projects,
  models,
  agents,
  filters,
  onFiltersChange,
  isLoading,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.project ||
    filters.model ||
    filters.agent ||
    filters.dateRange?.from;

  const projectOptions: FilterOption[] =
    projects?.map((p) => ({ value: p.name, label: p.name })) || [];
  const modelOptions: FilterOption[] =
    models?.map((m) => ({ value: m.name, label: m.name })) || [];
  const agentOptions: FilterOption[] =
    agents?.map((a) => ({ value: a.name, label: a.name })) || [];

  const handleClearAll = () => {
    onFiltersChange({
      project: null,
      model: null,
      agent: null,
      dateRange: null,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 border-2 border-border bg-background px-3 py-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
          Filters
        </span>
      </div>

      <SimpleSelect
        isLoading={isLoading}
        label="Project"
        onChange={(value) => onFiltersChange({ ...filters, project: value })}
        options={projectOptions}
        placeholder="All"
        value={filters.project}
      />

      <SimpleSelect
        isLoading={isLoading}
        label="Model"
        onChange={(value) => onFiltersChange({ ...filters, model: value })}
        options={modelOptions}
        placeholder="All"
        value={filters.model}
      />

      <SimpleSelect
        isLoading={isLoading}
        label="Agent"
        onChange={(value) => onFiltersChange({ ...filters, agent: value })}
        options={agentOptions}
        placeholder="All"
        value={filters.agent}
      />

      <DateRangePicker
        onChange={(range) => onFiltersChange({ ...filters, dateRange: range })}
        value={filters.dateRange}
      />

      {hasActiveFilters && (
        <button
          className="flex h-10 items-center gap-1 border-2 border-border px-3 font-mono text-muted-foreground text-xs uppercase tracking-wider transition-colors hover:border-destructive hover:text-destructive"
          onClick={handleClearAll}
          type="button"
        >
          <X className="h-4 w-4" />
          Clear All
        </button>
      )}
    </div>
  );
}
