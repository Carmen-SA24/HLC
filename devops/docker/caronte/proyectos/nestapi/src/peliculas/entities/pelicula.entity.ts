// Entidad Película para TypeORM
// Define la tabla "pelicula" y sus columnas
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Pelicula {
  // ID autogenerado
  @PrimaryGeneratedColumn()
  id: number;

  // Título de la película
  @Column()
  title: string;

  // Director de la película
  @Column()
  director: string;

  // Año de estreno
  @Column()
  year: number;

  // Duración en minutos
  @Column()
  length_minutes: number;
}