import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { fmt$, fmtNum } from '../utils/helpers';
import Icon from '../components/Icon';
import SupplierChip from '../components/SupplierChip';

const PREP_RECIPES = [
  {id:"dough",name:"Pizza Dough",icon:"🫓",yield:"12 dough balls (270g each)",time:"24–72 hrs (cold ferment)",storage:"3 days refrigerated",
    ingredients:[
      {name:"00 Flour",qty:"1,500g (3.3 lbs)"},
      {name:"Warm Water (80°F)",qty:"975ml"},
      {name:"Active Dry Yeast",qty:"3g"},
      {name:"Sea Salt",qty:"30g"},
      {name:"Extra Virgin Olive Oil",qty:"30ml"},
      {name:"Sugar",qty:"5g"},
    ],
    steps:[
      "Combine warm water, yeast, and sugar in a bowl. Let bloom 5–10 min until foamy.",
      "Mix flour and salt in a large bowl, forming a well in the center.",
      "Pour yeast mixture and EVOO into the well. Mix until a shaggy dough forms.",
      "Turn out and knead 10–12 min by hand until smooth, elastic, and slightly tacky.",
      "Oil a large bowl, place dough inside, cover tightly with plastic wrap.",
      "Refrigerate 24–72 hours for cold ferment (longer = more flavor).",
      "Remove from fridge, divide into 270g balls, shape tightly, and rest covered 30–60 min before stretching.",
      "Stretch by hand — never use a rolling pin. Use within 3 days.",
    ]},
  {id:"meatballs",name:"Meatballs",icon:"🍖",yield:"~40 meatballs (2 oz each)",time:"45 min",storage:"3 days refrigerated or freeze",
    ingredients:[
      {name:"Ground Beef (80/20)",qty:"3 lbs"},
      {name:"Ground Pork",qty:"1 lb"},
      {name:"Breadcrumbs (plain)",qty:"1 cup"},
      {name:"Whole Milk",qty:"¼ cup"},
      {name:"Parmigiano-Reggiano, grated",qty:"½ cup"},
      {name:"Eggs",qty:"3 large"},
      {name:"Fresh Parsley, chopped",qty:"¼ cup"},
      {name:"Garlic, minced",qty:"4 cloves"},
      {name:"Sea Salt",qty:"1½ tsp"},
      {name:"Black Pepper",qty:"1 tsp"},
      {name:"Red Pepper Flakes",qty:"½ tsp"},
    ],
    steps:[
      "Preheat oven to 425°F. Line two sheet pans with parchment, lightly oil.",
      "Soak breadcrumbs in milk for 5 min until absorbed — this keeps meatballs moist.",
      "Combine all ingredients in a large bowl. Mix gently with hands — do not overwork or they become tough.",
      "Using a 2 oz scoop, portion meatballs and roll lightly between palms.",
      "Place on pans 1 inch apart. Do not crowd.",
      "Bake 15–18 min until deep brown on the outside and internal temp reaches 165°F.",
      "Cool on pan 10 min before storing. Refrigerate in sauce or freeze on sheet pan then bag.",
    ]},
  {id:"chicken",name:"Shredded Chicken",icon:"🍗",yield:"~4 lbs shredded",time:"45 min",storage:"4 days refrigerated",
    ingredients:[
      {name:"Boneless Skinless Chicken Breasts",qty:"5 lbs"},
      {name:"Chicken Stock",qty:"2 quarts"},
      {name:"Garlic",qty:"4 cloves"},
      {name:"Fresh Thyme",qty:"4 sprigs"},
      {name:"Bay Leaves",qty:"2"},
      {name:"Sea Salt",qty:"2 tsp"},
      {name:"Black Pepper",qty:"1 tsp"},
      {name:"Extra Virgin Olive Oil",qty:"2 tbsp"},
    ],
    steps:[
      "Season chicken breasts on both sides with salt and pepper.",
      "Heat EVOO in a large pot over medium-high. Sear chicken 2 min per side until golden.",
      "Add stock, garlic, thyme, and bay leaves. Bring to a rolling boil.",
      "Reduce heat to a gentle simmer. Cover and cook 20–25 min until internal temp 165°F.",
      "Remove chicken and rest 10 min. Reserve braising liquid.",
      "Shred using two forks, or use stand mixer with paddle on low for 30 seconds.",
      "Moisten with reserved liquid to taste. Season. Refrigerate in an airtight container.",
    ]},
  {id:"pesto",name:"Pesto",icon:"🌿",yield:"~2 cups",time:"15 min",storage:"5 days refrigerated or freeze in ice cube trays",
    ingredients:[
      {name:"Fresh Basil, packed",qty:"4 cups"},
      {name:"Pine Nuts, toasted",qty:"½ cup"},
      {name:"Parmigiano-Reggiano, grated",qty:"1 cup"},
      {name:"Garlic",qty:"3 cloves"},
      {name:"Extra Virgin Olive Oil",qty:"¾ cup"},
      {name:"Lemon Juice",qty:"1 tbsp"},
      {name:"Sea Salt",qty:"1 tsp"},
      {name:"Black Pepper",qty:"½ tsp"},
    ],
    steps:[
      "Toast pine nuts in a dry pan over medium heat 3–4 min, tossing constantly, until golden. Cool completely.",
      "Pulse basil, pine nuts, garlic, and salt in food processor until coarsely ground.",
      "With the processor running, drizzle in EVOO in a thin, steady stream.",
      "Add Parmigiano, lemon juice, and pepper. Pulse 4–5 times to combine — keep it slightly chunky.",
      "Taste and adjust salt. Pesto should be thick and bright green, not watery.",
      "Press plastic wrap directly onto the surface to prevent oxidation.",
      "Refrigerate up to 5 days. To freeze, spoon into ice cube trays, freeze solid, then transfer to bags.",
    ]},
  {id:"italian",name:"Italian Dressing",icon:"🫙",yield:"~2 cups",time:"10 min",storage:"2 weeks refrigerated",
    ingredients:[
      {name:"Extra Virgin Olive Oil",qty:"¾ cup"},
      {name:"Red Wine Vinegar",qty:"¼ cup"},
      {name:"Lemon Juice",qty:"2 tbsp"},
      {name:"Garlic, minced",qty:"3 cloves"},
      {name:"Dijon Mustard",qty:"1 tsp"},
      {name:"Dried Oregano",qty:"1 tsp"},
      {name:"Dried Basil",qty:"1 tsp"},
      {name:"Red Pepper Flakes",qty:"¼ tsp"},
      {name:"Sea Salt",qty:"1 tsp"},
      {name:"Black Pepper",qty:"½ tsp"},
      {name:"Sugar",qty:"½ tsp"},
    ],
    steps:[
      "Combine vinegar, lemon juice, garlic, mustard, and all dry seasonings in a bowl.",
      "Whisk vigorously until sugar and salt dissolve completely.",
      "Slowly drizzle in EVOO while whisking continuously to emulsify.",
      "Taste — it should be tangy with a balanced herby finish. Adjust acid or salt.",
      "Transfer to a squeeze bottle or lidded jar.",
      "Shake well before every use. Keeps 2 weeks refrigerated.",
    ]},
  {id:"aioli",name:"Aioli",icon:"🧄",yield:"~1.5 cups",time:"10 min",storage:"1 week refrigerated",
    ingredients:[
      {name:"Mayonnaise (Duke's or Hellmann's)",qty:"1 cup"},
      {name:"Garlic",qty:"4 cloves"},
      {name:"Lemon Juice",qty:"2 tbsp"},
      {name:"Extra Virgin Olive Oil",qty:"2 tbsp"},
      {name:"Dijon Mustard",qty:"1 tsp"},
      {name:"Sea Salt",qty:"½ tsp"},
      {name:"White Pepper",qty:"¼ tsp"},
    ],
    steps:[
      "Microplane garlic cloves or mince to a very fine paste. Rub with a pinch of salt on the cutting board.",
      "Whisk together mayo, garlic paste, lemon juice, EVOO, and Dijon until smooth.",
      "Season with salt and white pepper.",
      "Cover and refrigerate at least 30 min before service — the garlic mellows and flavors bloom.",
      "Taste before each service and adjust lemon or salt. Store covered up to 1 week.",
    ]},
  {id:"caesar",name:"Caesar Dressing",icon:"🥗",yield:"~2 cups",time:"15 min",storage:"5 days refrigerated",
    ingredients:[
      {name:"Anchovy Fillets",qty:"4–6 (minced to paste)"},
      {name:"Garlic",qty:"3 cloves"},
      {name:"Dijon Mustard",qty:"1 tbsp"},
      {name:"Lemon Juice",qty:"3 tbsp"},
      {name:"Worcestershire Sauce",qty:"1 tsp"},
      {name:"Pasteurized Egg Yolks",qty:"2 large"},
      {name:"Extra Virgin Olive Oil",qty:"½ cup"},
      {name:"Canola Oil",qty:"¼ cup"},
      {name:"Parmigiano-Reggiano, grated",qty:"½ cup"},
      {name:"Sea Salt",qty:"½ tsp"},
      {name:"Black Pepper",qty:"½ tsp"},
    ],
    steps:[
      "On a cutting board, mince anchovies and garlic together, working into a smooth paste with the flat of your knife.",
      "Whisk together anchovy-garlic paste, Dijon, lemon juice, Worcestershire, and egg yolks in a bowl.",
      "Combine EVOO and canola in a measuring cup. Drizzle in drop by drop at first, whisking constantly, then in a thin stream once emulsified.",
      "Stir in Parmigiano. Season with salt and pepper.",
      "Thin with a few drops of water or lemon if needed — it should coat the back of a spoon.",
      "Taste: bold, savory, slightly funky from anchovy. Refrigerate up to 5 days. Whisk before each use.",
    ]},
  {id:"ranch",name:"Ranch Dressing",icon:"🌾",yield:"~2 cups",time:"10 min + 1 hr rest",storage:"1 week refrigerated",
    ingredients:[
      {name:"Mayonnaise",qty:"1 cup"},
      {name:"Sour Cream",qty:"½ cup"},
      {name:"Buttermilk",qty:"½ cup"},
      {name:"Fresh Dill, chopped",qty:"2 tbsp"},
      {name:"Fresh Chives, chopped",qty:"2 tbsp"},
      {name:"Fresh Parsley, chopped",qty:"2 tbsp"},
      {name:"Garlic Powder",qty:"½ tsp"},
      {name:"Onion Powder",qty:"½ tsp"},
      {name:"Sea Salt",qty:"½ tsp"},
      {name:"Black Pepper",qty:"¼ tsp"},
      {name:"Lemon Juice",qty:"1 tbsp"},
    ],
    steps:[
      "Whisk together mayo, sour cream, and buttermilk until smooth with no lumps.",
      "Fold in all chopped herbs and dry seasonings.",
      "Add lemon juice and whisk to combine.",
      "Refrigerate at least 1 hour before service — the herbs need time to infuse.",
      "Adjust thickness with additional buttermilk. Taste and adjust salt.",
      "Stir well before each use. Store covered up to 1 week.",
    ]},
  {id:"hummus",name:"Hummus",icon:"🫘",yield:"~3 cups",time:"20 min (+ soak if using dried)",storage:"5 days refrigerated",
    ingredients:[
      {name:"Chickpeas (canned, drained) or dried (soaked overnight)",qty:"2 × 15oz cans or 2 cups dried"},
      {name:"Tahini",qty:"½ cup"},
      {name:"Lemon Juice",qty:"¼ cup (~2 lemons)"},
      {name:"Garlic",qty:"2 cloves"},
      {name:"Extra Virgin Olive Oil",qty:"3 tbsp + more to finish"},
      {name:"Ice Water",qty:"3–4 tbsp"},
      {name:"Sea Salt",qty:"1 tsp"},
      {name:"Cumin",qty:"½ tsp"},
      {name:"Smoked Paprika",qty:"pinch, for garnish"},
    ],
    steps:[
      "If using dried: soak overnight. Cook with a pinch of baking soda 45–60 min until very soft. Drain well.",
      "Optional but recommended: peel chickpea skins by hand or rub in a towel for silkier texture.",
      "Process tahini and lemon juice in food processor for 1 full minute until fluffy and pale.",
      "Add garlic and salt. Process 30 seconds.",
      "Add chickpeas. Process 2–3 min, scraping the bowl, until very smooth.",
      "With processor running, drizzle in ice water 1 tbsp at a time until light and creamy.",
      "Add EVOO and cumin. Process 1 more min. Taste — adjust salt, lemon, or tahini.",
      "Serve in a bowl with a swirl of EVOO and a sprinkle of paprika. Refrigerate up to 5 days.",
    ]},
];

const RecipesPage = ({ inventory }) => {
  const [recipes, setRecipes] = useState([]);
  const [tab, setTab] = useState("menu");
  const [selected, setSelected] = useState(null);
  const [openPrep, setOpenPrep] = useState(null);

  useEffect(() => {
    api.getRecipes().then(setRecipes).catch(() => {});
  }, []);

  const costOf = recipe => recipe.ingredients.reduce((sum, ing) => {
    const item = inventory.find(i => i.id === ing.id);
    return sum + (item ? item.unitCost * ing.qty : 0);
  }, 0);

  const canMake = recipe => Math.floor(Math.min(...recipe.ingredients.map(ing => {
    const item = inventory.find(i => i.id === ing.id);
    if (!item || ing.qty === 0) return 999;
    return item.currentStock / ing.qty;
  })));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Recipes</h1>
        <p className="text-stone-400 text-sm mt-0.5">Menu items, kitchen prep, and full how-to directions</p>
      </div>

      <div className="flex rounded-xl border border-stone-200 overflow-hidden w-fit text-sm font-semibold">
        {[["menu","🍕 Menu Items"],["prep","👨‍🍳 Kitchen Prep"]].map(([v,l]) => (
          <button key={v} onClick={() => { setTab(v); setSelected(null); setOpenPrep(null); }}
            className={`px-5 py-2.5 transition-colors ${tab === v ? "bg-orange-600 text-white" : "text-stone-500 hover:bg-stone-50"}`}>{l}</button>
        ))}
      </div>

      {tab === "menu" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(r => {
              const cost = costOf(r);
              const margin = ((r.price - cost) / r.price * 100).toFixed(0);
              const qty = canMake(r);
              const low = qty < 10;
              return (
                <button key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  className={`bg-white rounded-2xl p-5 shadow-sm border text-left transition-all hover:shadow-md ${selected?.id === r.id ? "border-orange-400 ring-2 ring-orange-200" : "border-stone-100"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div><span className="text-2xl">{r.icon}</span><p className="font-semibold text-stone-800 mt-1">{r.name}</p></div>
                    <span className="text-lg font-bold text-stone-700">{fmt$(r.price)}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-stone-50 rounded-lg p-2"><p className="text-xs text-stone-400">Food Cost</p><p className="text-sm font-bold text-stone-700">{fmt$(cost)}</p></div>
                    <div className="bg-stone-50 rounded-lg p-2"><p className="text-xs text-stone-400">Margin</p><p className="text-sm font-bold text-emerald-600">{margin}%</p></div>
                    <div className={`rounded-lg p-2 ${low ? "bg-red-50" : "bg-stone-50"}`}><p className="text-xs text-stone-400">Can Make</p><p className={`text-sm font-bold ${low ? "text-red-600" : "text-stone-700"}`}>{qty}</p></div>
                  </div>
                  <p className="text-xs text-stone-400 mt-3">{r.ingredients.length} ingredients · tap for details</p>
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-stone-800">{selected.icon} {selected.name} — Ingredient Breakdown</h2>
                <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600"><Icon name="x" /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-stone-400 uppercase border-b border-stone-100">
                    <tr><th className="pb-2 text-left">Ingredient</th><th className="pb-2 text-right">Per Pizza</th><th className="pb-2 text-right">Cost/Pizza</th><th className="pb-2 text-right">On Hand</th><th className="pb-2 text-right">Supplier</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {selected.ingredients.map(ing => {
                      const item = inventory.find(i => i.id === ing.id);
                      if (!item) return null;
                      const isLow = item.currentStock < item.minStock;
                      return (
                        <tr key={ing.id} className="hover:bg-stone-50">
                          <td className="py-2.5 text-stone-700">{item.name}</td>
                          <td className="py-2.5 text-right text-stone-500">{fmtNum(ing.qty)} {item.unit}</td>
                          <td className="py-2.5 text-right text-stone-600">{fmt$(ing.qty * item.unitCost)}</td>
                          <td className={`py-2.5 text-right font-medium ${isLow ? "text-red-600" : "text-stone-700"}`}>{fmtNum(item.currentStock)} {item.unit}{isLow ? " ⚠" : ""}</td>
                          <td className="py-2.5 text-right"><SupplierChip name={item.supplier} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-stone-200">
                    <tr>
                      <td colSpan={2} className="pt-3 text-sm font-semibold text-stone-700">Total Food Cost</td>
                      <td className="pt-3 text-right font-bold text-stone-800">{fmt$(costOf(selected))}</td>
                      <td colSpan={2} className="pt-3 text-right text-xs text-stone-400">Menu price: {fmt$(selected.price)} · Margin: {((selected.price - costOf(selected)) / selected.price * 100).toFixed(0)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "prep" && (
        <div className="space-y-3">
          {PREP_RECIPES.map(r => {
            const open = openPrep === r.id;
            return (
              <div key={r.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${open ? "border-orange-300" : "border-stone-100"}`}>
                <button onClick={() => setOpenPrep(open ? null : r.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left">
                  <span className="text-2xl shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800">{r.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Yield: {r.yield} · Time: {r.time}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium">{r.ingredients.length} ingredients</span>
                    <span className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
                  </div>
                </button>
                {open && (
                  <div className="border-t border-stone-100 px-5 pb-6 pt-4 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Ingredients</h3>
                        <ul className="space-y-2">
                          {r.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start justify-between gap-4 text-sm">
                              <span className="text-stone-700 font-medium">{ing.name}</span>
                              <span className="text-stone-500 text-right shrink-0">{ing.qty}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex items-center gap-2 text-xs text-stone-400 bg-stone-50 rounded-xl p-3">
                          <span>🧊</span>
                          <span><strong>Storage:</strong> {r.storage}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Directions</h3>
                        <ol className="space-y-3">
                          {r.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                              <span className="text-stone-600 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecipesPage;
