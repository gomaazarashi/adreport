'use client';

import { useState } from 'react';
import Input from '@/components/Ui/Input';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function DateRangePicker({
  onDateRangeChange,
  initialStartDate = '',
  initialEndDate = '',
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate && endDate) {
      onDateRangeChange(newStartDate, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (startDate && newEndDate) {
      onDateRangeChange(startDate, newEndDate);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          開始日
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          placeholder="開始日を選択"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          終了日
        </label>
        <Input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          placeholder="終了日を選択"
        />
      </div>
    </div>
  );
}
