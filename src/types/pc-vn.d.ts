declare module "pc-vn" {
  export type Province = { code: string; name: string; unit?: string };
  export type District = { code: string; name: string; unit?: string; province_code: string };
  export type Ward = {
    code: string;
    name: string;
    unit?: string;
    province_code: string;
    district_code: string;
  };

  export function getProvinces(): Province[];
  export function getDistricts(): District[];
  export function getWards(): Ward[];
  export function getDistrictsByProvinceCode(provinceCode: string): District[];
  export function getWardsByDistrictCode(districtCode: string): Ward[];
  export function getWardsByProvinceCode(provinceCode: string): Ward[];
}

