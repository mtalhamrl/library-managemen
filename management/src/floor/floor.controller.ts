import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FloorService } from './floor.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { DeleteFloorDto } from './dto/delete-floor.dto';

@Controller('floor')
export class FloorController {
  constructor(private readonly floorService: FloorService) {}

  @Post()
  create(@Body() createFloorDto: CreateFloorDto) {
    return this.floorService.create(createFloorDto);
  }

  @Get()
  findAll() {
    return this.floorService.findAll();
  }

  @Delete()
  delete(@Body() deleteFloorDto: DeleteFloorDto) {
    return this.floorService.delete(deleteFloorDto);
  }

  @Get(':floorNumber/bookshelves')
  findBookshelvesInFloor(@Param('floorNumber') floorNumber: number) {
    return this.floorService.findBookshelvesInFloor(floorNumber);
  }
}
