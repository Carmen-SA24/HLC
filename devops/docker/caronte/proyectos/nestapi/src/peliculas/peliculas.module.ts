// Módulo de películas: conecta la tabla, el controlador y el servicio

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pelicula } from './entities/pelicula.entity';
import { PeliculasService } from './peliculas.service';
import { PeliculasController } from './peliculas.controller';

@Module({
  // Conecta la tabla Pelicula
  imports: [TypeOrmModule.forFeature([Pelicula])],

  // Controlador con las rutas de películas
  controllers: [PeliculasController],

  // Funciones para manejar las películas
  providers: [PeliculasService],
})
export class PeliculasModule {}