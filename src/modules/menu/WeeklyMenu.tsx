import { Fragment, useEffect, useState } from "react";
import { findMeal, MEAL_TYPES } from "@/modules/catalog/meals";
import { useProfile } from "@/modules/profile/ProfileContext";
import { MEMBER_LABEL, youngestKidType } from "@/modules/profile/rules";
import type { MealType } from "@/modules/profile/types";
import { DEFAULT_SETTINGS as S } from "@/modules/settings/defaults";
import { getSignals } from "@/modules/signals/signals";
import {
  cookingMinutes,
  dayBudget,
  fromISODate,
  generateWeek,
  loadWeek,
  planningWeekStart,
  saveWeek,
  toISODate,
  type MenuDay,
  type MenuSlot,
  type WeekMenu,
} from "./weekPlanner";

const weekday = (iso: string, style: "short" | "long" = "short") =>
  fromISODate(iso).toLocaleDateString(undefined, { weekday: style });
const monthDay = (iso: string) => fromISODate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const TAG_LABEL = { favorite: "★ Favorite", liked: "👍 Liked", new: "New" } as const;

/**
 * Weekly menu (core loop screen 1).
 * Prototype stand-in for the Saturday 9am run: if there's no menu for the current
 * planning week, one is generated when the screen opens. "Re-plan week" makes a new one.
 */
export function WeeklyMenu() {
  const { profile } = useProfile();
  const [week, setWeek] = useState<WeekMenu>(() => {
    const stored = loadWeek();
    if (stored && stored.weekStart === toISODate(planningWeekStart())) return stored;
    return generateWeek(profile, S, getSignals());
  });
  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const today = toISODate(new Date());
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, week.days.findIndex((d) => d.date === today)));

  useEffect(() => saveWeek(week), [week]);

  const replan = () => setWeek(generateWeek(profile, S, getSignals()));
  const openDay = (i: number) => {
    setDayIndex(i);
    setView("daily");
  };

  const youngest = youngestKidType(profile.members);
  const kidsLabel = youngest ? `Kids (${MEMBER_LABEL[youngest].toLowerCase()}s)` : "Kids";
  const first = week.days[0];
  const last = week.days[week.days.length - 1];

  return (
    <div className="panel">
      <div className="menu-toolbar">
        <div>
          <strong>
            Week of {monthDay(first.date)} – {monthDay(last.date)}
          </strong>
          <div className="cell-meta">
            Next menu arrives {S.menuArrives.day} {S.menuArrives.time} · groceries {S.groceryDay}
          </div>
        </div>
        <div className="menu-toolbar-right">
          <div className="seg">
            <button className={view === "weekly" ? "on" : ""} onClick={() => setView("weekly")}>
              Weekly
            </button>
            <button className={view === "daily" ? "on" : ""} onClick={() => setView("daily")}>
              Daily
            </button>
          </div>
          <button className="btn" onClick={replan} title="Make a new menu for this week">
            ↻ Re-plan week
          </button>
        </div>
      </div>

      {view === "weekly" ? (
        <WeekGrid week={week} today={today} onOpenDay={openDay} />
      ) : (
        <DayView
          week={week}
          today={today}
          index={dayIndex}
          onSelect={setDayIndex}
          kidsLabel={kidsLabel}
        />
      )}
    </div>
  );
}

// ---------- weekly ----------

function WeekGrid({ week, today, onOpenDay }: { week: WeekMenu; today: string; onOpenDay: (i: number) => void }) {
  return (
    <div className="week-scroll">
      <div className="week-grid" style={{ gridTemplateColumns: `96px repeat(${week.days.length}, minmax(112px, 1fr))` }}>
        <div className="week-head" />
        {week.days.map((d) => (
          <div key={d.date} className={`week-head ${d.date === today ? "today" : ""} ${d.weekend ? "weekend" : ""}`}>
            <div className="week-dow">{weekday(d.date)}</div>
            <div className="week-date">{monthDay(d.date)}</div>
            <Budget day={d} />
          </div>
        ))}

        {MEAL_TYPES.filter((t) => S.meals.includes(t.id)).map((t) => (
          <Fragment key={t.id}>
            <div className="week-type">{t.label}</div>
            {week.days.map((d, i) => (
              <button
                key={d.date}
                type="button"
                className={`week-cell ${d.date === today ? "today" : ""} ${d.weekend ? "weekend" : ""}`}
                onClick={() => onOpenDay(i)}
                aria-label={`${weekday(d.date, "long")} ${t.label}`}
              >
                <WeekCellBody day={d} type={t.id} />
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function WeekCellBody({ day, type }: { day: MenuDay; type: MealType }) {
  const a = day.adult[type];
  const k = day.kid?.[type];
  const name = (s: MenuSlot) => (s.mealId ? findMeal(s.mealId)?.name ?? "Unknown meal" : null);
  return (
    <>
      <span className={`week-name ${a.mealId ? "" : "pending"}`}>{name(a) ?? "AI will suggest"}</span>
      {a.batchFrom !== undefined && <span className="week-note">↻ from batch</span>}
      {k && !k.shared && <span className="week-kids">Kids: {name(k) ?? "AI will suggest"}</span>}
    </>
  );
}

function Budget({ day }: { day: MenuDay }) {
  const used = cookingMinutes(day);
  const budget = dayBudget(day, S);
  return (
    <div className={`week-budget ${used > budget ? "over" : ""}`} title="Hands-on cooking vs your time budget">
      {used} / {budget} min
    </div>
  );
}

// ---------- daily ----------

function DayView({
  week,
  today,
  index,
  onSelect,
  kidsLabel,
}: {
  week: WeekMenu;
  today: string;
  index: number;
  onSelect: (i: number) => void;
  kidsLabel: string;
}) {
  const day = week.days[index];
  const withKids = !!day.kid;
  const used = cookingMinutes(day);
  const budget = dayBudget(day, S);

  return (
    <div>
      <div className="day-pills" role="tablist">
        {week.days.map((d, i) => (
          <button
            key={d.date}
            role="tab"
            aria-selected={i === index}
            className={`day-pill ${i === index ? "on" : ""} ${d.date === today ? "today" : ""}`}
            onClick={() => onSelect(i)}
          >
            {weekday(d.date)} <small>{fromISODate(d.date).getDate()}</small>
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 18 }}>
        {weekday(day.date, "long")}, {monthDay(day.date)}
        {day.date === today && <span className="today-badge">Today</span>}
      </h2>

      <div className={`menu-grid ${withKids ? "" : "single"}`}>
        <div className="menu-head" />
        <div className="menu-head">Adults</div>
        {withKids && <div className="menu-head">{kidsLabel}</div>}
        {MEAL_TYPES.filter((t) => S.meals.includes(t.id)).map((t) => (
          <Fragment key={t.id}>
            <div className="menu-type">{t.label}</div>
            <div>
              <SlotDetail slot={day.adult[t.id]} week={week} />
            </div>
            {withKids && (
              <div>
                <SlotDetail slot={day.kid![t.id]} week={week} />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <p className={`hint ${used > budget ? "over" : ""}`}>
        Hands-on cooking: about {used} of your {budget} min ({day.weekend ? "weekend" : "weekday"} budget) · change in
        Settings.
      </p>
    </div>
  );
}

function SlotDetail({ slot, week }: { slot: MenuSlot; week: WeekMenu }) {
  if (!slot.mealId) return <div className="cell-meta">No match yet — AI will suggest one</div>;
  const meal = findMeal(slot.mealId);
  if (!meal) return <div className="cell-meta">Meal no longer in catalog</div>;

  const meta: string[] = [];
  if (slot.shared) meta.push("Same as adults");
  if (slot.batchFrom !== undefined) meta.push(`From ${weekday(week.days[slot.batchFrom].date)}'s batch`);
  else {
    meta.push(`${meal.prepMinutes} min`);
    if (meal.batchDays && isBatchStart(week, slot))
      meta.push(`batch — covers ${meal.batchDays} days`);
  }

  return (
    <div className="cell">
      <div>
        <div className="cell-name">{meal.name}</div>
        <div className="cell-meta">
          {meta.join(" · ")} · {meal.cuisine}
        </div>
      </div>
      {slot.tag && <span className={`tag tag-${slot.tag}`}>{TAG_LABEL[slot.tag]}</span>}
    </div>
  );
}

/** A batch snack's prep day: some later day in the week points back at it. */
function isBatchStart(week: WeekMenu, slot: MenuSlot): boolean {
  return week.days.some((d) =>
    [d.adult.snack, d.kid?.snack].some((s) => s?.mealId === slot.mealId && s?.batchFrom !== undefined),
  );
}
