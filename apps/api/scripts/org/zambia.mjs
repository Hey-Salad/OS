export const zambiaProvinces = [
  {
    code: 'ZM-08',
    name: 'Copperbelt',
    cities: [
      { name: 'Kitwe', lat: -12.8024, lng: 28.2132 },
      { name: 'Ndola', lat: -12.9683, lng: 28.6366 },
      { name: 'Chingola', lat: -12.5289, lng: 27.8838 },
      { name: 'Chililabombwe', lat: -12.3647, lng: 27.8229 }
    ]
  },
  {
    code: 'ZM-09',
    name: 'Lusaka',
    cities: [{ name: 'Lusaka', lat: -15.3875, lng: 28.3228 }]
  },
  {
    code: 'ZM-05',
    name: 'Northern',
    cities: [
      { name: 'Kasama', lat: -10.2129, lng: 31.1808 },
      { name: 'Mbala', lat: -8.8402, lng: 31.3659 }
    ]
  },
  {
    code: 'ZM-07',
    name: 'Southern',
    cities: [{ name: 'Livingstone', lat: -17.8419, lng: 25.8543 }]
  },
  {
    code: 'ZM-10',
    name: 'North-Western',
    cities: [{ name: 'Solwezi', lat: -12.1698, lng: 26.3894 }]
  },
  {
    code: 'ZM-04',
    name: 'Luapula',
    cities: [{ name: 'Mansa', lat: -11.2047, lng: 28.8943 }]
  }
];

export const zambiaOfficeBlueprints = [
  { officeName: 'Lusaka HQ', cityName: 'Lusaka', provinceCode: 'ZM-09', officeType: 'hq' },
  { officeName: 'Kitwe Operations Center', cityName: 'Kitwe', provinceCode: 'ZM-08', officeType: 'hub' },
  { officeName: 'Ndola Revenue Hub', cityName: 'Ndola', provinceCode: 'ZM-08', officeType: 'hub' },
  { officeName: 'Chingola Field Office', cityName: 'Chingola', provinceCode: 'ZM-08', officeType: 'branch' },
  { officeName: 'Chililabombwe Cross-Border Desk', cityName: 'Chililabombwe', provinceCode: 'ZM-08', officeType: 'branch' },
  { officeName: 'Kasama Service Office', cityName: 'Kasama', provinceCode: 'ZM-05', officeType: 'branch' },
  { officeName: 'Mbala Frontier Office', cityName: 'Mbala', provinceCode: 'ZM-05', officeType: 'branch' },
  { officeName: 'Livingstone Partnerships Office', cityName: 'Livingstone', provinceCode: 'ZM-07', officeType: 'branch' },
  { officeName: 'Solwezi Mining-Tech Office', cityName: 'Solwezi', provinceCode: 'ZM-10', officeType: 'branch' },
  { officeName: 'Luapula Operations Center', cityName: 'Mansa', provinceCode: 'ZM-04', officeType: 'branch' }
];
