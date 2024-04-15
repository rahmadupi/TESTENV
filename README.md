<div align=center>   
  
# Details
</div>

<ul>
<li>
<details><summary>Converter</summary>
<ul>
<li>
<details><summary>V2</summary>
  
## R+MotionDataConverter
### Mengambil data bucket, movie dan unit dari file .mtnx dari R+Motion ke file .json

Script - converter_v2.py

## Panduan Script Python

https://github.com/virose-its/sub-program/blob/8fd267e98681fa2625c2fa4da022e3e18f0bebb1/scripts/program/converterv2.py#L14-L15

- Masukan lokasi dari file .mtnx pada variable yang sesuai
  > _note: Pastikan terdapat penanda tipe servo "MX" atau "XL" dalam nama file .mtnx_

https://github.com/virose-its/sub-program/blob/8fd267e98681fa2625c2fa4da022e3e18f0bebb1/scripts/program/converterv2.py#L21-L23
Spesifikasikan dimana file json akan ditaruh, secara default file json akan disimpan kedalam folder data dan difolder dengan nama tipe servo yang sesuai

> Output berupa 3 folder yang berisi setiap data disimpan dalam file json secara terpisah

##### Struktur file output

```
MX -
 - motion_bucket -
     - {idx}.json
     - 1.json
     - 2.json
      .....
 - motion_movie -
     - {idx}.json
     - 1.json
     - 2.json
      .....
 - motion_unit -
     - {idx}.json
     - 1.json
     - 2.json
      .....
 - motion_info.json

XL -
 - motion_bucket -
     - {idx}.json
     - 1.json
     - 2.json
      .....
 - motion_movie -
     - {idx}.json
     - 1.json
     - 2.json
      .....
 - motion_unit -
     - {idx}.json
     - 1.json
     - 2.json
      .....
 - motion_info.json
```

## Struktur Data Dalam File Json

<details>
  <summary>Bucket</summary>
  motion_bucket.json<br>
  
  ```
  {
  "BUCKET": [
     {
      "id": idx,
      "name": name,
      "total_movie": count of motion_movie inside motion bucket,
      "motion_movie": [
        array of struct of motion movie
      ]
     },
     {
      "id": 0,
      "name": "TEST 1",
      "total_movie": 2,
      "motion_movie": [
        {
           "id": 1,
           "nama": "motion 1"
           "duration": 2000
        },
        {
           "id": 4,
           "nama": "jalan"
           "duration": 4230
        },
  
      ]
    },
    ......
    ]
  }
  ```

</details>
<details>
  <summary>Movie</summary>
    motion_movie.json<br>
  
  ```
  {
      "id": idx,
      "name": name,
      "total_unit": count of moton_unit inside the movie,
      "motion_unit": [
        array of data struct of motion unit
        {id, speed, loop}
      ]
     },
     {
      "id": 5,
      "name": "GERAK PEMBUKA V2",
      "total_unit": 4,
      "motion_unit": [
        { "id": 3, "speed": 1.0, "loop": 1 },
        { "id": 9, "speed": 1.0, "loop": 1 },
        { "id": 13, "speed": 1.5, "loop": 1 },
        { "id": 4, "speed": 1.0, "loop": 1 }
      ]
    },
    ......
    ]
  }
  ```

</details>
<details>
  <summary>Unit</summary>
  {idx}.json
  
  ```
  {
    "id": idx,
    "name": name,
    "total_frame": count of frame inside unit,
    "time": time of each frame,
    "motion_frame": [
      [
        data position for each servo
      ]
    ]
  }
  ```

24.json

```
{
  "id": 24,
  "name": "1/2 SETELAH SALAM",
  "total_frame": 2,
  "time": [104, 358],
  "motion_frame": [
    [
      2048, 2048, 2048, 2048, 2048, 2048, 2242, 1854, 1604, 2492, 1807, 2302,
      2021, 2049
    ],
    [
      2048, 2048, 2048, 2048, 2048, 2048, 2242, 1854, 1604, 2492, 1807, 2302,
      2021, 2049
    ]
  ]
}
```

</details>
</details>
</li>

<ul>
</details>
</li>

<ul>
