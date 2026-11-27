// venues.js — the five stops of the Cendrawasih Airshow Circuit.
// Each venue is a recognisable place with its own sky, ground, water and
// landmark feature. The renderer reads these, it never hard-codes a venue.
const VENUES = [
  {
    id: 'arunika',
    name: 'Teluk Arunika',
    tagline: 'Lagoon dawn — gold light on the water',
    time: 'dawn',
    skyTop: '#274b7d', skyMid: '#e08a5a', skyLow: '#ffd9a0',
    sun: { x: 0.72, y: 0.30, r: 46, color: '#ffdf9e', glow: 'rgba(255,190,110,0.55)' },
    sea: '#2e8fa3', seaDeep: '#1d6b84', sand: '#e8d9a0', land: '#4d9a5f', landFar: '#3a7a4e',
    feature: 'lagoon',
    runway: { x: -30, surface: '#8d8578', edge: '#f5f2e8' },
    crowdBase: 55,
    blurb: 'Take off from the lagoon shore as the sun clears the bay.'
  },
  {
    id: 'merapi',
    name: 'Kawah Merapi',
    tagline: 'Volcano rim — smoke over black rock',
    time: 'morning',
    skyTop: '#6ea3d6', skyMid: '#c9d8e8', skyLow: '#f2e6c8',
    sun: { x: 0.24, y: 0.22, r: 38, color: '#fff3c4', glow: 'rgba(255,240,180,0.4)' },
    sea: '#5a7d8c', seaDeep: '#3d5a68', sand: '#b9a98e', land: '#5c5648', landFar: '#4a4438',
    feature: 'volcano',
    runway: { x: 10, surface: '#7d7468', edge: '#f5f2e8' },
    crowdBase: 60,
    blurb: 'Thread the rings with the crater smoking at your shoulder.'
  },
  {
    id: 'senja',
    name: 'Ngarai Senja',
    tagline: 'Canyon gold — terraces on the hillside',
    time: 'sunset',
    skyTop: '#3d3a6e', skyMid: '#d96a4a', skyLow: '#ffb37a',
    sun: { x: 0.5, y: 0.34, r: 52, color: '#ffcf8a', glow: 'rgba(255,160,90,0.55)' },
    sea: '#7a5a6e', seaDeep: '#5c4256', sand: '#c9a06a', land: '#8a6a3e', landFar: '#6e5230',
    feature: 'canyon',
    runway: { x: -15, surface: '#8d7a62', edge: '#f5f2e8' },
    crowdBase: 65,
    blurb: 'Carve the gorge as the terraces turn to gold.'
  },
  {
    id: 'pelabuhan',
    name: 'Pelabuhan Senja',
    tagline: 'Harbour dusk — town lights on the water',
    time: 'dusk',
    skyTop: '#232a55', skyMid: '#7a4a72', skyLow: '#e08a6a',
    sun: { x: 0.68, y: 0.38, r: 34, color: '#ffd2a0', glow: 'rgba(255,170,110,0.45)' },
    sea: '#2c4a6e', seaDeep: '#1e3350', sand: '#a08a68', land: '#4a4a58', landFar: '#38384a',
    feature: 'harbour',
    runway: { x: 20, surface: '#6e6a72', edge: '#ffe9a8' },
    crowdBase: 70,
    blurb: 'Fly the freestyle over the harbour as the town lights up.'
  },
  {
    id: 'malam',
    name: 'Langit Malam',
    tagline: 'Night final — the circuit under the stars',
    time: 'night',
    skyTop: '#060a1e', skyMid: '#101a3e', skyLow: '#2a2a55',
    sun: { x: 0.78, y: 0.24, r: 30, color: '#f2f0ff', glow: 'rgba(200,210,255,0.35)' },
    sea: '#0e1e38', seaDeep: '#0a1428', sand: '#5a5244', land: '#1e2438', landFar: '#161c30',
    feature: 'night',
    runway: { x: 0, surface: '#3a3a48', edge: '#9fd8ff' },
    crowdBase: 75,
    blurb: 'The final: five venues, one champion, under the stars.'
  }
];
