export interface AvatarPose {
  headTilt: number
  headNod: number
  leftArm: {
    shoulderAngle: number
    elbowAngle: number
    wristAngle: number
    fingers: [number, number, number, number, number] // 0 (closed) to 1 (extended)
  }
  rightArm: {
    shoulderAngle: number
    elbowAngle: number
    wristAngle: number
    fingers: [number, number, number, number, number]
  }
  expression: 'neutral' | 'smile' | 'focused' | 'talking'
}

export const DEFAULT_REST_POSE: AvatarPose = {
  headTilt: 0,
  headNod: 0,
  leftArm: {
    shoulderAngle: 1.1,
    elbowAngle: 0.3,
    wristAngle: 0,
    fingers: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  rightArm: {
    shoulderAngle: 1.1,
    elbowAngle: 0.3,
    wristAngle: 0,
    fingers: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  expression: 'neutral',
}

// Letter finger configurations: [thumb, index, middle, ring, pinky]
export const LETTER_FINGERS: Record<string, [number, number, number, number, number]> = {
  A: [0.2, 0, 0, 0, 0],
  B: [0, 1, 1, 1, 1],
  C: [0.5, 0.5, 0.5, 0.5, 0.5],
  D: [0, 1, 0, 0, 0],
  E: [0, 0.1, 0.1, 0.1, 0.1],
  F: [0, 0, 1, 1, 1],
  G: [1, 1, 0, 0, 0],
  H: [0.2, 1, 1, 0, 0],
  I: [0, 0, 0, 0, 1],
  J: [0, 0, 0, 0, 1],
  K: [0.8, 1, 0.8, 0, 0],
  L: [1, 1, 0, 0, 0],
  M: [0.3, 0.2, 0.2, 0.2, 0],
  N: [0.3, 0.2, 0.2, 0, 0],
  O: [0.3, 0.3, 0.3, 0.3, 0.3],
  P: [0.8, 1, 0.8, 0, 0],
  Q: [1, 1, 0, 0, 0],
  R: [0, 1, 1, 0, 0],
  S: [0.2, 0, 0, 0, 0],
  T: [0.5, 0, 0, 0, 0],
  U: [0, 1, 1, 0, 0],
  V: [0, 1, 1, 0, 0],
  W: [0, 1, 1, 1, 0],
  X: [0, 0.4, 0, 0, 0],
  Y: [1, 0, 0, 0, 1],
  Z: [0, 1, 0, 0, 0],
}

// Named phrases and their keyframe poses
export const PRESET_SIGNS: Record<
  string,
  { label: string; hindi: string; description: string; poses: AvatarPose[] }
> = {
  hello: {
    label: 'Hello / Welcome',
    hindi: 'नमस्ते / स्वागत है',
    description: 'Friendly open hand wave at head level with a warm welcoming smile',
    poses: [
      {
        headTilt: 0.05,
        headNod: 0.05,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.6, elbowAngle: -1.7, wristAngle: -0.3, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: -0.05,
        headNod: 0.02,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.5, elbowAngle: -1.5, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: 0.05,
        headNod: 0.05,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.6, elbowAngle: -1.7, wristAngle: -0.2, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
    ],
  },
  thankyou: {
    label: 'Thank You',
    hindi: 'धन्यवाद',
    description: 'Flat hand touching chin, then gracefully moving forward towards the viewer',
    poses: [
      {
        headTilt: 0,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.0, elbowAngle: 0.4, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.2, elbowAngle: -2.1, wristAngle: -0.1, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: 0,
        headNod: 0.2,
        leftArm: { shoulderAngle: 1.0, elbowAngle: 0.4, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: 0.4, elbowAngle: -1.1, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
    ],
  },
  namaste: {
    label: 'Namaste',
    hindi: 'नमस्ते',
    description: 'Traditional two-handed joined palms gesture in front of chest',
    poses: [
      {
        headTilt: 0,
        headNod: 0.25,
        leftArm: { shoulderAngle: 0.2, elbowAngle: -1.5, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.2, elbowAngle: -1.5, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: 0,
        headNod: 0.35,
        leftArm: { shoulderAngle: 0.2, elbowAngle: -1.6, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.2, elbowAngle: -1.6, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
    ],
  },
  love: {
    label: 'I Love You',
    hindi: 'आई लव यू',
    description: 'Hand raised displaying universal I Love You sign (thumb, index, pinky extended)',
    poses: [
      {
        headTilt: 0.1,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.4, elbowAngle: -1.8, wristAngle: 0, fingers: [1, 1, 0, 0, 1] },
        expression: 'smile',
      },
    ],
  },
  good: {
    label: 'Good / Yes',
    hindi: 'बहुत अच्छा / हाँ',
    description: 'Assertive thumbs-up gesture with supportive head nod',
    poses: [
      {
        headTilt: 0,
        headNod: 0.2,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: 0.1, elbowAngle: -1.4, wristAngle: -0.2, fingers: [1, 0, 0, 0, 0] },
        expression: 'smile',
      },
      {
        headTilt: 0,
        headNod: 0.3,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: 0.1, elbowAngle: -1.5, wristAngle: -0.2, fingers: [1, 0, 0, 0, 0] },
        expression: 'smile',
      },
    ],
  },
  help: {
    label: 'Help / Emergency',
    hindi: 'मदद चाहिए',
    description: 'Left palm flat facing up, right hand fist placed firmly on top',
    poses: [
      {
        headTilt: 0,
        headNod: 0.15,
        leftArm: { shoulderAngle: 0.3, elbowAngle: -1.3, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.2, elbowAngle: -1.5, wristAngle: -0.2, fingers: [0, 0, 0, 0, 0] },
        expression: 'focused',
      },
      {
        headTilt: 0,
        headNod: 0.25,
        leftArm: { shoulderAngle: 0.3, elbowAngle: -1.4, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.3, elbowAngle: -1.3, wristAngle: -0.2, fingers: [0, 0, 0, 0, 0] },
        expression: 'focused',
      },
    ],
  },
  water: {
    label: 'Water',
    hindi: 'पानी (Water)',
    description: 'Three fingers in W shape touching near mouth/chin',
    poses: [
      {
        headTilt: 0,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.1, elbowAngle: -2.0, wristAngle: 0.2, fingers: [0, 1, 1, 1, 0] },
        expression: 'focused',
      },
      {
        headTilt: 0,
        headNod: 0.15,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.1, elbowAngle: -2.1, wristAngle: 0.2, fingers: [0, 1, 1, 1, 0] },
        expression: 'focused',
      },
    ],
  },
  peace: {
    label: 'Peace / Victory',
    hindi: 'शांति / विजय',
    description: 'V sign held steadily with smiling expression',
    poses: [
      {
        headTilt: 0.08,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.3, elbowAngle: -1.7, wristAngle: 0, fingers: [0, 1, 1, 0, 0] },
        expression: 'smile',
      },
    ],
  },
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPose(p1: AvatarPose, p2: AvatarPose, t: number): AvatarPose {
  return {
    headTilt: lerp(p1.headTilt, p2.headTilt, t),
    headNod: lerp(p1.headNod, p2.headNod, t),
    leftArm: {
      shoulderAngle: lerp(p1.leftArm.shoulderAngle, p2.leftArm.shoulderAngle, t),
      elbowAngle: lerp(p1.leftArm.elbowAngle, p2.leftArm.elbowAngle, t),
      wristAngle: lerp(p1.leftArm.wristAngle, p2.leftArm.wristAngle, t),
      fingers: p1.leftArm.fingers.map((f, i) => lerp(f, p2.leftArm.fingers[i], t)) as [number, number, number, number, number],
    },
    rightArm: {
      shoulderAngle: lerp(p1.rightArm.shoulderAngle, p2.rightArm.shoulderAngle, t),
      elbowAngle: lerp(p1.rightArm.elbowAngle, p2.rightArm.elbowAngle, t),
      wristAngle: lerp(p1.rightArm.wristAngle, p2.rightArm.wristAngle, t),
      fingers: p1.rightArm.fingers.map((f, i) => lerp(f, p2.rightArm.fingers[i], t)) as [number, number, number, number, number],
    },
    expression: t > 0.5 ? p2.expression : p1.expression,
  }
}
