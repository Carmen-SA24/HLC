// DTO para actualizar películas
// Permite cambiar solo algunos campos de la película
import { PartialType } from '@nestjs/mapped-types';
import { CreatePeliculaDto } from './create-pelicula.dto';

export class UpdatePeliculaDto extends PartialType(CreatePeliculaDto) {}