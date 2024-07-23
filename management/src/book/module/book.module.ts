import { Module } from '@nestjs/common';
import { BookService } from '../service/book.service';
import { BookController } from '../controller/book.controller';
import { BookListener } from '../controller/book.listener';
import { Neo4jModule } from 'nest-neo4j/dist';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [Neo4jModule, KafkaModule],
  providers: [BookService],
  controllers: [BookController, BookListener],
})
export class BookModule {}
