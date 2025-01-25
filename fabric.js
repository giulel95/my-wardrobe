/**
 * fabric.js
 *
 * A concise "most common fabrics" list, avoiding duplicates.
 * Each has a `durabilityMultiplier` that you can tweak.
 */

// Category durability remains the same; only updating the fabricDurability list below.

window.categoryDurability = {
  "Bra":        { maxUses: 60,  maxWashes: 40,  maxYears: 1.5 },
  "Panties":    { maxUses: 50,  maxWashes: 30,  maxYears: 1   },
  "T-shirt":    { maxUses: 100, maxWashes: 50,  maxYears: 2   },
  "Shirt":      { maxUses: 120, maxWashes: 60,  maxYears: 3   },
  "Jeans":      { maxUses: 200, maxWashes: 100, maxYears: 5   },
  "Pants":      { maxUses: 200, maxWashes: 100, maxYears: 4   },
  "Shorts":     { maxUses: 120, maxWashes: 60,  maxYears: 3   },
  "Skirt":      { maxUses: 120, maxWashes: 60,  maxYears: 3   },
  "Dress":      { maxUses: 100, maxWashes: 50,  maxYears: 2   },
  "Sweater":    { maxUses: 150, maxWashes: 75,  maxYears: 3   },
  "Hoodie":     { maxUses: 200, maxWashes: 90,  maxYears: 4   },
  "Jacket":     { maxUses: 300, maxWashes: 150, maxYears: 10  },
  "Coat":       { maxUses: 400, maxWashes: 80,  maxYears: 10  },
  "Socks":      { maxUses: 50,  maxWashes: 40,  maxYears: 1   },
  "Shoes":      { maxUses: 500, maxWashes: 0,   maxYears: 8   },
  "Hat":        { maxUses: 100, maxWashes: 20,  maxYears: 3   },
  "Casual":     { maxUses: 150, maxWashes: 70,  maxYears: 3   },
  "Formal":     { maxUses: 80,  maxWashes: 40,  maxYears: 2   },
  "Athletic":   { maxUses: 250, maxWashes: 100, maxYears: 3   },
  "Other":      { maxUses: 100, maxWashes: 50,  maxYears: 2   },
};

/**
 * A short, common fabrics list with no duplicates (polyamide = nylon, etc.).
 * Adjust `durabilityMultiplier` to reflect real-world usage for each fabric.
 */
window.fabricDurability = {
  "Cotton":               { durabilityMultiplier: 1.0 },
  "Linen":                { durabilityMultiplier: 1.0 },
  "Wool":                 { durabilityMultiplier: 0.8 },
  "Silk":                 { durabilityMultiplier: 0.7 },
  "Polyester":            { durabilityMultiplier: 1.2 },
  "Nylon (Polyamide)":    { durabilityMultiplier: 1.3 },
  "Spandex (Elastane)":   { durabilityMultiplier: 1.5 },
  "Viscose (Rayon)":      { durabilityMultiplier: 0.9 },
  "Acrylic":              { durabilityMultiplier: 0.9 },
  "Leather":              { durabilityMultiplier: 2.0 },
  "Hemp":                 { durabilityMultiplier: 1.3 },
  "Denim":                { durabilityMultiplier: 1.2 },
};
