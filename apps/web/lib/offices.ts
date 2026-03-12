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
    description: 'European Command',
    team: 60,
    color: '#faa09a',
  },
  {
    name: 'Tallinn',
    country: 'Estonia',
    flag: '🇪🇪',
    lat: 59.437,
    lng: 24.7536,
    description: 'Engineering Center',
    team: 50,
    color: '#ffd0cd',
  },
  {
    name: 'Lusaka',
    country: 'Zambia',
    flag: '🇿🇲',
    lat: -15.3875,
    lng: 28.3228,
    description: 'Zambia HQ',
    team: 20,
    color: '#ed4c4c',
  },
  {
    name: 'Kitwe',
    country: 'Zambia',
    flag: '🇿🇲',
    lat: -12.8024,
    lng: 28.2132,
    description: 'Copperbelt Operations',
    team: 8,
    color: '#f97316',
  },
  {
    name: 'Ndola',
    country: 'Zambia',
    flag: '🇿🇲',
    lat: -12.9587,
    lng: 28.6366,
    description: 'Trade and Logistics',
    team: 6,
    color: '#fb7185',
  },
  {
    name: 'Livingstone',
    country: 'Zambia',
    flag: '🇿🇲',
    lat: -17.8419,
    lng: 25.8543,
    description: 'Hospitality Partnerships',
    team: 3,
    color: '#84cc16',
  },
  {
    name: 'Solwezi',
    country: 'Zambia',
    flag: '🇿🇲',
    lat: -12.1688,
    lng: 26.3894,
    description: 'Regional Growth Node',
    team: 3,
    color: '#22c55e',
  },
]
