/**
 * The one piece of Kolkata reference data the interface still holds locally.
 *
 * Everything else that used to live here — the four agencies and their
 * divisions, a court list, landmarks, RTO prefixes, rank labels and sample
 * officers and citizens — came from the prototype and was read by nothing. The
 * real versions arrive from the API: stations and districts from the session
 * and the station register, courts from the court module, ranks from the role
 * model, and people from the records officers enter.
 *
 * A map has to open somewhere before it knows where the officer is looking, so
 * this stays.
 */

export const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };
