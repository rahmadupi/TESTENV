import serial
import serial.tools.list_ports
import struct
import paho.mqtt.client as mqtt
import json
import virose_com_lib as virose

def convert_to_bytes(data):
    # === FLOAT ===
    if type(data) == float: 
        data = struct.pack('f', data)
    # === BOOLEAN ===
    elif type(data) == bool:
        data = data.to_bytes(1, byteorder='little')
    elif type(data) == str:
        # === HEX in STRING ===
        if data[0:2] == "0x":                
            data = bytes.fromhex(data[2:])
        # === ENUM in STRING ===
        elif data in virose.State.__members__: 
            data = virose.State[data].value.to_bytes(1, byteorder='little')
        # === FLOAT in STRING ===
        else:                                     
            data = struct.pack('f', float(data))
    # === LIST ===
    elif type(data) == list:
        data = b''.join([convert_to_bytes(x) for x in data])
    # === INT ===
    else:                                          
        data = data.to_bytes(4, byteorder='little')
    
    return data

def mqtt_on_message_cb(client, userdata, msg):
    print("[MQTT] Callback, Topic: ", msg.topic, "| Message: ", str(msg.payload, "utf-8"))
    payload = json.loads(msg.payload)

    # "esp32/+/receive"
    mac_index = int(msg.topic.split("/")[1])
    try:
        cmd = virose.Command[payload["command"]].value
    except:
        print("[ERROR] Command not defined, Please define command in virose_com_lib.py")
        return
    data = []

    # filter to only value
    for _, value in payload["data"].items():
        data.append(value)

    serial_send(cmd, data, mac_index)

def serial_send(cmd, data, mac_index = -1):
    # filter all data type to bytes
    for i in range(len(data)):
        data[i] = convert_to_bytes(data[i])

    # +1 for cmd
    len_data = len(b''.join(data)) + 1
    data_send = bytes([0xFD, 255 if mac_index == -1 else mac_index, len_data, cmd]) + b''.join(data)

    # debug
    print("[TO ESP] MAC:", mac_index, "| CMD:", (virose.Command(cmd)).name, "| Size:", len_data + 3, "| Data:", data_send.hex().upper())

    ser.write(data_send)

def serial_recv():
    header = ser.read(1)
    # MONITOR: read until \n and publish to mqtt
    # "[" = "x5B"
    if header == b'\x5B':
        data = b'\x5B' + ser.read_until(b'\n')
        client.publish("esp32/monitor", data)
        return

    if header != b'\xFD':
        return
    
    mac_index = int.from_bytes(ser.read(), signed=True)
    len = int.from_bytes(ser.read())
    cmd = int.from_bytes(ser.read())
    data = ser.read(len - 1)

    # debug
    data_debug = bytes([0xFD, 255 if mac_index == -1 else mac_index, len, cmd]) + data
    print("[FR ESP] MAC:", mac_index, "| CMD:", (virose.Command(cmd)).name, "| Size:", len + 2, "| Data:", data_debug.hex().upper())

    # convert data to json
    try:
        payload = virose.convert_to_json((virose.Command(cmd)).name, data)
    except:
        print("[ERROR] FATAL, command name not defined in ENUM virose_com_lib.py")
        exit()

    client.publish("esp32/"+str(mac_index)+"/response", json.dumps(payload))

# Main program
if __name__ == "__main__":
    # Open serial port
    try :
        # with manual port
        PORT_COM = "COM1"
        ser = serial.Serial(PORT_COM, 115200, timeout=1)
        print("[Serial]", PORT_COM, "opened")
    except:
        try:
            print("[Serial] Port", PORT_COM, "not found")
            # Auto detect serial port
            ports = list(serial.tools.list_ports.comports())
            for p in ports:
                if "USB" in p.description:
                    port = p.device
                    break
            ser = serial.Serial(port, 115200, timeout=1)
            print("[Serial]", port, "opened with auto detect")
        except:
            print("[ERROR] Serial port not found")
            exit()

    # Setup MQTT
    client = mqtt.Client()
    client.on_connect = lambda client, userdata, flags, rc: client.subscribe("esp32/+/recv")
    client.on_message = mqtt_on_message_cb
    try:
        client.connect("localhost", 1883, 60)
    except:
        print("[ERROR] Please run MQTT broker first")
        exit()

    client.loop_start()
    while not client.is_connected():
        pass
    print("[MQTT] Connected")

    while True:
        # Panggil fungsi serial_recv dalam loop utama
        if ser.in_waiting:
            serial_recv()