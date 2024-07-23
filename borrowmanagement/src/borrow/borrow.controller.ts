import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { CreateBorrowDto } from './dto/create-borrow.dto';

@Controller('borrows')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Post()
  create(@Body() createBorrowDto: CreateBorrowDto) {
    return this.borrowService.create(createBorrowDto);
  }

  @Get()
  findAll() {
    return this.borrowService.findAll();
  }

  @Get(':title')
  findOne(@Param('title') title: string) {
    return this.borrowService.findOne(title);
  }

  @Delete(':title')
  delete(@Param('title') title: string) {
    return this.borrowService.delete(title);
  }
}
