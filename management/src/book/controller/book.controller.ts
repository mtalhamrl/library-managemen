import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { BookService } from '../service/book.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { DeleteBookDto } from '../dto/delete-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  create(@Body() CreateBookDto: CreateBookDto) {
    return this.bookService.create(CreateBookDto);
  }

  @Get()
  findAll() {
    return this.bookService.findAll();
  }

  @Delete()
  delete(@Body() deleteBookDto: DeleteBookDto) {
    return this.bookService.delete(deleteBookDto);
  }

  @Get(':title/details')
  findBookDetails(@Param('title') title: string) {
    return this.bookService.findBookDetails(title);
  }
  @Put('update-category')
  updateBookCategory(@Body() updateBookDto: UpdateBookDto) {
    return this.bookService.updateBookCategory(updateBookDto);
  }
}
