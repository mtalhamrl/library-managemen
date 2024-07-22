import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { BookshelfService } from './bookshelf.service';
import { CreateBookshelfDto } from './dto/create-bookshelf.dto';
import { DeleteBookshelfDto } from './dto/delete-bookshelf.dto';

@Controller('bookshelves')
export class BookshelfController {
  constructor(private readonly bookshelfService: BookshelfService) {}

  @Post()
  create(@Body() createBookshelfDto: CreateBookshelfDto) {
    return this.bookshelfService.create(createBookshelfDto);
  }

  @Delete()
  delete(@Body() deleteBookshelfDto: DeleteBookshelfDto) {
    return this.bookshelfService.delete(deleteBookshelfDto);
  }

  @Get()
  findAll() {
    return this.bookshelfService.findAll();
  }

  @Get(':bookshelfName/shelves')
  findShelvesInBookshelf(@Param('bookshelfName') bookshelfName: string) {
    return this.bookshelfService.findShelvesInBookshelf(bookshelfName);
  }
}
