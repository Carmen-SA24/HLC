// Entidad Pokémon: define los campos de la tabla
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Pokemon {
  // ID del Pokémon
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre del Pokémon
  @Column()
  nombre: string;

  // Tipo del Pokémon
  @Column()
  tipo: string;

  // Puntos de vida (HP)
  @Column()
  hp: number;

  // Ataque
  @Column()
  ataque: number;

  // Defensa
  @Column()
  defensa: number;

  // Ataque especial
  @Column()
  sp_atk: number;

  // Defensa especial
  @Column()
  sp_def: number;

  // Velocidad
  @Column()
  velocidad: number;
}