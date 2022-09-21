/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
const RELIC_URI = `${process.env.REACT_APP_ASSETS_URL}/car-transformed.glb`;

type GLTFResult = GLTF & {
  nodes: {
    car: THREE.Mesh
  }
  materials: {
    car: THREE.MeshStandardMaterial
  }
}

export default function Model({ ...props }: JSX.IntrinsicElements['group']) {
  const group = useRef<THREE.Group>(null)
  const { nodes, materials } = useGLTF(RELIC_URI, 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/') as GLTFResult
  return (
    <group ref={group} {...props} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.car.geometry} material={materials.car} rotation={[0, -0.06, 0]} />
    </group>
  )
}

useGLTF.preload(RELIC_URI)