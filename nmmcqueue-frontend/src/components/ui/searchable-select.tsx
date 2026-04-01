"use client";

import { useState } from "react";
import { Check, CaretUpDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
    label: string;
    value: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onSelect: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * COMPONENT: SearchableSelect
 * A reusable, simplistic dropdown with search and proper scrolling for long lists.
 * Replaces manual Popover + Command implementations for consistency.
 */
export function SearchableSelect({
    options,
    value,
    onSelect,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal bg-white border-border shadow-sm",
                        className
                    )}
                >
                    <span className="truncate">
                        {value
                            ? options.find((option) => option.value === value)?.label || value
                            : placeholder}
                    </span>
                    <CaretUpDown weight="bold" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-(--radix-popover-trigger-width) p-0 z-50 rounded-xl border-border shadow-2xl overflow-hidden" 
                align="start"
                sideOffset={4}
            >
                <Command className="rounded-none border-none">
                    <CommandInput 
                        placeholder={searchPlaceholder} 
                        className="h-10 text-sm border-none ring-0 focus:ring-0" 
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white">
                        <CommandEmpty className="py-6 text-center text-sm font-medium text-muted-foreground italic">
                            {emptyMessage}
                        </CommandEmpty>
                        <CommandGroup className="p-1">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onSelect(option.value);
                                        setOpen(false);
                                    }}
                                    className="rounded-lg font-medium py-2 px-3 cursor-pointer data-[selected=true]:bg-muted data-[selected=true]:text-foreground transition-colors"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-primary",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
