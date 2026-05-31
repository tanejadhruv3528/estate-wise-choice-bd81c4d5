// Curated Bangalore seed data: 10 localities, ~40 properties from the 9
// whitelisted A-category builders. Used by the one-time ingest server fn.

export interface SeedLocality {
  name: string;
  lat: number;
  lng: number;
  overall_score: number; // 0..1
}

export interface SeedProperty {
  name: string;
  builder: string;
  locality_name: string;
  lat: number;
  lng: number;
  price_min: number;
  price_max: number;
  bhk: number[];
  property_type: string; // Apartment | Villa | Plot | Penthouse
  status: string; // ready | under-construction | new-launch
  images: string[];
  highlights: string[];
  manual_priority: number; // 0..1
}

const img = (q: string, i: number) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=1200&q=70&ixid=${i}`;

// Premium real-estate / architecture stock photos from Unsplash (free).
const POOL = [
  "photo-1600585154340-be6161a56a0c",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1613490493576-7fde63acd811",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753190-17f0baa2a6c3",
  "photo-1582268611958-ebfd161ef9cf",
  "photo-1600585154526-990dced4db0d",
  "photo-1600210492486-724fe5c67fb0",
  "photo-1600573472550-8090b5e0745e",
  "photo-1564013799919-ab600027ffc6",
  "photo-1512917774080-9991f1c4c750",
  "photo-1568605114967-8130f3a36994",
];
const pickImgs = (seed: number): string[] => {
  const out: string[] = [];
  for (let k = 0; k < 3; k++) out.push(img(POOL[(seed + k) % POOL.length], k));
  return out;
};

export const SEED_LOCALITIES: SeedLocality[] = [
  { name: "Whitefield", lat: 12.9698, lng: 77.7499, overall_score: 0.88 },
  { name: "Sarjapur Road", lat: 12.9, lng: 77.6874, overall_score: 0.86 },
  { name: "Hebbal", lat: 13.0359, lng: 77.5970, overall_score: 0.84 },
  { name: "Indiranagar", lat: 12.9719, lng: 77.6412, overall_score: 0.92 },
  { name: "JP Nagar", lat: 12.9081, lng: 77.5831, overall_score: 0.78 },
  { name: "Devanahalli", lat: 13.2437, lng: 77.7117, overall_score: 0.72 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963, overall_score: 0.75 },
  { name: "Kanakapura Road", lat: 12.8456, lng: 77.5398, overall_score: 0.7 },
  { name: "Outer Ring Road", lat: 12.9352, lng: 77.6245, overall_score: 0.83 },
  { name: "Koramangala", lat: 12.9352, lng: 77.6245, overall_score: 0.9 },
];

export const SEED_PROPERTIES: SeedProperty[] = [
  // Prestige
  { name: "Prestige Lakeside Habitat", builder: "Prestige", locality_name: "Whitefield", lat: 12.9612, lng: 77.7401, price_min: 18000000, price_max: 32000000, bhk: [2,3,4], property_type: "Apartment", status: "ready", images: pickImgs(0), highlights: ["Lakefront views","Clubhouse","12-acre landscape"], manual_priority: 0.85 },
  { name: "Prestige Falcon City", builder: "Prestige", locality_name: "Kanakapura Road", lat: 12.8923, lng: 77.5421, price_min: 12500000, price_max: 24000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(1), highlights: ["Smart homes","Olympic pool"], manual_priority: 0.7 },
  { name: "Prestige Park Drive", builder: "Prestige", locality_name: "Devanahalli", lat: 13.2298, lng: 77.7019, price_min: 28000000, price_max: 52000000, bhk: [3,4], property_type: "Villa", status: "under-construction", images: pickImgs(2), highlights: ["Golf course","Forest reserve adjacent"], manual_priority: 0.78 },
  { name: "Prestige Botanique", builder: "Prestige", locality_name: "JP Nagar", lat: 12.9088, lng: 77.5824, price_min: 14500000, price_max: 22000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(3), highlights: ["Central park","Metro access"], manual_priority: 0.6 },

  // Sobha
  { name: "Sobha Dream Acres", builder: "Sobha", locality_name: "Sarjapur Road", lat: 12.8961, lng: 77.6912, price_min: 10500000, price_max: 18500000, bhk: [1,2,3], property_type: "Apartment", status: "ready", images: pickImgs(4), highlights: ["Precast construction","Lavish amenities"], manual_priority: 0.72 },
  { name: "Sobha Royal Pavilion", builder: "Sobha", locality_name: "Whitefield", lat: 12.9705, lng: 77.7488, price_min: 19000000, price_max: 36000000, bhk: [3,4], property_type: "Apartment", status: "under-construction", images: pickImgs(5), highlights: ["Mughal-inspired gardens","Premium clubhouse"], manual_priority: 0.82 },
  { name: "Sobha Indraprastha", builder: "Sobha", locality_name: "Hebbal", lat: 13.0341, lng: 77.5912, price_min: 22000000, price_max: 45000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(6), highlights: ["High-rise","Skyline views"], manual_priority: 0.75 },
  { name: "Sobha Saptrang", builder: "Sobha", locality_name: "JP Nagar", lat: 12.9059, lng: 77.5847, price_min: 16000000, price_max: 26000000, bhk: [2,3], property_type: "Apartment", status: "new-launch", images: pickImgs(7), highlights: ["Boutique community","Italian marble"], manual_priority: 0.68 },

  // Brigade
  { name: "Brigade Cornerstone Utopia", builder: "Brigade", locality_name: "Whitefield", lat: 12.9651, lng: 77.7558, price_min: 11000000, price_max: 21000000, bhk: [1,2,3], property_type: "Apartment", status: "under-construction", images: pickImgs(8), highlights: ["47-acre township","Top-tier schools"], manual_priority: 0.7 },
  { name: "Brigade Exotica", builder: "Brigade", locality_name: "Outer Ring Road", lat: 12.9384, lng: 77.6267, price_min: 32000000, price_max: 75000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(9), highlights: ["35-floor tower","Sky deck"], manual_priority: 0.88 },
  { name: "Brigade Buena Vista", builder: "Brigade", locality_name: "Sarjapur Road", lat: 12.8923, lng: 77.6889, price_min: 14000000, price_max: 22000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(10), highlights: ["Resort-style amenities"], manual_priority: 0.65 },
  { name: "Brigade Orchards", builder: "Brigade", locality_name: "Devanahalli", lat: 13.2401, lng: 77.7089, price_min: 14000000, price_max: 38000000, bhk: [2,3,4], property_type: "Villa", status: "ready", images: pickImgs(11), highlights: ["Smart township","Near airport"], manual_priority: 0.74 },

  // Godrej
  { name: "Godrej Splendour", builder: "Godrej", locality_name: "Whitefield", lat: 12.9728, lng: 77.7411, price_min: 14000000, price_max: 24000000, bhk: [2,3], property_type: "Apartment", status: "under-construction", images: pickImgs(0), highlights: ["LEED gold","Sunken courts"], manual_priority: 0.7 },
  { name: "Godrej Royale Woods", builder: "Godrej", locality_name: "Devanahalli", lat: 13.2351, lng: 77.7144, price_min: 7800000, price_max: 14000000, bhk: [1,2,3], property_type: "Apartment", status: "ready", images: pickImgs(1), highlights: ["Forest theme","Vaastu-compliant"], manual_priority: 0.55 },
  { name: "Godrej Reflections", builder: "Godrej", locality_name: "Sarjapur Road", lat: 12.8978, lng: 77.6855, price_min: 18000000, price_max: 31000000, bhk: [2,3,4], property_type: "Apartment", status: "ready", images: pickImgs(2), highlights: ["Designer interiors","Cricket pitch"], manual_priority: 0.76 },
  { name: "Godrej Aqua", builder: "Godrej", locality_name: "Hebbal", lat: 13.0421, lng: 77.6033, price_min: 9500000, price_max: 16000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(3), highlights: ["Water-positive community"], manual_priority: 0.6 },

  // Embassy
  { name: "Embassy Lake Terraces", builder: "Embassy", locality_name: "Hebbal", lat: 13.0379, lng: 77.5945, price_min: 38000000, price_max: 95000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(4), highlights: ["38-floor luxury","Lake views","Concierge"], manual_priority: 0.92 },
  { name: "Embassy Boulevard", builder: "Embassy", locality_name: "Devanahalli", lat: 13.2412, lng: 77.7058, price_min: 65000000, price_max: 180000000, bhk: [4], property_type: "Villa", status: "ready", images: pickImgs(5), highlights: ["Gated luxury villas","100-acre estate"], manual_priority: 0.95 },
  { name: "Embassy Edge", builder: "Embassy", locality_name: "Devanahalli", lat: 13.2391, lng: 77.7112, price_min: 9000000, price_max: 18500000, bhk: [1,2,3], property_type: "Apartment", status: "ready", images: pickImgs(6), highlights: ["Smart living","Tech parks adjacent"], manual_priority: 0.62 },

  // Birla
  { name: "Birla Trimaya", builder: "Birla", locality_name: "Yelahanka", lat: 13.1015, lng: 77.5988, price_min: 16500000, price_max: 29000000, bhk: [2,3,4], property_type: "Apartment", status: "under-construction", images: pickImgs(7), highlights: ["52-acre township","Crystal lagoon"], manual_priority: 0.78 },
  { name: "Birla Tisya", builder: "Birla", locality_name: "Indiranagar", lat: 12.9698, lng: 77.6395, price_min: 42000000, price_max: 78000000, bhk: [3,4], property_type: "Apartment", status: "new-launch", images: pickImgs(8), highlights: ["Premium central location","High street access"], manual_priority: 0.9 },
  { name: "Birla Alokya", builder: "Birla", locality_name: "Sarjapur Road", lat: 12.9012, lng: 77.6921, price_min: 18000000, price_max: 28000000, bhk: [3,4], property_type: "Villa", status: "ready", images: pickImgs(9), highlights: ["Row villas","Private terraces"], manual_priority: 0.72 },

  // Mahindra Lifespaces
  { name: "Mahindra Eden", builder: "Mahindra Lifespaces", locality_name: "Kanakapura Road", lat: 12.8489, lng: 77.5421, price_min: 11500000, price_max: 21000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(10), highlights: ["Net-zero ready","Green certified"], manual_priority: 0.7 },
  { name: "Mahindra Zen", builder: "Mahindra Lifespaces", locality_name: "Sarjapur Road", lat: 12.8945, lng: 77.6901, price_min: 13500000, price_max: 23000000, bhk: [2,3], property_type: "Apartment", status: "under-construction", images: pickImgs(11), highlights: ["Mindful design"], manual_priority: 0.66 },
  { name: "Mahindra Windchimes", builder: "Mahindra Lifespaces", locality_name: "JP Nagar", lat: 12.9101, lng: 77.5856, price_min: 19000000, price_max: 36000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(0), highlights: ["Tree-lined avenues"], manual_priority: 0.74 },

  // Puravankara
  { name: "Purva Atmosphere", builder: "Puravankara", locality_name: "Hebbal", lat: 13.0399, lng: 77.5921, price_min: 16500000, price_max: 28000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(1), highlights: ["Skywalks","12-acre central park"], manual_priority: 0.72 },
  { name: "Purva Palm Beach", builder: "Puravankara", locality_name: "Hebbal", lat: 13.0381, lng: 77.5979, price_min: 22000000, price_max: 41000000, bhk: [3,4], property_type: "Apartment", status: "under-construction", images: pickImgs(2), highlights: ["Beach-themed clubhouse"], manual_priority: 0.8 },
  { name: "Purva Zenium", builder: "Puravankara", locality_name: "Whitefield", lat: 12.9651, lng: 77.7522, price_min: 12000000, price_max: 19500000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(3), highlights: ["Compact luxury"], manual_priority: 0.6 },
  { name: "Purva Aerocity", builder: "Puravankara", locality_name: "Devanahalli", lat: 13.2421, lng: 77.7102, price_min: 9500000, price_max: 17500000, bhk: [1,2,3], property_type: "Apartment", status: "new-launch", images: pickImgs(4), highlights: ["Aviation theme","Airport corridor"], manual_priority: 0.58 },

  // Total Environment
  { name: "Total Environment Pursuit of a Radical Rhapsody", builder: "Total Environment", locality_name: "Whitefield", lat: 12.9712, lng: 77.7421, price_min: 35000000, price_max: 68000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(5), highlights: ["Hanging gardens","Customisable interiors"], manual_priority: 0.92 },
  { name: "Total Environment Songs of the Wind", builder: "Total Environment", locality_name: "Hebbal", lat: 13.0411, lng: 77.5908, price_min: 28000000, price_max: 49000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(6), highlights: ["Sky terraces","Lush biophilia"], manual_priority: 0.88 },
  { name: "Total Environment In That Quiet Earth", builder: "Total Environment", locality_name: "Yelahanka", lat: 13.1029, lng: 77.5949, price_min: 26000000, price_max: 47000000, bhk: [3,4], property_type: "Villa", status: "under-construction", images: pickImgs(7), highlights: ["Earth-toned villas","Eco-design"], manual_priority: 0.82 },

  // Mixed extras to bring variety
  { name: "Prestige White Meadows", builder: "Prestige", locality_name: "Whitefield", lat: 12.9689, lng: 77.7411, price_min: 55000000, price_max: 120000000, bhk: [4], property_type: "Villa", status: "ready", images: pickImgs(8), highlights: ["Ultra-luxury villas","Private pools"], manual_priority: 0.94 },
  { name: "Sobha Forest Edge", builder: "Sobha", locality_name: "Kanakapura Road", lat: 12.8421, lng: 77.5378, price_min: 11000000, price_max: 19000000, bhk: [2,3], property_type: "Apartment", status: "ready", images: pickImgs(9), highlights: ["Forest views","Cycle trails"], manual_priority: 0.66 },
  { name: "Brigade Lakefront", builder: "Brigade", locality_name: "Hebbal", lat: 13.0345, lng: 77.5988, price_min: 19000000, price_max: 33000000, bhk: [2,3], property_type: "Apartment", status: "under-construction", images: pickImgs(10), highlights: ["Lakeside towers","Promenade"], manual_priority: 0.78 },
  { name: "Embassy Grove", builder: "Embassy", locality_name: "Indiranagar", lat: 12.9711, lng: 77.6432, price_min: 38000000, price_max: 72000000, bhk: [3,4], property_type: "Apartment", status: "ready", images: pickImgs(11), highlights: ["Boutique low-rise","Old-tree retention"], manual_priority: 0.86 },
];
