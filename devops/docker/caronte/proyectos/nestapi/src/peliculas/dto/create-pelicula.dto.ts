// DTO para crear películas
// Define los campos que se necesitan y sus reglas de validación
import { IsString, IsInt, Min } from 'class-validator';

export class CreatePeliculaDto {
  // Título de la película
  @IsString()
  title: string;

  // Director de la película
  @IsString()
  director: string;

  // Año de estreno, mínimo 1800
  @IsInt()
  @Min(1800)
  year: number;

  // Duración en minutos, mínimo 1
  @IsInt()
  @Min(1)
  length_minutes: number;
}