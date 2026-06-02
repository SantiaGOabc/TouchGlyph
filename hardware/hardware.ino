#include <WiFi.h>
#include <WebServer.h>
#include <BleKeyboard.h>

BleKeyboard bleKeyboard("BrailleKeyboard", "ESP32", 100);

const char* ssid = "Braille_ESP";
const char* password = "12345678";

const int pSubida[] = {15, 17, 16, 19, 14, 21};
const int pBajada[] = {3, 22, 5, 1, 23, 27};
const int pEntrada[] = {34, 39, 36, 35, 32, 33, 25, 26};
const int pinEnter = 27;
const int pinLED = 2;

bool estados[6] = {0};
bool modoNumero = false;

unsigned long lastBleAttempt = 0;
const unsigned long bleRetryInterval = 5000;
bool bleWasConnected = false;

// Debounce mejorado con tiempo de combinación
unsigned long lastStableRead = 0;
const unsigned long stableDelay = 60;
bool lastStableState[9] = {0};
bool currentStableState[9] = {0};
unsigned long comboStartTime = 0;
const unsigned long comboTimeout = 200;

WebServer server(80);

const uint8_t braille[26] = {
  0x01, 0x03, 0x05, 0x0D, 0x09, 0x07, 0x0F, 0x0B, 0x06, 0x0E,
  0x11, 0x13, 0x15, 0x1D, 0x19, 0x17, 0x1F, 0x1B, 0x16, 0x1E,
  0x31, 0x33, 0x2E, 0x35, 0x3D, 0x39
};

void updateLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  if (bleKeyboard.isConnected()) {
    digitalWrite(pinLED, HIGH);
  } else {
    if (millis() - lastBlink > 500) {
      ledState = !ledState;
      digitalWrite(pinLED, ledState);
      lastBlink = millis();
    }
  }
}

void manageBLEConnection() {
  bool isConnected = bleKeyboard.isConnected();
  
  if (isConnected != bleWasConnected) {
    bleWasConnected = isConnected;
  }
  
  if (!isConnected && (millis() - lastBleAttempt > bleRetryInterval)) {
    bleKeyboard.end();
    delay(100);
    bleKeyboard.begin();
    lastBleAttempt = millis();
  }
}

// Debounce mejorado con detección de combinaciones
bool readStableButtons() {
  static bool waitingForCombo = false;
  
  // Leer estado actual de todos los botones
  bool currentReading[9];
  for (int i = 0; i < 8; i++) {
    currentReading[i] = (digitalRead(pEntrada[i]) == LOW);
  }
  currentReading[8] = (digitalRead(pinEnter) == LOW);
  
  // Verificar si hay botones presionados
  bool anyPressed = false;
  for (int i = 0; i < 9; i++) {
    if (currentReading[i]) {
      anyPressed = true;
      break;
    }
  }
  
  if (anyPressed && !waitingForCombo) {
    // Iniciar detección de combinación
    waitingForCombo = true;
    comboStartTime = millis();
    return false;
  }
  
  if (waitingForCombo) {
    // Esperar a que la combinación se estabilice
    if (millis() - comboStartTime >= stableDelay) {
      // Tiempo de combinación completado, leer estado final
      for (int i = 0; i < 9; i++) {
        currentStableState[i] = currentReading[i];
      }
      waitingForCombo = false;
      return true;
    }
    return false;
  }
  
  // Sin botones presionados, actualizar estado estable rrapido
  if (millis() - lastStableRead >= 20) {
    for (int i = 0; i < 9; i++) {
      currentStableState[i] = currentReading[i];
    }
    lastStableRead = millis();
    return true;
  }
  
  return false;
}

bool isAnyButtonPressed() {
  for (int i = 0; i < 8; i++) {
    if (currentStableState[i]) return true;
  }
  if (currentStableState[8]) return true;
  return false;
}

void waitForButtonRelease() {
  unsigned long startWait = millis();
  while (isAnyButtonPressed()) {
    readStableButtons();
    if (millis() - startWait > 2000) {
      break;
    }
    delay(30);
  }
}

void controlPunto(int p, bool e) {
  if (p < 0 || p >= 6) return;
  estados[p] = e;
  digitalWrite(e ? pSubida[p] : pBajada[p], HIGH);
  delay(50);
  digitalWrite(e ? pSubida[p] : pBajada[p], LOW);
}

void controlLetra(char l) {
  l = tolower(l);
  if (l < 'a' || l > 'z') return;
  uint8_t m = braille[l - 'a'];
  for (int i = 0; i < 6; i++) {
    bool activo = (m & (1 << i));
    if (estados[i] != activo) controlPunto(i, activo);
  }
}

void limpiarPuntos() {
  for (int i = 0; i < 6; i++) if (estados[i]) controlPunto(i, false);
}

char mapBraille(int p) {
  const char letras[] = "abcdefghij";
  if (p >= 0x01 && p <= 0x0E) {
    for (int i = 0; i < 10; i++) if (braille[i] == p) return letras[i];
  }
  if (p >= 0x11 && p <= 0x1E) {
    for (int i = 10; i < 20; i++) if (braille[i] == p) return 'a' + i;
  }
  if (p >= 0x2E && p <= 0x3D) {
    for (int i = 20; i < 26; i++) if (braille[i] == p) return 'a' + i;
  }
  return 0;
}

char mapBrailleNumero(int p) {
  const char numeros[] = "1234567890";
  for (int i = 0; i < 10; i++) {
    if (braille[i] == p) return numeros[i];
  }
  char c = mapBraille(p);
  if (c >= 'a' && c <= 'z') modoNumero = false;
  return c;
}

bool sendKeySafe(char key) {
  if (!bleKeyboard.isConnected()) {
    return false;
  }
  
  bleKeyboard.print(key);
  return true;
}

bool sendSpecialKeySafe(uint8_t key) {
  if (!bleKeyboard.isConnected()) {
    return false;
  }
  
  bleKeyboard.press(key);
  delay(30);
  bleKeyboard.release(key);
  return true;
}

void procesarBLE() {
  static unsigned long lastProcess = 0;
  if (millis() - lastProcess < 25) return;
  lastProcess = millis();

  // Solo procesar si tenemos un estado estable
  if (!readStableButtons()) {
    return;
  }

  bool b[8];
  bool bEnter = currentStableState[8];
  
  for (int i = 0; i < 8; i++) {
    b[i] = currentStableState[i];
  }

  // Verificar si hay botones presionados
  if (!isAnyButtonPressed()) {
    return;
  }

  if (bEnter) {
    sendSpecialKeySafe(KEY_RETURN);
    waitForButtonRelease();
  } else if (b[6]) {
    sendKeySafe(' ');
    modoNumero = false;
    waitForButtonRelease();
  } else if (b[7]) {
    sendSpecialKeySafe(KEY_BACKSPACE);
    waitForButtonRelease();
  } else {
    int patron = 0;
    for (int i = 0; i < 6; i++) {
      if (b[i]) patron |= (1 << i);
    }
    
    if (patron > 0) {      
      if (patron == 0x3C) {
        modoNumero = true;
        waitForButtonRelease();
      } else if (patron == 0x30) {
        modoNumero = false;
        waitForButtonRelease();
      } else {
        char c;
        if (modoNumero) {
          c = mapBrailleNumero(patron);
        } else {
          c = mapBraille(patron);
        }
        
        if (c != 0) {
          sendKeySafe(c);
        }
        waitForButtonRelease();
      }
    }
  }
}

void enableCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
}

void handleRoot() {
  enableCORS();
  server.send(200, "application/json", "{\"status\":\"OK\"}");
}

void handleToggle() {
  enableCORS();
  if (server.hasArg("punto")) {
    int i = server.arg("punto").toInt();
    if (i >= 0 && i < 6) {
      controlPunto(i, !estados[i]);
      server.send(200, "application/json", "{\"punto\":" + String(i) + ",\"estado\":" + String(estados[i]) + "}");
      return;
    }
  }
  server.send(400, "application/json", "{\"error\":1}");
}

void handleLetra() {
  enableCORS();
  if (server.hasArg("char")) {
    char l = tolower(server.arg("char")[0]);
    if (l >= 'a' && l <= 'z') {
      controlLetra(l);
      String r = "{\"letra\":\"" + String(l) + "\",\"estados\":[";
      for (int i = 0; i < 6; i++) r += String(estados[i]) + (i < 5 ? "," : "");
      r += "]}";
      server.send(200, "application/json", r);
      return;
    }
  }
  server.send(400, "application/json", "{\"error\":2}");
}

void handleEstado() {
  enableCORS();
  String r = "{\"estados\":[";
  for (int i = 0; i < 6; i++) r += String(estados[i]) + (i < 5 ? "," : "");
  r += "],\"ble_conectado\":" + String(bleKeyboard.isConnected()) + "}";
  server.send(200, "application/json", r);
}

void handleClear() {
  enableCORS();
  limpiarPuntos();
  server.send(200, "application/json", "{\"mensaje\":1}");
}

void handleDebug() {
  enableCORS();
  String r = "{\"debug\":[";
  for (int i = 0; i < 8; i++) {
    r += String(digitalRead(pEntrada[i]) == LOW ? "1" : "0");
    if (i < 7) r += ",";
  }
  r += "],\"enter\":" + String(digitalRead(pinEnter) == LOW ? "1" : "0") + "}";
  server.send(200, "application/json", r);
}

void handleResetBLE() {
  enableCORS();
  bleKeyboard.end();
  delay(100);
  bleKeyboard.begin();
  server.send(200, "application/json", "{\"reset\":true}");
}

void setup() {
  Serial.begin(115200);

  pinMode(pinLED, OUTPUT);
  digitalWrite(pinLED, LOW);

  for (int i = 0; i < 6; i++) {
    pinMode(pSubida[i], OUTPUT);
    pinMode(pBajada[i], OUTPUT);
    digitalWrite(pSubida[i], LOW);
    digitalWrite(pBajada[i], LOW);
  }

  for (int i = 0; i < 8; i++) {
    pinMode(pEntrada[i], INPUT_PULLUP);
  }
  pinMode(pinEnter, INPUT_PULLUP);

  bleKeyboard.begin();

  WiFi.softAP(ssid, password);

  server.on("/", handleRoot);
  server.on("/toggle", handleToggle);
  server.on("/letra", handleLetra);
  server.on("/estado", handleEstado);
  server.on("/clear", handleClear);
  server.on("/debug", handleDebug);
  server.on("/reset-ble", handleResetBLE); //intento de reconexion
  
  server.begin();
}

void loop() {
  manageBLEConnection();
  updateLED();
  procesarBLE();
  server.handleClient();
  delay(10);
}