from enum import Enum, auto
import struct
class Motion(Enum):
    BUCKET=auto()
    MOVIE=auto()
    UNIT=auto()
    FILE=auto()

class Command(Enum):
     # POST
    POST_MOTION_PLAY = 1
    POST_MOTION_STATE = 2
    POST_INDEX_CURRENT = 3
    POST_INDEX_CHANGED = 4

    POST_CONTROL_PID_ROLL = 11

    # LC
    POST_ACTIVE_MESSAGE = 21
    POST_LC_ATTRIBUTE = 22

    # GET
    GET_SERVO_JOINT = 31
    GET_INDEX = 32
    GET_MOTION_LIST = 33

    GET_CONTROL_PID_ROLL = 41

    # LC
    GET_STATUS_MESSAGE = 51
    GET_LC_RAW_DATA = 52
    GET_LC_ATTRIBUTE = 53

    # RESPONSE
    RESPONSE_SERVO_JOINT = 61
    RESPONSE_INDEX = 62
    RESPONSE_MOTION_LIST = 63
    DATA_INITIALIZATION = 64

    RESPONSE_CONTROL_PID_ROLL = 71

    # LC
    RESPONSE_ACTIVE_MESSAGE = 91
    RESPONSE_STATUS_MESSAGE = 92
    RESPONSE_LC_RAW_DATA = 93
    RESPONSE_LC_ATTRIBUTE = 94

    # ERROR
    RESPONSE_ERROR = 254

class State(Enum):
    PAUSE = auto()
    RESUME = auto()
    XL_DONE = auto()
    MX_DONE = auto()
    INIT = auto()

    XL_SERVO = auto()
    MX_SERVO = auto()

    SEND_INFO = 11
    SEND_DATA = 12
    
    
    INIT_DIR_INFO = 20
    INIT_INFO = 21
    INIT_DATA = 22

    # LC
    COP_ONLY = 51
    COP_AND_MASS = 52
    ROBOT_COP = 53

    OFFSET = auto()
    SCALE = auto()
    BALANCE = auto()

def convert_to_json(cmd, data):
    if cmd == "RESPONSE_STATUS_MESSAGE":
        json_data = {
            "command": cmd,
            "data": {
                "status": bool.from_bytes(data[0:1], byteorder='little'),
                "interval": int.from_bytes(data[1:5], byteorder='little')
            }
        }
        return json_data

    if cmd == "RESPONSE_ACTIVE_MESSAGE":
        json_data = {
            "command": cmd,
            "data": {
                "state": State(int.from_bytes(data[0:1], byteorder='little')).name,
            }
        }
        if json_data["data"]["state"] == "COP_AND_MASS":
            json_data["data"] = {
                "cop_x": struct.unpack('f', data[1:5])[0],
                "cop_y": struct.unpack('f', data[5:9])[0],
                "mass": struct.unpack('f', data[9:13])[0],
                "cells": [struct.unpack('f', data[i:i+4])[0] for i in range(13, len(data), 4)]
            }
            # convert to 2 decimal
            json_data["data"]["cells"] = [float("{:.2f}".format(x)) for x in json_data["data"]["cells"]]
        elif json_data["data"]["state"] == "ROBOT_COP":
            json_data["data"] = {
                "left_foot": {
                    "cop_x": struct.unpack('f', data[1:5])[0],
                    "cop_y": struct.unpack('f', data[5:9])[0],
                    "mass": struct.unpack('f', data[9:13])[0]
                },
                "right_foot": {
                    "cop_x": struct.unpack('f', data[13:17])[0],
                    "cop_y": struct.unpack('f', data[17:21])[0],
                    "mass": struct.unpack('f', data[21:25])[0]
                },
                "robot_foot": {
                    "cop_x": struct.unpack('f', data[25:29])[0],
                    "cop_y": struct.unpack('f', data[29:33])[0],
                    "mass": struct.unpack('f', data[33:37])[0]
                }
            }
            # convert to 2 decimal
            json_data["data"]["left_foot"]["mass"] = float("{:.2f}".format(json_data["data"]["left_foot"]["mass"]))
            json_data["data"]["right_foot"]["mass"] = float("{:.2f}".format(json_data["data"]["right_foot"]["mass"]))
            json_data["data"]["robot_foot"]["mass"] = float("{:.2f}".format(json_data["data"]["robot_foot"]["mass"]))
        return json_data

    if cmd == "RESPONSE_LC_RAW_DATA":
        json_data = {
            "command": cmd,
            "data": {
                "cell_1": struct.unpack('f', data[0:4])[0],
                "cell_2": struct.unpack('f', data[4:8])[0],
                "cell_3": struct.unpack('f', data[8:12])[0],
                "cell_4": struct.unpack('f', data[12:16])[0]
            }
        }
        return json_data

    if cmd == "RESPONSE_LC_ATRRIBUTE":
        json_data = {
            "command": cmd,
            "data": {
                "state": State(int.from_bytes(data[0:1], byteorder='little')).name,
                "cells": [State(int.from_bytes(data[i:i+1], byteorder='little')).name for i in range(1, len(data))]
            }
        }
        return json_data

    if cmd == "RESPONSE_CONTROL_PID_ROLL":
        json_data = {
            "command": cmd,
            "data": {
                "pid": [struct.unpack('f', data[i:i+4])[0] for i in range(0, len(data), 4)]
            }
        }
        json_data["data"]["pid"] = [float("{:.2f}".format(x)) for x in json_data["data"]["pid"]]
        return json_data
    
    # if command is in Command Enum
    if cmd in Command.__members__.keys():
        print("[ERROR] Please define", cmd, "to JSON in virose_com_lib.py")
        json_data = {
            "command": cmd,
            "data": "0x" + data[0:].hex().upper()
        }
        return json_data
    
    raise Exception
    
    
