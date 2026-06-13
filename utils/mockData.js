/**
 * Dynamic Mock Meal Generator
 * Simulates AI constraints-based reasoning to return realistic meal plans
 * matching user inputs if Gemini API is offline or missing keys.
 */
function generateMockPlan(inputs) {
  const {
    wakeUp = "07:00",
    occupation = "Remote Worker",
    gymToday = false,
    travelToday = false,
    availableTime = 30,
    familySize = 1,
    dietPreference = "None",
    dailyBudget = 20,
    pantry = []
  } = inputs;

  const isHighProtein = gymToday;
  const isBudgetRestricted = dailyBudget < 12;
  const isOffice = occupation === "Employee";
  const hasShortTime = availableTime <= 15;

  // Normalize pantry items for lookup
  const pantrySet = new Set(pantry.map(i => i.toLowerCase().trim()));

  // Cost calculator based on pantry matches
  const getCost = (name, basePrice) => {
    const isPantry = Array.from(pantrySet).some(p => name.toLowerCase().includes(p));
    return isPantry ? 0 : basePrice * familySize;
  };

  // 1. BREAKFAST
  let breakfastName = "Maple Pecan Oatmeal";
  let breakfastPrep = 10;
  let breakfastCals = 380;
  let breakfastProtein = 12;
  let breakfastIngs = [
    { name: "Rolled Oats", amount: `${80 * familySize}g`, estimatedCost: getCost("Oats", 0.50) },
    { name: "Pecans", amount: `${30 * familySize}g`, estimatedCost: getCost("Pecan", 1.00) },
    { name: "Maple Syrup", amount: `${2 * familySize} tbsp`, estimatedCost: getCost("Syrup", 0.40) }
  ];

  if (isHighProtein) {
    breakfastName = "Avocado & Egg White Scramble";
    breakfastPrep = 12;
    breakfastCals = 450;
    breakfastProtein = 32;
    breakfastIngs = [
      { name: "Large Eggs", amount: `${3 * familySize} pcs`, estimatedCost: getCost("Egg", 0.90) },
      { name: "Avocado", amount: `${1 * familySize} pc`, estimatedCost: getCost("Avocado", 1.50) },
      { name: "Whole Wheat Toast", amount: `${2 * familySize} slices`, estimatedCost: getCost("Toast", 0.40) }
    ];
  } else if (isBudgetRestricted) {
    breakfastName = "Classic Banana Oatmeal";
    breakfastPrep = 8;
    breakfastCals = 320;
    breakfastProtein = 8;
    breakfastIngs = [
      { name: "Rolled Oats", amount: `${80 * familySize}g`, estimatedCost: getCost("Oats", 0.50) },
      { name: "Bananas", amount: `${1 * familySize} pc`, estimatedCost: getCost("Banana", 0.25) }
    ];
  }

  // 2. LUNCH
  let lunchName = "Warm Quinoa Salad Bowl";
  let lunchPrep = 15;
  let lunchCals = 520;
  let lunchProtein = 14;
  let lunchFriendly = true;
  let lunchIngs = [
    { name: "Quinoa", amount: `${100 * familySize}g`, estimatedCost: getCost("Quinoa", 1.20) },
    { name: "Cucumber & Tomatoes", amount: `${150 * familySize}g`, estimatedCost: getCost("Tomato", 1.00) },
    { name: "Feta Cheese", amount: `${50 * familySize}g`, estimatedCost: getCost("Cheese", 1.20) }
  ];

  if (isOffice) {
    lunchName = "Packable Mediterranean Chicken Wrap";
    lunchPrep = 10;
    lunchCals = 580;
    lunchProtein = 34;
    lunchFriendly = true;
    lunchIngs = [
      { name: "Pre-cooked Chicken Breast", amount: `${150 * familySize}g`, estimatedCost: getCost("Chicken", 2.50) },
      { name: "Whole Wheat Tortilla", amount: `${1 * familySize} pc`, estimatedCost: getCost("Tortilla", 0.50) },
      { name: "Hummus & Spinach", amount: `${80 * familySize}g`, estimatedCost: getCost("Spinach", 0.80) }
    ];
  } else if (isHighProtein) {
    lunchName = "Lemon Herb Chicken & Rice Bowl";
    lunchPrep = 20;
    lunchCals = 650;
    lunchProtein = 42;
    lunchFriendly = false;
    lunchIngs = [
      { name: "Chicken Breast", amount: `${200 * familySize}g`, estimatedCost: getCost("Chicken", 3.00) },
      { name: "Jasmine Rice", amount: `${100 * familySize}g`, estimatedCost: getCost("Rice", 0.40) },
      { name: "Broccoli", amount: `${150 * familySize}g`, estimatedCost: getCost("Broccoli", 0.70) }
    ];
  } else if (isBudgetRestricted) {
    lunchName = "Spiced Lentil & Rice Soup";
    lunchPrep = 15;
    lunchCals = 440;
    lunchProtein = 18;
    lunchFriendly = true;
    lunchIngs = [
      { name: "Brown Lentils", amount: `${120 * familySize}g`, estimatedCost: getCost("Lentil", 0.60) },
      { name: "Jasmine Rice", amount: `${100 * familySize}g`, estimatedCost: getCost("Rice", 0.40) },
      { name: "Carrots & Celery", amount: `${100 * familySize}g`, estimatedCost: getCost("Carrot", 0.40) }
    ];
  }

  // 3. DINNER
  let dinnerName = "Baked Salmon with Quinoa";
  let dinnerPrep = 25;
  let dinnerCals = 680;
  let dinnerProtein = 45;
  let dinnerIngs = [
    { name: "Salmon Fillets", amount: `${180 * familySize}g`, estimatedCost: getCost("Salmon", 6.50) },
    { name: "Quinoa", amount: `${80 * familySize}g`, estimatedCost: getCost("Quinoa", 0.90) },
    { name: "Asparagus", amount: `${100 * familySize}g`, estimatedCost: getCost("Asparagus", 1.50) }
  ];

  if (isBudgetRestricted || hasShortTime) {
    dinnerName = "One-Pan Garlic Herb Tofu & Beans";
    dinnerPrep = 15;
    dinnerCals = 540;
    dinnerProtein = 28;
    dinnerIngs = [
      { name: "Firm Tofu", amount: `${200 * familySize}g`, estimatedCost: getCost("Tofu", 1.50) },
      { name: "Canned Black Beans", amount: `${1 * familySize} can`, estimatedCost: getCost("Bean", 0.90) },
      { name: "Mixed Bell Peppers", amount: `${150 * familySize}g`, estimatedCost: getCost("Pepper", 1.20) }
    ];
  } else if (isHighProtein) {
    dinnerName = "Sirloin Beef Stir-Fry with Rice Noodles";
    dinnerPrep = 20;
    dinnerCals = 740;
    dinnerProtein = 48;
    dinnerIngs = [
      { name: "Sirloin Beef", amount: `${200 * familySize}g`, estimatedCost: getCost("Beef", 5.50) },
      { name: "Rice Noodles", amount: `${120 * familySize}g`, estimatedCost: getCost("Noodle", 0.80) },
      { name: "Sugar Snap Peas & Bell Pepper", amount: `${150 * familySize}g`, estimatedCost: getCost("Pepper", 1.30) }
    ];
  }

  // Dietary Overrides
  if (dietPreference === "Vegan" || dietPreference === "Vegetarian") {
    // Override protein sources with plant-based options
    if (breakfastIngs.some(i => i.name.includes("Eggs") || i.name.includes("Chicken"))) {
      breakfastName = "Spiced Tofu Scramble with Toast";
      breakfastIngs = [
        { name: "Firm Tofu", amount: `${200 * familySize}g`, estimatedCost: getCost("Tofu", 1.50) },
        { name: "Whole Wheat Toast", amount: `${2 * familySize} slices`, estimatedCost: getCost("Toast", 0.40) },
        { name: "Spinach", amount: `${50 * familySize}g`, estimatedCost: getCost("Spinach", 0.50) }
      ];
      breakfastProtein = 22;
    }
    if (lunchIngs.some(i => i.name.includes("Chicken"))) {
      lunchName = "Packable Mediterranean Chickpea Wrap";
      lunchIngs = [
        { name: "Canned Chickpeas", amount: `${200 * familySize}g`, estimatedCost: getCost("Chickpea", 0.80) },
        { name: "Whole Wheat Tortilla", amount: `${1 * familySize} pc`, estimatedCost: getCost("Tortilla", 0.50) },
        { name: "Hummus & Olives", amount: `${100 * familySize}g`, estimatedCost: getCost("Hummus", 1.00) }
      ];
      lunchProtein = 18;
    }
    if (dinnerIngs.some(i => i.name.includes("Salmon") || i.name.includes("Beef"))) {
      dinnerName = "Rich Lentil Bolognese with Pasta";
      dinnerIngs = [
        { name: "Red Lentils", amount: `${120 * familySize}g`, estimatedCost: getCost("Lentil", 0.60) },
        { name: "Gluten-Free Pasta", amount: `${100 * familySize}g`, estimatedCost: getCost("Pasta", 0.80) },
        { name: "Marinara Tomato Sauce", amount: `${200 * familySize}g`, estimatedCost: getCost("Sauce", 1.00) }
      ];
      dinnerProtein = 24;
      dinnerPrep = 20;
    }
  }

  // Adjust instructions
  const breakfastInstructions = [
    `Rinse and cook the primary grain base in a medium saucepan.`,
    `Prepare toppings and fold them into the mixture.`,
    `Serve warm and enjoy within your morning window (estimated 8:30 AM).`
  ];
  const lunchInstructions = [
    `Mix ingredients in a bowl or roll them tightly inside the wraps.`,
    isOffice ? `Pack tightly into a sealed container and refrigerate for office lunch.` : `Reheat or serve immediately at lunch time.`
  ];
  const dinnerInstructions = [
    `Heat a heavy skillet or preheat the oven.`,
    `Season the primary protein source and cook thoroughly.`,
    `Serve accompanied with grains and greens.`
  ];

  // 4. SUBSTITUTIONS
  const substitutions = [
    { original: "Quinoa", replacement: "Jasmine Rice", costDifference: -0.80 * familySize, reason: "Cheaper and widely stocked grain alternative." },
    { original: "Salmon Fillets", replacement: "Firm Tofu", costDifference: -5.00 * familySize, reason: "Reduces budget significantly while keeping protein level high." },
    { original: "Chicken Breast", replacement: "Canned Black Beans", costDifference: -2.10 * familySize, reason: "Budget friendly plant protein swap." }
  ];

  return {
    breakfast: {
      name: breakfastName,
      prepTime: breakfastPrep,
      instructions: breakfastInstructions,
      ingredients: breakfastIngs,
      proteinGrams: breakfastProtein,
      calories: breakfastCals
    },
    lunch: {
      name: lunchName,
      prepTime: lunchPrep,
      instructions: lunchInstructions,
      ingredients: lunchIngs,
      proteinGrams: lunchProtein,
      calories: lunchCals,
      officeFriendly: lunchFriendly
    },
    dinner: {
      name: dinnerName,
      prepTime: dinnerPrep,
      instructions: dinnerInstructions,
      ingredients: dinnerIngs,
      proteinGrams: dinnerProtein,
      calories: dinnerCals
    },
    substitutions
  };
}

module.exports = { generateMockPlan };
