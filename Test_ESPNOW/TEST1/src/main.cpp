#include <Arduino.h>
#include <ArduinoJson.h>
#include <CRC32.h>
#include <SPIFFS.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define MAC_COUNT 2
#define MAC_LENGTH 6
#define TARGET 1
#define CHUNK_SIZE 240

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
SemaphoreHandle_t xSemaphore = NULL;
CRC32 crc;

void on_data_recv_cb(const uint8_t* mac, const uint8_t* data, int data_len) {
    COMMAND cmd = (COMMAND)data[0];

    if (cmd == GET_MOTION_NAME) {
        int id = *(int*)&data[1];
        Serial.print("[+] Get Command: GET_MOTION_NAME\nGet ID:");
        Serial.println(id);
        File file = SPIFFS.open("/MX/motion_movie.json", "r");
        if (!file) {
            Serial.println("[-] Failed to open file for reading");
            return;
        } else {
            Serial.println("[+] File opened: " + String(file.name()));
        }

        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (error) {
            Serial.println("[-] Failed to read file");
            return;
        }

        String MOVIE_NAME = doc["MOVIE"][id]["name"].as<String>().c_str();
        Serial.printf("[+] Get: %s", MOVIE_NAME);
        // String BUCKET_NAME= motion_mx.motion_movie.name;

        uint8_t* buffer = (uint8_t*)MOVIE_NAME.c_str();
        size_t sizeBuff = sizeof(buffer) * MOVIE_NAME.length();

        uint8_t* data_sent = new byte[sizeBuff + 1];
        data_sent[0] = RESPONSE_MOTION_NAME;
        // memcpy(data_sent, RESPONSE_MOTION_NAME, 1);
        memcpy(data_sent + 1, buffer, sizeBuff);

        esp_now_send(mac_address[TARGET], data_sent, sizeBuff + 1);
        delete[] data_sent;
        file.close();
    }
    if (cmd == GET_MOTION_LIST) {
        Serial.printf("[GET] Motion Bucket\n");
        // uint8_t bucket_id=data[1];
        File file = SPIFFS.open("/MX/motion_bucket/4.json", FILE_READ);
        if (!file) {
            Serial.printf("Failed to open file for reading\n");
            return;
        }
        // size
        int file_size = file.size();
        Serial.printf("[+] File size: %d\n", file_size);

        // calculate chunk
        uint8_t total_chunk = ceil(file_size / CHUNK_SIZE) + 1;

        // generate checksum
        byte temp[file.size()];
        file.read(temp, file.size());
        uint32_t checksum = CRC32::calculate(temp, file.size());
        file.seek(0);
        // file.close();

        // file = SPIFFS.open("/MX/motion_bucket/4.json", FILE_READ);
        // if (!file) {
        //     Serial.printf("Failed to open file for reading\n");
        //     return;
        // }

        for (uint8_t i = 0; i < total_chunk + 1; i++) {
            if (i == 0) {
                byte data_send[3 + 4] = {RESPONSE_MOTION_LIST, 1, total_chunk};
                memcpy(data_send + 3, &checksum, sizeof(checksum));
                esp_now_send(mac_address[TARGET], data_send, 3 + 4);
                Serial.printf("[+] Total chunk: %d, Checksum: %s\n", total_chunk, String(checksum));
                // mac_index != -1 ? (void)esp_now_send(mac_address[mac_index], data_send, sizeof(data_send)) : serial_send(data_send, sizeof(data_send), mac_index);
                // crc.reset();
            } else {
                if (i < total_chunk) {
                    byte data_send[CHUNK_SIZE + 3] = {RESPONSE_MOTION_LIST, 2, i};
                    file.read(data_send + 3, CHUNK_SIZE);
                    // crc.update(data_send + 3, CHUNK_SIZE);

                    // uint32s_t checksum = CRC32::calculate(data_send, 6 + CHUNK_SIZE);
                    // memcpy(data_send + 2, &checksum, sizeof(checksum));

                    esp_err_t send = esp_now_send(mac_address[TARGET], data_send, CHUNK_SIZE + 3);

                    if (send == 0) Serial.printf("[+] Send Success Chunk: %d\n", i);

                    // mac_index != -1 ? (void)esp_now_send(mac_address[mac_index], data_send, sizeof(data_send))
                    //                 : serial_send(data_send, sizeof(data_send), mac_index);
                } else {
                    byte data_send[file_size % CHUNK_SIZE + 3] = {RESPONSE_MOTION_LIST, 2, i};
                    file.read(data_send + 3, file_size % CHUNK_SIZE);
                    // crc.update(data_send + 3, file_size % CHUNK_SIZE);

                    // uint32_t checksum = crc.finalize();
                    // uint32_t checksum = CRC32::calculate(data_send, 6 + file_size % 240);
                    // memcpy(data_send + 3 + (file_size % CHUNK_SIZE), &checksum, sizeof(checksum));

                    esp_err_t send = esp_now_send(mac_address[TARGET], data_send, file_size % CHUNK_SIZE + 3);

                    if (send == 0) Serial.printf("[+] Send Success Chunk: %d\n", i);

                    // mac_index != -1 ? (void)esp_now_send(mac_addresses[mac_index], data_send, sizeof(data_send))
                    //                 : serial_send(data_send, sizeof(data_send), mac_index);
                }
            }
            vTaskDelay(500 / portTICK_PERIOD_MS);
        }
        // Send Checksum State 3
        // byte data_send[6] = {RESPONSE_MOTION_LIST, 3};
        // // uint32_t checksum = crc.finalize();
        // memcpy(data_send + 2, &checksum, sizeof(checksum));
        // esp_now_send(mac_address[TARGET], data_send, 6);

        file.close();
    }
}

esp_now_send_status_t global_send_status;
void on_data_sent_cb(const uint8_t* mac, esp_now_send_status_t status) {
    xSemaphoreGive(xSemaphore);
    Serial.print(status == ESP_NOW_SEND_SUCCESS ? "[+] Data sent with success: " : "[-] Data failed to send: ");
    global_send_status = status;
    Serial.println(global_send_status);
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

void setup() {
    if (!SPIFFS.begin(true)) {
        Serial.println("[-] An Error has occurred while mounting SPIFFS");
        return;
    }
    Serial.begin(115200);
    xSemaphore = xSemaphoreCreateBinary();
    initESPNow(0);
    Serial.println(WiFi.macAddress());
}

void loop() {
    // serial_event();
    //  put your main code here, to run repeatedly:
}