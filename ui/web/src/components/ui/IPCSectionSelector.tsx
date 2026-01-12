'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, Scale, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Input } from './input';
import { Badge } from './badge';
import {
  IPC_SECTIONS,
  IPC_CATEGORIES,
  COMMON_IPC_SECTIONS,
  searchIPCSections,
  getIPCSectionByCode,
  type IPCSection,
  type IPCCategory,
} from '@/lib/data/ipc-sections';

interface IPCSectionSelectorProps {
  value: string[];
  onChange: (sections: string[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  maxSelections?: number;
}

export function IPCSectionSelector({
  value = [],
  onChange,
  label = 'Applicable IPC/Act Sections',
  required = false,
  error,
  maxSelections,
}: IPCSectionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IPCCategory | 'all' | 'common'>('common');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    let sections: IPCSection[] = [];

    if (searchQuery.length >= 2) {
      sections = searchIPCSections(searchQuery);
    } else if (selectedCategory === 'common') {
      sections = COMMON_IPC_SECTIONS
        .map((code) => getIPCSectionByCode(code))
        .filter((s): s is IPCSection => s !== undefined);
    } else if (selectedCategory === 'all') {
      sections = IPC_SECTIONS;
    } else {
      sections = IPC_SECTIONS.filter((s) => s.category === selectedCategory);
    }

    return sections;
  }, [searchQuery, selectedCategory]);

  // Toggle section selection
  const toggleSection = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter((s) => s !== code));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add more if max reached
      }
      onChange([...value, code]);
    }
  };

  // Remove selected section
  const removeSection = (code: string) => {
    onChange(value.filter((s) => s !== code));
  };

  // Get selected section details
  const selectedSections = value
    .map((code) => getIPCSectionByCode(code))
    .filter((s): s is IPCSection => s !== undefined);

  return (
    <div className="space-y-3" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      {/* Selected sections display */}
      {selectedSections.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-background-secondary rounded-lg border border-border">
          {selectedSections.map((section) => (
            <Badge
              key={section.code}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{section.code}</span>
              <button
                type="button"
                onClick={() => removeSection(section.code)}
                className="ml-1 p-0.5 hover:bg-background-tertiary rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border hover:border-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-foreground-muted" />
          <span className="text-foreground">
            {value.length === 0 ? 'Select IPC Sections' : `${value.length} section(s) selected`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-foreground-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-foreground-muted" />
        )}
      </button>

      {/* Expanded selector */}
      {isExpanded && (
        <div className="border border-border rounded-lg bg-background shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <Input
              value={searchQuery}
              onChange={(v: string) => setSearchQuery(v)}
              placeholder="Search by section number, title, or description..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Category tabs */}
          <div className="p-2 border-b border-border overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <button
                type="button"
                onClick={() => setSelectedCategory('common')}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === 'common'
                    ? 'bg-accent text-white'
                    : 'bg-background-secondary text-foreground-muted hover:text-foreground'
                }`}
              >
                Common
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-background-secondary text-foreground-muted hover:text-foreground'
                }`}
              >
                All Sections
              </button>
              {IPC_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-accent text-white'
                      : 'bg-background-secondary text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {category.replace('Special Acts - ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Sections list */}
          <div className="max-h-80 overflow-y-auto">
            {filteredSections.length === 0 ? (
              <div className="p-6 text-center text-foreground-muted">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sections found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredSections.map((section) => {
                  const isSelected = value.includes(section.code);
                  const isShowingDetails = showDetails === section.code;

                  return (
                    <div key={section.code} className="relative">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.code)}
                        disabled={!isSelected && maxSelections !== undefined && value.length >= maxSelections}
                        className={`w-full p-3 text-left hover:bg-background-secondary transition-colors ${
                          isSelected ? 'bg-accent/10' : ''
                        } ${
                          !isSelected && maxSelections !== undefined && value.length >= maxSelections
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm font-medium ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                                {section.code}
                              </span>
                              <span className="text-sm text-foreground truncate">
                                {section.title}
                              </span>
                            </div>
                            <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                              {section.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={section.bailable ? 'success' : 'error'}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {section.bailable ? 'Bailable' : 'Non-Bailable'}
                              </Badge>
                              <Badge
                                variant={section.cognizable ? 'warning' : 'secondary'}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {section.cognizable ? 'Cognizable' : 'Non-Cognizable'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(isShowingDetails ? null : section.code);
                              }}
                              className="p-1 text-foreground-muted hover:text-foreground rounded"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-accent bg-accent'
                                  : 'border-foreground-muted'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Details panel */}
                      {isShowingDetails && (
                        <div className="px-3 pb-3 bg-background-tertiary border-t border-border">
                          <div className="mt-2 space-y-2 text-xs">
                            <div>
                              <span className="font-medium text-foreground">Category:</span>{' '}
                              <span className="text-foreground-muted">{section.category}</span>
                            </div>
                            {section.punishment && (
                              <div>
                                <span className="font-medium text-foreground">Punishment:</span>{' '}
                                <span className="text-foreground-muted">{section.punishment}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-foreground">Full Description:</span>{' '}
                              <span className="text-foreground-muted">{section.description}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with count */}
          <div className="p-2 border-t border-border bg-background-secondary text-xs text-foreground-muted flex items-center justify-between">
            <span>
              Showing {filteredSections.length} of {IPC_SECTIONS.length} sections
            </span>
            {maxSelections && (
              <span>
                {value.length} / {maxSelections} selected
              </span>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export default IPCSectionSelector;
