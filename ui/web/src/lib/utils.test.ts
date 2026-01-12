import { describe, it, expect } from 'vitest';

// Utility functions to test
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const generateFIRNumber = (stationCode: string, year: number, sequence: number): string => {
  return `${stationCode}/${year}/${String(sequence).padStart(5, '0')}`;
};

const validatePhoneNumber = (phone: string): boolean => {
  const pattern = /^[6-9]\d{9}$/;
  return pattern.test(phone.replace(/\D/g, ''));
};

const validateAadhaar = (aadhaar: string): boolean => {
  const pattern = /^\d{12}$/;
  return pattern.test(aadhaar.replace(/\D/g, ''));
};

const validateVehicleNumber = (vehicleNumber: string): boolean => {
  // Indian vehicle registration: XX-NN-XX-NNNN or XX-NN-X-NNNN
  const pattern = /^[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4}$/;
  return pattern.test(vehicleNumber.toUpperCase());
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

describe('Date Formatting', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should handle string dates', () => {
    const formatted = formatDate('2024-06-20');
    expect(formatted).toContain('20');
    expect(formatted).toContain('2024');
  });
});

describe('Currency Formatting', () => {
  it('should format INR correctly', () => {
    const formatted = formatCurrency(100000);
    expect(formatted).toContain('1,00,000');
    expect(formatted).toContain('₹');
  });

  it('should handle large amounts', () => {
    const formatted = formatCurrency(10000000);
    expect(formatted).toContain('1,00,00,000');
  });

  it('should handle zero', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toContain('0');
  });
});

describe('FIR Number Generation', () => {
  it('should generate valid FIR number', () => {
    const firNumber = generateFIRNumber('KOR', 2024, 89);
    expect(firNumber).toBe('KOR/2024/00089');
  });

  it('should pad sequence numbers correctly', () => {
    expect(generateFIRNumber('HSR', 2024, 1)).toBe('HSR/2024/00001');
    expect(generateFIRNumber('HSR', 2024, 12345)).toBe('HSR/2024/12345');
  });
});

describe('Phone Number Validation', () => {
  it('should validate Indian phone numbers', () => {
    expect(validatePhoneNumber('9876543210')).toBe(true);
    expect(validatePhoneNumber('8765432109')).toBe(true);
    expect(validatePhoneNumber('7654321098')).toBe(true);
    expect(validatePhoneNumber('6543210987')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhoneNumber('1234567890')).toBe(false); // Doesn't start with 6-9
    expect(validatePhoneNumber('987654321')).toBe(false); // Too short
    expect(validatePhoneNumber('98765432109')).toBe(false); // Too long
    expect(validatePhoneNumber('abcdefghij')).toBe(false); // Non-numeric
  });

  it('should handle formatted numbers', () => {
    expect(validatePhoneNumber('+91 98765 43210')).toBe(true);
    expect(validatePhoneNumber('98765-43210')).toBe(true);
  });
});

describe('Aadhaar Validation', () => {
  it('should validate 12-digit Aadhaar', () => {
    expect(validateAadhaar('123456789012')).toBe(true);
    expect(validateAadhaar('987654321098')).toBe(true);
  });

  it('should reject invalid Aadhaar', () => {
    expect(validateAadhaar('12345678901')).toBe(false); // 11 digits
    expect(validateAadhaar('1234567890123')).toBe(false); // 13 digits
    expect(validateAadhaar('abcdefghijkl')).toBe(false); // Non-numeric
  });

  it('should handle formatted Aadhaar', () => {
    expect(validateAadhaar('1234 5678 9012')).toBe(true);
    expect(validateAadhaar('1234-5678-9012')).toBe(true);
  });
});

describe('Vehicle Number Validation', () => {
  it('should validate Indian vehicle numbers', () => {
    expect(validateVehicleNumber('KA-01-AB-1234')).toBe(true);
    expect(validateVehicleNumber('KA01AB1234')).toBe(true);
    expect(validateVehicleNumber('MH-12-CD-5678')).toBe(true);
    expect(validateVehicleNumber('DL 01 A 1234')).toBe(true);
  });

  it('should reject invalid vehicle numbers', () => {
    expect(validateVehicleNumber('123-AB-CD-5678')).toBe(false);
    expect(validateVehicleNumber('KA-1-AB-1234')).toBe(false);
    expect(validateVehicleNumber('invalid')).toBe(false);
  });
});

describe('Text Utilities', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that needs to be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very lo...');
    expect(truncateText(longText, 100)).toBe(longText);
  });

  it('should capitalize text', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('Hello');
    expect(capitalize('hELLO')).toBe('Hello');
  });

  it('should slugify text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Armed Robbery Case')).toBe('armed-robbery-case');
    expect(slugify('Test!@#$%^&*()')).toBe('test');
    expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
  });
});

describe('Priority Helpers', () => {
  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      HIGH: 'red',
      MEDIUM: 'yellow',
      LOW: 'green',
    };
    return colors[priority] || 'gray';
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      HIGH: 'High Priority',
      MEDIUM: 'Medium Priority',
      LOW: 'Low Priority',
    };
    return labels[priority] || 'Unknown';
  };

  it('should return correct priority colors', () => {
    expect(getPriorityColor('HIGH')).toBe('red');
    expect(getPriorityColor('MEDIUM')).toBe('yellow');
    expect(getPriorityColor('LOW')).toBe('green');
    expect(getPriorityColor('UNKNOWN')).toBe('gray');
  });

  it('should return correct priority labels', () => {
    expect(getPriorityLabel('HIGH')).toBe('High Priority');
    expect(getPriorityLabel('MEDIUM')).toBe('Medium Priority');
    expect(getPriorityLabel('LOW')).toBe('Low Priority');
  });
});

describe('Status Helpers', () => {
  const getStatusBadge = (status: string): { color: string; label: string } => {
    const badges: Record<string, { color: string; label: string }> = {
      REGISTERED: { color: 'blue', label: 'Registered' },
      UNDER_INVESTIGATION: { color: 'yellow', label: 'Under Investigation' },
      CHARGESHEET_FILED: { color: 'purple', label: 'Chargesheet Filed' },
      COURT_PROCEEDINGS: { color: 'orange', label: 'Court Proceedings' },
      CLOSED: { color: 'green', label: 'Closed' },
      DISMISSED: { color: 'gray', label: 'Dismissed' },
    };
    return badges[status] || { color: 'gray', label: status };
  };

  it('should return correct status badges', () => {
    expect(getStatusBadge('REGISTERED')).toEqual({ color: 'blue', label: 'Registered' });
    expect(getStatusBadge('UNDER_INVESTIGATION')).toEqual({ color: 'yellow', label: 'Under Investigation' });
    expect(getStatusBadge('CLOSED')).toEqual({ color: 'green', label: 'Closed' });
  });

  it('should handle unknown status', () => {
    const badge = getStatusBadge('UNKNOWN_STATUS');
    expect(badge.color).toBe('gray');
    expect(badge.label).toBe('UNKNOWN_STATUS');
  });
});
