/**
 * SignBridge ISL & Gesture Geometry Classifier
 * Fast, robust client-side landmark analysis for Indian Sign Language alphabets,
 * numerals, and everyday conversational signs.
 */

export interface LandmarkPoint {
  x: number
  y: number
  z: number
}

export interface DetectedHandInfo {
  label: string // 'Left' | 'Right'
  score: number
  landmarks: LandmarkPoint[]
}

export interface GeometricSignPrediction {
  label: string
  confidence: number
  category: 'alphabet' | 'number' | 'phrase' | 'gesture'
  description?: string
  hindi?: string
}

function dist(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0))
}

function dist2D(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}


export function analyzeHand(landmarks: LandmarkPoint[]) {
  if (!landmarks || landmarks.length < 21) return null

  const wrist = landmarks[0]
  const palmCenter = {
    x: (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3,
    y: (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3,
    z: ((landmarks[0].z || 0) + (landmarks[5].z || 0) + (landmarks[17].z || 0)) / 3,
  }

  // Hand scale (wrist to middle MCP)
  const handScale = Math.max(dist(wrist, landmarks[9]), 0.05)

  // Finger tips: 4, 8, 12, 16, 20
  // Finger PIPs: 3, 6, 10, 14, 18
  // Finger MCPs: 2, 5, 9,  13, 17

  // Index
  const indexExtended = landmarks[8].y < landmarks[6].y && dist(landmarks[8], wrist) > dist(landmarks[6], wrist) * 1.15
  const indexCurled = landmarks[8].y > landmarks[6].y || dist(landmarks[8], palmCenter) < dist(landmarks[6], palmCenter) * 0.9

  // Middle
  const middleExtended = landmarks[12].y < landmarks[10].y && dist(landmarks[12], wrist) > dist(landmarks[10], wrist) * 1.15
  const middleCurled = landmarks[12].y > landmarks[10].y || dist(landmarks[12], palmCenter) < dist(landmarks[10], palmCenter) * 0.9

  // Ring
  const ringExtended = landmarks[16].y < landmarks[14].y && dist(landmarks[16], wrist) > dist(landmarks[14], wrist) * 1.15
  const ringCurled = landmarks[16].y > landmarks[14].y || dist(landmarks[16], palmCenter) < dist(landmarks[14], palmCenter) * 0.9

  // Pinky
  const pinkyExtended = landmarks[20].y < landmarks[18].y && dist(landmarks[20], wrist) > dist(landmarks[18], wrist) * 1.15
  const pinkyCurled = landmarks[20].y > landmarks[18].y || dist(landmarks[20], palmCenter) < dist(landmarks[18], palmCenter) * 0.9

  // Thumb
  const thumbTipToWrist = dist(landmarks[4], wrist)
  const thumbMcpToWrist = dist(landmarks[2], wrist)
  const thumbIndexDist = dist(landmarks[4], landmarks[8])
  const thumbMiddleDist = dist(landmarks[4], landmarks[12])
  const thumbExtended = thumbTipToWrist > thumbMcpToWrist * 1.25 && dist(landmarks[4], palmCenter) > handScale * 0.7
  const thumbCurled = dist(landmarks[4], palmCenter) < handScale * 0.55 || thumbIndexDist < handScale * 0.35

  const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length
  const allFourExtended = indexExtended && middleExtended && ringExtended && pinkyExtended
  const allFourCurled = indexCurled && middleCurled && ringCurled && pinkyCurled

  return {
    wrist,
    palmCenter,
    handScale,
    thumb: { extended: thumbExtended, curled: thumbCurled, tip: landmarks[4] },
    index: { extended: indexExtended, curled: indexCurled, tip: landmarks[8] },
    middle: { extended: middleExtended, curled: middleCurled, tip: landmarks[12] },
    ring: { extended: ringExtended, curled: ringCurled, tip: landmarks[16] },
    pinky: { extended: pinkyExtended, curled: pinkyCurled, tip: landmarks[20] },
    extendedCount,
    allFourExtended,
    allFourCurled,
    thumbTipToWrist,
    thumbIndexDist,
    thumbMiddleDist,
  }
}

export function classifyHandGesture(hands: DetectedHandInfo[]): GeometricSignPrediction | null {
  if (!hands || hands.length === 0) return null

  // 1. Two-Handed Gestures (Namaste, Help, Applause)
  if (hands.length >= 2) {
    const h1 = hands[0].landmarks
    const h2 = hands[1].landmarks
    if (h1?.length >= 21 && h2?.length >= 21) {
      const a1 = analyzeHand(h1)
      const a2 = analyzeHand(h2)

      if (a1 && a2) {
        // Namaste / Greetings: Palms facing and wrists / palms close together
        const wristDistance = dist2D(a1.wrist, a2.wrist)
        const palmDistance = dist2D(a1.palmCenter, a2.palmCenter)
        const fingertipsDist = dist2D(a1.middle.tip, a2.middle.tip)

        if (wristDistance < 0.22 && palmDistance < 0.18 && fingertipsDist < 0.18) {
          return {
            label: 'Namaste',
            confidence: 0.94,
            category: 'phrase',
            description: 'Traditional Indian Sign Language greeting with joined palms',
            hindi: 'नमस्ते (Namaste)',
          }
        }

        // Help: One flat palm facing up, second hand in fist resting on top
        const h1Flat = a1.allFourExtended
        const h2Fist = a2.allFourCurled && a2.thumb.extended
        const h2Flat = a2.allFourExtended
        const h1Fist = a1.allFourCurled && a1.thumb.extended

        if ((h1Flat && h2Fist && dist(a1.palmCenter, a2.wrist) < 0.2) ||
            (h2Flat && h1Fist && dist(a2.palmCenter, a1.wrist) < 0.2)) {
          return {
            label: 'Help',
            confidence: 0.92,
            category: 'phrase',
            description: 'ISL sign for emergency or asking for assistance',
            hindi: 'मदद (Help)',
          }
        }
      }
    }
  }

  // 2. Single Hand Analysis
  const primaryHand = hands[0]
  const l = primaryHand.landmarks
  const a = analyzeHand(l)
  if (!a) return null

  // Thumbs Up / "Good" / "Yes"
  // Thumb pointing up, 4 fingers curled tightly, thumb tip is well above wrist
  if (a.allFourCurled && a.thumb.extended && a.thumb.tip.y < a.wrist.y - 0.12) {
    const isPointingUp = a.thumb.tip.y < l[3].y && l[3].y < l[2].y
    if (isPointingUp) {
      return {
        label: 'Good / Thumbs Up',
        confidence: 0.93,
        category: 'gesture',
        description: 'Sign for Good, Yes, or Agreement',
        hindi: 'अच्छा / हाँ (Good / Yes)',
      }
    }
  }

  // Thumbs Down / "Bad" / "No"
  if (a.allFourCurled && a.thumb.extended && a.thumb.tip.y > a.wrist.y + 0.1) {
    return {
      label: 'Bad / Disagree',
      confidence: 0.91,
      category: 'gesture',
      description: 'Sign for Bad, Disagree, or Dislike',
      hindi: 'बुरा / नहीं (Bad / Dislike)',
    }
  }

  // "I Love You" Sign (ILY): Thumb, Index, and Pinky extended; Middle and Ring curled
  if (a.thumb.extended && a.index.extended && a.pinky.extended && a.middle.curled && a.ring.curled) {
    return {
      label: 'I Love You',
      confidence: 0.95,
      category: 'phrase',
      description: 'Universal sign language emblem for I Love You',
      hindi: 'आई लव यू (I Love You)',
    }
  }

  // "Peace" / "Victory" / Number 2
  // Index and Middle extended apart, Ring and Pinky curled
  if (a.index.extended && a.middle.extended && a.ring.curled && a.pinky.curled) {
    const vSpread = dist2D(a.index.tip, a.middle.tip)
    if (vSpread > a.handScale * 0.35) {
      return {
        label: 'Peace / Victory',
        confidence: 0.92,
        category: 'gesture',
        description: 'V sign for peace or number 2 in ISL',
        hindi: 'शांति / विजय (Peace / Two)',
      }
    }
  }

  // Open Palm / "Hello" / "Stop" / Number 5
  // All 5 fingers extended and spread
  if (a.allFourExtended && a.thumb.extended) {
    return {
      label: 'Hello / Open Palm',
      confidence: 0.90,
      category: 'gesture',
      description: 'Open greeting wave or stop gesture',
      hindi: 'नमस्ते / सुनिए (Hello / Stop)',
    }
  }

  // Flat Hand / "Thank You" / "Please"
  // Four fingers extended together (not widely spread)
  if (a.allFourExtended && !a.thumb.extended) {
    return {
      label: 'Thank You / Please',
      confidence: 0.88,
      category: 'phrase',
      description: 'Polite ISL hand gesture for Thank you or Please',
      hindi: 'धन्यवाद (Thank You)',
    }
  }

  // Alphabet 'L' / Number 1 shape
  // Only Thumb and Index extended at approximately 90 degrees
  if (a.thumb.extended && a.index.extended && a.middle.curled && a.ring.curled && a.pinky.curled) {
    const angleDist = a.thumbIndexDist
    if (angleDist > a.handScale * 0.6) {
      return {
        label: 'Letter L',
        confidence: 0.92,
        category: 'alphabet',
        description: 'Letter L in sign alphabet fingerspelling',
        hindi: 'अक्षर L (Letter L)',
      }
    }
  }

  // Alphabet 'Y'
  // Thumb and Pinky extended, middle 3 curled
  if (a.thumb.extended && a.pinky.extended && a.index.curled && a.middle.curled && a.ring.curled) {
    return {
      label: 'Letter Y',
      confidence: 0.93,
      category: 'alphabet',
      description: 'Letter Y / Hang Loose sign in ISL',
      hindi: 'अक्षर Y (Letter Y)',
    }
  }

  // Alphabet 'W' / Number 3
  // Index, Middle, Ring extended, Pinky curled, Thumb holding pinky
  if (a.index.extended && a.middle.extended && a.ring.extended && a.pinky.curled) {
    return {
      label: 'Letter W / Three',
      confidence: 0.89,
      category: 'alphabet',
      description: 'Letter W or Number 3 in fingerspelling',
      hindi: 'अक्षर W / संख्या ३ (Letter W / 3)',
    }
  }

  // Alphabet 'I'
  // Only pinky extended, other 4 curled
  if (a.pinky.extended && a.index.curled && a.middle.curled && a.ring.curled && a.thumb.curled) {
    return {
      label: 'Letter I',
      confidence: 0.91,
      category: 'alphabet',
      description: 'Letter I in ISL fingerspelling',
      hindi: 'अक्षर I (Letter I)',
    }
  }

  // Number 1 / Pointing
  // Only Index finger extended, others curled
  if (a.index.extended && a.middle.curled && a.ring.curled && a.pinky.curled && a.thumb.curled) {
    return {
      label: 'Number 1 / Point',
      confidence: 0.91,
      category: 'number',
      description: 'Number 1 or pointing gesture',
      hindi: 'संख्या १ (Number 1)',
    }
  }

  // Number 4 / Alphabet 'B'
  // Four fingers extended, thumb curled across palm
  if (a.allFourExtended && a.thumb.curled) {
    return {
      label: 'Letter B / Four',
      confidence: 0.89,
      category: 'alphabet',
      description: 'Letter B or Number 4 with thumb across palm',
      hindi: 'अक्षर B / संख्या ४ (Letter B / 4)',
    }
  }

  // Fist / Alphabet 'A' / "Stop"
  // All fingers curled into a fist, thumb resting alongside
  if (a.allFourCurled && a.thumb.curled) {
    return {
      label: 'Fist / Letter A',
      confidence: 0.88,
      category: 'alphabet',
      description: 'Closed fist or Letter A',
      hindi: 'मुट्ठी / अक्षर A (Fist / Letter A)',
    }
  }

  // "OK" / Alphabet 'F' sign
  // Thumb and index touching in circle, middle, ring, pinky extended
  if (a.middle.extended && a.ring.extended && a.pinky.extended && a.thumbIndexDist < a.handScale * 0.3) {
    return {
      label: 'OK / Letter F',
      confidence: 0.90,
      category: 'gesture',
      description: 'Thumb and index touching in a loop (OK sign)',
      hindi: 'ठीक है (OK / Letter F)',
    }
  }

  return null
}
