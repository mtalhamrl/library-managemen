import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ShelfService } from './shelf.service';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { DeleteShelfDto } from './dto/delete-shelf.dto';

@Controller('shelf')
export class ShelfController {
  constructor(private readonly shelfService: ShelfService) {}

  @Post()
  create(@Body() createShelfDto: CreateShelfDto) {
    return this.shelfService.create(createShelfDto);
  }

  @Delete()
  delete(@Body() deleteShelfDto: DeleteShelfDto) {
    return this.shelfService.delete(deleteShelfDto);
  }

  @Get()
  findAll() {
    return this.shelfService.findAll();
  }

  @Get(':shelfName/books')
  findBooksInShelf(@Param('shelfName') shelfName: string) {
    return this.shelfService.findBooksInShelf(shelfName);
  }
}
