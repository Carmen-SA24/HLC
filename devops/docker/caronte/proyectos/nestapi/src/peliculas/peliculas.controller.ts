// Controlador de rutas para películas
// Define los endpoints para crear, buscar, filtrar, actualizar y eliminar películas
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PeliculasService } from './peliculas.service';
import { CreatePeliculaDto } from './dto/create-pelicula.dto';
import { UpdatePeliculaDto } from './dto/update-pelicula.dto';

@Controller('peliculas')
export class PeliculasController {
  // Accede a las funciones de Películas
  constructor(private readonly peliculasService: PeliculasService) {}

  // Crea una nueva película
  @Post()
  create(@Body() createPeliculaDto: CreatePeliculaDto) {
    return this.peliculasService.create(createPeliculaDto);
  }

  // Devuelve todas las películas
  @Get()
  findAll() {
    return this.peliculasService.findAll();
  }

  // Busca películas por título
  @Get('title/:title')
  findByTitle(@Param('title') title: string) {
    return this.peliculasService.findByTitle(title);
  }

  // Busca películas por director
  @Get('director/:director')
  findByDirector(@Param('director') director: string) {
    return this.peliculasService.findByDirector(director);
  }

  // Busca películas con año mayor
  @Get('year-greater/:year')
  findByYearGreater(@Param('year') year: string) {
    return this.peliculasService.findByYearGreater(Number(year));
  }

  // Busca películas con año menor
  @Get('year-less/:year')
  findByYearLess(@Param('year') year: string) {
    return this.peliculasService.findByYearLess(Number(year));
  }

  // Busca películas con duración mayor
  @Get('length-greater/:length')
  findByLengthGreater(@Param('length') length: string) {
    return this.peliculasService.findByLengthGreater(Number(length));
  }

  // Busca películas con duración menor
  @Get('length-less/:length')
  findByLengthLess(@Param('length') length: string) {
    return this.peliculasService.findByLengthLess(Number(length));
  }

  // Busca una película por id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.peliculasService.findOne(+id);
  }

  // Actualiza una película por id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePeliculaDto: UpdatePeliculaDto) {
    return this.peliculasService.update(+id, updatePeliculaDto);
  }

  // Elimina una película por id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.peliculasService.remove(+id);
  }
}