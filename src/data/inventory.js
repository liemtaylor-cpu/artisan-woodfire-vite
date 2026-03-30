export const CATEGORIES = ["All","Dry Goods","Dairy","Proteins","Produce","Wood & Fuel","Packaging"];
export const SUPPLIERS  = ["All","US Foods","Sam's Club"];

export const INITIAL_INVENTORY = [
  // Dry Goods — Sam's Club bulk
  { id:1,  name:"00 Flour",              category:"Dry Goods",   unit:"lbs",   currentStock:45,  minStock:50,  maxStock:200, unitCost:1.20,  supplier:"Sam's Club" },
  { id:2,  name:"Semolina Flour",        category:"Dry Goods",   unit:"lbs",   currentStock:30,  minStock:25,  maxStock:100, unitCost:1.50,  supplier:"Sam's Club" },
  { id:3,  name:"Sea Salt",              category:"Dry Goods",   unit:"lbs",   currentStock:15,  minStock:10,  maxStock:50,  unitCost:2.00,  supplier:"Sam's Club" },
  { id:4,  name:"Extra Virgin Olive Oil",category:"Dry Goods",   unit:"liters",currentStock:8,   minStock:10,  maxStock:40,  unitCost:18.00, supplier:"Sam's Club" },
  // Dairy — US Foods
  { id:5,  name:"Fresh Mozzarella",      category:"Dairy",       unit:"lbs",   currentStock:12,  minStock:15,  maxStock:50,  unitCost:8.50,  supplier:"US Foods" },
  { id:6,  name:"Parmigiano-Reggiano",   category:"Dairy",       unit:"lbs",   currentStock:20,  minStock:10,  maxStock:40,  unitCost:22.00, supplier:"US Foods" },
  { id:7,  name:"Ricotta",               category:"Dairy",       unit:"lbs",   currentStock:6,   minStock:8,   maxStock:30,  unitCost:5.00,  supplier:"US Foods" },
  { id:8,  name:"Burrata",               category:"Dairy",       unit:"units", currentStock:10,  minStock:12,  maxStock:36,  unitCost:6.00,  supplier:"US Foods" },
  // Proteins
  { id:9,  name:"Prosciutto di Parma",   category:"Proteins",    unit:"lbs",   currentStock:8,   minStock:6,   maxStock:20,  unitCost:28.00, supplier:"US Foods" },
  { id:10, name:"Italian Sausage",       category:"Proteins",    unit:"lbs",   currentStock:15,  minStock:10,  maxStock:40,  unitCost:9.00,  supplier:"Sam's Club" },
  { id:11, name:"Pancetta",              category:"Proteins",    unit:"lbs",   currentStock:5,   minStock:6,   maxStock:20,  unitCost:16.00, supplier:"US Foods" },
  { id:12, name:"Anchovies",             category:"Proteins",    unit:"cans",  currentStock:24,  minStock:12,  maxStock:48,  unitCost:4.50,  supplier:"US Foods" },
  // Produce — US Foods
  { id:13, name:"San Marzano Tomatoes",  category:"Produce",     unit:"cans",  currentStock:48,  minStock:24,  maxStock:96,  unitCost:3.50,  supplier:"US Foods" },
  { id:14, name:"Fresh Basil",           category:"Produce",     unit:"oz",    currentStock:16,  minStock:20,  maxStock:60,  unitCost:0.75,  supplier:"US Foods" },
  { id:15, name:"Garlic",                category:"Produce",     unit:"lbs",   currentStock:10,  minStock:8,   maxStock:30,  unitCost:3.00,  supplier:"US Foods" },
  { id:16, name:"Baby Arugula",          category:"Produce",     unit:"lbs",   currentStock:4,   minStock:5,   maxStock:20,  unitCost:6.50,  supplier:"US Foods" },
  // Wood & Fuel — Sam's Club
  { id:17, name:"Oak Logs",              category:"Wood & Fuel", unit:"cords", currentStock:2.5, minStock:1,   maxStock:5,   unitCost:350.00,supplier:"Sam's Club" },
  { id:18, name:"Cherry Wood Chips",     category:"Wood & Fuel", unit:"bags",  currentStock:15,  minStock:10,  maxStock:40,  unitCost:18.00, supplier:"Sam's Club" },
  // Packaging — Sam's Club
  { id:19, name:'Pizza Boxes (12")',     category:"Packaging",   unit:"units", currentStock:200, minStock:150, maxStock:600, unitCost:0.85,  supplier:"Sam's Club" },
  { id:20, name:"To-Go Containers",      category:"Packaging",   unit:"units", currentStock:100, minStock:200, maxStock:500, unitCost:0.45,  supplier:"Sam's Club" },
];
