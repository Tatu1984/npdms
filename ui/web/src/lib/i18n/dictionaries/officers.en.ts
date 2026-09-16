/**
 * Officer accounts — screen strings. Mounted as `officersScreen` in en.ts.
 *
 * The wording is deliberate in two places. Deactivation is never called
 * deletion, because it is not one and an administrator who believes it is will
 * use it wrongly. And a password is always described as shown once, because
 * the screen cannot show it again and the administrator has to know that
 * before they close the dialog.
 */
export const officersEn = {
  nav: {
    name: "Officer accounts",
    desc: "Who may sign in, where they are posted, and when they stop",
  },

  lead:
    "Every account here belongs to your own department. An officer's department follows their posting: choose the station and the department comes with it. Accounts are closed, never deleted, so the FIRs, cases and custody entries an officer made keep naming them.",
  needsSP:
    "Accounts are opened, amended and closed by the Superintendent and above. You can see the roster; the actions are not offered at your rank.",
  refusedTitle: "The rule that stopped this",

  roster: "Roster",
  rosterNote: "{n} officers",
  empty: "No officers match this search.",
  searchPlaceholder: "Name, username, badge number or station",

  filter: {
    all: "All",
    active: "Serving",
    inactive: "Closed",
  },

  column: {
    officer: "Officer",
    rank: "Rank",
    posting: "Posting",
    department: "Department",
    status: "Status",
    lastLogin: "Last signed in",
  },

  status: {
    active: "Serving",
    inactive: "Closed",
    owesPasswordChange: "Password change due",
    neverSignedIn: "Never signed in",
  },

  actions: {
    create: "Open an account",
    amend: "Amend or transfer",
    deactivate: "Close the account",
    reactivate: "Reopen the account",
    resetPassword: "Issue a new password",
  },

  create: {
    title: "Open an officer's account",
    lead:
      "The department is not asked for. It follows the station you post the officer to, and the database will refuse a combination that cannot exist.",
    username: "Username",
    usernameHelp: "What the officer types to sign in. Lower case, and it cannot be changed afterwards.",
    name: "Full name",
    nameHelp: "As it should appear on the records this officer makes.",
    email: "Email address",
    phone: "Telephone",
    badge: "Badge number",
    badgeHelp: "Optional, but unique across the platform where it is given.",
    rank: "Rank",
    rankHelp: "You cannot open an account above your own rank.",
    posting: "Posting",
    postingHelp: "Only stations of your own department and its wings are offered.",
    submit: "Open the account",
    opened: "Account opened",
  },

  password: {
    title: "The password for {name}",
    shownOnce:
      "This password is shown once. Copy it now and hand it to the officer in person — this screen cannot show it again, and nothing in the platform stores it.",
    label: "Password",
    copy: "Copy",
    copied: "Copied",
    mustChange: "The officer must change it when they first sign in.",
    done: "I have handed it over",
    resetTitle: "Issue a new password for {name}",
    resetLead:
      "The officer's current password stops working immediately. The new one is shown once, here.",
    resetConfirm: "Issue a new password",
  },

  amend: {
    title: "Amend {name}",
    lead:
      "Change only what needs changing. Moving the posting transfers the officer, and where the new station belongs to another department the officer's department moves with it.",
    transferNote: "This posting belongs to {force}. The officer's department will move with them.",
    submit: "Save the amendment",
    saved: "Amendment saved",
    nothing: "Nothing was changed.",
  },

  deactivate: {
    title: "Close {name}'s account",
    notADeletion:
      "This is not a deletion. The account is closed, so the officer can no longer sign in, and every record they made — FIRs, cases, custody entries, audit lines — stays exactly as it is and keeps naming them. Nothing in this platform can delete an officer's account.",
    reason: "Reason",
    reasonHelp: "Retirement, transfer out of the force, suspension. It is kept with the account.",
    confirm: "Close the account",
    closed: "Account closed",
    reactivateTitle: "Reopen {name}'s account",
    reactivateBody:
      "The officer will be able to sign in again with their existing password. If they do not have one, issue a new password afterwards.",
    reactivateConfirm: "Reopen the account",
    reopened: "Account reopened",
  },

  detail: {
    openedOn: "Account opened",
    closedOn: "Closed",
    closedBy: "Closed by",
    closedReason: "Reason",
  },
};
