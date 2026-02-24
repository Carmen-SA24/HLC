// DTO para crear un Pokémon: valida los campos requeridos y sus tipos

import { IsString, IsInt, Min } from 'class-validator';

export class CreatePokemonDto {
  // Nombre del Pokémon
  @IsString()
  nombre: string;

  // Tipo del Pokémon
  @IsString()
  tipo: string;

  // Puntos de vida (HP), mínimo 1
  @IsInt()
  @Min(1)
  hp: number;

  // Ataque, mínimo 1
  @IsInt()
  @Min(1)
  ataque: number;

  // Defensa, mínimo 1
  @IsInt()
  @Min(1)
  defensa: number;

  // Ataque especial, mínimo 1
  @IsInt()
  @Min(1)
  sp_atk: number;

  // Defensa especial, mínimo 1
  @IsInt()
  @Min(1)
  sp_def: number;

  // Velocidad, mínimo 1
  @IsInt()
  @Min(1)
  velocidad: number;
}