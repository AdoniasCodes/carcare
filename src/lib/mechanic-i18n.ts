"use client";

import { useEffect, useState } from "react";

export type MLang = "am" | "en";

const STORAGE_KEY = "mechanic-lang";

const dict = {
  hi: { am: "ሰላም", en: "Hi" },
  signOut: { am: "ውጣ", en: "Sign Out" },
  available: { am: "ዝግጁ", en: "Available" },
  busy: { am: "በሥራ ላይ", en: "Busy" },
  off: { am: "ሥራ የለም", en: "Off" },
  newWalkin: { am: "+ አዲስ ሥራ ጨምር", en: "+ New Walk-in / Phone Call" },
  activeJob: { am: "አሁን እየሠራሁ ያለሁት", en: "Working on now" },
  assigned: { am: "የተሰጡኝ ሥራዎች", en: "Assigned to me" },
  open: { am: "ክፍት ሥራዎች", en: "Open jobs" },
  noJobs: { am: "ሥራ የለም", en: "No jobs" },
  startWork: { am: "ሥራ ጀምር", en: "Start Work" },
  pickUp: { am: "ይህን ውሰድ", en: "Pick up" },
  continue: { am: "ቀጥል →", en: "Continue →" },
  call: { am: "ደውል", en: "Call" },
  today: { am: "የዛሬ", en: "Today" },
  jobsDone: { am: "የተጠናቀቁ", en: "Jobs done" },
  cash: { am: "ብር የተሰበሰበ", en: "Cash collected" },
  estCommission: { am: "የተገመተ ኮሚሽን", en: "Est. commission" },
  back: { am: "← ተመለስ", en: "← Back" },
  car: { am: "መኪና", en: "Car" },
  service: { am: "አገልግሎት", en: "Service" },
  location: { am: "ቦታ", en: "Location" },
  openMap: { am: "ካርታ", en: "Map" },
  before: { am: "ከመጀመር በፊት", en: "Before" },
  after: { am: "ከጨረሰ በኋላ", en: "After" },
  takeBefore: { am: "📷 ፎቶ አንሳ (ከመጀመር በፊት)", en: "📷 Take Before Photos" },
  takeAfter: { am: "📷 ፎቶ አንሳ (ከጨረሰ በኋላ)", en: "📷 Take After Photos" },
  notes: { am: "ማስታወሻ (አማራጭ)", en: "Notes (optional)" },
  cashCollected: { am: "የተቀበለው ብር", en: "Cash collected (ETB)" },
  paymentMethod: { am: "የክፍያ ዓይነት", en: "Payment method" },
  payCash: { am: "ጥሬ ገንዘብ", en: "Cash" },
  payTransfer: { am: "ባንክ ዝውውር", en: "Transfer" },
  payPending: { am: "ገና አልተከፈለም", en: "Pending" },
  markDone: { am: "✓ ሥራ ጨርሻለሁ", en: "✓ Mark Done" },
  saving: { am: "በማስቀመጥ ላይ...", en: "Saving..." },
  uploading: { am: "በመስቀል ላይ...", en: "Uploading..." },
  // walk-in form
  newJob: { am: "አዲስ ሥራ", en: "New Job" },
  customerName: { am: "የደንበኛ ስም", en: "Customer Name" },
  phone: { am: "ስልክ", en: "Phone" },
  carMake: { am: "የመኪና ዓይነት", en: "Car Make" },
  carModel: { am: "ሞዴል", en: "Model" },
  carYear: { am: "ዓመተ ምርት", en: "Year" },
  serviceType: { am: "የአገልግሎት ዓይነት", en: "Service Type" },
  description: { am: "ዝርዝር (አማራጭ)", en: "Description (optional)" },
  source: { am: "መነሻ", en: "Source" },
  sourcePhone: { am: "ስልክ ጥሪ", en: "Phone Call" },
  sourceWalkin: { am: "ቀጥታ መጥቶ", en: "Walk-in" },
  startNow: { am: "አሁን ጀምር", en: "Start now" },
  save: { am: "አስቀምጥ", en: "Save" },
  cancel: { am: "ሰርዝ", en: "Cancel" },
  preventative: { am: "የመከላከያ", en: "Preventative" },
  routine: { am: "ተራ ጥገና", en: "Routine" },
  roadside: { am: "የመንገድ ላይ", en: "Roadside" },
  other: { am: "ሌላ", en: "Other" },
  required: { am: "ግዴታ ሙላ", en: "Required" },
  noPhotos: { am: "ፎቶ የለም", en: "No photos yet" },
} as const;

export type MKey = keyof typeof dict;

export function useMLang() {
  const [lang, setLangState] = useState<MLang>("am");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "am" || stored === "en") setLangState(stored);
  }, []);
  const setLang = (l: MLang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };
  const t = (k: MKey) => dict[k][lang];
  return { lang, setLang, t };
}
