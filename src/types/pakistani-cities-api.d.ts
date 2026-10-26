declare module "pakistani-cities-api" {
  export interface CityEntry {
    name: string;
    province: string;
    population?: number;
    capital?: boolean;
    lat?: string;
    lng?: string;
    iso2?: string;
  }

  interface PakistaniCitiesInterface {
    cities: CityEntry[];
    getAllCities(): CityEntry[];
    getCitiesByProvince(province: string): CityEntry[];
    getProvinces(): string[];
    searchCityByName(name: string): CityEntry[];
    getCityByName(name: string): CityEntry | undefined;
  }

  const pakistaniCities: PakistaniCitiesInterface;
  export default pakistaniCities;
  export const PakistaniCities: new () => PakistaniCitiesInterface;
}
