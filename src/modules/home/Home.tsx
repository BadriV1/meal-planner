import { useState } from "react";
import { useProfile } from "@/modules/profile/ProfileContext";
import { ALLERGEN_OPTIONS, DIET_OPTIONS, MEMBER_LABEL } from "@/modules/profile/rules";
import { DEFAULT_SETTINGS as S } from "@/modules/settings/defaults";
import { getSignals } from "@/modules/signals/signals";

/** Placeholder Home: menu (weekly/daily), + Add reel, settings defaults. Built out next. */
export function Home({ onRestart }: { onRestart: () => void }) {
  const { profile } = useProfile();
  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const signals = getSignals();

  const counts = profile.members.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] ?? 0) + 1;
    return acc;
  }, {});
  const household = Object.entries(counts)
    .map(([t, n]) => `${n} ${MEMBER_LABEL[t as keyof typeof MEMBER_LABEL].toLowerCase()}${n > 1 ? "s" : ""}`)
    .join(", ");

  return (
    <div className="home">
      <div className="home-top">
        <h1>Your meals</h1>
        <button className="btn btn-primary" title="Coming next: Instagram reel import in 3 clicks">
          + Add reel
        </button>
      </div>

      <div className="panel">
        <div className="home-top" style={{ marginBottom: 12 }}>
          <strong>Menu</strong>
          <div className="seg">
            <button className={view === "weekly" ? "on" : ""} onClick={() => setView("weekly")}>
              Weekly
            </button>
            <button className={view === "daily" ? "on" : ""} onClick={() => setView("daily")}>
              Daily
            </button>
          </div>
        </div>
        <p className="sub" style={{ margin: 0 }}>
          Your first {view} menu arrives {S.menuArrives.day} at {S.menuArrives.time}.
        </p>
      </div>

      <div className="panel">
        <strong>Your household</strong>
        <dl className="kv" style={{ marginTop: 12 }}>
          <dt>Members</dt>
          <dd>{household}</dd>
          <dt>Diet</dt>
          <dd>{DIET_OPTIONS.find((d) => d.id === profile.diet)?.label}</dd>
          <dt>Allergies</dt>
          <dd>{[
              ...profile.allergies.map((a) => ALLERGEN_OPTIONS.find((o) => o.id === a)?.label ?? a),
              ...profile.otherAllergies,
            ].join(", ") || "None"}</dd>
          <dt>Favorites</dt>
          <dd>{profile.favoriteMealIds.length + profile.customMeals.length} meals</dd>
          <dt>Sample Monday ratings</dt>
          <dd>
            {signals.filter((s) => s.verdict === "up").length} 👍 · {signals.filter((s) => s.verdict === "down").length} 👎
          </dd>
        </dl>
      </div>

      <div className="panel">
        <strong>Settings (defaults)</strong>
        <dl className="kv" style={{ marginTop: 12 }}>
          <dt>Meals & days</dt>
          <dd>Breakfast, lunch, snack, dinner · {S.days} days</dd>
          <dt>Weekday cooking</dt>
          <dd>
            B+L {S.cookingTime.weekday.breakfastLunch} min · Snack {S.cookingTime.weekday.snack} min · Dinner{" "}
            {S.cookingTime.weekday.dinner} min
          </dd>
          <dt>Weekend cooking</dt>
          <dd>
            B+L {S.cookingTime.weekend.breakfastLunch} min · Snack {S.cookingTime.weekend.snack} min · Dinner{" "}
            {S.cookingTime.weekend.dinner} min
          </dd>
          <dt>Equipment</dt>
          <dd>{S.equipment.join(", ")}</dd>
          <dt>Batch cooking</dt>
          <dd>Main meals off · snacks allowed</dd>
          <dt>Menu arrives</dt>
          <dd>
            {S.menuArrives.day} {S.menuArrives.time}
          </dd>
          <dt>Grocery day</dt>
          <dd>{S.groceryDay}</dd>
        </dl>
      </div>

      <button className="link" onClick={onRestart}>
        Restart onboarding (prototype)
      </button>
    </div>
  );
}
