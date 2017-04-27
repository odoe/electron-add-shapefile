// require some cool stuff
const { ipcRenderer } = nodereq("electron");
const ArcGIS = nodereq("terraformer-arcgis-parser");
// normal app
require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/geometry/Polygon",
  "esri/core/domUtils",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleFillSymbol"
], function (
  EsriMap, SceneView,
  Graphic,
  Point, Polygon,
  domUtils,
  SimpleMarkerSymbol,
  SimpleFillSymbol
) {

    const map = new EsriMap({
      basemap: "hybrid",
      ground: "world-elevation"
    });

    const view = new SceneView({
      container: "viewDiv",
      center: [-118, 34.5],
      zoom: 8,
      map: map
    });

    const backdrop = document.getElementById("backdrop");
    const viewDiv = document.getElementById("viewDiv");

    view.then(() => domUtils.hide(backdrop));

    const fill = new SimpleFillSymbol({
      outline: {
        color: [255, 0, 0, 1]
      },
      color: [0, 112, 255, 0.25]
    });

    const marker = new SimpleMarkerSymbol({
      outline: {
        color: [255, 255, 255, 1]
      },
      color: [56, 168, 0, 1]
    });

    function fileDragHover(event) {
      event.stopPropagation();
      event.preventDefault();
      viewDiv.classList.add("dropping");
    }

    function fileDragHoverLeave(e) {
      e.stopPropagation();
      e.preventDefault();
      domUtils.hide(backdrop);
      viewDiv.classList.remove("dropping");
    }

    function toGraphics(feature) {
      // technically we don't don't need to instantiate these as graphics
      // view.graphics Collection will autocast them for us
      // but we want to use the graphics to use view.goTo()
      let g;
      if (feature.geometry.x) {
        g = new Graphic({
          attributes: feature.attributes,
          geometry: new Point(feature.geometry),
          symbol: marker,
          popupTemplate: {
            title: "From Shapefile",
            content: "{*}"
          }
        })
      }
      else {
        g = new Graphic({
          attributes: feature.attributes,
          geometry: new Polygon(feature.geometry),
          symbol: fill,
          popupTemplate: {
            title: "From Shapefile",
            content: "{*}"
          }
        })
      }
      return g;
    }

    function addToMap(features) {
      const graphics = features.map(toGraphics);
      view.graphics.addMany(graphics);
      view.goTo(graphics).then(() => {
        domUtils.hide(backdrop);
      });
    }

    ipcRenderer.on("load-shp", (event, features) => {
      return addToMap(features);
    });

    // file selection
    function fileSelectHandler(event) {
      // cancel event and hover styling
      event.stopPropagation();
      event.preventDefault();
      domUtils.show(backdrop);
      viewDiv.classList.remove("dropping");
      // fetch FileList object
      const files = Array.from(event.target.files || event.dataTransfer.files);
      // process all File objects
      files.map(file => {
        const filepath = file.path.toString();
        if (filepath.includes(".shp")) {
          ipcRenderer.send("upload-shp", filepath);
        }
        else {
          alert("You can only add Shapeiles as .shp!");
          domUtils.hide(backdrop);
        }
      });
    }

    //const filedrag = document.getElementById("viewDiv");
    viewDiv.addEventListener("dragover", fileDragHover, false);
    viewDiv.addEventListener("dragleave", fileDragHoverLeave, false);
    viewDiv.addEventListener("drop", fileSelectHandler, false);
  });
