import { Injectable } from '@nestjs/common';

export interface Pintura {
  id: number;
  producto: string;
  marca: string;
  precio: number;
  color: string;
}

@Injectable()
export class ProductsService {
  private pinturas: Pintura[] = [
    { id: 1, producto: 'Pintura acrílica', marca: 'Titan', precio: 15.99, color: 'azul' },
    { id: 2, producto: 'Pintura plástica', marca: 'Bruguer', precio: 25.50, color: 'blanco' },
    { id: 3, producto: 'Esmalte sintético', marca: 'Montó', precio: 18.75, color: 'rojo' },
    { id: 4, producto: 'Pintura acrílica', marca: 'Titan', precio: 16.50, color: 'azul' },
  ];

  getAllPinturas(): Pintura[] {
    return this.pinturas;
  }

  getPinturaById(id: number): Pintura | null {
    const pintura = this.pinturas.find((p) => p.id === id);
    if (!pintura) {
      return null;
    }
    return pintura;
  }

  createPintura(producto: string, marca: string, precio: number, color: string): Pintura {
    const nuevaPintura: Pintura = {
      id: this.pinturas.length + 1,
      producto,
      marca,
      precio,
      color,
    };
    this.pinturas.push(nuevaPintura);
    return nuevaPintura;
  }

  updatePintura(
    id: number,
    producto: string,
    marca: string,
    precio: number,
    color: string,
  ): Pintura | null {
    const index = this.pinturas.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }
    this.pinturas[index] = { id, producto, marca, precio, color };
    return this.pinturas[index];
  }

  deletePintura(id: number): string {
    const index = this.pinturas.findIndex((p) => p.id === id);
    if (index === -1) {
      return 'Pintura no encontrada';
    }
    this.pinturas.splice(index, 1);
    return `Hemos borrado la pintura ${id}`;
  }

  buscarPorColor(color: string): Pintura[] {
    return this.pinturas.filter(
      (p) => p.color.toLowerCase() === color.toLowerCase(),
    );
  }
}
