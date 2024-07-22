import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DeleteCategoryDto } from './dto/delete-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Delete()
  delete(@Body() deleteCategoryDto: DeleteCategoryDto) {
    return this.categoryService.delete(deleteCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':categoryName/books')
  findBooksInCategory(@Param('categoryName') categoryName: string) {
    return this.categoryService.findBooksInCategory(categoryName);
  }
}
