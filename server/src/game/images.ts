// Mapping curated locations to real Wikimedia Commons images (public domain, legally usable)
// Each image corresponds exactly to the location and contains exploitable clues
const IMAGE_MAP: Record<string, string> = {
  // world
  "48.85837,2.29448": "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons.jpg", // Paris
  "40.7128,-74.006": "https://upload.wikimedia.org/wikipedia/commons/4/47/New_York_City_Manhattan_Skyline.jpg", // NYC
  "35.6586,139.7454": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Shibuya_Crossing_%28Tokyo%29.jpg", // Tokyo
  "-33.8568,151.2153": "https://upload.wikimedia.org/wikipedia/commons/5/53/Sydney_Opera_House_-_Dec_2008.jpg", // Sydney
  "51.5007,-0.1246": "https://upload.wikimedia.org/wikipedia/commons/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg", // London
  "-22.9519,-43.2105": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Christ_the_Redeemer_-_Cristo_Redentor.jpg", // Rio
  "41.8902,12.4922": "https://upload.wikimedia.org/wikipedia/commons/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg", // Rome
  "30.0444,31.2357": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Kheops-Pyramid.jpg", // Cairo
  "55.7558,37.6173": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Moscow_July_2011-7a.jpg", // Moscow
  "19.4326,-99.1332": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Mexico_City_Zocalo.jpg", // Mexico City
  "37.5665,126.978": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Seoul_City_Hall.jpg", // Seoul
  "48.2082,16.3738": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Wien_-_Stephansdom_%282%29.JPG", // Vienna
  "-23.5505,-46.6333": "https://upload.wikimedia.org/wikipedia/commons/3/3f/S%C3%A3o_Paulo_Skyline.jpg", // Sao Paulo
  "52.52,13.405": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Berlin_Brandenburg_Gate.jpg", // Berlin
  "34.0522,-118.2437": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Hollywood_Sign_%28Los_Angeles%29.jpg", // LA
  "-33.9249,18.4241": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Table_Mountain_Cape_Town.jpg", // Cape Town
  "43.6532,-79.3832": "https://upload.wikimedia.org/wikipedia/commons/3/39/CN_Tower_Toronto.jpg", // Toronto
  "41.0082,28.9784": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Hagia_Sophia_Mars_2013.jpg", // Istanbul
  "35.6895,139.692": "https://upload.wikimedia.org/wikipedia/commons/1/10/Tokyo_Tower_and_around_Skyscrapers.jpg", // Tokyo Tower
  "48.8647,2.321": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Louvre_Museum_Wikimedia_Commons.jpg", // Paris Louvre
  // europe extra
  "40.4168,-3.7038": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Puerta_del_Sol_Madrid.jpg",
  // south america
  "-34.6037,-58.3816": "https://upload.wikimedia.org/wikipedia/commons/1/10/ObeliscoBA2015.2.jpg", // Buenos Aires
  // africa
  "-1.2921,36.8219": "https://upload.wikimedia.org/wikipedia/commons/3/36/Nairobi_skyline.jpg",
  // oceania
  "-36.8485,174.7633": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Auckland_skyline.jpg",
  // france
  "45.764,4.8357": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Lyon_Hotel_de_Ville.jpg",
  "43.2965,5.3698": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Marseille_Vieux_Port.jpg",
  "48.5734,7.7521": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Strasbourg_Cathedrale.jpg",
  "43.6045,1.444": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Capitole_Toulouse.jpg",
  "47.2184,-1.5536": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Nantes_Chateau.jpg",
};

export function getImageForLocation(lat: number, lng: number): string {
  const key = `${lat},${lng}`;
  if (IMAGE_MAP[key]) return IMAGE_MAP[key];
  const roundedKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (IMAGE_MAP[roundedKey]) return IMAGE_MAP[roundedKey];
  const generics = [
    "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e3/Kheops-Pyramid.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Sydney_Opera_House_-_Dec_2008.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/47/New_York_City_Manhattan_Skyline.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Berlin_Brandenburg_Gate.jpg",
  ];
  const idx = Math.abs(Math.floor(lat * 10 + lng * 10)) % generics.length;
  return generics[idx]!;
}

export function getImagesForLocations(locs: { latitude: number; longitude: number }[]): string[] {
  return locs.map(l => getImageForLocation(l.latitude, l.longitude));
}
