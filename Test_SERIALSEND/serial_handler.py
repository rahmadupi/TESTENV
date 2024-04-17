import serial
import serial.tools.list_ports
import struct
import paho.mqtt.client as mqtt
import json
import virose_com_lib as virose
import threading
import os
import binascii
import time

servo_type="None"
esp_mac_index=2
motion="111" # [0] - bucket, [1] - movie, [2] - unit
loc_motion_bucket="../data/"+servo_type+"/motion_bucket/"
loc_motion_movie="../data/"+servo_type+"/motion_movie/"
loc_motion_unit="../data/"+servo_type+"/motion_unit/"

def update_variable(servo, what_motion):
    global loc_motion_bucket
    global loc_motion_movie
    global loc_motion_unit
    
    loc_motion_bucket="../data/"+servo+"/motion_bucket/"
    loc_motion_movie="../data/"+servo+"/motion_movie/"
    loc_motion_unit="../data/"+servo+"/motion_unit/"
    
    if what_motion==1:
        return loc_motion_bucket
    elif what_motion==2:
        return loc_motion_movie
    elif what_motion==3:
        return loc_motion_unit

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
        elif data in virose.Command.__members__: 
            data = virose.Command[data].value.to_bytes(1, byteorder='little')
        # === FLOAT in STRING ===
        else:                                     
            data = struct.pack('f', float(data))
    # === LIST ===
    elif type(data) == list:
        data = b''.join([convert_to_bytes(x) for x in data])
    # === INT ===
    elif type(data) == int:                                          
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
    try:
        for i in range(len(data)):
            data[i]= convert_to_bytes(data[i])
            
        # +1 for cmd
        len_data = len(b''.join(data)) + 1
        mac_index= 255 if mac_index == -1 else mac_index
        byte_data=b''+bytes([0xFD])+convert_to_bytes(mac_index)+convert_to_bytes(len_data)+convert_to_bytes(cmd.value)+b''.join(data)+ b'\n'
        # debug
        print("[TO ESP] MAC:", mac_index, "| CMD:", (virose.Command(cmd)).name, "| Size:", len_data + 3)

        ser.write(byte_data)
        time.sleep(0.1)
        
        return True
    except Exception as err:
        print(f"[-] Serial send error: {err}")
        return False

def serial_recv():
    header = ser.read(1)
    # MONITOR: read until \n and publish to mqtt
    # "[" = "x5B"
    if header == b'\x5B':
        data = b'\x5B' + ser.read_until(b'\n')
        #client.publish("esp32/monitor", data)
        return

    if header != b'\xFD':
        return
    
    mac_index = int.from_bytes(ser.read(), signed=True)
    len = int.from_bytes(ser.read())
    cmd = int.from_bytes(ser.read())
    data = ser.read(len - 1)

    # debugs
    data_debug = bytes([0xFD, 255 if mac_index == -1 else mac_index, len, cmd]) + data
    print("[FR ESP] MAC:", mac_index, "| CMD:", (virose.Command(cmd)).name, "| Size:", len + 2, "| Data:", data_debug.hex().upper())

    # convert data to json
    try:
        payload = virose.convert_to_json((virose.Command(cmd)).name, data)
    except:
        print("[ERROR] FATAL, command name not defined in ENUM virose_com_lib.py")
        exit()
    

    # client.publish("esp32/"+str(mac_index)+"/response", json.dumps(payload))
    
    
def active_send(what_motion):

    servo_type="MX"
        
    # header | mac index | cmd | tipe servo | jenis motion | nama | isi data | checksum | \n
    for i in range (2):
        directory=update_variable(servo_type, what_motion)
        for file in os.scandir(directory):
            #if file.is_file():
            with open(file.path, 'rb') as finput:
                cmd=virose.Command.DATA_INITIALIZATION_TO_MID
                name=str(file.name.split(".")[0]) #get filename
                file_data = (finput.read()) #get file data
                checksum=binascii.crc32(file_data) & 0xffffffff #get checksum
                if(servo_type=="MX"):
                    servo=1
                else:
                    servo=2
                data=[servo, what_motion, name, file_data, checksum]
                if(serial_send(cmd, data, esp_mac_index)):
                    print(f"[+] Serial send success: File sent - {name}")
                else:
                    print(f"[-] Terminating process - Send reset command to receiver esp")
                    #break
                    # send command to reset data to esp receiver
                    cmd=virose.Command.DATA_RESET
                    serial_send(cmd, 1)
                    exit()
                finput.close()
        servo_type="XL"
    
def begin_send():
    # send bucket
    if(motion[0]=="1"):
        active_send(1)
    # send movie
    if(motion[1]=="1"):
        active_send(2)
    # send unit
    if(motion[2]=="1"):
        active_send(3)

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
    # client = mqtt.Client()
    # client.on_connect = lambda client, userdata, flags, rc: client.subscribe("esp32/+/recv")
    # client.on_message = mqtt_on_message_cb
    # try:
    #     client.connect("localhost", 1883, 60)
    # except:
    #     print("[ERROR] Please run MQTT broker first")
    #     exit()

    # client.loop_start()
    # while not client.is_connected():
    #     pass
    # print("[MQTT] Connected")
    
    send_thread=threading.Thread(target=begin_send)
    send_thread.start()
    send_thread.join()

    while True:
        # Panggil fungsi serial_recv dalam loop utama
        if ser.in_waiting:
            serial_recv()

# #print(binascii.unhexlify(checksum).decode('utf-8'))
# data="fak"
# enc=data.encode('utf-8')
# print(enc)
# print(enc.decode('utf-8'))
            
# directory="../data/MX/motion_bucket/1.json"
# with open(directory, "r") as f:
#     data=f.read()
#     print(len(data))
# data=os.scandir(directory)
# for i in data:
#     if i.is_file():
#         print(i.name.split(".")[0])
