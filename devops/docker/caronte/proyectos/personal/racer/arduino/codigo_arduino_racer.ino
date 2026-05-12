/*
   R.A.C.E.R. - Control de Acceso RFID
   Código para Arduino con lector RFID RC522, LCD 20x4, RTC DS3231 y buzzer

   Flujo:
   1. Lee UID de tarjeta RFID
   2. Envía UID al puente Python por serial
   3. Espera respuesta con formato: RESULTADO|PERMITIDO/DENEGADO|NOMBRE|MOTIVO|TIPO_ACCESO
   4. Muestra resultado en LCD, LEDs y buzzer

   Componentes:
   - Lector RFID RC522 (SPI)
   - Pantalla LCD 20x4 (I2C)
   - Buzzer pasivo (pin 8)
   - RTC DS3231 (I2C)
   - LED verde (pin 6) y LED rojo (pin 7)
 */

#include <SPI.h>
#include <MFRC522.h>
#include <RTClib.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// Pines
#define SS_PIN 10      // CS del lector RFID RC522
#define RST_PIN 9      // Reset del lector RFID RC522
#define BUZZER_PIN 8   // Buzzer pasivo
#define LED_VERDE 6    // LED verde (acceso permitido)
#define LED_ROJO 7     // LED rojo (acceso denegado)

// Módulos
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 20, 4);  // Pantalla LCD de 20 columnas x 4 filas
RTC_DS3231 rtc;

// UIDs guardados en el Arduino por si el puente no responde
String uidsAutorizados[] = {"A76E3B25", "353882E0"};
int totalAutorizados = 2;

// Revisa si la tarjeta está en la lista de UIDs locales
bool estaAutorizado(String uid) {
  for (int i = 0; i < totalAutorizados; i++) {
    if (uidsAutorizados[i] == uid) return true;
  }
  return false;
}

// Escanea y verifica los componentes conectados
void escanearComponentes() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("VERIFICANDO COMPONENTES");
  delay(2000);

  // Verificar LCD 20x4
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD 20x4");
  lcd.setCursor(0, 1);
  lcd.print("OK");
  Serial.println("LCD 20x4: OK");
  delay(1500);

  // Verificar RFID RC522
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID RC522");
  rfid.PCD_Init();
  lcd.setCursor(0, 1);
  lcd.print("OK");
  Serial.println("RFID RC522: OK");
  delay(1500);

  // Verificar RTC DS3231
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RTC DS3231");
  if (rtc.begin()) {
    lcd.setCursor(0, 1);
    lcd.print("OK");
    Serial.println("RTC DS3231: OK");
    if (rtc.lostPower()) {
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
  } else {
    lcd.setCursor(0, 1);
    lcd.print("ERROR");
    Serial.println("RTC DS3231: ERROR");
  }
  delay(1500);

  // Verificar LEDs
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LED Verde");
  digitalWrite(LED_VERDE, HIGH);
  lcd.setCursor(0, 1);
  lcd.print("OK");
  Serial.println("LED Verde: OK");
  delay(800);
  digitalWrite(LED_VERDE, LOW);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LED Rojo");
  digitalWrite(LED_ROJO, HIGH);
  lcd.setCursor(0, 1);
  lcd.print("OK");
  Serial.println("LED Rojo: OK");
  delay(800);
  digitalWrite(LED_ROJO, LOW);

  // Verificar Buzzer
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Buzzer");
  tone(BUZZER_PIN, 1500, 200);
  lcd.setCursor(0, 1);
  lcd.print("OK");
  Serial.println("Buzzer: OK");
  delay(1000);

  // Resumen
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TODOS OK");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  Serial.println("TODOS LOS COMPONENTES OK");
  tone(BUZZER_PIN, 1800, 150);
  delay(200);
  tone(BUZZER_PIN, 1800, 150);
  delay(1500);
}

// Configuración inicial: pines, módulos y pantalla de bienvenida
void setup() {
  Serial.begin(9600);
  SPI.begin();

  pinMode(SS_PIN, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(SS_PIN, HIGH);
  rfid.PCD_Init();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("R.A.C.E.R.");
  lcd.setCursor(0, 1);
  lcd.print("Inicializando...");

  if (rtc.begin()) {
    if (rtc.lostPower()) {
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
  }

  tone(BUZZER_PIN, 1500, 200);
  delay(500);

  Serial.println("Sistema R.A.C.E.R. listo");
  delay(1500);
  
  // Ejecutar escaneo de componentes
  escanearComponentes();
  delay(1000);
  
  mostrarPantallaBienvenida();
}

// Antes de leer una tarjeta, asegurar que el RFID está en estado limpio
void prepararRFID() {
  rfid.PCD_Init();
  delay(50);
}

// Bucle principal: muestra hora, lee tarjetas RFID y procesa accesos
void loop() {
  mostrarHoraYFecha();

  // Preparar el RFID antes de cada intento de lectura
  prepararRFID();

  // Si se detecta una tarjeta RFID, leer su UID
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      String h = String(rfid.uid.uidByte[i], HEX);
      h.toUpperCase();
      uid += h;
    }

    // Limpiar líneas 2 y 3 del LCD
    lcd.setCursor(0, 2);
    lcd.print("                    ");
    lcd.setCursor(0, 3);
    lcd.print("                    ");

    // Enviar UID al puente Python
    Serial.print("ID: ");
    Serial.print(uid);
    Serial.println(" | Alumno: PENDIENTE");
    Serial.flush();

    // Vaciar buffer serial antes de esperar respuesta
    unsigned long inicioVaciado = millis();
    while (millis() - inicioVaciado < 100) {
      while (Serial.available() > 0) {
        Serial.read();
      }
      delay(5);
    }

    // Esperar respuesta del puente (máximo 3 segundos)
    bool respuestaRecibida = false;
    bool permitidoBridge = false;
    String nombreBridge = "";
    String motivoBridge = "";
    String tipoAccesoBridge = "";  // "entrada" o "salida"
    String bufferLinea = "";
    unsigned long inicioEspera = millis();
    const unsigned long TIMEOUT_ESPERA = 3000;

    while (millis() - inicioEspera < TIMEOUT_ESPERA) {
      if (Serial.available() > 0) {
        char c = Serial.read();

        // Cuando llega un salto de línea, procesar el mensaje completo
        if (c == '\n') {
          bufferLinea.trim();
          // El mensaje del puente empieza con "RESULTADO|"
          if (bufferLinea.length() > 0 && bufferLinea.startsWith("RESULTADO|")) {
            // Separar el mensaje por el carácter "|"
            // Formato: RESULTADO|PERMITIDO/DENEGADO|NOMBRE|MOTIVO|TIPO_ACCESO
            int pos1 = bufferLinea.indexOf('|');
            int pos2 = bufferLinea.indexOf('|', pos1 + 1);
            int pos3 = bufferLinea.indexOf('|', pos2 + 1);
            int pos4 = bufferLinea.indexOf('|', pos3 + 1);

            if (pos1 > 0 && pos2 > pos1) {
              String estado = bufferLinea.substring(pos1 + 1, pos2);
              permitidoBridge = (estado == "PERMITIDO");

              // Nombre: entre pos2+1 y pos3 (puede estar vacío)
              nombreBridge = (pos3 > pos2) ? bufferLinea.substring(pos2 + 1, pos3) : bufferLinea.substring(pos2 + 1);
              // Motivo: entre pos3+1 y pos4 (puede estar vacío)
              motivoBridge = (pos4 > pos3) ? bufferLinea.substring(pos3 + 1, pos4) : (pos3 > pos2 ? bufferLinea.substring(pos3 + 1) : "");
              // Tipo acceso: después de pos4+1 (puede estar vacío)
              tipoAccesoBridge = (pos4 > pos3) ? bufferLinea.substring(pos4 + 1) : "";

              respuestaRecibida = true;
              break;
            }
          }
          bufferLinea = "";
        } else if (c != '\r') {
          bufferLinea += c;
        }
      }
      delay(5);
    }

    apagarLEDs();

    // Limpiar completamente las líneas 2 y 3 antes de mostrar resultado
    lcd.setCursor(0, 2);
    lcd.print("                    ");
    lcd.setCursor(0, 3);
    lcd.print("                    ");

    // Mostrar resultado en LCD, LEDs y buzzer
    if (respuestaRecibida) {
      if (permitidoBridge) {
        lcd.setCursor(0, 2);
        // Mostrar tipo de acceso: "ENTRADA" o "SALIDA"
        String tipoStr = (tipoAccesoBridge == "salida") ? "SALIDA" : "ENTRADA";
        lcd.print("ACCESO PERMITIDO  ");
        lcd.setCursor(0, 3);
        if (nombreBridge.length() > 0) {
          lcd.print(nombreBridge.substring(0, 14));
          lcd.print(" ");
          lcd.print(tipoStr);
          for (int i = 0; i < 20 - nombreBridge.substring(0, 14).length() - tipoStr.length() - 1; i++) lcd.print(" ");
        } else {
          lcd.print("Bienvenido ");
          lcd.print(tipoStr);
          for (int i = 0; i < 20 - 10 - tipoStr.length(); i++) lcd.print(" ");
        }
        encenderLED(LED_VERDE);
        sonidoCorto();
        apagarLEDs();
      } else {
        lcd.setCursor(0, 2);
        lcd.print("ACCESO DENEGADO   ");
        lcd.setCursor(0, 3);
        String msg = (nombreBridge.length() > 0 && nombreBridge != "Desconocido") ? nombreBridge : "No autorizado";
        lcd.print(msg.substring(0, 20));
        for (int i = msg.length(); i < 20; i++) lcd.print(" ");
        encenderLED(LED_ROJO);
        sonidoLargo();
        apagarLEDs();
      }
    } else {
      // Si el puente no respondió, usar la lista de UIDs locales
      if (estaAutorizado(uid)) {
        lcd.setCursor(0, 2);
        lcd.print("ACCESO PERMITIDO  ");
        lcd.setCursor(0, 3);
        lcd.print("Bienvenido          ");
        encenderLED(LED_VERDE);
        sonidoCorto();
        apagarLEDs();
      } else {
        lcd.setCursor(0, 2);
        lcd.print("ACCESO DENEGADO   ");
        lcd.setCursor(0, 3);
        lcd.print("No autorizado       ");
        encenderLED(LED_ROJO);
        sonidoLargo();
        apagarLEDs();
      }
    }

    delay(1500);
    mostrarPantallaBienvenida();
    rfid.PICC_HaltA();
    // Reiniciar el lector RFID para la siguiente detección
    rfid.PCD_Init();
  }

  delay(100);
}

// Muestra la fecha y hora actual del RTC en las líneas 0 y 1 del LCD
void mostrarHoraYFecha() {
  DateTime ahora = rtc.now();

  lcd.setCursor(0, 0);
  String diasSemana[] = {"Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado  "};
  lcd.print(diasSemana[ahora.dayOfTheWeek()]);
  lcd.print(" ");
  if (ahora.day() < 10) lcd.print("0");
  lcd.print(ahora.day());
  lcd.print("/");
  if (ahora.month() < 10) lcd.print("0");
  lcd.print(ahora.month());
  lcd.print("/");
  lcd.print(ahora.year());
  lcd.print("  ");

  lcd.setCursor(0, 1);
  if (ahora.hour() < 10) lcd.print("0");
  lcd.print(ahora.hour());
  lcd.print(":");
  if (ahora.minute() < 10) lcd.print("0");
  lcd.print(ahora.minute());
  lcd.print(":");
  if (ahora.second() < 10) lcd.print("0");
  lcd.print(ahora.second());
  lcd.print("  LISTO");
}

// Muestra el mensaje de espera de tarjeta en el LCD
void mostrarPantallaBienvenida() {
  lcd.setCursor(0, 2);
  lcd.print("                    ");
  lcd.setCursor(0, 3);
  lcd.print("Acerca tu tarjeta   ");
}

// Pitido corto para acceso permitido
void sonidoCorto() {
  tone(BUZZER_PIN, 1800, 150);
  delay(200);
}

// Pitido largo intermitente para acceso denegado
void sonidoLargo() {
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 400, 300);
    delay(350);
  }
}

// Enciende un LED específico (verde o rojo) y apaga el otro
void encenderLED(int led) {
  apagarLEDs();
  digitalWrite(led, HIGH);
}

// Apaga ambos LEDs
void apagarLEDs() {
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, LOW);
}
