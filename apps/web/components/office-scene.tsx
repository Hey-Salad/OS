"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Html, RoundedBox, Environment } from "@react-three/drei"
import { Spinner } from "@/components/ui/spinner"
import * as THREE from "three"
import type { Office } from "@/lib/offices"
import type { Employee } from "@/lib/types"

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">Entering office...</p>
      </div>
    </Html>
  )
}

function Desk({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[1.6, 0.05, 0.8]} position={[0, 0.75, 0]} radius={0.02}>
        <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
      </RoundedBox>
      {[[-0.7, 0.3], [0.7, 0.3], [-0.7, -0.3], [0.7, -0.3]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.375, lz]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}
      <group position={[0, 1.1, -0.2]}>
        <RoundedBox args={[0.6, 0.4, 0.03]} radius={0.01}>
          <meshStandardMaterial color="#1a1a1a" />
        </RoundedBox>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.55, 0.35]} />
          <meshBasicMaterial color="#1a4a7a" />
        </mesh>
      </group>
    </group>
  )
}

function Chair({ position, rotation = 0, color = "#ed4c4c" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.5, 0.08, 0.5]} position={[0, 0.45, 0]} radius={0.02}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.5, 0.08]} position={[0, 0.75, -0.22]} radius={0.02}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
    </group>
  )
}

function Plant({ position, tall = false }: { position: [number, number, number]; tall?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.3, 16]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      {tall ? (
        <>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.8, 8]} />
            <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color="#2a7a2a" roughness={0.7} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#3a8a3a" roughness={0.7} />
        </mesh>
      )}
    </group>
  )
}

function MeetingTable({ position, color = "#2a2a2a" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[3, 0.06, 1.2]} position={[0, 0.75, 0]} radius={0.02}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </RoundedBox>
    </group>
  )
}

function TeamAreaLabel({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <Html position={position} center>
      <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white/80 border border-white/20 select-none pointer-events-none whitespace-nowrap font-medium">
        {label}
      </div>
    </Html>
  )
}

function HeySaladLogo({ city, country }: { city: string; country: string }) {
  return (
    <Html position={[0, 3.2, -7.95]} center transform distanceFactor={10}>
      <div className="text-center select-none pointer-events-none" style={{ width: '200px' }}>
        <img src="/heysalad-launchericon-transparent.png" alt="HeySalad" style={{ height: '48px', width: 'auto', margin: '0 auto', objectFit: 'contain' }} />
        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>{city}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{country}</div>
        </div>
      </div>
    </Html>
  )
}

function FruitAgent({ employee, position }: { employee: Employee; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(Math.random() * Math.PI * 2)
  const kind = employee.office === 'San Francisco' ? 'tomato' : employee.office === 'New York' ? 'cherry' : employee.office === 'London' ? 'grape' : employee.office === 'Tallinn' ? 'grape' : 'tomato'
  const color = employee.status === 'active' ? (kind === 'grape' ? '#7c3aed' : '#ef4444') : employee.status === 'remote' ? '#3b82f6' : '#f59e0b'

  useFrame((_, delta) => {
    t.current += delta
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t.current * 2) * 0.03
      ref.current.rotation.y += delta * 0.6
    }
  })

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[kind === 'cherry' ? 0.18 : kind === 'grape' ? 0.15 : 0.22, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
      {kind === 'cherry' && (
        <>
          <mesh position={[0.12, 0.02, 0]} castShadow>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
          <mesh position={[0.06, 0.22, 0]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.01, 0.01, 0.22, 8]} />
            <meshStandardMaterial color="#2f6b2f" />
          </mesh>
        </>
      )}
      {kind !== 'cherry' && (
        <>
          <mesh position={[0, 0.23, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.12, 8]} />
            <meshStandardMaterial color="#2f6b2f" />
          </mesh>
          <mesh position={[0.05, 0.29, 0]} rotation={[0.4, 0, 0.2]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#3fa34d" />
          </mesh>
        </>
      )}
      <Html position={[0, -0.32, 0]} center distanceFactor={10}>
        <div className="rounded-md bg-black/65 px-2 py-1 text-[10px] text-white whitespace-nowrap border border-white/10">
          {employee.firstName}
        </div>
      </Html>
    </group>
  )
}

function OccupantMarkers({ officeName, employees }: { officeName: string; employees: Employee[] }) {
  const officeEmployees = employees.filter((employee) => employee.office === officeName)
  const positions: [number, number, number][] = [
    [-8, 1.05, -2.1], [-6, 1.05, -2.1], [-4, 1.05, -2.1],
    [-8, 1.05, -1.3], [-6, 1.05, -1.3], [-4, 1.05, -1.3],
    [4, 1.05, -2.1], [6, 1.05, -2.1], [8, 1.05, -2.1],
    [4, 1.05, -1.3], [6, 1.05, -1.3], [8, 1.05, -1.3],
    [-1.2, 1.05, 3.7], [0, 1.05, 3.7], [1.2, 1.05, 3.7],
    [-1.2, 1.05, 5.3], [0, 1.05, 5.3], [1.2, 1.05, 5.3],
  ]

  return (
    <group>
      {officeEmployees.slice(0, positions.length).map((employee, index) => (
        <FruitAgent key={employee.id} employee={employee} position={positions[index]} />
      ))}
    </group>
  )
}

const SKY_COLORS: Record<string, { color: string; sunsetGlow: boolean }> = {
  'golden-gate': { color: '#4a7ab0', sunsetGlow: false },
  liberty: { color: '#3a6a9a', sunsetGlow: false },
  'big-ben': { color: '#5a6a7a', sunsetGlow: true },
  'old-town': { color: '#3a5a8a', sunsetGlow: false },
  'victoria-falls': { color: '#8a6a4a', sunsetGlow: true },
}

function SimpleWindow({ position, locationType }: { position: [number, number, number]; locationType: 'golden-gate' | 'liberty' | 'big-ben' | 'old-town' | 'victoria-falls' }) {
  const config = SKY_COLORS[locationType]
  return (
    <group position={position}>
      <mesh position={[0.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5.5, 3.8]} />
        <meshBasicMaterial color={config.color} />
      </mesh>
      <pointLight position={[-3, 0, 0]} intensity={config.sunsetGlow ? 6 : 5} color={config.sunsetGlow ? '#ffaa60' : '#aaccff'} distance={25} />
    </group>
  )
}

function TeamDeskRow({ positions, chairColor, label, labelPosition }: { positions: number[]; chairColor: string; label: string; labelPosition: [number, number, number] }) {
  return (
    <group>
      <TeamAreaLabel position={labelPosition} label={label} />
      {positions.map((x, i) => (
        <group key={`${label}-${i}`}>
          <Desk position={[x, 0, -3]} />
          <Chair position={[x, 0, -2.1]} rotation={Math.PI} color={chairColor} />
          <Desk position={[x, 0, -0.5]} rotation={Math.PI} />
          <Chair position={[x, 0, -1.3]} color={chairColor} />
        </group>
      ))}
    </group>
  )
}

function OfficeLayout({ city, country, landmarkType, children, employees }: { city: string; country: string; landmarkType?: 'golden-gate' | 'liberty' | 'big-ben' | 'old-town' | 'victoria-falls'; children: React.ReactNode; employees: Employee[] }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 18]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
      </mesh>
      <mesh position={[0, 3, -8]}><planeGeometry args={[26, 6]} /><meshStandardMaterial color="#2e2e32" side={THREE.FrontSide} /></mesh>
      <mesh position={[-12, 3, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[16, 6]} /><meshStandardMaterial color="#2e2e32" side={THREE.FrontSide} /></mesh>
      <mesh position={[12, 3, -4]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[8, 6]} /><meshStandardMaterial color="#2e2e32" side={THREE.FrontSide} /></mesh>
      <mesh position={[12, 3, 4]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[8, 6]} /><meshStandardMaterial color="#2e2e32" side={THREE.FrontSide} /></mesh>
      {landmarkType && <SimpleWindow position={[11.9, 3, 0]} locationType={landmarkType} />}
      <HeySaladLogo city={city} country={country} />
      <ambientLight intensity={1.1} />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#444444" />
      <pointLight position={[-6, 4.5, -3]} intensity={3} color="#ffffff" distance={15} />
      <pointLight position={[0, 4.5, -3]} intensity={3} color="#ffffff" distance={15} />
      <pointLight position={[6, 4.5, -3]} intensity={3} color="#ffffff" distance={15} />
      <Plant position={[-10, 0, -6]} tall />
      <Plant position={[10, 0, -6]} tall />
      <Plant position={[-10, 0, 5]} />
      <Plant position={[10, 0, 5]} />
      {children}
      <OccupantMarkers officeName={city === 'Lusaka' ? 'Zambia' : city} employees={employees} />
    </group>
  )
}

function SanFranciscoOffice({ employees }: { employees: Employee[] }) {
  return <OfficeLayout city="San Francisco" country="United States" landmarkType="golden-gate" employees={employees}><TeamDeskRow positions={[-8,-6,-4]} chairColor="#3b82f6" label="Engineering" labelPosition={[-6,2.5,-3]} /><TeamDeskRow positions={[-1.5,1.5]} chairColor="#ed4c4c" label="Product" labelPosition={[0,2.5,-3]} /><TeamDeskRow positions={[4,6,8]} chairColor="#a855f7" label="Design" labelPosition={[6,2.5,-3]} /><TeamAreaLabel position={[0,2.5,4.5]} label="All Hands" /><MeetingTable position={[0,0,4.5]} color="#2a2a3a" /></OfficeLayout>
}
function NewYorkOffice({ employees }: { employees: Employee[] }) {
  return <OfficeLayout city="New York" country="United States" landmarkType="liberty" employees={employees}><TeamDeskRow positions={[-8,-6,-4]} chairColor="#22c55e" label="Sales" labelPosition={[-6,2.5,-3]} /><TeamDeskRow positions={[4,6,8]} chairColor="#f97316" label="Marketing" labelPosition={[6,2.5,-3]} /><TeamAreaLabel position={[0,2.5,4.5]} label="Executive Boardroom" /><MeetingTable position={[0,0,4.5]} color="#1a1a1e" /></OfficeLayout>
}
function LondonOffice({ employees }: { employees: Employee[] }) {
  return <OfficeLayout city="London" country="United Kingdom" landmarkType="big-ben" employees={employees}><TeamDeskRow positions={[-8,-6,-4]} chairColor="#7c4a1a" label="Operations" labelPosition={[-6,2.5,-3]} /><TeamDeskRow positions={[4,6,8]} chairColor="#8b5a2b" label="Finance" labelPosition={[6,2.5,-3]} /><TeamAreaLabel position={[0,2.5,4.5]} label="Conference Room" /><MeetingTable position={[0,0,4.5]} color="#3a2a1a" /></OfficeLayout>
}
function TallinnOffice({ employees }: { employees: Employee[] }) {
  return <OfficeLayout city="Tallinn" country="Estonia" landmarkType="old-town" employees={employees}><TeamDeskRow positions={[-8,-6,-4]} chairColor="#3a6a8a" label="Backend" labelPosition={[-6,2.5,-3]} /><TeamDeskRow positions={[4,6,8]} chairColor="#4a7a9a" label="Frontend" labelPosition={[6,2.5,-3]} /><TeamAreaLabel position={[0,2.5,4.5]} label="Standup Area" /><MeetingTable position={[0,0,4.5]} color="#1a2028" /></OfficeLayout>
}
function ZambiaOffice({ employees }: { employees: Employee[] }) {
  return <OfficeLayout city="Lusaka" country="Zambia" landmarkType="victoria-falls" employees={employees}><TeamDeskRow positions={[-8,-6,-4]} chairColor="#d07830" label="Customer Support" labelPosition={[-6,2.5,-3]} /><TeamDeskRow positions={[4,6,8]} chairColor="#30a868" label="Partnerships" labelPosition={[6,2.5,-3]} /><TeamAreaLabel position={[0,2.5,4.5]} label="Collaboration Hub" /><MeetingTable position={[0,0,4.5]} color="#4a3018" /></OfficeLayout>
}

function OfficeInterior({ office, employees }: { office: Office; employees: Employee[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  useFrame((_, delta) => {
    timeRef.current += delta
    if (groupRef.current) groupRef.current.position.y = Math.sin(timeRef.current * 0.4) * 0.003
  })
  return (
    <group ref={groupRef}>
      {office.name === 'San Francisco' ? <SanFranciscoOffice employees={employees} /> : office.name === 'New York' ? <NewYorkOffice employees={employees} /> : office.name === 'London' ? <LondonOffice employees={employees} /> : office.name === 'Tallinn' ? <TallinnOffice employees={employees} /> : <ZambiaOffice employees={employees} />}
    </group>
  )
}

const OFFICE_TIMEZONES: Record<string, { timezone: string; weather: string; temp: string }> = {
  'San Francisco': { timezone: 'America/Los_Angeles', weather: 'Sunny', temp: '18C' },
  'New York': { timezone: 'America/New_York', weather: 'Partly Cloudy', temp: '15C' },
  London: { timezone: 'Europe/London', weather: 'Overcast', temp: '12C' },
  Tallinn: { timezone: 'Europe/Tallinn', weather: 'Clear', temp: '8C' },
  Zambia: { timezone: 'Africa/Lusaka', weather: 'Warm', temp: '28C' },
}

function TimeWeatherDisplay({ officeName }: { officeName: string }) {
  const [currentTime, setCurrentTime] = useState('')
  const config = OFFICE_TIMEZONES[officeName] || OFFICE_TIMEZONES['San Francisco']
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: config.timezone, hour: '2-digit', minute: '2-digit', hour12: true }))
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [config.timezone])
  return <div className="flex items-center gap-3"><div className="text-right"><p className="text-white font-mono text-lg">{currentTime}</p><p className="text-white/50 text-xs">{config.weather} {config.temp}</p></div></div>
}

export function OfficeScene({ office, onBack, employees }: { office: Office; onBack: () => void; employees: Employee[] }) {
  const officeEmployees = employees.filter((employee) => employee.office === office.name)
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-auto">
          <p className="text-[#ed4c4c] font-semibold">{office.name}</p>
          <p className="text-xs text-white/50">{office.country} · {officeEmployees.length || office.team} people</p>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><TimeWeatherDisplay officeName={office.name} /></div>
          <button onClick={onBack} className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-sm transition-colors">Back to Globe</button>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"><div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"><p className="text-xs text-white/50">Drag to look around · Scroll to zoom</p></div></div>
      <Canvas camera={{ position: [0, 3, 10], fov: 50 }} shadows className="bg-black">
        <color attach="background" args={['#0a0a0a']} />
        <Suspense fallback={<LoadingFallback />}>
          <OfficeInterior office={office} employees={employees} />
          <Environment preset="city" background={false} />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom minDistance={5} maxDistance={18} maxPolarAngle={Math.PI / 2.1} minPolarAngle={0.3} target={[0, 1, 0]} />
      </Canvas>
    </div>
  )
}
