import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAllProducts() {
    return this.productsService.getAllPinturas();
  }

  @Get('query')
  buscarPorColor(@Query('color') color: string) {
    const pinturas = this.productsService.buscarPorColor(color);
    return {
      mensaje: `Buscando las pinturas de color ${color}`,
      resultados: pinturas,
    };
  }

  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productsService.getPinturaById(Number(id));
  }

  @Post()
  createProduct(
    @Body()
    body: {
      producto: string;
      marca: string;
      precio: number;
      color: string;
    },
  ) {
    return this.productsService.createPintura(
      body.producto,
      body.marca,
      body.precio,
      body.color,
    );
  }

  @Put(':id')
  updateProduct(
    @Param('id') id: string,
    @Body()
    body: {
      producto: string;
      marca: string;
      precio: number;
      color: string;
    },
  ) {
    return this.productsService.updatePintura(
      Number(id),
      body.producto,
      body.marca,
      body.precio,
      body.color,
    );
  }

  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deletePintura(Number(id));
  }
}
