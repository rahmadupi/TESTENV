#include <Arduino.h>
#include <ArduinoJson.h>
#include <CRC32.h>
#include <PubSubClient.h>
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
    GET_MOTION_LIST,

    DATA_INITIALIZATION_TO_MID = 64,
} COMMAND;

uint8_t mac_address[MAC_COUNT][MAC_LENGTH] = {
    {0x24, 0x0A, 0xC4, 0x0A, 0x1A, 0x11},
    {0x24, 0x0A, 0xC4, 0x0A, 0x1B, 0x11},
};

esp_now_peer_info_t peer_info;
CRC32 crc;

void on_serial_recv_cb(const uint8_t* data, int len, int mac_index) {
    uint8_t cmd = data[0];
    if (cmd == DATA_INITIALIZATION_TO_MID) {
        uint8_t servo_type = data[1];
        uint8_t motion_type = data[2];
        uint8_t motion_index = data[3];
        uint8_t motion_data[len];
        memcpy(motion_data, data + 4, len - 8);
        uint32_t motion_cheksum;
        memcpy(&motion_cheksum, data + len - 4, sizeof(uint32_t));

        String servo = "";
        String motion = "";
        if (servo_type == 1)
            servo = "/MX/";
        else if (servo_type == 2)
            servo = "/XL/";
        if (motion_type == 1)
            motion = "motion_bucket/";
        else if (motion_type == 2)
            motion = "motion_movie/";
        else if (motion_type == 3)
            motion = "motion_unit/";

        File file = SPIFFS.open(servo_type + motion + String(motion_index) + ".json", FILE_WRITE);
        file.write(motion_data, len - 4);
        file.close();
        Serial.println(motion_index);
    }

    // DEBUG_PRINTF("[SERIAL] RECV Data: ");
    // for (int i = 0; i < len; i++) DEBUG_PRINTF("%d ", data[i]);
    // DEBUG_PRINTF("\n");

    // processing_command((uint8_t*)data, len, mac_index);
}

void serial_recv(void (*callback)(const uint8_t* data, int len, int mac_index)) {
    // Header
    uint8_t header = Serial.read();
    if (header != 0xFD) return;

    int8_t mac_index = Serial.read();
    uint8_t data_recv[5000];
    uint32_t len = Serial.readBytesUntil('\r\n', data_recv, 5000 - 1);

    // Callback
    callback(data_recv, len, mac_index);
}

// void on_data_recv_cb(const uint8_t* mac, const uint8_t* data, int data_len) {
//     COMMAND cmd = (COMMAND)data[0];
//     if (cmd == GET_MOTION_LIST) {
//         Serial.printf("[GET] Motion Bucket\n");
//         // uint8_t bucket_id=data[1];
//         File file = SPIFFS.open("/MX/motion_bucket/4.json", FILE_READ);
//         if (!file) {
//             Serial.printf("Failed to open file for reading\n");
//             return;
//         }
//         // size
//         int file_size = file.size();
//         Serial.printf("[+] File size: %d\n", file_size);

//         // calculate chunk
//         uint8_t total_chunk = ceil(file_size / CHUNK_SIZE) + 1;

//         // generate checksum
//         byte temp[file.size()];
//         file.read(temp, file.size());
//         uint32_t checksum = CRC32::calculate(temp, file.size());
//         file.seek(0);
//         // file.close();

//         // file = SPIFFS.open("/MX/motion_bucket/4.json", FILE_READ);
//         // if (!file) {
//         //     Serial.printf("Failed to open file for reading\n");
//         //     return;
//         // }

//         for (uint8_t i = 0; i < total_chunk + 1; i++) {
//             if (i == 0) {
//                 byte data_send[3 + 4] = {RESPONSE_MOTION_LIST, 1, total_chunk};
//                 memcpy(data_send + 3, &checksum, sizeof(checksum));
//                 esp_now_send(mac_address[TARGET], data_send, 3 + 4);
//                 Serial.printf("[+] Total chunk: %d, Checksum: %s\n", total_chunk, String(checksum));
//                 // mac_index != -1 ? (void)esp_now_send(mac_address[mac_index], data_send, sizeof(data_send)) : serial_send(data_send, sizeof(data_send), mac_index);
//                 // crc.reset();
//             } else {
//                 if (i < total_chunk) {
//                     byte data_send[CHUNK_SIZE + 3] = {RESPONSE_MOTION_LIST, 2, i};
//                     file.read(data_send + 3, CHUNK_SIZE);
//                     // crc.update(data_send + 3, CHUNK_SIZE);

//                     // uint32s_t checksum = CRC32::calculate(data_send, 6 + CHUNK_SIZE);
//                     // memcpy(data_send + 2, &checksum, sizeof(checksum));

//                     esp_err_t send = esp_now_send(mac_address[TARGET], data_send, CHUNK_SIZE + 3);

//                     if (send == 0) Serial.printf("[+] Send Success Chunk: %d\n", i);

//                     // mac_index != -1 ? (void)esp_now_send(mac_address[mac_index], data_send, sizeof(data_send))
//                     //                 : serial_send(data_send, sizeof(data_send), mac_index);
//                 } else {
//                     byte data_send[file_size % CHUNK_SIZE + 3] = {RESPONSE_MOTION_LIST, 2, i};
//                     file.read(data_send + 3, file_size % CHUNK_SIZE);
//                     // crc.update(data_send + 3, file_size % CHUNK_SIZE);

//                     // uint32_t checksum = crc.finalize();
//                     // uint32_t checksum = CRC32::calculate(data_send, 6 + file_size % 240);
//                     // memcpy(data_send + 3 + (file_size % CHUNK_SIZE), &checksum, sizeof(checksum));

//                     esp_err_t send = esp_now_send(mac_address[TARGET], data_send, file_size % CHUNK_SIZE + 3);

//                     if (send == 0) Serial.printf("[+] Send Success Chunk: %d\n", i);

//                     // mac_index != -1 ? (void)esp_now_send(mac_addresses[mac_index], data_send, sizeof(data_send))
//                     //                 : serial_send(data_send, sizeof(data_send), mac_index);
//                 }
//             }
//             vTaskDelay(500 / portTICK_PERIOD_MS);
//         }
//         file.close();
//     }
// }

// esp_now_send_status_t global_send_status;
// void on_data_sent_cb(const uint8_t* mac, esp_now_send_status_t status) {
//     Serial.print(status == ESP_NOW_SEND_SUCCESS ? "[+] Data sent with success: " : "[-] Data failed to send: ");
//     global_send_status = status;
//     Serial.println(global_send_status);
// }
// s
//     esp_err_t
//     initESPNow(uint8_t mac_index) {
//     esp_err_t result;

//     /* Init WiFi to Station Mode and disconnect from any AP */
//     WiFi.mode(WIFI_STA);
//     WiFi.disconnect();

//     /* Init ESP-NOW */
//     result = esp_now_init();
//     if (result != ESP_OK) return result;

//     /* Set callback function to handle received data */
//     result = esp_now_register_recv_cb(on_data_recv_cb);
//     if (result != ESP_OK) return result;

//     /* Set callback function to handle send data */
//     result = esp_now_register_send_cb(on_data_sent_cb);
//     if (result != ESP_OK) return result;

//     /* Set MAC Address */
//     uint8_t mac[MAC_LENGTH];
//     memcpy(mac, mac_address[mac_index], MAC_LENGTH);
//     result = esp_wifi_set_mac(WIFI_IF_STA, mac);
//     if (result != ESP_OK) return result;

//     /* Initialize peer_info and set fields*/
//     memset(&peer_info, 0, sizeof(esp_now_peer_info_t));
//     peer_info.channel = 0;
//     peer_info.encrypt = false;

//     /* Add All MAC to peer list  */
//     for (int i = 0; i < MAC_COUNT; i++) {
//         memcpy(peer_info.peer_addr, mac_address[i], MAC_LENGTH);
//         result = esp_now_add_peer(&peer_info);
//         if (result != ESP_OK) return result;
//     }

//     return ESP_OK;
// }

void serial_event() {
    int cmd = Serial.parseInt();
    String nama = "";
    if (cmd == 1) {
        // File test = SPIFFS.open("/MX/motion_bucket/1.json", "r");
        // JsonDocument doc;
        // deserializeJson(doc, test);
        // serializeJson(doc, Serial);

        File root = SPIFFS.open("/");
        File file = root.openNextFile();
        while (file) {
            Serial.printf("%s", file.name());
            file = root.openNextFile();
            JsonDocument doc2;
            deserializeJson(doc2, file);
            serializeJson(doc2, Serial);
        }
        root.close();
    }
}

void setup() {
    if (!SPIFFS.begin(true)) {
        Serial.println("[-] An Error has occurred while mounting SPIFFS");
        return;
    }
    Serial.begin(115200);
    // initESPNow(0);
}

void loop() {
    //   put your main code here, to run repeatedly:
    serial_recv(on_serial_recv_cb);
    File file = SPIFFS.open("/MX/motion_bucket/1.json", "r");
    JsonDocument doc2;
    deserializeJson(doc2, file);
    serializeJson(doc2, Serial);
    file.close();
    Serial.println("sssssssss");
    Serial.println(SPIFFS.usedBytes());

    // File root = SPIFFS.open("/");
    // File file = root.openNextFile();
    // while (file) {
    //     Serial.printf("%s", file.name());
    //     file = root.openNextFile();
    //     JsonDocument doc2;
    //     deserializeJson(doc2, file);
    //     serializeJson(doc2, Serial);
    // }
    // root.close();
}