import * as fs from 'fs';
import * as path from 'path';

import { app } from 'electron';

const storePath = path.join(app.getPath('userData'), 'data.json');

function getAllStorage(): any {
  // Verificar si el archivo existe
  if (!fs.existsSync(storePath)) {
    // Si no existe, crear el archivo con un objeto vacío
    fs.writeFileSync(storePath, JSON.stringify({}, null, 2));
    return {};
  }

  try {
    const data = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error al leer el archivo de almacenamiento:', err);
    return {}; // Si está vacío o hay error al leerlo
  }
}

function setAllStorage(data: any) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function setValue(key: string, value: any) {
  const datos = getAllStorage();
  datos[key] = value;
  setAllStorage(datos);
}

function getValue(key: string): any {
  const datos = getAllStorage();
  return datos[key];
}

export const dataStore = { setValue, getValue };