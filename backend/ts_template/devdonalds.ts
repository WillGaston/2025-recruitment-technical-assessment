import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: (recipe | ingredient)[] = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  recipeName = recipeName.replace('-', ' ');
  recipeName = recipeName.replace('_', ' ');

  recipeName = recipeName.replace(/[^A-Za-z\s]/g, '');

  recipeName = recipeName.replace(/\s{2,}/g, ' ').trim();
  recipeName = recipeName.toLowerCase();
  recipeName = recipeName.replace(/\b\w/g, letter => letter.toUpperCase());

  if (recipeName.length <= 0) return null;

  return recipeName
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const {type, name, requiredItems, cookTime} = req.body;

  if (type === null || name === null || (type === 'recipe' && requiredItems === null) || (type === 'ingredient' && cookTime === null)) {
    return res.status(400).json({ error: "invalid input received" });
  }

  const names = cookbook.map(element => element.name.toLowerCase());
  const nameSet = new Set(names);
  nameSet.add(name.toLowerCase());
  if ((names.length + 1) !== nameSet.size) {
      return res.status(400).json({ error: "name already in cookbook" });
  }

  switch (type) {
    case "recipe":

      const newRecipe: recipe = {
        type,
        name,
        requiredItems: requiredItems as requiredItem[],
      }

      if (!Array.isArray(requiredItems)) {
        return res.status(400).json({ error: "invalid items type" });
      } else {
        const ingredientNames = requiredItems.map(element => element.name.toLocaleLowerCase());
        const ingredientNamesSet = new Set(ingredientNames);

        for (const ingredient of requiredItems) {
          ingredientNamesSet.add(ingredient);
        }

        if ((ingredientNames.length + requiredItems.length) !== ingredientNamesSet.size) {
          return res.status(400).json({ error: "ingredient names are not unique" });
        } else if (requiredItems.length === 0) {
          return res.status(400).json({ error: "no ingredients given" });
        } else {
          cookbook.push(newRecipe);
          return res.status(200).json({});
        }
      }
    case "ingredient":

      const newIngredient: ingredient = {
        type,
        name,
        cookTime,
      }
    
      if (typeof cookTime !== "number" || cookTime < 0) {
        return res.status(400).json({ error: "invalid cook time" });
      } else {
        cookbook.push(newIngredient);
        return res.status(200).json({});
      }
    default:
      res.status(400).send("invalid type");
  }

});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const name: string = req.query.name;

  if (cookbook.length === 0 || cookbook === undefined) {
    res.status(400).send("cookbook has no entries");
  }

  let overview: recipe | ingredient = cookbook.find((element) => element.name == name);

  if (overview.type === 'ingredient' || overview === undefined) {
    res.status(400).send("invalid name given");
  }

  const outputArray: recipe[] & ingredient[] = [];
  const objectQueue = [name];
  const usedItems = new Set();

  while (objectQueue.length > 0) {
    const currElement = objectQueue.pop();
    let overview: recipe | ingredient = cookbook.find((element) => element.name == currElement);
    if (overview === undefined) {
      res.status(400).send("item not in cookbook");
    }
    switch (overview.type) {
      case "ingredient":
        overview = overview as ingredient;
        if (!usedItems.has(overview.name)) {
          outputArray.push(overview);
        }
        break;

      case "recipe":
        overview = overview as recipe;
        if (!usedItems.has(overview.name)) {
          outputArray.push(overview);
        }

        for (const element of overview.requiredItems) {
          if (!usedItems.has(element.name)) {
            objectQueue.push(element.name);
          }
        }
        break;
    }

    usedItems.add(overview.name);

  }

  res.status(200).json({outputArray})

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
