# Meal Planner

A mobile-first meal planning web app hosted on GitHub Pages. Plan your week of meals, track nutrition, manage batch cooking, and build a smarter shopping list — all stored locally in your browser with no backend required.

**Live app:** https://norrateng.github.io/meal_planner/

---

## Features

### Week View
- 7-day meal plan with **lunch**, **dinner**, and a **sweet treat** per day
- Daily calorie and protein totals with colour indicators (red if over/under target)
- **Protein add-ons** suggested automatically when your daily target isn't met from meals alone (e.g. fried eggs, Greek yoghurt, protein shake)
- Mark individual meals as **eaten** — cards turn green and the name strikes through
- **Archive** the current week with a label and start a fresh plan

### Meal Swapping
- Tap **Swap** on any meal to open a searchable recipe picker
- Recipes are ranked by your ratings and which ingredients you already have in your cupboard
- Swapping a batch-cooked meal automatically updates **all repeat days** in the same batch group

### Recipe Book
- Browse all 50 recipes with search and filter by cuisine or meal type
- Tap any recipe to see the full method, ingredients, prep notes, and nutritional breakdown

### Batch Cooking
- Cook once, eat across the week — the planner auto-schedules repeat servings on day +1 and days +4/+5
- Batch size is configurable (default 4 servings)
- Shopping list only counts ingredients once per batch group

### Shopping List
- Ingredients grouped by supermarket aisle (meat, produce, dairy, cupboard, international, frozen, bakery)
- Quantities scaled automatically by batch size
- Substitutes shown for harder-to-find ingredients
- **Checking an item adds it to your cupboard** automatically; unchecking removes it

### Cupboard Tracker
- Track leftover and unused ingredients from previous weeks
- Meal generation is **biased toward recipes that use what you already have** (up to 3× weight bonus)
- "Use week's ingredients" button deducts cooked ingredients from your stock
- Add or edit items manually at any time

### Nutrition
- Per-meal macro breakdown: calories, protein, carbs, fat
- Macro ring chart in the meal detail view
- **Nutrition adjuster** — increase protein on a specific meal and the recipe scales the primary protein ingredient accordingly, rebalancing carbs if calories drift

### Ratings & History
- Thumbs up / thumbs down on any meal — ratings influence future plan generation
- Highly-rated recipes appear more often; downvoted ones less
- Past weeks saved to History with expandable day-by-day view

### Settings
- Daily calorie target (default 1600 kcal)
- Daily protein target (default 150 g)
- Default batch size
- Metric / Imperial unit toggle

---

## Recipe Pool

50 curated recipes across 9 cuisines, all using ingredients available in UK supermarkets. Exotic ingredients include a substitute alternative.

| Cuisine | Count |
|---|---|
| British | 8 |
| Italian | 6 |
| Indian | 6 |
| Mexican | 5 |
| Mediterranean | 5 |
| Thai | 4 |
| Japanese | 4 |
| American | 4 |
| Chinese | 4 |
| Sweet treats | 8 |

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + React Testing Library |
| Persistence | localStorage (no backend) |
| Deployment | GitHub Actions → GitHub Pages |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── WeekView.jsx        # 7-day plan view
│   ├── DayCard.jsx         # Single day with meal slots
│   ├── MealCard.jsx        # Meal row with rating, eaten, swap
│   ├── SwapPicker.jsx      # Recipe picker modal
│   ├── MealDetail.jsx      # Macro ring + nutrition adjuster
│   ├── RecipeView.jsx      # Full recipe modal
│   ├── Recipes.jsx         # Recipe book tab
│   ├── ShoppingList.jsx    # Aisle-grouped shopping list
│   ├── Cupboard.jsx        # Pantry stock tracker
│   ├── History.jsx         # Archived weeks
│   └── Settings.jsx        # User preferences
├── utils/
│   ├── planGenerator.js    # Weighted recipe selection + calorie optimisation
│   ├── planStore.js        # React hook for plan state
│   ├── batchScheduler.js   # Auto-schedule batch repeat slots
│   ├── nutritionAdjuster.js # Protein scaling + macro rebalancing
│   ├── shoppingList.js     # Ingredient aggregation by aisle
│   ├── cupboard.js         # Cupboard scoring + ingredient deduction
│   ├── storage.js          # localStorage helpers
│   └── units.js            # Metric / Imperial conversion
└── data/
    └── recipes.json        # 50 recipe definitions
```

---

## Data & Privacy

All data is stored in your browser's `localStorage`. Nothing is sent to any server. Clearing your browser data will reset the app.
