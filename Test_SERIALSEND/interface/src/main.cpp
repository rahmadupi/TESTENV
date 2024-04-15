#include <virose_com.h>

#include "Arduino.h"

/*   ┌——————————————————————————————————————————————————————————————————————————————————————————————┐
     │                                        Definitions                                           │
     └——————————————————————————————————————————————————————————————————————————————————————————————┘     */

#ifdef VERBOSE
#define DEBUG_PRINTF(...) Serial.printf(__VA_ARGS__)
#else
#define DEBUG_PRINTF(...)
#endif

void on_serial_recv_cb(const uint8_t *data, int len, int mac_index) {
    DEBUG_PRINTF("[SERIAL] RECV Data: ");
    for (int i = 0; i < len; i++) DEBUG_PRINTF("%d ", data[i]);
    DEBUG_PRINTF("\n");

    if (mac_index == -1) return;

    err_t result = esp_now_send(mac_addresses[mac_index], data, len);
    if (result != ESP_OK) DEBUG_PRINTF("[ESP-NOW] Error SEND: %s\n", esp_err_to_name(result));
}

void on_data_sent_cb(const uint8_t *mac, esp_now_send_status_t status) {
    uint8_t mac_index = getMACIndex(mac);
    ledStatus();

    DEBUG_PRINTF("[ESP-NOW] SEND to %s, Status: %s\n", mac_names[mac_index], status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}

void on_data_recv_cb(const uint8_t *mac, const uint8_t *data, int len) {
    uint8_t mac_index = getMACIndex(mac);
    ledStatus();

    DEBUG_PRINTF("[ESP-NOW] RECV from %s, Data: ", mac_names[mac_index]);
    for (int i = 0; i < len; i++) DEBUG_PRINTF("%d ", data[i]);
    DEBUG_PRINTF("\n");

    serial_send(data, len, mac_index);
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    DEBUG_PRINTF("[BOARD] Interface Program\n");
    DEBUG_PRINTF("[BOARD] Last upload: %s %s\n", __DATE__, __TIME__);

    /* Initialize ESP-NOW */
    esp_err_t result = initESPNow(ESP_MAC_INDEX, LED_BUILTIN);
    DEBUG_PRINTF("[ESP-NOW] Init: %s\n", esp_err_to_name(result));
}

void loop() {
    if (Serial.available()) serial_recv(on_serial_recv_cb);
}