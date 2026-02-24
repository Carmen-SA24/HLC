// Servicio de Pokémon: funciones para crear, buscar, actualizar y eliminar Pokémon

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Pokemon } from './entities/pokemon.entity';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Injectable()
export class PokemonService {
  // Accede a la tabla Pokémon
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  // Crea un nuevo Pokémon
  create(createPokemonDto: CreatePokemonDto) {
    const pokemon = this.pokemonRepository.create(createPokemonDto);
    return this.pokemonRepository.save(pokemon);
  }

  // Devuelve todos los Pokémon
  findAll() {
    return this.pokemonRepository.find();
  }

  // Busca Pokémon por nombre
  findByNombre(nombre: string) {
    return this.pokemonRepository.find({ where: { nombre } });
  }

  // Busca Pokémon por tipo
  findByTipo(tipo: string) {
    return this.pokemonRepository.find({ where: { tipo } });
  }

  // Con HP mayor
  findByHpMayor(hp: number) {
    return this.pokemonRepository.find({ where: { hp: MoreThan(hp) } });
  }

  // Con ataque mayor
  findByAtaqueMayor(ataque: number) {
    return this.pokemonRepository.find({ where: { ataque: MoreThan(ataque) } });
  }

  // Con defensa mayor
  findByDefensaMayor(defensa: number) {
    return this.pokemonRepository.find({ where: { defensa: MoreThan(defensa) } });
  }

  // Con velocidad mayor
  findByVelocidadMayor(velocidad: number) {
    return this.pokemonRepository.find({ where: { velocidad: MoreThan(velocidad) } });
  }

  // Busca un Pokémon por id
  async findOne(id: number) {
    const pokemon = await this.pokemonRepository.findOneBy({ id });
    if (!pokemon) {
      throw new Error('Pokémon no encontrado');
    }
    return pokemon;
  }

  // Actualiza un Pokémon por id
  async update(id: number, updatePokemonDto: UpdatePokemonDto) {
    await this.pokemonRepository.update(id, updatePokemonDto);
    return this.findOne(id);
  }

  // Elimina un Pokémon por id
  async remove(id: number) {
    const pokemon = await this.findOne(id);
    await this.pokemonRepository.delete(id);
    return { message: 'Pokémon eliminado', pokemon };
  }
}