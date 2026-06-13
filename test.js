/**
 * Automated Test Suite for DayDish.AI
 * Uses Node.js native test runner (node:test) and assertions (node:assert).
 * Run using: npm test (or node test.js)
 */

const test = require('node:test');
const assert = require('node:assert');
const { generateMockPlan } = require('./utils/mockData');

test('DayDish.AI Test Suite', async (t) => {

  await t.test('Pantry Ingredient Cost Exclusion Logic', () => {
    const inputs = {
      wakeUp: "07:00",
      occupation: "Remote Worker",
      gymToday: false,
      travelToday: false,
      availableTime: 30,
      familySize: 1,
      dietPreference: "None",
      dailyBudget: 20,
      pantry: ["Oats", "Egg"] // Oats and Eggs should cost $0.00
    };

    const plan = generateMockPlan(inputs);

    // Verify Oats in breakfast is free
    const oatsIng = plan.breakfast.ingredients.find(i => i.name.toLowerCase().includes('oats'));
    if (oatsIng) {
      assert.strictEqual(oatsIng.estimatedCost, 0, "Pantry item 'Oats' must have an estimated cost of 0");
    }
  });

  await t.test('Gym Enthusiast High Protein Heuristic', () => {
    const inputs = {
      wakeUp: "06:00",
      occupation: "Remote Worker",
      gymToday: true,
      travelToday: false,
      availableTime: 30,
      familySize: 1,
      dietPreference: "None",
      dailyBudget: 25,
      pantry: []
    };

    const plan = generateMockPlan(inputs);

    // Verify Breakfast scramble contains eggs and has high protein
    assert.strictEqual(plan.breakfast.name.includes("Scramble") || plan.breakfast.name.includes("Tofu"), true, "Gym scheduled should trigger high protein breakfast choice");
    assert.match(plan.breakfast.name, /Scramble/i);
    assert.ok(plan.breakfast.proteinGrams >= 30, `Gym breakfast protein should be >= 30g, got ${plan.breakfast.proteinGrams}g`);
  });

  await t.test('Office Employee Lunch Portability Heuristic', () => {
    const inputs = {
      wakeUp: "07:00",
      occupation: "Employee", // Office worker
      gymToday: false,
      travelToday: false,
      availableTime: 30,
      familySize: 1,
      dietPreference: "None",
      dailyBudget: 20,
      pantry: []
    };

    const plan = generateMockPlan(inputs);

    // Verify lunch is officeFriendly / packable
    assert.strictEqual(plan.lunch.officeFriendly, true, "Office worker lunch must be portable/officeFriendly");
    assert.match(plan.lunch.name, /Wrap/i, "Lunch should be a wrap or salad container");
  });

  await t.test('Budget Scaling logic by Family Size', () => {
    const inputsSingle = {
      wakeUp: "07:00",
      occupation: "Remote Worker",
      gymToday: false,
      travelToday: false,
      availableTime: 30,
      familySize: 1,
      dietPreference: "None",
      dailyBudget: 20,
      pantry: []
    };

    const inputsFamily = {
      ...inputsSingle,
      familySize: 4 // Scale factor = 4
    };

    const planSingle = generateMockPlan(inputsSingle);
    const planFamily = generateMockPlan(inputsFamily);

    // Verify ingredient scaling (oats should scale up)
    const oatsSingle = planSingle.breakfast.ingredients.find(i => i.name.includes('Oats'));
    const oatsFamily = planFamily.breakfast.ingredients.find(i => i.name.includes('Oats'));
    
    if (oatsSingle && oatsFamily) {
      assert.strictEqual(oatsFamily.amount, `${80 * 4}g`, "Ingredient quantity must scale by familySize");
      assert.strictEqual(oatsFamily.estimatedCost, oatsSingle.estimatedCost * 4, "Ingredient cost must scale by familySize");
    }
  });

  await t.test('Dietary Override Logic (Vegan / Vegetarian)', () => {
    const inputs = {
      wakeUp: "07:00",
      occupation: "Remote Worker",
      gymToday: false,
      travelToday: false,
      availableTime: 30,
      familySize: 1,
      dietPreference: "Vegan",
      dailyBudget: 20,
      pantry: []
    };

    const plan = generateMockPlan(inputs);

    // Verify no meat or animal products are included (e.g. no chicken, sirloin beef, salmon, eggs)
    const allIngredients = [
      ...plan.breakfast.ingredients,
      ...plan.lunch.ingredients,
      ...plan.dinner.ingredients
    ].map(i => i.name.toLowerCase());

    allIngredients.forEach(ing => {
      assert.strictEqual(ing.includes('chicken'), false, "Vegan plan must not contain chicken");
      assert.strictEqual(ing.includes('salmon'), false, "Vegan plan must not contain salmon");
      assert.strictEqual(ing.includes('beef'), false, "Vegan plan must not contain beef");
      assert.strictEqual(ing.includes('eggs'), false, "Vegan plan must not contain eggs");
    });
  });

});
