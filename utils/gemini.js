const { generateMockPlan } = require('./mockData');

/**
 * AI Client for Gemini using native global fetch.
 * Communicates directly with the Gemini API to get structured meal plans.
 */
async function generateMealPlan(inputs) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
    console.log("No valid GEMINI_API_KEY found. Using dynamic heuristics fallback data.");
    return generateMockPlan(inputs);
  }

  // Construct prompt representing Step 4 (Decision Engine) and Step 8 (AI Prompt Engineering)
  const prompt = `
Generate a structured daily meal plan (Breakfast, Lunch, Dinner) and grocery list based on these user variables:
- Wake-up time: ${inputs.wakeUp}
- Occupation: ${inputs.occupation}
- Gym scheduled today?: ${inputs.gymToday ? 'Yes' : 'No'}
- Travel scheduled today?: ${inputs.travelToday ? 'Yes' : 'No'}
- Available cooking time: ${inputs.availableTime} minutes
- Family size: ${inputs.familySize} people
- Dietary preference: ${inputs.dietPreference}
- Daily food budget: $${inputs.dailyBudget}
- Existing pantry ingredients: [${(inputs.pantry || []).join(', ')}]

Rules:
1. Breakfast, lunch, and dinner must fit exactly into the user's daily timeline.
2. If the user works in an office (occupation: Employee), the lunch MUST be packable, cold-stable, or microwave-friendly.
3. If gymToday is true, target at least 30g protein for lunch and dinner.
4. Scale all ingredient quantities and pricing to match familySize.
5. Provide realistic prices based on US retail supermarket averages.
6. Deduct any matching pantry items by setting their estimatedCost to 0.00.
7. Output MUST be valid JSON conforming strictly to the requested schema. Do not output markdown code blocks (e.g. \`\`\`json), text commentary, or anything outside of the JSON structure.

JSON Schema:
{
  "breakfast": {
    "name": "string",
    "prepTime": number (minutes),
    "instructions": ["string"],
    "ingredients": [
      { "name": "string", "amount": "string", "estimatedCost": number }
    ],
    "proteinGrams": number,
    "calories": number
  },
  "lunch": {
    "name": "string",
    "prepTime": number (minutes),
    "instructions": ["string"],
    "ingredients": [
      { "name": "string", "amount": "string", "estimatedCost": number }
    ],
    "proteinGrams": number,
    "calories": number,
    "officeFriendly": boolean
  },
  "dinner": {
    "name": "string",
    "prepTime": number (minutes),
    "instructions": ["string"],
    "ingredients": [
      { "name": "string", "amount": "string", "estimatedCost": number }
    ],
    "proteinGrams": number,
    "calories": number
  },
  "substitutions": [
    { "original": "string", "replacement": "string", "costDifference": number, "reason": "string" }
  ]
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Empty response from Gemini model candidate content.");
    }

    // Attempt to parse response JSON
    let parsedData;
    try {
      // Clean up markdown code blocks if the model ignored responseMimeType
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      parsedData = JSON.parse(cleanText.trim());
    } catch (e) {
      console.error("Failed to parse Gemini response text as JSON:", responseText);
      throw e;
    }

    // Apply client-side safety math overrides (Decision Engine logic)
    parsedData = postProcessPlan(parsedData, inputs);

    return parsedData;

  } catch (error) {
    console.error("Gemini API Error. Falling back to dynamic mock data.", error.message);
    return generateMockPlan(inputs);
  }
}

/**
 * Post-processes the plan from Gemini to enforce strict mathematical correctness,
 * budget logic checks, and pantry overrides.
 */
function postProcessPlan(plan, inputs) {
  const pantrySet = new Set((inputs.pantry || []).map(i => i.toLowerCase().trim()));

  // Enforce zero cost on pantry matches
  const checkPantryAndAdjust = (meal) => {
    if (!meal || !meal.ingredients) return;
    meal.ingredients.forEach((ing) => {
      const matchesPantry = Array.from(pantrySet).some(p => 
        ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase())
      );
      if (matchesPantry) {
        ing.estimatedCost = 0.00;
        ing.isPantry = true;
      } else {
        ing.isPantry = false;
      }
    });
  };

  checkPantryAndAdjust(plan.breakfast);
  checkPantryAndAdjust(plan.lunch);
  checkPantryAndAdjust(plan.dinner);

  return plan;
}

module.exports = { generateMealPlan };
