import type { Allergen, FoodCategory, MealType } from "@/modules/profile/types";

/**
 * Standard meal catalog (seed data for the prototype).
 * Attributes are what the rules engine filters on and what feedback
 * signals attach to (cuisine, main ingredient, prep time).
 */
export interface CatalogMeal {
  id: string;
  name: string;
  mealType: MealType;
  cuisine: string;
  main: string; // main ingredient
  prepMinutes: number; // active minutes per day it's served
  contains: FoodCategory[];
  allergens: Allergen[];
  kidFriendly: boolean;
  toddlerFriendly: boolean;
  batchDays?: number; // snacks that can be batch-prepped
}

const m = (
  id: string,
  name: string,
  mealType: MealType,
  cuisine: string,
  main: string,
  prepMinutes: number,
  contains: FoodCategory[],
  allergens: Allergen[],
  kid: boolean,
  toddler: boolean,
  batchDays?: number,
): CatalogMeal => ({
  id, name, mealType, cuisine, main, prepMinutes, contains, allergens,
  kidFriendly: kid, toddlerFriendly: toddler, batchDays,
});

export const CATALOG: CatalogMeal[] = [
  // Breakfast
  m("b_poha", "Vegetable poha", "breakfast", "Indian", "flattened rice", 15, [], ["peanuts"], true, true),
  m("b_upma", "Rava upma", "breakfast", "Indian", "semolina", 15, [], ["wheat"], true, true),
  m("b_idli", "Idli with chutney", "breakfast", "Indian", "rice & lentil", 10, [], [], true, true),
  m("b_paratha", "Aloo paratha + curd", "breakfast", "Indian", "potato", 25, ["dairy"], ["wheat", "milk"], true, false),
  m("b_oats", "Overnight oats with fruit", "breakfast", "American", "oats", 5, ["dairy"], ["milk"], true, true),
  m("b_pancakes", "Banana pancakes", "breakfast", "American", "banana", 15, ["egg", "dairy"], ["eggs", "wheat", "milk"], true, true),
  m("b_eggs", "Scrambled eggs on toast", "breakfast", "American", "eggs", 10, ["egg", "dairy"], ["eggs", "wheat", "milk"], true, true),
  m("b_besan", "Besan chilla", "breakfast", "Indian", "chickpea flour", 15, [], [], true, true),
  m("b_smoothie", "PB banana smoothie bowl", "breakfast", "American", "banana", 5, [], ["peanuts"], true, true),

  // Lunch
  m("l_rajma", "Rajma chawal", "lunch", "Indian", "kidney beans", 15, [], [], true, true),
  m("l_dal", "Dal rice + ghee", "lunch", "Indian", "lentils", 15, ["dairy"], ["milk"], true, true),
  m("l_curdrice", "Curd rice", "lunch", "Indian", "rice", 10, ["dairy"], ["milk"], true, true),
  m("l_wrap", "Chicken caesar wrap", "lunch", "American", "chicken", 15, ["poultry", "dairy", "egg"], ["wheat", "milk", "eggs", "fish"], false, false),
  m("l_pasta", "Veggie pasta salad", "lunch", "Italian", "pasta", 15, [], ["wheat"], true, true),
  m("l_quesadilla", "Bean & cheese quesadilla", "lunch", "Mexican", "beans", 10, ["dairy"], ["wheat", "milk"], true, true),
  m("l_friedrice", "Egg fried rice", "lunch", "Chinese", "rice", 15, ["egg"], ["eggs", "soy"], true, true),
  m("l_tuna", "Tuna sandwich", "lunch", "American", "tuna", 10, ["fish", "egg"], ["fish", "eggs", "wheat"], true, false),
  m("l_chana", "Chana masala + roti", "lunch", "Indian", "chickpeas", 20, [], ["wheat"], true, false),

  // Snack
  m("s_fruit", "Fruit + yogurt", "snack", "Any", "fruit", 5, ["dairy"], ["milk"], true, true),
  m("s_makhana", "Roasted makhana", "snack", "Indian", "fox nuts", 5, [], [], true, false, 5),
  m("s_energy", "Date energy balls", "snack", "Any", "dates", 5, [], ["tree_nuts"], true, false, 5),
  m("s_hummus", "Hummus + veggie sticks", "snack", "Mediterranean", "chickpeas", 5, [], ["sesame"], true, true, 4),
  m("s_muffin", "Banana oat muffins", "snack", "American", "banana", 5, ["egg", "dairy"], ["eggs", "wheat", "milk"], true, true, 4),
  m("s_chaat", "Fruit chaat", "snack", "Indian", "fruit", 10, [], [], true, true),
  m("s_chana", "Roasted chana", "snack", "Indian", "chickpeas", 5, [], [], true, false, 7),
  m("s_cheese", "Cheese + crackers", "snack", "American", "cheese", 5, ["dairy"], ["milk", "wheat"], true, true),

  // Dinner
  m("d_paneerwrap", "Paneer wraps", "dinner", "Indian", "paneer", 25, ["dairy"], ["milk", "wheat"], true, true),
  m("d_khichdi", "Moong dal khichdi", "dinner", "Indian", "lentils", 20, [], [], true, true),
  m("d_butterchicken", "Butter chicken + rice", "dinner", "Indian", "chicken", 30, ["poultry", "dairy"], ["milk", "tree_nuts"], true, false),
  m("d_tacos", "Black bean tacos", "dinner", "Mexican", "black beans", 20, [], [], true, false),
  m("d_salmon", "Sheet-pan salmon + veggies", "dinner", "American", "salmon", 25, ["fish"], ["fish"], true, true),
  m("d_pasta", "Tomato basil pasta", "dinner", "Italian", "pasta", 20, [], ["wheat"], true, true),
  m("d_stirfry", "Tofu veggie stir-fry", "dinner", "Chinese", "tofu", 20, [], ["soy", "sesame"], true, false),
  m("d_palak", "Palak paneer + roti", "dinner", "Indian", "spinach", 30, ["dairy"], ["milk", "wheat"], true, true),
  m("d_shrimp", "Garlic shrimp rice bowl", "dinner", "Asian", "shrimp", 20, ["shellfish"], ["shellfish", "soy"], false, false),
  m("d_soup", "Lentil vegetable soup", "dinner", "Any", "lentils", 25, [], [], true, true),
];

export const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "snack", label: "Snack" },
  { id: "dinner", label: "Dinner" },
];

export const findMeal = (id: string) => CATALOG.find((x) => x.id === id);
