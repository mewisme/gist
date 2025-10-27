'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortDropdownProps {
  defaultValue: string;
}

export function SortDropdown({ defaultValue }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/discover?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort:</span>
      <Select defaultValue={defaultValue} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recently-created">Recently created</SelectItem>
          <SelectItem value="recently-updated">Recently updated</SelectItem>
          <SelectItem value="least-recently-created">Least recently created</SelectItem>
          <SelectItem value="least-recently-updated">Least recently updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
