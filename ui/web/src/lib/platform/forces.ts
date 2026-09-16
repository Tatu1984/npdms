/**
 * The departments the platform connects.
 *
 *   Kolkata Police       a force, policing the city
 *     Kolkata Traffic    a wing of it
 *   West Bengal Police   a force, policing the rest of the state
 *     CID                a wing of it
 *
 * Two rules the whole interface follows from here:
 *
 *  1. An officer sees their own force's records. A short list of registers is
 *     state-wide and visible to every force; everything else crosses a
 *     boundary only by an explicit, audited act — a referral or an assistance
 *     request.
 *  2. The posting decides the force. There is no picker. This file reads the
 *     force off the session and never offers a way to change it.
 */

export type ForceCode = "KP" | "TRAFFIC" | "WBP" | "CID";

/** Mirrors `models.Force` on the API, which reads the `forces` table. */
export interface Force {
  code: string;
  name: string;
  nameBn?: string;
  shortName: string;
  kind: "FORCE" | "WING";
  /** Set when `kind` is WING — the force the wing belongs to. */
  parentCode?: string;
  parentName?: string;
  headquarters?: string;
  remit?: string;
}

/**
 * What an account with no force is taken to be. Every account that existed
 * before the departments did is a Kolkata Police account — the migration that
 * added the column said so of the data it found — so an older API that sends
 * no force must not blank the department line or empty the navigation.
 */
export const DEFAULT_FORCE: Force = {
  code: "KP",
  name: "Kolkata Police",
  nameBn: "কলকাতা পুলিশ",
  shortName: "KP",
  kind: "FORCE",
  headquarters: "Lalbazar, Kolkata",
  remit: "Policing the city of Kolkata.",
};

/** The officer's force, or Kolkata Police when the session does not carry one. */
export function forceOf(user: { force?: Force | null } | null | undefined): Force {
  const force = user?.force;
  // A force with no code is a row that was not read, not a force of its own.
  return force && force.code ? force : DEFAULT_FORCE;
}

/**
 * How a force is named on screen, in the reading language.
 *
 * A wing is shown with the force it belongs to — "CID · West Bengal Police" —
 * because CID alone does not say which of the two forces an officer is under.
 */
export function forceName(force: Force, bengali: boolean): string {
  return bengali && force.nameBn ? force.nameBn : force.name;
}

export interface ForceLabel {
  /** The short name, for the badge: KP, KTP, WBP, CID. */
  short: string;
  /** The full name of the officer's own force. */
  full: string;
  /** The parent force, for a wing; undefined for a force in its own right. */
  parent?: string;
}

export function forceLabel(force: Force, bengali: boolean): ForceLabel {
  return {
    short: force.shortName,
    full: forceName(force, bengali),
    parent: force.kind === "WING" ? force.parentName : undefined,
  };
}

/**
 * The registers every force sees, matching the `shared_registers` table.
 *
 * A missing child does not stop being missing at a jurisdiction boundary and a
 * stolen car is driven across one within the hour, so these four are state-wide
 * by decision rather than by accident. The screens that show them say so.
 */
export const SHARED_REGISTERS = [
  "MISSING_PERSONS",
  "VEHICLES",
  "LOOKOUTS",
  "ALERTS",
] as const;

export type SharedRegister = (typeof SHARED_REGISTERS)[number];

/**
 * Modules that carry a state-wide register, so that no force can be made to
 * lose one: the module mapping below may hide anything except these.
 *
 * `vehicle-detection` is here for its watchlist only — the camera hits and the
 * footage behind them are the reading force's own — so that screen marks the
 * watchlist rather than the whole page. The lookout register has no module of
 * its own; `/lookout` is reached from the records it belongs to, and marks
 * itself.
 */
export const SHARED_REGISTER_MODULES: Record<string, SharedRegister> = {
  "missing-persons": "MISSING_PERSONS",
  "vehicle-detection": "VEHICLES",
  alerts: "ALERTS",
};
