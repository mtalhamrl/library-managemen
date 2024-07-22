import { Module } from '@nestjs/common';
import { ShelfService } from './shelf.service';
import { ShelfController } from './shelf.controller';

@Module({
  controllers: [ShelfController],
  providers: [ShelfService],
})
export class ShelfModule {}
