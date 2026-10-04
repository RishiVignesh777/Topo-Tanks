import { Arena } from '../types/game';

/**
 * Curated geographic locations across Earth.
 * STRICT COMPLIANCE: Contains ONLY GPS coordinate metadata and geographic labels.
 * ZERO pre-fetched Google elevation data or cached profile arrays are stored here.
 * Elevation profiles are queried live in the browser via ElevationService at match start.
 */
export const PRESET_ARENAS: Arena[] = [
  {
    id: 'grand_canyon',
    name: 'Grand Canyon Chasm',
    locationName: 'Grand Canyon National Park, Arizona',
    country: 'USA',
    p1Coords: { lat: 36.0544, lng: -112.1401 }, // South Rim (approx 2160m)
    p2Coords: { lat: 36.1069, lng: -112.0588 }, // North Rim (approx 2440m)
    p1Label: 'South Rim Overlook',
    p2Label: 'North Rim Plateau',
    description: 'A colossal 1,500-meter sheer drop down to the Colorado River gorge separating two opposing rim garrisons.',
    estimatedDistanceKm: 10.5,
    defaultZoom: 12,
    cameraCenter: { lat: 36.0806, lng: -112.0995 },
    bounds: { north: 36.16, south: 36.00, east: -111.91, west: -112.29 },
  },
  {
    id: 'mount_st_helens',
    name: 'Mount St. Helens Caldera',
    locationName: 'Skamania County, Washington',
    country: 'USA',
    p1Coords: { lat: 46.1912, lng: -122.1956 }, // Lava dome breach
    p2Coords: { lat: 46.2085, lng: -122.1890 }, // Northern rim crater
    p1Label: 'Resurgent Lava Dome',
    p2Label: 'North Crater Rim',
    description: 'The explosive 1980 eruption horseshoe caldera with dramatic pumice cliffs and unstable volcanic ash.',
    estimatedDistanceKm: 2.1,
    defaultZoom: 13,
    cameraCenter: { lat: 46.2000, lng: -122.1920 },
    bounds: { north: 46.25, south: 46.15, east: -122.05, west: -122.33 },
  },
  {
    id: 'mount_everest',
    name: 'Mount Everest: Roof of the World',
    locationName: 'Himalayas, Solukhumbu',
    country: 'Nepal / China',
    p1Coords: { lat: 28.0026, lng: 86.8528 }, // Khumbu Base Camp moraine
    p2Coords: { lat: 27.9881, lng: 86.9250 }, // Everest Summit
    p1Label: 'Khumbu Base Camp (5,364m)',
    p2Label: 'Everest Summit Ridge (8,848m)',
    description: 'The highest peak on Earth at 8,848 meters. Colossal vertical relief from the Khumbu Icefall moraine to the wind-blasted summit pinnacle.',
    estimatedDistanceKm: 7.4,
    defaultZoom: 12,
    cameraCenter: { lat: 27.9950, lng: 86.8890 },
    bounds: { north: 28.055, south: 27.935, east: 87.02, west: 86.76 },
  },
  {
    id: 'k2_karakoram',
    name: 'K2: The Savage Mountain',
    locationName: 'Karakoram Range, Gilgit-Baltistan',
    country: 'Pakistan / China',
    p1Coords: { lat: 35.8350, lng: 76.5100 }, // Godwin-Austen Glacier Base Camp
    p2Coords: { lat: 35.8810, lng: 76.5134 }, // K2 Summit & Bottleneck
    p1Label: 'Godwin-Austen Base (5,150m)',
    p2Label: 'K2 Summit Pinnacle (8,611m)',
    description: 'The second highest and deadliest peak on Earth. Over 3,400 meters of sheer vertical rise across glacial moraines, the Black Pyramid, and the Bottleneck couloir.',
    estimatedDistanceKm: 5.1,
    defaultZoom: 12,
    cameraCenter: { lat: 35.8580, lng: 76.5117 },
    bounds: { north: 35.93, south: 35.79, east: 76.67, west: 76.35 },
  },
  {
    id: 'yosemite_valley',
    name: 'Yosemite Valley Divide',
    locationName: 'Sierra Nevada, California',
    country: 'USA',
    p1Coords: { lat: 37.7340, lng: -119.6377 }, // El Capitan base
    p2Coords: { lat: 37.7460, lng: -119.5332 }, // Half Dome crest
    p1Label: 'El Capitan Spire',
    p2Label: 'Half Dome Granite Peak',
    description: 'Glacially carved sheer granite monoliths overlooking the forested valley floor 900 meters below.',
    estimatedDistanceKm: 9.3,
    defaultZoom: 12,
    cameraCenter: { lat: 37.7400, lng: -119.5855 },
    bounds: { north: 37.785, south: 37.695, east: -119.48, west: -119.69 },
  },
  {
    id: 'rock_of_gibraltar',
    name: 'Rock of Gibraltar',
    locationName: 'Strait of Gibraltar',
    country: 'Gibraltar (UK)',
    p1Coords: { lat: 36.1408, lng: -5.3536 }, // West sea base
    p2Coords: { lat: 36.1430, lng: -5.3428 }, // Upper ridge crest
    p1Label: 'Port Quayside',
    p2Label: "O'Hara's Battery Summit",
    description: 'A steep monolithic limestone promontory guarding the Mediterranean strait with acute topographic slopes.',
    estimatedDistanceKm: 1.1,
    defaultZoom: 14,
    cameraCenter: { lat: 36.1419, lng: -5.3482 },
    bounds: { north: 36.172, south: 36.112, east: -5.28, west: -5.42 },
  },
  {
    id: 'mount_vesuvius',
    name: 'Mount Vesuvius Rim',
    locationName: 'Gulf of Naples, Campania',
    country: 'Italy',
    p1Coords: { lat: 40.8200, lng: 14.4250 }, // Somma caldera ridge
    p2Coords: { lat: 40.8240, lng: 14.4330 }, // Active crater rim
    p1Label: 'Monte Somma Wall',
    p2Label: 'Gran Cono Rim',
    description: 'A double-crater stratovolcano overlooking Naples with steep inner talus slopes.',
    estimatedDistanceKm: 0.9,
    defaultZoom: 14,
    cameraCenter: { lat: 40.8220, lng: 14.4290 },
    bounds: { north: 40.847, south: 40.797, east: 14.49, west: 14.37 },
  },
  {
    id: 'sf_twin_peaks',
    name: 'San Francisco Twin Peaks',
    locationName: 'San Francisco, California',
    country: 'USA',
    p1Coords: { lat: 37.7544, lng: -122.4477 }, // South Peak
    p2Coords: { lat: 37.7680, lng: -122.4300 }, // Corona Heights
    p1Label: 'Noe Peak Lookout',
    p2Label: 'Corona Heights Ridge',
    description: 'Urban hill topography featuring steep street canyons, coastal fog ridges, and rolling summits.',
    estimatedDistanceKm: 2.2,
    defaultZoom: 14,
    cameraCenter: { lat: 37.7612, lng: -122.4388 },
    bounds: { north: 37.791, south: 37.731, east: -122.37, west: -122.51 },
  },
  {
    id: 'death_valley',
    name: "Death Valley: Dante's Descent",
    locationName: 'Inyo County, California',
    country: 'USA',
    p1Coords: { lat: 36.2207, lng: -116.7265 }, // Dante's View (1700m above sea level)
    p2Coords: { lat: 36.2300, lng: -116.7670 }, // Badwater Basin (-86m below sea level)
    p1Label: "Dante's Overlook (1,700m)",
    p2Label: 'Badwater Salt Flats (-86m)',
    description: 'Extreme vertical contrast dropping nearly 1,800 meters from high alpine desert into the lowest salt pan in North America.',
    estimatedDistanceKm: 4.1,
    defaultZoom: 13,
    cameraCenter: { lat: 36.2250, lng: -116.7467 },
    bounds: { north: 36.27, south: 36.18, east: -116.64, west: -116.85 },
  },
];
