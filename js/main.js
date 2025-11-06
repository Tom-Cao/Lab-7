// declare the map variable here to give it a global scope
let myMap;
// track which map is currently loaded (e.g., 'mapa' or 'mapb')
let currentMapId = null;

// we might as well declare our baselayer(s) here too
const CartoDB_Positron = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
);

const OpenStreetMap_Standard = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }
);

const Esri_WorldImagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);

const CartoDB_DarkMatter = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
  }
);

//add the basemap style(s) to a JS object, to which you could also add other baselayers. This object is loaded as a basemap selector as seen further down
let baseLayers = {
  "CartoDB Light": CartoDB_Positron,
  OpenStreetMap: OpenStreetMap_Standard,
  "Esri World Imagery": Esri_WorldImagery,
  "CartoDB Dark": CartoDB_DarkMatter,
};

// helper functions for styling and rendering GeoJSON points as circle markers
function generateCircles(feature, latlng) {
  return L.circleMarker(latlng);
}

function styleAll(feature, latlng) {
  // Log station IDs to the console for inspection
  // if (feature && feature.properties) {
  //   console.log('Station ID:', feature.properties.stat_ID);
  // }

  var styles = {
    dashArray: null,
    dashOffset: null,
    lineJoin: null,
    lineCap: null,
    stroke: false,
    color: "#000",
    opacity: 1,
    weight: 1,
    fillColor: null,
    fillOpacity: 0,
  };

  if (feature.geometry.type == "Point") {
    const hasPostal =
      feature &&
      feature.properties &&
      typeof feature.properties.postal_code === "string" &&
      feature.properties.postal_code.trim() !== "";

    styles.fillColor = hasPostal ? "cyan" : "#fff";
    styles.fillOpacity = 0.5;
    styles.stroke = true;
    styles.radius = 9;
  }

  return styles;
}

function initialize() {
  // loadMap(); // Launch via dropdown selection instead
}

function fetchData(url) {
  //load the data
  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      //create a Leaflet GeoJSON layer using the fetched json and add it to the map object
      L.geoJson(json, {
        style: styleAll,
        pointToLayer: generateCircles,
        onEachFeature: addPopups,
      }).addTo(myMap);
    });
}

function loadMap(mapid) {
  console.log("loadMap mapid:", mapid);
  currentMapId = mapid;

  // remove existing map if present
  try {
    myMap.remove();
  } catch (e) {
    // console.log(e);
    // console.log("no map to delete");
  } finally {
    // decide dataset and map options based on mapid
    let dataUrl;
    let mapOptions;

    if (mapid === "mapa") {
      // Train stations
      dataUrl =
        "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/refs/heads/main/DATA/train-stations.geojson";
      mapOptions = {
        center: [46.58, -78.19], // Great Lakes region
        zoom: 5,
        maxZoom: 18,
        minZoom: 3,
        layers: CartoDB_Positron,
      };
    } else if (mapid === "mapb") {
      // Megacities
      dataUrl =
        "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/refs/heads/main/DATA/megacities.geojson";
      mapOptions = {
        center: [20, 0], // global view
        zoom: 2,
        maxZoom: 18,
        minZoom: 1,
        layers: CartoDB_Positron,
      };
    } else {
      // default/fallback
      dataUrl =
        "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/refs/heads/main/DATA/train-stations.geojson";
      mapOptions = {
        center: [46.58, -78.19],
        zoom: 5,
        maxZoom: 18,
        minZoom: 3,
        layers: CartoDB_Positron,
      };
    }

    // create the map
    myMap = L.map("mapdiv", mapOptions);

    // basemap selector
    let lcontrol = L.control.layers(baseLayers);
    lcontrol.addTo(myMap);

    // load data for this map
    fetchData(dataUrl);
  }
}

// window.onload = initialize(); // map will be launched via dropdown selection

// attach dropdown listener after DOM loads
document.addEventListener("DOMContentLoaded", function () {
  const selectEl = document.getElementById("mapdropdown");
  if (selectEl) {
    // reset to placeholder on page load
    selectEl.value = "map0";

    selectEl.addEventListener("change", function (e) {
      const value = e.target && e.target.value;
      if (value && value !== "map0") {
        loadMap(value);
      }
    });
  }
});

// placeholder to inspect feature and layer objects for each GeoJSON feature
function addPopups(feature, layer) {
  // console.log('Feature object:', feature);
  // console.log('Layer object:', layer);
  // layer.options.fill = false;
  // layer._radius = 80;
  // console.log(layer._radius);
  // console.log(layer.options.fill);
  // console.log(layer.getLatLng());

  let popupContent = null;

  if (currentMapId === "mapa" && feature && feature.properties) {
    // Train stations: station name with ID and postal code underneath
    const name = feature.properties.stat_name;
    const statId = feature.properties.stat_ID;
    const postal = feature.properties.postal_code;
    const idText = statId ?? "N/A";
    const postalText =
      typeof postal === "string" && postal.trim() !== "" ? postal : "N/A";
    if (name) {
      popupContent = `<div><strong>${name}</strong><br>ID: ${idText}<br>Postal code: ${postalText}</div>`;
    }
  }

  if (currentMapId === "mapb" && feature && feature.properties) {
    // Megacities: show city on first line, population underneath
    const city = feature.properties.City || feature.properties.city;
    const popRaw =
      feature.properties.Population ?? feature.properties.population;
    if (city) {
      const popText =
        typeof popRaw === "number" ? popRaw.toLocaleString() : popRaw ?? "N/A";
      popupContent = `<div><strong>${city}</strong><br>Population: ${popText}</div>`;
    }
  }

  if (
    !popupContent &&
    feature &&
    feature.properties &&
    feature.properties.stat_name
  ) {
    // Train stations fallback: show station name
    popupContent = feature.properties.stat_name;
  }

  layer.bindPopup(popupContent || "No info");
}
