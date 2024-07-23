import { Module } from '@nestjs/common';
import { BookService } from '../service/book.service';
import { BookController } from '../controller/book.controller';
import { BookListener } from '../controller/book.listener';

@Module({
  imports: [],
  providers: [BookService],
  controllers: [BookController, BookListener],
})
export class BookModule {}
