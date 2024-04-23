#include <Arduino.h>
#include <ArduinoJson.h>
#include <CRC32.h>
#include <SPIFFS.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

#define MAC_COUNT 2
#define MAC_LENGTH 6
#define TARGET 0

typedef enum {
    RESPONSE_MOTION_NAME = 64,
    GET_MOTION_NAME,
    RESPONSE_MOTION_LIST,
    GET_MOTION_LIST
} COMMAND;

uint8_t mac_address[MAC_COUNT][MAC_LENGTH] = {
    {0x24, 0x0A, 0xC4, 0x0A, 0x1A, 0x11},
    {0x24, 0x0A, 0xC4, 0x0A, 0x1B, 0x11},
};

esp_now_peer_info_t peer_info;
CRC32 crc;

uint8_t total_chunk = 0;
uint8_t received_chunk = 0;
uint32_t rchecksum = 0;
void on_data_recv_cb(const uint8_t *mac, const uint8_t *data, int data_len) {
    COMMAND cmd = (COMMAND)data[0];

    if (cmd == RESPONSE_MOTION_NAME) {
        char *rdata = (char *)&data[1];
        String name = String(rdata);
        Serial.printf("[+] Received motion name: %s\n", name.c_str());
    } else if (cmd == RESPONSE_MOTION_LIST) {
        uint8_t state = data[1];
        Serial.println("[RESPONSE] RESPONSE_MOTION_LIST");

        if (state == 1) {
            total_chunk = data[2];
            memcpy(&rchecksum, &data[3], sizeof(uint32_t));

            Serial.printf("[+] Chunk to be received: %d, Expected Checksum: %s\n", total_chunk, String(rchecksum));
            received_chunk = 0;
            // verified = false;
            if (SPIFFS.exists("/active_bucket.json")) SPIFFS.remove("/active_bucket.json");
            crc.reset();
        } else if (state == 2) {
            uint8_t chunk_number = data[2];

            File file = SPIFFS.open("/active_bucket.json", FILE_APPEND);
            crc.update(data + 3, data_len - 3);  // flaw
            file.write(&data[3], data_len - 3);
            file.close();

            if (!(received_chunk + 1 == chunk_number)) {
                Serial.printf("[-] Unexpected Chunk - Expected Chunk: %d, received: %d\n", received_chunk + 1, chunk_number);
            } else
                received_chunk++;

            if (received_chunk == total_chunk) {
                file = SPIFFS.open("/active_bucket.json", FILE_READ);
                byte temp[file.size()];
                file.read(temp, file.size());
                uint32_t gchecksum = CRC32::calculate(temp, file.size());
                Serial.println((uint32_t)crc.finalize());
                Serial.printf("rc: %s\ngc: %s\nChunk Received: %d/%d\n", String(rchecksum), String(gchecksum), received_chunk, total_chunk);
                file.close();
                if ((rchecksum == gchecksum) && (total_chunk == received_chunk)) {
                    Serial.println("[+] All Good");
                    // verified = true;
                } else {
                    Serial.println("[-] Invalid Checksum");
                    Serial.println("[-] Something Wrung I can Feel it\n[-] Removing Receiver File: active_bucket.json");
                    SPIFFS.remove("/active_bucket.json");
                }
            } else {
                Serial.printf("[-] Missing %d Chunk\nTotal chunk: %d, Received: %d\n", total_chunk - received_chunk, total_chunk, received_chunk);
                Serial.println("[-] Something Wrung I can Feel it, Removing receiver File: active_bucket.json");
                SPIFFS.remove("/active_bucket.json");
            }

        } else {
            Serial.println("[-] Unknown command");
        }
    }
}
void on_data_sent_cb(const uint8_t *mac, esp_now_send_status_t status) {
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "[+] Data sent with success" : "[-] Data failed to send");
}

esp_err_t initESPNow(uint8_t mac_index) {
    esp_err_t result;

    /* Init WiFi to Station Mode and disconnect from any AP */
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();

    /* Init ESP-NOW */
    result = esp_now_init();
    if (result != ESP_OK) return result;

    /* Set callback function to handle received data */
    result = esp_now_register_recv_cb(on_data_recv_cb);
    if (result != ESP_OK) return result;

    /* Set callback function to handle send data */
    result = esp_now_register_send_cb(on_data_sent_cb);
    if (result != ESP_OK) return result;

    /* Set MAC Address */
    uint8_t mac[MAC_LENGTH];
    memcpy(mac, mac_address[mac_index], MAC_LENGTH);
    result = esp_wifi_set_mac(WIFI_IF_STA, mac);
    if (result != ESP_OK) return result;

    /* Initialize peer_info and set fields*/
    memset(&peer_info, 0, sizeof(esp_now_peer_info_t));
    peer_info.channel = 0;
    peer_info.encrypt = false;

    /* Add All MAC to peer list  */
    for (int i = 0; i < MAC_COUNT; i++) {
        memcpy(peer_info.peer_addr, mac_address[i], MAC_LENGTH);
        result = esp_now_add_peer(&peer_info);
        if (result != ESP_OK) return result;
    }

    return ESP_OK;
}

void serial_event() {
    // data[0] = GET_MOTION_LIST;

    // esp_now_send(mac_address[TARGET], data, sizeof(data));

    int cmd = Serial.parseInt();
    if (Serial.available())
        cmd = Serial.parseInt();
    if (cmd == 1) {
        int id = 0;
        id = Serial.parseInt();
        Serial.printf("[+] Getting ID: %d data\n", id);
        uint8_t data[2];
        data[0] = GET_MOTION_NAME;
        data[1] = id;

        esp_now_send(mac_address[TARGET], data, sizeof(data));
    } else if (cmd == 2) {
        byte data[2];
        data[0] = GET_MOTION_LIST;

        esp_now_send(mac_address[TARGET], data, sizeof(data));
    } else if (cmd == 3) {
        // for (JsonVariant rdata : received_data_array) Serial.println(rdata.as<String>());
        File file = SPIFFS.open("/active_bucket.json", FILE_READ);
        // while (file.available()) {
        //     Serial.write(file.read());
        // }
        2ocument doc;
        deserializeJson(doc, file);
        serializeJsonPretty(doc, Serial);
        file.close();
    }
}

void setup() {
    if (!SPIFFS.begin(true)) {
        Serial.println("[-] An Error has occurred while mounting SPIFFS");
        return;
    }
    Serial.begin(115200);
    initESPNow(1);
    if (SPIFFS.exists("/active_bucket.json")) SPIFFS.remove("/active_bucket.json");
}

void loop() {
    serial_event();
}