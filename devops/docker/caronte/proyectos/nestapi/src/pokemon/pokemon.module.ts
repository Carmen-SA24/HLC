// Módulo de Pokémon: conecta la tabla, el controlador y el servicio

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pokemon } from './entities/pokemon.entity';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';

@Module({
  // Conecta la tabla Pokémon
  imports: [TypeOrmModule.forFeature([Pokemon])],

  // Controlador con las rutas de Pokémon
  controllers: [PokemonController],

  // Funciones para manejar los Pokémon
  providers: [PokemonService],
})
export class PokemonModule {}