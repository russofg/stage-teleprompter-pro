const { app, BrowserWindow, screen, ipcMain, shell } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let stageWindow;

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1200, width * 0.8),
    height: Math.min(800, height * 0.8),
    x: 50,
    y: 50,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
    },
    titleBarStyle: "default",
    show: false,
  });

  const startUrl = isDev
    ? "http://localhost:5173/"
    : `file://${path.join(__dirname, "../dist/index.html")}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (stageWindow) {
      stageWindow.close();
    }
    // Cerrar completamente la app cuando se cierra la ventana principal
    app.quit();
  });

  // DevTools SOLO en desarrollo - NUNCA en producción
  if (isDev && process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

function createStageWindow() {
  if (stageWindow) {
    stageWindow.show();
    return;
  }

  // Detectar monitor extendido
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  // Mejor lógica para detectar pantalla extendida en macOS
  let extendedDisplay = null;

  if (displays.length > 1) {
    // Buscar pantalla que esté a la derecha o izquierda de la principal
    extendedDisplay = displays.find((display) => {
      // Si la pantalla está a la derecha de la principal
      if (
        display.bounds.x >
        primaryDisplay.bounds.x + primaryDisplay.bounds.width
      ) {
        return true;
      }
      // Si la pantalla está a la izquierda de la principal
      if (display.bounds.x + display.bounds.width < primaryDisplay.bounds.x) {
        return true;
      }
      // Si la pantalla está arriba o abajo de la principal
      if (
        display.bounds.y >
          primaryDisplay.bounds.y + primaryDisplay.bounds.height ||
        display.bounds.y + display.bounds.height < primaryDisplay.bounds.y
      ) {
        return true;
      }
      return false;
    });
  }

  console.log("🖥️ Pantallas detectadas:", displays.length);
  console.log("🖥️ Pantalla principal:", primaryDisplay.bounds);
  if (extendedDisplay) {
    console.log("🖥️ Pantalla extendida encontrada:", extendedDisplay.bounds);
  } else {
    console.log("🖥️ No hay pantalla extendida");
  }

  let windowOptions = {
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
    },
    titleBarStyle: "default",
    alwaysOnTop: true,
    show: false,
  };

  if (extendedDisplay) {
    // Abrir en monitor extendido
    windowOptions.x = extendedDisplay.bounds.x + 100;
    windowOptions.y = extendedDisplay.bounds.y + 100;
    console.log("🎯 Stage window posicionada en pantalla extendida");
  } else {
    // Si no hay pantalla extendida, abrir a la derecha del monitor principal
    windowOptions.x =
      primaryDisplay.bounds.x + primaryDisplay.bounds.width + 50;
    windowOptions.y = primaryDisplay.bounds.y + 100;
    console.log(
      "🎯 Stage window posicionada a la derecha de la pantalla principal"
    );
  }

  stageWindow = new BrowserWindow(windowOptions);

  const startUrl = isDev
    ? "http://localhost:5173/#/stage"
    : `file://${path.join(__dirname, "../dist/index.html")}#/stage`;
  stageWindow.loadURL(startUrl);

  stageWindow.once("ready-to-show", () => {
    stageWindow.show();
  });

  stageWindow.on("closed", () => {
    stageWindow = null;
  });

  // DevTools SOLO en desarrollo - NUNCA en producción
  if (isDev && process.env.NODE_ENV === "development") {
    stageWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Siempre cerrar la app, incluso en macOS
  app.quit();
});

// IPC handlers
ipcMain.handle("open-stage-window", () => {
  createStageWindow();
  return { success: true };
});

ipcMain.handle("close-stage-window", () => {
  if (stageWindow) {
    stageWindow.hide();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("quit-app", () => {
  app.quit();
  return { success: true };
});

ipcMain.handle("open-external", (event, url) => {
  shell.openExternal(url);
  return { success: true };
});

ipcMain.handle("get-displays", () => {
  const displays = screen.getAllDisplays();
  return displays.map((display) => ({
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea,
    isPrimary: display.id === screen.getPrimaryDisplay().id,
  }));
});

// Funcionalidad de carga por URL REMOVIDA - muy complicada de implementar correctamente
