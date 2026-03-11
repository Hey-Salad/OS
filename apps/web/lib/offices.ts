import type { OfficeName } from './types'

export interface Office {
  name: OfficeName | string
  country: string
  flag: string
  lat: number
  lng: number
  description: string
  team: number
  color: string
}

export const fallbackOffices: Office[] = [
  {
    name: 'San Francisco',
    country: 'United States',
    flag: '🇺🇸',
    lat: 37.7749,
    lng: -122.4194,
    description: 'Product & Engineering HQ',
    team: 85,
    color: '#ed4c4c',
  },
  {
    name: 'New York',
    country: 'United States',
    flag: '🇺🇸',
    lat: 40.7128,
    lng: -74.006,
    description: 'Sales & Marketing Hub',
    team: 65,
    color: '#fe6c60',
  },
  {
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    lat: 51.5074,
    lng: -0.1278,
    description: 'European Operations',
    team: 45,
    color: '#faa09a',
  },
  {
    name: 'Tallinn',
    country: 'Estonia',
    flag: '🇪🇪',
    lat: 59.437,
    lng: 24.7536,
    description: 'Engineering Center',
    team: 55,
    color: '#ffd0cd',
  },
  {
    name: 'Zambia',
    country: 'Zambia',
    flag: '🇿🇲',
    lat: -15.3875,
    lng: 28.3228,
    description: 'Regional Hub',
    team: 50,
    color: '#ed4c4c',
  },
]
