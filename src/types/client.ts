export interface ClientPalette {
  primary: string;
  accent: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'Fabricante' | 'Importador' | 'Distribuidor' | 'Almacén' | 'Taller';
  logo: string;
  palette: ClientPalette;
  landing: string;
  shopify: string;
}

export type ClientType = Client['type'];

export const CLIENT_TYPES: ClientType[] = [
  'Fabricante',
  'Importador',
  'Distribuidor',
  'Almacén',
  'Taller'
];

export const CLIENT_TYPE_LABELS: Record<ClientType, { title: string; description: string }> = {
  Fabricante: {
    title: 'Fabricantes',
    description: 'Marcas que diseñan y producen repuestos originales'
  },
  Importador: {
    title: 'Importadores',
    description: 'Empresas que traen productos del mercado internacional'
  },
  Distribuidor: {
    title: 'Distribuidores',
    description: 'Red de distribución a nivel nacional'
  },
  Almacén: {
    title: 'Almacenes',
    description: 'Puntos de venta y almacenamiento local'
  },
  Taller: {
    title: 'Talleres',
    description: 'Servicios técnicos especializados'
  }
};
