import { PresetTarget, LossMonitorTarget } from './types';

export const PRESET_TARGETS: PresetTarget[] = [
  // North America
  {
    id: 'aws-us-east-1',
    name: 'N. Virginia',
    hostname: 'ec2.us-east-1.amazonaws.com',
    region: 'us-east-1',
    coordinates: [-77.47, 39.04],
    color: '#06b6d4',
  },
  {
    id: 'aws-us-east-2',
    name: 'Ohio',
    hostname: 'ec2.us-east-2.amazonaws.com',
    region: 'us-east-2',
    coordinates: [-82.99, 39.96],
    color: '#0891b2',
  },
  {
    id: 'aws-us-west-1',
    name: 'N. California',
    hostname: 'ec2.us-west-1.amazonaws.com',
    region: 'us-west-1',
    coordinates: [-121.89, 37.34],
    color: '#0e7490',
  },
  {
    id: 'aws-us-west-2',
    name: 'Oregon',
    hostname: 'ec2.us-west-2.amazonaws.com',
    region: 'us-west-2',
    coordinates: [-120.55, 43.80],
    color: '#14b8a6',
  },
  {
    id: 'aws-ca-central-1',
    name: 'Canada',
    hostname: 'ec2.ca-central-1.amazonaws.com',
    region: 'ca-central-1',
    coordinates: [-73.57, 45.50],
    color: '#2dd4bf',
  },

  // South America
  {
    id: 'aws-sa-east-1',
    name: 'São Paulo',
    hostname: 'ec2.sa-east-1.amazonaws.com',
    region: 'sa-east-1',
    coordinates: [-46.63, -23.55],
    color: '#34d399',
  },

  // Europe
  {
    id: 'aws-eu-west-1',
    name: 'Ireland',
    hostname: 'ec2.eu-west-1.amazonaws.com',
    region: 'eu-west-1',
    coordinates: [-6.26, 53.35],
    color: '#8b5cf6',
  },
  {
    id: 'aws-eu-west-3',
    name: 'Paris',
    hostname: 'ec2.eu-west-3.amazonaws.com',
    region: 'eu-west-3',
    coordinates: [2.35, 48.86],
    color: '#a78bfa',
  },
  {
    id: 'aws-eu-central-1',
    name: 'Frankfurt',
    hostname: 'ec2.eu-central-1.amazonaws.com',
    region: 'eu-central-1',
    coordinates: [8.68, 50.11],
    color: '#a855f7',
  },
  {
    id: 'aws-eu-north-1',
    name: 'Stockholm',
    hostname: 'ec2.eu-north-1.amazonaws.com',
    region: 'eu-north-1',
    coordinates: [18.07, 59.33],
    color: '#c084fc',
  },
  {
    id: 'aws-eu-south-1',
    name: 'Milan',
    hostname: 'ec2.eu-south-1.amazonaws.com',
    region: 'eu-south-1',
    coordinates: [9.19, 45.46],
    color: '#7c3aed',
  },

  // Middle East
  {
    id: 'aws-me-central-1',
    name: 'UAE',
    hostname: 'ec2.me-central-1.amazonaws.com',
    region: 'me-central-1',
    coordinates: [54.37, 24.45],
    color: '#f97316',
  },
  {
    id: 'aws-me-south-1',
    name: 'Bahrain',
    hostname: 'ec2.me-south-1.amazonaws.com',
    region: 'me-south-1',
    coordinates: [50.58, 26.07],
    color: '#fb923c',
  },

  // Asia Pacific
  {
    id: 'aws-ap-south-1',
    name: 'Mumbai',
    hostname: 'ec2.ap-south-1.amazonaws.com',
    region: 'ap-south-1',
    coordinates: [72.88, 19.08],
    color: '#f59e0b',
  },
  {
    id: 'aws-ap-southeast-1',
    name: 'Singapore',
    hostname: 'ec2.ap-southeast-1.amazonaws.com',
    region: 'ap-southeast-1',
    coordinates: [103.85, 1.29],
    color: '#fbbf24',
  },
  {
    id: 'aws-ap-east-1',
    name: 'Hong Kong',
    hostname: 'ec2.ap-east-1.amazonaws.com',
    region: 'ap-east-1',
    coordinates: [114.17, 22.32],
    color: '#ef4444',
  },
  {
    id: 'aws-ap-southeast-3',
    name: 'Jakarta',
    hostname: 'ec2.ap-southeast-3.amazonaws.com',
    region: 'ap-southeast-3',
    coordinates: [106.85, -6.21],
    color: '#eab308',
  },

  // Oceania
  {
    id: 'aws-ap-southeast-2',
    name: 'Sydney',
    hostname: 'ec2.ap-southeast-2.amazonaws.com',
    region: 'ap-southeast-2',
    coordinates: [151.21, -33.87],
    color: '#f97316',
  },

  // Africa
  {
    id: 'aws-af-south-1',
    name: 'Cape Town',
    hostname: 'ec2.af-south-1.amazonaws.com',
    region: 'af-south-1',
    coordinates: [18.42, -33.92],
    color: '#22c55e',
  },
];

export const LOSS_MONITOR_TARGETS: LossMonitorTarget[] = [
  { id: 'us-east', name: 'US East', hostname: 'ec2.us-east-1.amazonaws.com', color: '#06b6d4', coordinates: [-77.47, 39.04] },
  { id: 'us-west', name: 'US West', hostname: 'ec2.us-west-2.amazonaws.com', color: '#14b8a6', coordinates: [-120.55, 43.80] },
  { id: 'europe', name: 'Europe', hostname: 'ec2.eu-central-1.amazonaws.com', color: '#a855f7', coordinates: [8.68, 50.11] },
  { id: 'middle-east', name: 'Middle East', hostname: 'ec2.me-central-1.amazonaws.com', color: '#f97316', coordinates: [54.37, 24.45] },
  { id: 'asia', name: 'Asia', hostname: 'ec2.ap-east-1.amazonaws.com', color: '#fbbf24', coordinates: [114.17, 22.32] },
  { id: 'africa', name: 'Africa', hostname: 'ec2.af-south-1.amazonaws.com', color: '#22c55e', coordinates: [18.42, -33.92] },
];
