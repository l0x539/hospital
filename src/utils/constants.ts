import { Color, Vector3 } from "three";

export const fogValues = {
  start: {
      uWorldFogColor: new Color(0),
      uFogNear_D: 0,
      uFogFar_D: 37,
      uFogStrength_D: 1,
      uFogNear_H: -15.2,
      uFogFar_H: -75,
      uFogStrength_H: 1,
      uFogStrength: 1,
      uWorldFogColorMix: .7065,
      lights: [{
          near: 0,
          far: 467.4,
          strength: 0,
          color: new Color(6179898),
          position: new Vector3(-190,263,-258)
      }, {
          near: 50,
          far: 869.6,
          strength: 1,
          color: new Color(12189953),
          position: new Vector3(-296,20,-17)
      }, {
          near: 16.9,
          far: 750,
          strength: 0,
          color: new Color(1052696),
          position: new Vector3(146,6.7,-230)
      }]
  },
  outsideBuilding: {
      uWorldFogColor: new Color(5111808),
      uFogNear_D: 23.91,
      uFogFar_D: 250,
      uFogStrength_D: 1,
      uFogNear_H: -47.8,
      uFogFar_H: -64.1,
      uFogStrength_H: 1,
      uFogStrength: 1,
      uWorldFogColorMix: .51,
      lights: [{
          near: 0,
          far: 369.6,
          strength: 1,
          color: new Color(16760111),
          position: new Vector3(-190,50,-258)
      }, {
          near: 50,
          far: 260.87,
          strength: 1,
          color: new Color(9043968),
          position: new Vector3(-296,20,-17)
      }, {
          near: 16.85,
          far: 288.04,
          strength: 1.304,
          color: new Color(0),
          position: new Vector3(146,6.7,-230)
      }]
  },
  insideBuilding: {
      uWorldFogColor: new Color(0),
      uFogNear_D: 10.87,
      uFogFar_D: 108.7,
      uFogStrength_D: .8478,
      uFogNear_H: -35.5,
      uFogFar_H: -68.1,
      uFogStrength_H: 1,
      uFogStrength: 1,
      uWorldFogColorMix: 1,
      lights: [{
          near: 0,
          far: 369.6,
          strength: 1,
          color: new Color(16773441),
          position: new Vector3(-190,50,-258)
      }, {
          near: 50,
          far: 260.87,
          strength: 1,
          color: new Color(9518607),
          position: new Vector3(-296,20,-17)
      }, {
          near: 16.85,
          far: 288.04,
          strength: 1.304,
          color: new Color(49528),
          position: new Vector3(146,6.7,-230)
      }]
  }
}