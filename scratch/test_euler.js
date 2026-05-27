const THREE = require('three');

// Default position: rotation around Z by PI
const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI, 'YXZ'));

const toDegrees = (rad) => {
  let deg = (rad * 180) / Math.PI % 360;
  if (deg < -180) deg += 360;
  if (deg > 180) deg -= 360;
  return Math.round(deg);
};

const printCorrectState = (label, q, order) => {
  // Correct body-frame relative rotation: qRel = q0_inv * q
  const q0Inv = q0.clone().invert();
  const qRel = q0Inv.clone().multiply(q);
  const euler = new THREE.Euler().setFromQuaternion(qRel, order);
  
  if (order === 'YXZ') {
    // Pitch = X, Roll = Y, Yaw = Z
    const pitchVal = toDegrees(euler.x);
    const rollVal = toDegrees(euler.y);
    const yawVal = toDegrees(euler.z);
    console.log(`[${order}] ${label}: Pitch = ${pitchVal}°, Roll = ${rollVal}°, Yaw = ${yawVal}°`);
  } else if (order === 'XYZ') {
    // Roll = X, Pitch = Y, Yaw = Z
    const pitchVal = toDegrees(euler.y);
    const rollVal = toDegrees(euler.x);
    const yawVal = toDegrees(euler.z);
    console.log(`[${order}] ${label}: Pitch = ${pitchVal}°, Roll = ${rollVal}°, Yaw = ${yawVal}°`);
  }
};

// 1. Initial State
let q = q0.clone();
printCorrectState("Initial", q, 'YXZ');
printCorrectState("Initial", q, 'XYZ');

// 2. Test vertical drag (Pitch in screen space: rotate around screen X axis)
// In screen space, rotating 30° around world X axis
let qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 30 * Math.PI / 180);
let q1 = qPitch.clone().multiply(q0);
printCorrectState("After Screen Pitch 30°", q1, 'YXZ');
printCorrectState("After Screen Pitch 30°", q1, 'XYZ');

// 3. Test horizontal drag (Yaw in screen space: rotate around screen Y axis)
// In screen space, rotating 45° around world Y axis
let qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 45 * Math.PI / 180);
let q2 = qYaw.clone().multiply(q0);
printCorrectState("After Screen Yaw 45°", q2, 'YXZ');
printCorrectState("After Screen Yaw 45°", q2, 'XYZ');

// 4. Combined: Screen Pitch 30° and Screen Yaw 45°
let qCombined = qYaw.clone().multiply(qPitch).multiply(q0);
printCorrectState("Combined", qCombined, 'YXZ');
printCorrectState("Combined", qCombined, 'XYZ');
