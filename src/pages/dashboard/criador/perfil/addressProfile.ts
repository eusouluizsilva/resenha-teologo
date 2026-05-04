type FieldSpec = { label: string; placeholder: string }
type NeighborhoodSpec = FieldSpec & { show: boolean }

export type AddressProfile = {
  address: FieldSpec
  number: FieldSpec
  neighborhood: NeighborhoodSpec
  postal: FieldSpec
  city: FieldSpec
  state: FieldSpec
}

export function getAddressProfile(country: string): AddressProfile {
  switch (country) {
    case '+55': return {
      address:     { label: 'Logradouro',        placeholder: 'Rua, Avenida, Travessa...' },
      number:      { label: 'Número',             placeholder: '123' },
      neighborhood:{ label: 'Bairro',             placeholder: 'Seu bairro', show: true },
      postal:      { label: 'CEP',                placeholder: '00000-000' },
      city:        { label: 'Cidade',             placeholder: 'Sua cidade' },
      state:       { label: 'Estado',             placeholder: 'SP, RJ, MG...' },
    }
    case '+1': return {
      address:     { label: 'Street Address',     placeholder: '123 Main St' },
      number:      { label: 'Apt / Suite',        placeholder: 'Apt 4B' },
      neighborhood:{ label: 'Neighborhood',       placeholder: '', show: false },
      postal:      { label: 'ZIP / Postal Code',  placeholder: '10001' },
      city:        { label: 'City',               placeholder: 'New York' },
      state:       { label: 'State / Province',   placeholder: 'NY' },
    }
    case '+351': return {
      address:     { label: 'Rua',                placeholder: 'Rua das Flores...' },
      number:      { label: 'Número',             placeholder: '12' },
      neighborhood:{ label: 'Freguesia',          placeholder: '', show: false },
      postal:      { label: 'Código Postal',      placeholder: '1000-001' },
      city:        { label: 'Localidade',         placeholder: 'Lisboa' },
      state:       { label: 'Distrito / Região',  placeholder: 'Lisboa' },
    }
    case '+44': return {
      address:     { label: 'Street',             placeholder: '10 Downing Street' },
      number:      { label: 'House No.',          placeholder: '10' },
      neighborhood:{ label: 'Area',               placeholder: '', show: false },
      postal:      { label: 'Postcode',           placeholder: 'SW1A 2AA' },
      city:        { label: 'City / Town',        placeholder: 'London' },
      state:       { label: 'County',             placeholder: 'Greater London' },
    }
    case '+49': return {
      address:     { label: 'Straße',             placeholder: 'Hauptstraße' },
      number:      { label: 'Hausnummer',         placeholder: '1' },
      neighborhood:{ label: 'Stadtteil',          placeholder: '', show: false },
      postal:      { label: 'PLZ',                placeholder: '10115' },
      city:        { label: 'Ort',                placeholder: 'Berlin' },
      state:       { label: 'Bundesland',         placeholder: 'Berlin' },
    }
    case '+33': return {
      address:     { label: 'Rue',                placeholder: 'Rue de Rivoli' },
      number:      { label: 'Numéro',             placeholder: '1' },
      neighborhood:{ label: 'Quartier',           placeholder: '', show: false },
      postal:      { label: 'Code Postal',        placeholder: '75001' },
      city:        { label: 'Ville',              placeholder: 'Paris' },
      state:       { label: 'Département',        placeholder: 'Paris' },
    }
    case '+39': return {
      address:     { label: 'Via / Piazza',       placeholder: 'Via Roma' },
      number:      { label: 'Civico',             placeholder: '1' },
      neighborhood:{ label: 'Quartiere',          placeholder: '', show: false },
      postal:      { label: 'CAP',                placeholder: '00100' },
      city:        { label: 'Comune',             placeholder: 'Roma' },
      state:       { label: 'Provincia / Regione',placeholder: 'Lazio' },
    }
    case '+61': return {
      address:     { label: 'Street Address',     placeholder: '1 George Street' },
      number:      { label: 'Unit',               placeholder: 'Unit 2' },
      neighborhood:{ label: 'Suburb',             placeholder: 'Sydney CBD', show: true },
      postal:      { label: 'Postcode',           placeholder: '2000' },
      city:        { label: 'City',               placeholder: 'Sydney' },
      state:       { label: 'State / Territory',  placeholder: 'NSW' },
    }
    case '+54': return {
      address:     { label: 'Calle',              placeholder: 'Av. Corrientes...' },
      number:      { label: 'Número',             placeholder: '1234' },
      neighborhood:{ label: 'Barrio',             placeholder: 'Palermo', show: true },
      postal:      { label: 'Código Postal',      placeholder: '1043' },
      city:        { label: 'Ciudad',             placeholder: 'Buenos Aires' },
      state:       { label: 'Provincia',          placeholder: 'Buenos Aires' },
    }
    case '+52': return {
      address:     { label: 'Calle',              placeholder: 'Av. Reforma...' },
      number:      { label: 'Número',             placeholder: '1' },
      neighborhood:{ label: 'Colonia',            placeholder: 'Polanco', show: true },
      postal:      { label: 'Código Postal',      placeholder: '11560' },
      city:        { label: 'Ciudad / Municipio', placeholder: 'Ciudad de México' },
      state:       { label: 'Estado',             placeholder: 'CDMX' },
    }
    case '+57': return {
      address:     { label: 'Calle / Carrera',    placeholder: 'Cra 7 # 32-16' },
      number:      { label: 'Número / Piso',      placeholder: '301' },
      neighborhood:{ label: 'Barrio',             placeholder: 'Chapinero', show: true },
      postal:      { label: 'Código Postal',      placeholder: '110221' },
      city:        { label: 'Ciudad',             placeholder: 'Bogotá' },
      state:       { label: 'Departamento',       placeholder: 'Cundinamarca' },
    }
    case '+56': return {
      address:     { label: 'Calle',              placeholder: 'Av. Providencia...' },
      number:      { label: 'Número',             placeholder: '1234' },
      neighborhood:{ label: 'Villa / Población',  placeholder: 'Providencia', show: true },
      postal:      { label: 'Código Postal',      placeholder: '7500000' },
      city:        { label: 'Ciudad',             placeholder: 'Santiago' },
      state:       { label: 'Región',             placeholder: 'Metropolitana' },
    }
    case '+34': return {
      address:     { label: 'Calle',              placeholder: 'C/ Gran Vía...' },
      number:      { label: 'Número / Piso',      placeholder: '1, 2º' },
      neighborhood:{ label: 'Barrio',             placeholder: '', show: false },
      postal:      { label: 'Código Postal',      placeholder: '28001' },
      city:        { label: 'Municipio',          placeholder: 'Madrid' },
      state:       { label: 'Provincia',          placeholder: 'Madrid' },
    }
    case '+598': return {
      address:     { label: 'Calle',              placeholder: 'Av. 18 de Julio...' },
      number:      { label: 'Número',             placeholder: '1234' },
      neighborhood:{ label: 'Barrio',             placeholder: 'Centro', show: true },
      postal:      { label: 'Código Postal',      placeholder: '11000' },
      city:        { label: 'Ciudad',             placeholder: 'Montevideo' },
      state:       { label: 'Departamento',       placeholder: 'Montevideo' },
    }
    case '+595': return {
      address:     { label: 'Calle',              placeholder: 'Av. Mariscal López...' },
      number:      { label: 'Número',             placeholder: '1234' },
      neighborhood:{ label: 'Barrio',             placeholder: 'Centro', show: true },
      postal:      { label: 'Código Postal',      placeholder: '1209' },
      city:        { label: 'Ciudad',             placeholder: 'Asunción' },
      state:       { label: 'Departamento',       placeholder: 'Central' },
    }
    default: return {
      address:     { label: 'Street Address',     placeholder: 'Street, Avenue...' },
      number:      { label: 'Number / Unit',      placeholder: '1' },
      neighborhood:{ label: 'Neighborhood',       placeholder: '', show: false },
      postal:      { label: 'Postal Code',        placeholder: '00000' },
      city:        { label: 'City',               placeholder: 'Your city' },
      state:       { label: 'State / Region',     placeholder: 'Region' },
    }
  }
}
