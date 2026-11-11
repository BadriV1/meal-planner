import { useState } from "react";
import { Chip } from "@/core/ui/components";
import { useProfile } from "@/modules/profile/ProfileContext";
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  SKIP_SUGGESTIONS,
  dietAllergenConflicts,
} from "@/modules/profile/rules";
import type { Allergen } from "@/modules/profile/types";

export function FoodRules() {
  const { profile, update } = useProfile();
  const [otherAllergy, setOtherAllergy] = useState("");
  const [skipText, setSkipText] = useState("");

  const noAllergies = profile.allergies.length === 0 && profile.otherAllergies.length === 0;
  const toggleAllergy = (a: Allergen) =>
    update({
      allergies: profile.allergies.includes(a)
        ? profile.allergies.filter((x) => x !== a)
        : [...profile.allergies, a],
    });
  const addOther = () => {
    const v = otherAllergy.trim();
    if (v && !profile.otherAllergies.includes(v)) update({ otherAllergies: [...profile.otherAllergies, v] });
    setOtherAllergy("");
  };

  const skipOptions = Array.from(new Set([...SKIP_SUGGESTIONS, ...profile.foodsToSkip]));
  const toggleSkip = (s: string) =>
    update({
      foodsToSkip: profile.foodsToSkip.includes(s)
        ? profile.foodsToSkip.filter((x) => x !== s)
        : [...profile.foodsToSkip, s],
    });
  const addSkip = () => {
    const v = skipText.trim();
    if (v && !profile.foodsToSkip.includes(v)) update({ foodsToSkip: [...profile.foodsToSkip, v] });
    setSkipText("");
  };

  const conflicts = dietAllergenConflicts(profile.diet, profile.allergies);

  return (
    <div>
      <h1>What does your household eat?</h1>
      <p className="sub">These apply to everyone at home.</p>

      <h2>Diet type</h2>
      <div className="options" role="radiogroup">
        {DIET_OPTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={profile.diet === d.id}
            className={`option ${profile.diet === d.id ? "on" : ""}`}
            onClick={() => update({ diet: d.id })}
          >
            <strong>{d.label}</strong>
            <span>
              Eats: {d.eats} · Avoids: {d.avoids}
            </span>
          </button>
        ))}
      </div>

      <h2>Any allergies?</h2>
      <div className="chips">
        <Chip on={noAllergies} onClick={() => update({ allergies: [], otherAllergies: [] })}>
          None
        </Chip>
        {ALLERGEN_OPTIONS.map((a) => (
          <Chip key={a.id} on={profile.allergies.includes(a.id)} onClick={() => toggleAllergy(a.id)}>
            {a.label}
          </Chip>
        ))}
        {profile.otherAllergies.map((o) => (
          <Chip key={o} on onClick={() => update({ otherAllergies: profile.otherAllergies.filter((x) => x !== o) })}>
            {o} ✕
          </Chip>
        ))}
      </div>
      <div className="inline">
        <input
          type="text"
          placeholder="Other allergy (e.g. mustard)"
          value={otherAllergy}
          onChange={(e) => setOtherAllergy(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOther()}
        />
        <button type="button" className="btn" onClick={addOther}>
          Add
        </button>
      </div>
      <p className="hint">ⓘ We'll keep these out of every recipe. Always check ingredient labels.</p>
      {conflicts.map((c) => (
        <div key={c} className="notice">
          {c}
        </div>
      ))}

      <h2>Foods you'd rather skip (optional)</h2>
      <div className="chips">
        {skipOptions.map((s) => (
          <Chip key={s} on={profile.foodsToSkip.includes(s)} onClick={() => toggleSkip(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="inline">
        <input
          type="text"
          placeholder="Add a food to skip"
          value={skipText}
          onChange={(e) => setSkipText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSkip()}
        />
        <button type="button" className="btn" onClick={addSkip}>
          Add
        </button>
      </div>
    </div>
  );
}
