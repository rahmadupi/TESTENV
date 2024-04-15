@echo off

rem Jalankan skrip Python secara paralel
start cmd /c "cd ./app/script && python serial_handler.py"

cd ./app && npm run dev

