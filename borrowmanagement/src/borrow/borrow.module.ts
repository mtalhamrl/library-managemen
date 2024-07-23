import { Module } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowController } from './borrow.controller';
import { Neo4jModule } from 'nest-neo4j';
import { KafkaModule } from '../kafka/kafka.module'; // Kafka modülünü dahil ediyoruz

@Module({
  imports: [
    Neo4jModule,
    KafkaModule, // Kafka modülünü buraya dahil ediyoruz
  ],
  providers: [BorrowService],
  controllers: [BorrowController],
})
export class BorrowModule {}
