/**
 * DayDish.AI - Client Application Logic
 * Implements interactive presets, AI client calls, schedule timeline rendering,
 * live budget progress indicators, and dynamic ingredient substitutions.
 */

// Global State
let activePlan = null;
let currentBudgetLimit = 20.00;
let userPantryList = [];

// Scenarios Definitions matching Step 12 (Winning Demo Mode)
const SCENARIOS = {
  office: {
    wakeUp: "06:30",
    occupation: "Employee",
    gymToday: false,
    travelToday: true,
    availableTime: "15",
    familySize: "1",
    dietPreference: "None",
    dailyBudget: "15.00",
    pantry: "Mustard, Mayo, Salt"
  },
  student: {
    wakeUp: "08:30",
    occupation: "Student",
    gymToday: false,
    travelToday: false,
    availableTime: "15",
    familySize: "1",
    dietPreference: "Vegetarian",
    dailyBudget: "8.00",
    pantry: "Rice, Salt, Pepper, Olive Oil"
  },
  gym: {
    wakeUp: "06:00",
    occupation: "Remote Worker",
    gymToday: true,
    travelToday: false,
    availableTime: "30",
    familySize: "1",
    dietPreference: "None",
    dailyBudget: "25.00",
    pantry: "Protein Powder, Rice, Oats, Eggs"
  },
  family: {
    wakeUp: "07:00",
    occupation: "Remote Worker",
    gymToday: true,
    travelToday: true,
    availableTime: "60",
    familySize: "4",
    dietPreference: "Gluten-Free",
    dailyBudget: "35.00",
    pantry: "Garlic, Onion, Rice, Rice Noodles"
  },
  travel: {
    wakeUp: "05:30",
    occupation: "Employee",
    gymToday: false,
    travelToday: true,
    availableTime: "15",
    familySize: "2",
    dietPreference: "Vegan",
    dailyBudget: "20.00",
    pantry: "Oats, Peanut Butter, Salt"
  }
};

// DOM Elements
const planForm = document.getElementById('plan-form');
const generateBtn = document.getElementById('generate-btn');
const welcomePanel = document.getElementById('welcome-panel');
const loadingSkeleton = document.getElementById('loading-skeleton');
const errorPanel = document.getElementById('error-panel');
const errorText = document.getElementById('error-text');
const contentContainer = document.getElementById('content-container');
const srAnnouncer = document.getElementById('sr-announcer');

// Form Inputs
const inputWakeup = document.getElementById('input-wakeup');
const inputOccupation = document.getElementById('input-occupation');
const inputGym = document.getElementById('input-gym');
const inputTravel = document.getElementById('input-travel');
const inputTime = document.getElementById('input-time');
const inputFamily = document.getElementById('input-family');
const inputBudget = document.getElementById('input-budget');
const inputDiet = document.getElementById('input-diet');
const inputPantry = document.getElementById('input-pantry');

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  setupPresetHandlers();
  setupFormHandler();
});

// Setup Preset buttons
function setupPresetHandlers() {
  const buttons = document.querySelectorAll('.preset-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const presetName = btn.dataset.preset;
      const data = SCENARIOS[presetName];
      
      if (data) {
        // Load values into form inputs
        inputWakeup.value = data.wakeUp;
        inputOccupation.value = data.occupation;
        inputGym.checked = data.gymToday;
        inputTravel.checked = data.travelToday;
        inputTime.value = data.availableTime;
        inputFamily.value = data.familySize;
        inputBudget.value = data.dailyBudget;
        inputDiet.value = data.dietPreference;
        inputPantry.value = data.pantry;
        
        announceToScreenReader(`Loaded preset scenario for ${btn.textContent}. Generating plan...`);
        
        // Auto submit the form
        planForm.requestSubmit();
      }
    });
  });
}

// Setup main form submission
function setupFormHandler() {
  planForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!planForm.checkValidity()) {
      planForm.reportValidity();
      return;
    }
    
    // Set UI to loading state
    welcomePanel.classList.add('hidden');
    contentContainer.classList.add('hidden');
    errorPanel.classList.add('hidden');
    loadingSkeleton.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.querySelector('.spinner').classList.remove('hidden');
    generateBtn.querySelector('.btn-text').textContent = 'Consulting AI Chef...';
    
    // Construct request payload
    currentBudgetLimit = parseFloat(inputBudget.value) || 20.00;
    userPantryList = inputPantry.value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
      
    const payload = {
      wakeUp: inputWakeup.value,
      occupation: inputOccupation.value,
      gymToday: inputGym.checked,
      travelToday: inputTravel.checked,
      availableTime: parseInt(inputTime.value),
      familySize: parseInt(inputFamily.value),
      dietPreference: inputDiet.value,
      dailyBudget: currentBudgetLimit,
      pantry: userPantryList
    };
    
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }
      
      activePlan = await response.json();
      renderPlan(activePlan, payload);
      
      // Toggle UI to success state
      loadingSkeleton.classList.add('hidden');
      contentContainer.classList.remove('hidden');
      announceToScreenReader("AI Cooking Blueprint generated successfully. Budget tracker, recipes list, and daily timeline are rendered below.");
      
    } catch (err) {
      console.error(err);
      errorText.textContent = `Reason: ${err.message || 'Failed to connect to backend server. Make sure node server.js is running.'}`;
      loadingSkeleton.classList.add('hidden');
      errorPanel.classList.remove('hidden');
      announceToScreenReader(`Error generating blueprint. ${errorText.textContent}`);
    } finally {
      generateBtn.disabled = false;
      generateBtn.querySelector('.spinner').classList.add('hidden');
      generateBtn.querySelector('.btn-text').textContent = 'Generate AI Cooking Blueprint';
    }
  });
}

// Render the meal plan layout elements
function renderPlan(plan, inputs) {
  // Update budget labels
  document.getElementById('total-limit-val').textContent = `/ $${currentBudgetLimit.toFixed(2)} limit`;
  
  // Render meals
  renderMealCard('meal-breakfast', plan.breakfast);
  renderMealCard('meal-lunch', plan.lunch);
  renderMealCard('meal-dinner', plan.dinner);
  
  // Render timeline
  renderTimeline(plan, inputs);
  
  // Render grocery checklist
  renderGroceryChecklist(plan);
  
  // Render substitutions
  renderSubstitutions(plan.substitutions);
  
  // Recalculate budget gauges
  calculateBudgetFeasibility();
}

// Render individual meal details card
function renderMealCard(cardId, mealData) {
  const card = document.getElementById(cardId);
  if (!mealData || !card) return;
  
  // Update titles & stats
  card.querySelector('h3').textContent = mealData.name;
  card.querySelector('[id$="-prep"]').textContent = `🕒 ${mealData.prepTime}m prep`;
  card.querySelector('[id$="-protein"]').textContent = `💪 ${mealData.proteinGrams}g protein (${mealData.calories} kcal)`;
  
  // Lunch office tag check
  const officeBadge = card.querySelector('#lunch-office-badge');
  if (officeBadge) {
    if (mealData.officeFriendly) {
      officeBadge.classList.remove('hidden');
    } else {
      officeBadge.classList.add('hidden');
    }
  }

  // Populate steps list
  const stepsList = card.querySelector('[id$="-steps-list"]');
  stepsList.innerHTML = '';
  mealData.instructions.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    stepsList.appendChild(li);
  });
}

// Render schedule nodes
function renderTimeline(plan, inputs) {
  const container = document.getElementById('timeline-flow');
  container.innerHTML = '';
  
  const timelineNodes = [];
  
  // Calculate relative times based on wakeUp input e.g. "07:00"
  const [wakeHour, wakeMin] = inputs.wakeUp.split(':').map(Number);
  
  const addMinutes = (hours, mins, offset) => {
    let totalMins = hours * 60 + mins + offset;
    let h = Math.floor(totalMins / 60) % 24;
    let m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // 1. Wake Up Node
  timelineNodes.push({
    time: inputs.wakeUp,
    title: "🌞 Wake Up & Hydrate",
    desc: `Starting eating window based on ${inputs.wakeUp} wake-up schedule.`
  });

  // 2. Breakfast Node (usually 45 mins after waking)
  timelineNodes.push({
    time: addMinutes(wakeHour, wakeMin, 45),
    title: `🍳 Breakfast: ${plan.breakfast.name}`,
    desc: `Quick energy prep. Needs ${plan.breakfast.prepTime} mins cook time.`
  });

  // 3. Work / Studies Node (usually 2 hours after waking)
  let workTitle = "🏡 Remote Work Focus Block";
  let workDesc = "Flexible environment. Ideal for fresh warm lunch assembly.";
  if (inputs.occupation === "Employee") {
    workTitle = "🏢 Commute & Office Focus";
    workDesc = "At work office desk. High requirement for pre-packed cold lunch.";
  } else if (inputs.occupation === "Student") {
    workTitle = "🏫 Study Block & Lectures";
    workDesc = "Campus library or class focus. High preference for fast snacks.";
  }
  
  timelineNodes.push({
    time: addMinutes(wakeHour, wakeMin, 120),
    title: workTitle,
    desc: workDesc
  });

  // 4. Lunch Node (5 hours after waking)
  timelineNodes.push({
    time: addMinutes(wakeHour, wakeMin, 300),
    title: `🥪 Lunch: ${plan.lunch.name}`,
    desc: plan.lunch.officeFriendly 
      ? "Packable and microwave friendly. Easy to eat at work."
      : "Cooked warm. Needs active kitchen assembly."
  });

  // 5. Travel Block Node (if travel is scheduled)
  if (inputs.travelToday) {
    timelineNodes.push({
      time: addMinutes(wakeHour, wakeMin, 480),
      title: "🚗 Travel / Commuting Window",
      desc: "On the move. AI avoided long prep times within this time slot."
    });
  }

  // 6. Gym Session Node (if gym is scheduled, e.g., 6:00 PM / 11 hours after waking)
  if (inputs.gymToday) {
    timelineNodes.push({
      time: addMinutes(wakeHour, wakeMin, 660),
      title: "💪 Muscle Recovery Gym Workout",
      desc: "Workout scheduled. Meal engine adjusted protein macro target higher (+30g)."
    });
  }

  // 7. Dinner Node (12 hours after waking)
  timelineNodes.push({
    time: addMinutes(wakeHour, wakeMin, 720),
    title: `🍽️ Dinner: ${plan.dinner.name}`,
    desc: `Main recovery meal. Needs ${plan.dinner.prepTime} mins cooking.`
  });

  // Inject into DOM
  timelineNodes.forEach(node => {
    const div = document.createElement('div');
    div.className = 'timeline-node';
    div.setAttribute('role', 'listitem');
    div.innerHTML = `
      <div class="node-header">
        <span class="node-time">${node.time}</span>
        <span class="node-title">${node.title}</span>
      </div>
      <p class="node-desc">${node.desc}</p>
    `;
    container.appendChild(div);
  });
}

// Render checklist container
function renderGroceryChecklist(plan) {
  const container = document.getElementById('grocery-checklist-container');
  container.innerHTML = '';
  
  // Extract and combine ingredients from all meals
  const allIngredients = [];
  const addIngredientsFromMeal = (meal, category) => {
    if (!meal || !meal.ingredients) return;
    meal.ingredients.forEach(ing => {
      // Avoid duplication
      const existing = allIngredients.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
      if (existing) {
        existing.amount += `, ${ing.amount}`;
      } else {
        allIngredients.push({
          name: ing.name,
          amount: ing.amount,
          estimatedCost: ing.estimatedCost,
          isPantry: ing.isPantry || false,
          category
        });
      }
    });
  };

  addIngredientsFromMeal(plan.breakfast, "Breakfast");
  addIngredientsFromMeal(plan.lunch, "Lunch");
  addIngredientsFromMeal(plan.dinner, "Dinner");

  if (allIngredients.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No ingredients specified.</p>';
    return;
  }

  // Inject checkbox rows
  allIngredients.forEach((ing, idx) => {
    const row = document.createElement('div');
    row.className = `grocery-item-row ${ing.isPantry ? 'pantry-item' : ''}`;
    
    const costText = ing.isPantry ? '$0.00' : `$${ing.estimatedCost.toFixed(2)}`;
    const pantryBadge = ing.isPantry ? '<span class="pantry-badge">Pantry Stocked</span>' : '';
    
    // Checkboxes are checked by default for pantry items, or unchecked for shopping
    const isChecked = ing.isPantry;
    
    row.innerHTML = `
      <div class="grocery-item-left">
        <label class="custom-checkbox">
          <input type="checkbox" class="grocery-checkbox" data-cost="${ing.estimatedCost}" data-name="${ing.name}" ${isChecked ? 'checked' : ''}>
          <span class="checkbox-box"></span>
          <span class="checkbox-label"><strong>${ing.name}</strong> (${ing.amount})${pantryBadge}</span>
        </label>
      </div>
      <span class="grocery-item-cost">${costText}</span>
    `;
    
    // Attach listener to checkbox
    row.querySelector('.grocery-checkbox').addEventListener('change', () => {
      calculateBudgetFeasibility();
    });

    container.appendChild(row);
  });
}

// Render Substitution items
function renderSubstitutions(subs) {
  const container = document.getElementById('substitutions-container');
  container.innerHTML = '';
  
  if (!subs || subs.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No substitutions required for this plan.</p>';
    return;
  }

  subs.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'sub-item-card';
    
    const directionSign = sub.costDifference < 0 ? '-' : '+';
    const savingColorClass = sub.costDifference < 0 ? 'text-success' : 'text-danger';
    const savingText = `$${Math.abs(sub.costDifference).toFixed(2)}`;
    
    card.innerHTML = `
      <h4>
        <span>🔄 Swap ${sub.original} for <strong>${sub.replacement}</strong></span>
        <span class="sub-item-saving ${savingColorClass}">${directionSign}${savingText}</span>
      </h4>
      <p class="sub-item-desc">${sub.reason}</p>
      <button type="button" class="sub-trigger-btn" data-original="${sub.original}" data-replacement="${sub.replacement}" data-diff="${sub.costDifference}">
        Apply Dynamic Swap
      </button>
    `;
    
    // Attach trigger listener
    card.querySelector('.sub-trigger-btn').addEventListener('click', (e) => {
      applyIngredientSwap(sub);
    });

    container.appendChild(card);
  });
}

// Performs an in-place client side ingredient swap (WOW feature)
function applyIngredientSwap(sub) {
  let matched = false;
  
  const swapInMeal = (meal) => {
    if (!meal || !meal.ingredients) return;
    meal.ingredients.forEach(ing => {
      if (ing.name.toLowerCase() === sub.original.toLowerCase()) {
        ing.name = sub.replacement;
        ing.estimatedCost = Math.max(0, ing.estimatedCost + sub.costDifference);
        matched = true;
      }
    });
  };

  swapInMeal(activePlan.breakfast);
  swapInMeal(activePlan.lunch);
  swapInMeal(activePlan.dinner);

  if (matched) {
    // Re-render display elements with swapped content
    renderPlan(activePlan, {
      wakeUp: inputWakeup.value,
      occupation: inputOccupation.value,
      gymToday: inputGym.checked,
      travelToday: inputTravel.checked,
      availableTime: parseInt(inputTime.value),
      familySize: parseInt(inputFamily.value),
      dietPreference: inputDiet.value,
      dailyBudget: currentBudgetLimit,
      pantry: userPantryList
    });
    
    announceToScreenReader(`Swapped ${sub.original} for ${sub.replacement}. Grocery list updated.`);
  }
}

// Recalculates spent metrics and adjusts gauges
function calculateBudgetFeasibility() {
  const checkboxes = document.querySelectorAll('.grocery-checkbox');
  
  let totalCost = 0.00;
  let totalPantrySaved = 0.00;
  
  checkboxes.forEach(box => {
    const cost = parseFloat(box.dataset.cost) || 0.00;
    
    // Checked items represent ingredients the user ALREADY has/owns (savings) or checked off (completed)
    if (box.checked) {
      // If cost is 0, it was already marked as pantry by the backend
      if (cost === 0) {
        // Find in ingredients list to see what its base price was (for visual tally of savings)
        // For simplicity, we track it from inputs
      } else {
        totalPantrySaved += cost;
      }
    } else {
      // Unchecked boxes represent ingredients still to purchase out of pocket
      totalCost += cost;
    }
  });

  // Calculate base pantry items savings from activePlan
  const sumPantryBase = (meal) => {
    if (!meal || !meal.ingredients) return 0;
    return meal.ingredients.reduce((acc, ing) => acc + (ing.isPantry ? (parseFloat(ing.estimatedCost) || 1.50) : 0), 0);
  };
  const baseSaved = sumPantryBase(activePlan.breakfast) + sumPantryBase(activePlan.lunch) + sumPantryBase(activePlan.dinner);
  totalPantrySaved += baseSaved;

  // Update DOM numbers
  const spentValElement = document.getElementById('total-spent-val');
  spentValElement.textContent = `$${totalCost.toFixed(2)}`;
  
  const savedValElement = document.getElementById('pantry-savings-val');
  savedValElement.textContent = `$${totalPantrySaved.toFixed(2)} saved`;

  // Update progress gauge width and color thresholds
  const progressPercent = Math.min(100, (totalCost / currentBudgetLimit) * 100);
  const progressBar = document.getElementById('budget-progress');
  progressBar.style.width = `${progressPercent}%`;

  // Reset progress bar color classes
  progressBar.className = 'gauge-bar';
  const alertBox = document.getElementById('budget-alert-box');
  const statusIcon = document.getElementById('feasibility-status-icon');
  const statusText = document.getElementById('feasibility-status-text');

  if (totalCost > currentBudgetLimit) {
    progressBar.classList.add('over-limit');
    alertBox.classList.remove('hidden');
    statusIcon.textContent = '❌';
    statusText.textContent = 'Budget Exceeded';
    statusText.className = 'text-danger';
  } else if (totalCost >= currentBudgetLimit * 0.85) {
    progressBar.classList.add('close-limit');
    alertBox.classList.add('hidden');
    statusIcon.textContent = '⚠️';
    statusText.textContent = 'Close to Budget Limit';
    statusText.className = 'text-warning';
  } else {
    progressBar.classList.add('within-limits');
    alertBox.classList.add('hidden');
    statusIcon.textContent = '✅';
    statusText.textContent = 'Within Budget';
    statusText.className = 'text-success';
  }
}

// Helper: Screen reader notifications (a11y)
function announceToScreenReader(message) {
  srAnnouncer.textContent = '';
  setTimeout(() => {
    srAnnouncer.textContent = message;
  }, 100);
}
