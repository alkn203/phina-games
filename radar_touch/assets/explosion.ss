{
  "frame": {
    "width": 128,
    "height": 128,
    "cols": 10,
    "rows": 1
  },
  "animations" : {
    "keep": {
      "frames": [1,2,3,4,5,6],
      "next": "repeat",
      "frequency": 1
    },
    "repeat": {
      "frames": [4,5,6],
      "next": "repeat",
      "frequency": 6
    },
    "once": {
      "frames": [0,1,2,3,4,5,6,7,8,9],
      "frequency": 1
    },
  }
} 