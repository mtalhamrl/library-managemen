import { Module } from '@nestjs/common';
import { BookshelfService } from './bookshelf.service';
import { BookshelfController } from './bookshelf.controller';

@Module({
  controllers: [BookshelfController],
  providers: [BookshelfService],
})
export class BookshelfModule {}
