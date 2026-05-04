export type TabId =
  | 'visao-geral'
  | 'dados-pessoais'
  | 'perfil-publico'
  | 'conquistas'
  | 'depoimentos'
  | 'privacidade'

export type FormState = {
  firstName: string
  lastName: string
  bio: string
  website: string
  youtubeChannel: string
  instagram: string
  facebook: string
  linkedin: string
  twitter: string
  phone: string
  phoneCountry: string
  address: string
  addressNumber: string
  neighborhood: string
  cep: string
  city: string
  state: string
  institution: string
  cnpj: string
  denomination: string
  churchRole: string
  churchName: string
  churchInstagram: string
}

export const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  bio: '',
  website: '',
  youtubeChannel: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  twitter: '',
  phone: '',
  phoneCountry: '+55',
  address: '',
  addressNumber: '',
  neighborhood: '',
  cep: '',
  city: '',
  state: '',
  institution: '',
  cnpj: '',
  denomination: '',
  churchRole: '',
  churchName: '',
  churchInstagram: '',
}
