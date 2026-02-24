// Funciones para películas
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Pelicula } from './entities/pelicula.entity';
import { CreatePeliculaDto } from './dto/create-pelicula.dto';
import { UpdatePeliculaDto } from './dto/update-pelicula.dto';

@Injectable()
export class PeliculasService {
    // Accede a la tabla Película
  constructor(
    @InjectRepository(Pelicula)
    private peliculaRepository: Repository<Pelicula>,
  ) {}

   // Crea una película
  create(createPeliculaDto: CreatePeliculaDto) {
    const pelicula = this.peliculaRepository.create(createPeliculaDto);
    return this.peliculaRepository.save(pelicula);
  }

  // Devuelve todas las películas
  findAll() {
    return this.peliculaRepository.find();
  }

  // Por título
  findByTitle(title: string) {
    return this.peliculaRepository.find({ where: { title } });
  }

  // Por director
  findByDirector(director: string) {
    return this.peliculaRepository.find({ where: { director } });
  }

  // Con año mayor
  findByYearGreater(year: number) {
    return this.peliculaRepository.find({ where: { year: MoreThan(year) } });
  }

  // Con año menor
  findByYearLess(year: number) {
    return this.peliculaRepository.find({ where: { year: LessThan(year) } });
  }

  // Con duración mayor
  findByLengthGreater(length: number) {
    return this.peliculaRepository.find({ where: { length_minutes: MoreThan(length) } });
  }

  // Con duración menor
  findByLengthLess(length: number) {
    return this.peliculaRepository.find({ where: { length_minutes: LessThan(length) } });
  }

  // Por id
  async findOne(id: number) {
    const pelicula = await this.peliculaRepository.findOneBy({ id });

    // Si no existe, lanza error
    if (!pelicula) {
      throw new NotFoundException(`Pelicula #${id} no encontrada`);
    }

    return pelicula;
  }

  // Actualiza una película
  async update(id: number, updatePeliculaDto: UpdatePeliculaDto) {
    // Comprueba que exista
    const pelicula = await this.findOne(id);

    // Mezcla los datos nuevos
    this.peliculaRepository.merge(pelicula, updatePeliculaDto);

    // Guarda los cambios
    return this.peliculaRepository.save(pelicula);
  }

  // Elimina una película
  async remove(id: number) {
    const result = await this.peliculaRepository.delete(id);

    // Si no borró nada, lanza error
    if (result.affected === 0) {
      throw new NotFoundException(`Pelicula #${id} no encontrada`);
    }

    return { deleted: true };
  }
}