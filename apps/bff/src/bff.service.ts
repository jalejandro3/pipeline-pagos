import { Injectable } from '@nestjs/common';

@Injectable()
export class BffService {
  getHello(): string {
    return 'Hello World!';
  }
}
