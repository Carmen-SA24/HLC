import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    // Si la base de datos no responde, muestra mensaje personalizado
    if (exception.message && exception.message.includes('ECONNREFUSED')) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'La base de datos no está disponible. Espera unos segundos e intenta de nuevo.';
    }

    // Si el backend está iniciando o hay problemas de conexión
    else if (exception.message && exception.message.includes('connect')) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'El backend está iniciando. Por favor, espera un momento.';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.name || 'InternalError',
    });
  }
}
