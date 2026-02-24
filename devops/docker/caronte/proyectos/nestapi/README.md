# Implementación Controlador de Pinturas - NestJS

## PASO 1: Crear el Módulo (Opcional pero Recomendado)
```bash
nest generate module products --no-spec
```
**Resultado:** Crea `products.module.ts` que encapsula los componentes de productos

> **Nota:** Si creas el módulo primero, los siguientes pasos (controller y service) se registrarán automáticamente en este módulo.

## PASO 2: Crear el Controlador
```bash
nest generate controller products --no-spec
```
**Resultado:** Crea `products.controller.ts`

## PASO 3: Crear el Servicio
```bash
nest generate service products --no-spec
```
**Resultado:** Crea `products.service.ts`

## PASO 4: Crear la Interfaz (Separación de Responsabilidades)

### Crear `src/products/products.interface.ts`
```typescript
export interface Pintura {
  id: number;
  producto: string;
  marca: string;
  precio: number;
  color: string;
}
```

**Ventaja:** La interfaz está separada y puede reutilizarse en otros archivos.

## PASO 5: Crear el DTO (Data Transfer Object)

### ¿Qué es un DTO?
Un DTO es un objeto que se transfiere por la red entre dos sistemas. Es una **clase** (no una interfaz) que permite:
- Validar datos automáticamente
- Usar decoradores de validación
- Existir en tiempo de ejecución

### Crear el DTO
```bash
nest generate class products/dto/product.dto
```

**Resultado:** Crea `src/products/dto/product.dto/product.dto.ts` y `src/products/dto/product.dto/product.dto.spec.ts`

> **⚠️ Importante:** El comando crea una carpeta extra. Hay que reorganizar los archivos:

```bash
# Mover los archivos a la ubicación correcta
Move-Item -Path "src\products\dto\product.dto\product.dto.ts" -Destination "src\products\dto\product.dto.ts"
Move-Item -Path "src\products\dto\product.dto\product.dto.spec.ts" -Destination "src\products\dto\product.dto.spec.ts"

# Eliminar la carpeta vacía
Remove-Item -Path "src\products\dto\product.dto" -Recurse
```

**Ubicación final correcta:** 
- `src/products/dto/product.dto.ts`
- `src/products/dto/product.dto.spec.ts`

### Contenido del DTO:
```typescript
import { IsString, IsNumber } from 'class-validator';

export class ProductDto {
  @IsString()
  producto: string;

  @IsString()
  marca: string;

  @IsNumber()
  precio: number;

  @IsString()
  color: string;
}
```

**Decoradores de validación:**
- `@IsString()` - Valida que el campo sea un string
- `@IsNumber()` - Valida que el campo sea un número
- `@IsOptional()` - Hace el campo opcional (si fuera necesario)

> **Nota:** El DTO no incluye el `id` porque se genera automáticamente en el servidor.

### Instalar librerías para validación

Antes de usar los decoradores de validación en el DTO, es necesario instalar las siguientes librerías:

```bash
npm install class-validator class-transformer
```

**Resultado:**
- Se instalan las librerías necesarias para validar y transformar datos en los DTOs.
- Estas librerías permiten usar decoradores como `@IsString()`, `@IsNumber()`, etc., para validar automáticamente los datos de entrada.

**Comando ejecutado:**
```bash
npm install class-validator class-transformer
```

### Configurar pipe global de validación en main.ts

Editar `src/main.ts` para que quede así:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

**Cambios realizados:**
- ✅ Importar `ValidationPipe` desde `@nestjs/common`  
- ✅ Agregar `app.useGlobalPipes(new ValidationPipe())` antes de `app.listen()`

**Para qué sirve:** Habilita la validación automática de DTOs en todos los endpoints.

## PASO 6: Editar `products.service.ts`

### Contenido completo:
```typescript
import { Injectable } from '@nestjs/common';
import { Pintura } from './products.interface';

@Injectable()
export class ProductsService {
  private pinturas: Pintura[] = [
    { id: 1, producto: 'Pintura acrílica', marca: 'Titan', precio: 15.99, color: 'azul' },
    { id: 2, producto: 'Pintura plástica', marca: 'Bruguer', precio: 25.50, color: 'blanco' },
    { id: 3, producto: 'Esmalte sintético', marca: 'Montó', precio: 18.75, color: 'rojo' },
    { id: 4, producto: 'Pintura acrílica', marca: 'Titan', precio: 16.50, color: 'azul' },
  ];

  getAllPinturas(): Pintura[] {
    console.log('✅ Obteniendo todas las pinturas');
    return this.pinturas;
  }

  getPinturaById(id: number): Pintura | null {
    const pintura = this.pinturas.find((p) => p.id === id);
    if (!pintura) {
      console.log(`❌ Pintura con id ${id} no encontrada`);
      return null;
    }
    console.log(`✅ Pintura con id ${id} encontrada`);
    return pintura;
  }

  createPintura(pintura: Pintura): Pintura {
    const nuevaPintura: Pintura = {
      ...pintura,
      id: this.pinturas.length + 1,
    };
    this.pinturas.push(nuevaPintura);
    console.log(`✅ Pintura creada exitosamente: ${pintura.producto} - ${pintura.marca}`);
    return nuevaPintura;
  }

  updatePintura(id: number, pintura: Pintura): Pintura | null {
    const index = this.pinturas.findIndex((p) => p.id === id);
    if (index === -1) {
      console.log(`❌ No se pudo actualizar. Pintura con id ${id} no encontrada`);
      return null;
    }
    this.pinturas[index] = { ...pintura, id };
    console.log(`✅ Pintura con id ${id} actualizada exitosamente`);
    return this.pinturas[index];
  }

  deletePintura(id: number): string {
    const index = this.pinturas.findIndex((p) => p.id === id);
    if (index === -1) {
      console.log(`❌ No se pudo eliminar. Pintura con id ${id} no encontrada`);
      return 'Pintura no encontrada';
    }
    this.pinturas.splice(index, 1);
    console.log(`✅ Pintura con id ${id} eliminada exitosamente`);
    return `Hemos borrado la pintura ${id}`;
  }

  buscarPorColor(color: string): Pintura[] {
    const resultados = this.pinturas.filter(
      (p) => p.color.toLowerCase() === color.toLowerCase(),
    );
    console.log(`🔍 Búsqueda por color "${color}": ${resultados.length} pintura(s) encontrada(s)`);
    return resultados;
  }
}
```

**Mejoras implementadas:**
- ✅ Mensajes de confirmación para cada operación CRUD
- ✅ Métodos reciben objetos completos (`pintura: Pintura`) en lugar de parámetros individuales
- ✅ Uso del operador spread (`...`) para mantener inmutabilidad

## PASO 7: Editar `products.controller.ts`

### Contenido completo:
```typescript
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
import { Pintura } from './products.interface';

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
  createProduct(@Body() body: Omit<Pintura, 'id'>) {
    return this.productsService.createPintura(body as Pintura);
  }

  @Put(':id')
  updateProduct(@Param('id') id: string, @Body() body: Omit<Pintura, 'id'>) {
    return this.productsService.updatePintura(Number(id), body as Pintura);
  }

  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deletePintura(Number(id));
  }
}
```

**Mejoras implementadas:**
- ✅ Uso de la interfaz `Pintura` importada
- ✅ Eliminación de definiciones inline redundantes
- ✅ Uso de `Omit<Pintura, 'id'>` para excluir el `id` del body (se genera automáticamente o viene por URL)

## PASO 8: Verificar `app.module.ts`

Debe contener:
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';

@Module({
  imports: [],
  controllers: [AppController, ProductsController],
  providers: [AppService, ProductsService],
})
export class AppModule {}
```

> **Nota:** Si creaste el módulo products en el PASO 1, también deberías importarlo aquí:
```typescript
import { ProductsModule } from './products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
```

## PASO 9: Ejecutar el Servidor
```bash
npm run start:dev
```

## PASO 10: Probar en el Navegador

### GET - Obtener todas las pinturas
```
http://localhost:3001/products
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "producto": "Pintura acrílica",
    "marca": "Titan",
    "precio": 15.99,
    "color": "azul"
  },
  {
    "id": 2,
    "producto": "Pintura plástica",
    "marca": "Bruguer",
    "precio": 25.50,
    "color": "blanco"
  },
  {
    "id": 3,
    "producto": "Esmalte sintético",
    "marca": "Montó",
    "precio": 18.75,
    "color": "rojo"
  },
  {
    "id": 4,
    "producto": "Pintura acrílica",
    "marca": "Titan",
    "precio": 16.50,
    "color": "azul"
  }
]
```

### Estructura de la respuesta:
- Es un **array** (lista) `[]`
- Que contiene **objetos** `{}`
- Cada objeto representa un producto con sus propiedades:
  - `id` → identificador único
  - `producto` → nombre del producto
  - `marca` → marca del producto
  - `precio` → número decimal (float)
  - `color` → color del producto

### GET - Obtener pintura por ID
```
http://localhost:3001/products/1
```

### GET - Buscar por color (Query Params)
```
http://localhost:3001/products/query?color=azul
```

**Respuesta esperada:**
```json
{
  "mensaje": "Buscando las pinturas de color azul",
  "resultados": [
    {
      "id": 1,
      "producto": "Pintura acrílica",
      "marca": "Titan",
      "precio": 15.99,
      "color": "azul"
    },
    {
      "id": 4,
      "producto": "Pintura acrílica",
      "marca": "Titan",
      "precio": 16.50,
      "color": "azul"
    }
  ]
}
```

## Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products` | Obtener todas las pinturas |
| GET | `/products/:id` | Obtener pintura por ID |
| GET | `/products/query?color=azul` | Buscar pinturas por color |
| POST | `/products` | Crear nueva pintura |
| PUT | `/products/:id` | Actualizar pintura existente |
| DELETE | `/products/:id` | Eliminar pintura |

## Conceptos Clave

### CRUD
- **C**REATE → `createPintura` → INSERT
- **R**EAD → `getAllPinturas`, `getPinturaById` → SELECT
- **U**PDATE → `updatePintura` → UPDATE
- **D**ELETE → `deletePintura` → DELETE

### API REST
El endpoint `http://localhost:3001/products/` devuelve una respuesta JSON típica de una API REST (GET /products).

---

## 📝 Mejoras Realizadas (Última Sesión)

1. ✅ **Mensajes de confirmación** en todas las operaciones CRUD
2. ✅ **Interfaz separada** en archivo independiente (`products.interface.ts`)
3. ✅ **Métodos simplificados** - reciben objetos completos en lugar de parámetros individuales
4. ✅ **Controlador optimizado** - eliminación de definiciones inline redundantes
5. ✅ **Tipado correcto** - uso de `Omit<Pintura, 'id'>` para POST y PUT

## 🚀 Próximos Pasos (Siguiente Clase)

- Implementar **DTOs** (Data Transfer Objects) con validaciones
- Usar `class-validator` y `class-transformer`
- Crear `CreatePinturaDto` y `UpdatePinturaDto`

---

## ⚡ Creación de Recurso Completo con `nest generate resource` (16 de febrero de 2026)

### Comando para Crear un Recurso Completo

En lugar de crear módulo, controlador y servicio por separado, NestJS ofrece un comando que genera todo de una vez:

```bash
nest generate resource pintura --no-spec
```

**Opciones al ejecutar el comando:**
1. Seleccionar tipo de API: **REST API**
2. Generar endpoints CRUD: **Y** (Yes)

### ¿Qué se genera automáticamente?

```
src/pintura/
├── dto/
│   ├── create-pintura.dto.ts
│   └── update-pintura.dto.ts
├── entities/
│   └── pintura.entity.ts
├── pintura.controller.ts
├── pintura.service.ts
└── pintura.module.ts
```

**Resultado:** Crea una estructura completa con:
- ✅ **Módulo** (`pintura.module.ts`) - Encapsula todos los componentes
- ✅ **Controlador** (`pintura.controller.ts`) - Con endpoints CRUD completos
- ✅ **Servicio** (`pintura.service.ts`) - Con métodos CRUD (create, findAll, findOne, update, remove)
- ✅ **DTOs** (`create-pintura.dto.ts`, `update-pintura.dto.ts`) - Para validación de datos
- ✅ **Entity** (`pintura.entity.ts`) - Modelo de datos
- ✅ **Registro automático** en `app.module.ts`

### Contenido de los archivos generados:

#### 1. `entities/pintura.entity.ts`
```typescript
export class Pintura {
  id?: number;
  producto: string;
  marca: string;
  precio: number;
  color: string;
}
```

#### 2. `dto/create-pintura.dto.ts`
```typescript
import { IsString, IsNumber } from 'class-validator';

export class CreatePinturaDto {
  @IsString()
  producto: string;

  @IsString()
  marca: string;

  @IsNumber()
  precio: number;

  @IsString()
  color: string;
}
```

#### 3. `dto/update-pintura.dto.ts`
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreatePinturaDto } from './create-pintura.dto';

export class UpdatePinturaDto extends PartialType(CreatePinturaDto) {}
```

**Explicación:** `PartialType` convierte todos los campos de `CreatePinturaDto` en opcionales automáticamente.

#### 4. `pintura.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { CreatePinturaDto } from './dto/create-pintura.dto';
import { UpdatePinturaDto } from './dto/update-pintura.dto';
import { Pintura } from './entities/pintura.entity';

@Injectable()
export class PinturaService {
  private pinturas: Pintura[] = [
    { id: 1, producto: 'Pintura acrílica', marca: 'Titan', precio: 15.99, color: 'azul' },
    { id: 2, producto: 'Pintura plástica', marca: 'Bruguer', precio: 25.50, color: 'blanco' },
    { id: 3, producto: 'Esmalte sintético', marca: 'Montó', precio: 18.75, color: 'rojo' },
    { id: 4, producto: 'Pintura acrílica', marca: 'Titan', precio: 16.50, color: 'azul' },
  ];

  create(createPinturaDto: CreatePinturaDto): Pintura {
    const nuevaPintura: Pintura = {
      ...createPinturaDto,
      id: this.pinturas.length + 1,
    };
    this.pinturas.push(nuevaPintura);
    console.log(`✅ Pintura creada exitosamente: ${createPinturaDto.producto} - ${createPinturaDto.marca}`);
    return nuevaPintura;
  }

  findAll(): Pintura[] {
    console.log('✅ Obteniendo todas las pinturas');
    return this.pinturas;
  }

  findOne(id: number): Pintura | null {
    const pintura = this.pinturas.find((p) => p.id === id);
    if (!pintura) {
      console.log(`❌ Pintura con id ${id} no encontrada`);
      return null;
    }
    console.log(`✅ Pintura con id ${id} encontrada`);
    return pintura;
  }

  update(id: number, updatePinturaDto: UpdatePinturaDto): Pintura | null {
    const index = this.pinturas.findIndex((p) => p.id === id);
    if (index === -1) {
      console.log(`❌ No se pudo actualizar. Pintura con id ${id} no encontrada`);
      return null;
    }
    this.pinturas[index] = { ...this.pinturas[index], ...updatePinturaDto, id };
    console.log(`✅ Pintura con id ${id} actualizada exitosamente`);
    return this.pinturas[index];
  }

  remove(id: number): string {
    const index = this.pinturas.findIndex((p) => p.id === id);
    if (index === -1) {
      console.log(`❌ No se pudo eliminar. Pintura con id ${id} no encontrada`);
      return 'Pintura no encontrada';
    }
    this.pinturas.splice(index, 1);
    console.log(`✅ Pintura con id ${id} eliminada exitosamente`);
    return `Hemos borrado la pintura ${id}`;
  }

  buscarPorColor(color: string): Pintura[] {
    const resultados = this.pinturas.filter(
      (p) => p.color.toLowerCase() === color.toLowerCase(),
    );
    console.log(`🔍 Búsqueda por color "${color}": ${resultados.length} pintura(s) encontrada(s)`);
    return resultados;
  }
}
```

#### 5. `pintura.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { PinturaService } from './pintura.service';
import { CreatePinturaDto } from './dto/create-pintura.dto';
import { UpdatePinturaDto } from './dto/update-pintura.dto';

@Controller('pintura')
export class PinturaController {
  constructor(private readonly pinturaService: PinturaService) {}

  @Post()
  create(@Body() createPinturaDto: CreatePinturaDto) {
    return this.pinturaService.create(createPinturaDto);
  }

  @Get()
  findAll() {
    return this.pinturaService.findAll();
  }

  @Get('query')
  buscarPorColor(@Query('color') color: string) {
    const pinturas = this.pinturaService.buscarPorColor(color);
    return {
      mensaje: `Buscando las pinturas de color ${color}`,
      resultados: pinturas,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pinturaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePinturaDto: UpdatePinturaDto) {
    return this.pinturaService.update(+id, updatePinturaDto);
  }

  @Put(':id')
  updateFull(@Param('id') id: string, @Body() updatePinturaDto: UpdatePinturaDto) {
    return this.pinturaService.update(+id, updatePinturaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pinturaService.remove(+id);
  }
}
```

### Endpoints Disponibles para `/pintura`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/pintura` | Obtener todas las pinturas |
| GET | `/pintura/:id` | Obtener pintura por ID |
| GET | `/pintura/query?color=azul` | Buscar pinturas por color |
| POST | `/pintura` | Crear nueva pintura |
| PATCH | `/pintura/:id` | Actualizar parcialmente una pintura |
| PUT | `/pintura/:id` | Actualizar completamente una pintura |
| DELETE | `/pintura/:id` | Eliminar pintura |

### Ejecutar el servidor

```bash
npm run start:dev
```

### Probar en el navegador

```
http://localhost:3001/pintura
http://localhost:3001/pintura/1
http://localhost:3001/pintura/query?color=azul
```

### Ventajas de usar `nest generate resource`

✅ **Ahorro de tiempo** - Genera toda la estructura en un solo comando  
✅ **Buenas prácticas** - Sigue la arquitectura recomendada de NestJS  
✅ **DTOs listos** - Crea CreateDto y UpdateDto automáticamente  
✅ **CRUD completo** - Todos los endpoints REST estándar  
✅ **Registro automático** - Se añade al app.module.ts automáticamente  

### Diferencia entre PATCH y PUT

- **PUT** → Reemplaza el recurso completo (todos los campos)
- **PATCH** → Actualización parcial (solo los campos enviados)

En este caso, ambos usan la misma lógica gracias a `PartialType` en el UpdateDto.

---

## Configuración de TypeORM con MySQL

✅ **Estado:** Configuración completada y conexión verificada

### PASO 1: Instalación de Dependencias

```bash
npm install @nestjs/typeorm typeorm mysql2
```

**Paquetes instalados:**
- `@nestjs/typeorm` - Módulo de integración de TypeORM con NestJS
- `typeorm` - ORM para TypeScript y JavaScript
- `mysql2` - Driver de MySQL para Node.js

### PASO 2: Crear Archivo de Variables de Entorno

**Archivo creado:** `.env` (raíz del proyecto)

```env
# Configuración de Base de Datos MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=nestjs_db
```

**Configuración actual:**
- **Host:** localhost:3306
- **Usuario:** root
- **Contraseña:** 1234
- **Base de datos:** nestjs_db

**⚠️ Importante:** Las variables usan prefijo `DB_` para evitar conflictos con variables del sistema Windows

**Nota:** Este archivo contiene información sensible y debe estar en `.gitignore`

### PASO 3: Configurar TypeORM en app.module.ts

**Archivo modificado:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { PinturaModule } from './pintura/pintura.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,}),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'nestjs_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // ¡Solo para desarrollo! Desactivar en producción
    }),
    PinturaModule,
    UsuarioModule,
  ],

  controllers: [AppController, ProductsController],
  providers: [AppService, ProductsService],
})
export class AppModule {}
```

### Explicación de la Configuración

| Propiedad | Descripción | Valor Configurado |
|-----------|-------------|-------------------|
| `type` | Tipo de base de datos (mysql, postgres, sqlite, etc.) | `mysql` |
| `host` | Dirección del servidor de base de datos | `localhost` |
| `port` | Puerto de conexión (por defecto MySQL usa 3306) | `3306` |
| `username` | Usuario de la base de datos | `root` |
| `password` | Contraseña del usuario | `1234` |
| `database` | Nombre de la base de datos | `nestjs_db` |
| `entities` | Array de entidades que TypeORM debe cargar | `**/*.entity{.ts,.js}` |
| `synchronize` | Si es `true`, sincroniza automáticamente el esquema de BD con las entidades (⚠️ solo en desarrollo) | `true` |

### Variables de Entorno

Las variables de entorno se cargan gracias a `@nestjs/config`:

```typescript
ConfigModule.forRoot({isGlobal: true})
```

Esto permite acceder a las variables del archivo `.env` mediante `process.env.NOMBRE_VARIABLE`

**Variables utilizadas:**
- `DB_HOST` - Host de la base de datos
- `DB_PORT` - Puerto de MySQL
- `DB_USER` - Usuario de la base de datos
- `DB_PASSWORD` - Contraseña
- `DB_NAME` - Nombre de la base de datos

### ⚠️ Advertencias Importantes

1. **synchronize: true** - Solo usar en desarrollo. En producción puede causar pérdida de datos.
2. **Archivo .env** - Nunca subir a Git. Asegurarse de que esté en `.gitignore`
3. **Valores por defecto** - El código incluye valores por defecto para evitar errores si falta el archivo .env

### Verificar la Conexión

Una vez configurado todo, cuando arranques NEST verás si ha funcionado bien o hay fallo de conexión:

```bash
npm run start:dev
```

**✅ Conexión verificada exitosamente:**
- TypeORM conectado a MySQL Workbench
- Base de datos: `nestjs_db`
- Servidor corriendo en `http://localhost:3000`

### Archivos Creados/Modificados

**Archivos nuevos:**
- `.env` - Variables de entorno configuradas con MySQL local (root:1234)

**Archivos modificados:**
- `src/app.module.ts` - Configuración de TypeORM con valores por defecto
- `src/main.ts` - Puerto configurado a 3000
- `package.json` - Nuevas dependencias agregadas

**Comandos ejecutados:**
```bash
npm install @nestjs/typeorm typeorm mysql2
```

---

## Recurso Usuario con TypeORM

### Creación del Recurso Usuario

**Estructura creada:**
```
src/usuario/
├── dto/
│   ├── create-usuario.dto.ts
│   └── update-usuario.dto.ts
├── entities/
│   └── usuario.entity.ts
├── usuario.controller.ts
├── usuario.service.ts
└── usuario.module.ts
```

### Entidad Usuario

**Archivo:** `src/usuario/entities/usuario.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
```

### Decoradores de TypeORM

| Decorador | Descripción |
|-----------|-------------|
| `@Entity()` | Define la clase como una entidad de base de datos |
| `@PrimaryGeneratedColumn()` | Clave primaria autoincremental |
| `@Column()` | Define una columna en la tabla |
| `@Column({ unique: true })` | Columna con restricción de unicidad |
| `@Column({ default: value })` | Columna con valor por defecto |
| `@CreateDateColumn()` | Fecha de creación automática |
| `@UpdateDateColumn()` | Fecha de actualización automática |

### DTOs (Data Transfer Objects)

**CreateUsuarioDto:**
```typescript
export class CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  activo?: boolean;
}
```

**UpdateUsuarioDto:**
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
```

`PartialType` hace que todas las propiedades sean opcionales para actualizaciones parciales.

### Servicio Usuario

**Archivo:** `src/usuario/usuario.service.ts`

El servicio usa el patrón Repository de TypeORM:

```typescript
@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  create(createUsuarioDto: CreateUsuarioDto) {
    const usuario = this.usuarioRepository.create(createUsuarioDto);
    return this.usuarioRepository.save(usuario);
  }

  findAll() {
    return this.usuarioRepository.find();
  }

  findOne(id: number) {
    return this.usuarioRepository.findOneBy({ id });
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.usuarioRepository.delete(id);
    return { deleted: true };
  }
}
```

### Módulo Usuario

**Archivo:** `src/usuario/usuario.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
```

**Importante:** `TypeOrmModule.forFeature([Usuario])` registra la entidad en el módulo.

### Endpoints REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuario` | Obtener todos los usuarios |
| GET | `/usuario/:id` | Obtener un usuario por ID |
| POST | `/usuario` | Crear nuevo usuario |
| PATCH | `/usuario/:id` | Actualización parcial |
| PUT | `/usuario/:id` | Actualización completa |
| DELETE | `/usuario/:id` | Eliminar usuario |

### Probar con MySQL Workbench

Una vez que arranques el servidor (`npm run start:dev`), TypeORM creará automáticamente la tabla `usuario` en la base de datos `nestjs_db` con la siguiente estructura:

```sql
CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  activo TINYINT DEFAULT 1,
  fechaCreacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  fechaActualizacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);
```

### Archivos Modificados

**Archivos nuevos:**
- `src/usuario/` - Módulo completo de Usuario
- `src/usuario/entities/usuario.entity.ts` - Entidad con decoradores TypeORM
- `src/usuario/dto/` - DTOs para validación
- `src/usuario/usuario.service.ts` - Lógica de negocio con Repository
- `src/usuario/usuario.controller.ts` - Endpoints REST
- `src/usuario/usuario.module.ts` - Módulo con TypeORM.forFeature

**Archivos modificados:**
- `src/app.module.ts` - Importado UsuarioModule
- `src/main.ts` - Puerto configurado a 4000
- `.env` - Variables con prefijo DB_ para evitar conflictos con variables del sistema Windows

### Métodos Adicionales del Servicio Usuario

**UsuarioService incluye:**

```typescript
async findByEmail(email: string): Promise<Usuario> {
  const usuario = await this.usuarioRepository.findOne({ where: { email } });
  if (!usuario) {
    throw new NotFoundException(`Usuario con email ${email} no encontrado`);
  }
  return usuario;
}

async activateUser(id: number): Promise<Usuario> {
  const usuario = await this.findOne(id);
  usuario.activo = true;
  return this.usuarioRepository.save(usuario);
}

async deactivateUser(id: number): Promise<Usuario> {
  const usuario = await this.findOne(id);
  usuario.activo = false;
  return this.usuarioRepository.save(usuario);
}
```

### Endpoints Completos REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuario` | Obtener todos los usuarios |
| GET | `/usuario/:id` | Obtener un usuario por ID |
| GET | `/usuario/email/:email` | **Buscar usuario por email** |
| POST | `/usuario` | Crear nuevo usuario |
| PATCH | `/usuario/:id` | Actualización parcial |
| PUT | `/usuario/:id` | Actualización completa |
| PUT | `/usuario/:id/activate` | **Activar usuario** |
| PUT | `/usuario/:id/deactivate` | **Desactivar usuario** |
| DELETE | `/usuario/:id` | Eliminar usuario (HTTP 204) |

### Variables de Entorno (.env)

**⚠️ Importante:** Las variables usan prefijo `DB_` para evitar conflictos con variables del sistema Windows (`username`, `port`, etc.)

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=nestjs_db
```

### Configuración del Servidor

**Puerto:** 3000
**URL:** http://localhost:3000

---

**Proyecto:** NestJS API REST - Gestión de Pinturas  
**Fecha:** 16 de febrero de 2026

