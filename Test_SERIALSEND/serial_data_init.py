import serial
import serial.tools.list_ports
import struct
import paho.mqtt.client as mqtt
import json
import math
import virose_com_lib as virose
import threading
import os
import binascii
from time import sleep
import argparse
import re

#fixed value
max_chunk_size=200
servo_type="None"
stop=False

# option
motion="111" # [0] - bucket, [1] - movie, [2] - unit
display_data=False
time_delay=0.5
esp_mac_index=2

loc_default="../data/"
loc_motion_bucket="../data/"+servo_type+"/motion_bucket/"
loc_motion_movie="../data/"+servo_type+"/motion_movie/"
loc_motion_unit="../data/"+servo_type+"/motion_unit/"

# dynamic values
failed_send=0
current_file_sending=None
dir_data=[]
for i in os.scandir(loc_default+"MX/"):
    if i.is_dir():
        dir_data.append(i.name)
        
bucket_file_count=(len([i for i in os.scandir(loc_default+"MX/"+"motion_bucket/")]) + len([i for i in os.scandir(loc_default+"XL/"+"motion_bucket/")]))
movie_file_count=(len([i for i in os.scandir(loc_default+"MX/"+"motion_movie/")]) + len([i for i in os.scandir(loc_default+"XL/"+"motion_movie/")]))
unit_file_count=(len([i for i in os.scandir(loc_default+"MX/"+"motion_unit/")]) + len([i for i in os.scandir(loc_default+"XL/"+"motion_unit/")]))
total_file=[bucket_file_count, movie_file_count, unit_file_count]

send_count=[0,0,0] # [0] - bucket, [1] - movie, [2] - unit
send_status=[0,0,0] # [0] - bucket, [1] - movie, [2] - unit     1 means ongoing 2 means done

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')
    
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

def update_variable(servo, what_motion):
    global loc_motion_bucket
    global loc_motion_movie
    global loc_motion_unit
    
    loc_motion_bucket="../data/"+servo+"/motion_bucket/"
    loc_motion_movie="../data/"+servo+"/motion_movie/"
    loc_motion_unit="../data/"+servo+"/motion_unit/"
    
    if what_motion==virose.Motion.BUCKET:
        return loc_motion_bucket
    elif what_motion==virose.Motion.MOVIE:
        return loc_motion_movie
    elif what_motion==virose.Motion.UNIT:
        return loc_motion_unit

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

def serial_send(data, mac_index = -1, file=None):
    # filter all data type to bytes
    try:
       # +1 for cmd
        len_data =len(data)+1
        data+=bytes([0xFE, 0x0A])
        
        #byte_data=bytes([0xFD, 255 if mac_index == -1 else mac_index, cmd])+data+ bytes([0xFE, 0x0A])
        # debug
        if display_data:
            print("[TO ESP] MAC:", mac_index, "| CMD:", virose.Command.RESPONSE_MOTION_LIST.value, "| File: ", "INFO" if file==None else file.path ,"| Size:", len_data + 3, "| Data:", data.hex().upper())
            
        ret=ser.write(data)
        sleep(time_delay)
        
        return ret
    except Exception as err:
        if display_data:
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
    
def send_info(what_motion, file=None):
    # | header | mac_index | cmd | state        
    # | total_chunk | file_path | file_path_size | checksum - state DATA
    # | total_file - state INFO
    # default payload
    data_send=0
    if what_motion==virose.Motion.FILE:
        file_path=re.search(r'/data(.*\.json)', str(file.path)).group(1)
        data_send= bytes([0xFD, esp_mac_index,virose.Command.RESPONSE_MOTION_LIST.value, virose.State.SEND_INFO.value])
        chunk=math.ceil(os.path.getsize(file.path)/max_chunk_size).to_bytes(4, byteorder='little')
        with open(file.path, "rb") as fcheck:
            file_data=fcheck.read()
            checksum=(binascii.crc32(file_data) & 0xffffffff).to_bytes(4, byteorder='little') #get checksum
            fcheck.close()
        file_info=(len(file_path)).to_bytes(4, byteorder='little')+(file_path).encode('utf-8')
        data_send+=chunk+checksum+file_info
        if display_data:
            print(f"[+] File: {file_path} - Checksum: {checksum.hex().upper()}")
            
        if(serial_send(data_send, esp_mac_index)):
            if display_data:
                print(f"[+] Serial send success: File sent - INFO")
        else:
            failed_send=failed_send+1
            if display_data:
                print(f"[-] Error Send Failed")
        #send
        
def send_dir(what_motion):
    global send_status
    
    if what_motion==virose.Motion.BUCKET:
        send_status[0]=1
    elif what_motion==virose.Motion.MOVIE:
        send_status[1]=1
    elif what_motion==virose.Motion.UNIT:
        send_status[2]=1
        
    servo_type="MX"
    for i in range (2):
        directory=update_variable(servo_type, what_motion)
        for file in os.scandir(directory):
            if not file.is_file():
                continue
            send_file(file, what_motion)
        servo_type="XL"
    
    if what_motion==virose.Motion.BUCKET:
        send_status[0]=2
    elif what_motion==virose.Motion.MOVIE:
        send_status[1]=2
    elif what_motion==virose.Motion.UNIT:
        send_status[2]=2
    
def send_file(file, what_motion):
    global send_count
    global current_file_sending
    global failed_send
    current_file_sending=str(file.path)
    send_count=send_count
    
    # sending info
    send_info(virose.Motion.FILE, file)
    # default
    # | header(1) | mac index(1) | cmd(1) | state(1) | chunk_index(4) | isi data | 0xFE0A(2)
    # data_send= bytes([0xFD, virose.Command.RESPONSE_MOTION_LIST.value, virose.State.INIT_DATA.value])
    
    chunk_len=math.ceil(os.path.getsize(file.path)/max_chunk_size)
    if display_data:
        print(f"[+] total chunk: {chunk_len}")
    
    with open(file.path, 'rb') as finput:
        for i in range(1,chunk_len+1):
            data_send= bytes([0xFD, 255 if esp_mac_index == -1 else esp_mac_index,virose.Command.RESPONSE_MOTION_LIST.value, virose.State.SEND_DATA.value])
            file_data=finput.read(max_chunk_size)
            data_send+=(i+1).to_bytes(4, byteorder='little')+file_data 
            # send
            if(serial_send(data_send, esp_mac_index, file)):
                if display_data:
                    print(f"[+] Serial send success: File sent - {re.search(r'/data(.*\.json)', str(file.path)).group(1)} - chunk {i}")
            else:
                failed_send=failed_send+1
                if display_data:
                    print(f"[-] Error Send Failed")
        if what_motion==virose.Motion.BUCKET:
            send_count[0]+=1
        elif what_motion==virose.Motion.MOVIE:
            send_count[1]+=1
        elif what_motion==virose.Motion.UNIT:
            send_count[2]+=1
        finput.close()
        if display_data:
            print()

def begin_send():
    # flagged
    # tambahi state gae info data - | header | mac_index | cmd | state | total_chunk
    # state gae ngirim data - | header | mac index | cmd | state | chunk_index | file_path | file_path_size | isi data | 0xFE0A

    # end state
    # mecah setiap file nak beberapa chunk
    # parameter tipe servo tipe motion diganti alamat file ambek ukuran string e
    # gae handler e dok esp32
    # send bucket
    
    if display_data:
        print("[+] Begin data INIT:")
        print(f"[+] dir:{(len(dir_data)-1)*2}")
        for i in dir_data:
            print(i)
        print()
    
    #send bucket
    if(motion[0]=="1"):
        if display_data:    
            MX_dir=len([i for i in os.scandir(loc_default+"MX/"+"motion_bucket/")])
            XL_dir=len([i for i in os.scandir(loc_default+"XL/"+"motion_bucket/")])
            print("[+] Sending Bucket..............................................")
            print(f"MX: {MX_dir}, XL: {XL_dir}")
        
        #send_info(virose.Motion.BUCKET)
        send_dir(virose.Motion.BUCKET)
    # send movie
    if(motion[1]=="1"):
        if display_data:  
            MX_dir=len([i for i in os.scandir(loc_default+"MX/"+"motion_movie/")])
            XL_dir=len([i for i in os.scandir(loc_default+"XL/"+"motion_movie/")])
            print("[+] Sending Movie..............................................")
            print(f"MX: {MX_dir}, XL: {XL_dir}")
        
        #send_info(virose.Motion.MOVIE)
        send_dir(virose.Motion.MOVIE)
    # send unit
    if(motion[2]=="1"):
        if display_data:  
            MX_dir=len([i for i in os.scandir(loc_default+"MX/"+"motion_unit/")])
            XL_dir=len([i for i in os.scandir(loc_default+"XL/"+"motion_unit/")])
            print("[+] Sending Unit..............................................")
            print(f"MX: {MX_dir}, XL: {XL_dir}")
        
        #send_info(virose.Motion.UNIT)
        send_dir(virose.Motion.UNIT)

def weird_display():
    global stop
    file_send_count= []
    if motion[0]=='1':
        file_send_count.append(bucket_file_count)
    if motion[1]=='1':
        file_send_count.append(movie_file_count)
    if motion[2]=='1':
        file_send_count.append(unit_file_count)
        
    stop_thread=stop
    status=["Not included", "Not included", "Not included"]
    total_file_count=sum(file_send_count)
    left=0
    right=75
    
    calculate_bar= lambda left: sum(send_count)/total_file_count*75
    calculate_precentage= lambda left: (left/75)*100
    
    for i in range(len(motion)):
        if motion[i]=="1":
            status[i]="Waiting"
            
    if not display_data:
        while not stop_thread:
            clear()
            stop_thread=stop
            for i in range(len(motion)):
                if send_status[i]==1 and status[i]!="Not included":
                    status[i]="Waiting"
                elif send_status[i]==2 and status[i]!="Not included" and send_count[i]==total_file[i]:
                    status[i]="Done"
                
            print("[+] BEGIN RESPONSE_MOTION_LIST........................................................")
            for i in dir_data:
                print(i + " - " + str(send_count[dir_data.index(i)]) + "/" + str(total_file[dir_data.index(i)]) + " - " + status[dir_data.index(i)])
            print()
            
            left=int(calculate_bar(left))
            print("[+] Currently Sending:" + str(current_file_sending))
            print("[+] |"+ "#"*left + "-"*(right-left) + "| " + str(int(calculate_precentage(left)))+"%")
                
def parse_input():
    global motion
    global display_data
    global time_delay
    global esp_mac_index
    
    parser=argparse.ArgumentParser(prog='serial_data_init',
                    description='Mengirimkan data motion baik semua maupun spesifik dengan serial, melalui perantara esp dengan serial dan dari esp perantara ke esp bawah dengan esp_now',
                    epilog='[+] Rahmad Bisma Zulfi Pahlevi V0.9')
    parser.add_argument("-esp", "--esp-mac-index",dest='esp_mac_index', help="esp mac index destination", type=int, default=2)
    parser.add_argument("-m", "--motion",dest='motion_opt', help="tipe motion, 3 digit biner, 1 means send, 0 means not send, index 0-2 bucket, movie, unit", default="111", type=str, choices=['001', '011', '111', '100', '110', '101', '010'])
    parser.add_argument("-d", "--display",dest='display_opt', help="display data transfered, False by default", type=bool, default=False)
    parser.add_argument("-td", "--time-delay",dest='time_delay', help="delay for each data sent, 0.05 by default", type=float, default=0.5)
    data=parser.parse_args()
    motion=data.motion_opt
    display_data=data.display_opt
    time_delay=data.time_delay
    esp_mac_index=data.esp_mac_index

# Main program
if __name__ == "__main__":
    #Open serial port
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
    
    parse_input()
    # send_thread=threading.Thread(target=begin_send)
    # send_thread.start()
    
    # display_thread=threading.Thread(target=weird_display)
    # if not display_data:
    #     display_thread.start()
    
    # while not stop:
    #     if not send_thread.is_alive():
    #         stop=True
    #         if not display_data:
    #             display_thread.join()
    #         print(f"[+] Send Complete, Destination: esp mac index {esp_mac_index}")
    #         print(f"[-] Failed to send: {failed_send}")
    #     serial_recv()
    
    """Test"""
    path="../data/MX/motion_bucket/1.json"
    file_path=(re.search(r'/data(.*\.json)', path)).group(1)
    
    data_send= bytes([0xFD, esp_mac_index,virose.Command.RESPONSE_MOTION_LIST.value, virose.State.SEND_INFO.value])
    chunk=math.ceil(os.path.getsize(path)/max_chunk_size).to_bytes(4, byteorder='little')
    with open(path, "rb") as fcheck:
        file_data=fcheck.read()
        checksum=(binascii.crc32(file_data) & 0xffffffff).to_bytes(4, byteorder='little') #get checksum
        fcheck.close()
    file_info=(len(file_path)).to_bytes(4, byteorder='little')+(file_path).encode('utf-8')
    data_send+=chunk+checksum+file_info+bytes([0xFE,0x0A])
    if display_data:
        print(f"[+] File: {file_path} - Checksum: {checksum}")
    if(serial_send(data_send, esp_mac_index)):
        if display_data:
            print(f"[+] Serial send success: File sent - INFO")
    else:
        failed_send=failed_send+1
        if display_data:
            print(f"[-] Error Send Failed")

    chunk_len=math.ceil(os.path.getsize(path)/max_chunk_size)
    if display_data:
        print(f"[+] total chunk: {chunk_len}")
    
    with open(path, 'rb') as finput:
        for i in range(1,chunk_len+1):
            data_send= bytes([0xFD, 255 if esp_mac_index == -1 else esp_mac_index,virose.Command.RESPONSE_MOTION_LIST.value, virose.State.SEND_DATA.value])
            file_data=finput.read(max_chunk_size)
            data_send+=(i).to_bytes(4, byteorder='little')+file_data  
            # send
            if(serial_send(data_send, esp_mac_index)):
                if display_data:
                    print(f"[+] Serial send success: File sent - {file_path} - chunk {i}")
            else:
                failed_send=failed_send+1
                if display_data:
                    print(f"[-] Error Send Failed")
    
#     # -- durung error handler --------------------------------
#     # -- durung handler esp bawah --------------------------------
