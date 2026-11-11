import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/core/storage";
import type { HouseholdProfile } from "./types";

let seq = 0;
export const newId = (p = "id") => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** Spec default: family of 4 — 2 adults + 2 toddlers, non-veg, no allergies. */
export function defaultProfile(): HouseholdProfile {
  return {
    members: [
      { id: "a1", type: "adult" },
      { id: "a2", type: "adult" },
      { id: "t1", type: "toddler" },
      { id: "t2", type: "toddler" },
    ],
    diet: "non_vegetarian",
    allergies: [],
    otherAllergies: [],
    foodsToSkip: [],
    favoriteMealIds: [],
    customMeals: [],
    favoritesFreeText: "",
  };
}

interface Ctx {
  profile: HouseholdProfile;
  update: (patch: Partial<HouseholdProfile>) => void;
  reset: () => void;
}

const ProfileCtx = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<HouseholdProfile>(() =>
    storage.get("profile", defaultProfile()),
  );

  useEffect(() => storage.set("profile", profile), [profile]);

  const update = useCallback(
    (patch: Partial<HouseholdProfile>) => setProfile((p) => ({ ...p, ...patch })),
    [],
  );
  const reset = useCallback(() => setProfile(defaultProfile()), []);

  return <ProfileCtx.Provider value={{ profile, update, reset }}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
