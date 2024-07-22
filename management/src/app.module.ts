import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/module/book.module';
import { Neo4jDatabaseModule } from './neo4j/neo4j.module';
import { CategoryModule } from './category/category.module';
import { BlockModule } from './block/block.module';
import { FloorModule } from './floor/floor.module';
import { BookshelfModule } from './bookshelf/bookshelf.module';
import { ShelfModule } from './shelf/shelf.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    KafkaModule,
    BookModule,
    Neo4jDatabaseModule,
    CategoryModule,
    BlockModule,
    FloorModule,
    BookshelfModule,
    ShelfModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
