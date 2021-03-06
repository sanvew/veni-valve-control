const int BUAD_RATE = 9600;

const byte NUM_OF_VALVES = 3;
// false - open, true - closed
#define VALVE_OPEN 0
#define VALVE_CLOSE 1
boolean VALVES_STATE[] = {VALVE_CLOSE, VALVE_CLOSE, VALVE_CLOSE};
// 1st element - opening pin, 2nd element - closing pin
const byte VALVES_PINS[NUM_OF_VALVES][2] = { {2, 3}, {4, 5}, {6, 7} };
const int VALVES_DELAYS[] = {1000, 1000, 1000};

void setup() {
    Serial.begin(BUAD_RATE);
    for (int i = 0; i < NUM_OF_VALVES; ++i)
        for (int j = 0; j < 2; ++j) {
            pinMode(VALVES_PINS[i][j], OUTPUT);
            digitalWrite(VALVES_PINS[i][j], HIGH);
        }
}

void loop() {
    /*
     * serial message format: {valve_number}:{command}
     * valve_number: [0, NUM_OF_VALVES)
     * command: {open, close, toggle}
     */
    if (Serial.available()) {
        String buff = Serial.readStringUntil('\n');
        int delimPos = buff.indexOf(':');
        int valveN = atoi(buff.substring(0, delimPos).c_str());
        if (valveN >= NUM_OF_VALVES || valveN < 0) {
            Serial.println("Unknown valveN: " + valveN);
        } else {
            String command = buff.substring(delimPos + 1);
            if (command == "toggle") {
                valve_toggle(valveN);
            } else if (command == "open") {
                valve_open(valveN);
            } else if (command == "close") {
                valve_close(valveN);
            } else {
                Serial.println("Unknown command: " + command);
            }
            Serial.print(valveN); Serial.println(VALVES_STATE[valveN] == VALVE_OPEN ? ":open" : ":close");
        }
    }
}

/*
 * Valve control functions
 */
void valve_toggle(int valveNum) {
    if (VALVES_STATE[valveNum] == VALVE_CLOSE) { // valve is closed, opening
        valve_open(valveNum);
    } else { // closing
        valve_close(valveNum);
    }
}

void valve_close(int valveNum) {
    digitalWrite(VALVES_PINS[valveNum][VALVE_CLOSE], LOW);
    delay(VALVES_DELAYS[valveNum]);
    digitalWrite(VALVES_PINS[valveNum][VALVE_CLOSE], HIGH);
    VALVES_STATE[valveNum] = VALVE_CLOSE;
}

void valve_open(int valveNum) {
    digitalWrite(VALVES_PINS[valveNum][VALVE_OPEN], LOW);
    delay(VALVES_DELAYS[valveNum]);
    digitalWrite(VALVES_PINS[valveNum][VALVE_OPEN], HIGH);
    VALVES_STATE[valveNum] = VALVE_OPEN;
}
