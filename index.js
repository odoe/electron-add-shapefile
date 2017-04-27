const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const url = require("url")
const shapefile = require("shapefile");
const ArcGIS = require("terraformer-arcgis-parser");

app.on("window-all-closed", () => {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  let win = new BrowserWindow({
    width: 1920,
    height: 1080
  });
  win.setPosition(10, 25);
  win.show();
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on("closed", () => {
    win = null;
  });

  // demonstrate how you can use ipc to process data
  ipcMain.on("upload-shp", (event, arg) => {
    const results = [];
    shapefile.open(arg)
      .then(source => source.read()
        .then(function log(result) {
          if (result.done) {
            win.webContents.send("load-shp", results);
          }
          else {
            results.push(ArcGIS.convert(result.value));
            return source.read().then(log);
          }
        }))
      .catch(error => console.error(error.stack));
  });
});


