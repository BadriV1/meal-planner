import { Fragment, useEffect, useMemo, useState } from "react";
import { MEAL_TYPES, type CatalogMeal } from "@/modules/catalog/meals";
import { planDay, type Audience } from "@/modules/menu/rulesEngine";
import { useProfile } from "@/modules/profile/ProfileContext";
import { hasKids } from "@/modules/profile/rules";
import { DEFAULT_SETTINGS } from "@/modules/settings/defaults";
import { recordSignals } from "@/modules/signals/signals";
import type { StepProps } from "../stepRegistry";

type Verdict = "up" | "down";
const key = (a: Audience, mealType: string) => `${a}:${mealType}`;

export function SampleMonday({ registerFinish }: StepProps) {
  const { profile } = useProfile();
  const withKids = hasKids(profile.members);
  const plan = useMemo(
    () => planDay(profile, DEFAULT_SETTINGS.cookingTime.weekday, withKids),
    [profile, withKids],
  );
  const [ratings, setRatings] = useState<Record<string, Verdict>>({});

  const rate = (k: string, v: Verdict) =>
    setRatings((r) => {
      const next = { ...r };
      if (next[k] === v) delete next[k];
      else next[k] = v;
      return next;
    });

  // Save signals when the user clicks Done.
  useEffect(() => {
    registerFinish?.(() => {
      const out: { meal: CatalogMeal; audience: Audience; verdict: Verdict }[] = [];
      for (const [k, verdict] of Object.entries(ratings)) {
        const [audience, mealType] = k.split(":") as [Audience, keyof typeof plan.adult];
        const meal = (audience === "adult" ? plan.adult : plan.kid)?.[mealType];
        if (meal) out.push({ meal, audience, verdict });
      }
      recordSignals(out);
    });
  }, [ratings, plan, registerFinish]);

  const Cell = ({ audience, meal, mealType }: { audience: Audience; meal?: CatalogMeal; mealType: string }) => {
    if (!meal) return <div className="cell-meta">No match yet — AI will suggest one</div>;
    const k = key(audience, mealType);
    const batch = meal.batchDays ? ` · batch, makes ${meal.batchDays} days` : "";
    return (
      <div className="cell">
        <div>
          <div className="cell-name">{meal.name}</div>
          <div className="cell-meta">
            {meal.prepMinutes} min{batch}
          </div>
        </div>
        <div className="thumbs">
          <button
            type="button"
            aria-label={`Like ${meal.name} for ${audience}s`}
            className={`thumb up ${ratings[k] === "up" ? "on" : ""}`}
            onClick={() => rate(k, "up")}
          >
            👍
          </button>
          <button
            type="button"
            aria-label={`Dislike ${meal.name} for ${audience}s`}
            className={`thumb down ${ratings[k] === "down" ? "on" : ""}`}
            onClick={() => rate(k, "down")}
          >
            👎
          </button>
        </div>
      </div>
    );
  };

  const total = MEAL_TYPES.length * (withKids ? 2 : 1);
  const rated = Object.keys(ratings).length;

  return (
    <div>
      <h1>Here's what a Monday could look like</h1>
      <p className="sub">Tell us what works. Your ratings shape every menu we plan.</p>

      <div className={`menu-grid ${withKids ? "" : "single"}`}>
        <div className="menu-head" />
        <div className="menu-head">Adults</div>
        {withKids && <div className="menu-head">Kids</div>}
        {MEAL_TYPES.map((t) => (
          <Fragment key={t.id}>
            <div className="menu-type">{t.label}</div>
            <div>
              {Cell({ audience: "adult", meal: plan.adult[t.id], mealType: t.id })}
            </div>
            {withKids && (
              <div>
                {Cell({ audience: "kid", meal: plan.kid?.[t.id], mealType: t.id })}
              </div>
            )}
          </Fragment>
        ))}
      </div>
      <p className="hint">
        Rated {rated} of {total}. Weekday cooking time: {DEFAULT_SETTINGS.cookingTime.weekday.breakfastLunch} min
        breakfast + lunch, {DEFAULT_SETTINGS.cookingTime.weekday.snack} min snack,{" "}
        {DEFAULT_SETTINGS.cookingTime.weekday.dinner} min dinner · change in Settings.
      </p>
    </div>
  );
}
