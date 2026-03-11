"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { fallbackOffices, type Office } from "@/lib/offices"

interface GlobeProps {
  offices?: Office[]
  onHoverOffice: (office: Office | null) => void
  onEnterOffice: (office: Office) => void
  hoveredOffice: Office | null
}

function LocationMarker({ office, onHover, onEnter, isHovered }: { office: Office; onHover: (office: Office | null) => void; onEnter: (office: Office) => void; isHovered: boolean }) {
  const pulseRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)
  const position = latLngToCartesian(office.lat, office.lng, 2.02)

  useFrame((_, delta) => {
    timeRef.current += delta
    if (pulseRef.current) {
      const scale = 1 + Math.sin(timeRef.current * 3) * 0.3
      pulseRef.current.scale.setScalar(scale)
    }
    if (ringRef.current && isHovered) {
      ringRef.current.scale.setScalar(1 + Math.sin(timeRef.current * 4) * 0.2)
    }
  })

  return (
    <group
      position={position as [number, number, number]}
      onPointerEnter={(e) => { e.stopPropagation(); onHover(office) }}
      onPointerLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onEnter(office) }}
    >
      {/* Pulsing outer glow */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={isHovered ? "#ffffff" : office.color} transparent opacity={0.3} />
      </mesh>

      {/* Core marker */}
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isHovered ? "#ffffff" : office.color}
          emissive={office.color}
          emissiveIntensity={isHovered ? 1.5 : 0.6}
        />
      </mesh>

      {/* Hover ring - only when hovered */}
      {isHovered && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.14, 0.18, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function latLngToCartesian(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return [x, y, z]
}

function buildProceduralEarthTexture(): THREE.CanvasTexture {
  const W = 2048
  const H = 1024
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // --- Ocean base - brighter blue ---
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H)
  oceanGrad.addColorStop(0, "#1a4a9e")
  oceanGrad.addColorStop(0.5, "#2a6aba")
  oceanGrad.addColorStop(1, "#1a4a9e")
  ctx.fillStyle = oceanGrad
  ctx.fillRect(0, 0, W, H)

  // Add ocean texture variation
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = Math.random() * 30 + 5
    const alpha = Math.random() * 0.06
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(100,160,255,${alpha})`
    ctx.fill()
  }

  const land = "#4a8b2a"
  const landLight = "#5aaa32"
  const landDark = "#3a6518"
  const desert = "#d8b85b"
  const snow = "#f0f5fa"
  const mountain = "#8a7a60"

  function drawLand(
    shapes: Array<{ x: number; y: number; rx: number; ry: number; rot?: number; color?: string }>,
  ) {
    for (const s of shapes) {
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.rot ?? 0)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(s.rx, s.ry))
      g.addColorStop(0, s.color ?? landLight)
      g.addColorStop(0.6, s.color ?? land)
      g.addColorStop(1, landDark)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  // North America
  drawLand([
    { x: 290, y: 200, rx: 130, ry: 100 },
    { x: 260, y: 280, rx: 90, ry: 70 },
    { x: 220, y: 340, rx: 60, ry: 50 },
    { x: 310, y: 160, rx: 60, ry: 40, color: snow },   // Canada north
    { x: 350, y: 220, rx: 50, ry: 35, color: mountain }, // Rockies
  ])

  // Central America / Mexico
  drawLand([{ x: 280, y: 370, rx: 45, ry: 30, rot: 0.3 }])

  // South America
  drawLand([
    { x: 360, y: 460, rx: 70, ry: 50 },
    { x: 340, y: 540, rx: 50, ry: 70, rot: 0.2 },
    { x: 330, y: 620, rx: 35, ry: 50 },
    { x: 310, y: 680, rx: 25, ry: 30, color: snow }, // Patagonia
    { x: 380, y: 490, rx: 30, ry: 60, color: desert }, // Brazilian highland
  ])

  // Europe
  drawLand([
    { x: 980, y: 180, rx: 80, ry: 60 },
    { x: 1020, y: 220, rx: 50, ry: 40 },
    { x: 960, y: 140, rx: 40, ry: 30, color: snow },  // Scandinavia
    { x: 1050, y: 200, rx: 35, ry: 25, color: mountain }, // Alps
  ])

  // Africa
  drawLand([
    { x: 1010, y: 340, rx: 90, ry: 70 },
    { x: 1000, y: 430, rx: 80, ry: 80 },
    { x: 1010, y: 520, rx: 70, ry: 70 },
    { x: 1000, y: 600, rx: 50, ry: 50 },
    { x: 1005, y: 670, rx: 30, ry: 30 },
    { x: 990, y: 340, rx: 100, ry: 60, color: desert }, // Sahara
    { x: 1010, y: 390, rx: 50, ry: 35, color: desert },
  ])

  // Middle East / Arabian Peninsula
  drawLand([
    { x: 1110, y: 310, rx: 70, ry: 50, color: desert },
    { x: 1130, y: 360, rx: 50, ry: 40, color: desert },
  ])

  // Asia (main body)
  drawLand([
    { x: 1300, y: 180, rx: 200, ry: 110 },
    { x: 1280, y: 260, rx: 160, ry: 80 },
    { x: 1250, y: 320, rx: 100, ry: 60 },
    { x: 1350, y: 140, rx: 120, ry: 60, color: snow },  // Siberia
    { x: 1200, y: 200, rx: 80, ry: 50, color: mountain }, // Himalayas
    { x: 1400, y: 200, rx: 60, ry: 40, color: mountain },
    { x: 1300, y: 260, rx: 80, ry: 40, color: desert }, // Central Asia
  ])

  // South Asia (India)
  drawLand([{ x: 1230, y: 380, rx: 55, ry: 70 }])

  // Southeast Asia
  drawLand([
    { x: 1380, y: 350, rx: 60, ry: 50 },
    { x: 1420, y: 370, rx: 35, ry: 30 },
  ])

  // Japan / Korean Peninsula
  drawLand([
    { x: 1490, y: 250, rx: 25, ry: 50, rot: 0.3 },
    { x: 1475, y: 280, rx: 15, ry: 20 },
  ])

  // Australia
  drawLand([
    { x: 1600, y: 560, rx: 100, ry: 65 },
    { x: 1580, y: 530, rx: 60, ry: 40, color: desert },
    { x: 1620, y: 580, rx: 50, ry: 35, color: desert },
    { x: 1650, y: 600, rx: 20, ry: 15, color: landLight }, // Eastern coast
  ])

  // New Zealand
  drawLand([{ x: 1720, y: 620, rx: 15, ry: 35, rot: 0.4 }])

  // Greenland
  drawLand([{ x: 480, y: 110, rx: 55, ry: 45, color: snow }])

  // Iceland
  drawLand([{ x: 870, y: 130, rx: 25, ry: 18, color: snow }])

  // Antarctica hint at bottom
  ctx.fillStyle = snow
  ctx.fillRect(0, H - 60, W, 60)
  ctx.fillStyle = "#d0dce8"
  ctx.fillRect(0, H - 40, W, 40)

  // Polar ice cap top
  ctx.fillStyle = snow
  ctx.fillRect(0, 0, W, 35)

  // Ocean shimmer highlights
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    ctx.beginPath()
    ctx.arc(x, y, Math.random() * 6 + 1, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200,230,255,${Math.random() * 0.12})`
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  return tex
}

// Earth sphere with texture
function EarthSphere({ globeRef }: { globeRef: React.RefObject<THREE.Mesh | null> }) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  if (!textureRef.current) {
    textureRef.current = buildProceduralEarthTexture()
  }

  useEffect(() => {
    // Try loading a real Earth texture, but have procedural ready as fallback
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = "anonymous"

    loader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace
        if (globeRef.current && globeRef.current.material instanceof THREE.MeshStandardMaterial) {
          globeRef.current.material.map = loadedTexture
          globeRef.current.material.needsUpdate = true
        }
      },
      undefined,
      () => {
        // Error or timeout - procedural texture already set
      }
    )
  }, [])

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[2, 128, 128]} />
      <meshStandardMaterial
        map={textureRef.current}
        roughness={0.5}
        metalness={0.05}
        color="#ffffff"
        emissive="#111111"
        emissiveIntensity={0.15}
      />
    </mesh>
  )
}

export function Globe({ offices = fallbackOffices, onHoverOffice, onEnterOffice, hoveredOffice }: GlobeProps) {
  const globeRef = useRef<THREE.Mesh>(null)
  const markersRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (globeRef.current && !hoveredOffice) {
      globeRef.current.rotation.y += 0.001
    }
    if (markersRef.current && globeRef.current) {
      markersRef.current.rotation.y = globeRef.current.rotation.y
    }
  })

  return (
    <group>
      {/* Earth sphere with real texture */}
      <EarthSphere globeRef={globeRef} />

      {/* Inner atmosphere - blue glow */}
      <mesh>
        <sphereGeometry args={[2.04, 64, 64]} />
        <meshBasicMaterial
          color="#4a8eff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Mid atmosphere - cyan tint */}
      <mesh>
        <sphereGeometry args={[2.1, 64, 64]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere - soft white */}
      <mesh>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Location markers */}
      <group ref={markersRef}>
        {offices.map((office) => (
          <LocationMarker
            key={office.name}
            office={office}
            onHover={onHoverOffice}
            onEnter={onEnterOffice}
            isHovered={hoveredOffice?.name === office.name}
          />
        ))}
      </group>
    </group>
  )
}

export { latLngToCartesian }
export type { Office }

