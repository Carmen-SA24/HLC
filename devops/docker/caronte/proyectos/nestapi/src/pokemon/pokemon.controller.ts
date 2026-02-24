// Controlador de Pokémon
// Define los endpoints para crear, buscar, filtrar, actualizar y eliminar Pokémon

import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Controller('pokemon')
export class PokemonController {
  // Accede a las funciones de Pokémon
  constructor(private readonly pokemonService: PokemonService) {}

  // Crea un nuevo Pokémon
  @Post()
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  // Devuelve todos los Pokémon
  @Get()
  findAll() {
    return this.pokemonService.findAll();
  }

  // Busca Pokémon por nombre
  @Get('nombre/:nombre')
  findByNombre(@Param('nombre') nombre: string) {
    return this.pokemonService.findByNombre(nombre);
  }

  // Busca Pokémon por tipo
  @Get('tipo/:tipo')
  findByTipo(@Param('tipo') tipo: string) {
    return this.pokemonService.findByTipo(tipo);
  }

  // Busca Pokémon con HP mayor
  @Get('hp/mayor/:hp')
  findByHpMayor(@Param('hp') hp: string) {
    return this.pokemonService.findByHpMayor(Number(hp));
  }

  // Busca Pokémon con ataque mayor
  @Get('ataque/mayor/:ataque')
  findByAtaqueMayor(@Param('ataque') ataque: string) {
    return this.pokemonService.findByAtaqueMayor(Number(ataque));
  }

  // Busca Pokémon con defensa mayor
  @Get('defensa/mayor/:defensa')
  findByDefensaMayor(@Param('defensa') defensa: string) {
    return this.pokemonService.findByDefensaMayor(Number(defensa));
  }

  // Busca Pokémon con velocidad mayor
  @Get('velocidad/mayor/:velocidad')
  findByVelocidadMayor(@Param('velocidad') velocidad: string) {
    return this.pokemonService.findByVelocidadMayor(Number(velocidad));
  }

  // Busca un Pokémon por id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pokemonService.findOne(+id);
  }

  // Actualiza un Pokémon por id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePokemonDto: UpdatePokemonDto) {
    return this.pokemonService.update(+id, updatePokemonDto);
  }

  // Elimina un Pokémon por id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pokemonService.remove(+id);
  }
}