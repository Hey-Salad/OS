"use client"

import { Suspense, useRef, useEffect } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import { Globe, latLngToCartesian } from "./globe"
import type { Office } from "@/lib/offices"
import { Spinner } from "@/components/ui/spinner"
import * as THREE from "three"

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">Loading 3D World...</p>
      </div>
    </Html>
  )
}

// Camera controller for zoom-to-location
function CameraController({ targetOffice }: { targetOffice: Office | null }) {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3(0, 0, 6))
  const defaultPosition = new THREE.Vector3(0, 0, 6)

  useEffect(() => {
    if (targetOffice) {
      // Calculate position to look at the office from a closer distance
      const pos = latLngToCartesian(targetOffice.lat, targetOffice.lng, 4.5)
      targetPosition.current.set(pos[0], pos[1], pos[2])
    } else {
      targetPosition.current.copy(defaultPosition)
    }
  }, [targetOffice])

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, 0.02)
    camera.lookAt(0, 0, 0)
  })

  return null
}

interface SceneProps {
  offices: Office[]
  onHoverOffice: (office: Office | null) => void
  onEnterOffice: (office: Office) => void
  hoveredOffice: Office | null
}

export function Scene({ offices, onHoverOffice, onEnterOffice, hoveredOffice }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      className="bg-background"
    >
      <color attach="background" args={["#000000"]} />

      {/* Lighting - bright and dramatic */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={2.5} color="#ffffff" castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#6eb4ff" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.5} color="#ffa0a0" />
      
      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <Suspense fallback={<LoadingFallback />}>
        <Globe offices={offices} onHoverOffice={onHoverOffice} onEnterOffice={onEnterOffice} hoveredOffice={hoveredOffice} />
      </Suspense>

      <CameraController targetOffice={null} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={12}
        autoRotate={true}
        autoRotateSpeed={0.3}
      />
    </Canvas>
  )
}
