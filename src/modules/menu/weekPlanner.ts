import { storage } from "@/core/storage";
import { findMeal, MEAL_TYPES, type CatalogMeal } from "@/modules/catalog/meals";
import { hasKids } from "@/modules/profile/rules";
import type { HouseholdProfile, MealType } from "@/modules/profile/types";
import type { AppSettings, CookingTime } from "@/modules/settings/defaults";
import type { Signal } from "@/modules/signals/signals";
import { candidates, suitsAudience, type Audience } from "./rulesEngine";

/**
 * Weekly menu: 7 days × (breakfast, lunch, snack, dinner) × (adults, kids).
 *
 * Rules layer only. Hard rules (diet, allergies) come from `candidates`.
 * On top of that, a score per candidate:
 *   + favorites, + 👍 meals and their attributes (cuisine, main ingredient)
 *   − 👎 meals and their attributes, − repeats within the week, − same as yesterday
 *   + small seeded jitter so "Re-plan week" gives a different week.
 * Slots with no candidate stay empty (mealId: null) for the AI layer (aiFill) to fill later.
 * Stores meal ids, not meal objects, so catalog edits flow through.
 */

export type SlotTag = "favorite" | "liked" | "new";

export interface MenuSlot {
  mealId: string | null;
  tag?: SlotTag;
  /** Kids' slot is the same dish as the adults' (one-pot dinners). */
  shared?: boolean;
  /** Batch snack: index of the day it was prepped (only set on follow-on days). */
  batchFrom?: number;
}

export type MealSlots = Record<MealType, MenuSlot>;

export interface MenuDay {
  date: string; // YYYY-MM-DD, local time
  weekend: boolean;
  adult: MealSlots;
  kid: MealSlots | null;
}

export interface WeekMenu {
  weekStart: string; // Monday, YYYY-MM-DD
  generatedAt: string;
  seed: number;
  days: MenuDay[];
}

const MAX_REPEATS_PER_WEEK = 2;

// ---------- dates ----------

const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Menu arrives Saturday for the week ahead, so Sat/Sun plan next Monday; weekdays plan this week. */
export function planningWeekStart(today = new Date()): Date {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = d.getDay(); // 0 Sun … 6 Sat
  const delta = dow === 6 ? 2 : dow === 0 ? 1 : 1 - dow;
  d.setDate(d.getDate() + delta);
  return d;
}

// ---------- scoring ----------

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

interface Ctx {
  profile: HouseholdProfile;
  signals: Signal[];
  favorites: Set<string>;
  seed: number;
  withKids: boolean;
  /** uses[audience][mealId] = day indexes used */
  uses: Record<Audience, Map<string, number[]>>;
}

function score(meal: CatalogMeal, audience: Audience, day: number, ctx: Ctx): number {
  let s = 0;
  if (ctx.favorites.has(meal.id)) s += 4;
  // One dish for the whole family is less cooking: nudge adult picks the kids can share.
  if (audience === "adult" && ctx.withKids && suitsAudience(meal, "kid", ctx.profile)) s += 1.5;
  for (const sig of ctx.signals) {
    if (sig.audience !== audience) continue;
    const sign = sig.verdict === "up" ? 1 : -1;
    if (sig.mealId === meal.id) s += sig.verdict === "up" ? 3 : -8;
    else {
      if (sig.attributes.main === meal.main) s += sign * 1;
      if (sig.attributes.cuisine === meal.cuisine) s += sign * 0.5;
    }
  }
  const used = ctx.uses[audience].get(meal.id) ?? [];
  s -= used.length * 3;
  if (used.includes(day - 1)) s -= 4;
  s += hash(`${ctx.seed}:${audience}:${day}:${meal.id}`) * 1.5;
  return s;
}

function tagFor(meal: CatalogMeal, audience: Audience, ctx: Ctx): SlotTag {
  if (ctx.favorites.has(meal.id)) return "favorite";
  if (ctx.signals.some((s) => s.audience === audience && s.mealId === meal.id && s.verdict === "up")) return "liked";
  return "new";
}

function best(
  mealType: MealType,
  audience: Audience,
  maxMinutes: number,
  day: number,
  ctx: Ctx,
  only?: (m: CatalogMeal) => boolean,
): CatalogMeal | undefined {
  const all = candidates(ctx.profile, mealType, audience, maxMinutes).filter((m) => !only || only(m));
  // A 👎 on this exact dish (for this audience) rules it out unless nothing else fits.
  const notRejected = all.filter(
    (m) => !ctx.signals.some((s) => s.audience === audience && s.mealId === m.id && s.verdict === "down"),
  );
  const pool = notRejected.length ? notRejected : all;
  const fresh = pool.filter((m) => (ctx.uses[audience].get(m.id)?.length ?? 0) < MAX_REPEATS_PER_WEEK);
  const list = fresh.length ? fresh : pool; // small catalogs: allow extra repeats rather than empty slots
  let top: CatalogMeal | undefined;
  let topScore = -Infinity;
  for (const m of list) {
    const sc = score(m, audience, day, ctx);
    if (sc > topScore) {
      top = m;
      topScore = sc;
    }
  }
  return top;
}

function unmarkUsed(ctx: Ctx, audience: Audience, mealId: string, day: number) {
  const arr = (ctx.uses[audience].get(mealId) ?? []).filter((d) => d !== day);
  ctx.uses[audience].set(mealId, arr);
}

function markUsed(ctx: Ctx, audience: Audience, mealId: string, day: number) {
  const arr = ctx.uses[audience].get(mealId) ?? [];
  arr.push(day);
  ctx.uses[audience].set(mealId, arr);
}

const emptySlots = (): MealSlots => ({
  breakfast: { mealId: null },
  lunch: { mealId: null },
  snack: { mealId: null },
  dinner: { mealId: null },
});

// ---------- generation ----------

/** Cooking blocks from Settings: breakfast + lunch share one block; snack and dinner have their own. */
const BLOCKS: { types: MealType[]; budget: (t: CookingTime) => number }[] = [
  { types: ["breakfast", "lunch"], budget: (t) => t.breakfastLunch },
  { types: ["snack"], budget: (t) => t.snack },
  { types: ["dinner"], budget: (t) => t.dinner },
];

const kidRejected = (ctx: Ctx, mealId: string) =>
  ctx.signals.some((s) => s.audience === "kid" && s.mealId === mealId && s.verdict === "down");

export function generateWeek(
  profile: HouseholdProfile,
  settings: AppSettings,
  signals: Signal[],
  opts: { weekStart?: Date; seed?: number } = {},
): WeekMenu {
  const start = opts.weekStart ?? planningWeekStart();
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const withKids = hasKids(profile.members);
  const ctx: Ctx = {
    profile,
    signals,
    favorites: new Set(profile.favoriteMealIds),
    seed,
    withKids,
    uses: { adult: new Map(), kid: new Map() },
  };

  // Active batch snack per audience: which meal, prepped on which day, through which day.
  const batch: Record<Audience, { mealId: string; from: number; until: number } | null> = { adult: null, kid: null };
  const days: MenuDay[] = [];

  for (let i = 0; i < settings.days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const time: CookingTime = weekend ? settings.cookingTime.weekend : settings.cookingTime.weekday;
    const adult = emptySlots();
    const kid = withKids ? emptySlots() : null;

    const fill = (out: MealSlots, type: MealType, audience: Audience, meal: CatalogMeal, extra: Partial<MenuSlot> = {}) => {
      out[type] = { mealId: meal.id, tag: tagFor(meal, audience, ctx), ...extra };
      markUsed(ctx, audience, meal.id, i);
    };

    for (const block of BLOCKS) {
      const types = block.types.filter((t) => settings.meals.includes(t));
      const budget = block.budget(time);
      let used = 0; // hands-on minutes spent in this block, adults + kids

      // Minutes to hold back so later meals in the block (lunch after breakfast) still fit.
      const reserve = (audience: Audience, after: number) =>
        types.slice(after + 1).reduce((sum, t) => {
          const quickest = Math.min(Infinity, ...candidates(profile, t, audience, budget).map((m) => m.prepMinutes));
          return sum + (Number.isFinite(quickest) ? quickest : 0);
        }, 0);

      /** Best dish that fits the time left in the block (holding time back for later meals if possible). */
      const pickWithin = (type: MealType, audience: Audience, j: number) =>
        best(type, audience, budget - used - reserve(audience, j), i, ctx) ?? best(type, audience, budget - used, i, ctx);
      /** Last resort: best within the block's full budget. The day then shows as over budget. */
      const pickAny = (type: MealType, audience: Audience) => best(type, audience, budget, i, ctx);

      const takeBatch = (audience: Audience, out: MealSlots): boolean => {
        const b = batch[audience];
        if (b && i <= b.until) {
          out.snack = { mealId: b.mealId, tag: tagFor(findMeal(b.mealId)!, audience, ctx), batchFrom: b.from };
          return true;
        }
        batch[audience] = null;
        return false;
      };

      const maybeStartBatch = (audience: Audience, meal: CatalogMeal) => {
        if (settings.snacksAllowBatch && meal.batchDays && meal.batchDays > 1)
          batch[audience] = { mealId: meal.id, from: i, until: Math.min(i + meal.batchDays - 1, settings.days - 1) };
      };

      // Adults first.
      types.forEach((type, j) => {
        if (type === "snack" && takeBatch("adult", adult)) return;
        const meal = pickWithin(type, "adult", j) ?? pickAny(type, "adult");
        if (!meal) return;
        fill(adult, type, "adult", meal);
        used += meal.prepMinutes;
        if (type === "snack") maybeStartBatch("adult", meal);
      });

      if (!kid) continue;

      // Kids: keep their own batch going, else share the adults' dish if it suits them, else cook separately.
      types.forEach((type, j) => {
        if (type === "snack" && takeBatch("kid", kid)) return;
        const adultSlot = adult[type];
        const adultMeal = adultSlot.mealId ? findMeal(adultSlot.mealId) : undefined;
        if (adultMeal && suitsAudience(adultMeal, "kid", profile) && !kidRejected(ctx, adultMeal.id)) {
          fill(kid, type, "kid", adultMeal, { shared: true, batchFrom: adultSlot.batchFrom });
          return;
        }
        const own = pickWithin(type, "kid", j);
        // No time for a second dish: switch both columns to one the whole family can eat.
        if (!own && adultMeal && type !== "snack") {
          const kidsCanShare = (m: CatalogMeal) => suitsAudience(m, "kid", profile) && !kidRejected(ctx, m.id);
          const family = best(type, "adult", budget - used + adultMeal.prepMinutes, i, ctx, kidsCanShare);
          if (family) {
            unmarkUsed(ctx, "adult", adultMeal.id, i);
            fill(adult, type, "adult", family);
            used += family.prepMinutes - adultMeal.prepMinutes;
            fill(kid, type, "kid", family, { shared: true });
            return;
          }
        }
        const meal = own ?? pickAny(type, "kid");
        if (!meal) return;
        fill(kid, type, "kid", meal);
        used += meal.prepMinutes;
        if (type === "snack") maybeStartBatch("kid", meal);
      });
    }

    days.push({ date: toISODate(date), weekend, adult, kid });
  }

  return { weekStart: toISODate(start), generatedAt: new Date().toISOString(), seed, days };
}

// ---------- derived numbers for the UI ----------

/** Hands-on minutes for a day: each distinct dish cooked once; batch follow-on days are free. */
export function cookingMinutes(day: MenuDay): number {
  const ids = new Set<string>();
  for (const col of [day.adult, day.kid]) {
    if (!col) continue;
    for (const t of MEAL_TYPES) {
      const slot = col[t.id];
      if (slot.mealId && slot.batchFrom === undefined) ids.add(slot.mealId);
    }
  }
  let total = 0;
  ids.forEach((id) => (total += findMeal(id)?.prepMinutes ?? 0));
  return total;
}

export function dayBudget(day: MenuDay, settings: AppSettings): number {
  const t = day.weekend ? settings.cookingTime.weekend : settings.cookingTime.weekday;
  return t.breakfastLunch + t.snack + t.dinner;
}

// ---------- persistence ----------

const KEY = "weekMenu";
export const loadWeek = () => storage.get<WeekMenu | null>(KEY, null);
export const saveWeek = (w: WeekMenu) => storage.set(KEY, w);
export const clearWeek = () => storage.remove(KEY);
