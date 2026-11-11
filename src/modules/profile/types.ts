// Single source of truth for what onboarding captures.

export type MemberType = "adult" | "toddler" | "kid" | "teen";

export interface Member {
  id: string;
  type: MemberType;
}

export type DietType =
  | "vegan"
  | "lacto_vegetarian"
  | "ovo_vegetarian"
  | "lacto_ovo_vegetarian"
  | "pescatarian"
  | "non_vegetarian";

/** Ingredient categories that diet types include/exclude. */
export type FoodCategory = "meat" | "poultry" | "fish" | "shellfish" | "egg" | "dairy";

/** Major US allergens. */
export type Allergen =
  | "milk"
  | "eggs"
  | "peanuts"
  | "tree_nuts"
  | "wheat"
  | "soy"
  | "sesame"
  | "fish"
  | "shellfish";

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

/** A meal the user added themselves (from a photo of a meal plan or free text). */
export interface CustomMeal {
  id: string;
  name: string;
  mealType: MealType;
  day?: string; // e.g. "Friday" if the meal plan photo showed it
  source: "photo" | "text";
}

export interface HouseholdProfile {
  members: Member[];
  diet: DietType;
  allergies: Allergen[];
  otherAllergies: string[];
  foodsToSkip: string[];
  favoriteMealIds: string[]; // ids from the standard catalog
  customMeals: CustomMeal[];
  favoritesFreeText: string;
}
