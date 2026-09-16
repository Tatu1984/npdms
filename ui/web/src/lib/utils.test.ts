import { describe, it, expect } from "vitest";

import { cn, formatDate, formatTime, formatDateTime } from "./utils";

// These test the functions the application actually uses.
//
// The previous version of this file defined its own copies of formatDate,
// formatCurrency, generateFIRNumber and three validators inside the test file
// and asserted against those. It imported nothing from the application, so its
// twenty-two green checks proved nothing about the product — and one of them
// failed, against a validator that exists nowhere in it. Four of the six
// functions it "tested" do not exist in this codebase at all.
//
// Dates are the part worth testing here: every screen shows them, the platform
// is in one time zone, and en-IN formatting is not the default anywhere.

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values, so a conditional class can be written inline", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("lets a later Tailwind class win over an earlier one of the same kind", () => {
    // This is the reason tailwind-merge is here: without it both survive and
    // which one applies depends on stylesheet order.
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-foreground", "text-lg")).toBe("text-foreground text-lg");
  });
});

describe("formatDate", () => {
  // The month's abbreviation is ICU's, and it differs between Node versions —
  // "Sep" on some, "Sept" on others. Asserting the exact string makes the suite
  // fail on a colleague's machine for no reason, so these assert what the
  // format is for: day first, month in words, four-digit year.
  it("renders an Indian date, day first and the month in words", () => {
    // 14 September 2026. The month is spelled so that 09/10 is never read as
    // October by a reader expecting the American order.
    expect(formatDate(new Date(2026, 8, 14))).toMatch(/^14 Sept? 2026$/);
  });

  it("accepts a string, because that is what the API returns", () => {
    expect(formatDate("2026-09-14T10:30:00")).toMatch(/^14 Sept? 2026$/);
  });

  it("pads a single-digit day", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("05 Jan 2026");
  });
});

describe("formatTime", () => {
  it("renders a time of day", () => {
    const rendered = formatTime(new Date(2026, 8, 14, 14, 30));
    // en-IN gives a twelve-hour clock; assert the parts rather than the exact
    // spacing, which differs between Node versions.
    expect(rendered).toMatch(/02:30/);
    expect(rendered.toLowerCase()).toContain("pm");
  });

  it("pads the hour before noon", () => {
    expect(formatTime(new Date(2026, 8, 14, 9, 5))).toMatch(/09:05/);
  });
});

describe("formatDateTime", () => {
  it("puts the date before the time", () => {
    const rendered = formatDateTime(new Date(2026, 8, 14, 14, 30));
    expect(rendered).toMatch(/^14 Sept? 2026 /);
    expect(rendered).toMatch(/02:30/);
  });
});

describe("what these functions do with rubbish", () => {
  it("renders an unparseable date as Invalid Date rather than throwing", () => {
    // A screen showing "Invalid Date" is wrong, but a screen that throws takes
    // the whole record with it. Worth knowing which one happens.
    expect(formatDate("not a date")).toBe("Invalid Date");
  });
});
