// Pizza Hut UK menu (representative). Quantities are demo-grade BOM (bill of materials)
// per item, used to explode forecasted demand into ingredient requirements.
//
// Source of truth for naming/positioning conceptually drawn from https://www.pizzahut.co.uk/

export type Category = "Pizza" | "Side" | "Drink" | "Dessert";

export type IngredientId =
  | "dough_large" // count of dough balls (large)
  | "dough_medium"
  | "tomato_sauce_ml"
  | "mozzarella_g"
  | "pepperoni_g"
  | "ham_g"
  | "chicken_g"
  | "beef_g"
  | "sausage_g"
  | "bbq_sauce_ml"
  | "onion_g"
  | "pepper_g"
  | "mushroom_g"
  | "sweetcorn_g"
  | "pineapple_g"
  | "jalapeno_g"
  | "garlic_butter_ml"
  | "wing_pieces"
  | "potato_g"
  | "cookie_dough_g"
  | "ice_cream_g"
  | "soda_ml"
  | "juice_ml"
  | "water_ml";

export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  size?: "regular" | "large";
  price: number; // GBP
  popularity: number; // base weight 0..1
  promoBoost?: number; // additional weekend-promo weight
  bom: Partial<Record<IngredientId, number>>;
};

export const MENU: MenuItem[] = [
  // ===== Pizzas =====
  {
    id: "pz_margherita_l",
    name: "Margherita",
    category: "Pizza",
    size: "large",
    price: 14.99,
    popularity: 0.10,
    bom: { dough_large: 1, tomato_sauce_ml: 90, mozzarella_g: 180 },
  },
  {
    id: "pz_pepperoni_l",
    name: "Pepperoni Feast",
    category: "Pizza",
    size: "large",
    price: 18.49,
    popularity: 0.16,
    promoBoost: 0.06,
    bom: {
      dough_large: 1,
      tomato_sauce_ml: 90,
      mozzarella_g: 200,
      pepperoni_g: 110,
    },
  },
  {
    id: "pz_meatfeast_l",
    name: "Meat Feast",
    category: "Pizza",
    size: "large",
    price: 19.99,
    popularity: 0.14,
    promoBoost: 0.07,
    bom: {
      dough_large: 1,
      tomato_sauce_ml: 90,
      mozzarella_g: 200,
      pepperoni_g: 60,
      ham_g: 60,
      beef_g: 50,
      sausage_g: 50,
    },
  },
  {
    id: "pz_veghotone_l",
    name: "Vegetarian Hot One",
    category: "Pizza",
    size: "large",
    price: 17.49,
    popularity: 0.06,
    bom: {
      dough_large: 1,
      tomato_sauce_ml: 90,
      mozzarella_g: 180,
      onion_g: 30,
      pepper_g: 30,
      jalapeno_g: 25,
      mushroom_g: 25,
    },
  },
  {
    id: "pz_bbqamericano_l",
    name: "BBQ Americano",
    category: "Pizza",
    size: "large",
    price: 18.99,
    popularity: 0.09,
    bom: {
      dough_large: 1,
      bbq_sauce_ml: 90,
      mozzarella_g: 200,
      chicken_g: 80,
      onion_g: 30,
    },
  },
  {
    id: "pz_hawaiian_l",
    name: "Hawaiian",
    category: "Pizza",
    size: "large",
    price: 16.99,
    popularity: 0.07,
    bom: {
      dough_large: 1,
      tomato_sauce_ml: 90,
      mozzarella_g: 180,
      ham_g: 70,
      pineapple_g: 60,
    },
  },
  {
    id: "pz_supersupreme_l",
    name: "Super Supreme",
    category: "Pizza",
    size: "large",
    price: 20.49,
    popularity: 0.08,
    bom: {
      dough_large: 1,
      tomato_sauce_ml: 90,
      mozzarella_g: 200,
      pepperoni_g: 50,
      ham_g: 40,
      beef_g: 40,
      onion_g: 25,
      pepper_g: 25,
      mushroom_g: 25,
    },
  },
  {
    id: "pz_veggiesupreme_m",
    name: "Veggie Supreme",
    category: "Pizza",
    size: "regular",
    price: 13.49,
    popularity: 0.05,
    bom: {
      dough_medium: 1,
      tomato_sauce_ml: 70,
      mozzarella_g: 140,
      onion_g: 25,
      pepper_g: 25,
      mushroom_g: 25,
      sweetcorn_g: 25,
    },
  },
  {
    id: "pz_create_m",
    name: "Create Your Own",
    category: "Pizza",
    size: "regular",
    price: 12.99,
    popularity: 0.07,
    bom: {
      dough_medium: 1,
      tomato_sauce_ml: 70,
      mozzarella_g: 140,
      pepperoni_g: 30,
      onion_g: 20,
      pepper_g: 20,
    },
  },

  // ===== Sides =====
  {
    id: "sd_garlicbread",
    name: "Garlic Bread",
    category: "Side",
    price: 4.49,
    popularity: 0.18,
    bom: { dough_medium: 0.5, garlic_butter_ml: 40 },
  },
  {
    id: "sd_cheesybites",
    name: "Cheesy Bites",
    category: "Side",
    price: 5.49,
    popularity: 0.10,
    bom: { dough_medium: 0.5, mozzarella_g: 80 },
  },
  {
    id: "sd_wings",
    name: "Chicken Wings",
    category: "Side",
    price: 6.99,
    popularity: 0.12,
    promoBoost: 0.04,
    bom: { wing_pieces: 8, bbq_sauce_ml: 30 },
  },
  {
    id: "sd_wedges",
    name: "Potato Wedges",
    category: "Side",
    price: 4.29,
    popularity: 0.09,
    bom: { potato_g: 200 },
  },
  {
    id: "sd_dippers",
    name: "Mozzarella Dippers",
    category: "Side",
    price: 4.99,
    popularity: 0.07,
    bom: { mozzarella_g: 120, tomato_sauce_ml: 40 },
  },

  // ===== Drinks =====
  {
    id: "dr_pepsi",
    name: "Pepsi 1.5L",
    category: "Drink",
    price: 3.49,
    popularity: 0.18,
    bom: { soda_ml: 1500 },
  },
  {
    id: "dr_pepsimax",
    name: "Pepsi Max 1.5L",
    category: "Drink",
    price: 3.49,
    popularity: 0.16,
    bom: { soda_ml: 1500 },
  },
  {
    id: "dr_7up",
    name: "7UP 1.5L",
    category: "Drink",
    price: 3.49,
    popularity: 0.07,
    bom: { soda_ml: 1500 },
  },
  {
    id: "dr_j2o",
    name: "J2O Orange & Passionfruit",
    category: "Drink",
    price: 2.49,
    popularity: 0.05,
    bom: { juice_ml: 275 },
  },
  {
    id: "dr_water",
    name: "Still Water 500ml",
    category: "Drink",
    price: 1.49,
    popularity: 0.04,
    bom: { water_ml: 500 },
  },

  // ===== Desserts =====
  {
    id: "ds_cookiedough",
    name: "Cookie Dough",
    category: "Dessert",
    price: 5.49,
    popularity: 0.10,
    promoBoost: 0.03,
    bom: { cookie_dough_g: 180, ice_cream_g: 60 },
  },
  {
    id: "ds_icecream",
    name: "Ice Cream Factory",
    category: "Dessert",
    price: 4.99,
    popularity: 0.06,
    bom: { ice_cream_g: 150 },
  },
  {
    id: "ds_fudgecake",
    name: "Chocolate Fudge Cake",
    category: "Dessert",
    price: 4.79,
    popularity: 0.05,
    bom: { cookie_dough_g: 60, ice_cream_g: 50 },
  },
];

export const INGREDIENT_LABEL: Record<IngredientId, string> = {
  dough_large: "Dough balls (large)",
  dough_medium: "Dough balls (medium)",
  tomato_sauce_ml: "Tomato sauce (ml)",
  mozzarella_g: "Mozzarella (g)",
  pepperoni_g: "Pepperoni (g)",
  ham_g: "Ham (g)",
  chicken_g: "Chicken (g)",
  beef_g: "Beef (g)",
  sausage_g: "Sausage (g)",
  bbq_sauce_ml: "BBQ sauce (ml)",
  onion_g: "Onion (g)",
  pepper_g: "Peppers (g)",
  mushroom_g: "Mushroom (g)",
  sweetcorn_g: "Sweetcorn (g)",
  pineapple_g: "Pineapple (g)",
  jalapeno_g: "Jalapeño (g)",
  garlic_butter_ml: "Garlic butter (ml)",
  wing_pieces: "Wings (pieces)",
  potato_g: "Potato (g)",
  cookie_dough_g: "Cookie dough (g)",
  ice_cream_g: "Ice cream (g)",
  soda_ml: "Soda (ml)",
  juice_ml: "Juice (ml)",
  water_ml: "Water (ml)",
};

export const ITEMS_BY_CAT = {
  Pizza: MENU.filter((m) => m.category === "Pizza"),
  Side: MENU.filter((m) => m.category === "Side"),
  Drink: MENU.filter((m) => m.category === "Drink"),
  Dessert: MENU.filter((m) => m.category === "Dessert"),
};

export function getMenuItem(id: string) {
  return MENU.find((m) => m.id === id);
}
