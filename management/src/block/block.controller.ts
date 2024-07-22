import { Body, Controller, Post, Delete, Get, Param } from '@nestjs/common';
import { BlockService } from './block.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { DeleteBlockDto } from './dto/delete-block.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post()
  create(@Body() createBlockDto: CreateBlockDto) {
    return this.blockService.create(createBlockDto);
  }

  @Delete()
  delete(@Body() deleteBlockDto: DeleteBlockDto) {
    return this.blockService.delete(deleteBlockDto);
  }

  @Get()
  findAll() {
    return this.blockService.findAll();
  }

  @Get(':blockCode/floors')
  findFloorsInBlock(@Param('blockCode') blockCode: string) {
    return this.blockService.findFloorsInBlock(blockCode);
  }
}
